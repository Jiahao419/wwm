'use client';

import FloatingLeaves from '@/components/ui/FloatingLeaves';

export default function GlobalLeaves() {
  return (
    <div className="fixed inset-0 z-[1] pointer-events-none">
      <FloatingLeaves count={8} />
    </div>
  );
}
