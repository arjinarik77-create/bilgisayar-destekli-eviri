-- ========================================================
-- AuraCAT: Supabase user_profiles Tablosu ve Yetkilendirme
-- ========================================================
-- Bu SQL betiğini Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run" tuşuna basınız.

-- 1. user_profiles Tablosunu Oluştur (Ad Soyad + Kullanıcı Adı + Dil Çiftleri)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    username TEXT UNIQUE NOT NULL,
    language_pairs TEXT[] NOT NULL DEFAULT ARRAY['EN > TR'],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabloyu daha önceden oluşturduysanız full_name kolonunu güvenle ekler:
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Hızlı Arama İndeksleri
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- 3. Row Level Security (RLS) Etkinleştirme
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Güvenlik Politikaları (Anonim & Yetkili Erişim İzinleri)
-- Okuma İzni
DROP POLICY IF EXISTS "Allow public read access on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow public read access on user_profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true);

-- Ekleme İzni (İlk girişte anonim/giriş yapmış kullanıcının profil oluşturması)
DROP POLICY IF EXISTS "Allow anon insert on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow anon insert on user_profiles" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (true);

-- Güncelleme İzni (Kullanıcının profil ve dil çiftlerini güncellemesi için)
DROP POLICY IF EXISTS "Allow anon update on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow anon update on user_profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 5. Otomatik updated_at Güncelleme Tetikleyicisi (Trigger)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 6. Supabase Realtime (Canlı Değişiklik Yayını)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'user_profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
    END IF;
END $$;
