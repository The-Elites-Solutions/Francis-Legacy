import React from 'react';
import {
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  BaseEdge,
  EdgeLabelRenderer,
} from 'reactflow';

// Parent-Child Edge (standard blue edge with arrow) - Public View Version
export const ParentChildEdgePublic: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
    offset: 20,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    />
  );
};

// Spouse Edge (double line in red/pink) - Public View Version
export const SpouseEdgePublic: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}) => {
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

  return (
    <>
      {/* First line of the double line */}
      <BaseEdge
        path={path1}
        style={{
          ...style,
          stroke: '#dc2626',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      />
      {/* Second line of the double line */}
      <BaseEdge
        path={path2}
        style={{
          ...style,
          stroke: '#dc2626',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      />
      {/* Heart symbol in the middle */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 16,
            pointerEvents: 'none',
          }}
          className="nodrag nopan"
        >
          <div className="text-red-500">💖</div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Edge type definitions for React Flow - Public View
export const edgeTypesPublic = {
  'parent-child': ParentChildEdgePublic,
  'spouse': SpouseEdgePublic,
};

export default edgeTypesPublic;