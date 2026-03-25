-- ============================================================
-- 修复 RLS 策略：允许匿名和已认证用户都能读取数据
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- ─── 删除所有旧的 SELECT 策略 ─────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "battle_events_select" ON battle_events;
DROP POLICY IF EXISTS "battle_events_select_public" ON battle_events;
DROP POLICY IF EXISTS "battle_signups_select" ON battle_signups;
DROP POLICY IF EXISTS "battle_signups_select_public" ON battle_signups;
DROP POLICY IF EXISTS "battle_assignments_select" ON battle_assignments;
DROP POLICY IF EXISTS "battle_assignments_select_public" ON battle_assignments;
DROP POLICY IF EXISTS "notices_select" ON notices;
DROP POLICY IF EXISTS "notices_select_public" ON notices;
DROP POLICY IF EXISTS "member_relations_select" ON member_relations;
DROP POLICY IF EXISTS "member_relations_select_public" ON member_relations;
DROP POLICY IF EXISTS "activity_records_select" ON activity_records;
DROP POLICY IF EXISTS "activity_records_select_public" ON activity_records;

-- ─── 重新创建 SELECT 策略（允许所有人读取，包括匿名用户）────────
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "battle_events_select" ON battle_events
  FOR SELECT USING (true);

CREATE POLICY "battle_signups_select" ON battle_signups
  FOR SELECT USING (true);

CREATE POLICY "battle_assignments_select" ON battle_assignments
  FOR SELECT USING (true);

CREATE POLICY "notices_select" ON notices
  FOR SELECT USING (true);

CREATE POLICY "member_relations_select" ON member_relations
  FOR SELECT USING (true);

CREATE POLICY "activity_records_select" ON activity_records
  FOR SELECT USING (true);
