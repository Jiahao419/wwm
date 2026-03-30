'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getFeedback } from '@/lib/db';
import FeedbackModal from './FeedbackModal';
import FeedbackAdmin from './FeedbackAdmin';

export default function FeedbackButton() {
  const { isAdminOrOwner } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    if (!isAdminOrOwner) return;
    const { data } = await getFeedback();
    if (data) {
      setPendingCount(data.filter((f) => f.status === 'pending').length);
    }
  }, [isAdminOrOwner]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  return (
    <>
      {/* Floating button - bottom left */}
      <div
        className="fixed bottom-5 left-5 z-[1000] flex flex-col items-center gap-1 select-none"
      >
        {/* Main feedback button - always opens submit modal */}
        <button
          onClick={() => setShowModal(true)}
          className="relative w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:scale-110"
          style={{
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
          title="提交反馈"
        >
          <span className="text-gold text-xl leading-none">&#x1F4EE;</span>
        </button>
        {/* Admin: extra button to view all feedback */}
        {isAdminOrOwner && (
          <button
            onClick={() => setShowAdmin(true)}
            className="relative text-[10px] text-text-secondary/50 hover:text-gold/60 transition-colors"
          >
            管理
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-3 min-w-[14px] h-[14px] px-0.5 rounded-full bg-cinnabar text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>
        )}
        {!isAdminOrOwner && (
          <span className="text-[10px] text-text-secondary/50">反馈</span>
        )}
      </div>

      {/* User feedback modal */}
      {showModal && (
        <FeedbackModal
          onClose={() => setShowModal(false)}
          onSubmitted={fetchPendingCount}
        />
      )}

      {/* Admin panel */}
      {showAdmin && (
        <FeedbackAdmin
          onClose={() => setShowAdmin(false)}
          onCountChange={(count) => setPendingCount(count)}
        />
      )}
    </>
  );
}
