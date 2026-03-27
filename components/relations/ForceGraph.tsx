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

    const links: GraphLink[] = relations
      .filter(r => nodeIds.has(r.from_user_id) && nodeIds.has(r.to_user_id))
      .map(r => {
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

    return { nodes, links };
  }, [profiles, relations]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = node.size || 12;
    const avatarR = r + 4; // slightly bigger for avatar
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

  // Adjust force simulation for better spacing
  const nodeCount = graphData.nodes.length;
  useEffect(() => {
    if (!graphRef.current) return;
    const fg = graphRef.current;
    // Increase link distance based on node count
    const dist = Math.max(100, Math.min(250, nodeCount * 10));
    fg.d3Force('link')?.distance(() => dist);
    // Stronger repulsion to spread nodes apart
    fg.d3Force('charge')?.strength(-400);
    fg.d3ReheatSimulation();
  }, [nodeCount]);

  return (
    <div ref={containerRef} className="w-full h-[600px] bg-bg-secondary gold-border rounded-sm overflow-hidden relative">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap pointer-events-none">
        {[
          { label: '侠缘', color: '#e05555', style: 'solid' },
          { label: '结义', color: '#c9a84c', style: 'solid' },
          { label: '师徒', color: '#55b0e0', style: 'dashed' },
        ].map(t => (
          <div key={t.label} className="flex items-center gap-1.5 px-2 py-1 bg-bg-primary/80 border border-gold/10 rounded-sm">
            <span
              className="w-4 h-[2px]"
              style={{
                backgroundColor: t.color,
                borderStyle: t.style === 'dashed' ? 'dashed' : 'solid',
                display: 'inline-block',
              }}
            />
            <span className="text-text-secondary text-[10px]">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 right-4 z-10 p-3 bg-bg-panel border border-gold/20 rounded-sm shadow-lg pointer-events-none">
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
        height={600}
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
