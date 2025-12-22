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
                    baseColor="#FF0055" // Vibrant Red-Pink
                />
                <GameTab 
                    active={activeGame === 'quiet-game'} 
                    onClick={() => setActiveGame('quiet-game')}
                    label="QUIET GAME"
                    baseColor="#9D00FF" // Electric Purple
                />
                <GameTab 
                    active={activeGame === 'block-blast'} 
                    onClick={() => setActiveGame('block-blast')}
                    label="VAJ BLAST"
                    baseColor="#00CC44" // Vibrant Green
                />
            </div>

            {/* Bottom Row - Full Width */}
            <div className="w-full md:w-2/3 lg:w-1/2">
                <GameTab 
                    active={activeGame === 'tic-tac-toe'} 
                    onClick={() => setActiveGame('tic-tac-toe')}
                    label="larong Tic Tac Toe sa papel"
                    baseColor="#FF9500" // Bright Orange
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

function GameTab({ active, onClick, label, baseColor }: { active: boolean, onClick: () => void, label: string, baseColor: string }) {
    return (
        <Button
            onClick={onClick}
            className={`
                relative h-12 md:h-14 w-full px-1 md:px-6 font-display text-xs sm:text-sm md:text-xl uppercase transition-all whitespace-normal overflow-hidden leading-none
                border backdrop-blur-sm
                ${active 
                    ? 'text-white scale-[1.02] z-10' 
                    : 'text-white/90 hover:text-white hover:-translate-y-0.5'}
            `}
            style={{
                backgroundColor: active ? `${baseColor}E6` : `${baseColor}66`, // E6 = 90%, 66 = 40%
                borderColor: active ? '#ffffff' : baseColor,
                boxShadow: active ? `0 0 15px ${baseColor}66` : 'none',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
        >
            <span className="w-full break-words">{label}</span>
        </Button>
    )
}
