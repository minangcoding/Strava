-- 1. Tabel untuk Kudos (Likes)
CREATE TABLE kudos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(activity_id, user_id) -- Satu user hanya bisa memberi 1 kudo per aktivitas
);

-- RLS untuk Kudos
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua orang bisa melihat kudos" 
  ON kudos FOR SELECT 
  USING (true);

CREATE POLICY "User bisa memberi kudos" 
  ON kudos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User bisa menarik kudos-nya sendiri" 
  ON kudos FOR DELETE 
  USING (auth.uid() = user_id);


-- 2. Tabel untuk Komentar
CREATE TABLE comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS untuk Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua orang bisa melihat komentar" 
  ON comments FOR SELECT 
  USING (true);

CREATE POLICY "User bisa menambahkan komentar" 
  ON comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User bisa menghapus komentarnya sendiri" 
  ON comments FOR DELETE 
  USING (auth.uid() = user_id);


-- 3. Update Policy untuk Activities (Agar bisa dibaca oleh semua orang di Global Feed)
-- (Opsional, pastikan policy SELECT pada activities sebelumnya sudah mengizinkan ini,
-- jika sebelumnya activities hanya bisa dilihat oleh user_id yang sama, jalankan ini:)
DROP POLICY IF EXISTS "Enable read access for all users" ON activities;
DROP POLICY IF EXISTS "User bisa melihat aktivitasnya sendiri" ON activities;
CREATE POLICY "Semua orang bisa melihat aktivitas" 
  ON activities FOR SELECT 
  USING (true);

-- 4. Tambahkan kolom user_full_name ke tabel activities (Jika belum ada)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_full_name text;
