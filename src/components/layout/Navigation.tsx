import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, History, GitBranch, Newspaper, BookOpen, Archive, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Family History', href: '/family-history', icon: History },
  { name: 'Family Tree', href: '/family-tree', icon: GitBranch },
  { name: 'News', href: '/news', icon: Newspaper },
  { name: 'Blog', href: '/blog', icon: BookOpen },
  { name: 'Archives', href: '/archives', icon: Archive },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-primary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 gold-texture rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm drop-shadow-sm">FL</span>
              </div>
              <span className="text-yellow-600 font-bold text-xl hidden sm:block">
                Francis Legacy
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-baseline space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                      isActive
                        ? 'text-yellow-600 font-semibold'
                        : 'text-foreground hover:text-yellow-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-600' : ''}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Profile Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-yellow-50">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{getUserDisplayName()}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center space-x-2">
                          <Settings className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600 hover:text-red-700">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="hamburger-gold-texture" patternUnits="userSpaceOnUse" width="24" height="24">
                        <image href="/assets/yellow-wall-texture-with-scratches.jpg" width="24" height="24" />
                      </pattern>
                    </defs>
                    <path d="M3 12h18M3 6h18M3 18h18" stroke="url(#hamburger-gold-texture)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white">
                <div className="flex flex-col space-y-4 mt-4">
                  {/* User Profile Section */}
                  {user && (
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <div className="flex items-center space-x-3 px-4 py-2">
                        <User className="w-6 h-6 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                          <p className="text-xs text-gray-500">{user.username}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1 mt-3">
                        <Link
                          to="/profile"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-md"
                        >
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </Link>
                        
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-md"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Navigation Items */}
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`px-4 py-3 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-3 ${
                                isActive
                                    ? 'text-yellow-600 font-semibold'
                                    : 'text-foreground hover:text-yellow-600'
                            }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-600' : ''}`} />
                          <span>{item.name}</span>
                        </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
