import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { NodeProps } from 'reactflow';

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
}

const FamilyTreeMemberNode: React.FC<NodeProps<FamilyTreeMemberNodeData>> = ({ data }) => {
  const { member, onNodeClick, onViewMember, isClicked } = data;

  const getMemberName = () => `${member.first_name} ${member.last_name}`;
  
  const getInitials = () => {
    return `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`;
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
      <div 
        className={`family-tree-node cursor-pointer transition-all duration-200 ${
          isClicked ? 'ring-2 ring-yellow-500 ring-offset-2' : 'hover:shadow-lg'
        }`}
        onClick={handleClick}
      >
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
      </div>

      {/* View Icon - appears when node is clicked */}
      {isClicked && (
        <div className="absolute -top-2 -right-2 z-10">
          <Button
            size="sm"
            className="h-8 w-8 p-0 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg transition-all duration-200 hover:scale-110"
            onClick={handleViewClick}
            title="View member details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FamilyTreeMemberNode;