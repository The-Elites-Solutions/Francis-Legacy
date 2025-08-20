import React, { useState, useEffect } from 'react';
import { Search, Calendar, FileText, Image, Video, File, Plus, Music, Archive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import SubmissionForm from '@/components/SubmissionForm';
import { useAuth } from '@/hooks/useAuth';

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
  
  const { toast } = useToast();
  const { user } = useAuth();

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



  const handleDownload = async (archive: ArchiveItem) => {
    try {
      // Since files are stored in ImageKit with public URLs, we can download directly
      if (archive.file_url) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = archive.file_url;
        link.download = archive.title || 'download';
        link.target = '_blank'; // Open in new tab as fallback
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Download Started',
          description: `Downloading ${archive.title}`
        });
      } else {
        // Fallback to API if file_url is not available
        try {
          const response = await apiClient.getArchiveDownloadUrl(archive.id);
          
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
        } catch (apiError) {
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('pdf')) return FileText;
    if (type.includes('document') || type.includes('text') || type.includes('docx') || type.includes('doc')) return FileText;
    if (type.includes('image') || type.includes('photo') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return Image;
    if (type.includes('video') || type.includes('mp4') || type.includes('avi') || type.includes('mov')) return Video;
    if (type.includes('audio') || type.includes('mp3') || type.includes('wav') || type.includes('music')) return Music;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return Archive;
    return File;
  };

  const getTypeColor = (type: string) => {
    if (type.includes('pdf')) return 'bg-red-500/20 text-red-400';
    if (type.includes('document') || type.includes('text') || type.includes('docx') || type.includes('doc')) return 'bg-blue-500/20 text-blue-400';
    if (type.includes('image') || type.includes('photo') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return 'bg-green-500/20 text-green-400';
    if (type.includes('video') || type.includes('mp4') || type.includes('avi') || type.includes('mov')) return 'bg-purple-500/20 text-purple-400';
    if (type.includes('audio') || type.includes('mp3') || type.includes('wav') || type.includes('music')) return 'bg-pink-500/20 text-pink-400';
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return 'bg-orange-500/20 text-orange-400';
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
            {user ? (
              <SubmissionForm 
                type="archive" 
                onSubmissionSuccess={loadArchives}
                triggerText="Add to Archives"
                className="gold-texture text-white hover:opacity-90 font-semibold"
              />
            ) : (
              <Button className="gold-texture text-white hover:opacity-90 font-semibold" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Login to Add Archives
              </Button>
            )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {archives.map((item) => {
              const TypeIcon = getTypeIcon(item.file_type);
              return (
                <Card key={item.id} className="bg-white shadow-md border-primary/30 hover:border-primary/60 transition-all duration-300 group hover:shadow-lg">
                  <div className="aspect-square w-full h-[382px] max-w-[382px] max-h-[382px] mx-auto overflow-hidden rounded-t-lg relative">
                    {item.file_type.includes('image') ? (
                      <img 
                        src={item.file_url} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const fallbackDiv = document.createElement('div');
                            fallbackDiv.className = 'fallback-icon w-full h-full bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center';
                            fallbackDiv.innerHTML = `
                              <div class="bg-white/80 rounded-full p-8 shadow-lg">
                                <svg class="w-24 h-24 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                </svg>
                              </div>
                            `;
                            parent.appendChild(fallbackDiv);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center group-hover:from-yellow-100 group-hover:to-yellow-150 transition-all duration-300">
                        <div className="bg-white/80 rounded-full p-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <TypeIcon className="w-24 h-24 text-yellow-600" />
                        </div>
                      </div>
                    )}
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-md flex items-center space-x-1 ${getTypeColor(item.file_type)}`}>
                      <TypeIcon className="w-3 h-3" />
                      <span className="text-xs font-medium capitalize">
                        {item.file_type.includes('pdf') ? 'PDF' :
                         item.file_type.includes('image') || item.file_type.includes('photo') || item.file_type.includes('png') || item.file_type.includes('jpg') || item.file_type.includes('jpeg') ? 'Photo' : 
                         item.file_type.includes('video') || item.file_type.includes('mp4') || item.file_type.includes('avi') || item.file_type.includes('mov') ? 'Video' : 
                         item.file_type.includes('audio') || item.file_type.includes('mp3') || item.file_type.includes('wav') || item.file_type.includes('music') ? 'Audio' :
                         item.file_type.includes('zip') || item.file_type.includes('rar') || item.file_type.includes('tar') ? 'Archive' :
                         item.file_type.includes('document') || item.file_type.includes('text') || item.file_type.includes('docx') || item.file_type.includes('doc') ? 'Document' : 'File'}
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
                            Download
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

      </div>
    </div>
  );
}