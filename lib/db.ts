import { createClient, createAnonClient } from './supabase/client';
import type {
  Profile,
  BattleEvent,
  BattleSignup,
  BattleAssignment,
  Notice,
  MemberRelation,
  ActivityRecord,
  SiteStat,
} from './types';

// Authenticated client — for INSERT / UPDATE / DELETE (needs auth token)
function getSupabase() {
  return createClient();
}

// Anonymous client — for SELECT queries (never waits for token refresh)
function getAnonSupabase() {
  return createAnonClient();
}

// ─── Auth / Role helpers ─────────────────────────────────────────────

export async function getCurrentUserProfile() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not authenticated') };

  return getAnonSupabase()
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<Profile>();
}

export async function getUserRole() {
  const { data, error } = await getCurrentUserProfile();
  if (error || !data) return null;
  return data.role;
}

export async function isAdminOrOwner() {
  const role = await getUserRole();
  return role === 'admin' || role === 'owner';
}

// ─── Profiles ────────────────────────────────────────────────────────

export function getProfiles() {
  return getAnonSupabase().from('profiles').select('*').returns<Profile[]>();
}

export function createProfile(data: {
  nickname: string;
  identity?: string | null;
  intro?: string | null;
  description?: string | null;
  tags?: string[];
  avatar_url?: string | null;
}) {
  return getSupabase().from('profiles').insert({
    nickname: data.nickname,
    identity: data.identity || null,
    intro: data.intro || null,
    description: data.description || null,
    tags: data.tags || [],
    avatar_url: data.avatar_url || null,
    user_id: null,
    node_color: '#9a8a6a',
    node_size: 'medium',
    is_public: true,
    role: 'member',
  }).select().single<Profile>();
}

export function updateProfile(id: string, data: Partial<Profile>) {
  return getSupabase().from('profiles').update(data).eq('id', id).select().single<Profile>();
}

export function deleteProfile(id: string) {
  return getSupabase().from('profiles').delete().eq('id', id);
}

export function setUserRole(userId: string, role: Profile['role']) {
  return getSupabase()
    .from('profiles')
    .update({ role })
    .eq('user_id', userId)
    .select()
    .single<Profile>();
}

// ─── Notices ─────────────────────────────────────────────────────────

export function getNotices() {
  return getAnonSupabase()
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<Notice[]>();
}

export function createNotice(data: Omit<Notice, 'id' | 'created_at' | 'updated_at'>) {
  return getSupabase().from('notices').insert(data).select().single<Notice>();
}

export function updateNotice(id: string, data: Partial<Notice>) {
  return getSupabase().from('notices').update(data).eq('id', id).select().single<Notice>();
}

export function deleteNotice(id: string) {
  return getSupabase().from('notices').delete().eq('id', id);
}

// ─── Battle Events ───────────────────────────────────────────────────

export function getBattleEvents() {
  return getAnonSupabase().from('battle_events').select('*').returns<BattleEvent[]>();
}

export function getBattleEvent(id: string) {
  return getAnonSupabase()
    .from('battle_events')
    .select('*, battle_signups(*), battle_assignments(*)')
    .eq('id', id)
    .single<BattleEvent & { battle_signups: BattleSignup[]; battle_assignments: BattleAssignment[] }>();
}

export function createBattleEvent(data: Omit<BattleEvent, 'id' | 'created_at' | 'updated_at'>) {
  return getSupabase().from('battle_events').insert(data).select().single<BattleEvent>();
}

export function updateBattleEvent(id: string, data: Partial<BattleEvent>) {
  return getSupabase().from('battle_events').update(data).eq('id', id).select().single<BattleEvent>();
}

export function deleteBattleEvent(id: string) {
  return getSupabase().from('battle_events').delete().eq('id', id);
}

// ─── Battle Signups ──────────────────────────────────────────────────

export function getSignups(eventId: string) {
  return getAnonSupabase()
    .from('battle_signups')
    .select('*')
    .eq('event_id', eventId)
    .returns<BattleSignup[]>();
}

export function createSignup(data: Omit<BattleSignup, 'id' | 'created_at' | 'updated_at'>) {
  return getSupabase().from('battle_signups').insert(data).select().single<BattleSignup>();
}

export function deleteSignup(id: string) {
  return getSupabase().from('battle_signups').delete().eq('id', id);
}

// ─── Battle Assignments ──────────────────────────────────────────────

export function getAssignments(eventId: string) {
  return getAnonSupabase()
    .from('battle_assignments')
    .select('*')
    .eq('event_id', eventId)
    .returns<BattleAssignment[]>();
}

export function upsertAssignment(data: Omit<BattleAssignment, 'profile' | 'signup'>) {
  return getSupabase()
    .from('battle_assignments')
    .upsert(data, { onConflict: 'id' })
    .select()
    .single<BattleAssignment>();
}

export function deleteAssignment(id: string) {
  return getSupabase().from('battle_assignments').delete().eq('id', id);
}

// ─── Activity Records ────────────────────────────────────────────────

export function getActivityRecords() {
  return getAnonSupabase().from('activity_records').select('*').returns<ActivityRecord[]>();
}

export function createActivityRecord(data: Omit<ActivityRecord, 'id' | 'created_at'>) {
  return getSupabase().from('activity_records').insert(data).select().single<ActivityRecord>();
}

export function updateActivityRecord(id: string, data: Partial<ActivityRecord>) {
  return getSupabase().from('activity_records').update(data).eq('id', id).select().single<ActivityRecord>();
}

export function deleteActivityRecord(id: string) {
  return getSupabase().from('activity_records').delete().eq('id', id);
}

// ─── Member Relations ────────────────────────────────────────────────

export function getRelations() {
  return getAnonSupabase().from('member_relations').select('*').returns<MemberRelation[]>();
}

export function createRelation(data: Omit<MemberRelation, 'id' | 'created_at'>) {
  return getSupabase().from('member_relations').insert(data).select().single<MemberRelation>();
}

export function deleteRelation(id: string) {
  return getSupabase().from('member_relations').delete().eq('id', id);
}

// ─── Site Stats ─────────────────────────────────────────────────────

export function getSiteStats() {
  return getAnonSupabase()
    .from('site_stats')
    .select('*')
    .order('sort_order', { ascending: true })
    .returns<SiteStat[]>();
}

export function updateSiteStat(id: number, data: Partial<Pick<SiteStat, 'label' | 'value' | 'suffix'>>) {
  return getSupabase()
    .from('site_stats')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<SiteStat>();
}
