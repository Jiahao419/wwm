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
  SiteConfig,
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

export async function getAssignments(eventId: string) {
  // Fetch assignments
  const { data: assigns, error: assignErr } = await getAnonSupabase()
    .from('battle_assignments')
    .select('*')
    .eq('event_id', eventId)
    .returns<BattleAssignment[]>();

  if (assignErr || !assigns) return { data: assigns, error: assignErr };

  // Fetch all profiles and join manually (user_id in assignments may be profile.id or auth user_id)
  const { data: profiles } = await getAnonSupabase()
    .from('profiles')
    .select('*')
    .returns<Profile[]>();

  const profileMap = new Map<string, Profile>();
  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id, p);
      if (p.user_id) profileMap.set(p.user_id, p);
    }
  }

  const enriched = assigns.map(a => ({
    ...a,
    profile: a.user_id ? profileMap.get(a.user_id) || null : null,
  }));

  return { data: enriched, error: null };
}

export async function upsertAssignment(data: Omit<BattleAssignment, 'profile' | 'signup'>) {
  const { id, ...rest } = data;

  // If we have a real DB id (not empty), try update first
  if (id && id.length > 0) {
    const { data: updated, error: updateErr } = await getSupabase()
      .from('battle_assignments')
      .update(rest)
      .eq('id', id)
      .select()
      .single<BattleAssignment>();

    if (!updateErr && updated) return { data: updated, error: null };
    // If update found no matching row (PGRST116), fall through to insert
  }

  // Insert new — let DB generate the id
  return getSupabase()
    .from('battle_assignments')
    .insert(rest)
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

/** Get all relations involving a specific user (by user_id) */
export async function getRelationsForUser(userId: string) {
  const supabase = getAnonSupabase();
  const { data, error } = await supabase
    .from('member_relations')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .returns<MemberRelation[]>();
  return { data, error };
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

// ─── Site Config ────────────────────────────────────────────────────

export function getSiteConfig(key: string) {
  return getAnonSupabase()
    .from('site_config')
    .select('*')
    .eq('key', key)
    .single<SiteConfig>();
}

export function upsertSiteConfig(key: string, value: string) {
  return getSupabase()
    .from('site_config')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single<SiteConfig>();
}

// ─── Gallery (Supabase Storage) ─────────────────────────────────────

const GALLERY_BUCKET = 'gallery';

export async function uploadGalleryImage(file: File): Promise<{ url: string | null; error: Error | null }> {
  const supabase = getSupabase();
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;

  console.log('[gallery] uploading to bucket:', GALLERY_BUCKET, 'file:', fileName);

  const { data: uploadData, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  console.log('[gallery] upload result:', { uploadData, error });

  if (error) return { url: null, error: error as unknown as Error };

  const { data: urlData } = supabase.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(fileName);

  console.log('[gallery] public url:', urlData.publicUrl);
  return { url: urlData.publicUrl, error: null };
}

export async function getGalleryImages(): Promise<{ urls: string[]; error: Error | null }> {
  const supabase = getAnonSupabase();
  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .list('', { sortBy: { column: 'created_at', order: 'desc' } });

  if (error || !data) return { urls: [], error: error as unknown as Error };

  const urls = data
    .filter(f => !f.name.startsWith('.'))
    .map(f => {
      const { data: urlData } = supabase.storage
        .from(GALLERY_BUCKET)
        .getPublicUrl(f.name);
      return urlData.publicUrl;
    });

  return { urls, error: null };
}

export async function deleteGalleryImage(url: string): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  // Extract file path from URL — handle query params and nested paths
  // URL format: .../storage/v1/object/public/gallery/[path]
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname; // e.g. /storage/v1/object/public/gallery/filename.jpg
    const bucketPrefix = `/storage/v1/object/public/${GALLERY_BUCKET}/`;
    let filePath: string;
    if (pathname.includes(bucketPrefix)) {
      filePath = pathname.split(bucketPrefix)[1];
    } else {
      // Fallback: just take last segment without query params
      filePath = pathname.split('/').pop() || '';
    }
    filePath = decodeURIComponent(filePath);
    console.log('[gallery] deleting file:', filePath);

    const { error } = await supabase.storage
      .from(GALLERY_BUCKET)
      .remove([filePath]);

    if (error) console.error('[gallery] delete error:', error);
    return { error: error as unknown as Error | null };
  } catch (e) {
    console.error('[gallery] delete parse error:', e);
    return { error: e as Error };
  }
}
