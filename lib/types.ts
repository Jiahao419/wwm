import { MemberTag, EventType } from './constants';

export interface Profile {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  identity: string | null;
  intro: string | null;
  description: string | null;
  tags: MemberTag[];
  is_public: boolean;
  discord_username: string | null;
  discord_id: string | null;
  role: 'owner' | 'admin' | 'member';
  node_color: string;
  node_size: 'small' | 'medium' | 'large';
  graph_x: number | null;
  graph_y: number | null;
  showcase_url: string | null;
  faction: string | null;
  created_at: string;
  updated_at: string;
}

export interface BattleEvent {
  id: string;
  title: string;
  event_type: EventType;
  opponent: string | null;
  battle_time: string | null;
  signup_deadline: string | null;
  max_participants: number;
  team_count: number;
  team_size: number;
  status: 'upcoming' | 'active' | 'closed' | 'finished';
  battle_mode: string | null;
  result: string | null;
  description: string | null;
  tactic_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BattleSignup {
  id: string;
  event_id: string;
  user_id: string;
  nickname_snapshot: string;
  contact: string | null;
  intro: string | null;
  preferred_route: string | null;
  preferred_roles: string[];
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BattleAssignment {
  id: string;
  event_id: string;
  user_id: string;
  team_number: number | null;
  assigned_role: string | null;
  map_zone: string | null;
  map_x: number | null;
  map_y: number | null;
  is_substitute: boolean;
  admin_note: string | null;
  updated_by: string | null;
  updated_at: string;
  // joined data
  profile?: Profile;
  signup?: BattleSignup;
}

export interface Notice {
  id: string;
  title: string;
  type: string;
  summary: string | null;
  content: string | null;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MemberRelation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  relation_type: 'xiayuan' | 'jieyi' | 'shifu' | 'tudi';
  label: string | null;
  line_color: string | null;
  group_name: string | null;
  created_by: string;
  created_at: string;
}

export interface RelationGroup {
  id: string;
  name: string;
  description: string | null;
  member_ids: string[];
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SiteStat {
  id: number;
  sort_order: number;
  label: string;
  value: number;
  suffix: string;
  updated_at: string;
}

export interface SiteConfig {
  key: string;
  value: string;
  updated_at: string;
}

export interface ProfileImage {
  id: string;
  profile_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface ActivityRecord {
  id: string;
  title: string;
  type: string | null;
  description: string | null;
  result: string | null;
  cover_url: string | null;
  activity_date: string | null;
  created_by: string;
  created_at: string;
}
