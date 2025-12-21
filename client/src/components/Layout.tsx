import { ReactNode } from "react";
import { Link } from "wouter";
import { Home } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden text-white font-sans selection:bg-primary selection:text-white">
      {/* Background Video */}
      <div className="fixed inset-0 z-0 bg-[hsl(200,100%,70%)]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source src="/background_video.mp4" type="video/mp4" />
        </video>
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
