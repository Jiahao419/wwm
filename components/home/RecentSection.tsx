'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getBattleEvents, getNotices, getActivityRecords, createActivityRecord, updateActivityRecord, deleteActivityRecord } from '@/lib/db';
import { NOTICE_TYPES } from '@/lib/constants';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { BattleEvent, Notice, ActivityRecord } from '@/lib/types';
import GoldButton from '@/components/ui/GoldButton';

function getNoticeTypeLabel(type: string) {
  return NOTICE_TYPES.find(t => t.value === type)?.label || type;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const statusLabels: Record<string, { text: string; class: string }> = {
  upcoming: { text: '即将开始', class: 'bg-blue-900/30 text-blue-400' },
  active: { text: '进行中', class: 'bg-gold/20 text-gold' },
  closed: { text: '报名截止', class: 'bg-orange-900/30 text-orange-400' },
  finished: { text: '已结束', class: 'bg-bg-panel text-text-secondary' },
};

const ACTIVITY_TYPES = ['百业战', '副本', '特色活动', '日常活动', '公会活动'];
const RESULT_OPTIONS = ['胜利', '失败', '圆满完成', '通关', ''];

interface ActivityModalProps {
  record?: ActivityRecord | null;
  onClose: () => void;
  onSave: (data: Omit<ActivityRecord, 'id' | 'created_at' | 'created_by'>) => void;
}

function ActivityModal({ record, onClose, onSave }: ActivityModalProps) {
  const [title, setTitle] = useState(record?.title || '');
  const [type, setType] = useState(record?.type || '百业战');
  const [description, setDescription] = useState(record?.description || '');
  const [result, setResult] = useState(record?.result || '');
  const [activityDate, setActivityDate] = useState(record?.activity_date || new Date().toISOString().split('T')[0]);
  const [coverUrl, setCoverUrl] = useState(record?.cover_url || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `activities/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('gallery').upload(path, file, { upsert: true });
      if (error) { alert('上传失败: ' + error.message); setUploading(false); return; }
      const { data } = supabase.storage.from('gallery').getPublicUrl(path);
      setCoverUrl(data.publicUrl);
    } catch {
      alert('上传失败');
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) { alert('请输入标题'); return; }
    onSave({
      title: title.trim(),
      type: type || null,
      description: description.trim() || null,
      result: result || null,
      cover_url: coverUrl || null,
      activity_date: activityDate || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-panel border border-gold/20 rounded-sm p-6 w-[500px] max-h-[80vh] overflow-y-auto">
        <h3 className="font-title text-xl text-text-primary mb-5">{record ? '编辑活动记录' : '添加活动记录'}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">标题 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-bg-card border border-gold/10 px-3 py-2 text-text-primary text-sm focus:border-gold/40 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-xs mb-1.5">类型</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full bg-bg-card border border-gold/10 px-3 py-2 text-text-primary text-sm focus:border-gold/40 focus:outline-none">
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-text-secondary text-xs mb-1.5">日期</label>
              <input type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)}
                className="w-full bg-bg-card border border-gold/10 px-3 py-2 text-text-primary text-sm focus:border-gold/40 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-xs mb-1.5">描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full bg-bg-card border border-gold/10 px-3 py-2 text-text-primary text-sm focus:border-gold/40 focus:outline-none resize-none" />
          </div>

          <div>
            <label className="block text-text-secondary text-xs mb-1.5">结果</label>
            <div className="flex gap-2 flex-wrap">
              {RESULT_OPTIONS.map(r => (
                <button key={r || 'none'} onClick={() => setResult(r)}
                  className={`px-3 py-1 text-xs rounded-sm border transition-colors ${
                    result === r
                      ? 'border-gold/50 bg-gold/15 text-gold'
                      : 'border-gold/10 text-text-secondary hover:border-gold/30'
                  }`}>
                  {r || '无'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-xs mb-1.5">封面图</label>
            <div className="flex items-center gap-3">
              {coverUrl && (
                <img src={coverUrl} alt="" className="w-16 h-10 object-cover rounded border border-gold/10" />
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-xs border border-gold/20 text-text-secondary hover:text-gold hover:border-gold/40 px-3 py-1 transition-colors">
                {uploading ? '上传中...' : coverUrl ? '更换' : '上传'}
              </button>
              {coverUrl && (
                <button onClick={() => setCoverUrl('')}
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors">移除</button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <GoldButton variant="ghost" size="sm" onClick={onClose}>取消</GoldButton>
          <GoldButton variant="primary" size="sm" onClick={handleSubmit}>保存</GoldButton>
        </div>
      </div>
    </div>
  );
}

export default function RecentSection() {
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ActivityRecord | null>(null);
  const { isAdminOrOwner, user } = useAuth();

  const loadData = async () => {
    const [evtRes, noticeRes, actRes] = await Promise.all([
      getBattleEvents(),
      getNotices(),
      getActivityRecords(),
    ]);
    if (evtRes.data) setEvents(evtRes.data);
    if (noticeRes.data) setNotices(noticeRes.data);
    if (actRes.data) setActivities(actRes.data);
    setLoaded(true);
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleEdit = (record: ActivityRecord) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条活动记录？')) return;
    const { error } = await deleteActivityRecord(id);
    if (!error) {
      setActivities(prev => prev.filter(a => a.id !== id));
    } else {
      alert('删除失败');
    }
  };

  const handleSave = async (data: Omit<ActivityRecord, 'id' | 'created_at' | 'created_by'>) => {
    if (editingRecord) {
      const { error } = await updateActivityRecord(editingRecord.id, data);
      if (error) { alert('保存失败: ' + (error as any).message); return; }
    } else {
      const { error } = await createActivityRecord({ ...data, created_by: user?.id || '' });
      if (error) { alert('添加失败: ' + (error as any).message); return; }
    }
    setShowModal(false);
    await loadData();
  };

  const sortedEvents = [...events].sort((a, b) => {
    const order = { active: 0, upcoming: 1, closed: 2, finished: 3 };
    const oa = order[a.status] ?? 9;
    const ob = order[b.status] ?? 9;
    if (oa !== ob) return oa - ob;
    return new Date(b.battle_time || b.created_at).getTime() - new Date(a.battle_time || a.created_at).getTime();
  });
  const displayEvents = sortedEvents.slice(0, 3);
  const displayNotices = notices.slice(0, 3);
  const displayActivities = activities.slice(0, 6);

  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Two columns: Events + Notices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Left: Upcoming events */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-1">EVENTS</p>
                <h2 className="font-title text-2xl text-text-primary">近期赛程</h2>
              </div>
              <Link href="/battle" className="text-gold/60 text-sm hover:text-gold transition-colors">
                查看全部 →
              </Link>
            </div>
            <div className="space-y-4">
              {!loaded ? (
                <div className="p-5 bg-bg-card gold-border rounded-sm text-center">
                  <span className="text-text-secondary/50 text-sm">加载中...</span>
                </div>
              ) : displayEvents.length === 0 ? (
                <div className="p-5 bg-bg-card gold-border rounded-sm text-center">
                  <span className="text-text-secondary/50 text-sm">暂无赛程安排</span>
                </div>
              ) : (
                displayEvents.map(evt => {
                  const status = statusLabels[evt.status] || statusLabels.upcoming;
                  return (
                    <Link key={evt.id} href="/battle" className="block">
                      <div className="p-5 bg-bg-card gold-border rounded-sm hover:bg-bg-card/80 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${status.class}`}>{status.text}</span>
                          {evt.battle_time && (
                            <span className="text-text-secondary text-xs">{formatDate(evt.battle_time)}</span>
                          )}
                        </div>
                        <h3 className="text-text-primary font-title mb-1">{evt.title}</h3>
                        {evt.description && (
                          <p className="text-text-secondary text-sm line-clamp-2">{evt.description}</p>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Latest notices */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-1">NOTICES</p>
                <h2 className="font-title text-2xl text-text-primary">最新公告</h2>
              </div>
              <Link href="/notices" className="text-gold/60 text-sm hover:text-gold transition-colors">
                查看全部 →
              </Link>
            </div>
            <div className="space-y-4">
              {!loaded ? (
                <div className="p-5 bg-bg-card gold-border rounded-sm text-center">
                  <span className="text-text-secondary/50 text-sm">加载中...</span>
                </div>
              ) : displayNotices.length === 0 ? (
                <div className="p-5 bg-bg-card gold-border rounded-sm text-center">
                  <span className="text-text-secondary/50 text-sm">暂无公告</span>
                </div>
              ) : (
                displayNotices.map(notice => (
                  <Link key={notice.id} href="/notices" className="block">
                    <div className="p-5 bg-bg-card gold-border rounded-sm hover:bg-bg-card/80 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 text-xs bg-cinnabar/30 text-cinnabar-light rounded">
                          {getNoticeTypeLabel(notice.type)}
                        </span>
                        <span className="text-text-secondary text-xs">{formatDate(notice.created_at)}</span>
                        {notice.is_pinned && <span className="text-gold/60 text-xs">置顶</span>}
                      </div>
                      <h3 className="text-text-primary font-title text-sm">{notice.title}</h3>
                      {notice.summary && (
                        <p className="text-text-secondary text-xs mt-1 line-clamp-1">{notice.summary}</p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Activity Records */}
        <div>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div>
              <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-1 text-center">ACTIVITY LOG</p>
              <h2 className="font-title text-2xl text-text-primary text-center">近期活动记录</h2>
            </div>
            {isAdminOrOwner && (
              <button onClick={handleAdd}
                className="text-xs text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1 rounded-sm transition-colors">
                ＋ 添加
              </button>
            )}
          </div>

          {!loaded ? (
            <div className="text-center py-8">
              <span className="text-text-secondary/50 text-sm">加载中...</span>
            </div>
          ) : displayActivities.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-text-secondary/50 text-sm">暂无活动记录</span>
              {isAdminOrOwner && (
                <p className="text-text-secondary/30 text-xs mt-2">点击上方 添加 按钮添加第一条记录</p>
              )}
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
              {displayActivities.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="min-w-[280px] bg-bg-card gold-border-hover rounded-sm flex-shrink-0 overflow-hidden group relative"
                >
                  {/* Cover image */}
                  {record.cover_url && (
                    <div className="h-[140px] overflow-hidden">
                      <img src={record.cover_url} alt={record.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 text-xs bg-bg-panel text-text-secondary rounded">{record.type}</span>
                      <span className="text-text-secondary/50 text-xs">{record.activity_date}</span>
                    </div>
                    <h3 className="text-text-primary text-sm font-title mb-2 line-clamp-2">{record.title}</h3>
                    {record.description && (
                      <p className="text-text-secondary text-xs mb-2 line-clamp-2">{record.description}</p>
                    )}
                    {record.result && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        record.result === '胜利' ? 'bg-green-900/30 text-green-400' :
                        record.result === '失败' ? 'bg-red-900/30 text-red-400' :
                        'bg-gold/10 text-gold/70'
                      }`}>
                        {record.result}
                      </span>
                    )}
                  </div>

                  {/* Admin actions overlay */}
                  {isAdminOrOwner && (
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(record)}
                        className="w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-gold/20 hover:border-gold/50 text-gold/70 hover:text-gold rounded-full text-xs transition-all">
                        ✎
                      </button>
                      <button onClick={() => handleDelete(record.id)}
                        className="w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-red-500/20 hover:border-red-400/50 text-red-400/70 hover:text-red-400 rounded-full text-xs transition-all">
                        ✕
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <ActivityModal
            record={editingRecord}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
