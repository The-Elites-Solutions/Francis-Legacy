import { useState } from 'react';
import { Calendar, MapPin, Users, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const timelineEvents = [
  {
    year: '1874',
    title: 'The Great Migration',
    description: 'Our ancestors traveled from Ireland to America seeking new opportunities',
    location: 'County Cork, Ireland → New York',
    category: 'Migration',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    year: '1892',
    title: 'First Family Business',
    description: 'Great-grandfather Patrick opened the first family bakery in downtown Brooklyn',
    location: 'Brooklyn, New York',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    year: '1918',
    title: 'War Service',
    description: 'Uncle Thomas served in World War I, letters from the front preserved in our archives',
    location: 'France',
    category: 'Military',
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    year: '1925',
    title: 'The Family Home',
    description: 'Purchase of the family homestead that remained in the family for 75 years',
    location: 'Queens, New York',
    category: 'Property',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    year: '1943',
    title: 'World War II Heroes',
    description: 'Three family members served in different theaters of World War II',
    location: 'Pacific & European Theaters',
    category: 'Military',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    year: '1967',
    title: 'Family Reunion Tradition Begins',
    description: 'The first annual family reunion, establishing a tradition that continues today',
    location: 'Central Park, New York',
    category: 'Tradition',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

const categories = ['All', 'Migration', 'Business', 'Military', 'Property', 'Tradition'];

export default function FamilyHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredEvents = timelineEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Family <span className="text-yellow-400">History</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Journey through time and discover the stories that shaped our family legacy. 
            From humble beginnings to cherished traditions, every moment tells our story.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search family history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/50 border-yellow-400/20 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={selectedCategory === category 
                  ? "bg-yellow-400 text-black hover:bg-yellow-500" 
                  : "border-yellow-400/30 text-gray-300 hover:border-yellow-400 hover:text-yellow-400"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600"></div>

          <div className="space-y-12">
            {filteredEvents.map((event, index) => (
              <div key={index} className={`relative flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Timeline dot */}
                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full border-4 border-black z-10"></div>

                {/* Content */}
                <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                  <Card className="bg-gray-900/50 border-yellow-400/20 hover:border-yellow-400/40 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="border-yellow-400/30 text-yellow-400">
                          {event.year}
                        </Badge>
                        <Badge variant="secondary" className="bg-yellow-400/10 text-yellow-400 border-0">
                          {event.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-white text-xl">{event.title}</CardTitle>
                      <CardDescription className="text-gray-400 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{event.description}</p>
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Year indicator for desktop */}
                <div className={`hidden md:block w-1/2 ${index % 2 === 0 ? 'pl-8' : 'pr-8'}`}>
                  <div className={`text-6xl font-bold text-yellow-400/20 ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                    {event.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Family Statistics */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/30">
            <CardHeader className="text-center">
              <Calendar className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <CardTitle className="text-white">150+ Years</CardTitle>
              <CardDescription className="text-gray-400">of documented family history</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/30">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <CardTitle className="text-white">5 Generations</CardTitle>
              <CardDescription className="text-gray-400">living family members connected</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/30">
            <CardHeader className="text-center">
              <MapPin className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <CardTitle className="text-white">12 Countries</CardTitle>
              <CardDescription className="text-gray-400">where our family has lived</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}