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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Family <span className="gold-text">History</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Journey through time and discover the stories that shaped our family legacy. 
            From humble beginnings to cherished traditions, every moment tells our story.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
            <Input
              placeholder="Search family history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-primary/30 text-foreground placeholder-foreground/50 shadow-sm"
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
                  ? "gold-texture text-white hover:opacity-90" 
                  : "border-primary/30 text-foreground hover:border-primary hover:text-primary"
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
          <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 h-full w-0.5 gold-texture"></div>

          <div className="space-y-12">
            {filteredEvents.map((event, index) => (
              <div key={index} className={`relative flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Timeline dot */}
                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 gold-texture rounded-full border-4 border-white z-10 shadow-md"></div>

                {/* Content */}
                <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                  <Card className="bg-white border-primary/30 hover:border-primary/60 transition-all duration-300 shadow-md hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="border-primary/30 gold-text">
                          {event.year}
                        </Badge>
                        <Badge variant="secondary" className="bg-primary/10 gold-text border-0">
                          {event.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-foreground text-xl">{event.title}</CardTitle>
                      <CardDescription className="text-foreground/70 flex items-center">
                        <MapPin className="w-4 h-4 mr-1 gold-text" />
                        {event.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground/80 mb-4">{event.description}</p>
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
                  <div className={`text-6xl font-bold gold-text opacity-20 ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                    {event.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Family Statistics */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <Card className="bg-white shadow-md border-primary/30 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-foreground">150+ Years</CardTitle>
              <CardDescription className="text-foreground/70">of documented family history</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white shadow-md border-primary/30 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-foreground">5 Generations</CardTitle>
              <CardDescription className="text-foreground/70">living family members connected</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white shadow-md border-primary/30 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-foreground">12 Countries</CardTitle>
              <CardDescription className="text-foreground/70">where our family has lived</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}