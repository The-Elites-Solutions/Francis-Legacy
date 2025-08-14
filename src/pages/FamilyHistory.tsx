import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Search, Filter, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  image_url?: string;
  family_member_ids?: string[];
  created_at: string;
  updated_at: string;
}

const getEventYear = (event: TimelineEvent) => new Date(event.event_date).getFullYear().toString();
const getEventCategory = (event: TimelineEvent) => {
  // Simple category extraction based on content
  const content = `${event.title} ${event.description}`.toLowerCase();
  if (content.includes('war') || content.includes('military')) return 'Military';
  if (content.includes('business') || content.includes('work')) return 'Business';
  if (content.includes('migration') || content.includes('move')) return 'Migration';
  if (content.includes('property') || content.includes('house') || content.includes('home')) return 'Property';
  if (content.includes('reunion') || content.includes('tradition')) return 'Tradition';
  return 'General';
};

const categories = ['All', 'General', 'Migration', 'Business', 'Military', 'Property', 'Tradition'];

export default function FamilyHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familyStats, setFamilyStats] = useState({
    yearsOfHistory: '150+',
    generations: 5,
    locations: 12,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimelineEvents();
    fetchFamilyHistoryStats();
  }, []);

  const fetchTimelineEvents = async () => {
    try {
      setLoading(true);
      const events = await apiClient.getTimelineEvents();
      setTimelineEvents(events || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load timeline events';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyHistoryStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await apiClient.getFamilyHistoryStats();
      setFamilyStats(stats);
    } catch (err) {
      console.error('Failed to fetch family history stats:', err);
      // Keep default stats if fetch fails
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredEvents = timelineEvents.filter(event => {
    const eventCategory = getEventCategory(event);
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || eventCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            Our Family <span className="text-yellow-600">History</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto px-2">
            Journey through time and discover the stories that shaped our family legacy. 
            From humble beginnings to cherished traditions, every moment tells our story.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 sm:mb-12 flex flex-col md:flex-row gap-4 justify-between items-center">
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

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
            <p className="mt-2 text-gray-600">Loading family history...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 mx-auto text-yellow-600 opacity-50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Timeline Events</h3>
            <p className="text-foreground/70 mb-4">
              {timelineEvents.length === 0 
                ? "No family history events have been added yet."
                : "No events match your current search and filters."
              }
            </p>
            {timelineEvents.length === 0 && (
              <p className="text-sm text-foreground/60">
                Timeline events can be added through the admin panel.
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 h-full w-0.5 gold-texture"></div>

          <div className="space-y-8 sm:space-y-12">
            {filteredEvents.map((event, index) => {
              const eventYear = getEventYear(event);
              const eventCategory = getEventCategory(event);
              
              return (
              <div key={index} className={`relative flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Timeline dot */}
                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 gold-texture rounded-full border-2 sm:border-4 border-white z-10 shadow-md"></div>

                {/* Content */}
                <div className={`w-full md:w-1/2 pl-8 sm:pl-12 md:pl-0 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                  <Card className="bg-white border-primary/30 hover:border-primary/60 transition-all duration-300 shadow-md hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="border-primary/30 text-yellow-600">
                          {eventYear}
                        </Badge>
                        <Badge variant="secondary" className="bg-primary/10 text-yellow-600 border-0">
                          {eventCategory}
                        </Badge>
                      </div>
                      <CardTitle className="text-foreground text-lg sm:text-xl">{event.title}</CardTitle>
                      {event.location && (
                        <CardDescription className="text-foreground/70 flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-yellow-600" />
                          {event.location}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground/80 mb-4">{event.description}</p>
                      {event.image_url ? (
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <img 
                            src={event.image_url} 
                            alt={event.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                          <Clock className="w-16 h-16 text-yellow-600 opacity-50" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Year indicator for desktop */}
                <div className={`hidden md:block w-1/2 ${index % 2 === 0 ? 'pl-8' : 'pr-8'}`}>
                  <div className={`text-6xl font-bold text-yellow-600 opacity-20 ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                    {eventYear}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
        )}

        {/* Family Statistics */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <Card className="bg-white shadow-md border-primary/30 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-foreground">
                {statsLoading ? '...' : `${familyStats.yearsOfHistory} Years`}
              </CardTitle>
              <CardDescription className="text-foreground/70">of documented family history</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white shadow-md border-primary/30 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-foreground">
                {statsLoading ? '...' : `${familyStats.generations} Generations`}
              </CardTitle>
              <CardDescription className="text-foreground/70">documented in our family tree</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white shadow-md border-primary/30 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full gold-texture flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-foreground">
                {statsLoading ? '...' : `${familyStats.locations} Locations`}
              </CardTitle>
              <CardDescription className="text-foreground/70">where our family has lived</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}