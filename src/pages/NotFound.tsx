import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Card className="bg-gray-900/50 border-yellow-400/20">
          <CardContent className="py-12">
            <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl font-bold text-yellow-400">404</span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
            <p className="text-gray-400 mb-8">
              Sorry, the page you're looking for doesn't exist in our family heritage collection.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-yellow-400 hover:bg-yellow-500 text-black">
                <Link to="/" className="flex items-center">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                <Link to="javascript:history.back()" className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}