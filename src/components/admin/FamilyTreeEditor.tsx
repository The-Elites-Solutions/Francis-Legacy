import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Plus, Save, X, RotateCcw, Grid, Link
} from 'lucide-react';

import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import MemberNode, { FamilyMember, MemberNodeData } from './MemberNode';
import { edgeTypes } from './FamilyTreeEdges';
import { ReactFlowFamilyTreeLayout } from './FamilyTreeLayout';

interface MemberFormData {
  firstName: string;
  lastName: string;
  maidenName: string;
  gender: string;
  birthDate: string;
  deathDate: string;
  birthPlace: string;
  occupation: string;
  biography: string;
  profilePhotoUrl: string;
  fatherId: string;
  motherId: string;
  spouseId: string;
}

interface LinkingState {
  isActive: boolean;
  sourceNodeId: string | null;
  relationshipType: 'Add a Spouse' | 'Add a Child' | 'Add a Parent' | null;
  step: 'selectType' | 'selectTarget' | null;
}

interface PendingConnection {
  connection: Connection;
  isOpen: boolean;
}

const nodeTypes = {
  memberNode: MemberNode,
};

const FamilyTreeEditor: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<MemberNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Linking state for the staged linking flow
  const [linkingState, setLinkingState] = useState<LinkingState>({
    isActive: false,
    sourceNodeId: null,
    relationshipType: null,
    step: null
  });
  
  // Legacy connection confirmation state (keeping for backward compatibility)
  const [pendingConnection, setPendingConnection] = useState<PendingConnection>({
    connection: {} as Connection,
    isOpen: false
  });
  const [relationshipType, setRelationshipType] = useState<'parent' | 'spouse'>('parent');
  
  // Form state
  const [formData, setFormData] = useState<MemberFormData>({
    firstName: '',
    lastName: '',
    maidenName: '',
    gender: '',
    birthDate: '',
    deathDate: '',
    birthPlace: '',
    occupation: '',
    biography: '',
    profilePhotoUrl: '',
    fatherId: '',
    motherId: '',
    spouseId: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  // Generate nodes and edges when members change
  useEffect(() => {
    if (members.length > 0) {
      generateLayout();
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [members, setNodes, setEdges]);

  const fetchMembers = async () => {
    try {
      const data = await apiClient.getFamilyMembers();
      setMembers(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch family members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLayout = useCallback(() => {
    if (members.length === 0) return;
    
    const layout = new ReactFlowFamilyTreeLayout(members);
    const { nodes: newNodes, edges: newEdges } = layout.generateNodesAndEdges(
      handleEdit,
      handleDelete,
      handleLinkClick // Add the link handler
    );
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [members, setNodes, setEdges]);

  const handleAutoLayout = () => {
    generateLayout();
    toast({
      title: 'Success',
      description: 'Family tree layout regenerated',
    });
  };

  // New staged linking flow functions
  const handleLinkClick = (memberId: string) => {
    if (linkingState.isActive && linkingState.step === 'selectTarget') {
      // Complete the linking process
      if (linkingState.sourceNodeId && linkingState.relationshipType) {
        handleSetRelationship(
          linkingState.sourceNodeId,
          memberId,
          linkingState.relationshipType
        );
      }
      // Reset linking state
      setLinkingState({
        isActive: false,
        sourceNodeId: null,
        relationshipType: null,
        step: null
      });
    } else {
      // Start linking process
      setLinkingState({
        isActive: true,
        sourceNodeId: memberId,
        relationshipType: null,
        step: 'selectType'
      });
    }
  };

  const selectRelationshipType = (type: 'Add a Spouse' | 'Add a Child' | 'Add a Parent') => {
    setLinkingState(prev => ({
      ...prev,
      relationshipType: type,
      step: 'selectTarget'
    }));
  };

  const cancelLinking = () => {
    setLinkingState({
      isActive: false,
      sourceNodeId: null,
      relationshipType: null,
      step: null
    });
  };

  // Core relationship handling function
  const handleSetRelationship = async (
    sourceNodeId: string,
    targetNodeId: string,
    relationshipType: 'Add a Spouse' | 'Add a Child' | 'Add a Parent'
  ) => {
    try {
      const sourceNode = members.find(m => m.id === sourceNodeId);
      const targetNode = members.find(m => m.id === targetNodeId);

      if (!sourceNode || !targetNode) {
        throw new Error('Source or target node not found');
      }

      // Helper function to get member data for API calls
      const getMemberData = (member: FamilyMember) => ({
        firstName: member.first_name,
        lastName: member.last_name,
        maidenName: member.maiden_name || undefined,
        gender: (member as any).gender || undefined,
        birthDate: member.birth_date || undefined,
        deathDate: member.death_date || undefined,
        birthPlace: member.birth_place || undefined,
        occupation: member.occupation || undefined,
        biography: member.biography || undefined,
        profilePhotoUrl: member.profile_photo_url || undefined,
        fatherId: member.father_id || null,
        motherId: member.mother_id || null,
        spouseId: member.spouse_id || null,
      });

      if (relationshipType === 'Add a Spouse') {
        // Create bidirectional spousal link
        const sourceData = getMemberData(sourceNode);
        const targetData = getMemberData(targetNode);

        await apiClient.updateFamilyMember(sourceNodeId, {
          ...sourceData,
          spouseId: targetNodeId
        });

        await apiClient.updateFamilyMember(targetNodeId, {
          ...targetData,
          spouseId: sourceNodeId
        });

        toast({
          title: 'Success',
          description: 'Spousal relationship created successfully',
        });

      } else if (relationshipType === 'Add a Child') {
        // sourceNode is parent, targetNode is child
        const targetData = getMemberData(targetNode);
        const sourceGender = (sourceNode as any).gender;

        if (sourceGender === 'male') {
          // Source is father
          await apiClient.updateFamilyMember(targetNodeId, {
            ...targetData,
            fatherId: sourceNodeId
          });

          // Check if source has a spouse to set as mother
          if (sourceNode.spouse_id) {
            await apiClient.updateFamilyMember(targetNodeId, {
              ...targetData,
              fatherId: sourceNodeId,
              motherId: sourceNode.spouse_id
            });
          }
        } else if (sourceGender === 'female') {
          // Source is mother
          await apiClient.updateFamilyMember(targetNodeId, {
            ...targetData,
            motherId: sourceNodeId
          });

          // Check if source has a spouse to set as father
          if (sourceNode.spouse_id) {
            await apiClient.updateFamilyMember(targetNodeId, {
              ...targetData,
              motherId: sourceNodeId,
              fatherId: sourceNode.spouse_id
            });
          }
        } else {
          // Fallback if gender is not specified - ask user or default to father
          await apiClient.updateFamilyMember(targetNodeId, {
            ...targetData,
            fatherId: sourceNodeId
          });
        }

        toast({
          title: 'Success',
          description: 'Parent-child relationship created successfully',
        });

      } else if (relationshipType === 'Add a Parent') {
        // sourceNode is child, targetNode is parent
        const sourceData = getMemberData(sourceNode);
        const targetGender = (targetNode as any).gender;

        if (targetGender === 'male') {
          // Target is father
          await apiClient.updateFamilyMember(sourceNodeId, {
            ...sourceData,
            fatherId: targetNodeId
          });
        } else if (targetGender === 'female') {
          // Target is mother
          await apiClient.updateFamilyMember(sourceNodeId, {
            ...sourceData,
            motherId: targetNodeId
          });
        } else {
          // Fallback if gender is not specified - ask user or default to father
          await apiClient.updateFamilyMember(sourceNodeId, {
            ...sourceData,
            fatherId: targetNodeId
          });
        }

        toast({
          title: 'Success',
          description: 'Parent-child relationship created successfully',
        });
      }

      // Re-fetch members to update the tree
      await fetchMembers();

    } catch (error) {
      console.error('Relationship creation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create relationship',
        variant: 'destructive',
      });
    }
  };

  // Legacy onConnect handler (keeping for compatibility)
  const onConnect = useCallback((connection: Connection) => {
    const isSpouseConnection = 
      (connection.sourceHandle?.includes('spouse') && connection.targetHandle?.includes('spouse'));
    
    setPendingConnection({
      connection,
      isOpen: true
    });
    
    setRelationshipType(isSpouseConnection ? 'spouse' : 'parent');
  }, []);

  // Legacy confirm relationship function
  const confirmRelationship = async () => {
    const { connection } = pendingConnection;
    
    if (!connection.source || !connection.target) return;

    try {
      if (relationshipType === 'spouse') {
        await handleSetRelationship(connection.source, connection.target, 'Add a Spouse');
      } else {
        await handleSetRelationship(connection.source, connection.target, 'Add a Child');
      }

      setPendingConnection({ connection: {} as Connection, isOpen: false });

    } catch (error) {
      console.error('Relationship creation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create relationship',
        variant: 'destructive',
      });
    }
  };

  const cancelConnection = () => {
    setPendingConnection({ connection: {} as Connection, isOpen: false });
  };

  const cleanFormData = (data: MemberFormData) => {
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      maidenName: data.maidenName || undefined,
      gender: data.gender || undefined,
      birthDate: data.birthDate || undefined,
      deathDate: data.deathDate || undefined,
      birthPlace: data.birthPlace || undefined,
      occupation: data.occupation || undefined,
      biography: data.biography || undefined,
      profilePhotoUrl: data.profilePhotoUrl || undefined,
      fatherId: data.fatherId === 'none' ? null : data.fatherId || null,
      motherId: data.motherId === 'none' ? null : data.motherId || null,
      spouseId: data.spouseId === 'none' ? null : data.spouseId || null,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanedData = cleanFormData(formData);
      
      if (editMode === 'edit' && selectedMember) {
        await apiClient.updateFamilyMember(selectedMember.id, cleanedData);
        toast({
          title: 'Success',
          description: 'Family member updated successfully',
        });
      } else {
        await apiClient.createFamilyMember(cleanedData);
        toast({
          title: 'Success',
          description: 'Family member created successfully',
        });
      }
      
      setIsDialogOpen(false);
      setSelectedMember(null);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast({
        title: 'Error',
        description: editMode === 'edit' ? 'Failed to update member' : 'Failed to create member',
        variant: 'destructive',
      });
    }
  };

  const formatDateForInput = (isoDate: string | null | undefined): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setSelectedMember(member);
    setEditMode('edit');
    setFormData({
      firstName: member.first_name,
      lastName: member.last_name,
      maidenName: member.maiden_name || '',
      gender: (member as any).gender || '',
      birthDate: formatDateForInput(member.birth_date),
      deathDate: formatDateForInput(member.death_date),
      birthPlace: member.birth_place || '',
      occupation: member.occupation || '',
      biography: member.biography || '',
      profilePhotoUrl: member.profile_photo_url || '',
      fatherId: member.father_id || 'none',
      motherId: member.mother_id || 'none',
      spouseId: member.spouse_id || 'none'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (member: FamilyMember) => {
    if (!confirm(`Are you sure you want to delete ${member.first_name} ${member.last_name}?`)) return;
    
    try {
      await apiClient.deleteFamilyMember(member.id);
      toast({
        title: 'Success',
        description: 'Family member deleted successfully',
      });
      fetchMembers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete family member',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    setSelectedMember(null);
    setEditMode('create');
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      maidenName: '',
      gender: '',
      birthDate: '',
      deathDate: '',
      birthPlace: '',
      occupation: '',
      biography: '',
      profilePhotoUrl: '',
      fatherId: '',
      motherId: '',
      spouseId: ''
    });
  };

  const getMemberName = (member: FamilyMember) => {
    return `${member.first_name} ${member.last_name}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b bg-white">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Family Tree Editor
          </h2>
          <p className="text-gray-600">Interactive family tree powered by React Flow</p>
          {linkingState.isActive && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
              {linkingState.step === 'selectType' && (
                <p className="text-blue-700 text-sm">Step 1: Select relationship type</p>
              )}
              {linkingState.step === 'selectTarget' && (
                <p className="text-blue-700 text-sm">
                  Step 2: Click on the target node to create "{linkingState.relationshipType}" relationship
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
          <Button variant="outline" onClick={handleAutoLayout} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Auto Layout
          </Button>
          {linkingState.isActive && (
            <Button variant="outline" onClick={cancelLinking} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel Linking
            </Button>
          )}
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#f1f5f9" />
          <Controls />
          <MiniMap 
            nodeStrokeColor="#374151"
            nodeColor="#f3f4f6"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Relationship Type Selection Dialog */}
      <Dialog open={linkingState.step === 'selectType'} onOpenChange={cancelLinking}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Relationship Type</DialogTitle>
            <DialogDescription>
              What type of relationship do you want to create?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Button 
              className="w-full justify-start"
              onClick={() => selectRelationshipType('Add a Spouse')}
            >
              Add a Spouse
            </Button>
            <Button 
              className="w-full justify-start"
              onClick={() => selectRelationshipType('Add a Child')}
            >
              Add a Child
            </Button>
            <Button 
              className="w-full justify-start"
              onClick={() => selectRelationshipType('Add a Parent')}
            >
              Add a Parent
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelLinking}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legacy Connection Confirmation Dialog */}
      <Dialog open={pendingConnection.isOpen} onOpenChange={cancelConnection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Relationship</DialogTitle>
            <DialogDescription>
              What type of relationship do you want to create between these family members?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Relationship Type</Label>
              <Select value={relationshipType} onValueChange={(value: 'parent' | 'spouse') => setRelationshipType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent-Child</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelConnection}>
              Cancel
            </Button>
            <Button onClick={confirmRelationship}>
              Create Relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editMode === 'edit' ? 'Edit Family Member' : 'Add Family Member'}
              </DialogTitle>
              <DialogDescription>
                {editMode === 'edit' ? 'Update the family member details below.' : 'Fill in the details to add a new family member.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maidenName">Maiden Name (Optional)</Label>
                  <Input
                    id="maidenName"
                    value={formData.maidenName}
                    onChange={(e) => setFormData({ ...formData, maidenName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates and Places */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deathDate">Death Date (Optional)</Label>
                  <Input
                    id="deathDate"
                    type="date"
                    value={formData.deathDate}
                    onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthPlace">Birth Place</Label>
                <Input
                  id="birthPlace"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                  placeholder="City, State/Province, Country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profilePhotoUrl">Profile Photo URL</Label>
                <Input
                  id="profilePhotoUrl"
                  type="url"
                  value={formData.profilePhotoUrl}
                  onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {/* Biography */}
              <div className="space-y-2">
                <Label htmlFor="biography">Biography</Label>
                <Textarea
                  id="biography"
                  value={formData.biography}
                  onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                  rows={4}
                  placeholder="Life story, achievements, and memories..."
                />
              </div>

              {/* Family Relationships */}
              <div className="space-y-4">
                <h4 className="font-medium">Family Relationships</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="father">Father</Label>
                    <Select value={formData.fatherId} onValueChange={(value) => setFormData({ ...formData, fatherId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select father" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No father selected</SelectItem>
                        {members.filter(m => m.id !== selectedMember?.id).map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {getMemberName(member)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mother">Mother</Label>
                    <Select value={formData.motherId} onValueChange={(value) => setFormData({ ...formData, motherId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mother" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No mother selected</SelectItem>
                        {members.filter(m => m.id !== selectedMember?.id).map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {getMemberName(member)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spouse">Spouse</Label>
                    <Select value={formData.spouseId} onValueChange={(value) => setFormData({ ...formData, spouseId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select spouse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No spouse selected</SelectItem>
                        {members.filter(m => m.id !== selectedMember?.id).map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {getMemberName(member)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editMode === 'edit' ? 'Update Member' : 'Create Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrap the component with ReactFlowProvider
const FamilyTreeEditorWithProvider: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FamilyTreeEditor />
    </ReactFlowProvider>
  );
};

export default FamilyTreeEditorWithProvider;