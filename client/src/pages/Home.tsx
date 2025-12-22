import { Layout } from "@/components/Layout";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CoinFlip from "./CoinFlip";
import QuietGame from "./QuietGame";
import BlockBlast from "./BlockBlast";
import TicTacToe from "./TicTacToe";
import { Button } from "@/components/ui/button";
import { BLOCK_BLAST_IMAGES } from "@/lib/gameAssets";

// Preload images helper
const preloadImages = (urls: string[]) => {
    urls.forEach((url) => {
        const img = new Image();
        img.src = url;
    });
};

type GameType = 'coin-flip' | 'quiet-game' | 'block-blast' | 'tic-tac-toe';

export default function Home() {
  const [activeGame, setActiveGame] = useState<GameType>('coin-flip');

  useEffect(() => {
    // Preload Block Blast images immediately on mount
    preloadImages(BLOCK_BLAST_IMAGES);
  }, []);

  return (
    <Layout>
      <div className="flex flex-col items-center gap-1 md:gap-2 w-full h-full max-w-[100vw] overflow-hidden pt-2">

        {/* Game Selector */}
        <div className="w-full z-20 px-4 flex flex-col items-center gap-4 shrink-0">
            {/* Main Games Grid - Top Row */}
            <div className="grid grid-cols-3 w-full gap-2 md:gap-4 pb-0">
                <GameTab 
                    active={activeGame === 'coin-flip'} 
                    onClick={() => setActiveGame('coin-flip')}
                    label="COIN FLIP"
                    bgColor="#3B00FF" // Electric Blue
                    textColor="#00FFCC" // Neon Teal
                    className="w-full"
                />
                <GameTab 
                    active={activeGame === 'quiet-game'} 
                    onClick={() => setActiveGame('quiet-game')}
                    label="QUIET GAME"
                    bgColor="#9900FF" // Electric Violet
                    textColor="#FFE600" // Neon Yellow
                    className="w-full"
                />
                <GameTab 
                    active={activeGame === 'block-blast'} 
                    onClick={() => setActiveGame('block-blast')}
                    label="VAJ BLAST"
                    bgColor="#FF003C" // Neon Red
                    textColor="#00FFEA" // Cyan
                    className="w-full"
                />
            </div>

            {/* Bottom Row - Centered */}
            <div className="w-full flex justify-center">
                <GameTab 
                    active={activeGame === 'tic-tac-toe'} 
                    onClick={() => setActiveGame('tic-tac-toe')}
                    label="larong Tic Tac Toe sa papel"
                    bgColor="#FF9500" // Neon Orange
                    textColor="#8A2BE2" // Blue Violet
                    className="w-auto"
                />
            </div>
        </div>

        {/* Game Container */}
        <div className="w-full flex-1 min-h-0 relative flex flex-col">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeGame}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex-1"
                >
                    {activeGame === 'coin-flip' && <CoinFlip />}
                    {activeGame === 'quiet-game' && <QuietGame />}
                    {activeGame === 'block-blast' && <BlockBlast />}
                    {activeGame === 'tic-tac-toe' && <TicTacToe />}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

function GameTab({ active, onClick, label, bgColor, textColor, className = "" }: { active: boolean, onClick: () => void, label: string, bgColor: string, textColor: string, className?: string }) {
    // Helper to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Helper to calculate inverse color (simple inversion)
    const getInverseColor = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        // Simple inversion: 255 - value
        const rInv = (255 - r).toString(16).padStart(2, '0');
        const gInv = (255 - g).toString(16).padStart(2, '0');
        const bInv = (255 - b).toString(16).padStart(2, '0');
        return `#${rInv}${gInv}${bInv}`;
    };

    return (
        <motion.button
            onClick={onClick}
            className={`
                relative h-12 md:h-14 px-1 md:px-6 font-display text-xs sm:text-sm md:text-xl uppercase whitespace-normal leading-none
                border-2 rounded-md flex items-center justify-center ${className}
            `}
            style={{
                backgroundColor: active ? hexToRgba(bgColor, 0.62) : hexToRgba(bgColor, 0.44),
                borderColor: active ? 'transparent' : textColor,
            }}
            initial={active ? {
                backgroundColor: hexToRgba(bgColor, 0.62),
                y: 0,
                scale: 1
            } : {
                backgroundColor: hexToRgba(bgColor, 0.44),
                y: 0,
                scale: 1,
                boxShadow: "none"
            }}
            animate={active ? {
                y: [0, -4, 0],
                scale: 1.02,
                backgroundColor: hexToRgba(bgColor, 0.62),
            } : {
                y: 0,
                boxShadow: "none",
                scale: 1,
                backgroundColor: hexToRgba(bgColor, 0.44),
            }}
            transition={active ? {
                y: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                },
                backgroundColor: { duration: 0.3 }
            } : { duration: 0.2 }}
            whileHover={{ scale: 1.02, backgroundColor: hexToRgba(bgColor, 0.67) }}
            whileTap={{ scale: 0.98 }}
        >
            {/* SVG Electricity Effect */}
            {active && (
                <>
                     {/* Filter for noise displacement */}
                    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                         <defs>
                            <filter id="lightning-noise" x="-20%" y="-20%" width="140%" height="140%">
                                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="0">
                                    <animate attributeName="seed" values="0;10;20;30;40;50;60;70;80;90;100" dur="0.5s" repeatCount="indefinite" />
                                </feTurbulence>
                                <feDisplacementMap in="SourceGraphic" scale="5" />
                            </filter>
                         </defs>
                    </svg>

                    {/* Pink Layer */}
                    <svg className="electric-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ filter: 'url(#lightning-noise) drop-shadow(0 0 2px #FF10F0)' }}>
                        <rect x="2" y="2" width="96" height="96" rx="10" ry="10" className="electric-stroke-pink" vectorEffect="non-scaling-stroke" />
                    </svg>
                    {/* Green Layer - Slightly offset or distinct animation */}
                    <svg className="electric-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ filter: 'url(#lightning-noise) blur(0.5px)', top: '-8%', left: '-3%' }}>
                        <rect x="2" y="2" width="96" height="96" rx="10" ry="10" className="electric-stroke-green" vectorEffect="non-scaling-stroke" />
                    </svg>
                    
                    {/* Particles */}
                    <div className="electric-part part-1" />
                    <div className="electric-part part-2" />
                    <div className="electric-part part-3" />
                    <div className="electric-part part-4" />
                </>
            )}

            <motion.span 
                className={`w-full break-words relative z-10 block`}
                style={{
                    color: active ? getInverseColor(bgColor) : textColor,
                    filter: active ? 'none' : 'none',
                    fontWeight: active ? '900' : 'normal'
                }}
            >
                {label}
            </motion.span>
        </motion.button>
    )
}
