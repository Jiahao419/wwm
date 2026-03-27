export const MEMBER_TAGS = [
  '管理', '指挥', '主力', '常驻', '活跃', '萌新', '外交', '后勤', '整活', '夜间在线',
] as const;

export type MemberTag = typeof MEMBER_TAGS[number];

export const EVENT_TYPES = {
  baiye_war: {
    label: '百业战',
    maxParticipants: 30,
    teamCount: 6,
    teamSize: 5,
    fields: ['route', 'role_baiye'] as const,
  },
  dungeon_10: {
    label: '10人本',
    maxParticipants: 10,
    fields: ['role_dungeon'] as const,
  },
  dungeon_5: {
    label: '5人本',
    maxParticipants: 5,
    fields: ['role_dungeon'] as const,
  },
  activity: {
    label: '特色活动',
    maxParticipants: null,
    fields: [] as const,
  },
} as const;

export type EventType = keyof typeof EVENT_TYPES;

export const BATTLE_ROUTES = ['裂石威', '牵丝霖', '鸣金虹', '鸣金影', '牵丝玉', '破竹风', '破竹尘'] as const;

export const BATTLE_ROLES_BAIYE = [
  '人墙防守', '守塔', '打野', '冲锋突破', '搬运', '机动支援',
] as const;

export const BATTLE_ROLES_DUNGEON = [
  '主T', '副T', '奶妈', '输出', '辅助', '跟随指挥',
] as const;

export const TEAM_COLORS: Record<number, string> = {
  1: '#e05555',
  2: '#e09055',
  3: '#e0c055',
  4: '#5580e0',
  5: '#55b0e0',
  6: '#9055e0',
};

export const MAP_ZONES = [
  { id: 'zone-red-base', name: '红方基地' },
  { id: 'zone-blue-base', name: '蓝方基地' },
  { id: 'zone-top-lane', name: '上路' },
  { id: 'zone-mid-lane', name: '中路' },
  { id: 'zone-bot-lane', name: '下路' },
  { id: 'zone-red-tower-top', name: '红方上塔' },
  { id: 'zone-red-tower-mid', name: '红方中塔' },
  { id: 'zone-red-tower-bot', name: '红方下塔' },
  { id: 'zone-blue-tower-top', name: '蓝方上塔' },
  { id: 'zone-blue-tower-mid', name: '蓝方中塔' },
  { id: 'zone-blue-tower-bot', name: '蓝方下塔' },
  { id: 'zone-wild-red-1', name: '红方野区1' },
  { id: 'zone-wild-red-2', name: '红方野区2' },
  { id: 'zone-wild-red-3', name: '红方野区3' },
  { id: 'zone-wild-red-4', name: '红方野区4' },
  { id: 'zone-wild-blue-1', name: '蓝方野区1' },
  { id: 'zone-wild-blue-2', name: '蓝方野区2' },
  { id: 'zone-wild-blue-3', name: '蓝方野区3' },
  { id: 'zone-wild-blue-4', name: '蓝方野区4' },
] as const;

export const NOTICE_TYPES = [
  { value: 'event', label: '赛事通知' },
  { value: 'activity', label: '活动安排' },
  { value: 'daily', label: '日常通知' },
  { value: 'recruit', label: '招新公告' },
  { value: 'review', label: '复盘总结' },
  { value: 'tactic', label: '战术部署' },
] as const;

export const FACTIONS = [
  '鸣金·虹', '鸣金·影',
  '牵丝·玉', '牵丝·霖',
  '裂石·钧', '裂石·威',
  '破竹·风', '破竹·尘',
] as const;

export type Faction = typeof FACTIONS[number];

export const FACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '鸣金·虹': { bg: 'rgba(224,85,85,0.12)', text: '#f08080', border: 'rgba(224,85,85,0.3)' },
  '鸣金·影': { bg: 'rgba(160,70,100,0.12)', text: '#d08090', border: 'rgba(160,70,100,0.3)' },
  '牵丝·玉': { bg: 'rgba(180,140,220,0.12)', text: '#c8a0e8', border: 'rgba(180,140,220,0.3)' },
  '牵丝·霖': { bg: 'rgba(100,150,220,0.12)', text: '#80b0e8', border: 'rgba(100,150,220,0.3)' },
  '裂石·钧': { bg: 'rgba(200,160,60,0.12)', text: '#d8b860', border: 'rgba(200,160,60,0.3)' },
  '裂石·威': { bg: 'rgba(220,120,40,0.12)', text: '#e09050', border: 'rgba(220,120,40,0.3)' },
  '破竹·风': { bg: 'rgba(80,180,120,0.12)', text: '#70c890', border: 'rgba(80,180,120,0.3)' },
  '破竹·尘': { bg: 'rgba(140,160,100,0.12)', text: '#a8b878', border: 'rgba(140,160,100,0.3)' },
};

export const RELATION_TYPES = [
  { id: 'xiayuan', label: '侠缘', style: 'solid', color: '#e05555', max: 1 },
  { id: 'jieyi', label: '结义', style: 'solid', color: '#c9a84c', max: 9 },
  { id: 'shifu', label: '师父', style: 'dashed', color: '#55b0e0', max: 1 },
  { id: 'tudi', label: '徒弟', style: 'dashed', color: '#55b0e0', max: 5 },
] as const;

export const NAV_ITEMS = [
  { href: '/', label: '首页' },
  { href: '/roster', label: '月冕名册' },
  { href: '/battle', label: '百业战务' },
  { href: '/signup', label: '赛事报名' },
  { href: '/relations', label: '关系谱' },
  { href: '/notices', label: '公告檄文' },
] as const;
