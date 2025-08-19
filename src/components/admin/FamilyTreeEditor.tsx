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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Plus, Save, X, RotateCcw, Grid, Link, Key, RefreshCw, Eye, EyeOff
} from 'lucide-react';

import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import MemberNode, { FamilyMember, MemberNodeData } from './MemberNode';
import { edgeTypes } from './FamilyTreeEdges';
import { ReactFlowFamilyTreeLayout } from './FamilyTreeLayout';
import { IMAGEKIT_CONFIG } from '@/lib/imagekit-config';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

interface MemberFormData {
  firstName: string;
  lastName: string;
  maidenName: string;
  gender: string;
  birthDate: string;
  deathDate: string;
  birthCountry: string;
  birthCity: string;
  occupation: string;
  biography: string;
  profilePhotoFile: File | null;
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

// Countries list
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria',
  'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Cuba', 'Czech Republic',
  'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia', 'Finland', 'France',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kuwait', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malaysia', 'Mali', 'Malta', 'Mexico', 'Moldova', 'Mongolia', 'Morocco', 'Myanmar',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Nigeria', 'North Korea', 'Norway',
  'Pakistan', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 
  'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Thailand', 'Tunisia', 'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 
  'Uruguay', 'Venezuela', 'Vietnam', 'Yemen', 'Zimbabwe'
];

// Common occupations
const OCCUPATIONS = [
  'Accountant', 'Actor', 'Architect', 'Artist', 'Baker', 'Banker', 'Barber', 'Businessman', 'Carpenter',
  'Chef', 'Clerk', 'Construction Worker', 'Dentist', 'Designer', 'Doctor', 'Driver', 'Electrician', 'Engineer',
  'Farmer', 'Firefighter', 'Fisherman', 'Government Official', 'Homemaker', 'Journalist', 'Judge', 'Lawyer',
  'Manager', 'Mechanic', 'Military Officer', 'Musician', 'Nurse', 'Painter', 'Pastor', 'Pharmacist', 'Photographer',
  'Pilot', 'Plumber', 'Police Officer', 'Politician', 'Professor', 'Real Estate Agent', 'Retired', 'Salesperson',
  'Scientist', 'Secretary', 'Shop Owner', 'Student', 'Tailor', 'Teacher', 'Technician', 'Unemployed', 'Writer'
];

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
    birthCountry: 'none',
    birthCity: '',
    occupation: 'none',
    biography: '',
    profilePhotoFile: null,
    profilePhotoUrl: '',
    fatherId: '',
    motherId: '',
    spouseId: ''
  });
  
  
  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState<{username: string; tempPassword: string} | null>(null);
  
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
        // Validate that spouses are from the same generation
        const layout = new ReactFlowFamilyTreeLayout(members);
        layout.organizeByGenerations();
        
        const sourceGeneration = layout.getMemberGeneration(sourceNodeId);
        const targetGeneration = layout.getMemberGeneration(targetNodeId);
        
        if (sourceGeneration !== targetGeneration) {
          toast({
            title: 'Invalid Relationship',
            description: `Cannot create spouse relationship between different generations. ${sourceNode.first_name} is in generation ${sourceGeneration + 1} and ${targetNode.first_name} is in generation ${targetGeneration + 1}.`,
            variant: 'destructive',
          });
          return;
        }

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

  // Generate username from first and last name
  const generateUsername = (firstName: string, lastName: string) => {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-zA-Z0-9.]/g, '');
  };

  // Handle password reset for family members
  const handlePasswordReset = async (memberId: string, memberName: string) => {
    try {
      const response = await apiClient.resetFamilyMemberPassword(memberId);
      
      setResetPasswordData({
        username: response.username,
        tempPassword: response.newPassword
      });
      setShowPasswordReset(true);
      
      toast({
        title: 'Password Reset Successful',
        description: `Password has been reset for ${memberName}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to reset password: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const cleanFormData = (data: MemberFormData) => {
    // Handle "none" values for country and occupation
    const country = data.birthCountry === 'none' ? '' : data.birthCountry;
    const occupation = data.occupation === 'none' ? '' : data.occupation;
    
    // Combine country and city into birthPlace
    const birthPlace = country && data.birthCity 
      ? `${data.birthCity}, ${country}`
      : country || data.birthCity || '';
      
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      maidenName: data.maidenName || undefined,
      gender: data.gender === 'male' ? 'M' : data.gender === 'female' ? 'F' : undefined,
      birthDate: data.birthDate || undefined,
      deathDate: data.deathDate || undefined,
      birthPlace: birthPlace || undefined,
      occupation: occupation || undefined,
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
      // Photo is already uploaded via ProfilePictureUpload component, just use the URL
      const cleanedData = cleanFormData(formData);
      
      if (editMode === 'edit' && selectedMember) {
        await apiClient.updateFamilyMember(selectedMember.id, cleanedData);
        toast({
          title: 'Success',
          description: 'Family member updated successfully',
        });
      } else {
        const result = await apiClient.createFamilyMember(cleanedData);
        
        // Show success message with authentication info for new members
        const username = generateUsername(formData.firstName, formData.lastName);
        toast({
          title: 'Family Member Created Successfully',
          description: `${formData.firstName} ${formData.lastName} has been added to the family tree. Username: ${username}`,
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

  const parseBirthPlace = (birthPlace: string | null) => {
    if (!birthPlace) return { country: '', city: '' };
    const parts = birthPlace.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      const country = parts[parts.length - 1];
      const city = parts.slice(0, -1).join(', ');
      return { country, city };
    }
    return { country: birthPlace, city: '' };
  };

  const handleEdit = (member: FamilyMember) => {
    setSelectedMember(member);
    setEditMode('edit');
    const { country, city } = parseBirthPlace(member.birth_place);
    setFormData({
      firstName: member.first_name,
      lastName: member.last_name,
      maidenName: member.maiden_name || '',
      gender: (member as any).gender || '',
      birthDate: formatDateForInput(member.birth_date),
      deathDate: formatDateForInput(member.death_date),
      birthCountry: country || 'none',
      birthCity: city,
      occupation: member.occupation || 'none',
      biography: member.biography || '',
      profilePhotoFile: null,
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
      birthCountry: 'none',
      birthCity: '',
      occupation: 'none',
      biography: '',
      profilePhotoFile: null,
      profilePhotoUrl: '',
      fatherId: '',
      motherId: '',
      spouseId: ''
    });
  };

  const handlePhotoUpdate = (newPhotoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      profilePhotoUrl: newPhotoUrl
    }));
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
                  <Select value={formData.gender || undefined} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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

              {/* Birth Place - Country and City */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthCountry">Birth Country</Label>
                  <Select value={formData.birthCountry} onValueChange={(value) => setFormData({ ...formData, birthCountry: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="none">No country selected</SelectItem>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthCity">Birth City</Label>
                  <Input
                    id="birthCity"
                    value={formData.birthCity}
                    onChange={(e) => setFormData({ ...formData, birthCity: e.target.value })}
                    placeholder="Enter city name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Select value={formData.occupation} onValueChange={(value) => setFormData({ ...formData, occupation: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">No occupation selected</SelectItem>
                    {OCCUPATIONS.map((occupation) => (
                      <SelectItem key={occupation} value={occupation}>
                        {occupation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Profile Photo Upload with Cropping */}
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="flex justify-center">
                  <ProfilePictureUpload
                    currentPhotoUrl={formData.profilePhotoUrl}
                    userName={formData.firstName && formData.lastName ? `${formData.firstName} ${formData.lastName}` : 'Family Member'}
                    onPhotoUpdate={handlePhotoUpdate}
                    isAdminMode={true}
                  />
                </div>
                {formData.profilePhotoUrl && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, profilePhotoUrl: '' })}
                      className="mt-2"
                    >
                      Remove Photo
                    </Button>
                  </div>
                )}
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

              {/* Authentication Information - Show for both create and edit modes */}
              {formData.firstName && formData.lastName && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-sm text-gray-700">
                    {editMode === 'edit' ? 'Authentication Information' : 'Login Account Preview'}
                  </h4>
                  
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Username (Auto-generated)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={generateUsername(formData.firstName, formData.lastName)}
                          readOnly
                          className="bg-white text-blue-700 font-mono text-sm"
                        />
                        <Eye className="h-4 w-4 text-blue-400" />
                      </div>
                      <p className="text-xs text-blue-600">
                        {editMode === 'edit' 
                          ? 'Current username for this family member'
                          : 'This member will get automatic login access with this username'
                        }
                      </p>
                    </div>
                    
                    {editMode === 'edit' && selectedMember && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Password Status</Label>
                          <div className="flex items-center space-x-2">
                            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              Default Password
                            </div>
                            <span className="text-xs text-gray-500">User should change password on first login</span>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Reset Password
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reset Password</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reset the password for {formData.firstName} {formData.lastName}? 
                                  This will generate a new temporary password that you'll need to share with them.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => selectedMember && handlePasswordReset(selectedMember.id, `${formData.firstName} ${formData.lastName}`)}
                                >
                                  Reset Password
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                    
                    {editMode === 'create' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Initial Setup</Label>
                        <div className="text-xs text-blue-600 space-y-1">
                          <p>• A temporary password will be automatically generated</p>
                          <p>• The member must change password on first login</p>
                          <p>• Login credentials will be shown after member creation</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Family Relationships */}
              <div className="space-y-4">
                <h4 className="font-medium">Family Relationships</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="father">Father</Label>
                    <Select value={formData.fatherId || undefined} onValueChange={(value) => setFormData({ ...formData, fatherId: value })}>
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
                    <Select value={formData.motherId || undefined} onValueChange={(value) => setFormData({ ...formData, motherId: value })}>
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
                    <Select value={formData.spouseId || undefined} onValueChange={(value) => setFormData({ ...formData, spouseId: value })}>
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

      {/* Password Reset Result Dialog */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password Reset Successful
            </DialogTitle>
            <DialogDescription>
              The password has been reset. Please share these credentials with the family member.
            </DialogDescription>
          </DialogHeader>
          
          {resetPasswordData && (
            <div className="space-y-4 py-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Save these credentials securely and share them with the family member.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Username</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={resetPasswordData.username}
                      readOnly
                      className="bg-white font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Temporary Password</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={resetPasswordData.tempPassword}
                      readOnly
                      className="bg-white font-mono text-sm"
                      type="text"
                    />
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>• The family member must change this password on first login</p>
                <p>• This temporary password will expire after first use</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => {
              setShowPasswordReset(false);
              setResetPasswordData(null);
            }}>
              Got it
            </Button>
          </DialogFooter>
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