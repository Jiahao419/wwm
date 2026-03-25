'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import type { Profile } from '@/lib/types';

interface RoleGuardProps {
  roles: Profile['role'][];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (!profile || !roles.includes(profile.role)) return <>{fallback}</>;

  return <>{children}</>;
}
