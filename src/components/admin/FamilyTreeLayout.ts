import { Node, Edge } from 'reactflow';
import { FamilyMember, MemberNodeData } from './MemberNode';

interface TreeNode {
  member: FamilyMember;
  children: TreeNode[];
  spouse?: FamilyMember;
  level: number;
  x: number;
  y: number;
  subtreeWidth: number;
}

const NODE_WIDTH = 150;
const NODE_HEIGHT = 150;
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 120;
const SPOUSE_SPACING = 200;

export class ReactFlowFamilyTreeLayout {
  private members: FamilyMember[];
  private memberMap: Map<string, FamilyMember>;

  constructor(members: FamilyMember[]) {
    this.members = members;
    this.memberMap = new Map(members.map(m => [m.id, m]));
  }

  /**
   * Generate React Flow nodes and edges from family member data
   */
  generateNodesAndEdges(
    onEdit: (member: FamilyMember) => void,
    onDelete: (member: FamilyMember) => void,
    onLink?: (memberId: string) => void
  ): { nodes: Node<MemberNodeData>[]; edges: Edge[] } {
    const positions = this.calculateLayout();
    const nodes = this.createNodes(positions, onEdit, onDelete, onLink);
    const edges = this.createEdges();

    return { nodes, edges };
  }

  /**
   * Calculate hierarchical layout for family tree
   */
  private calculateLayout(): Record<string, { x: number; y: number }> {
    const rootMembers = this.findRootMembers();
    const trees = rootMembers.map(root => this.buildTree(root));
    
    return this.positionTrees(trees);
  }

  /**
   * Find members who are roots (no parents)
   */
  private findRootMembers(): FamilyMember[] {
    return this.members.filter(member => 
      !member.father_id && !member.mother_id
    );
  }

  /**
   * Build a tree structure starting from a root member
   */
  private buildTree(rootMember: FamilyMember, level: number = 0, visited: Set<string> = new Set()): TreeNode {
    if (visited.has(rootMember.id)) {
      return {
        member: rootMember,
        children: [],
        level,
        x: 0,
        y: 0,
        subtreeWidth: NODE_WIDTH
      };
    }
    
    visited.add(rootMember.id);
    
    const children = this.findChildren(rootMember.id)
      .map(child => this.buildTree(child, level + 1, new Set(visited)));
    
    const spouse = rootMember.spouse_id ? this.memberMap.get(rootMember.spouse_id) : undefined;
    
    const node: TreeNode = {
      member: rootMember,
      children,
      spouse,
      level,
      x: 0,
      y: level * (NODE_HEIGHT + VERTICAL_SPACING),
      subtreeWidth: 0
    };

    node.subtreeWidth = this.calculateSubtreeWidth(node);
    
    return node;
  }

  /**
   * Find all children of a given member
   */
  private findChildren(memberId: string): FamilyMember[] {
    return this.members.filter(member => 
      member.father_id === memberId || member.mother_id === memberId
    );
  }

  /**
   * Calculate the width needed for a subtree
   */
  private calculateSubtreeWidth(node: TreeNode): number {
    if (node.children.length === 0) {
      return NODE_WIDTH + (node.spouse ? SPOUSE_SPACING : 0);
    }

    const childrenWidth = node.children.reduce((sum, child) => sum + child.subtreeWidth, 0);
    const spacingWidth = (node.children.length - 1) * HORIZONTAL_SPACING;
    const totalChildrenWidth = childrenWidth + spacingWidth;

    const nodeWidth = NODE_WIDTH + (node.spouse ? SPOUSE_SPACING : 0);
    
    return Math.max(nodeWidth, totalChildrenWidth);
  }

  /**
   * Position all trees and return final positions
   */
  private positionTrees(trees: TreeNode[]): Record<string, { x: number; y: number }> {
    const positions: Record<string, { x: number; y: number }> = {};
    let currentX = 100; // Start with margin

    for (const tree of trees) {
      this.positionSubtree(tree, currentX, positions);
      currentX += tree.subtreeWidth + HORIZONTAL_SPACING * 2;
    }

    return positions;
  }

  /**
   * Position a subtree recursively
   */
  private positionSubtree(node: TreeNode, leftX: number, positions: Record<string, { x: number; y: number }>) {
    // Position children first
    let childX = leftX;
    
    for (const child of node.children) {
      this.positionSubtree(child, childX, positions);
      childX += child.subtreeWidth + HORIZONTAL_SPACING;
    }

    // Calculate node position
    let nodeX: number;
    
    if (node.children.length === 0) {
      nodeX = leftX;
    } else {
      // Center above children
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      const firstChildPos = positions[firstChild.member.id];
      const lastChildPos = positions[lastChild.member.id];
      
      if (firstChildPos && lastChildPos) {
        const childrenCenterX = (firstChildPos.x + lastChildPos.x) / 2;
        nodeX = childrenCenterX;
        
        if (node.spouse) {
          nodeX = childrenCenterX - SPOUSE_SPACING / 2;
        }
      } else {
        nodeX = leftX;
      }
    }

    // Set position for the main member
    positions[node.member.id] = {
      x: Math.max(nodeX, leftX),
      y: node.y
    };

    // Set position for spouse if exists
    if (node.spouse) {
      positions[node.spouse.id] = {
        x: positions[node.member.id].x + SPOUSE_SPACING,
        y: node.y
      };
    }
  }

  /**
   * Create React Flow nodes from positions
   */
  private createNodes(
    positions: Record<string, { x: number; y: number }>,
    onEdit: (member: FamilyMember) => void,
    onDelete: (member: FamilyMember) => void,
    onLink?: (memberId: string) => void
  ): Node<MemberNodeData>[] {
    return this.members.map(member => {
      const position = positions[member.id] || { x: 0, y: 0 };
      
      return {
        id: member.id,
        type: 'memberNode',
        position,
        data: {
          member,
          onEdit,
          onDelete,
          onLink
        },
        draggable: true,
      };
    });
  }

  /**
   * Create React Flow edges from family relationships
   */
  private createEdges(): Edge[] {
    const edges: Edge[] = [];

    this.members.forEach(member => {
      // Parent-child relationships
      if (member.father_id) {
        edges.push({
          id: `parent-${member.father_id}-${member.id}`,
          source: member.father_id,
          target: member.id,
          sourceHandle: 'child',
          targetHandle: 'parent',
          type: 'parent-child',
          animated: false,
          markerEnd: {
            type: 'arrowclosed',
            color: '#3b82f6',
          },
        });
      }

      if (member.mother_id) {
        edges.push({
          id: `parent-${member.mother_id}-${member.id}`,
          source: member.mother_id,
          target: member.id,
          sourceHandle: 'child',
          targetHandle: 'parent',
          type: 'parent-child',
          animated: false,
          markerEnd: {
            type: 'arrowclosed',
            color: '#3b82f6',
          },
        });
      }

      // Spouse relationships (only create once per couple)
      if (member.spouse_id && member.id < member.spouse_id) {
        edges.push({
          id: `spouse-${member.id}-${member.spouse_id}`,
          source: member.id,
          target: member.spouse_id,
          sourceHandle: 'spouse-right',
          targetHandle: 'spouse-left',
          type: 'spouse',
          animated: false,
        });
      }
    });

    return edges;
  }

  /**
   * Generate a grid layout as fallback
   */
  static generateGridLayout(
    members: FamilyMember[],
    onEdit: (member: FamilyMember) => void,
    onDelete: (member: FamilyMember) => void
  ): { nodes: Node<MemberNodeData>[]; edges: Edge[] } {
    const cols = Math.ceil(Math.sqrt(members.length));
    
    const nodes = members.map((member, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      return {
        id: member.id,
        type: 'memberNode',
        position: {
          x: 100 + col * (NODE_WIDTH + HORIZONTAL_SPACING),
          y: 100 + row * (NODE_HEIGHT + VERTICAL_SPACING)
        },
        data: {
          member,
          onEdit,
          onDelete
        },
        draggable: true,
      };
    });

    // Create edges based on relationships
    const layout = new ReactFlowFamilyTreeLayout(members);
    const edges = layout.createEdges();

    return { nodes, edges };
  }
}

export default ReactFlowFamilyTreeLayout;