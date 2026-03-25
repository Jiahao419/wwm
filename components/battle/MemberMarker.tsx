'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface MemberMarkerProps {
  id: string;
  nickname: string;
  avatarChar: string;
  teamNumber: number | null;
  role: string | null;
  color: string;
  isSubstitute: boolean;
  x: number;
  y: number;
  draggable?: boolean;
  onDragEnd?: (id: string, clientX: number, clientY: number) => void;
}

export default function MemberMarker({
  id,
  nickname,
  avatarChar,
  teamNumber,
  role,
  color,
  isSubstitute,
  x,
  y,
  draggable = false,
  onDragEnd,
}: MemberMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable) return;
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      setHovered(false);
    },
    [draggable]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Convert to percentage relative to the parent overlay
      const parent = markerRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const px = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const py = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setDragPos({ x: px, y: py });
    };

    const handleMouseUp = (e: MouseEvent) => {
      setDragging(false);
      if (onDragEnd) {
        onDragEnd(id, e.clientX, e.clientY);
      }
      setDragPos(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, id, onDragEnd]);

  const posX = dragPos ? dragPos.x : x;
  const posY = dragPos ? dragPos.y : y;

  return (
    <div
      ref={markerRef}
      className={`absolute -translate-x-1/2 -translate-y-1/2 group ${
        draggable ? 'cursor-grab' : 'cursor-pointer'
      } ${dragging ? 'cursor-grabbing z-50' : ''}`}
      style={{
        left: `${posX}%`,
        top: `${posY}%`,
        transition: dragging ? 'none' : 'left 0.2s ease, top 0.2s ease',
      }}
      onMouseEnter={() => !dragging && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={handleMouseDown}
    >
      {/* Marker circle */}
      <div
        className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold transition-transform ${
          !dragging ? 'group-hover:scale-125' : 'scale-125'
        } ${isSubstitute ? 'border-dashed' : ''}`}
        style={{
          backgroundColor: `${color}20`,
          border: `2px ${isSubstitute ? 'dashed' : 'solid'} ${color}`,
          color: color,
          boxShadow: dragging ? `0 0 12px ${color}60` : 'none',
        }}
      >
        {avatarChar}
      </div>

      {/* Tooltip */}
      {hovered && !dragging && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-bg-panel border border-gold/20 rounded-sm whitespace-nowrap z-10 shadow-lg">
          <p className="text-text-primary text-xs font-bold">{nickname}</p>
          {teamNumber && (
            <p className="text-xs mt-0.5" style={{ color }}>
              {teamNumber}队 · {role || '未分配'}
            </p>
          )}
          {draggable && (
            <p className="text-text-secondary/40 text-[10px] mt-1">拖拽移动位置</p>
          )}
        </div>
      )}
    </div>
  );
}
