import { useState } from 'react';
import { Search, Filter, Download, Eye, Calendar, FileText, Image, Video, File } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'photo' | 'video' | 'audio';
  date: string;
  category: string;
  person?: string;
  location?: string;
  thumbnail: string;
  fileSize: string;
  format: string;
  tags: string[];
}

const archiveData: ArchiveItem[] = [
  {
    id: '1',
    title: 'Wedding Certificate - John & Mary O\'Sullivan',
    description: 'Original marriage certificate from 1974',
    type: 'document',
    date: '1974-06-12',
    category: 'Legal Documents',
    person: 'John & Mary O\'Sullivan',
    location: 'St. Patrick\'s Church, Brooklyn',
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    fileSize: '2.3 MB',
    format: 'PDF',
    tags: ['Marriage', 'Legal', '1970s']
  },
  {
    id: '2',
    title: 'Family Reunion Photos 1985',
    description: 'Collection of 47 photos from the first official family reunion',
    type: 'photo',
    date: '1985-07-15',
    category: 'Family Events',
    location: 'Central Park, New York',
    thumbnail: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    fileSize: '124 MB',
    format: 'JPG Collection',
    tags: ['Reunion', 'Photos', '1980s']
  },
  {
    id: '3',
    title: 'Great-Grandfather\'s Immigration Papers',
    description: 'Ellis Island records and ship manifest from 1874',
    type: 'document',
    date: '1874-09-03',
    category: 'Immigration Records',
    person: 'Patrick O\'Sullivan',
    location: 'Ellis Island, New York',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    fileSize: '8.7 MB',
    format: 'PDF',
    tags: ['Immigration', 'Historical', '1870s']
  },
  {
    id: '4',
    title: 'Uncle Thomas WWII Letters',
    description: 'Personal correspondence from the Pacific Theater 1943-1945',
    type: 'document',
    date: '1943-12-01',
    category: 'Personal Letters',
    person: 'Thomas O\'Sullivan',
    location: 'Pacific Theater',
    thumbnail: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    fileSize: '15.2 MB',
    format: 'PDF Scans',
    tags: ['WWII', 'Letters', 'Military']
  },
  {
    id: '5',
    title: 'Family Business Grand Opening',
    description: 'Video footage of O\'Sullivan Bakery opening day in 1924',
    type: 'video',
    date: '1924-03-15',
    category: 'Business History',
    location: 'Brooklyn, New York',
    thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    fileSize: '345 MB',
    format: 'MP4',
    tags: ['Business', 'Historical', '1920s']
  },
  {
    id: '6',
    title: 'Childhood Photos - Brooklyn 1960s',
    description: 'Candid family photos from the old neighborhood',
    type: 'photo',
    date: '1965-08-22',
    category: 'Childhood Memories',
    location: 'Brooklyn, New York',
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    fileSize: '67 MB',
    format: 'JPG Collection',
    tags: ['Childhood', 'Brooklyn', '1960s']
  },
  {
    id: '7',
    title: 'Family Recipe Collection',
    description: 'Handwritten recipes passed down through generations',
    type: 'document',
    date: '1920-01-01',
    category: 'Recipes & Traditions',
    person: 'Various Family Members',
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    fileSize: '12.8 MB',
    format: 'PDF Scans',
    tags: ['Recipes', 'Traditions', 'Heritage']
  },
  {
    id: '8',
    title: 'Golden Anniversary Celebration',
    description: 'John & Mary\'s 50th wedding anniversary video',
    type: 'video',
    date: '2024-06-12',
    category: 'Family Celebrations',
    person: 'John & Mary O\'Sullivan',
    thumbnail: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    fileSize: '1.2 GB',
    format: 'MP4',
    tags: ['Anniversary', 'Celebration', '2024']
  }
];

const categories = ['All', 'Legal Documents', 'Family Events', 'Immigration Records', 'Personal Letters', 'Business History', 'Childhood Memories', 'Recipes & Traditions', 'Family Celebrations'];
const types = ['All', 'document', 'photo', 'video', 'audio'];
const decades = ['All', '1870s', '1920s', '1940s', '1960s', '1980s', '2020s'];

export default function Archives() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDecade, setSelectedDecade] = useState('All');

  const filteredItems = archiveData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesType = selectedType === 'All' || item.type === selectedType;
    const matchesDecade = selectedDecade === 'All' || item.tags.some(tag => tag.includes(selectedDecade));
    return matchesSearch && matchesCategory && matchesType && matchesDecade;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'photo': return Image;
      case 'video': return Video;
      case 'audio': return File;
      default: return File;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-500/20 text-blue-400';
      case 'photo': return 'bg-green-500/20 text-green-400';
      case 'video': return 'bg-purple-500/20 text-purple-400';
      case 'audio': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Family <span className="text-yellow-400">Archives</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our digital repository of family documents, photos, videos, and memorabilia. 
            Preserving precious memories and important records for future generations.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12 space-y-6">
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search archives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-yellow-400/20 text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-gray-900/50 border-yellow-400/20 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-yellow-400/20">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-white hover:text-yellow-400">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-gray-900/50 border-yellow-400/20 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-yellow-400/20">
                {types.map((type) => (
                  <SelectItem key={type} value={type} className="text-white hover:text-yellow-400">
                    {type === 'All' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDecade} onValueChange={setSelectedDecade}>
              <SelectTrigger className="bg-gray-900/50 border-yellow-400/20 text-white">
                <SelectValue placeholder="Era" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-yellow-400/20">
                {decades.map((decade) => (
                  <SelectItem key={decade} value={decade} className="text-white hover:text-yellow-400">
                    {decade === 'All' ? 'All Eras' : decade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Archive Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            return (
              <Card key={item.id} className="bg-gray-900/50 border-yellow-400/20 hover:border-yellow-400/40 transition-all duration-300 group">
                <div className="aspect-video overflow-hidden rounded-t-lg relative">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-md flex items-center space-x-1 ${getTypeColor(item.type)}`}>
                    <TypeIcon className="w-3 h-3" />
                    <span className="text-xs font-medium capitalize">{item.type}</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs">
                    {item.fileSize}
                  </div>
                </div>
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-yellow-400/30 text-yellow-400 text-xs">
                      {item.category}
                    </Badge>
                    <div className="flex items-center text-gray-400 text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(item.date).getFullYear()}
                    </div>
                  </div>
                  <CardTitle className="text-white group-hover:text-yellow-400 transition-colors text-lg">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {item.person && (
                      <div className="text-sm text-gray-300">
                        <span className="text-yellow-400">Person:</span> {item.person}
                      </div>
                    )}
                    {item.location && (
                      <div className="text-sm text-gray-300">
                        <span className="text-yellow-400">Location:</span> {item.location}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-yellow-400/10 text-yellow-400 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-gray-400">
                        {item.format} • {item.fileSize}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                          <Download className="w-3 h-3 mr-1" />
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

        {/* Archive Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/30 text-center">
            <CardContent className="pt-6">
              <FileText className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-yellow-400 mb-1">156</div>
              <div className="text-gray-300 text-sm">Documents</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/30 text-center">
            <CardContent className="pt-6">
              <Image className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-yellow-400 mb-1">2,847</div>
              <div className="text-gray-300 text-sm">Photos</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/30 text-center">
            <CardContent className="pt-6">
              <Video className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-yellow-400 mb-1">67</div>
              <div className="text-gray-300 text-sm">Videos</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/30 text-center">
            <CardContent className="pt-6">
              <Calendar className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-yellow-400 mb-1">150+</div>
              <div className="text-gray-300 text-sm">Years Covered</div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-yellow-400/30">
            <CardContent className="py-12">
              <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Contribute to Our Archives</h3>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                Do you have family documents, photos, or memorabilia to add to our collection? 
                Help us preserve our family history by sharing your treasures.
              </p>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                Upload Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}