-- 1. Tabel untuk Kudos (Likes)
CREATE TABLE IF NOT EXISTS kudos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(activity_id, user_id)
);

ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua orang bisa melihat kudos" ON kudos;
CREATE POLICY "Semua orang bisa melihat kudos" ON kudos FOR SELECT USING (true);

DROP POLICY IF EXISTS "User bisa memberi kudos" ON kudos;
CREATE POLICY "User bisa memberi kudos" ON kudos FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User bisa menarik kudos-nya sendiri" ON kudos;
CREATE POLICY "User bisa menarik kudos-nya sendiri" ON kudos FOR DELETE USING (auth.uid() = user_id);


-- 2. Tabel untuk Komentar
CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua orang bisa melihat komentar" ON comments;
CREATE POLICY "Semua orang bisa melihat komentar" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "User bisa menambahkan komentar" ON comments;
CREATE POLICY "User bisa menambahkan komentar" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User bisa menghapus komentarnya sendiri" ON comments;
CREATE POLICY "User bisa menghapus komentarnya sendiri" ON comments FOR DELETE USING (auth.uid() = user_id);


-- 3. Update Policy untuk Activities (Agar bisa dibaca oleh semua orang di Global Feed)
DROP POLICY IF EXISTS "Enable read access for all users" ON activities;
DROP POLICY IF EXISTS "User bisa melihat aktivitasnya sendiri" ON activities;
DROP POLICY IF EXISTS "Semua orang bisa melihat aktivitas" ON activities;
CREATE POLICY "Semua orang bisa melihat aktivitas" ON activities FOR SELECT USING (true);

-- 4. Tambahkan kolom user_full_name ke tabel activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_full_name text;
