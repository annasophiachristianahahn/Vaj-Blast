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

    return (
        <motion.button
            onClick={onClick}
            className={`
                relative h-12 md:h-14 px-1 md:px-6 font-display text-xs sm:text-sm md:text-xl uppercase whitespace-normal overflow-hidden leading-none
                border-2 backdrop-blur-md rounded-md flex items-center justify-center ${className}
            `}
            style={{
                backgroundColor: active ? hexToRgba(bgColor, 0.88) : hexToRgba(bgColor, 0.74),
                borderColor: active ? '#98FF98' : textColor,
            }}
            initial={active ? {
                backgroundColor: hexToRgba(bgColor, 0.88),
                y: 0,
                scale: 1,
                boxShadow: "none"
            } : {
                backgroundColor: hexToRgba(bgColor, 0.74),
                y: 0,
                scale: 1,
                boxShadow: "none"
            }}
            animate={active ? {
                y: [0, -4, 0],
                boxShadow: [
                    "0 0 10px #98FF98",
                    "0 0 20px #98FF98",
                    "0 0 10px #98FF98"
                ],
                scale: 1.02,
                backgroundColor: hexToRgba(bgColor, 0.88),
            } : {
                y: 0,
                boxShadow: "none",
                scale: 1,
                backgroundColor: hexToRgba(bgColor, 0.74),
            }}
            transition={active ? {
                y: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                },
                boxShadow: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                },
                backgroundColor: { duration: 0.3 }
            } : { duration: 0.2 }}
            whileHover={{ scale: 1.02, backgroundColor: hexToRgba(bgColor, 0.8) }}
            whileTap={{ scale: 0.98 }}
        >
            <motion.span 
                className={`w-full break-words relative z-10 block ${active ? 'plaid-text' : ''}`}
                style={{
                    color: active ? 'transparent' : textColor,
                    filter: active ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' : 'none',
                }}
            >
                {label}
            </motion.span>
        </motion.button>
    )
}
