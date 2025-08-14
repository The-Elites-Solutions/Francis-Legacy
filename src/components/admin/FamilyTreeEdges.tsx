import React from 'react';
import {
  EdgeProps,
  getBezierPath,
  getStraightPath,
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// Parent-Child Edge (standard blue edge with arrow)
export const ParentChildEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd
}) => {
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
    if (data?.onDelete) {
      data.onDelete();
    } else {
      deleteElements({ edges: [{ id }] });
    }
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#3b82f6',
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <Button
            size="sm"
            variant="outline"
            className="h-5 w-5 p-0 bg-white shadow-sm opacity-0 hover:opacity-100 transition-opacity"
            onClick={onEdgeClick}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Spouse Edge (double line in red/pink)
export const SpouseEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data
}) => {
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  // Calculate parallel paths for double line effect
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / length;
  const unitY = dy / length;
  
  // Perpendicular vector for offset
  const perpX = -unitY * 3; // 3px offset
  const perpY = unitX * 3;

  const [path1] = getStraightPath({
    sourceX: sourceX + perpX,
    sourceY: sourceY + perpY,
    targetX: targetX + perpX,
    targetY: targetY + perpY,
  });

  const [path2] = getStraightPath({
    sourceX: sourceX - perpX,
    sourceY: sourceY - perpY,
    targetX: targetX - perpX,
    targetY: targetY - perpY,
  });

  const onEdgeClick = () => {
    if (data?.onDelete) {
      data.onDelete();
    } else {
      deleteElements({ edges: [{ id }] });
    }
  };

  return (
    <>
      {/* First line of the double line */}
      <BaseEdge
        path={path1}
        style={{
          ...style,
          stroke: '#e11d48',
          strokeWidth: 2,
        }}
      />
      {/* Second line of the double line */}
      <BaseEdge
        path={path2}
        style={{
          ...style,
          stroke: '#e11d48',
          strokeWidth: 2,
        }}
      />
      {/* Heart symbol in the middle */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="flex items-center gap-1">
            <div className="text-red-500 text-sm">💖</div>
            <Button
              size="sm"
              variant="outline"
              className="h-5 w-5 p-0 bg-white shadow-sm opacity-0 hover:opacity-100 transition-opacity"
              onClick={onEdgeClick}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Edge type definitions for React Flow
export const edgeTypes = {
  'parent-child': ParentChildEdge,
  'spouse': SpouseEdge,
};

export default edgeTypes;