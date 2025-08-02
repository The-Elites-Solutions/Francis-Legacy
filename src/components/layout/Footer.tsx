import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-yellow-400/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-gray-400">Made with</span>
            <Heart className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-gray-400">for the Francis Legacy</span>
          </div>
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Francis Legacy. Preserving memories for generations.
          </div>
        </div>
      </div>
    </footer>
  );
}