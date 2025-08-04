import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, History, GitBranch, Newspaper, BookOpen, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
              <span className="gold-text font-bold text-xl hidden sm:block">
                Francis Legacy
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                      isActive
                        ? 'gold-text font-semibold'
                        : 'text-foreground hover:gold-text'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'gold-text' : ''}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="gold-text">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white">
                <div className="flex flex-col space-y-4 mt-4">
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
                            ? 'gold-text font-semibold'
                            : 'text-foreground hover:gold-text'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'gold-text' : ''}`} />
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