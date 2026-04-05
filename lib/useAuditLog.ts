import { useAuth } from '@/components/providers/AuthProvider';
import { logAuditAction } from '@/lib/db';

export function useAuditLog() {
  const { user, profile } = useAuth();

  return (params: {
    action: string;
    category: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
  }) => {
    if (!user) return;
    logAuditAction({
      userId: user.id,
      userNickname: profile?.nickname || user.user_metadata?.full_name || '未知',
      ...params,
    });
  };
}
