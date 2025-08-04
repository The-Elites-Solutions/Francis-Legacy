export default function Footer() {
  return (
    <footer className="bg-white border-t border-primary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-foreground/70">Made with</span>
            <div className="relative w-4 h-4 inline-block">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
              >
                <defs>
                  <mask id="heart-mask">
                    <path 
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                      fill="white"
                    />
                  </mask>
                </defs>
                <rect
                  width="24"
                  height="24"
                  fill="url(#gold-pattern)"
                  mask="url(#heart-mask)"
                />
                <pattern 
                  id="gold-pattern" 
                  patternUnits="userSpaceOnUse" 
                  width="100%" 
                  height="100%"
                >
                  <image 
                    href="/assets/yellow-wall-texture-with-scratches.jpg" 
                    width="24" 
                    height="24" 
                    preserveAspectRatio="xMidYMid slice"
                  />
                </pattern>
              </svg>
            </div>
            <span className="text-foreground/70">for the Francis Legacy</span>
          </div>
          <div className="text-foreground/70 text-sm">
            © {new Date().getFullYear()} Francis Legacy. Preserving memories for generations.
          </div>
        </div>
      </div>
    </footer>
  );
}