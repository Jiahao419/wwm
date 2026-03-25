-- ============================================================
-- 五味杂陈 数据库迁移文件
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- ============================================================
-- 1. 辅助函数
-- ============================================================

-- 自动更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 获取当前用户角色的辅助函数（用于 RLS 策略）
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. 用户资料表 (profiles)
-- ============================================================

CREATE TABLE profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  nickname    text NOT NULL,
  avatar_url  text,
  identity    text,              -- 身份标签: 坛主 / 副坛主 / 成员
  intro       text,
  description text,
  tags        text[] DEFAULT '{}',
  is_public   boolean DEFAULT true,
  discord_username text,
  discord_id  text,
  role        text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  node_color  text DEFAULT '#9a8a6a',
  node_size   text DEFAULT 'small' CHECK (node_size IN ('small', 'medium', 'large')),
  graph_x     real,
  graph_y     real,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 自动更新 updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. 战斗/活动事件表 (battle_events)
-- ============================================================

CREATE TABLE battle_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  event_type        text NOT NULL,
  opponent          text,
  battle_time       timestamptz,
  signup_deadline   timestamptz,
  max_participants  integer DEFAULT 30,
  team_count        integer DEFAULT 6,
  team_size         integer DEFAULT 5,
  status            text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'closed', 'finished')),
  description       text,
  tactic_notes      text,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TRIGGER battle_events_updated_at
  BEFORE UPDATE ON battle_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. 战斗报名表 (battle_signups)
-- ============================================================

CREATE TABLE battle_signups (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id           uuid REFERENCES battle_events(id) ON DELETE CASCADE,
  user_id            uuid REFERENCES auth.users(id),
  nickname_snapshot  text NOT NULL,
  contact            text,
  intro              text,
  preferred_route    text,
  preferred_roles    text[] DEFAULT '{}',
  note               text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE TRIGGER battle_signups_updated_at
  BEFORE UPDATE ON battle_signups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. 战斗分配表 (battle_assignments)
-- ============================================================

CREATE TABLE battle_assignments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid REFERENCES battle_events(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES auth.users(id),
  team_number    integer,
  assigned_role  text,
  map_zone       text,
  map_x          real,
  map_y          real,
  is_substitute  boolean DEFAULT false,
  admin_note     text,
  updated_by     uuid REFERENCES auth.users(id),
  updated_at     timestamptz DEFAULT now()
);

CREATE TRIGGER battle_assignments_updated_at
  BEFORE UPDATE ON battle_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. 公告表 (notices)
-- ============================================================

CREATE TABLE notices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  type        text NOT NULL,
  summary     text,
  content     text,
  is_pinned   boolean DEFAULT false,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TRIGGER notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. 成员关系表 (member_relations)
-- ============================================================

CREATE TABLE member_relations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id   uuid REFERENCES auth.users(id),
  to_user_id     uuid REFERENCES auth.users(id),
  relation_type  text CHECK (relation_type IN ('superior', 'partner', 'teammate')),
  label          text,
  line_color     text,
  group_name     text,
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);

-- ============================================================
-- 8. 活动记录表 (activity_records)
-- ============================================================

CREATE TABLE activity_records (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  type           text,
  description    text,
  result         text,
  cover_url      text,
  activity_date  date,
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);

-- ============================================================
-- 9. 启用行级安全 (RLS)
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_signups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_relations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_records   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. RLS 策略 — profiles 表
-- ============================================================

-- 所有已认证用户可以查看资料
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 所有已认证用户可以新建资料
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 用户可以更新自己的资料，管理员/坛主可以更新所有资料
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR get_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR get_user_role() IN ('owner', 'admin')
  );

-- 仅坛主和管理员可以删除资料
CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'));

-- ============================================================
-- 11. RLS 策略 — battle_events 表
-- ============================================================

CREATE POLICY "battle_events_select"
  ON battle_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "battle_events_insert"
  ON battle_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "battle_events_update"
  ON battle_events FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

CREATE POLICY "battle_events_delete"
  ON battle_events FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'));

-- ============================================================
-- 12. RLS 策略 — battle_signups 表
-- ============================================================

CREATE POLICY "battle_signups_select"
  ON battle_signups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "battle_signups_insert"
  ON battle_signups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "battle_signups_update"
  ON battle_signups FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

CREATE POLICY "battle_signups_delete"
  ON battle_signups FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'));

-- ============================================================
-- 13. RLS 策略 — battle_assignments 表
-- ============================================================

CREATE POLICY "battle_assignments_select"
  ON battle_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "battle_assignments_insert"
  ON battle_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "battle_assignments_update"
  ON battle_assignments FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

CREATE POLICY "battle_assignments_delete"
  ON battle_assignments FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'));

-- ============================================================
-- 14. RLS 策略 — notices 表
-- ============================================================

CREATE POLICY "notices_select"
  ON notices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "notices_insert"
  ON notices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "notices_update"
  ON notices FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

CREATE POLICY "notices_delete"
  ON notices FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'));

-- ============================================================
-- 15. RLS 策略 — member_relations 表
-- ============================================================

CREATE POLICY "member_relations_select"
  ON member_relations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "member_relations_insert"
  ON member_relations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "member_relations_update"
  ON member_relations FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

CREATE POLICY "member_relations_delete"
  ON member_relations FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'));

-- ============================================================
-- 16. RLS 策略 — activity_records 表
-- ============================================================

CREATE POLICY "activity_records_select"
  ON activity_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "activity_records_insert"
  ON activity_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "activity_records_update"
  ON activity_records FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

CREATE POLICY "activity_records_delete"
  ON activity_records FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('owner', 'admin'));

-- ============================================================
-- 17. 角色保护触发器 — 仅坛主可修改 role 字段
-- ============================================================

CREATE OR REPLACE FUNCTION protect_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果 role 字段没有变化，直接放行
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- 只有坛主 (owner) 才能修改 role 字段
  IF get_user_role() != 'owner' THEN
    RAISE EXCEPTION '只有坛主才能修改用户角色';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_role_change();

-- ============================================================
-- 18. 新用户注册时自动创建资料（从 Discord 元数据中提取信息）
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _nickname text;
  _avatar   text;
  _discord_username text;
  _discord_id text;
BEGIN
  -- 从 Discord OAuth 元数据中提取信息
  _nickname := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'custom_claims' ->> 'global_name',
    ' 新成员'
  );
  _avatar := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture'
  );
  _discord_username := NEW.raw_user_meta_data ->> 'preferred_username';
  _discord_id := NEW.raw_user_meta_data ->> 'provider_id';

  INSERT INTO public.profiles (user_id, nickname, avatar_url, discord_username, discord_id, identity, role)
  VALUES (
    NEW.id,
    _nickname,
    _avatar,
    _discord_username,
    _discord_id,
    '成员',
    'member'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在 auth.users 表上创建触发器，新用户注册时自动创建资料
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
