import { ReactNode } from "react";
import { Link } from "wouter";
import { Home } from "lucide-react";
import backgroundVideo from "@assets/background_video.mp4";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden text-white font-sans selection:bg-primary selection:text-white">
      {/* Background Video */}
      <div className="fixed inset-0 z-0 bg-[hsl(0,0%,10%)]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center w-full pointer-events-auto">
            {children}
            
            <footer className="w-full flex justify-center py-3 mt-auto shrink-0 z-50">
              <a 
                href="https://www.vajunnie.top" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-black px-4 py-1.5 text-[10px] md:text-xs font-bold text-white tracking-widest hover:scale-105 transition-transform rounded-sm border border-white/20 shadow-lg"
              >
                VAJUNNIE.TOP
              </a>
            </footer>
        </main>
      </div>
    </div>
  );
}
