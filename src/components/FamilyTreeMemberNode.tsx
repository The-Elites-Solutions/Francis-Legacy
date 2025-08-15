import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, MapPin, Heart, User, Briefcase } from 'lucide-react';
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
  gender?: string;
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

const FamilyTreeMemberNode: React.FC<NodeProps<FamilyTreeMemberNodeData>> = ({ data, selected }) => {
  const { member, onNodeClick, onViewMember, isClicked, isMonitorHighlighted, generation } = data;
  const [showActions, setShowActions] = useState(false);

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
    <div 
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Connection Handles with gold styling */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ 
          background: '#eab308', 
          width: 10, 
          height: 10,
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        className="!top-0 !transform !-translate-y-1/2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ 
          background: '#eab308', 
          width: 10, 
          height: 10,
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        className="!bottom-0 !transform !translate-y-1/2"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ 
          background: '#f59e0b', 
          width: 10, 
          height: 10,
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        className="!right-0 !transform !translate-x-1/2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ 
          background: '#f59e0b', 
          width: 10, 
          height: 10,
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        className="!left-0 !transform !-translate-x-1/2"
      />

      {/* Main Node Card with Gold Theme */}
      <div 
        className={`relative bg-white rounded-lg shadow-lg transition-all duration-300 cursor-pointer
          border-2 border-yellow-600/30 hover:border-yellow-600/60
          ${isMonitorHighlighted 
            ? 'ring-4 ring-yellow-400 ring-offset-2 shadow-2xl scale-110' 
            : selected 
              ? 'ring-3 ring-yellow-500 ring-offset-2 shadow-xl scale-105' 
              : isClicked
                ? 'ring-2 ring-yellow-400 ring-offset-1 shadow-lg'
                : 'hover:shadow-xl hover:scale-105'
          }`}
        style={{ 
          width: 150, 
          height: 150,
          background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
          borderImage: 'linear-gradient(135deg, #eab308, #f59e0b, #eab308) 1'
        }}
        onClick={handleClick}
      >
        {/* Gold accent strip at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-t-lg" />
        
        {/* Content Container */}
        <div className="p-3 flex flex-col items-center justify-center h-full">
          {/* Avatar with gold ring */}
          <Avatar className="w-16 h-16 ring-2 ring-yellow-400/50 mb-2">
            <AvatarImage 
              src={member.profile_photo_url} 
              alt={getMemberName()}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-900 font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          {/* Name */}
          <h3 className="text-xs font-semibold text-gray-800 text-center line-clamp-1">
            {getMemberName()}
          </h3>

          {/* Lifespan */}
          {getLifespan() && (
            <p className="text-xs text-gray-600 mt-0.5">
              {getLifespan()}
            </p>
          )}

          {/* Occupation (if available and space permits) */}
          {member.occupation && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">
              {member.occupation}
            </p>
          )}
        </div>

        {/* Gender Badge */}
        {member.gender && (
          <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-sm
            ${member.gender === 'M' 
              ? 'bg-blue-100 text-blue-600 border border-blue-300' 
              : 'bg-pink-100 text-pink-600 border border-pink-300'
            }`}>
            {member.gender === 'M' ? '♂' : '♀'}
          </div>
        )}

        {/* Generation Badge */}
        {generation !== undefined && (
          <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 
            border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-md">
            G{generation + 1}
          </div>
        )}

        {/* View Action Button - shows on hover or when clicked */}
        {(showActions || isClicked) && onViewMember && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200">
            <Button
              size="sm"
              variant="default"
              onClick={handleViewClick}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 
                text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200
                px-3 py-1 h-7 text-xs font-semibold"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyTreeMemberNode;