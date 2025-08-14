import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2, Trash2, Link } from 'lucide-react';

export interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  maiden_name?: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  occupation?: string;
  biography?: string;
  profile_photo_url?: string;
  father_id?: string;
  mother_id?: string;
  spouse_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberNodeData {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onLink?: (memberId: string) => void;
}

const MemberNode: React.FC<NodeProps<MemberNodeData>> = ({ data, selected }) => {
  const { member, onEdit, onDelete, onLink } = data;
  const [showActions, setShowActions] = React.useState(false);

  const getMemberName = () => `${member.first_name} ${member.last_name}`;
  
  const getInitials = () => {
    return `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`;
  };

  return (
    <div 
      className={`relative bg-white border-2 rounded-lg shadow-lg transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{ width: 150, height: 150 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Connection Handles */}
      {/* Top handle for parent connections (target) */}
      <Handle
        type="target"
        position={Position.Top}
        id="parent"
        style={{
          background: '#3b82f6',
          width: 8,
          height: 8,
          border: '2px solid white',
          opacity: 0.7
        }}
        className="!top-0 !transform !-translate-y-1/2"
      />
      
      {/* Bottom handle for child connections (source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="child"
        style={{
          background: '#3b82f6',
          width: 8,
          height: 8,
          border: '2px solid white',
          opacity: 0.7
        }}
        className="!bottom-0 !transform !translate-y-1/2"
      />
      
      {/* Left handle for spouse connections */}
      <Handle
        type="source"
        position={Position.Left}
        id="spouse-left"
        style={{
          background: '#e11d48',
          width: 8,
          height: 8,
          border: '2px solid white',
          opacity: 0.7
        }}
        className="!left-0 !transform !-translate-x-1/2"
      />
      
      {/* Right handle for spouse connections */}
      <Handle
        type="target"
        position={Position.Right}
        id="spouse-right"
        style={{
          background: '#e11d48',
          width: 8,
          height: 8,
          border: '2px solid white',
          opacity: 0.7
        }}
        className="!right-0 !transform !translate-x-1/2"
      />

      {/* Node Content */}
      <div className="flex flex-col items-center justify-center h-full p-3">
        {/* Avatar - takes most of the space */}
        <Avatar className="w-16 h-16 mb-2">
          <AvatarImage src={member.profile_photo_url} alt={getMemberName()} />
          <AvatarFallback className="bg-gray-100 text-gray-700 text-lg font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {/* Name - truncated if needed */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {member.first_name}
          </p>
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {member.last_name}
          </p>
          {member.maiden_name && (
            <p className="text-xs text-gray-600 italic">
              née {member.maiden_name}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons - appear on hover */}
      {showActions && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          {onLink && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 bg-white shadow-md hover:bg-blue-50 text-blue-600 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onLink(member.id);
              }}
              title="Link to another member"
            >
              <Link className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 bg-white shadow-md hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(member);
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 bg-white shadow-md hover:bg-red-50 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(member);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(MemberNode);