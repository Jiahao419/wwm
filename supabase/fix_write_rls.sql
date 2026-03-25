-- ============================================================
-- 修复 RLS 写入策略：允许 admin/owner 执行 INSERT/UPDATE/DELETE
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- ─── Helper: 检查当前用户是否为 admin 或 owner ─────────────────
-- (用子查询代替函数，兼容性更好)

-- ─── battle_assignments ──────────────────────────────────────

DROP POLICY IF EXISTS "battle_assignments_insert" ON battle_assignments;
DROP POLICY IF EXISTS "battle_assignments_update" ON battle_assignments;
DROP POLICY IF EXISTS "battle_assignments_delete" ON battle_assignments;

CREATE POLICY "battle_assignments_insert" ON battle_assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "battle_assignments_update" ON battle_assignments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "battle_assignments_delete" ON battle_assignments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- ─── battle_events ──────────────────────────────────────────

DROP POLICY IF EXISTS "battle_events_insert" ON battle_events;
DROP POLICY IF EXISTS "battle_events_update" ON battle_events;
DROP POLICY IF EXISTS "battle_events_delete" ON battle_events;

CREATE POLICY "battle_events_insert" ON battle_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "battle_events_update" ON battle_events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "battle_events_delete" ON battle_events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- ─── battle_signups ─────────────────────────────────────────

DROP POLICY IF EXISTS "battle_signups_insert" ON battle_signups;
DROP POLICY IF EXISTS "battle_signups_update" ON battle_signups;
DROP POLICY IF EXISTS "battle_signups_delete" ON battle_signups;

CREATE POLICY "battle_signups_insert" ON battle_signups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "battle_signups_update" ON battle_signups
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "battle_signups_delete" ON battle_signups
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- ─── profiles ───────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- Admin/owner can insert (for admin-created profiles)
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- Users can update their own profile, admin/owner can update any
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- Only admin/owner can delete
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- ─── notices ────────────────────────────────────────────────

DROP POLICY IF EXISTS "notices_insert" ON notices;
DROP POLICY IF EXISTS "notices_update" ON notices;
DROP POLICY IF EXISTS "notices_delete" ON notices;

CREATE POLICY "notices_insert" ON notices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "notices_update" ON notices
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "notices_delete" ON notices
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- ─── member_relations ───────────────────────────────────────

DROP POLICY IF EXISTS "member_relations_insert" ON member_relations;
DROP POLICY IF EXISTS "member_relations_delete" ON member_relations;

CREATE POLICY "member_relations_insert" ON member_relations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "member_relations_delete" ON member_relations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- ─── activity_records ───────────────────────────────────────

DROP POLICY IF EXISTS "activity_records_insert" ON activity_records;
DROP POLICY IF EXISTS "activity_records_update" ON activity_records;
DROP POLICY IF EXISTS "activity_records_delete" ON activity_records;

CREATE POLICY "activity_records_insert" ON activity_records
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "activity_records_update" ON activity_records
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "activity_records_delete" ON activity_records
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- ─── site_stats ─────────────────────────────────────────────

DROP POLICY IF EXISTS "site_stats_update" ON site_stats;

CREATE POLICY "site_stats_update" ON site_stats
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );
