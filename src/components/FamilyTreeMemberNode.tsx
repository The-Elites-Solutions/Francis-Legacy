import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, MapPin, Heart } from 'lucide-react';
import { NodeProps, Handle, Position } from 'reactflow';

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

export interface FamilyTreeMemberNodeData {
  member: FamilyMember;
  onNodeClick: (memberId: string) => void;
  onViewMember?: (memberId: string) => void;
  isClicked?: boolean;
  isMonitorHighlighted?: boolean;
  generation?: number;
  familyGroupId?: string;
}

const FamilyTreeMemberNode: React.FC<NodeProps<FamilyTreeMemberNodeData>> = ({ data }) => {
  const { member, onNodeClick, onViewMember, isClicked, isMonitorHighlighted, generation } = data;
  const [isHovered, setIsHovered] = useState(false);

  const getMemberName = () => `${member.first_name} ${member.last_name}`;
  
  const getInitials = () => {
    return `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`;
  };

  const getBirthYear = () => {
    if (!member.birth_date) return null;
    return new Date(member.birth_date).getFullYear();
  };

  const getDeathYear = () => {
    if (!member.death_date) return null;
    return new Date(member.death_date).getFullYear();
  };

  const getLifespan = () => {
    const birth = getBirthYear();
    const death = getDeathYear();
    if (birth && death) return `${birth} - ${death}`;
    if (birth) return `${birth} - Present`;
    return '';
  };

  const getGenerationColor = () => {
    if (!generation) return 'border-gray-300';
    switch (generation % 4) {
      case 0: return 'border-red-400';
      case 1: return 'border-blue-400';
      case 2: return 'border-green-400';
      case 3: return 'border-purple-400';
      default: return 'border-gray-300';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(member.id);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewMember) {
      onViewMember(member.id);
    }
  };

  return (
    <div className="relative">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: '#3b82f6', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#3b82f6', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#dc2626', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: '#dc2626', width: 8, height: 8 }}
      />

      <div 
        className={`family-tree-node cursor-pointer transition-all duration-200 ${getGenerationColor()} ${
          isMonitorHighlighted 
            ? 'ring-4 ring-yellow-400 ring-offset-2 shadow-xl animate-pulse scale-105' 
            : isClicked 
              ? 'ring-3 ring-yellow-500 ring-offset-2 shadow-lg' 
              : 'hover:shadow-lg hover:scale-105'
        }`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-generation={generation}
      >
        {/* Generation Indicator */}
        {generation !== undefined && (
          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
            {generation + 1}
          </div>
        )}

        {/* Gender Indicator */}
        {member.gender && (
          <div className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs text-white ${
            member.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'
          }`}>
            {member.gender === 'M' ? '♂' : '♀'}
          </div>
        )}

        {/* Avatar */}
        <div className="family-tree-node-avatar">
          <Avatar className="w-full h-full">
            <AvatarImage 
              src={member.profile_photo_url} 
              alt={getMemberName()}
            />
            <AvatarFallback className="family-tree-node-initials">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Name */}
        <div className="family-tree-node-name">
          {getMemberName()}
        </div>

        {/* Life span */}
        {getLifespan() && (
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center">
            <Calendar className="w-3 h-3 mr-1" />
            {getLifespan()}
          </div>
        )}

        {/* Occupation (on hover or click) */}
        {(isHovered || isClicked) && member.occupation && (
          <div className="text-xs text-gray-600 mt-1 text-center truncate px-2">
            {member.occupation}
          </div>
        )}

        {/* Birth place (on hover or click) */}
        {(isHovered || isClicked) && member.birth_place && (
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center truncate px-2">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{member.birth_place}</span>
          </div>
        )}
      </div>

      {/* View Icon - appears when node is clicked */}
      {isClicked && (
        <div className="absolute -top-2 -right-2 z-10">
          <Button
            size="sm"
            className="h-10 w-10 p-0 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white shadow-xl transition-all duration-200 hover:scale-110 border-2 border-white"
            onClick={handleViewClick}
            title="View full member details"
          >
            <Eye className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Hover tooltip */}
      {isHovered && !isClicked && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-20 whitespace-nowrap">
          Click to select • Double-click for details
        </div>
      )}
    </div>
  );
};

export default FamilyTreeMemberNode;