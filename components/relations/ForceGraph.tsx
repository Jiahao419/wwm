'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Profile, MemberRelation } from '@/lib/types';
import { RELATION_TYPES } from '@/lib/constants';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface ForceGraphProps {
  profiles: Profile[];
  relations: MemberRelation[];
  selectedProfileId?: string | null;
  viewMode: 'individual' | 'global';
  onNodeClick?: (profileId: string) => void;
}

interface GraphNode {
  id: string;
  name: string;
  color: string;
  size: number;
  val: number;
  avatarUrl?: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  color: string;
  label?: string;
  dashes?: boolean;
}

const sizeMap = { small: 8, medium: 12, large: 16 };

export default function ForceGraph({ profiles, relations, selectedProfileId, viewMode: _viewMode, onNodeClick }: ForceGraphProps) {
  void _viewMode;
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hideJieyi, setHideJieyi] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarCacheRef = useRef<Map<string, HTMLImageElement | null>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(entry.contentRect.height, 500),
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Preload avatar images
  useEffect(() => {
    profiles.forEach(p => {
      const url = p.avatar_url;
      if (url && !avatarCacheRef.current.has(url)) {
        avatarCacheRef.current.set(url, null); // mark as loading
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          avatarCacheRef.current.set(url, img);
        };
        img.onerror = () => {
          avatarCacheRef.current.set(url, null);
        };
        img.src = url;
      }
    });
  }, [profiles]);

  // Memoize graph data so the force simulation doesn't restart on every render
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = profiles.map(p => ({
      id: p.id,
      name: p.nickname,
      color: p.node_color || '#9a8a6a',
      size: sizeMap[p.node_size] || 12,
      val: sizeMap[p.node_size] || 12,
      avatarUrl: p.avatar_url || undefined,
    }));

    const nodeIds = new Set(nodes.map(n => n.id));

    // 同一对人之间只保留优先级最高的关系线：侠缘 > 师徒 > 结义
    const priorityMap: Record<string, number> = { xiayuan: 0, shifu: 1, tudi: 1, jieyi: 2 };
    const pairBest = new Map<string, typeof relations[0]>();

    relations
      .filter(r => nodeIds.has(r.from_user_id) && nodeIds.has(r.to_user_id))
      .forEach(r => {
        const pairKey = [r.from_user_id, r.to_user_id].sort().join('|');
        const existing = pairBest.get(pairKey);
        const rPriority = priorityMap[r.relation_type] ?? 99;
        const ePriority = existing ? (priorityMap[existing.relation_type] ?? 99) : 99;
        if (!existing || rPriority < ePriority) {
          pairBest.set(pairKey, r);
        }
      });

    const links: GraphLink[] = Array.from(pairBest.values()).map(r => {
      const relType = RELATION_TYPES.find(t => t.id === r.relation_type);
      const isMasterApprentice = r.relation_type === 'shifu' || r.relation_type === 'tudi';
      return {
        source: r.from_user_id,
        target: r.to_user_id,
        type: r.relation_type,
        color: r.line_color || relType?.color || '#5a5a6a',
        label: isMasterApprentice ? '师徒' : (relType?.label || r.label || undefined),
        dashes: relType?.style === 'dashed',
      };
    });

    const filteredLinks = hideJieyi ? links.filter(l => l.type !== 'jieyi') : links;
    return { nodes, links: filteredLinks };
  }, [profiles, relations, hideJieyi]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = node.size || 12;
    const avatarR = r; // avatar same size as node
    const fontSize = Math.max(11 / globalScale, 2.5);
    const isSelected = node.id === selectedProfileId;
    const avatarImg = node.avatarUrl ? avatarCacheRef.current.get(node.avatarUrl) : null;

    // Glow effect for selected node
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, avatarR + 6, 0, 2 * Math.PI);
      ctx.fillStyle = node.color + '18';
      ctx.fill();
      ctx.strokeStyle = node.color + '70';
      ctx.lineWidth = 2.5 / globalScale;
      ctx.setLineDash([4 / globalScale, 4 / globalScale]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (avatarImg) {
      // Draw avatar as circular image
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, avatarR, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(avatarImg, node.x - avatarR, node.y - avatarR, avatarR * 2, avatarR * 2);
      ctx.restore();

      // Border ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, avatarR, 0, 2 * Math.PI);
      ctx.strokeStyle = isSelected ? '#c9a84c' : node.color;
      ctx.lineWidth = (isSelected ? 2.5 : 1.5) / globalScale;
      ctx.stroke();
    } else {
      // Fallback: original circle style
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.color + '30';
      ctx.fill();
      ctx.strokeStyle = node.color;
      ctx.lineWidth = (isSelected ? 2.5 : 1.8) / globalScale;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.35, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
    }

    // Name label
    ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isSelected ? '#f0e6d0' : '#e8e0d0';
    ctx.fillText(node.name, node.x, node.y + avatarR + 3);
  }, [selectedProfileId]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const sx = link.source.x;
    const sy = link.source.y;
    const tx = link.target.x;
    const ty = link.target.y;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = link.color || '#5a5a6a';
    ctx.lineWidth = (link.dashes ? 1 : 1.5) / globalScale;
    if (link.dashes) {
      ctx.setLineDash([4 / globalScale, 4 / globalScale]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Link label at midpoint
    if (link.label) {
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      const labelFontSize = Math.max(9 / globalScale, 1.5);
      ctx.font = `${labelFontSize}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Background
      const textWidth = ctx.measureText(link.label).width;
      ctx.fillStyle = '#0d0d14cc';
      ctx.fillRect(mx - textWidth / 2 - 2 / globalScale, my - labelFontSize / 2 - 1 / globalScale, textWidth + 4 / globalScale, labelFontSize + 2 / globalScale);

      // Text
      ctx.fillStyle = link.color || '#8a8a9a';
      ctx.fillText(link.label, mx, my);
    }
  }, []);

  // Handle node click
  const onNodeClickRef = useRef(onNodeClick);
  onNodeClickRef.current = onNodeClick;

  const handleNodeClick = useCallback((node: any) => {
    onNodeClickRef.current?.(node.id);
  }, []);

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node || null);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Adjust force simulation for better spacing
  const nodeCount = graphData.nodes.length;
  const linkCount = graphData.links.length;
  useEffect(() => {
    if (!graphRef.current) return;
    const fg = graphRef.current;
    // 有关系的人之间拉开距离
    const dist = Math.max(400, 300 + linkCount * 15);
    fg.d3Force('link')?.distance(() => dist);
    // 强排斥力，把节点推得更开
    fg.d3Force('charge')?.strength(-500);
    fg.d3ReheatSimulation();
  }, [nodeCount, linkCount]);

  return (
    <div ref={containerRef} className={`w-full bg-bg-secondary gold-border rounded-sm overflow-hidden relative ${isFullscreen ? 'h-screen' : 'h-[450px] md:h-[750px]'}`}>
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
        {[
          { label: '侠缘', color: '#e05555', style: 'solid', key: 'xiayuan' },
          { label: '结义', color: '#c9a84c', style: 'solid', key: 'jieyi' },
          { label: '师徒', color: '#55b0e0', style: 'dashed', key: 'shitu' },
        ].map(t => (
          <button
            key={t.label}
            onClick={t.key === 'jieyi' ? () => setHideJieyi(h => !h) : undefined}
            className={`flex items-center gap-1.5 px-2 py-1 bg-bg-primary/80 border rounded-sm transition-all ${
              t.key === 'jieyi' ? 'cursor-pointer hover:border-gold/30' : 'pointer-events-none'
            } ${t.key === 'jieyi' && hideJieyi ? 'border-gold/5 opacity-40' : 'border-gold/10'}`}
          >
            <span
              className="w-4 h-[2px]"
              style={{
                backgroundColor: t.color,
                borderStyle: t.style === 'dashed' ? 'dashed' : 'solid',
                display: 'inline-block',
              }}
            />
            <span className="text-text-secondary text-[9px] md:text-[10px]">
              {t.label}{t.key === 'jieyi' ? (hideJieyi ? ' (已隐藏)' : ' (点击隐藏)') : ''}
            </span>
          </button>
        ))}
      </div>

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-bg-primary/80 border border-gold/10 hover:border-gold/30 rounded-sm text-text-secondary text-[10px] transition-all hover:text-gold flex items-center gap-1.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {isFullscreen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          )}
        </svg>
        {isFullscreen ? '退出全屏' : '全屏'}
      </button>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute top-14 right-4 z-10 p-3 bg-bg-panel border border-gold/20 rounded-sm shadow-lg pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: hoveredNode.color }} />
            <span className="text-text-primary text-sm font-title">{hoveredNode.name}</span>
          </div>
          <p className="text-text-secondary text-xs">
            {profiles.find(p => p.id === hoveredNode.id)?.identity || '成员'}
          </p>
        </div>
      )}

      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, (node.size || 12) + 10, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        backgroundColor="#0d0d14"
        linkDirectionalParticles={0}
        warmupTicks={50}
        cooldownTicks={30}
        d3AlphaDecay={0.04}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        minZoom={0.5}
        maxZoom={5}
      />
    </div>
  );
}
