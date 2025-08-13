import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, Plus, Edit2, Trash2, Calendar, MapPin, User, Camera,
  Heart, GraduationCap, Briefcase, Home, Baby, Users, Plane, Trophy
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_type: 'birth' | 'death' | 'marriage' | 'education' | 'career' | 'migration' | 'achievement' | 'other';
  location?: string;
  associated_member_id?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
}

interface EventFormData {
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
  location: string;
  associatedMemberId: string;
  imageUrl: string;
}

const eventTypes = [
  { value: 'birth', label: 'Birth', icon: Baby, color: 'bg-green-100 text-green-800' },
  { value: 'death', label: 'Death', icon: Heart, color: 'bg-gray-100 text-gray-800' },
  { value: 'marriage', label: 'Marriage', icon: Heart, color: 'bg-pink-100 text-pink-800' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: 'bg-blue-100 text-blue-800' },
  { value: 'career', label: 'Career', icon: Briefcase, color: 'bg-purple-100 text-purple-800' },
  { value: 'migration', label: 'Migration', icon: Plane, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'achievement', label: 'Achievement', icon: Trophy, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'other', label: 'Other', icon: Users, color: 'bg-gray-100 text-gray-800' },
];

const TimelineManager: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventDate: '',
    eventType: '',
    location: '',
    associatedMemberId: '',
    imageUrl: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchFamilyMembers();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await apiClient.getTimelineEvents();
      setEvents(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch timeline events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const data = await apiClient.getFamilyMembers();
      setFamilyMembers(data);
    } catch (error) {
      console.error('Failed to fetch family members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode === 'edit' && selectedEvent) {
        await apiClient.updateTimelineEvent(selectedEvent.id, formData);
        toast({
          title: 'Success',
          description: 'Timeline event updated successfully',
        });
      } else {
        await apiClient.createTimelineEvent(formData);
        toast({
          title: 'Success',
          description: 'Timeline event created successfully',
        });
      }
      
      setIsDialogOpen(false);
      setSelectedEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      toast({
        title: 'Error',
        description: editMode === 'edit' ? 'Failed to update event' : 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setEditMode('edit');
    setFormData({
      title: event.title,
      description: event.description,
      eventDate: event.event_date,
      eventType: event.event_type,
      location: event.location || '',
      associatedMemberId: event.associated_member_id || '',
      imageUrl: event.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (event: TimelineEvent) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;
    
    try {
      await apiClient.deleteTimelineEvent(event.id);
      toast({
        title: 'Success',
        description: 'Timeline event deleted successfully',
      });
      fetchEvents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete timeline event',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    setSelectedEvent(null);
    setEditMode('create');
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      eventType: '',
      location: '',
      associatedMemberId: '',
      imageUrl: ''
    });
  };

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(et => et.value === type) || eventTypes[eventTypes.length - 1];
  };

  const getMemberName = (event: TimelineEvent) => {
    if (event.first_name && event.last_name) {
      return `${event.first_name} ${event.last_name}`;
    }
    const member = familyMembers.find(m => m.id === event.associated_member_id);
    return member ? `${member.first_name} ${member.last_name}` : null;
  };

  const filteredEvents = selectedType === 'all' 
    ? events 
    : events.filter(event => event.event_type === selectedType);

  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  const groupedEvents = sortedEvents.reduce((groups: { [key: string]: TimelineEvent[] }, event) => {
    const year = new Date(event.event_date).getFullYear().toString();
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(event);
    return groups;
  }, {});

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Timeline Manager
          </h2>
          <p className="text-gray-600">Manage historical family events and milestones</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Event Type Filter */}
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-9 w-full">
          <TabsTrigger value="all">All ({events.length})</TabsTrigger>
          {eventTypes.map((type) => {
            const count = events.filter(e => e.event_type === type.value).length;
            return (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-1">
                <type.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{type.label}</span>
                ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          {/* Timeline Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Family Timeline</CardTitle>
              <CardDescription>
                Chronological view of family history and important events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {Object.entries(groupedEvents).map(([year, yearEvents]) => (
                  <div key={year} className="relative">
                    {/* Year Header */}
                    <div className="flex items-center mb-4">
                      <div className="bg-yellow-600 text-white px-3 py-1 rounded-full font-bold text-lg">
                        {year}
                      </div>
                      <div className="flex-1 h-0.5 bg-gray-300 ml-4"></div>
                    </div>

                    {/* Events for this year */}
                    <div className="space-y-4 ml-6">
                      {yearEvents.map((event, index) => {
                        const typeInfo = getEventTypeInfo(event.event_type);
                        const TypeIcon = typeInfo.icon;
                        const memberName = getMemberName(event);

                        return (
                          <div key={event.id} className="relative flex gap-4 hover:bg-gray-50 p-4 rounded-lg transition-colors">
                            {/* Timeline dot */}
                            <div className="absolute -left-6 top-6 w-3 h-3 bg-yellow-600 rounded-full border-2 border-white"></div>
                            
                            {/* Event content */}
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TypeIcon className="h-4 w-4 text-gray-600" />
                                    <h3 className="font-semibold text-lg">{event.title}</h3>
                                    <Badge variant="outline" className={typeInfo.color}>
                                      {typeInfo.label}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(event.event_date).toLocaleDateString()}
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {event.location}
                                      </div>
                                    )}
                                    {memberName && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {memberName}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <p className="text-gray-700">{event.description}</p>
                                </div>

                                {/* Event image */}
                                {event.image_url && (
                                  <div className="ml-4">
                                    <img 
                                      src={event.image_url} 
                                      alt={event.title}
                                      className="w-16 h-16 object-cover rounded-lg"
                                    />
                                  </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-1 ml-4">
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDelete(event)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {sortedEvents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No timeline events found</p>
                    <p className="text-sm">Create your first event to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editMode === 'edit' ? 'Edit Timeline Event' : 'Add Timeline Event'}
              </DialogTitle>
              <DialogDescription>
                {editMode === 'edit' ? 'Update the timeline event details below.' : 'Create a new timeline event for the family history.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Birth of John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe the event, its significance, and any relevant details..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State/Province, Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="associatedMember">Associated Family Member</Label>
                <Select value={formData.associatedMemberId} onValueChange={(value) => setFormData({ ...formData, associatedMemberId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select family member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific member</SelectItem>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Event Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editMode === 'edit' ? 'Update Event' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelineManager;