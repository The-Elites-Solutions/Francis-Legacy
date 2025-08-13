import { useState, useEffect } from 'react';
import { Search, Plus, User, Heart, Calendar, MapPin, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  maiden_name?: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  occupation?: string;
  biography?: string;
  profile_photo_url?: string;
  father_id?: string;
  mother_id?: string;
  spouse_id?: string;
  created_at: string;
  updated_at: string;
}

// Helper functions to maintain compatibility
const getMemberName = (member: FamilyMember) => `${member.first_name} ${member.last_name}`;
const getMemberBirth = (member: FamilyMember) => member.birth_date ? new Date(member.birth_date).getFullYear().toString() : '';
const getMemberDeath = (member: FamilyMember) => member.death_date ? new Date(member.death_date).getFullYear().toString() : undefined;
const getSpouseName = (member: FamilyMember, allMembers: FamilyMember[]) => {
  if (!member.spouse_id) return undefined;
  const spouse = allMembers.find(m => m.id === member.spouse_id);
  return spouse ? getMemberName(spouse) : undefined;
};
const getParentIds = (member: FamilyMember): string[] => {
  const parents = [];
  if (member.father_id) parents.push(member.father_id);
  if (member.mother_id) parents.push(member.mother_id);
  return parents;
};
const getChildrenIds = (memberId: string, allMembers: FamilyMember[]): string[] => {
  return allMembers
    .filter(m => m.father_id === memberId || m.mother_id === memberId)
    .map(m => m.id);
};


export default function FamilyTree() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const members = await apiClient.getFamilyMembers();
      setFamilyMembers(members);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load family members';
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

  const filteredMembers = familyMembers.filter(member => {
    const fullName = getMemberName(member).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) ||
           (member.occupation && member.occupation.toLowerCase().includes(searchLower)) ||
           (member.birth_place && member.birth_place.toLowerCase().includes(searchLower));
  });

  const selectedMemberData = selectedMember ? familyMembers.find(m => m.id === selectedMember) : null;

  const handleMemberClick = (memberId: string) => {
    setSelectedMember(memberId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  // Calculate family statistics dynamically
  const totalMembers = familyMembers.length;
  const generations = familyMembers.length > 0 ? 
    Math.max(...familyMembers.map(m => {
      let depth = 0;
      let currentId = m.id;
      const visited = new Set();
      
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const member = familyMembers.find(mem => mem.id === currentId);
        if (member && (member.father_id || member.mother_id)) {
          depth++;
          currentId = member.father_id || member.mother_id || '';
        } else {
          break;
        }
      }
      return depth + 1;
    })) : 0;
  
  const countries = new Set(
    familyMembers
      .map(m => m.birth_place)
      .filter(Boolean)
      .map(place => place!.split(',').pop()?.trim())
      .filter(Boolean)
  ).size;
  
  const earliestYear = familyMembers.length > 0 ?
    Math.min(...familyMembers
      .map(m => m.birth_date ? new Date(m.birth_date).getFullYear() : Infinity)
      .filter(year => year !== Infinity)
    ) : new Date().getFullYear();

  // Get root members (no parents)
  const rootMembers = familyMembers.filter(member => !member.father_id && !member.mother_id);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen py-4 sm:py-6 lg:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
            <p className="mt-2 text-gray-600">Loading family tree...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen py-4 sm:py-6 lg:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={fetchFamilyMembers}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-4">
            Family <span className="text-yellow-600">Tree</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-foreground/70 max-w-3xl mx-auto px-2 sm:px-0">
            Explore the connections that bind our family together across generations. 
            {!isMobile && "Click on any family member to learn more about their story."}
            {isMobile && "Tap family members to view their stories."}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <div className="relative w-full max-w-sm sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
            <Input
              placeholder="Search family members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-primary/30 text-foreground placeholder-foreground/40 h-11 text-base touch-manipulation focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Full-width Family Tree Visualization */}
      <div className="w-full bg-secondary/30 py-6 sm:py-8 lg:py-12 mb-6 sm:mb-8">
        <div className="max-w-full">
          <div className="w-full px-3 sm:px-6 lg:px-8">
            <Card className="bg-white border-primary/30 shadow-md">
              <CardHeader className="text-center px-3 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-foreground flex items-center justify-center text-lg sm:text-xl">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-600" />
                  Interactive Family Tree
                </CardTitle>
                <CardDescription className="text-foreground/60 text-sm sm:text-base">
                  {isMobile ? "Tap members for details" : "Click on family members to view their detailed profiles"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 lg:p-8">
                <div className="space-y-8 sm:space-y-12 lg:space-y-16">
                  {/* Generation 1 - Ancestors */}
                  <div className="text-center">
                    <h3 className="text-base sm:text-lg font-semibold text-yellow-600 mb-4 sm:mb-6 lg:mb-8">
                      First Generation (1840s-1920s)
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
                      {rootMembers.slice(0, 3).map((member) => (
                        <div 
                          key={member.id}
                          className="flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] w-[90px] sm:w-[110px] lg:w-[130px]"
                          onClick={() => handleMemberClick(member.id)}
                          style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                          <Avatar className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 mb-2 sm:mb-3 ring-2 sm:ring-3 gold-texture group-hover:ring-opacity-100 group-active:ring-opacity-100 transition-all">
                            <AvatarImage src={member.profile_photo_url} />
                            <AvatarFallback className="gold-texture text-white text-lg sm:text-xl">
                              {member.first_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground text-sm sm:text-base font-medium group-hover:text-yellow-600 transition-colors text-center max-w-24 sm:max-w-none">
                            {isMobile ? member.first_name : getMemberName(member)}
                          </span>
                          <span className="text-foreground/60 text-xs sm:text-sm">
                            {getMemberBirth(member)} - {getMemberDeath(member) || 'Present'}
                          </span>
                          <span className="text-yellow-600 text-xs mt-1 text-center max-w-20 sm:max-w-none leading-tight">
                            {isMobile ? (member.occupation?.split(' ')[0] || '') : member.occupation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connection Lines */}
                  <div className="flex justify-center my-4 sm:my-6 lg:my-8">
                    <div className="relative w-[200px] sm:w-[250px] lg:w-[300px]">
                      <div className="h-8 sm:h-12 lg:h-16 w-0.5 gold-texture mx-auto"></div>
                      <div className="absolute top-4 sm:top-6 lg:top-8 left-1/2 transform -translate-x-1/2 w-full h-0.5 gold-texture"></div>
                      <div className="absolute top-4 sm:top-6 lg:top-8 left-0 w-0.5 h-4 sm:h-6 lg:h-8 gold-texture"></div>
                      <div className="absolute top-4 sm:top-6 lg:top-8 right-0 w-0.5 h-4 sm:h-6 lg:h-8 gold-texture"></div>
                    </div>
                  </div>

                  {/* Generation 2 - Children */}
                  <div className="text-center">
                    <h3 className="text-base sm:text-lg font-semibold text-yellow-600 mb-4 sm:mb-6 lg:mb-8">
                      Second Generation (1870s-1960s)
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 pb-2">
                      {rootMembers.length > 0 && familyMembers
                        .filter(member => getParentIds(member).some(parentId => rootMembers.some(root => root.id === parentId)))
                        .slice(0, 6)
                        .map((member) => (
                        <div 
                          key={member.id}
                          className="flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation min-h-[110px] sm:min-h-[130px] lg:min-h-[150px] w-[80px] sm:w-[100px] lg:w-[120px]"
                          onClick={() => handleMemberClick(member.id)}
                          style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mb-2 sm:mb-3 ring-2 gold-texture/80 group-hover:ring-opacity-100 group-active:ring-opacity-100 transition-all">
                            <AvatarImage src={member.profile_photo_url} />
                            <AvatarFallback className="gold-texture text-white text-sm sm:text-base">
                              {member.first_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground text-xs sm:text-sm font-medium group-hover:text-yellow-600 transition-colors text-center max-w-16 sm:max-w-20 lg:max-w-24 leading-tight">
                            {isMobile ? member.first_name : getMemberName(member)}
                          </span>
                          <span className="text-foreground/60 text-xs leading-tight">
                            {getMemberBirth(member)} - {getMemberDeath(member) || 'Present'}
                          </span>
                          <span className="text-yellow-600 text-xs mt-1 text-center max-w-16 sm:max-w-18 lg:max-w-20 leading-tight">
                            {isMobile 
                              ? (member.occupation?.includes('Baker') ? 'Baker' : 
                                 member.occupation?.includes('Police') ? 'Police' :
                                 member.occupation?.includes('Teacher') ? 'Teacher' :
                                 member.occupation?.split(' ')[0] || '')
                              : member.occupation
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connection Lines for Generation 3 */}
                  <div className="flex justify-center">
                    <div className="h-6 sm:h-8 lg:h-12 w-0.5 gold-texture/80"></div>
                  </div>

                  {/* Generation 3 - Grandchildren */}
                  <div className="text-center">
                    <h3 className="text-base sm:text-lg font-semibold text-yellow-600 mb-4 sm:mb-6 lg:mb-8">
                      Third Generation (1900s-1980s)
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 pb-2">
                      {familyMembers
                        .filter(member => {
                          const parents = getParentIds(member);
                          return parents.some(parentId => {
                            const parent = familyMembers.find(p => p.id === parentId);
                            return parent && getParentIds(parent).some(grandparentId => rootMembers.some(root => root.id === grandparentId));
                          });
                        })
                        .slice(0, 8)
                        .map((member) => (
                        <div 
                          key={member.id}
                          className="flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation min-h-[100px] sm:min-h-[120px] lg:min-h-[140px] w-[70px] sm:w-[90px] lg:w-[110px]"
                          onClick={() => handleMemberClick(member.id)}
                          style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 mb-2 ring-2 gold-texture/70 group-hover:ring-opacity-100 group-active:ring-opacity-100 transition-all">
                            <AvatarImage src={member.profile_photo_url} />
                            <AvatarFallback className="gold-texture text-white text-xs sm:text-sm">
                              {member.first_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground text-xs sm:text-sm font-medium group-hover:text-yellow-600 transition-colors text-center max-w-14 sm:max-w-16 lg:max-w-20 leading-tight">
                            {isMobile ? member.first_name : getMemberName(member)}
                          </span>
                          <span className="text-foreground/60 text-xs leading-tight">
                            {getMemberBirth(member)} - {getMemberDeath(member) || 'Present'}
                          </span>
                          <span className="text-yellow-600 text-xs mt-1 text-center max-w-14 sm:max-w-16 lg:max-w-20 leading-tight">
                            {isMobile ? (member.occupation?.split(' ')[0] || '') : member.occupation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Family Statistics */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">{totalMembers}</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Total Members</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">{generations}</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Generations</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">{countries || 0}</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Countries</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">{earliestYear !== Infinity ? earliestYear : 'N/A'}</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Earliest Record</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Member Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto bg-white border-primary/30 text-foreground mx-2 sm:mx-auto shadow-xl">
          {selectedMemberData && (
            <>
              <DialogHeader className="pb-4 sm:pb-6">
                <DialogTitle className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 text-xl sm:text-2xl text-yellow-600">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 gold-texture flex-shrink-0">
                    <AvatarImage src={selectedMemberData.profile_photo_url} />
                    <AvatarFallback className="gold-texture text-white text-lg sm:text-xl">
                      {selectedMemberData.first_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <div className="leading-tight">{getMemberName(selectedMemberData)}</div>
                    <div className="text-foreground/60 text-sm sm:text-base font-normal">
                      {getMemberBirth(selectedMemberData)} - {getMemberDeath(selectedMemberData) || 'Present'}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h4 className="text-yellow-600 font-semibold mb-2 text-base sm:text-lg">Basic Information</h4>
                      <div className="space-y-2 text-sm sm:text-base">
                        {selectedMemberData.occupation && (
                          <div className="flex items-start space-x-2">
                            <User className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">{selectedMemberData.occupation}</span>
                          </div>
                        )}
                        {selectedMemberData.birth_place && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">Born in {selectedMemberData.birth_place}</span>
                          </div>
                        )}
                        {selectedMemberData.maiden_name && (
                          <div className="flex items-start space-x-2">
                            <User className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">Maiden name: {selectedMemberData.maiden_name}</span>
                          </div>
                        )}
                        {getSpouseName(selectedMemberData, familyMembers) && (
                          <div className="flex items-start space-x-2">
                            <Heart className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">Married to {getSpouseName(selectedMemberData, familyMembers)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h4 className="text-yellow-600 font-semibold mb-2 text-base sm:text-lg">Family Connections</h4>
                      <div className="space-y-2 text-sm sm:text-base">
                        {getParentIds(selectedMemberData).length > 0 && (
                          <div>
                            <span className="text-yellow-600 font-medium">Parents:</span>{' '}
                            <span className="leading-tight text-foreground">
                              {getParentIds(selectedMemberData).map(parentId => {
                                const parent = familyMembers.find(m => m.id === parentId);
                                return parent ? getMemberName(parent) : null;
                              }).filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        {getChildrenIds(selectedMemberData.id, familyMembers).length > 0 && (
                          <div>
                            <span className="text-yellow-600 font-medium">Children:</span>{' '}
                            <span className="leading-tight text-foreground">
                              {getChildrenIds(selectedMemberData.id, familyMembers).map(childId => {
                                const child = familyMembers.find(m => m.id === childId);
                                return child ? getMemberName(child) : null;
                              }).filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biography */}
                {selectedMemberData.biography && (
                  <div>
                    <h4 className="text-yellow-600 font-semibold mb-2 text-base sm:text-lg">Life Story</h4>
                    <p className="text-foreground/90 leading-relaxed text-sm sm:text-base">{selectedMemberData.biography}</p>
                  </div>
                )}

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}