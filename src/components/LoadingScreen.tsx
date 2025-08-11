import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          // Wait for fade out animation before calling onLoadingComplete
          setTimeout(() => {
            onLoadingComplete();
          }, 800);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    // Also listen for window load event
    const handleWindowLoad = () => {
      setTimeout(() => {
        setProgress(100);
      }, 500);
    };

    if (document.readyState === 'complete') {
      handleWindowLoad();
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('load', handleWindowLoad);
    };
  }, [onLoadingComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-800 ${
        isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center space-y-8">
        {/* Francis Logo with Animation */}
        <div className="relative">
          <div className="animate-pulse">
            <img
              src="/assets/Francis-logo.svg"
              alt="Francis Legacy"
              className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 drop-shadow-lg"
            />
          </div>

          {/* Rotating ring around logo */}
          <div className="absolute inset-0 border-2 border-transparent border-t-yellow-600 rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <p className="text-foreground/70 text-sm md:text-base">
            Loading family heritage...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 md:w-80 bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="text-sm text-foreground/60 font-medium">
          {Math.round(progress)}%
        </div>

        {/* Animated dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-yellow-50"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ca8a04' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
