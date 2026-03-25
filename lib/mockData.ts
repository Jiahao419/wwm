import { Profile, BattleEvent, BattleSignup, BattleAssignment, Notice, MemberRelation, ActivityRecord } from './types';

export const mockProfiles: Profile[] = [
  {
    id: '1', user_id: 'u1', nickname: '云中君', avatar_url: null,
    identity: '坛主', intro: '月冕总坛创始人，百业战总指挥',
    description: '执剑天涯，护我月冕', tags: ['管理', '指挥'],
    is_public: true, discord_username: 'yunzhong', discord_id: '001', role: 'owner',
    node_color: '#c9a84c', node_size: 'large', graph_x: 50, graph_y: 20,
    created_at: '2025-01-01', updated_at: '2025-03-01',
  },
  {
    id: '2', user_id: 'u2', nickname: '霜华', avatar_url: null,
    identity: '副坛主', intro: '负责百业战战术部署与人员调度',
    description: '冰霜之下，万物生长', tags: ['管理', '指挥', '主力'],
    is_public: true, discord_username: 'shuanghua', discord_id: '002', role: 'admin',
    node_color: '#55b0e0', node_size: 'large', graph_x: 30, graph_y: 35,
    created_at: '2025-01-02', updated_at: '2025-03-01',
  },
  {
    id: '3', user_id: 'u3', nickname: '夜阑珊', avatar_url: null,
    identity: '外交使', intro: '负责对外联络与合作事务',
    description: '灯火阑珊处，总有故人来', tags: ['外交', '活跃'],
    is_public: true, discord_username: 'yelanshan', discord_id: '003', role: 'member',
    node_color: '#9055e0', node_size: 'medium', graph_x: 70, graph_y: 35,
    created_at: '2025-01-03', updated_at: '2025-03-01',
  },
  {
    id: '4', user_id: 'u4', nickname: '铁衣寒', avatar_url: null,
    identity: '战队队长', intro: '百业战一队队长，冲锋突破手',
    description: '铁衣在身，寒风不侵', tags: ['主力', '常驻'],
    is_public: true, discord_username: 'tieyihan', discord_id: '004', role: 'member',
    node_color: '#e05555', node_size: 'medium', graph_x: 20, graph_y: 55,
    created_at: '2025-01-05', updated_at: '2025-03-01',
  },
  {
    id: '5', user_id: 'u5', nickname: '竹青', avatar_url: null,
    identity: '后勤总管', intro: '物资调配与活动组织',
    description: '竹影清风，万事从容', tags: ['后勤', '活跃', '常驻'],
    is_public: true, discord_username: 'zhuqing', discord_id: '005', role: 'member',
    node_color: '#4caf50', node_size: 'medium', graph_x: 50, graph_y: 50,
    created_at: '2025-01-06', updated_at: '2025-03-01',
  },
  {
    id: '6', user_id: 'u6', nickname: '醉卧南柯', avatar_url: null,
    identity: '成员', intro: '百业战主力输出',
    description: '醉里乾坤大，壶中日月长', tags: ['主力', '活跃', '夜间在线'],
    is_public: true, discord_username: 'zuiwo', discord_id: '006', role: 'member',
    node_color: '#9a8a6a', node_size: 'small', graph_x: 35, graph_y: 70,
    created_at: '2025-02-01', updated_at: '2025-03-01',
  },
  {
    id: '7', user_id: 'u7', nickname: '明月几时有', avatar_url: null,
    identity: '成员', intro: '擅长守塔与防御',
    description: '但愿人长久，千里共婵娟', tags: ['常驻', '活跃'],
    is_public: true, discord_username: 'mingyue', discord_id: '007', role: 'member',
    node_color: '#9a8a6a', node_size: 'small', graph_x: 65, graph_y: 70,
    created_at: '2025-02-05', updated_at: '2025-03-01',
  },
  {
    id: '8', user_id: 'u8', nickname: '风卷残云', avatar_url: null,
    identity: '成员', intro: '打野专精，快速支援',
    description: '风起云涌，一击必杀', tags: ['主力', '夜间在线'],
    is_public: true, discord_username: 'fengj', discord_id: '008', role: 'member',
    node_color: '#9a8a6a', node_size: 'small', graph_x: 80, graph_y: 55,
    created_at: '2025-02-10', updated_at: '2025-03-01',
  },
  {
    id: '9', user_id: 'u9', nickname: '小鱼干', avatar_url: null,
    identity: '成员', intro: '刚加入月冕，正在学习中',
    description: '虽然是萌新但会努力的！', tags: ['萌新', '活跃'],
    is_public: true, discord_username: 'xiaoyu', discord_id: '009', role: 'member',
    node_color: '#9a8a6a', node_size: 'small', graph_x: 50, graph_y: 85,
    created_at: '2025-03-01', updated_at: '2025-03-01',
  },
  {
    id: '10', user_id: 'u10', nickname: '逐浪', avatar_url: null,
    identity: '活动策划', intro: '百业好声音策划人，整活达人',
    description: '浪里个浪～', tags: ['整活', '活跃', '后勤'],
    is_public: true, discord_username: 'zhulang', discord_id: '010', role: 'member',
    node_color: '#e0c055', node_size: 'small', graph_x: 15, graph_y: 80,
    created_at: '2025-02-15', updated_at: '2025-03-01',
  },
];

export const mockBattleEvent: BattleEvent = {
  id: 'e1', title: '月冕 vs 风雷阁 · 第三十二届百业战',
  event_type: 'baiye_war', opponent: '风雷阁',
  battle_time: '2026-03-29T20:00:00Z', signup_deadline: '2026-03-28T18:00:00Z',
  max_participants: 30, team_count: 6, team_size: 5,
  status: 'active', description: '本周百业战对手为风雷阁，请各位按时报名。',
  tactic_notes: '## 战术部署\n\n### 进攻组（1-3队）\n- 1队负责上路强攻\n- 2队负责中路突破\n- 3队机动支援\n\n### 防守组（4-6队）\n- 4队守上路塔\n- 5队守下路塔\n- 6队中央防守\n\n### 注意事项\n- 开局集合中央广场\n- 听从指挥统一行动\n- 保持语音畅通',
  created_by: 'u1', created_at: '2025-03-20', updated_at: '2025-03-20',
};

export const mockSignups: (BattleSignup & { profile: Profile })[] = mockProfiles.slice(0, 8).map((p, i) => ({
  id: `s${i + 1}`, event_id: 'e1', user_id: p.user_id,
  nickname_snapshot: p.nickname, contact: `Discord: ${p.discord_username}`,
  intro: '可以全程参加', preferred_route: ['上路', '中路', '下路', '机动', '无偏好'][i % 5],
  preferred_roles: [['人墙防守'], ['守塔'], ['打野'], ['冲锋突破'], ['搬运'], ['机动支援'], ['打野', '冲锋突破'], ['守塔', '人墙防守']][i],
  note: null, created_at: '2025-03-21', updated_at: '2025-03-21',
  profile: p,
}));

export const mockAssignments: (BattleAssignment & { profile: Profile })[] = [
  { id: 'a1', event_id: 'e1', user_id: 'u1', team_number: 1, assigned_role: '冲锋突破', map_zone: 'zone-top-lane', map_x: 42, map_y: 18, is_substitute: false, admin_note: '指挥位', updated_by: 'u1', updated_at: '', profile: mockProfiles[0], signup: undefined },
  { id: 'a2', event_id: 'e1', user_id: 'u4', team_number: 1, assigned_role: '冲锋突破', map_zone: 'zone-top-lane', map_x: 58, map_y: 20, is_substitute: false, admin_note: '', updated_by: 'u1', updated_at: '', profile: mockProfiles[3], signup: undefined },
  { id: 'a3', event_id: 'e1', user_id: 'u6', team_number: 1, assigned_role: '打野', map_zone: 'zone-wild-red-1', map_x: 30, map_y: 36, is_substitute: false, admin_note: '', updated_by: 'u1', updated_at: '', profile: mockProfiles[5], signup: undefined },
  { id: 'a4', event_id: 'e1', user_id: 'u8', team_number: 1, assigned_role: '打野', map_zone: 'zone-wild-blue-1', map_x: 73, map_y: 36, is_substitute: false, admin_note: '', updated_by: 'u1', updated_at: '', profile: mockProfiles[7], signup: undefined },
  { id: 'a5', event_id: 'e1', user_id: 'u2', team_number: 1, assigned_role: '机动支援', map_zone: 'zone-mid-lane', map_x: 50, map_y: 50, is_substitute: false, admin_note: '副指挥', updated_by: 'u1', updated_at: '', profile: mockProfiles[1], signup: undefined },
  { id: 'a6', event_id: 'e1', user_id: 'u3', team_number: 2, assigned_role: '搬运', map_zone: 'zone-red-base', map_x: 9, map_y: 50, is_substitute: false, admin_note: '', updated_by: 'u1', updated_at: '', profile: mockProfiles[2], signup: undefined },
  { id: 'a7', event_id: 'e1', user_id: 'u5', team_number: 4, assigned_role: '守塔', map_zone: 'zone-red-tower-bot', map_x: 24, map_y: 72, is_substitute: false, admin_note: '', updated_by: 'u1', updated_at: '', profile: mockProfiles[4], signup: undefined },
  { id: 'a8', event_id: 'e1', user_id: 'u7', team_number: 4, assigned_role: '人墙防守', map_zone: 'zone-bot-lane', map_x: 50, map_y: 84, is_substitute: false, admin_note: '', updated_by: 'u1', updated_at: '', profile: mockProfiles[6], signup: undefined },
];

export const mockNotices: Notice[] = [
  { id: 'n1', title: '第三十二届百业战报名开启', type: 'event', summary: '月冕 vs 风雷阁，3月29日晚8点开战', content: '# 第三十二届百业战\n\n**对手：风雷阁**\n\n比赛时间：3月29日 20:00\n报名截止：3月28日 18:00\n\n请各位成员尽快完成报名，管理层将根据报名情况进行分队。', is_pinned: true, created_by: 'u1', created_at: '2026-03-20T10:00:00Z', updated_at: '2026-03-20T10:00:00Z' },
  { id: 'n2', title: '百业好声音第二季启动', type: 'activity', summary: '月冕内部K歌赛开始报名', content: '# 百业好声音 第二季\n\n上一季大家玩得很开心，这次我们继续！\n\n报名时间：即日起至4月5日\n比赛形式：线上K歌对决', is_pinned: true, created_by: 'u10', created_at: '2026-03-18T14:00:00Z', updated_at: '2026-03-18T14:00:00Z' },
  { id: 'n3', title: '新成员招募公告', type: 'recruit', summary: '月冕总坛长期招募新成员', content: '月冕总坛面向全服招募活跃成员，有意者请联系外交使夜阑珊。', is_pinned: true, created_by: 'u1', created_at: '2026-03-15T09:00:00Z', updated_at: '2026-03-15T09:00:00Z' },
  { id: 'n4', title: '第三十一届百业战复盘', type: 'review', summary: '月冕 vs 天机阁 胜利复盘', content: '恭喜月冕以3:1战胜天机阁！本次战术执行优秀，特别表扬一队和四队的配合。', is_pinned: false, created_by: 'u2', created_at: '2026-03-14T22:00:00Z', updated_at: '2026-03-14T22:00:00Z' },
  { id: 'n5', title: '本周副本安排', type: 'daily', summary: '周三周六10人本，周日5人本', content: '本周副本时间安排如下：\n- 周三 21:00 十人本\n- 周六 20:00 十人本\n- 周日 15:00 五人本', is_pinned: false, created_by: 'u5', created_at: '2026-03-12T08:00:00Z', updated_at: '2026-03-12T08:00:00Z' },
  { id: 'n6', title: '百业战战术调整通知', type: 'tactic', summary: '针对下周对手调整防守策略', content: '根据风雷阁的战术特点，我们将调整防守阵型，详见战术频道。', is_pinned: false, created_by: 'u2', created_at: '2026-03-10T16:00:00Z', updated_at: '2026-03-10T16:00:00Z' },
];

export const mockRelations: MemberRelation[] = [
  { id: 'r1', from_user_id: 'u1', to_user_id: 'u2', relation_type: 'xiayuan', label: '侠缘', line_color: null, group_name: null, created_by: 'u1', created_at: '' },
  { id: 'r2', from_user_id: 'u4', to_user_id: 'u6', relation_type: 'xiayuan', label: '侠缘', line_color: null, group_name: null, created_by: 'u1', created_at: '' },
  { id: 'r3', from_user_id: 'u1', to_user_id: 'u3', relation_type: 'jieyi', label: '结义', line_color: null, group_name: null, created_by: 'u1', created_at: '' },
  { id: 'r4', from_user_id: 'u1', to_user_id: 'u5', relation_type: 'jieyi', label: '结义', line_color: null, group_name: null, created_by: 'u1', created_at: '' },
  { id: 'r5', from_user_id: 'u3', to_user_id: 'u5', relation_type: 'jieyi', label: '结义', line_color: null, group_name: null, created_by: 'u1', created_at: '' },
  { id: 'r6', from_user_id: 'u2', to_user_id: 'u9', relation_type: 'shifu', label: '师父', line_color: null, group_name: null, created_by: 'u1', created_at: '' },
  { id: 'r7', from_user_id: 'u1', to_user_id: 'u7', relation_type: 'tudi', label: '徒弟', line_color: null, group_name: null, created_by: 'u1', created_at: '' },
  { id: 'r8', from_user_id: 'u1', to_user_id: 'u8', relation_type: 'tudi', label: '徒弟', line_color: null, group_name: null, created_by: 'u1', created_at: '' },
  { id: 'r9', from_user_id: 'u5', to_user_id: 'u10', relation_type: 'jieyi', label: '结义', line_color: null, group_name: null, created_by: 'u1', created_at: '' },
];

export const mockActivityRecords: ActivityRecord[] = [
  { id: 'ar1', title: '第三十一届百业战 · 月冕 vs 天机阁', type: '百业战', description: '激烈对战，最终以3:1取胜', result: '胜利', cover_url: null, activity_date: '2026-03-14', created_by: 'u1', created_at: '' },
  { id: 'ar2', title: '百业好声音 第一季总决赛', type: '特色活动', description: '逐浪获得冠军', result: '圆满完成', cover_url: null, activity_date: '2026-03-08', created_by: 'u10', created_at: '' },
  { id: 'ar3', title: '第三十届百业战 · 月冕 vs 苍云盟', type: '百业战', description: '苦战五局惜败', result: '失败', cover_url: null, activity_date: '2026-03-01', created_by: 'u1', created_at: '' },
  { id: 'ar4', title: '十人本 · 风暴深渊首通', type: '日常活动', description: '月冕首次通关风暴深渊', result: '通关', cover_url: null, activity_date: '2026-02-25', created_by: 'u2', created_at: '' },
  { id: 'ar5', title: '百业麻将赛 第一届', type: '特色活动', description: '小鱼干意外夺冠', result: '圆满完成', cover_url: null, activity_date: '2026-02-20', created_by: 'u10', created_at: '' },
];
