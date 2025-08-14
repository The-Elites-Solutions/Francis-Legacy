import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, FileText, Image, Video, File, Upload, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  s3_key?: string;
  uploaded_by_name?: string;
  created_at: string;
}

interface ArchiveStats {
  documents: number;
  photos: number;
  videos: number;
  audio: number;
  total: number;
  years_covered: number;
}

const categories = [
  'All', 'Legal Documents', 'Family Events', 'Immigration Records', 
  'Personal Letters', 'Business History', 'Childhood Memories', 
  'Recipes & Traditions', 'Family Celebrations'
];

const types = ['All', 'document', 'photo', 'video', 'audio'];
const decades = ['All', '1870s', '1920s', '1940s', '1960s', '1980s', '2000s', '2020s'];

export default function Archives() {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDecade, setSelectedDecade] = useState('All');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
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
  
  const { toast } = useToast();

  useEffect(() => {
    loadArchives();
    loadStats();
  }, [searchQuery, selectedCategory, selectedType, selectedDecade]);

  const loadArchives = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory !== 'All') filters.category = selectedCategory;
      if (selectedType !== 'All') filters.type = selectedType;
      if (selectedDecade !== 'All') filters.decade = selectedDecade;

      const response = await apiClient.getArchives(filters);
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

  const loadStats = async () => {
    try {
      const response = await apiClient.getArchiveStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading archive stats:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-populate title from filename
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

      const result = await apiClient.uploadAndCreateArchive(selectedFile, {
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
      
      // Reload archives to show the new item
      loadArchives();
      loadStats();
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

  const handleDownload = async (archive: ArchiveItem) => {
    try {
      const response = await apiClient.getArchiveDownloadUrl(archive.id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = response.downloadUrl;
      link.download = archive.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Download Started',
        description: `Downloading ${archive.title}`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to generate download link',
        variant: 'destructive'
      });
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('document') || type.includes('pdf') || type.includes('text')) return FileText;
    if (type.includes('image')) return Image;
    if (type.includes('video')) return Video;
    return File;
  };

  const getTypeColor = (type: string) => {
    if (type.includes('document') || type.includes('pdf') || type.includes('text')) return 'bg-blue-500/20 text-blue-400';
    if (type.includes('image')) return 'bg-green-500/20 text-green-400';
    if (type.includes('video')) return 'bg-purple-500/20 text-purple-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            Family <span className="text-yellow-600">Archives</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto px-2">
            Our digital repository of family documents, photos, videos, and memorabilia. 
            Preserving precious memories and important records for future generations.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 sm:mb-12 space-y-4 sm:space-y-6">
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
              <Input
                placeholder="Search archives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-primary/30 text-foreground placeholder-foreground/50 shadow-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-white border-primary/30 text-foreground shadow-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white border-primary/30">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-foreground hover:text-yellow-600">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-white border-primary/30 text-foreground shadow-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-primary/30">
                {types.map((type) => (
                  <SelectItem key={type} value={type} className="text-foreground hover:text-yellow-600">
                    {type === 'All' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDecade} onValueChange={setSelectedDecade}>
              <SelectTrigger className="bg-white border-primary/30 text-foreground shadow-sm">
                <SelectValue placeholder="Era" />
              </SelectTrigger>
              <SelectContent className="bg-white border-primary/30">
                {decades.map((decade) => (
                  <SelectItem key={decade} value={decade} className="text-foreground hover:text-yellow-600">
                    {decade === 'All' ? 'All Eras' : decade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => setShowUploadDialog(true)}
              className="gold-texture text-white hover:opacity-90 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Archives
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-foreground/60 mt-4">Loading archives...</p>
          </div>
        )}

        {/* Archive Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {archives.map((item) => {
              const TypeIcon = getTypeIcon(item.file_type);
              return (
                <Card key={item.id} className="bg-white shadow-md border-primary/30 hover:border-primary/60 transition-all duration-300 group hover:shadow-lg">
                  <div className="aspect-video overflow-hidden rounded-t-lg relative">
                    <img 
                      src={item.file_url} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-md flex items-center space-x-1 ${getTypeColor(item.file_type)}`}>
                      <TypeIcon className="w-3 h-3" />
                      <span className="text-xs font-medium capitalize">
                        {item.file_type.includes('image') ? 'photo' : 
                         item.file_type.includes('video') ? 'video' : 
                         item.file_type.includes('audio') ? 'audio' : 'document'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 text-foreground/90 px-2 py-1 rounded-md text-xs shadow-sm">
                      {formatFileSize(item.file_size)}
                    </div>
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="border-primary/30 text-yellow-600 text-xs">
                        {item.category}
                      </Badge>
                      <div className="flex items-center text-foreground/60 text-xs">
                        <Calendar className="w-3 h-3 mr-1 text-yellow-600" />
                        {item.date_taken ? new Date(item.date_taken).getFullYear() : 'Unknown'}
                      </div>
                    </div>
                    <CardTitle className="text-foreground group-hover:text-yellow-600 transition-colors text-lg">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-foreground/70">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {item.person_related && (
                        <div className="text-sm text-foreground/80">
                          <span className="text-yellow-600">Person:</span> {item.person_related}
                        </div>
                      )}
                      {item.location && (
                        <div className="text-sm text-foreground/80">
                          <span className="text-yellow-600">Location:</span> {item.location}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-primary/10 text-yellow-600 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-foreground/60">
                          Uploaded by {item.uploaded_by_name || 'Unknown'}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-primary/30 text-yellow-600 hover:bg-primary/5"
                            onClick={() => window.open(item.file_url, '_blank')}
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-primary/30 text-yellow-600 hover:bg-primary/5"
                            onClick={() => handleDownload(item)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && archives.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No archives found</h3>
            <p className="text-foreground/60 mb-6">
              {searchQuery || selectedCategory !== 'All' || selectedType !== 'All' || selectedDecade !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Start building your family archive by uploading documents and photos'}
            </p>
          </div>
        )}

        {/* Archive Statistics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-12 sm:mb-16">
            <Card className="bg-white shadow-md border-primary/30 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.documents}</div>
                <div className="text-foreground/70 text-sm">Documents</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-md border-primary/30 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-3">
                  <Image className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.photos}</div>
                <div className="text-foreground/70 text-sm">Photos</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-md border-primary/30 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-3">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.videos}</div>
                <div className="text-foreground/70 text-sm">Videos</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-md border-primary/30 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.years_covered}+</div>
                <div className="text-foreground/70 text-sm">Years Covered</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-md mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add to Archives</DialogTitle>
              <DialogDescription>
                Upload a document, photo, or video to add to the family archives.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* File Selection */}
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                {selectedFile && (
                  <p className="text-sm text-foreground/60 mt-1">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              {/* Title */}
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

              {/* Description */}
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

              {/* Category */}
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={uploadMetadata.category} onValueChange={(value) => setUploadMetadata(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat !== 'All').map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
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

              {/* Date */}
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

              {/* Location */}
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

              {/* Person */}
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

              {/* Upload Button */}
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !uploadMetadata.title || uploading}
                  className="flex-1 gold-texture text-white"
                >
                  {uploading ? 'Uploading...' : 'Upload to Archives'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}