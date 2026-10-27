#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Öğrenci CAT Tool - Modern Web Tabanlı Bilgisayar Destekli Çeviri Aracı
- Otomatik Video Ses Ayıklama Motoru (FFmpeg tabanlı, 1 saniyeden kısa sürede)
- Akıllı Ses Enerjisi / VAD Konuşma Ayrıştırma ve Zaman Damgalama (SRT)
- Google Gemini AI / Cloud STT Ücretsiz Transkripsiyon Entegrasyonu
- Tailwind CSS & Modern Bento Grid Mimarisi
"""

import sys
import os
import re
import json
import uuid
import wave
import math
import struct
import base64
import subprocess
import urllib.parse
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
import webbrowser
import threading
import io
import zipfile
import shutil
import xml.etree.ElementTree as ET

try:
    import pypdf
except Exception:
    pypdf = None

try:
    import docx
except Exception:
    docx = None


if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXTRACTED_AUDIO_DIR = os.path.join(BASE_DIR, "extracted_audio")
os.makedirs(EXTRACTED_AUDIO_DIR, exist_ok=True)

# FFmpeg yolunu dinamik olarak tespit et
FFMPEG_EXE = "ffmpeg"
try:
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    pass


def get_html_content():
    html_path = os.path.join(BASE_DIR, "index.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>index.html bulunamadı</h1>"


def format_srt_time(sec):
    s = max(0.0, float(sec))
    m, s = divmod(s, 60)
    h, m = divmod(m, 60)
    ms = int(round((s - int(s)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{ms:03d}"


def detect_voice_segments(wav_path, min_speech_sec=1.2, max_speech_sec=6.5, silence_threshold_ratio=0.18):
    """
    WAV ses dosyasındaki konuşma aralıklarını ve zaman damgalarını (VAD) tespit eder.
    Her segment için [start_sec, end_sec] aralıkları döndürür.
    """
    try:
        with wave.open(wav_path, 'rb') as w:
            nframes = w.getnframes()
            rate = w.getframerate()
            data = w.readframes(nframes)
            total_dur = nframes / rate
            samples = struct.unpack(f'<{nframes}h', data)
    except Exception as e:
        print(f"[!] WAV okuma hatası: {e}")
        return [(1.0, 5.0)]

    chunk_dur = 0.1  # 100ms
    chunk_size = int(rate * chunk_dur)
    energies = []

    for i in range(0, len(samples), chunk_size):
        chunk = samples[i:i + chunk_size]
        if not chunk:
            continue
        rms = math.sqrt(sum(s * s for s in chunk) / len(chunk))
        energies.append(rms)

    if not energies:
        return [(1.0, min(5.0, total_dur))]

    max_e = max(energies)
    threshold = max(400, max_e * silence_threshold_ratio)

    segments = []
    in_speech = False
    start_sec = 0.0
    silence_count = 0

    for idx, e in enumerate(energies):
        t = idx * chunk_dur
        is_speech = e > threshold
        if is_speech:
            if not in_speech:
                in_speech = True
                start_sec = max(0.0, round(t - 0.2, 2))
            silence_count = 0
        else:
            if in_speech:
                silence_count += 1
                if silence_count > 3 or (t - start_sec) >= max_speech_sec:
                    end_sec = round(t - 0.1, 2)
                    if end_sec - start_sec >= min_speech_sec:
                        segments.append((start_sec, end_sec))
                    in_speech = False
                    silence_count = 0

    if in_speech and (total_dur - start_sec) >= min_speech_sec:
        segments.append((start_sec, round(total_dur, 2)))

    # Eğer çok az veya hiç ses bulunamadıysa akıllı fallback üret
    if not segments:
        cur = 1.0
        while cur < total_dur - 1.5 and len(segments) < 30:
            seg_len = min(4.5, total_dur - cur - 0.5)
            segments.append((round(cur, 2), round(cur + seg_len, 2)))
            cur += seg_len + 1.0

    return segments


def transcribe_audio_with_gemini(wav_path, api_key, lang_code="en"):
    """
    Google Gemini Multimodal API kullanarak ses dosyasını doğrudan transkribe eder ve
    zaman damgalı SRT blokları halinde metni döndürür.
    """
    if not api_key:
        return None

    try:
        with open(wav_path, "rb") as f:
            wav_bytes = f.read()

        # Gemini inline payload için dosya boyutunu güvenli tut (en fazla ilk 18MB)
        if len(wav_bytes) > 18 * 1024 * 1024:
            wav_bytes = wav_bytes[:18 * 1024 * 1024]

        base64_audio = base64.b64encode(wav_bytes).decode('utf-8')
        lang_note = "Türkçe" if lang_code.startswith("tr") else "English"

        prompt = f"""Sen profesyonel bir konuşma tanıma ve altyazı çıkarma (ASR / Subtitle) uzmanısın.
GÖREV: Bu ses dosyasındaki konuşmaları baştan sona dinle ve konuşmacının söylediği ORİJİNAL kelimeleri BİREBİR (verbatim) olarak {lang_note} dilinde SRT formatında transkribe et.

KESİN VE TAVİZSİZ KURALLAR:
1. ASLA VE KESİNLİKLE ÇEVİRİ/TERCÜME YAPMA! Orijinal konuşma dilinde kelimesi kelimesine yaz.
2. ZAMANLAMA VE SESSİZLİKLERİ KORUMA (ÇOK ÖNEMLİ): Her altyazı bloğunun başlangıç zamanı (startTime), konuşmacının sesi tam olarak ne zaman başlıyorsa o saniyede olmalıdır. Örneğin bir konuşma 00:00:12,000'de bitti ve sıradaki konuşma 00:00:17,000'de başlıyorsa; sıradaki altyazının başlangıcını ASLA 00:00:12 yapma! Mutlaka konuşmanın başladığı 00:00:17,000 olarak yaz. İki konuşma arasındaki sessizliklerde altyazı olmamalıdır.
3. SADECE standart SRT formatı üret (Sıra No, 00:00:00,000 --> 00:00:00,000, Metin).
4. Açıklama veya markdown (```srt) ekleme, doğrudan saf SRT çıktısı ver."""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inlineData": {"mimeType": "audio/wav", "data": base64_audio}}
                ]
            }],
            "generationConfig": {"temperature": 0.1}
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return text
    except Exception as e:
        print(f"[!] Gemini Transkripsiyon Hatası: {e}")
        return None


def parse_srt_string(srt_text):
    """
    SRT bloklarını doğal cümle/paragraf bazlı CAT segmentlerine dönüştürür.
    Parçalanmış altyazı satırlarını dilbilgisel tam cümleler halinde birleştirir,
    cümlenin başlangıç ve bitiş zaman damgalarını korur.
    """
    raw_blocks = []
    blocks = re.split(r'\n\s*\n', srt_text.strip())
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if len(lines) >= 2:
            time_line = lines[1] if '-->' in lines[1] else (lines[0] if '-->' in lines[0] else '')
            if '-->' in time_line:
                parts = time_line.split('-->')
                st = parts[0].strip()
                et = parts[1].strip()
                text_lines = lines[2:] if time_line == lines[1] else lines[1:]
                txt = " ".join(text_lines).strip()
                if txt:
                    raw_blocks.append({"start": st, "end": et, "text": txt})

    if not raw_blocks:
        return []

    # Doğal Cümle Bazlı Segment Birleştirme Motoru
    natural_segments = []
    current_sentence = ""
    sentence_start = None
    sentence_end = None

    for i, item in enumerate(raw_blocks):
        if sentence_start is None:
            sentence_start = item["start"]
        sentence_end = item["end"]

        if current_sentence:
            current_sentence += " " + item["text"]
        else:
            current_sentence = item["text"]

        has_punct = bool(re.search(r'[.?!]$', current_sentence.strip()))
        is_long = len(current_sentence) > 160

        if has_punct or is_long or i == len(raw_blocks) - 1:
            clean_text = re.sub(r'^\s+', '', current_sentence.strip())
            clean_text = re.sub(r'\s{2,}', ' ', clean_text)
            if clean_text:
                natural_segments.append({
                    "id": len(natural_segments) + 1,
                    "source": clean_text,
                    "target": "",
                    "startTime": sentence_start,
                    "endTime": sentence_end,
                    "status": "empty"
                })
            current_sentence = ""
            sentence_start = None
            sentence_end = None

    return natural_segments


# PyAV 14+ / faster-whisper uyumluluk yaması (metadata_errors hatasını önler)
try:
    import av
    _orig_av_open = av.open
    def _safe_av_open(*args, **kwargs):
        kwargs.pop('metadata_errors', None)
        return _orig_av_open(*args, **kwargs)
    av.open = _safe_av_open
except Exception:
    pass

import numpy as np

_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        try:
            print("[*] faster-whisper 'small' modeli (CPU, int8) yükleniyor...")
            _whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
            print("[✓] faster-whisper 'small' modeli hazır.")
        except Exception as e:
            print(f"[!] 'small' modeli yüklenemedi: {e}. Yedek olarak 'tiny' modeli başlatılıyor...")
            _whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
    return _whisper_model


def transcribe_and_segment_audio(wav_path):
    """
    faster-whisper kütüphanesini (WhisperModel("small", device="cpu", compute_type="int8"))
    kullanarak ses dosyasını transkribe eder ve kelime bazlı zaman damgalarını (word_timestamps=True) alır.
    Konuşmayı noktalama işaretine (. ? ! ,) ve maksimum 42 karakter / 7 saniye kuralına göre
    anlamlı cümle halinde otomatik segmente eder.
    Her segment { id, start, end, sourceText, targetText } formatında JSON olarak döner.
    """
    try:
        model = get_whisper_model()

        # Doğrudan 16kHz float32 numpy array olarak yükle (PyAV uyumsuzluklarını tamamen çözer)
        audio_input = wav_path
        try:
            with wave.open(wav_path, 'rb') as w:
                n_frames = w.getnframes()
                frame_rate = w.getframerate()
                raw_data = w.readframes(n_frames)
                if frame_rate == 16000 and w.getsampwidth() == 2:
                    audio_input = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
        except Exception as e_wav:
            print(f"[!] Doğrudan wave okuma uyarısı: {e_wav}, dosya yolundan devam edilecek")
            audio_input = wav_path

        # faster-whisper transkripsiyonu: vad_filter=True, word_timestamps=True
        segments_gen, info = model.transcribe(audio_input, vad_filter=True, word_timestamps=True)

        all_words = []
        for s in segments_gen:
            if getattr(s, 'words', None) and s.words:
                for w in s.words:
                    w_txt = (w.word or "").strip()
                    if w_txt:
                        all_words.append({
                            "word": w_txt,
                            "start": float(w.start),
                            "end": float(w.end)
                        })
            elif s.text and s.text.strip():
                # Kelime zaman damgası gelmezse cümle bloğunu kelimelere oransal yay
                words_in_s = s.text.strip().split()
                if words_in_s:
                    seg_dur = max(0.1, float(s.end) - float(s.start))
                    word_dur = seg_dur / len(words_in_s)
                    for wIdx, w_txt in enumerate(words_in_s):
                        w_st = float(s.start) + (wIdx * word_dur)
                        w_en = w_st + word_dur
                        all_words.append({
                            "word": w_txt,
                            "start": round(w_st, 3),
                            "end": round(w_en, 3)
                        })

        # Eğer VAD arka plan müziği/gürültüsü nedeniyle diyaloğu filtrelediyse, tüm konuşmaları kurtar
        if len(all_words) < 5:
            try:
                segments_gen_full, _ = model.transcribe(audio_input, vad_filter=False, word_timestamps=True)
                words_retry = []
                for s in segments_gen_full:
                    if getattr(s, 'words', None) and s.words:
                        for w in s.words:
                            w_txt = (w.word or "").strip()
                            if w_txt:
                                words_retry.append({"word": w_txt, "start": float(w.start), "end": float(w.end)})
                    elif s.text and s.text.strip():
                        words_in_s = s.text.strip().split()
                        if words_in_s:
                            seg_dur = max(0.1, float(s.end) - float(s.start))
                            word_dur = seg_dur / len(words_in_s)
                            for wIdx, w_txt in enumerate(words_in_s):
                                words_retry.append({
                                    "word": w_txt,
                                    "start": round(float(s.start) + (wIdx * word_dur), 3),
                                    "end": round(float(s.start) + ((wIdx + 1) * word_dur), 3)
                                })
                if len(words_retry) > len(all_words):
                    all_words = words_retry
            except Exception as e_retry:
                print(f"[!] VAD fallback uyarısı: {e_retry}")

        if not all_words:
            print("[!] faster-whisper transkripsiyonda ses/konuşma tespit edemedi.")
            return []

        result_segments = []
        current_words = []
        seg_start = None
        seg_end = None

        for i, item in enumerate(all_words):
            if seg_start is None:
                seg_start = item["start"]
            seg_end = item["end"]
            current_words.append(item["word"])

            current_text = " ".join(current_words).strip()
            current_dur = seg_end - seg_start

            # Noktalama işareti kontrolü (. ? ! ,)
            ends_with_punct = bool(re.search(r'[.?!,]$', item["word"]))

            # Maksimum 42 karakter / 7 saniye kuralı
            exceeds_42_chars = len(current_text) >= 42
            exceeds_7_sec = current_dur >= 7.0

            next_will_overflow_chars = False
            if i + 1 < len(all_words):
                next_len = len(current_text) + 1 + len(all_words[i + 1]["word"])
                if next_len > 42:
                    next_will_overflow_chars = True

            is_last = (i == len(all_words) - 1)

            if ends_with_punct or exceeds_42_chars or exceeds_7_sec or next_will_overflow_chars or is_last:
                if current_text:
                    st_val = round(seg_start, 3)
                    en_val = round(seg_end, 3)
                    dur_val = round(max(0.1, en_val - st_val), 2)
                    result_segments.append({
                        "id": len(result_segments) + 1,
                        "start": st_val,
                        "end": en_val,
                        "sourceText": current_text,
                        "targetText": "",
                        # Geriye dönük uyumluluk alanları
                        "source": current_text,
                        "target": "",
                        "startTime": format_srt_time(st_val),
                        "endTime": format_srt_time(en_val),
                        "durationSec": dur_val,
                        "status": "empty"
                    })
                current_words = []
                seg_start = None
                seg_end = None

        print(f"[✓] faster-whisper transkripsiyonu tamamlandı: {len(result_segments)} segment oluşturuldu.")
        return result_segments
    except Exception as e:
        print(f"[!] faster-whisper transkripsiyon hatası: {e}")
        return []


def transcribe_with_local_whisper(wav_path):
    return transcribe_and_segment_audio(wav_path)

def detect_text_lang(text):
    if not text:
        return "en"
    clean = text.lower()
    tr_chars = len(re.findall(r'[çğıöşüÇĞİÖŞÜ]', text))
    tr_words = len(re.findall(r'\b(ve|bir|bu|ile|icin|için|de|da|dahi|ama|fakat|veya|ancak|gibi|olan|olarak|eden|gore|göre|daha|cok|çok|en|var|yok|kadar|sonra|once|önce|tum|tüm|her|kendi|neden|nasil|nasıl|cunku|çünkü|ise|bunu|buna|bunun|rehber|rehberi|metin|ceviri|çeviri|toplumsal|cinsiyet|cinsiyete)\b', clean))
    tr_score = tr_chars * 2 + tr_words * 3
    en_words = len(re.findall(r'\b(the|and|is|are|in|at|which|on|for|with|as|by|from|this|that|these|those|an|be|to|of|or|not|it|its|they|we|you)\b', clean)) * 2
    if tr_score > en_words and tr_score >= 2:
        return "tr"
    if en_words > 0:
        return "en"
    return "tr" if tr_chars > 0 else "en"


def get_lang_full_name(code):
    c = (code or "en").lower()
    if c.startswith("tr"): return "Türkçe"
    if c.startswith("en"): return "İngilizce"
    if c.startswith("de"): return "Almanca"
    if c.startswith("fr"): return "Fransızca"
    if c.startswith("es"): return "İspanyolca"
    if c.startswith("it"): return "İtalyanca"
    if c.startswith("ru"): return "Rusça"
    if c.startswith("ar"): return "Arapça"
    if c.startswith("zh"): return "Çince"
    if c.startswith("ja"): return "Japonca"
    return code


class BentoCATServerHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="text/html; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-File-Name, X-Gemini-Key, X-Source-Lang")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200, "text/plain")

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. Hızlı Ses Ayıklayıcı: Videoyu doğrudan 16kHz Mono WAV dosyasına dönüştürüp döndürür (0.5 saniye!)
        if path in ["/api/extract_audio", "/api/convert_to_wav"]:
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                file_name = self.headers.get("X-File-Name", "video.mp4")
                ext = os.path.splitext(file_name)[1] or ".mp4"
                unique_id = uuid.uuid4().hex[:8]
                tmp_video_path = os.path.join(EXTRACTED_AUDIO_DIR, f"temp_{unique_id}{ext}")
                extracted_wav_path = os.path.join(EXTRACTED_AUDIO_DIR, f"audio_{unique_id}.wav")

                remaining = content_len
                with open(tmp_video_path, "wb") as f_out:
                    while remaining > 0:
                        chunk_size = min(remaining, 64 * 1024)
                        chunk = self.rfile.read(chunk_size)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        remaining -= len(chunk)

                ffmpeg_cmd = [
                    FFMPEG_EXE, "-y",
                    "-i", tmp_video_path,
                    "-vn",
                    "-acodec", "pcm_s16le",
                    "-ar", "16000",
                    "-ac", "1",
                    extracted_wav_path
                ]
                subprocess.run(ffmpeg_cmd, capture_output=True, check=True)

                if os.path.exists(tmp_video_path):
                    try:
                        os.remove(tmp_video_path)
                    except Exception:
                        pass

                if os.path.exists(extracted_wav_path):
                    with open(extracted_wav_path, "rb") as f_wav:
                        wav_data = f_wav.read()
                    self._set_headers(200, "audio/wav")
                    self.wfile.write(wav_data)
                    return
                else:
                    self._set_headers(500, "application/json")
                    self.wfile.write(b'{"status":"error","message":"WAV dosyasi uretilemedi"}')
                    return
            except Exception as e:
                print(f"[!] Ses ayiklama hatasi: {e}")
                self._set_headers(500, "application/json")
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
                return

        if path in ["/api/extract_and_transcribe", "/api/upload_video_audio"]:
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                file_name = self.headers.get("X-File-Name", "uploaded_video.mp4")
                gemini_key = self.headers.get("X-Gemini-Key", "").strip()
                source_lang = self.headers.get("X-Source-Lang", "en").strip()

                ext = os.path.splitext(file_name)[1] or ".mp4"
                unique_id = uuid.uuid4().hex[:8]
                tmp_video_path = os.path.join(EXTRACTED_AUDIO_DIR, f"temp_{unique_id}{ext}")
                extracted_wav_path = os.path.join(EXTRACTED_AUDIO_DIR, f"audio_{unique_id}.wav")

                # Gelen video akışını diske akışkan (streaming) kaydet (RAM şişmez)
                remaining = content_len
                with open(tmp_video_path, "wb") as f_out:
                    while remaining > 0:
                        chunk_size = min(remaining, 64 * 1024)
                        chunk = self.rfile.read(chunk_size)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        remaining -= len(chunk)

                # FFmpeg ile videodan sesi 16kHz mono WAV olarak anında ayıkla (1 saniyenin altında!)
                ffmpeg_cmd = [
                    FFMPEG_EXE, "-y",
                    "-i", tmp_video_path,
                    "-vn",
                    "-acodec", "pcm_s16le",
                    "-ar", "16000",
                    "-ac", "1",
                    extracted_wav_path
                ]
                subprocess.run(ffmpeg_cmd, capture_output=True, check=True)

                # Videoyu altyazı gömme işlemi için sakla
                cached_video_name = f"cached_video_{unique_id}{ext}"
                cached_video_path = os.path.join(EXTRACTED_AUDIO_DIR, cached_video_name)
                try:
                    if os.path.exists(tmp_video_path):
                        shutil.copy2(tmp_video_path, cached_video_path)
                        shutil.copy2(tmp_video_path, os.path.join(EXTRACTED_AUDIO_DIR, "latest_video.mp4"))
                        os.remove(tmp_video_path)
                except Exception:
                    pass

                # WAV dosyasından toplam süreyi hesapla
                total_duration = 0.0
                try:
                    with wave.open(extracted_wav_path, 'rb') as w:
                        total_duration = round(w.getnframes() / w.getframerate(), 2)
                except Exception:
                    pass

                # Gemini ile transkripsiyonu dene
                srt_result = None
                if gemini_key:
                    srt_result = transcribe_audio_with_gemini(extracted_wav_path, gemini_key, source_lang)

                segments = []
                # 1. Öncelik: Gemini API (varsa)
                if srt_result and "-->" in srt_result:
                    segments = parse_srt_string(srt_result)

                # 2. Öncelik: Yerel faster-whisper Modeli (WhisperModel("small", device="cpu", compute_type="int8"))
                if not segments:
                    print("[*] Yerel faster-whisper motoru ile gerçek konuşmalar kelime zaman damgalarıyla deşifre ediliyor...")
                    segments = transcribe_and_segment_audio(extracted_wav_path)

                response_payload = {
                    "status": "success",
                    "video_id": cached_video_name,
                    "audio_filename": f"audio_{unique_id}.wav",
                    "audio_url": f"/extracted_audio/audio_{unique_id}.wav",
                    "duration": total_duration,
                    "segments_count": len(segments),
                    "segments": segments
                }

                self._set_headers(200, "application/json; charset=utf-8")
                self.wfile.write(json.dumps(response_payload, ensure_ascii=False).encode("utf-8"))
                return

            except Exception as e:
                print(f"[!] API Hata: {e}")
                self._set_headers(500, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
                return

        # ========================================================
        # ALTYAZILI VİDEO OLUŞTURMA & FORMAT DÖNÜŞTÜRME MOTORU (FFmpeg)
        # ========================================================
        if path == "/api/burn_subtitles_video":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                content_type = self.headers.get("Content-Type", "")
                
                req_format = "mp4"
                font_size = 22
                font_color = "white"
                srt_content = ""
                video_id = ""

                if "application/json" in content_type:
                    raw_body = self.rfile.read(content_len).decode("utf-8")
                    data = json.loads(raw_body)
                    video_id = data.get("videoId", "").strip()
                    srt_content = data.get("srt", "").strip()
                    req_format = data.get("format", "mp4").strip().lower().lstrip(".")
                    font_size = int(data.get("fontSize", 22))
                    font_color = data.get("fontColor", "white").strip().lower()
                else:
                    req_format = self.headers.get("X-Video-Format", "mp4").strip().lower().lstrip(".")
                    video_id = self.headers.get("X-Video-Id", "").strip()
                    font_size = int(self.headers.get("X-Font-Size", 22))
                    raw_body = self.rfile.read(content_len).decode("utf-8", errors="ignore")
                    srt_content = raw_body

                if not req_format:
                    req_format = "mp4"

                # İşlenecek videoyu bul
                in_video_name = None
                if video_id and os.path.exists(os.path.join(EXTRACTED_AUDIO_DIR, video_id)):
                    in_video_name = video_id
                elif os.path.exists(os.path.join(EXTRACTED_AUDIO_DIR, "latest_video.mp4")):
                    in_video_name = "latest_video.mp4"
                else:
                    v_files = [f for f in os.listdir(EXTRACTED_AUDIO_DIR) if f.startswith("cached_video_")]
                    if v_files:
                        in_video_name = v_files[-1]
                    elif os.path.exists(r"C:\Users\Arjin\Downloads\2.mp4"):
                        shutil.copy2(r"C:\Users\Arjin\Downloads\2.mp4", os.path.join(EXTRACTED_AUDIO_DIR, "latest_video.mp4"))
                        in_video_name = "latest_video.mp4"

                if not in_video_name:
                    self._set_headers(400, "application/json; charset=utf-8")
                    self.wfile.write(b'{"status":"error","message":"Islem yapilacak video bulunamadi. Lutfen once bir video yukleyin."}')
                    return

                # Geçici SRT dosyası oluştur
                sub_id = uuid.uuid4().hex[:8]
                srt_filename = f"sub_{sub_id}.srt"
                srt_path = os.path.join(EXTRACTED_AUDIO_DIR, srt_filename)
                with open(srt_path, "w", encoding="utf-8") as f_sub:
                    f_sub.write(srt_content)

                # Renk eşleştirmesi (ASS BGR formatı)
                primary_color = "&H00FFFFFF&" # Beyaz
                if font_color in ["yellow", "#ffeb3b", "sari"]:
                    primary_color = "&H0000FFFF&" # Sarı
                elif font_color in ["cyan", "#00ffff"]:
                    primary_color = "&H00FFFF00&" # Camgöbeği

                out_filename = f"video_subtitled_{sub_id}.{req_format}"
                out_path = os.path.join(EXTRACTED_AUDIO_DIR, out_filename)

                # Seçilen formata göre FFmpeg Video/Ses Codec parametreleri
                extra_args = []
                if req_format == "webm":
                    vcodec = "libvpx-vp9"
                    acodec = "libopus"
                    extra_args = ["-crf", "30", "-b:v", "1500k"]
                elif req_format == "avi":
                    vcodec = "mpeg4"
                    acodec = "mp3"
                    extra_args = ["-qscale:v", "3"]
                elif req_format == "mov":
                    vcodec = "libx264"
                    acodec = "aac"
                    extra_args = ["-preset", "veryfast", "-crf", "22"]
                elif req_format == "mkv":
                    vcodec = "libx264"
                    acodec = "copy"
                    extra_args = ["-preset", "veryfast", "-crf", "22"]
                else: # mp4
                    vcodec = "libx264"
                    acodec = "aac"
                    extra_args = ["-preset", "veryfast", "-crf", "22"]

                sub_filter = f"subtitles={srt_filename}:force_style='FontSize={font_size},PrimaryColour={primary_color},OutlineColour=&H00000000&,BorderStyle=3,Outline=2,Shadow=1,Alignment=2,MarginV=30'"
                burn_cmd = [
                    FFMPEG_EXE, "-y",
                    "-i", in_video_name,
                    "-vf", sub_filter,
                    "-c:v", vcodec,
                    *extra_args,
                    "-c:a", acodec,
                    out_filename
                ]
                print(f"[*] FFmpeg ile altyazi videoya isleniyor ({req_format})...")
                res = subprocess.run(burn_cmd, cwd=EXTRACTED_AUDIO_DIR, capture_output=True, text=True, errors="ignore")

                try:
                    if os.path.exists(srt_path):
                        os.remove(srt_path)
                except Exception:
                    pass

                if res.returncode == 0 and os.path.exists(out_path):
                    file_size_mb = round(os.path.getsize(out_path) / (1024 * 1024), 2)
                    self._set_headers(200, "application/json; charset=utf-8")
                    resp = {
                        "status": "success",
                        "format": req_format,
                        "filename": out_filename,
                        "download_url": f"/extracted_audio/{out_filename}",
                        "file_size_mb": file_size_mb
                    }
                    self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
                    return
                else:
                    print(f"[!] FFmpeg Hatasi: {res.stderr}")
                    self._set_headers(500, "application/json; charset=utf-8")
                    self.wfile.write(json.dumps({"status": "error", "message": res.stderr[:300]}).encode("utf-8"))
                    return

            except Exception as e:
                print(f"[!] Video burn hatasi: {e}")
                self._set_headers(500, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
                return

        # ========================================================
        # SAHNE DEĞİŞİMİ TESPİT MOTORU (SHOT CHANGE / SCENE DETECTION - FFmpeg)
        # ========================================================
        if path == "/api/detect_shot_changes":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                video_id = ""
                threshold = 0.35
                if content_len > 0:
                    raw_body = self.rfile.read(content_len).decode("utf-8", errors="ignore")
                    try:
                        data = json.loads(raw_body)
                        video_id = data.get("videoId", "").strip()
                        threshold = float(data.get("threshold", 0.35))
                    except Exception:
                        pass

                in_video_path = None
                if video_id and os.path.exists(os.path.join(EXTRACTED_AUDIO_DIR, video_id)):
                    in_video_path = os.path.join(EXTRACTED_AUDIO_DIR, video_id)
                elif os.path.exists(os.path.join(EXTRACTED_AUDIO_DIR, "latest_video.mp4")):
                    in_video_path = os.path.join(EXTRACTED_AUDIO_DIR, "latest_video.mp4")
                else:
                    v_files = [f for f in os.listdir(EXTRACTED_AUDIO_DIR) if f.startswith("cached_video_")]
                    if v_files:
                        in_video_path = os.path.join(EXTRACTED_AUDIO_DIR, v_files[-1])

                shot_changes = []
                if in_video_path and os.path.exists(in_video_path):
                    cmd = [
                        FFMPEG_EXE, "-hide_banner", "-nostats", "-i", in_video_path,
                        "-filter:v", f"select='gt(scene,{threshold})',showinfo",
                        "-f", "null", "-"
                    ]
                    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors="ignore")
                    for line in res.stderr.splitlines():
                        if "showinfo" in line and "pts_time:" in line:
                            m = re.search(r"pts_time:([0-9.]+)", line)
                            if m:
                                try:
                                    t = round(float(m.group(1)), 3)
                                    if t not in shot_changes:
                                        shot_changes.append(t)
                                except Exception:
                                    pass

                self._set_headers(200, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({"status": "success", "shotChanges": shot_changes, "count": len(shot_changes)}).encode("utf-8"))
                return
            except Exception as e:
                self._set_headers(500, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({"status": "error", "message": str(e), "shotChanges": []}).encode("utf-8"))
                return

        # ========================================================
        # LOKAL DİSK PERSISTENCE (OTOMATİK KALICI KAYDETME MOTORU)
        # ========================================================
        if path == "/api/save_workspace_state":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len)
                save_file = os.path.join(BASE_DIR, "cat_workspace_autosave.json")
                with open(save_file, "wb") as f:
                    f.write(body)
                self._set_headers(200, "application/json; charset=utf-8")
                self.wfile.write(b'{"status":"success","message":"Lokal diske kaydedildi"}')
                return
            except Exception as e:
                self._set_headers(500, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({"status":"error","message":str(e)}).encode("utf-8"))
                return

        if path == "/api/load_workspace_state":
            save_file = os.path.join(BASE_DIR, "cat_workspace_autosave.json")
            if os.path.exists(save_file):
                self._set_headers(200, "application/json; charset=utf-8")
                with open(save_file, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self._set_headers(404, "application/json; charset=utf-8")
                self.wfile.write(b'{"status":"empty","message":"Kayitli durum bulunamadi"}')
                return

        # ========================================================
        # BELGE METİN AYIKLAMA MOTORU (PDF, DOCX, DOC, RTF, TXT)
        # ========================================================
        if path == "/api/extract_document_text":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                file_name = self.headers.get("X-File-Name", "document.txt")
                try:
                    file_name = urllib.parse.unquote(file_name)
                except Exception:
                    pass

                body = self.rfile.read(content_len)
                ext = file_name.lower().split('.')[-1] if '.' in file_name else 'txt'
                extracted_text = ""

                if ext in ["docx", "doc"]:
                    # 1. python-docx ile dene
                    if docx and ext == "docx":
                        try:
                            d = docx.Document(io.BytesIO(body))
                            paras = [p.text for p in d.paragraphs if p.text.strip()]
                            for table in d.tables:
                                for row in table.rows:
                                    row_text = " \t ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                                    if row_text:
                                        paras.append(row_text)
                            extracted_text = "\n\n".join(paras)
                        except Exception as e_docx:
                            print(f"[!] python-docx hatasi: {e_docx}")

                    # 2. docx zip & xml yedeği
                    if not extracted_text and ext == "docx":
                        try:
                            with zipfile.ZipFile(io.BytesIO(body)) as z:
                                if "word/document.xml" in z.namelist():
                                    xml_content = z.read("word/document.xml")
                                    tree = ET.fromstring(xml_content)
                                    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                                    paras = []
                                    for p in tree.findall('.//w:p', ns):
                                        texts = [t.text for t in p.findall('.//w:t', ns) if t.text]
                                        if texts:
                                            paras.append("".join(texts))
                                    extracted_text = "\n\n".join(paras)
                        except Exception as e_zip:
                            print(f"[!] docx zip extraction hatasi: {e_zip}")

                    # 3. Eski binary .doc desteği (String tarayıcı)
                    if not extracted_text:
                        try:
                            ascii_strings = re.findall(rb'[\x20-\x7E\xC0-\xFF]{4,}', body)
                            chunks = [s.decode('latin-1', errors='ignore') for s in ascii_strings if len(s.strip()) > 3]
                            extracted_text = "\n".join(chunks)
                        except Exception:
                            pass

                elif ext == "pdf":
                    if pypdf:
                        try:
                            reader = pypdf.PdfReader(io.BytesIO(body))
                            pages_text = []
                            for page in reader.pages:
                                t = page.extract_text()
                                if t and t.strip():
                                    pages_text.append(t.strip())
                            extracted_text = "\n\n".join(pages_text)
                        except Exception as e_pdf:
                            print(f"[!] pypdf hatasi: {e_pdf}")

                elif ext == "rtf":
                    try:
                        text_content = body.decode('utf-8', errors='ignore')
                        clean_rtf = re.sub(r'\\[a-z0-9\-]+ ?', '', text_content)
                        clean_rtf = re.sub(r'[{}]', '', clean_rtf)
                        extracted_text = clean_rtf.strip()
                    except Exception:
                        pass
                else:
                    for enc in ["utf-8", "cp1254", "iso-8859-9", "latin-1"]:
                        try:
                            extracted_text = body.decode(enc)
                            break
                        except Exception:
                            continue

                if not extracted_text:
                    extracted_text = body.decode('utf-8', errors='ignore')

                self._set_headers(200, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({
                    "status": "success",
                    "filename": file_name,
                    "format": ext,
                    "text": extracted_text
                }, ensure_ascii=False).encode("utf-8"))
                return
            except Exception as e:
                self._set_headers(500, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
                return

        # ========================================================
        # DEEPL KULLANIM & KOTA BİLGİSİ (/v2/usage PROXY)
        # ========================================================
        if path == "/api/deepl_usage":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
                data = json.loads(body) if body.strip() else {}

                deepl_key = data.get("deeplApiKey", "").strip() or data.get("apiKey", "").strip() or self.headers.get("X-DeepL-Key", "").strip() or os.environ.get("DEEPL_API_KEY", "").strip()
                if not deepl_key:
                    self._set_headers(400, "application/json; charset=utf-8")
                    self.wfile.write(b'{"status":"error","message":"DeepL API anahtari belirtilmedi"}')
                    return

                is_free = deepl_key.endswith(":fx")
                usage_url = "https://api-free.deepl.com/v2/usage" if is_free else "https://api.deepl.com/v2/usage"
                req_usage = urllib.request.Request(
                    usage_url,
                    headers={
                        "Authorization": f"DeepL-Auth-Key {deepl_key}",
                        "User-Agent": "CATTool-MTClient/2.0 (Windows NT 10.0; Win64; x64)"
                    },
                    method="GET"
                )
                with urllib.request.urlopen(req_usage, timeout=8) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    char_count = resp_data.get("character_count", 0)
                    char_limit = resp_data.get("character_limit", 500000)
                    self._set_headers(200, "application/json; charset=utf-8")
                    self.wfile.write(json.dumps({
                        "status": "success",
                        "plan": "Free" if is_free else "Pro",
                        "character_count": char_count,
                        "character_limit": char_limit
                    }, ensure_ascii=False).encode("utf-8"))
                    return
            except urllib.error.HTTPError as he:
                err_text = ""
                try:
                    err_text = he.read().decode("utf-8")
                except Exception:
                    pass
                self._set_headers(he.code, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({
                    "status": "error",
                    "message": f"DeepL API Hatası ({he.code}): {he.reason}. {err_text}"
                }, ensure_ascii=False).encode("utf-8"))
                return
            except Exception as e:
                self._set_headers(500, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
                return

        # ========================================================
        # ÇOK DİLLİ METİN ÇEVİRİ MOTORU (GEMINI AI & MYMEMORY)
        # ========================================================
        if path == "/api/translate":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                data = json.loads(body)

                source_text = data.get("text", "").strip()
                source_lang = data.get("sourceLang", "en").strip().lower()[:2]
                target_lang = data.get("targetLang", "tr").strip().lower()[:2]
                api_key = data.get("apiKey", "").strip() or self.headers.get("X-Gemini-Key", "").strip()
                glossary = data.get("glossary", [])

                if not source_text:
                    self._set_headers(400, "application/json; charset=utf-8")
                    self.wfile.write(b'{"status":"error","message":"Kaynak metin bos olamaz"}')
                    return

                # Akıllı Dil Tespiti ve Yön Düzeltme
                # Eğer kaynak metin projedeki hedef dille (örn. Türkçe) aynı dildeyse,
                # çeviri yönünü tersine çeviriyoruz (örn. TR -> EN), böylece model metni aynen geri vermez.
                detected = detect_text_lang(source_text)
                if detected == target_lang:
                    target_lang = source_lang if source_lang != detected else ("en" if detected == "tr" else "tr")
                    source_lang = detected

                translated_text = ""
                used_provider = ""
                engine = data.get("engine", "").strip().lower()
                deepl_key = data.get("deeplApiKey", "").strip() or data.get("apiKey", "").strip() or self.headers.get("X-DeepL-Key", "").strip() or os.environ.get("DEEPL_API_KEY", "").strip()

                # 0. DeepL Engine (API Anahtarı Varsa veya engine == 'deepl')
                if engine == "deepl" or (deepl_key and not api_key):
                    # DeepL Dil Normalizasyonu (DeepL EN için EN-US/EN-GB, PT için PT-BR/PT-PT zorunlu tutar)
                    dl_target = target_lang.upper()
                    if dl_target == "EN":
                        dl_target = "EN-US"
                    elif dl_target == "PT":
                        dl_target = "PT-BR"

                    dl_source = source_lang.upper() if (source_lang and source_lang.lower() not in ["auto", target_lang.lower()]) else None

                    if deepl_key and len(deepl_key) > 5:
                        try:
                            is_free = deepl_key.endswith(":fx")
                            dl_endpoint = "https://api-free.deepl.com/v2/translate" if is_free else "https://api.deepl.com/v2/translate"
                            
                            dl_payload = {
                                "text": [source_text],
                                "target_lang": dl_target
                            }
                            if dl_source:
                                dl_payload["source_lang"] = dl_source

                            dl_headers = {
                                "Content-Type": "application/json; charset=utf-8",
                                "Authorization": f"DeepL-Auth-Key {deepl_key}",
                                "User-Agent": "CATTool-MTClient/2.0 (Windows NT 10.0; Win64; x64)"
                            }

                            dl_req = urllib.request.Request(
                                dl_endpoint,
                                data=json.dumps(dl_payload).encode("utf-8"),
                                headers=dl_headers,
                                method="POST"
                            )

                            with urllib.request.urlopen(dl_req, timeout=12) as dl_resp:
                                dl_data = json.loads(dl_resp.read().decode("utf-8"))
                                translations = dl_data.get("translations", [])
                                if translations and translations[0].get("text"):
                                    cand_dl = translations[0]["text"].strip()
                                    clean_in = re.sub(r'\s+', ' ', source_text.lower().strip())
                                    clean_out = re.sub(r'\s+', ' ', cand_dl.lower().strip())
                                    if cand_dl and clean_in != clean_out:
                                        translated_text = cand_dl
                                        used_provider = "deepl"
                        except urllib.error.HTTPError as dl_http_err:
                            err_msg = ""
                            try:
                                err_msg = dl_http_err.read().decode("utf-8")
                            except Exception:
                                pass
                            print(f"[!] DeepL API HTTP Hatası ({dl_http_err.code}): {dl_http_err.reason} - {err_msg}")
                            if engine == "deepl":
                                self._set_headers(dl_http_err.code, "application/json; charset=utf-8")
                                self.wfile.write(json.dumps({
                                    "status": "error",
                                    "message": f"DeepL API Hatası ({dl_http_err.code}): {dl_http_err.reason}. {err_msg}"
                                }, ensure_ascii=False).encode("utf-8"))
                                return
                        except Exception as e_dl:
                            print(f"[!] DeepL API Genel Hatası: {e_dl}")
                            if engine == "deepl":
                                self._set_headers(500, "application/json; charset=utf-8")
                                self.wfile.write(json.dumps({
                                    "status": "error",
                                    "message": f"DeepL API bağlantı hatası: {str(e_dl)}"
                                }, ensure_ascii=False).encode("utf-8"))
                                return
                    elif engine == "deepl":
                        self._set_headers(400, "application/json; charset=utf-8")
                        self.wfile.write(json.dumps({
                            "status": "error",
                            "message": "DeepL API anahtarı bulunamadı. Lütfen Ayarlar panelinden DeepL API anahtarınızı girin."
                        }, ensure_ascii=False).encode("utf-8"))
                        return

                # 1. Gemini AI ile Çeviri (API Key varsa ve henüz çevrilmediyse)
                if not translated_text and api_key and len(api_key) > 10 and engine != "deepl":
                    try:
                        sl_name = get_lang_full_name(source_lang)
                        tl_name = get_lang_full_name(target_lang)

                        glossary_rules = ""
                        if glossary:
                            glossary_rules = "\nZorunlu Terim Sözlüğü Kuralları:\n" + "\n".join(f"- {g.get('source','')} -> {g.get('target','')}" for g in glossary)

                        style_guide = data.get("styleGuide", "").strip()
                        style_guide_rules = ""
                        if style_guide:
                            style_guide_rules = (
                                f"\n\nPROJE STİL VE REHBER KILAVUZU (STYLE GUIDE & GUIDELINES):\n"
                                f"Aşağıdaki proje kılavuzu kurallarına harfiyen uy:\n"
                                f"{style_guide}\n"
                            )

                        models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
                        for model_name in models_to_try:
                            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                            payload = {
                                "system_instruction": {
                                    "parts": [{
                                        "text": (
                                            f"Sen profesyonel, kıdemli bir edebi ve teknik mütercim-tercümansın. "
                                            f"Görevin kaynak dildeki ({sl_name}) metni hedef dile ({tl_name}) eksiksiz, doğal, akıcı ve terminolojik açıdan kusursuz biçimde çevirmektir.\n\n"
                                            f"MUTLAK VE KESİN KURALLAR:\n"
                                            f"1. Kaynak metni KESİNLİKLE aynen geri döndürme! Kaynak metin ne olursa olsun hedef dilde ({tl_name}) gerçek ve eksiksiz bir çeviri üret.\n"
                                            f"2. Kaynak metin hedef dille aynı görünse dahi, onu zenginleştir veya alternatif hedef dile aktar; ASLA kaynak metni aynen kopyalayıp verme.\n"
                                            f"3. Çıktıda ASLA 'Kaynak:', 'Hedef:', 'Çeviri:', 'Translation:', tırnak işaretleri, giriş cümleleri veya açıklamalar bulunmamalıdır. YALNIZCA doğrudan {tl_name} çeviri metnini döndür.\n"
                                            f"{glossary_rules}"
                                            f"{style_guide_rules}"
                                        )
                                    }]
                                },
                                "contents": [{
                                    "role": "user",
                                    "parts": [{
                                        "text": f"Çevrilecek Kaynak Metin:\n{source_text}\n\nDoğrudan {tl_name} Çevirisi:"
                                    }]
                                }],
                                "generationConfig": {
                                    "temperature": 0.2,
                                    "maxOutputTokens": 2048
                                }
                            }
                            req = urllib.request.Request(
                                url,
                                data=json.dumps(payload).encode("utf-8"),
                                headers={"Content-Type": "application/json"}
                            )
                            try:
                                with urllib.request.urlopen(req, timeout=12) as resp:
                                    res_data = json.loads(resp.read().decode("utf-8"))
                                    cand = res_data.get("candidates", [])
                                    if cand:
                                        parts = cand[0].get("content", {}).get("parts", [])
                                        if parts:
                                            raw_t = parts[0].get("text", "").strip()
                                            raw_t = re.sub(r'^(çeviri|translation|hedef çeviri|hedef metin):\s*', '', raw_t, flags=re.IGNORECASE)
                                            raw_t = raw_t.strip('"\'«»“”„')
                                            clean_in = re.sub(r'\s+', ' ', source_text.lower().strip())
                                            clean_out = re.sub(r'\s+', ' ', raw_t.lower().strip())
                                            if raw_t and clean_in != clean_out:
                                                translated_text = raw_t
                                                used_provider = f"gemini ({model_name})"
                                                break
                            except Exception as e_mod:
                                print(f"[!] Gemini {model_name} deneme hatasi: {e_mod}")
                                continue
                    except Exception as e_gem:
                        print(f"[!] Gemini Genel Hatası: {e_gem}")

                # 2. MyMemory Çeviri Motoru (Yedek & Ücretsiz)
                if not translated_text:
                    try:
                        mm_url = f"https://api.mymemory.translated.net/get?q={urllib.parse.quote(source_text)}&langpair={source_lang}|{target_lang}"
                        req_mm = urllib.request.Request(mm_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                        with urllib.request.urlopen(req_mm, timeout=8) as resp_mm:
                            mm_data = json.loads(resp_mm.read().decode("utf-8"))
                            mm_cand = mm_data.get("responseData", {}).get("translatedText", "").strip()
                            clean_in = re.sub(r'\s+', ' ', source_text.lower().strip())
                            clean_out = re.sub(r'\s+', ' ', mm_cand.lower().strip())
                            if mm_cand and not mm_cand.startswith("MYMEMORY WARNING") and clean_in != clean_out:
                                translated_text = mm_cand
                                used_provider = "mymemory"
                    except Exception as e_mm:
                        print(f"[!] MyMemory Çeviri Hatası: {e_mm}")

                if not translated_text:
                    self._set_headers(500, "application/json; charset=utf-8")
                    self.wfile.write(json.dumps({"status": "error", "message": "Çeviri motorlarından geçerli çeviri alınamadı."}).encode("utf-8"))
                    return

                self._set_headers(200, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({
                    "status": "success",
                    "translatedText": translated_text,
                    "provider": used_provider
                }, ensure_ascii=False).encode("utf-8"))
                return
            except Exception as e:
                self._set_headers(500, "application/json; charset=utf-8")
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
                return

        self._set_headers(404, "application/json; charset=utf-8")
        self.wfile.write(b'{"status":"error","message":"Endpoint bulunamadi"}')

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path

        if path in ["/", "/landing", "/landing.html"]:
            landing_path = os.path.join(BASE_DIR, "landing.html")
            if os.path.exists(landing_path):
                self._set_headers(200, "text/html; charset=utf-8")
                with open(landing_path, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self._set_headers(200, "text/html; charset=utf-8")
                self.wfile.write(get_html_content().encode("utf-8"))
                return
        elif path in ["/app", "/editor", "/index.html"]:
            self._set_headers(200, "text/html; charset=utf-8")
            self.wfile.write(get_html_content().encode("utf-8"))
            return
        elif path in ["/admin", "/admin.html", "/portal"]:
            admin_path = os.path.join(BASE_DIR, "admin.html")
            if os.path.exists(admin_path):
                self._set_headers(200, "text/html; charset=utf-8")
                with open(admin_path, "rb") as f:
                    self.wfile.write(f.read())
                return

        if path == "/api/load_workspace_state":
            save_file = os.path.join(BASE_DIR, "cat_workspace_autosave.json")
            if os.path.exists(save_file):
                self._set_headers(200, "application/json; charset=utf-8")
                with open(save_file, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self._set_headers(404, "application/json; charset=utf-8")
                self.wfile.write(b'{"status":"empty","message":"Kayitli durum bulunamadi"}')
                return

        # extracted_audio dizinindeki dosyalari uygun MIME ve indirme basliklariyla sun
        if path.startswith("/extracted_audio/"):
            audio_name = os.path.basename(path)
            audio_file = os.path.join(EXTRACTED_AUDIO_DIR, audio_name)
            if os.path.exists(audio_file) and os.path.isfile(audio_file):
                ext = audio_name.lower().split('.')[-1]
                mime_map = {
                    "mp4": "video/mp4",
                    "mkv": "video/x-matroska",
                    "webm": "video/webm",
                    "mov": "video/quicktime",
                    "avi": "video/x-msvideo",
                    "wav": "audio/wav",
                    "srt": "text/plain; charset=utf-8"
                }
                c_type = mime_map.get(ext, "application/octet-stream")
                self.send_response(200)
                self.send_header("Content-Type", c_type)
                self.send_header("Content-Length", str(os.path.getsize(audio_file)))
                self.send_header("Access-Control-Allow-Origin", "*")
                if ext in ["mp4", "mkv", "webm", "mov", "avi"]:
                    self.send_header("Content-Disposition", f'attachment; filename="{audio_name}"')
                self.end_headers()
                with open(audio_file, "rb") as f:
                    shutil.copyfileobj(f, self.wfile)
                return


        # Statik dosyaları sun
        rel_path = path.lstrip("/")
        file_path = os.path.join(BASE_DIR, rel_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            content_type = "application/octet-stream"
            if file_path.endswith(".html"):
                content_type = "text/html; charset=utf-8"
            elif file_path.endswith(".json"):
                content_type = "application/json; charset=utf-8"
            elif file_path.endswith(".js"):
                content_type = "application/javascript; charset=utf-8"
            elif file_path.endswith(".css"):
                content_type = "text/css; charset=utf-8"
            elif file_path.endswith((".png", ".jpg", ".jpeg", ".webp", ".svg")):
                ext = file_path.split(".")[-1].lower()
                content_type = f"image/{'svg+xml' if ext == 'svg' else ext}"
            elif file_path.endswith(".wav"):
                content_type = "audio/wav"

            self._set_headers(200, content_type)
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
            return

        self._set_headers(404, "text/plain; charset=utf-8")
        self.wfile.write(b"404 Not Found")

    def log_message(self, format, *args):
        pass


def open_browser():
    webbrowser.open_new(f"http://localhost:{PORT}")


def run():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, BentoCATServerHandler)
    print("\n" + "=" * 65)
    print("  ÖĞRENCİ CAT TOOL - BENTO GRID & OTOMATİK SES AYIKLAMA SUNUCUSU")
    print(f"  Adres: http://localhost:{PORT}")
    print(f"  FFmpeg: {FFMPEG_EXE}")
    print("=" * 65 + "\n")

    threading.Timer(1.0, open_browser).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Sunucu kapatılıyor...")
        httpd.server_close()


if __name__ == "__main__":
    run()
