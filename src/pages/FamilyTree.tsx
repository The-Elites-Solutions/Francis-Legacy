import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, User, Heart, MapPin, Loader2, Monitor, List, Navigation, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  MiniMap, 
  Background,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import FamilyTreeMemberNode, { FamilyMember, FamilyTreeMemberNodeData } from '@/components/FamilyTreeMemberNode';
import { edgeTypesPublic as edgeTypes } from '@/components/FamilyTreeEdges';
import '@/styles/FamilyTree.css';

// Node types for React Flow
const nodeTypes = {
  familyMember: FamilyTreeMemberNode,
};

// Helper functions
const getMemberName = (member: FamilyMember) => `${member.first_name} ${member.last_name}`;
const getMemberBirth = (member: FamilyMember) => member.birth_date ? new Date(member.birth_date).getFullYear().toString() : '';
const getMemberDeath = (member: FamilyMember) => member.death_date ? new Date(member.death_date).getFullYear().toString() : undefined;
const getSpouseName = (member: FamilyMember, allMembers: FamilyMember[]) => {
  if (!member.spouse_id) return undefined;
  const spouse = allMembers.find(m => m.id === member.spouse_id);
  return spouse ? getMemberName(spouse) : undefined;
};
const getParentIds = (member: FamilyMember): string[] => {
  const parents = [];
  if (member.father_id) parents.push(member.father_id);
  if (member.mother_id) parents.push(member.mother_id);
  return parents;
};
const getChildrenIds = (memberId: string, allMembers: FamilyMember[]): string[] => {
  return allMembers
    .filter(m => m.father_id === memberId || m.mother_id === memberId)
    .map(m => m.id);
};

// Family Tree Layout Algorithm
interface TreeNode {
  member: FamilyMember;
  spouse?: FamilyMember;
  children: TreeNode[];
  generation: number;
  x: number;
  y: number;
  width: number;
  parentIds?: { fatherId?: string; motherId?: string }; // Track parent IDs for sibling grouping
  familyGroupId?: string; // Unique ID for family grouping
}

class FamilyTreeLayout {
  private members: FamilyMember[];
  private memberMap: Map<string, FamilyMember>;
  private processedMembers: Set<string>;
  private NODE_WIDTH = 150;
  private NODE_HEIGHT = 150;
  
  // Variable spacing for family grouping
  private SIBLING_SPACING = 50;        // Base spacing between siblings (reduced from 80)
  private FAMILY_GROUP_SPACING = 250;  // Space between different family groups
  private COUSIN_SPACING = 150;        // Space between cousins
  private GENERATION_SPACING = 200;    // Vertical spacing between generations
  private SPOUSE_SPACING = 180;        // Space between spouses
  
  // Get dynamic spacing based on generation for pyramid effect
  private getGenerationSpacing(generation: number): number {
    // Increase spacing as we go down the tree (pyramid effect)
    const baseSpacing = this.SIBLING_SPACING;
    const increment = generation * 20; // Gradually increase spacing (reduced from 30)
    return baseSpacing + increment;
  }
  
  private getFamilyGroupSpacing(generation: number): number {
    // Increase family group spacing as we go down
    const baseSpacing = this.FAMILY_GROUP_SPACING;
    const increment = generation * 50;
    return baseSpacing + increment;
  }

  constructor(members: FamilyMember[]) {
    this.members = members;
    this.memberMap = new Map(members.map(m => [m.id, m]));
    this.processedMembers = new Set();
    
    // Adjust spacing based on viewport width (responsive)
    if (typeof window !== 'undefined') {
      const viewportWidth = window.innerWidth;
      if (viewportWidth < 768) {
        // Mobile - much tighter spacing
        this.SIBLING_SPACING = 30;
        this.FAMILY_GROUP_SPACING = 120;
        this.COUSIN_SPACING = 80;
        this.GENERATION_SPACING = 120;
        this.NODE_WIDTH = 120;
      } else if (viewportWidth < 1024) {
        // Tablet - medium spacing
        this.SIBLING_SPACING = 40;
        this.FAMILY_GROUP_SPACING = 180;
        this.COUSIN_SPACING = 100;
        this.GENERATION_SPACING = 150;
        this.NODE_WIDTH = 140;
      }
      // Otherwise use default desktop spacing (50px)
    }
  }

  // Generate layout with automatic positioning
  generateLayout(onNodeClick?: (memberId: string) => void, onViewMember?: (memberId: string) => void): { nodes: Node<FamilyTreeMemberNodeData>[]; edges: Edge[] } {
    // Find the true root - oldest member without parents
    const rootMember = this.findTreeRoot();
    
    if (!rootMember) {
      // Fallback to members without parents
      const rootMembers = this.findRootMembers();
      const trees = rootMembers.map(root => this.buildFamilyTree(root, 0));
      this.calculatePositions(trees);
      const nodes = this.createNodes(trees, onNodeClick, onViewMember);
      const edges = this.createEdges();
      return { nodes, edges };
    }
    
    // Build tree starting from the root
    const tree = this.buildFamilyTree(rootMember, 0);
    
    // Calculate positions with better initial spacing
    this.calculateTreePosition(tree, 200, 50);
    
    // Center the tree
    this.centerTree([tree]);
    
    // Generate React Flow nodes and edges
    const nodes = this.createNodes([tree], onNodeClick, onViewMember);
    const edges = this.createEdges();
    
    return { nodes, edges };
  }

  // Find the oldest member without parents as the tree root
  private findTreeRoot(): FamilyMember | null {
    const rootCandidates = this.members.filter(member => !member.father_id && !member.mother_id);
    
    if (rootCandidates.length === 0) return null;
    
    // Find the oldest by birth date
    const withBirthDates = rootCandidates.filter(m => m.birth_date);
    if (withBirthDates.length === 0) return rootCandidates[0];
    
    return withBirthDates.reduce((oldest, current) => {
      const oldestDate = new Date(oldest.birth_date!).getTime();
      const currentDate = new Date(current.birth_date!).getTime();
      return currentDate < oldestDate ? current : oldest;
    });
  }

  // Find members with no parents (root of family trees)
  private findRootMembers(): FamilyMember[] {
    return this.members.filter(member => !member.father_id && !member.mother_id);
  }

  // Build family tree with couples
  private buildFamilyTree(member: FamilyMember, generation: number): TreeNode {
    if (this.processedMembers.has(member.id)) {
      // Return a simple node if already processed
      return {
        member,
        spouse: undefined,
        children: [],
        generation,
        x: 0,
        y: 0,
        width: this.NODE_WIDTH
      };
    }

    this.processedMembers.add(member.id);
    
    // Find spouse
    const spouse = member.spouse_id ? this.memberMap.get(member.spouse_id) : undefined;
    if (spouse) {
      this.processedMembers.add(spouse.id);
    }

    // Get children from this member (and their spouse if applicable)
    const children = this.getChildrenOfCouple(member.id, spouse?.id);
    
    // Build child trees (avoid processing children that are already processed as main members)
    const childTrees = children
      .filter(child => !this.processedMembers.has(child.id))
      .map(child => {
        const childNode = this.buildFamilyTree(child, generation + 1);
        // Set parent IDs for grouping
        childNode.parentIds = {
          fatherId: member.id,
          motherId: spouse?.id
        };
        childNode.familyGroupId = `${member.id}-${spouse?.id || 'single'}`;
        return childNode;
      });

    // Calculate node width (couple width includes spacing)
    const nodeWidth = spouse ? (this.NODE_WIDTH + this.SPOUSE_SPACING) : this.NODE_WIDTH;

    return {
      member,
      spouse,
      children: childTrees,
      generation,
      x: 0,
      y: 0,
      width: nodeWidth,
      familyGroupId: `${member.id}-${spouse?.id || 'single'}`
    };
  }

  // Get all children of a couple
  private getChildrenOfCouple(memberId: string, spouseId?: string): FamilyMember[] {
    const children = this.members.filter(m => 
      m.father_id === memberId || m.mother_id === memberId ||
      (spouseId && (m.father_id === spouseId || m.mother_id === spouseId))
    );
    
    // Remove duplicates
    const uniqueChildren = children.filter((child, index, self) => 
      index === self.findIndex(c => c.id === child.id)
    );
    
    return uniqueChildren;
  }

  // Calculate x,y positions for all nodes (fallback for multiple trees)
  private calculatePositions(trees: TreeNode[]): void {
    // Calculate subtree widths
    trees.forEach(tree => this.calculateSubtreeWidth(tree));

    // Position trees horizontally with proper spacing
    let currentX = 200; // Start with larger margin
    trees.forEach(tree => {
      this.calculateTreePosition(tree, currentX, 50);
      currentX += tree.width + this.HORIZONTAL_SPACING * 3; // Extra spacing between separate trees
    });
    
    // Center all trees
    this.centerTree(trees);
  }

  // Calculate the width of each subtree with family grouping
  private calculateSubtreeWidth(node: TreeNode): number {
    // Base width for this node (single or couple)
    const nodeBaseWidth = node.spouse ? (this.NODE_WIDTH + this.SPOUSE_SPACING) : this.NODE_WIDTH;
    
    if (node.children.length === 0) {
      // Leaf node - return the base width
      node.width = nodeBaseWidth;
      return nodeBaseWidth;
    }
    
    // Group children by family for spacing calculation
    const familyGroups = new Map<string, TreeNode[]>();
    node.children.forEach(child => {
      const groupId = child.familyGroupId || 'default';
      if (!familyGroups.has(groupId)) {
        familyGroups.set(groupId, []);
      }
      familyGroups.get(groupId)!.push(child);
    });
    
    // Calculate total width with family-based spacing
    let totalChildrenWidth = 0;
    const familyGroupArray = Array.from(familyGroups.values());
    
    // Use generation-based spacing for width calculation
    const generationSpacing = this.getGenerationSpacing(node.generation);
    const familyGroupSpacing = this.getFamilyGroupSpacing(node.generation);
    
    familyGroupArray.forEach((siblings, groupIndex) => {
      // Add width of each sibling
      siblings.forEach((child, siblingIndex) => {
        totalChildrenWidth += this.calculateSubtreeWidth(child);
        // Add generation-based sibling spacing
        if (siblingIndex > 0) {
          totalChildrenWidth += generationSpacing;
        }
      });
      // Add generation-based family group spacing
      if (groupIndex > 0) {
        totalChildrenWidth += familyGroupSpacing;
      }
    });
    
    // The subtree width is the maximum of node width and children width
    node.width = Math.max(nodeBaseWidth, totalChildrenWidth);
    
    return node.width;
  }

  // Position nodes in the tree hierarchically with family grouping
  private calculateTreePosition(node: TreeNode, leftX: number, y: number): void {
    node.y = y;

    if (node.children.length === 0) {
      // Leaf node - center it in its allocated space
      node.x = leftX + node.width / 2;
    } else {
      // Group children by family
      const familyGroups = new Map<string, TreeNode[]>();
      node.children.forEach(child => {
        const groupId = child.familyGroupId || 'default';
        if (!familyGroups.has(groupId)) {
          familyGroups.set(groupId, []);
        }
        familyGroups.get(groupId)!.push(child);
      });

      // Position children with family-based spacing
      let childX = leftX;
      const familyGroupArray = Array.from(familyGroups.values());
      
      // Calculate total width needed for all children with generation-based spacing
      let totalChildrenWidth = 0;
      const generationSpacing = this.getGenerationSpacing(node.generation);
      const familyGroupSpacing = this.getFamilyGroupSpacing(node.generation);
      
      familyGroupArray.forEach((siblings, groupIndex) => {
        siblings.forEach((child, siblingIndex) => {
          totalChildrenWidth += child.width;
          if (siblingIndex > 0) {
            totalChildrenWidth += generationSpacing; // Generation-based sibling spacing
          }
        });
        if (groupIndex > 0) {
          totalChildrenWidth += familyGroupSpacing; // Generation-based family spacing
        }
      });
      
      // Center children if they take less space than the parent
      if (totalChildrenWidth < node.width) {
        childX = leftX + (node.width - totalChildrenWidth) / 2;
      }
      
      // Position each family group with generation-based spacing
      const generationSpacing = this.getGenerationSpacing(node.generation);
      const familyGroupSpacing = this.getFamilyGroupSpacing(node.generation);
      
      familyGroupArray.forEach((siblings, groupIndex) => {
        if (groupIndex > 0) {
          childX += familyGroupSpacing; // Add generation-based family spacing
        }
        
        siblings.forEach((child, siblingIndex) => {
          if (siblingIndex > 0) {
            childX += generationSpacing; // Add generation-based sibling spacing
          }
          
          this.calculateTreePosition(child, childX, node.y + this.NODE_HEIGHT + this.GENERATION_SPACING);
          childX += child.width;
        });
      });

      // Position parent centered above all their children
      if (node.children.length === 1) {
        node.x = node.children[0].x;
      } else {
        const firstChild = node.children[0];
        const lastChild = node.children[node.children.length - 1];
        node.x = (firstChild.x + lastChild.x) / 2;
      }
    }
  }

  // Center the entire tree in the viewport with pyramid layout
  private centerTree(trees: TreeNode[]): void {
    if (trees.length === 0) return;
    
    // For pyramid layout, center based on the root (first generation)
    const rootNodes: TreeNode[] = [];
    const allNodes: TreeNode[] = [];
    
    // Find root nodes and collect all nodes
    const collectNodes = (node: TreeNode) => {
      allNodes.push(node);
      if (node.generation === 0) {
        rootNodes.push(node);
      }
      node.children.forEach(collectNodes);
    };
    
    trees.forEach(collectNodes);
    
    if (rootNodes.length === 0) return;
    
    // Calculate the center point of the root generation
    let rootMinX = Infinity;
    let rootMaxX = -Infinity;
    
    rootNodes.forEach(node => {
      let nodeMinX, nodeMaxX;
      
      if (node.spouse) {
        const coupleHalfWidth = (this.NODE_WIDTH + this.SPOUSE_SPACING / 2);
        nodeMinX = node.x - coupleHalfWidth;
        nodeMaxX = node.x + coupleHalfWidth;
      } else {
        nodeMinX = node.x - this.NODE_WIDTH / 2;
        nodeMaxX = node.x + this.NODE_WIDTH / 2;
      }
      
      rootMinX = Math.min(rootMinX, nodeMinX);
      rootMaxX = Math.max(rootMaxX, nodeMaxX);
    });
    
    const rootCenterX = (rootMinX + rootMaxX) / 2;
    
    // Define target center position for the root
    const VIEWPORT_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const targetRootCenterX = VIEWPORT_WIDTH / 2;
    const TOP_MARGIN = 100;
    
    // Calculate offset to center the root generation
    const offsetX = targetRootCenterX - rootCenterX;
    const offsetY = TOP_MARGIN - Math.min(...allNodes.map(n => n.y));
    
    // Apply offset to all nodes
    const applyOffset = (node: TreeNode) => {
      node.x += offsetX;
      node.y += offsetY;
      node.children.forEach(applyOffset);
    };
    
    trees.forEach(applyOffset);
    
    console.log(`🏛️ Pyramid centered: Root at ${targetRootCenterX}, offset: (${Math.round(offsetX)}, ${Math.round(offsetY)})`);
  }

  // Create React Flow nodes from tree structure
  private createNodes(trees: TreeNode[], onNodeClick?: (memberId: string) => void, onViewMember?: (memberId: string) => void): Node<FamilyTreeMemberNodeData>[] {
    const nodes: Node<FamilyTreeMemberNodeData>[] = [];
    
    const addNodeFromTree = (tree: TreeNode) => {
      // For single nodes, position at the center point
      if (!tree.spouse) {
        nodes.push({
          id: tree.member.id,
          type: 'familyMember',
          position: { x: tree.x - this.NODE_WIDTH / 2, y: tree.y },
          data: {
            member: tree.member,
            onNodeClick: onNodeClick || (() => {}),
            onViewMember,
            generation: tree.generation,
            familyGroupId: tree.familyGroupId
          },
          draggable: false,
          connectable: false,
          selectable: false,
        });
      } else {
        // For couples, position them side by side
        // The tree.x represents the center of the couple unit
        const leftX = tree.x - (this.SPOUSE_SPACING / 2) - (this.NODE_WIDTH / 2);
        const rightX = tree.x + (this.SPOUSE_SPACING / 2) - (this.NODE_WIDTH / 2);
        
        // Add the main member node (usually on the left)
        nodes.push({
          id: tree.member.id,
          type: 'familyMember',
          position: { x: leftX, y: tree.y },
          data: {
            member: tree.member,
            onNodeClick: onNodeClick || (() => {}),
            onViewMember,
            generation: tree.generation,
            familyGroupId: tree.familyGroupId
          },
          draggable: false,
          connectable: false,
          selectable: false,
        });

        // Add spouse node on the right
        nodes.push({
          id: tree.spouse.id,
          type: 'familyMember',
          position: { x: rightX, y: tree.y },
          data: {
            member: tree.spouse,
            onNodeClick: onNodeClick || (() => {}),
            onViewMember,
            generation: tree.generation,
            familyGroupId: tree.familyGroupId
          },
          draggable: false,
          connectable: false,
          selectable: false,
        });
      }

      // Recursively add children
      tree.children.forEach(child => addNodeFromTree(child));
    };

    trees.forEach(tree => addNodeFromTree(tree));
    
    return nodes;
  }

  // Create React Flow edges for relationships
  private createEdges(): Edge[] {
    const edges: Edge[] = [];
    const processedSpouseConnections = new Set<string>();

    this.members.forEach(member => {
      // Parent-child relationships
      if (member.father_id) {
        edges.push({
          id: `parent-${member.father_id}-${member.id}`,
          source: member.father_id,
          target: member.id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'parent-child',
          animated: false,
          markerEnd: {
            type: 'arrowclosed',
            color: '#3b82f6',
          },
        });
      }

      if (member.mother_id && member.mother_id !== member.father_id) {
        edges.push({
          id: `parent-${member.mother_id}-${member.id}`,
          source: member.mother_id,
          target: member.id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
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
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'spouse',
          animated: false,
        });
      }
    });

    return edges;
  }
}

// Main Family Tree Component
function FamilyTreePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [clickedNode, setClickedNode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { fitView } = useReactFlow();

  // Monitor section state
  const [showMonitor, setShowMonitor] = useState(false);
  const [monitorSearch, setMonitorSearch] = useState('');
  const [selectedMonitorMember, setSelectedMonitorMember] = useState<string | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyTreeMemberNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const members = await apiClient.getFamilyMembers();
      setFamilyMembers(members);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load family members';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle node click - must be defined before useMemo
  const handleNodeClick = useCallback((memberId: string) => {
    setClickedNode(memberId);
  }, []);

  // Handle double click - directly show the modal
  const handleNodeDoubleClick = useCallback((memberId: string) => {
    setSelectedMember(memberId);
    setIsModalOpen(true);
    setClickedNode(null);
  }, []);

  // Handle view button click - shows the modal
  const handleViewMember = useCallback((memberId: string) => {
    setSelectedMember(memberId);
    setIsModalOpen(true);
    setClickedNode(null); // Hide the view button after clicking
  }, []);

  // Generate React Flow layout
  const { layoutNodes, layoutEdges } = useMemo(() => {
    if (familyMembers.length === 0) {
      return { layoutNodes: [], layoutEdges: [] };
    }

    const layout = new FamilyTreeLayout(familyMembers);
    const { nodes: generatedNodes, edges: generatedEdges } = layout.generateLayout(handleNodeClick, handleViewMember);
    
    // Update nodes with the actual state
    const nodesWithState = generatedNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isClicked: clickedNode === node.data.member.id,
        isMonitorHighlighted: selectedMonitorMember === node.data.member.id
      }
    }));

    return { 
      layoutNodes: nodesWithState, 
      layoutEdges: generatedEdges 
    };
  }, [familyMembers, handleNodeClick, handleViewMember, clickedNode, selectedMonitorMember]);

  // Update React Flow nodes and edges when layout changes
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    
    // Ensure the tree is properly centered after a short delay to allow rendering
    if (layoutNodes.length > 0) {
      setTimeout(() => {
        fitView({
          padding: 0.15,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 2,
          duration: 300,
        });
      }, 100);
    }
  }, [layoutNodes, layoutEdges, setNodes, setEdges, fitView]);

  const filteredMembers = familyMembers.filter(member => {
    const fullName = getMemberName(member).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) ||
           (member.occupation && member.occupation.toLowerCase().includes(searchLower)) ||
           (member.birth_place && member.birth_place.toLowerCase().includes(searchLower));
  });

  // Process members for monitor display
  const monitorMembers = useMemo(() => {
    const filtered = familyMembers.filter(member => {
      const fullName = getMemberName(member).toLowerCase();
      const searchLower = monitorSearch.toLowerCase();
      return fullName.includes(searchLower) ||
             (member.occupation && member.occupation.toLowerCase().includes(searchLower));
    });

    // Sort by generation (root first, then by name)
    return filtered.sort((a, b) => {
      // Root members (no parents) first
      const aIsRoot = !a.father_id && !a.mother_id;
      const bIsRoot = !b.father_id && !b.mother_id;
      
      if (aIsRoot && !bIsRoot) return -1;
      if (!aIsRoot && bIsRoot) return 1;
      
      // Sort by birth year if available
      if (a.birth_date && b.birth_date) {
        const aYear = new Date(a.birth_date).getFullYear();
        const bYear = new Date(b.birth_date).getFullYear();
        if (aYear !== bYear) return aYear - bYear;
      }
      
      // Finally sort by name
      return getMemberName(a).localeCompare(getMemberName(b));
    });
  }, [familyMembers, monitorSearch]);

  const selectedMemberData = selectedMember ? familyMembers.find(m => m.id === selectedMember) : null;

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
    setClickedNode(null);
  };

  // Clear clicked node when clicking outside
  const handleBackgroundClick = useCallback(() => {
    setClickedNode(null);
  }, []);

  // Manual center tree function
  const handleCenterTree = useCallback(() => {
    fitView({
      padding: 0.15,
      includeHiddenNodes: false,
      minZoom: 0.1,
      maxZoom: 2,
      duration: 500,
    });
  }, [fitView]);

  // Navigate to specific member function
  const navigateToMember = useCallback((memberId: string) => {
    const targetNode = nodes.find(n => n.id === memberId);
    if (targetNode) {
      // Center on the specific node with smooth animation
      fitView({
        nodes: [targetNode],
        duration: 800,
        padding: 0.3,
        includeHiddenNodes: false,
        minZoom: 0.5,
        maxZoom: 1.5,
      });
      
      // Highlight the node temporarily
      setSelectedMonitorMember(memberId);
      setTimeout(() => setSelectedMonitorMember(null), 3000);
      
      // Also set as clicked node to show the view button
      setClickedNode(memberId);
      setTimeout(() => setClickedNode(null), 5000);
    }
  }, [nodes, fitView]);

  // Toggle monitor visibility
  const toggleMonitor = useCallback(() => {
    setShowMonitor(prev => !prev);
  }, []);

  // Calculate family statistics dynamically
  const totalMembers = familyMembers.length;
  const generations = familyMembers.length > 0 ? 
    Math.max(...familyMembers.map(m => {
      let depth = 0;
      let currentId = m.id;
      const visited = new Set();
      
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const member = familyMembers.find(mem => mem.id === currentId);
        if (member && (member.father_id || member.mother_id)) {
          depth++;
          currentId = member.father_id || member.mother_id || '';
        } else {
          break;
        }
      }
      return depth + 1;
    })) : 0;
  
  const countries = new Set(
    familyMembers
      .map(m => m.birth_place)
      .filter(Boolean)
      .map(place => place!.split(',').pop()?.trim())
      .filter(Boolean)
  ).size;
  
  const earliestYear = familyMembers.length > 0 ?
    Math.min(...familyMembers
      .map(m => m.birth_date ? new Date(m.birth_date).getFullYear() : Infinity)
      .filter(year => year !== Infinity)
    ) : new Date().getFullYear();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen py-4 sm:py-6 lg:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="family-tree-loading">
            <Loader2 className="h-8 w-8 animate-spin family-tree-loading-spinner" />
            <p className="mt-2 text-gray-600">Loading family tree...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen py-4 sm:py-6 lg:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="family-tree-error">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={fetchFamilyMembers}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-4">
            Family <span className="text-yellow-600">Tree</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-foreground/70 max-w-3xl mx-auto px-2 sm:px-0">
            Explore the connections that bind our family together across generations. 
            {!isMobile && " Interactive nodes show relationships with colorful connection lines between family members."}
            {isMobile && " Touch-friendly interface with clear relationship connections."}
          </p>
        </div>

        {/* Search Bar and Center Button */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <div className="relative w-full max-w-sm sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
            <Input
              placeholder="Search family members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-primary/30 text-foreground placeholder-foreground/40 h-11 text-base touch-manipulation focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCenterTree}
              variant="outline"
              className="h-11 px-4 border-primary/30 text-foreground hover:bg-yellow-50 hover:border-yellow-600 transition-colors"
            >
              🎯 Center Tree
            </Button>
            <Button
              onClick={toggleMonitor}
              variant={showMonitor ? "default" : "outline"}
              className={`h-11 px-4 transition-colors ${
                showMonitor 
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                  : "border-primary/30 text-foreground hover:bg-yellow-50 hover:border-yellow-600"
              }`}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Monitor
            </Button>
          </div>
        </div>
      </div>

      {/* React Flow Family Tree */}
      <div className="w-full bg-secondary/30 py-6 sm:py-8 lg:py-12 mb-6 sm:mb-8">
        <div className="max-w-full">
          <div className="w-full px-3 sm:px-6 lg:px-8">
            <Card className="bg-white border-primary/30 shadow-md">
              <CardHeader className="text-center px-3 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-foreground flex items-center justify-center text-lg sm:text-xl">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-600" />
                  Interactive Family Tree
                </CardTitle>
                <CardDescription className="text-foreground/60 text-sm sm:text-base">
                  {isMobile ? "Tap to select • Double-tap for full details • Connections show family relationships" : "Click to select • Double-click for full details • Connection lines show family relationships"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="family-tree-container" style={{ height: '70vh' }}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onPaneClick={handleBackgroundClick}
                    onNodeDoubleClick={(event, node) => handleNodeDoubleClick(node.id)}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    deleteKeyCode={null}
                    fitView
                    fitViewOptions={{
                      padding: 0.15,
                      includeHiddenNodes: false,
                      minZoom: 0.1,
                      maxZoom: 2,
                    }}
                    minZoom={0.1}
                    maxZoom={2}
                    defaultZoom={0.8}
                    panOnDrag={true}
                    zoomOnScroll={true}
                    zoomOnPinch={true}
                    zoomOnDoubleClick={false}
                  >
                    <Background color="#f1f5f9" gap={20} />
                    <Controls />
                    <MiniMap 
                      nodeStrokeColor="#eab308"
                      nodeColor="#f3f4f6"
                      maskColor="rgba(234, 179, 8, 0.1)"
                      position="bottom-right"
                    />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Family Statistics */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">{totalMembers}</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Total Members</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">{generations}</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Generations</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">{countries || 0}</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Countries</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">{earliestYear !== Infinity ? earliestYear : 'N/A'}</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Earliest Record</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Family Tree Monitor Section */}
      {showMonitor && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 mb-6 sm:mb-8">
          <Card className="bg-white shadow-lg border-primary/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg sm:text-xl text-yellow-600">
                <div className="flex items-center">
                  <List className="w-5 h-5 mr-2" />
                  Family Tree Monitor
                  <span className="ml-2 text-sm text-foreground/60 font-normal">
                    ({monitorMembers.length} members)
                  </span>
                </div>
                <Button
                  onClick={toggleMonitor}
                  variant="ghost"
                  size="sm"
                  className="text-foreground/50 hover:text-foreground"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </CardTitle>
              <CardDescription className="text-foreground/60">
                Click on any member to navigate to their position in the family tree
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Monitor Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
                <Input
                  placeholder="Search family members..."
                  value={monitorSearch}
                  onChange={(e) => setMonitorSearch(e.target.value)}
                  className="pl-10 bg-white border-primary/30 text-foreground placeholder-foreground/40"
                />
              </div>
              
              {/* Members List */}
              <div className="max-h-80 overflow-y-auto space-y-2">
                {monitorMembers.map((member) => {
                  const isHighlighted = selectedMonitorMember === member.id;
                  const isClicked = clickedNode === member.id;
                  const spouseName = getSpouseName(member, familyMembers);
                  const childrenCount = getChildrenIds(member.id, familyMembers).length;
                  const birthYear = member.birth_date ? new Date(member.birth_date).getFullYear() : null;
                  const isRoot = !member.father_id && !member.mother_id;
                  
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                        isHighlighted 
                          ? 'bg-yellow-50 border-yellow-300 shadow-md' 
                          : isClicked 
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => navigateToMember(member.id)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={member.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-yellow-100 text-yellow-800">
                            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground truncate">
                              {getMemberName(member)}
                            </span>
                            {isRoot && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Root
                              </span>
                            )}
                            {member.gender && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                member.gender === 'M' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-pink-100 text-pink-800'
                              }`}>
                                {member.gender === 'M' ? '♂' : '♀'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3 text-xs text-foreground/60 mt-1">
                            {birthYear && (
                              <span>Born: {birthYear}</span>
                            )}
                            {spouseName && (
                              <span className="flex items-center">
                                <Heart className="w-3 h-3 mr-1 text-red-500" />
                                {spouseName}
                              </span>
                            )}
                            {childrenCount > 0 && (
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {childrenCount} children
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 text-foreground/50 hover:text-yellow-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToMember(member.id);
                        }}
                      >
                        <Target className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
                
                {monitorMembers.length === 0 && (
                  <div className="text-center text-foreground/50 py-8">
                    No family members found matching your search.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Member Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto bg-white border-primary/30 text-foreground mx-2 sm:mx-auto shadow-xl">
          {selectedMemberData && (
            <>
              <DialogHeader className="pb-4 sm:pb-6">
                <DialogTitle className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 text-xl sm:text-2xl text-yellow-600">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 gold-texture flex-shrink-0">
                    <AvatarImage src={selectedMemberData.profile_photo_url} />
                    <AvatarFallback className="gold-texture text-white text-lg sm:text-xl">
                      {selectedMemberData.first_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <div className="leading-tight">{getMemberName(selectedMemberData)}</div>
                    <div className="text-foreground/60 text-sm sm:text-base font-normal">
                      {getMemberBirth(selectedMemberData)} - {getMemberDeath(selectedMemberData) || 'Present'}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h4 className="text-yellow-600 font-semibold mb-2 text-base sm:text-lg">Basic Information</h4>
                      <div className="space-y-2 text-sm sm:text-base">
                        {selectedMemberData.occupation && (
                          <div className="flex items-start space-x-2">
                            <User className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">{selectedMemberData.occupation}</span>
                          </div>
                        )}
                        {selectedMemberData.birth_place && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">Born in {selectedMemberData.birth_place}</span>
                          </div>
                        )}
                        {selectedMemberData.maiden_name && (
                          <div className="flex items-start space-x-2">
                            <User className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">Maiden name: {selectedMemberData.maiden_name}</span>
                          </div>
                        )}
                        {getSpouseName(selectedMemberData, familyMembers) && (
                          <div className="flex items-start space-x-2">
                            <Heart className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">Married to {getSpouseName(selectedMemberData, familyMembers)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h4 className="text-yellow-600 font-semibold mb-2 text-base sm:text-lg">Family Connections</h4>
                      <div className="space-y-2 text-sm sm:text-base">
                        {getParentIds(selectedMemberData).length > 0 && (
                          <div>
                            <span className="text-yellow-600 font-medium">Parents:</span>{' '}
                            <span className="leading-tight text-foreground">
                              {getParentIds(selectedMemberData).map(parentId => {
                                const parent = familyMembers.find(m => m.id === parentId);
                                return parent ? getMemberName(parent) : null;
                              }).filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        {getChildrenIds(selectedMemberData.id, familyMembers).length > 0 && (
                          <div>
                            <span className="text-yellow-600 font-medium">Children:</span>{' '}
                            <span className="leading-tight text-foreground">
                              {getChildrenIds(selectedMemberData.id, familyMembers).map(childId => {
                                const child = familyMembers.find(m => m.id === childId);
                                return child ? getMemberName(child) : null;
                              }).filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biography */}
                {selectedMemberData.biography && (
                  <div>
                    <h4 className="text-yellow-600 font-semibold mb-2 text-base sm:text-lg">Life Story</h4>
                    <p className="text-foreground/90 leading-relaxed text-sm sm:text-base">{selectedMemberData.biography}</p>
                  </div>
                )}

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main export with ReactFlowProvider wrapper
export default function FamilyTree() {
  return (
    <ReactFlowProvider>
      <FamilyTreePage />
    </ReactFlowProvider>
  );
}