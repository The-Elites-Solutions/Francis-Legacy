import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Archive, Upload, Image, FileText, Calendar, MapPin, User, Edit, Trash2, Eye, Download, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  file_type: string;
  file_size: number;
  category: string;
  tags: string[];
  date_taken?: string;
  location?: string;
  person_related?: string;
  file_url: string;
  imagekit_file_id?: string;
  uploaded_by_name?: string;
  created_at: string;
}

const categories = [
  'Legal Documents', 'Family Events', 'Immigration Records', 
  'Personal Letters', 'Business History', 'Childhood Memories', 
  'Recipes & Traditions', 'Family Celebrations'
];

const ArchivePage: React.FC = () => {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    date_taken: '',
    location: '',
    person_related: ''
  });
  const [editMetadata, setEditMetadata] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    date_taken: '',
    location: '',
    person_related: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadArchives();
  }, [searchQuery, selectedCategory]);

  const loadArchives = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory !== 'All') filters.category = selectedCategory;

      const response = await apiClient.getAdminArchives(filters);
      setArchives(response.data);
    } catch (error) {
      console.error('Error loading archives:', error);
      toast({
        title: 'Error',
        description: 'Failed to load archives',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadMetadata.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadMetadata(prev => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const tagsArray = uploadMetadata.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const result = await apiClient.uploadAndCreateAdminArchive(selectedFile, {
        title: uploadMetadata.title,
        description: uploadMetadata.description,
        category: uploadMetadata.category,
        tags: tagsArray,
        date_taken: uploadMetadata.date_taken || undefined,
        location: uploadMetadata.location,
        person_related: uploadMetadata.person_related
      });

      toast({
        title: 'Success',
        description: 'Archive uploaded successfully!'
      });

      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadMetadata({
        title: '', description: '', category: '', tags: '',
        date_taken: '', location: '', person_related: ''
      });
      
      loadArchives();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (archive: ArchiveItem) => {
    setSelectedArchive(archive);
    setEditMetadata({
      title: archive.title,
      description: archive.description || '',
      category: archive.category || '',
      tags: archive.tags?.join(', ') || '',
      date_taken: archive.date_taken ? new Date(archive.date_taken).toISOString().split('T')[0] : '',
      location: archive.location || '',
      person_related: archive.person_related || ''
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedArchive) return;

    try {
      const tagsArray = editMetadata.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await apiClient.updateAdminArchive(selectedArchive.id, {
        title: editMetadata.title,
        description: editMetadata.description,
        category: editMetadata.category,
        tags: tagsArray,
        date_taken: editMetadata.date_taken || undefined,
        location: editMetadata.location,
        person_related: editMetadata.person_related,
        imagekit_file_id: selectedArchive.imagekit_file_id || '',
        file_url: selectedArchive.file_url,
        file_type: selectedArchive.file_type,
        file_size: selectedArchive.file_size
      });

      toast({
        title: 'Success',
        description: 'Archive updated successfully!'
      });

      setShowEditDialog(false);
      loadArchives();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update archive',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedArchive) return;

    try {
      await apiClient.deleteAdminArchive(selectedArchive.id);
      
      toast({
        title: 'Success',
        description: 'Archive deleted successfully!'
      });

      setShowDeleteDialog(false);
      setSelectedArchive(null);
      loadArchives();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete archive',
        variant: 'destructive'
      });
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('image')) return Image;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
    return Archive;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const photoArchives = archives.filter(item => item.file_type.includes('image'));
  const documentArchives = archives.filter(item => !item.file_type.includes('image'));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Archive Management</h2>
        <p className="text-gray-600">Manage family photos, documents, and historical files</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search archives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add to Archives
        </Button>
      </div>

      <Tabs defaultValue="photos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="photos">Photos ({photoArchives.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documentArchives.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
              <CardDescription>Browse and manage uploaded family photos</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : photoArchives.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {photoArchives.map((item) => (
                    <div key={item.id} className="group relative">
                      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                        <img 
                          src={item.file_url} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="mt-2">
                        <h4 className="font-medium text-sm truncate">{item.title}</h4>
                        <p className="text-xs text-gray-500">{formatFileSize(item.file_size)}</p>
                        {item.date_taken && (
                          <p className="text-xs text-gray-500">
                            {new Date(item.date_taken).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={() => window.open(item.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedArchive(item);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No photos found</p>
                  <p className="text-sm">Upload photos to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
              <CardDescription>Browse and manage uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : documentArchives.length > 0 ? (
                <div className="space-y-2">
                  {documentArchives.map((item) => {
                    const TypeIcon = getTypeIcon(item.file_type);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <div className="flex gap-4 text-sm text-gray-500">
                              <span>{formatFileSize(item.file_size)}</span>
                              {item.category && <span>{item.category}</span>}
                              {item.date_taken && (
                                <span>{new Date(item.date_taken).toLocaleDateString()}</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(item.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedArchive(item);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents found</p>
                  <p className="text-sm">Upload documents to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to Archives</DialogTitle>
            <DialogDescription>
              Upload a document or photo to add to the family archives.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={uploadMetadata.title}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a descriptive title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadMetadata.description}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this archive item..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={uploadMetadata.category || undefined} onValueChange={(value) => setUploadMetadata(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={uploadMetadata.tags}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="date_taken">Date</Label>
              <Input
                id="date_taken"
                type="date"
                value={uploadMetadata.date_taken}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, date_taken: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={uploadMetadata.location}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Where was this taken/created?"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="person_related">People</Label>
              <Input
                id="person_related"
                value={uploadMetadata.person_related}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, person_related: e.target.value }))}
                placeholder="Who is featured in this item?"
                className="mt-1"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !uploadMetadata.title || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload to Archives'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Archive</DialogTitle>
            <DialogDescription>
              Update the metadata for this archive item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editMetadata.title}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a descriptive title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editMetadata.description}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this archive item..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editMetadata.category || undefined} onValueChange={(value) => setEditMetadata(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={editMetadata.tags}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editMetadata.date_taken}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, date_taken: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editMetadata.location}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Where was this taken/created?"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-person">People</Label>
              <Input
                id="edit-person"
                value={editMetadata.person_related}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, person_related: e.target.value }))}
                placeholder="Who is featured in this item?"
                className="mt-1"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!editMetadata.title}>
                Update Archive
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedArchive?.title}" from the archives. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArchivePage;