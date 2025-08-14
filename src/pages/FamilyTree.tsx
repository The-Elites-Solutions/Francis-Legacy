import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, User, Heart, MapPin, Loader2 } from 'lucide-react';
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
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import FamilyTreeMemberNode, { FamilyMember, FamilyTreeMemberNodeData } from '@/components/FamilyTreeMemberNode';
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
  children: TreeNode[];
  generation: number;
  x: number;
  y: number;
  width: number;
}

class FamilyTreeLayout {
  private members: FamilyMember[];
  private memberMap: Map<string, FamilyMember>;
  private processedSpouses: Set<string>;

  constructor(members: FamilyMember[]) {
    this.members = members;
    this.memberMap = new Map(members.map(m => [m.id, m]));
    this.processedSpouses = new Set();
  }

  // Generate layout with automatic positioning
  generateLayout(): { nodes: Node<FamilyTreeMemberNodeData>[]; edges: Edge[] } {
    const rootMembers = this.findRootMembers();
    const trees = rootMembers.map(root => this.buildTree(root, 0));
    
    // Calculate positions
    this.calculatePositions(trees);
    
    // Generate React Flow nodes and edges
    const nodes = this.createNodes(trees);
    const edges = this.createEdges();
    
    return { nodes, edges };
  }

  // Find members with no parents (root of family trees)
  private findRootMembers(): FamilyMember[] {
    return this.members.filter(member => !member.father_id && !member.mother_id);
  }

  // Build hierarchical tree structure
  private buildTree(member: FamilyMember, generation: number): TreeNode {
    const children = this.getChildren(member.id);
    const childTrees = children.map(child => this.buildTree(child, generation + 1));

    return {
      member,
      children: childTrees,
      generation,
      x: 0,
      y: 0,
      width: 0
    };
  }

  // Get all children of a member
  private getChildren(memberId: string): FamilyMember[] {
    return this.members.filter(m => m.father_id === memberId || m.mother_id === memberId);
  }

  // Calculate x,y positions for all nodes
  private calculatePositions(trees: TreeNode[]): void {
    const HORIZONTAL_SPACING = 160;
    const VERTICAL_SPACING = 200;
    const NODE_WIDTH = 120;

    // Calculate subtree widths
    trees.forEach(tree => this.calculateSubtreeWidth(tree, NODE_WIDTH, HORIZONTAL_SPACING));

    // Position trees horizontally
    let currentX = 0;
    trees.forEach(tree => {
      this.positionTree(tree, currentX, 0, VERTICAL_SPACING);
      currentX += tree.width + HORIZONTAL_SPACING * 2;
    });
  }

  // Calculate the width of each subtree
  private calculateSubtreeWidth(node: TreeNode, nodeWidth: number, spacing: number): number {
    if (node.children.length === 0) {
      node.width = nodeWidth;
    } else {
      // Calculate total width of children
      let childrenWidth = 0;
      node.children.forEach(child => {
        childrenWidth += this.calculateSubtreeWidth(child, nodeWidth, spacing);
      });
      
      // Add spacing between children
      if (node.children.length > 1) {
        childrenWidth += (node.children.length - 1) * spacing;
      }
      
      node.width = Math.max(nodeWidth, childrenWidth);
    }
    
    return node.width;
  }

  // Position nodes in the tree
  private positionTree(node: TreeNode, leftX: number, y: number, verticalSpacing: number): void {
    node.y = y;

    if (node.children.length === 0) {
      // Leaf node - position at left edge
      node.x = leftX + node.width / 2;
    } else {
      // Position children first
      let childX = leftX;
      node.children.forEach(child => {
        this.positionTree(child, childX, y + verticalSpacing, verticalSpacing);
        childX += child.width + 160; // spacing between children
      });

      // Position parent centered above children
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.x = (firstChild.x + lastChild.x) / 2;
    }
  }

  // Create React Flow nodes from tree structure
  private createNodes(trees: TreeNode[]): Node<FamilyTreeMemberNodeData>[] {
    const nodes: Node<FamilyTreeMemberNodeData>[] = [];
    
    const addNodeFromTree = (tree: TreeNode, onNodeClick: (memberId: string) => void) => {
      // Add the main member node
      nodes.push({
        id: tree.member.id,
        type: 'familyMember',
        position: { x: tree.x, y: tree.y },
        data: {
          member: tree.member,
          onNodeClick
        },
        draggable: false,
        connectable: false,
        selectable: false,
      });

      // Add spouse node if exists and not already processed
      if (tree.member.spouse_id && !this.processedSpouses.has(tree.member.id)) {
        const spouse = this.memberMap.get(tree.member.spouse_id);
        if (spouse) {
          this.processedSpouses.add(tree.member.id);
          this.processedSpouses.add(spouse.id);
          
          nodes.push({
            id: spouse.id,
            type: 'familyMember',
            position: { x: tree.x + 140, y: tree.y },
            data: {
              member: spouse,
              onNodeClick
            },
            draggable: false,
            connectable: false,
            selectable: false,
          });
        }
      }

      // Recursively add children
      tree.children.forEach(child => addNodeFromTree(child, onNodeClick));
    };

    // We'll set the onNodeClick function later when we have access to it
    const dummyOnNodeClick = () => {};
    trees.forEach(tree => addNodeFromTree(tree, dummyOnNodeClick));
    
    return nodes;
  }

  // Create React Flow edges for relationships
  private createEdges(): Edge[] {
    const edges: Edge[] = [];
    const processedSpouseConnections = new Set<string>();

    this.members.forEach(member => {
      // Parent-child edges
      if (member.father_id) {
        edges.push({
          id: `parent-${member.father_id}-${member.id}`,
          source: member.father_id,
          target: member.id,
          type: 'smoothstep',
          style: { stroke: '#3b82f6', strokeWidth: 2 },
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
          type: 'smoothstep',
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          markerEnd: {
            type: 'arrowclosed',
            color: '#3b82f6',
          },
        });
      }

      // Spouse edges (bidirectional, so only create once)
      if (member.spouse_id) {
        const spouseConnectionId = [member.id, member.spouse_id].sort().join('-');
        if (!processedSpouseConnections.has(spouseConnectionId)) {
          processedSpouseConnections.add(spouseConnectionId);
          
          edges.push({
            id: `spouse-${member.id}-${member.spouse_id}`,
            source: member.id,
            target: member.spouse_id,
            type: 'straight',
            style: { stroke: '#dc2626', strokeWidth: 3 },
          });
        }
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
    const { nodes: generatedNodes, edges: generatedEdges } = layout.generateLayout();
    
    // Update nodes with the actual handlers
    const nodesWithHandlers = generatedNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onNodeClick: handleNodeClick,
        onViewMember: handleViewMember,
        isClicked: clickedNode === node.data.member.id
      }
    }));

    return { 
      layoutNodes: nodesWithHandlers, 
      layoutEdges: generatedEdges 
    };
  }, [familyMembers, handleNodeClick, handleViewMember, clickedNode]);

  // Update React Flow nodes and edges when layout changes
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  const filteredMembers = familyMembers.filter(member => {
    const fullName = getMemberName(member).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) ||
           (member.occupation && member.occupation.toLowerCase().includes(searchLower)) ||
           (member.birth_place && member.birth_place.toLowerCase().includes(searchLower));
  });

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
            {!isMobile && " Click on any family member to learn more about their story."}
            {isMobile && " Tap family members to view their stories."}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <div className="relative w-full max-w-sm sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
            <Input
              placeholder="Search family members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-primary/30 text-foreground placeholder-foreground/40 h-11 text-base touch-manipulation focus:border-primary"
            />
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
                  {isMobile ? "Tap a member to select, then tap the view icon for details" : "Click on family members to select, then click the view icon to see their detailed profiles"}
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
                    nodeTypes={nodeTypes}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    deleteKeyCode={null}
                    fitView
                    fitViewOptions={{
                      padding: 0.1,
                      includeHiddenNodes: false,
                    }}
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