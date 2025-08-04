import { useState, useEffect } from 'react';
import { Search, Plus, User, Heart, Calendar, MapPin, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FamilyMember {
  id: string;
  name: string;
  birth: string;
  death?: string;
  spouse?: string;
  children?: string[];
  parents?: string[];
  photo?: string;
  location?: string;
  occupation?: string;
  birthLocation?: string;
  deathLocation?: string;
  biography?: string;
  achievements?: string[];
  memories?: string;
}

const familyData: FamilyMember[] = [
  {
    id: '1',
    name: 'Patrick O\'Sullivan',
    birth: '1848',
    death: '1924',
    spouse: 'Mary Kelly',
    children: ['2', '3', '4'],
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    location: 'County Cork, Ireland',
    birthLocation: 'County Cork, Ireland',
    deathLocation: 'Brooklyn, New York',
    occupation: 'Farmer, Later Baker',
    biography: 'Patrick was the patriarch of our American branch of the family. Born in County Cork during the Great Famine, he made the brave decision to emigrate to America in 1874 seeking better opportunities for his family.',
    achievements: ['Founded the family bakery in Brooklyn', 'Helped 12 other Irish families emigrate to America', 'Established the O\'Sullivan Family Association'],
    memories: 'Known for his incredible storytelling abilities and his famous Irish soda bread recipe that is still used in the family bakery today.'
  },
  {
    id: '2',
    name: 'Michael O\'Sullivan',
    birth: '1875',
    death: '1952',
    parents: ['1'],
    spouse: 'Catherine Murphy',
    children: ['5', '6'],
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    location: 'Brooklyn, New York',
    birthLocation: 'Brooklyn, New York',
    deathLocation: 'Queens, New York',
    occupation: 'Master Baker',
    biography: 'Michael was the eldest son of Patrick and took over the family bakery business. He expanded it from a small neighborhood shop into one of Brooklyn\'s most beloved bakeries.',
    achievements: ['Expanded the family bakery to 3 locations', 'Served as Brooklyn Chamber of Commerce member', 'Established the first employee pension plan in the neighborhood'],
    memories: 'Michael was known for his generosity during the Great Depression, often giving free bread to families in need. His motto was "A hungry neighbor is everyone\'s responsibility."'
  },
  {
    id: '3',
    name: 'Thomas O\'Sullivan',
    birth: '1878',
    death: '1943',
    parents: ['1'],
    spouse: 'Rose Fitzgerald',
    children: ['7', '8'],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    location: 'Boston, Massachusetts',
    birthLocation: 'Brooklyn, New York',
    deathLocation: 'Boston, Massachusetts',
    occupation: 'Police Officer',
    biography: 'Thomas moved to Boston and joined the police force, where he served with distinction for over 30 years. He was known for his integrity and community service.',
    achievements: ['Promoted to Police Sergeant after 15 years', 'Received commendation for bravery during the 1919 Boston Police Strike', 'Founded the Irish-American Officers Association'],
    memories: 'Thomas was a devoted family man who organized the first official family reunion in 1925. He kept detailed records of the family genealogy and was our first family historian.'
  },
  {
    id: '4',
    name: 'Ellen O\'Sullivan',
    birth: '1880',
    death: '1965',
    parents: ['1'],
    spouse: 'James McCarthy',
    children: ['9'],
    photo: '/images/Teacher.jpg',
    location: 'Chicago, Illinois',
    birthLocation: 'Brooklyn, New York',
    deathLocation: 'Chicago, Illinois',
    occupation: 'Teacher and Principal',
    biography: 'Ellen was a pioneering educator who moved to Chicago to pursue better opportunities for women in education. She became one of the first female principals in the Chicago school system.',
    achievements: ['First female principal at Lincoln Elementary School', 'Established scholarship fund for Irish-American students', 'Authored "Teaching in the New Century" educational handbook'],
    memories: 'Ellen was passionate about education and literacy. She personally taught over 2,000 children to read during her 40-year career and maintained correspondence with hundreds of former students.'
  },
  {
    id: '5',
    name: 'John O\'Sullivan',
    birth: '1902',
    death: '1988',
    parents: ['2'],
    spouse: 'Helen Davis',
    children: ['10', '11'],
    photo: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150',
    location: 'Queens, New York',
    birthLocation: 'Brooklyn, New York',
    deathLocation: 'Queens, New York',
    occupation: 'Master Carpenter and Union Leader',
    biography: 'John was a skilled craftsman who helped build many of New York\'s iconic buildings during the mid-20th century. He was also a labor union leader who fought for workers\' rights.',
    achievements: ['Helped construct the Empire State Building', 'President of Carpenters Union Local 608', 'Built over 200 homes in Queens after WWII'],
    memories: 'John was known for his meticulous craftsmanship and his ability to teach others. He trained over 50 apprentice carpenters and believed that "good work speaks for itself."'
  }
];

export default function FamilyTree() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const filteredMembers = familyData.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.occupation && member.occupation.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (member.location && member.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedMemberData = selectedMember ? familyData.find(m => m.id === selectedMember) : null;

  const handleMemberClick = (memberId: string) => {
    setSelectedMember(memberId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-4">
            Family <span className="gold-text">Tree</span>
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
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 gold-text" />
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
                    <h3 className="text-base sm:text-lg font-semibold gold-text mb-4 sm:mb-6 lg:mb-8">
                      First Generation (1840s-1920s)
                    </h3>
                    <div className="flex justify-center">
                      <div 
                        className="flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] w-[90px] sm:w-[110px] lg:w-[130px]"
                        onClick={() => handleMemberClick('1')}
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        <Avatar className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 mb-2 sm:mb-3 ring-2 sm:ring-3 gold-texture group-hover:ring-opacity-100 group-active:ring-opacity-100 transition-all">
                          <AvatarImage src={familyData[0].photo} />
                          <AvatarFallback className="gold-texture text-white text-lg sm:text-xl">
                            {familyData[0].name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground text-sm sm:text-base font-medium group-hover:gold-text transition-colors text-center max-w-24 sm:max-w-none">
                          {isMobile ? familyData[0].name.split(' ')[0] : familyData[0].name}
                        </span>
                        <span className="text-foreground/60 text-xs sm:text-sm">
                          {familyData[0].birth} - {familyData[0].death}
                        </span>
                        <span className="gold-text text-xs mt-1 text-center max-w-20 sm:max-w-none leading-tight">
                          {isMobile ? "Baker" : familyData[0].occupation}
                        </span>
                      </div>
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
                    <h3 className="text-base sm:text-lg font-semibold gold-text mb-4 sm:mb-6 lg:mb-8">
                      Second Generation (1870s-1960s)
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 pb-2">
                      {familyData.filter(member => member.parents?.includes('1')).map((member) => (
                        <div 
                          key={member.id}
                          className="flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation min-h-[110px] sm:min-h-[130px] lg:min-h-[150px] w-[80px] sm:w-[100px] lg:w-[120px]"
                          onClick={() => handleMemberClick(member.id)}
                          style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mb-2 sm:mb-3 ring-2 gold-texture/80 group-hover:ring-opacity-100 group-active:ring-opacity-100 transition-all">
                            <AvatarImage src={member.photo} />
                            <AvatarFallback className="gold-texture text-white text-sm sm:text-base">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground text-xs sm:text-sm font-medium group-hover:gold-text transition-colors text-center max-w-16 sm:max-w-20 lg:max-w-24 leading-tight">
                            {isMobile ? member.name.split(' ')[0] : member.name}
                          </span>
                          <span className="text-foreground/60 text-xs leading-tight">
                            {member.birth} - {member.death}
                          </span>
                          <span className="gold-text text-xs mt-1 text-center max-w-16 sm:max-w-18 lg:max-w-20 leading-tight">
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
                    <h3 className="text-base sm:text-lg font-semibold gold-text mb-4 sm:mb-6 lg:mb-8">
                      Third Generation (1900s-1980s)
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 pb-2">
                      {familyData.filter(member => member.parents?.includes('2')).map((member) => (
                        <div 
                          key={member.id}
                          className="flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation min-h-[100px] sm:min-h-[120px] lg:min-h-[140px] w-[70px] sm:w-[90px] lg:w-[110px]"
                          onClick={() => handleMemberClick(member.id)}
                          style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 mb-2 ring-2 gold-texture/70 group-hover:ring-opacity-100 group-active:ring-opacity-100 transition-all">
                            <AvatarImage src={member.photo} />
                            <AvatarFallback className="gold-texture text-white text-xs sm:text-sm">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground text-xs sm:text-sm font-medium group-hover:gold-text transition-colors text-center max-w-14 sm:max-w-16 lg:max-w-20 leading-tight">
                            {isMobile ? member.name.split(' ')[0] : member.name}
                          </span>
                          <span className="text-foreground/60 text-xs leading-tight">
                            {member.birth} - {member.death}
                          </span>
                          <span className="gold-text text-xs mt-1 text-center max-w-14 sm:max-w-16 lg:max-w-20 leading-tight">
                            {isMobile ? 'Carpenter' : member.occupation}
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
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold gold-text mb-1 sm:mb-2">127</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Total Members</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold gold-text mb-1 sm:mb-2">6</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Generations</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold gold-text mb-1 sm:mb-2">18</div>
              <div className="text-foreground/70 text-xs sm:text-sm lg:text-base">Countries</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-primary/30 text-center touch-manipulation hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold gold-text mb-1 sm:mb-2">1848</div>
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
                <DialogTitle className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 text-xl sm:text-2xl gold-text">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 gold-texture flex-shrink-0">
                    <AvatarImage src={selectedMemberData.photo} />
                    <AvatarFallback className="gold-texture text-white text-lg sm:text-xl">
                      {selectedMemberData.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <div className="leading-tight">{selectedMemberData.name}</div>
                    <div className="text-foreground/60 text-sm sm:text-base font-normal">
                      {selectedMemberData.birth} - {selectedMemberData.death || 'Present'}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h4 className="gold-text font-semibold mb-2 text-base sm:text-lg">Basic Information</h4>
                      <div className="space-y-2 text-sm sm:text-base">
                        {selectedMemberData.occupation && (
                          <div className="flex items-start space-x-2">
                            <User className="w-4 h-4 gold-text mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">{selectedMemberData.occupation}</span>
                          </div>
                        )}
                        {selectedMemberData.birthLocation && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 gold-text mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">Born in {selectedMemberData.birthLocation}</span>
                          </div>
                        )}
                        {selectedMemberData.deathLocation && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 gold-text mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">Died in {selectedMemberData.deathLocation}</span>
                          </div>
                        )}
                        {selectedMemberData.spouse && (
                          <div className="flex items-start space-x-2">
                            <Heart className="w-4 h-4 gold-text mt-0.5 flex-shrink-0" />
                            <span className="leading-tight text-foreground">Married to {selectedMemberData.spouse}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h4 className="gold-text font-semibold mb-2 text-base sm:text-lg">Family Connections</h4>
                      <div className="space-y-2 text-sm sm:text-base">
                        {selectedMemberData.parents && selectedMemberData.parents.length > 0 && (
                          <div>
                            <span className="gold-text font-medium">Parents:</span>{' '}
                            <span className="leading-tight text-foreground">
                              {selectedMemberData.parents.map(parentId => {
                                const parent = familyData.find(m => m.id === parentId);
                                return parent?.name;
                              }).join(', ')}
                            </span>
                          </div>
                        )}
                        {selectedMemberData.children && selectedMemberData.children.length > 0 && (
                          <div>
                            <span className="gold-text font-medium">Children:</span>{' '}
                            <span className="leading-tight text-foreground">
                              {selectedMemberData.children.map(childId => {
                                const child = familyData.find(m => m.id === childId);
                                return child?.name;
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
                    <h4 className="gold-text font-semibold mb-2 text-base sm:text-lg">Life Story</h4>
                    <p className="text-foreground/90 leading-relaxed text-sm sm:text-base">{selectedMemberData.biography}</p>
                  </div>
                )}

                {/* Achievements */}
                {selectedMemberData.achievements && selectedMemberData.achievements.length > 0 && (
                  <div>
                    <h4 className="gold-text font-semibold mb-2 text-base sm:text-lg">Notable Achievements</h4>
                    <ul className="list-disc list-inside space-y-1 text-foreground/90 text-sm sm:text-base">
                      {selectedMemberData.achievements.map((achievement, index) => (
                        <li key={index} className="leading-relaxed">{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Memories */}
                {selectedMemberData.memories && (
                  <div className="pb-2">
                    <h4 className="gold-text font-semibold mb-2 text-base sm:text-lg">Family Memories</h4>
                    <p className="text-foreground/80 leading-relaxed italic text-sm sm:text-base">"{selectedMemberData.memories}"</p>
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