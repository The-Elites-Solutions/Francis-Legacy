import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, Plus, Edit2, Trash2, Save, X, Move, Link, Unlink, 
  User, Heart, MapPin, Calendar, Briefcase, BookOpen
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FamilyMember {
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

interface MemberFormData {
  firstName: string;
  lastName: string;
  maidenName: string;
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

const FamilyTreeEditor: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [linkingMode, setLinkingMode] = useState<'parent' | 'spouse' | null>(null);
  const [selectedForLinking, setSelectedForLinking] = useState<string | null>(null);
  const [draggedMember, setDraggedMember] = useState<string | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    firstName: '',
    lastName: '',
    maidenName: '',
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

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

  const cleanFormData = (data: MemberFormData) => {
    return {
      ...data,
      fatherId: data.fatherId === 'none' ? '' : data.fatherId,
      motherId: data.motherId === 'none' ? '' : data.motherId,
      spouseId: data.spouseId === 'none' ? '' : data.spouseId,
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

  // Helper function to convert ISO date to YYYY-MM-DD format for HTML date inputs
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

  const startLinking = (mode: 'parent' | 'spouse', memberId: string) => {
    setLinkingMode(mode);
    setSelectedForLinking(memberId);
  };

  const completeLinking = (targetMemberId: string) => {
    if (!linkingMode || !selectedForLinking) return;

    // Create relationship between selectedForLinking and targetMemberId
    const updatedFormData = { ...formData };
    
    if (linkingMode === 'parent') {
      // Set targetMember as child of selectedForLinking
      const targetMember = members.find(m => m.id === targetMemberId);
      if (targetMember) {
        updatedFormData.fatherId = selectedForLinking; // Or motherId based on context
      }
    } else if (linkingMode === 'spouse') {
      updatedFormData.spouseId = targetMemberId;
    }

    // Update the relationship
    handleRelationshipUpdate(targetMemberId, updatedFormData);
    
    setLinkingMode(null);
    setSelectedForLinking(null);
  };

  const handleRelationshipUpdate = async (memberId: string, updates: Partial<MemberFormData>) => {
    try {
      await apiClient.updateFamilyMember(memberId, updates);
      fetchMembers();
      toast({
        title: 'Success',
        description: 'Relationship updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update relationship',
        variant: 'destructive',
      });
    }
  };

  const getMemberName = (member: FamilyMember) => {
    return `${member.first_name} ${member.last_name}`;
  };

  const getRelatedMembers = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return { parents: [], children: [], spouse: null };

    const parents = members.filter(m => 
      m.id === member.father_id || m.id === member.mother_id
    );
    
    const children = members.filter(m => 
      m.father_id === memberId || m.mother_id === memberId
    );
    
    const spouse = member.spouse_id ? members.find(m => m.id === member.spouse_id) : null;

    return { parents, children, spouse };
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Family Tree Editor
          </h2>
          <p className="text-gray-600">Manage family relationships and member information</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Family Member
          </Button>
          {linkingMode && (
            <Button 
              variant="outline" 
              onClick={() => {setLinkingMode(null); setSelectedForLinking(null);}}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel Linking
            </Button>
          )}
        </div>
      </div>

      {linkingMode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Link className="h-4 w-4" />
              <span>
                Linking mode active: Select another member to create a {linkingMode} relationship
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tree Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Family Tree Structure</CardTitle>
          <CardDescription>
            Visual representation of family relationships. Click members to edit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Root members (no parents) */}
            {members.filter(member => !member.father_id && !member.mother_id).map((rootMember) => (
              <div key={rootMember.id} className="space-y-4">
                <MemberCard 
                  member={rootMember}
                  members={members}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onLink={startLinking}
                  onLinkComplete={completeLinking}
                  isLinkingMode={linkingMode !== null}
                  isSelected={selectedForLinking === rootMember.id}
                />
                {/* Children */}
                {members.filter(m => m.father_id === rootMember.id || m.mother_id === rootMember.id).length > 0 && (
                  <div className="ml-8 space-y-4 border-l-2 border-gray-200 pl-4">
                    {members
                      .filter(m => m.father_id === rootMember.id || m.mother_id === rootMember.id)
                      .map((child) => (
                        <MemberCard 
                          key={child.id}
                          member={child}
                          members={members}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onLink={startLinking}
                          onLinkComplete={completeLinking}
                          isLinkingMode={linkingMode !== null}
                          isSelected={selectedForLinking === child.id}
                          level={1}
                        />
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

              <div className="space-y-2">
                <Label htmlFor="maidenName">Maiden Name (Optional)</Label>
                <Input
                  id="maidenName"
                  value={formData.maidenName}
                  onChange={(e) => setFormData({ ...formData, maidenName: e.target.value })}
                />
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

interface MemberCardProps {
  member: FamilyMember;
  members: FamilyMember[];
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onLink: (mode: 'parent' | 'spouse', memberId: string) => void;
  onLinkComplete: (memberId: string) => void;
  isLinkingMode: boolean;
  isSelected: boolean;
  level?: number;
}

const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  members, 
  onEdit, 
  onDelete, 
  onLink, 
  onLinkComplete,
  isLinkingMode,
  isSelected,
  level = 0 
}) => {
  const getMemberName = (member: FamilyMember) => {
    return `${member.first_name} ${member.last_name}`;
  };

  const getRelatedMembers = (memberId: string) => {
    const parents = members.filter(m => 
      m.id === member.father_id || m.id === member.mother_id
    );
    
    const children = members.filter(m => 
      m.father_id === memberId || m.mother_id === memberId
    );
    
    const spouse = member.spouse_id ? members.find(m => m.id === member.spouse_id) : null;

    return { parents, children, spouse };
  };

  const related = getRelatedMembers(member.id);

  return (
    <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.profile_photo_url} />
              <AvatarFallback>
                {member.first_name.charAt(0)}{member.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-lg">{getMemberName(member)}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {member.birth_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {member.birth_date}
                    {member.death_date && ` - ${member.death_date}`}
                  </div>
                )}
                {member.occupation && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {member.occupation}
                  </div>
                )}
                {member.birth_place && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {member.birth_place}
                  </div>
                )}
              </div>
              
              {/* Family relationships */}
              <div className="mt-2 flex flex-wrap gap-1">
                {related.parents.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Child of {related.parents.map(p => p.first_name).join(' & ')}
                  </Badge>
                )}
                {related.spouse && (
                  <Badge variant="outline" className="text-xs">
                    <Heart className="h-3 w-3 mr-1" />
                    Married to {related.spouse.first_name}
                  </Badge>
                )}
                {related.children.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Parent of {related.children.length} child{related.children.length > 1 ? 'ren' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            {isLinkingMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLinkComplete(member.id)}
                disabled={isSelected}
              >
                <Link className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => onLink('parent', member.id)}>
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(member)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(member)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyTreeEditor;