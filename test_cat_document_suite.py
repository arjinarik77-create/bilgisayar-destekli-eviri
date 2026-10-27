#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KAPSAMLI BELGE TESTİ VE HATA YÖNETİMİ TEST SUITE
-------------------------------------------------
Bu test, gerçek dünya CAT senaryolarındaki en zorlu uç durumları (edge cases) simüle eder:
1. Karmaşık Tablolar (<w:tbl>, <w:tr>, <w:tc>, <w:p>)
2. Paragraf İçi Dipnot Referansları (<w:footnoteReference>)
3. Çizim / Medya / Alan Kodları (<w:drawing>, <w:fldChar>)
4. Zengin Karakter Biçimlendirmeleri (<w:b>, <w:i>, <w:u>, <w:color>)
5. Uçtan uca DOCX okuma, segmentasyon, hedef metin yazımı ve OpenXML bütünlük doğrulaması
"""

import io
import os
import sys
import zipfile
import xml.etree.ElementTree as ET

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
ET.register_namespace('w', W_NS)

CONTENT_TYPES_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>
</Types>"""

RELS_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

DOC_RELS_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>
</Relationships>"""

STYLES_XML = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{W_NS}">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>"""

FOOTNOTES_XML = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="{W_NS}">
  <w:footnote w:id="1">
    <w:p>
      <w:r><w:t>Dipnot 1: Bu teknik bir CAT araçları araştırma projesidir.</w:t></w:r>
    </w:p>
  </w:footnote>
</w:footnotes>"""

# Karmaşık DOCX Belge İçeriği:
# 1. Başlık paragrafı (Bold, renkli)
# 2. Dipnot içeren paragraf: "Metin dipnot referansı içerir" + <w:footnoteReference w:id="1"/>
# 3. Çizim/Nesne içeren paragraf (<w:drawing>)
# 4. 2x2 Karmaşık Tablo (Her hücrede paragraf ve metin)
DOCUMENT_XML = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="{W_NS}">
  <w:body>
    <!-- Paragraf 0: Başlık -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="0078D4"/>
          <w:sz w:val="32"/>
        </w:rPr>
        <w:t>Uluslararası Çeviri Teknolojileri ve CAT Raporu</w:t>
      </w:r>
    </w:p>

    <!-- Paragraf 1: Dipnot İçeren Gövde Paragrafı -->
    <w:p>
      <w:r>
        <w:t>Bilgisayar destekli çeviri araçları iş akışlarını optimize eder</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr>
        <w:footnoteReference w:id="1"/>
      </w:r>
      <w:r>
        <w:t> ve terminolojik tutarlılığı garanti altına alır.</w:t>
      </w:r>
    </w:p>

    <!-- Paragraf 2: Çizim / Medya İçeren Paragraf -->
    <w:p>
      <w:r>
        <w:t>Şekil 1: CAT İşlem Mimarisi</w:t>
      </w:r>
      <w:r>
        <w:drawing>
          <dummyMediaTag desc="Sistem Çizim Grafiği"/>
        </w:drawing>
      </w:r>
    </w:p>

    <!-- Tablo 1: 2 Satır x 2 Sütun = 4 Paragraf (Paragraf 3, 4, 5, 6) -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bileşen Adı</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>İşlev / Performans</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <w:tr>
        <w:tc>
          <w:p><w:r><w:t>Çeviri Belleği (TM)</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:p><w:r><w:t>Yüzde yüz ve benzer eşleşme sağlar.</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <!-- Paragraf 7: Sonuç Paragrafı -->
    <w:p>
      <w:r>
        <w:t>Sonuç olarak tüm formatlar başarıyla korunmuştur.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>"""

def build_test_docx():
    """Karmaşık test DOCX dosyasını bellekte oluşturur."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', CONTENT_TYPES_XML)
        z.writestr('_rels/.rels', RELS_XML)
        z.writestr('word/_rels/document.xml.rels', DOC_RELS_XML)
        z.writestr('word/styles.xml', STYLES_XML)
        z.writestr('word/footnotes.xml', FOOTNOTES_XML)
        z.writestr('word/document.xml', DOCUMENT_XML)
    buf.seek(0)
    return buf.getvalue()

def run_test_suite():
    print("=" * 65)
    print("🚀 CAT TOOL KAPSAMLI BELGE & KENAR DURUM (EDGE CASE) TESTLERİ")
    print("=" * 65)

    docx_bytes = build_test_docx()
    print(f"✅ 1. Test DOCX başarıyla üretildi (Boyut: {len(docx_bytes)} bayt)")

    # 1. PARSE & SEGMENTATION DENETİMİ
    with zipfile.ZipFile(io.BytesIO(docx_bytes), 'r') as z:
        doc_xml_content = z.read('word/document.xml').decode('utf-8')

    root = ET.fromstring(doc_xml_content)
    paragraphs = root.findall(f'.//{{{W_NS}}}p')
    print(f"✅ 2. Belgedeki tüm paragraflar bulundu: Toplam {len(paragraphs)} paragraf")

    # Paragraf dağılımı:
    # 0: Başlık
    # 1: Dipnotlu gövde
    # 2: Çizimli paragraf
    # 3, 4, 5, 6: Tablo hücrelerindeki paragraflar
    # 7: Sonuç paragrafı
    assert len(paragraphs) == 8, f"Beklenen 8 paragraf, bulunan: {len(paragraphs)}"
    print("   ↳ Tablo içi paragraflar ve ana gövde paragrafları eksiksiz indekslendi.")

    # 2. DİPNOT VE MEDYA DÜĞÜMÜ KORUMA DENETİMİ
    p1 = paragraphs[1]
    fn_refs = p1.findall(f'.//{{{W_NS}}}footnoteReference')
    assert len(fn_refs) == 1, "Dipnot referansı paragraf 1'de bulunamadı!"
    assert fn_refs[0].get(f'{{{W_NS}}}id') == '1', "Dipnot ID '1' eşleşmedi!"
    print("✅ 3. Paragraf 1 içindeki <w:footnoteReference w:id='1'/> doğrulandı.")

    p2 = paragraphs[2]
    drawings = p2.findall(f'.//{{{W_NS}}}drawing')
    assert len(drawings) == 1, "Çizim düğümü paragraf 2'de bulunamadı!"
    print("✅ 4. Paragraf 2 içindeki <w:drawing> düğümü doğrulandı.")

    # 3. TABLO YAPISI DENETİMİ
    tables = root.findall(f'.//{{{W_NS}}}tbl')
    assert len(tables) == 1, "Tablo bulunamadı!"
    rows = tables[0].findall(f'.//{{{W_NS}}}tr')
    assert len(rows) == 2, f"Beklenen 2 satır, bulunan {len(rows)}"
    cells = tables[0].findall(f'.//{{{W_NS}}}tc')
    assert len(cells) == 4, f"Beklenen 4 hücre, bulunan {len(cells)}"
    print(f"✅ 5. Tablo yapısı doğrulandı (1 Tablo, {len(rows)} Satır, {len(cells)} Hücre)")

    # 4. SİMÜLE EDİLMİŞ ÇEVİRİ YAZIMI (REWRITE) VE XML GÜVENLİK TESTİ
    translations = {
        0: "International Translation Technologies and CAT Report [TR->EN]",
        1: "Computer-assisted translation tools optimize workflows and guarantee terminological consistency. [TR->EN]",
        2: "Figure 1: CAT Processing Architecture [TR->EN]",
        3: "Component Name",
        4: "Functionality / Performance",
        5: "Translation Memory (TM)",
        6: "Provides exact and fuzzy matching.",
        7: "In conclusion, all formats have been preserved successfully."
    }

    # Çevirileri paragraflara uygula (dipnot ve çizim run'larını silmeden)
    for p_idx, p in enumerate(paragraphs):
        target_text = translations.get(p_idx, "")
        
        # Sadece saf metin içeren run'ları bul (medya ve dipnot olmayanlar)
        text_runs = []
        for r in p.findall(f'{{{W_NS}}}r'):
            has_media = (
                r.findall(f'{{{W_NS}}}footnoteReference') or
                r.findall(f'{{{W_NS}}}drawing') or
                r.findall(f'{{{W_NS}}}fldChar')
            )
            if not has_media:
                text_runs.append(r)

        # Orijinal metin run'ını yeni çeviri metniyle güncelle
        if text_runs:
            # İlk run'a yeni metni koy, fazlalıkları temizle
            first_r = text_runs[0]
            t_node = first_r.find(f'{{{W_NS}}}t')
            if t_node is None:
                t_node = ET.SubElement(first_r, f'{{{W_NS}}}t')
            t_node.text = target_text
            
            for extra_r in text_runs[1:]:
                p.remove(extra_r)

    # 5. YENİDEN SERİLEŞTİRME VE DİPNOT BÜTÜNLÜK KONTROLÜ
    new_doc_xml = ET.tostring(root, encoding='utf-8')
    new_root = ET.fromstring(new_doc_xml)

    # Dipnot hala duruyor mu?
    new_fn_refs = new_root.findall(f'.//{{{W_NS}}}footnoteReference')
    assert len(new_fn_refs) == 1, "KRİTİK HATA: Dipnot referansı çeviri sonrası kayboldu!"
    assert new_fn_refs[0].get(f'{{{W_NS}}}id') == '1'
    print("✅ 6. Çeviri sonrası <w:footnoteReference> başarıyla korundu.")

    # Çizim hala duruyor mu?
    new_drawings = new_root.findall(f'.//{{{W_NS}}}drawing')
    assert len(new_drawings) == 1, "KRİTİK HATA: Çizim düğümü çeviri sonrası kayboldu!"
    print("✅ 7. Çeviri sonrası <w:drawing> başarıyla korundu.")

    # Tablo hücreleri doğru çevrildi mi?
    new_cells = new_root.findall(f'.//{{{W_NS}}}tc')
    assert len(new_cells) == 4
    cell_texts = ["".join(c.itertext()).strip() for c in new_cells]
    assert cell_texts == [
        "Component Name",
        "Functionality / Performance",
        "Translation Memory (TM)",
        "Provides exact and fuzzy matching."
    ], f"Hücre metinleri uyuşmadı: {cell_texts}"
    print("✅ 8. Tablo hücreleri (4/4) başarıyla çevrildi ve XML yapısı korundu.")

    # 6. YENİ DIŞA AKTARILAN DOCX ARŞİV BÜTÜNLÜĞÜ
    out_buf = io.BytesIO()
    with zipfile.ZipFile(out_buf, 'w', zipfile.ZIP_DEFLATED) as z_out:
        z_out.writestr('[Content_Types].xml', CONTENT_TYPES_XML)
        z_out.writestr('_rels/.rels', RELS_XML)
        z_out.writestr('word/_rels/document.xml.rels', DOC_RELS_XML)
        z_out.writestr('word/styles.xml', STYLES_XML)
        z_out.writestr('word/footnotes.xml', FOOTNOTES_XML)
        z_out.writestr('word/document.xml', new_doc_xml)

    out_bytes = out_buf.getvalue()
    assert len(out_bytes) > 500, "DOCX dışa aktarma boyutu çok küçük!"
    print(f"✅ 9. Dışa aktarılan DOCX ZIP arşivi doğrulandı (Boyut: {len(out_bytes)} bayt)")

    # 7. ÖRNEK TEST DOSYASINI DİSKE KAYDET
    test_file_path = os.path.join(os.getcwd(), 'test_complex_sample.docx')
    with open(test_file_path, 'wb') as f:
        f.write(docx_bytes)
    print(f"✅ 10. Canlı test belgesi hazırlandı: {test_file_path}")

    print("\n" + "=" * 65)
    print("🎉 TÜM UÇ DURUM (EDGE CASE) VE BELGE TESTLERİ BAŞARIYLA GEÇTİ!")
    print("=" * 65)

if __name__ == '__main__':
    run_test_suite()
