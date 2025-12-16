import { ReactNode } from "react";
import bgVideo from "@assets/generated_videos/surreal_purple_and_red_distorted_abstract_background_loop.mp4";
import { Link } from "wouter";
import { Home } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white font-sans selection:bg-primary selection:text-white">
      {/* Background Video */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-80"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <nav className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/10">
            <Link href="/">
                <div className="text-2xl font-display text-primary tracking-wider hover:scale-105 transition-transform cursor-pointer drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
                    $VAJ
                </div>
            </Link>
            <Link href="/">
                <div className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                    <Home className="w-6 h-6" />
                </div>
            </Link>
        </nav>
        
        <main className="flex-1 p-4 flex flex-col items-center justify-center max-w-md mx-auto w-full">
            {children}
        </main>

        <footer className="p-4 text-center text-xs opacity-60 font-mono">
            10 Strawberry Street ent
        </footer>
      </div>
    </div>
  );
}
