'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import GoldButton from '@/components/ui/GoldButton';
import NoticeCard from '@/components/notices/NoticeCard';
import NoticeModal from '@/components/notices/NoticeModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { getNotices, deleteNotice } from '@/lib/db';
import { mockNotices } from '@/lib/mockData';
import { NOTICE_TYPES } from '@/lib/constants';
import type { Notice } from '@/lib/types';

export default function NoticesPage() {
  const { isAdminOrOwner } = useAuth();
  const [activeType, setActiveType] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const fetchNotices = useCallback(async () => {
    try {
      const { data, error } = await getNotices();
      if (error || !data || data.length === 0) {
        setNotices(mockNotices);
        setUsingMock(true);
      } else {
        setNotices(data);
        setUsingMock(false);
      }
    } catch {
      setNotices(mockNotices);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const pinned = notices.filter(n => n.is_pinned);
  const filtered = notices.filter(n => {
    if (activeType && n.type !== activeType) return false;
    return true;
  });

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setShowModal(true);
  };

  const handleDelete = async (notice: Notice) => {
    if (!confirm(`确认删除公告「${notice.title}」？此操作不可撤销。`)) return;
    try {
      const { error } = await deleteNotice(notice.id);
      if (error) {
        console.error('Delete notice error:', error);
        alert(`删除失败：${error.message}`);
        return;
      }
      fetchNotices();
    } catch (err) {
      console.error('Failed to delete notice:', err);
      alert('删除失败，请检查权限。');
    }
  };

  const handleCreate = () => {
    setEditingNotice(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingNotice(null);
  };

  if (loading) {
    return (
      <>
        <PageHeader englishTitle="GUILD NOTICES" chineseTitle="公告檄文" />
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 pb-20 text-center text-text-secondary">
          加载中...
        </div>
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: 'url(/images/gonggao.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="fixed inset-0 z-0 bg-black/60" />

      <div className="relative z-10">
      <PageHeader
        englishTitle="GUILD NOTICES"
        chineseTitle="公告檄文"
      />

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 pb-20">
        {/* Admin create notice button */}
        {isAdminOrOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex justify-end mb-6"
          >
            <GoldButton variant="secondary" size="sm" onClick={handleCreate}>
              + 发布公告
            </GoldButton>
          </motion.div>
        )}

        {/* Pinned notices */}
        {pinned.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 space-y-4"
          >
            {pinned.map(notice => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                isPinned
                expanded={expandedId === notice.id}
                onToggle={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
                isAdminOrOwner={isAdminOrOwner && !usingMock}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}

        {/* Type filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          <button
            onClick={() => setActiveType(null)}
            className={`px-3 py-1.5 text-sm border rounded-sm transition-all ${
              activeType === null
                ? 'bg-gold/20 border-gold/50 text-gold'
                : 'border-gold/10 text-text-secondary hover:border-gold/30'
            }`}
          >
            全部
          </button>
          {NOTICE_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`px-3 py-1.5 text-sm border rounded-sm transition-all ${
                activeType === type.value
                  ? 'bg-gold/20 border-gold/50 text-gold'
                  : 'border-gold/10 text-text-secondary hover:border-gold/30'
              }`}
            >
              {type.label}
            </button>
          ))}
        </motion.div>

        {/* Notice list */}
        <div className="space-y-4">
          {filtered.map((notice, i) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <NoticeCard
                notice={notice}
                expanded={expandedId === notice.id}
                onToggle={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
                isAdminOrOwner={isAdminOrOwner && !usingMock}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Notice Modal (create / edit) */}
      <NoticeModal
        open={showModal}
        onClose={handleModalClose}
        onSaved={fetchNotices}
        notice={editingNotice}
      />
      </div>
    </div>
  );
}
