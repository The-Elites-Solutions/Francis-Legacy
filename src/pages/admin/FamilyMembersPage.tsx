import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Search,
  Edit2,
  Key,
  TreePine,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: 'member';
  password_changed: boolean;
  created_at: string;
  last_login?: string;
  birth_date?: string;
  phone?: string;
  profile_photo_url?: string;
  father_id?: string;
  mother_id?: string;
  spouse_id?: string;
  has_password: boolean;
  auth_status: string;
}

const FamilyMembersPage: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const filtered = members.filter(member => 
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [members, searchTerm]);

  const fetchMembers = async () => {
    try {
      const data = await apiClient.getFamilyMembersWithAuth();
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


  const handlePasswordReset = async (member: FamilyMember) => {
    if (!confirm(`Are you sure you want to reset the password for ${member.first_name} ${member.last_name}?`)) {
      return;
    }

    try {
      const response = await apiClient.resetFamilyMemberPassword(member.id);
      
      // Show the new password to admin
      alert(`Password reset successful!
      
Username: ${response.username}
New Password: ${response.newPassword}

The member will be required to change their password on next login.
Please provide these credentials to ${member.first_name} ${member.last_name}.`);

      toast({
        title: 'Success',
        description: `Password reset for ${member.first_name} ${member.last_name}`,
      });
      
      fetchMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to reset password: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const getMemberName = (member: FamilyMember) => {
    return `${member.first_name} ${member.last_name}`;
  };

  const getStatusBadge = (member: FamilyMember) => {
    if (!member.has_password) {
      return <Badge variant="secondary">No Account</Badge>;
    }
    
    if (!member.password_changed) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Needs Password Change</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading family members...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Family Members
          </h2>
          <p className="text-gray-600">Manage family tree members and their login accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Family Tree Editor
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredMembers.length} of {members.length} family members
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Family Members with Login Access</CardTitle>
          <CardDescription>
            All family tree members and their authentication status. Each member gets an auto-generated username for login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Username/Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={member.profile_photo_url} 
                          alt={`${member.first_name} ${member.last_name}`}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getMemberName(member)}</div>
                        {member.birth_date && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(member.birth_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm font-mono">
                        <span className="font-medium">@{member.username}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(member)}
                      {member.last_login && (
                        <div className="text-xs text-gray-400">
                          Last: {new Date(member.last_login).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Edit in Family Tree"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {member.has_password && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handlePasswordReset(member)}
                            title="Reset Password"
                            className="hover:bg-blue-50"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No family members found. Add members to the family tree to see them here.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyMembersPage;