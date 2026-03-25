'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
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
  isSelected?: boolean;
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

const sizeMap = { small: 4, medium: 6, large: 8 };

export default function ForceGraph({ profiles, relations, selectedProfileId, viewMode: _viewMode, onNodeClick }: ForceGraphProps) {
  void _viewMode; // available for future use
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Use profile.id as node identifier (works for all profiles, including admin-created ones)
  const nodes: GraphNode[] = profiles.map(p => ({
    id: p.id,
    name: p.nickname,
    color: p.node_color || '#9a8a6a',
    size: sizeMap[p.node_size] || 6,
    val: sizeMap[p.node_size] || 6,
    isSelected: p.id === selectedProfileId,
    x: p.graph_x ? (p.graph_x / 100) * dimensions.width : undefined,
    y: p.graph_y ? (p.graph_y / 100) * dimensions.height : undefined,
  }));

  // Build a set of valid node IDs for filtering links
  const nodeIds = new Set(nodes.map(n => n.id));

  const links: GraphLink[] = relations
    .filter(r => nodeIds.has(r.from_user_id) && nodeIds.has(r.to_user_id))
    .map(r => {
      const relType = RELATION_TYPES.find(t => t.id === r.relation_type);
      return {
        source: r.from_user_id,
        target: r.to_user_id,
        type: r.relation_type,
        color: r.line_color || relType?.color || '#5a5a6a',
        label: relType?.label || r.label || undefined,
        dashes: relType?.style === 'dashed',
      };
    });

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = node.size || 6;
    const fontSize = Math.max(10 / globalScale, 2);
    const isSelected = node.isSelected;

    // Glow effect for selected node
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
      ctx.fillStyle = node.color + '15';
      ctx.fill();
      ctx.strokeStyle = node.color + '60';
      ctx.lineWidth = 2 / globalScale;
      ctx.setLineDash([3 / globalScale, 3 / globalScale]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = node.color + '30';
    ctx.fill();
    ctx.strokeStyle = node.color;
    ctx.lineWidth = (isSelected ? 2 : 1.5) / globalScale;
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Name label
    ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isSelected ? '#f0e6d0' : '#e8e0d0';
    ctx.fillText(node.name, node.x, node.y + r + 2);
  }, []);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const sx = link.source.x;
    const sy = link.source.y;
    const tx = link.target.x;
    const ty = link.target.y;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = link.color || '#5a5a6a';
    ctx.lineWidth = (link.dashes ? 0.8 : 1.2) / globalScale;
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
      const labelFontSize = Math.max(8 / globalScale, 1.5);
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

  return (
    <div ref={containerRef} className="w-full h-[600px] bg-bg-secondary gold-border rounded-sm overflow-hidden relative">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
        {RELATION_TYPES.map(t => (
          <div key={t.id} className="flex items-center gap-1.5 px-2 py-1 bg-bg-primary/80 border border-gold/10 rounded-sm">
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
        <div className="absolute top-4 right-4 z-10 p-3 bg-bg-panel border border-gold/20 rounded-sm shadow-lg">
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
        graphData={{ nodes, links }}
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size + 4, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeHover={(node: any) => setHoveredNode(node)}
        onNodeClick={(node: any) => onNodeClick?.(node.id)}
        backgroundColor="#0d0d14"
        linkDirectionalParticles={0}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
      />
    </div>
  );
}
