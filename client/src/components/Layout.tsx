import { ReactNode } from "react";
import bgVideo from "@assets/generated_videos/surreal_purple_and_red_distorted_abstract_background_loop.mp4";
import { Link } from "wouter";
import { Home } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden text-white font-sans selection:bg-primary selection:text-white">
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
      <div className="relative z-10 flex flex-col h-full">
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center w-full">
            {children}
        </main>
      </div>
    </div>
  );
}
