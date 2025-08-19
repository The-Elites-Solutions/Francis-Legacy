import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
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
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  UserCheck,
  Search,
  Key
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'member';
  is_active: boolean;
  email_verified: boolean;
  phone?: string;
  birth_date?: string;
  profile_image_url?: string;
  created_at: string;
  last_login?: string;
  created_by_name?: string;
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  birthDate: string;
  role: 'admin' | 'member';
  isActive: boolean;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    phone: '',
    birthDate: '',
    role: 'member',
    isActive: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch admin users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode === 'edit' && selectedUser) {
        await apiClient.updateUser(selectedUser.id, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          birthDate: formData.birthDate,
          isActive: formData.isActive,
          role: formData.role
        });
        toast({
          title: 'Success',
          description: 'Admin user updated successfully',
        });
      } else {
        await apiClient.createUser({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        });
        toast({
          title: 'Success',
          description: 'Admin user created successfully',
        });
      }
      
      setIsDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: editMode === 'edit' ? `Failed to update admin user: ${error.message || 'Unknown error'}` : `Failed to create admin user: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditMode('edit');
    setFormData({
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      password: '', // Don't populate password for security
      phone: user.phone || '',
      birthDate: user.birth_date || '',
      role: user.role,
      isActive: user.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete admin user ${user.first_name} ${user.last_name}?`)) return;
    
    try {
      await apiClient.deleteUser(user.id);
      toast({
        title: 'Success',
        description: 'Admin user deleted successfully',
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete admin user',
        variant: 'destructive',
      });
    }
  };


  const handlePasswordReset = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to reset the password for admin user ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    try {
      const response = await apiClient.resetUserPassword(user.id);
      
      toast({
        title: 'Success',
        description: response.emailSent 
          ? `Password reset email sent to ${user.email}` 
          : 'Password reset successful but email could not be sent',
        variant: response.emailSent ? 'default' : 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to reset password: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setEditMode('create');
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      phone: '',
      birthDate: '',
      role: 'member',
      isActive: true
    });
  };

  const getUserName = (user: AdminUser) => {
    return `${user.first_name} ${user.last_name}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading admin users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Users
          </h2>
          <p className="text-gray-600">Manage administrator accounts with full system access</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admin users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} admin users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Administrator Accounts</CardTitle>
          <CardDescription>
            Admin users have full access to the admin panel and all system features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profile_image_url} />
                        <AvatarFallback>
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getUserName(user)}</div>
                        {user.birth_date && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.birth_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="default"
                        className="bg-green-100 text-green-800"
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      {user.email_verified && (
                        <Badge variant="outline" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                      {user.created_by_name && (
                        <div className="text-xs text-gray-500">
                          by {user.created_by_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePasswordReset(user)}
                        title="Reset Password"
                        className="hover:bg-blue-50"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editMode === 'edit' ? 'Edit Admin User' : 'Add Admin User'}
              </DialogTitle>
              <DialogDescription>
                {editMode === 'edit' 
                  ? 'Update the admin user details below.' 
                  : 'Create a new administrator account.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {editMode === 'create' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date (Optional)</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role || 'member'} onValueChange={(value: 'admin' | 'member') => 
                  setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editMode === 'edit' && (
                <div className="space-y-2">
                  <Label htmlFor="isActive">Account Status</Label>
                  <Select value={formData.isActive?.toString() || 'true'} onValueChange={(value: string) => 
                    setFormData({ ...formData, isActive: value === 'true' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editMode === 'edit' ? 'Update Admin User' : 'Create Admin User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;