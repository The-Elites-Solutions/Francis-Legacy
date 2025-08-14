import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

interface FamilyTreeNodeProps {
  memberId: string;
  allMembers: FamilyMember[];
  onNodeClick: (memberId: string) => void;
  visited?: Set<string>;
}

const FamilyTreeNode: React.FC<FamilyTreeNodeProps> = ({
  memberId,
  allMembers,
  onNodeClick,
  visited = new Set()
}) => {
  // Prevent infinite recursion
  if (visited.has(memberId)) {
    return null;
  }

  const member = allMembers.find(m => m.id === memberId);
  if (!member) {
    return null;
  }

  // Add current member to visited set for recursion prevention
  const newVisited = new Set(visited);
  newVisited.add(memberId);

  // Helper functions
  const getMemberName = (member: FamilyMember) => `${member.first_name} ${member.last_name}`;

  const getSpouse = (member: FamilyMember) => {
    if (!member.spouse_id) return null;
    return allMembers.find(m => m.id === member.spouse_id);
  };

  const getChildren = (parentId: string, spouseId?: string) => {
    return allMembers.filter(m => 
      m.father_id === parentId || 
      m.mother_id === parentId ||
      (spouseId && (m.father_id === spouseId || m.mother_id === spouseId))
    );
  };

  // Get spouse and children
  const spouse = getSpouse(member);
  const children = getChildren(member.id, spouse?.id);

  // Render individual member node
  const renderMemberNode = (memberData: FamilyMember) => (
    <div 
      className="family-member-node"
      onClick={() => onNodeClick(memberData.id)}
    >
      <div className="member-avatar">
        <Avatar className="w-full h-full">
          <AvatarImage src={memberData.profile_photo_url} alt={getMemberName(memberData)} />
          <AvatarFallback className="member-avatar-fallback">
            {memberData.first_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="member-name">
        {getMemberName(memberData)}
      </div>
    </div>
  );

  // Calculate siblings horizontal line positioning
  const renderSiblingsConnection = () => {
    if (children.length <= 1) return null;

    const siblingCount = children.length;
    const totalWidth = (siblingCount - 1) * 8; // 8rem gap between siblings
    
    return (
      <div 
        className="siblings-horizontal"
        style={{
          width: `${totalWidth}rem`,
          left: `calc(50% - ${totalWidth / 2}rem)`
        }}
      />
    );
  };

  return (
    <div className="family-unit">
      {/* Parent(s) Section */}
      <div className="couple-container">
        {/* Main Member */}
        {renderMemberNode(member)}
        
        {/* Spouse Connection and Spouse Node */}
        {spouse && (
          <>
            <div className="spouse-connection" />
            {renderMemberNode(spouse)}
          </>
        )}
      </div>

      {/* Children Section */}
      {children.length > 0 && (
        <>
          {/* Vertical line down from parent(s) */}
          <div className="parent-child-vertical" />
          
          {/* Horizontal line connecting siblings */}
          {renderSiblingsConnection()}
          
          {/* Children Container */}
          <div className="children-container">
            {children.map((child, index) => (
              <div key={child.id} className="relative">
                {/* Individual vertical line to each child */}
                {children.length > 1 && (
                  <div className="sibling-vertical" />
                )}
                
                {/* Recursive render of child node */}
                <FamilyTreeNode
                  memberId={child.id}
                  allMembers={allMembers}
                  onNodeClick={onNodeClick}
                  visited={newVisited}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FamilyTreeNode;