import { Layout } from "@/components/Layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CoinFlip from "./CoinFlip";
import QuietGame from "./QuietGame";
import BlockBlast from "./BlockBlast";
import { Button } from "@/components/ui/button";

type GameType = 'coin-flip' | 'quiet-game' | 'block-blast';

export default function Home() {
  const [activeGame, setActiveGame] = useState<GameType>('coin-flip');

  return (
    <Layout>
      <div className="flex flex-col items-center gap-8 w-full h-full">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-center"
        >
            <h1 className="text-6xl md:text-8xl font-display text-primary drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black tracking-tighter transform -rotate-2">
            VAJUNNIE
            </h1>
            <p className="text-xl font-bold bg-black/50 px-4 py-1 rounded-full mt-2 border border-primary/50 text-primary-foreground backdrop-blur-sm">
            THE CHAOS APP
            </p>
        </motion.div>

        {/* Game Selector */}
        <div className="flex flex-nowrap overflow-x-auto justify-start md:justify-center gap-2 md:gap-4 w-full max-w-lg z-20 px-4 pb-2 scrollbar-hide -mx-4 md:mx-0">
            <GameTab 
                active={activeGame === 'coin-flip'} 
                onClick={() => setActiveGame('coin-flip')}
                label="COIN FLIP"
                color="bg-red-500"
            />
            <GameTab 
                active={activeGame === 'quiet-game'} 
                onClick={() => setActiveGame('quiet-game')}
                label="QUIET GAME"
                color="bg-purple-500"
            />
            <GameTab 
                active={activeGame === 'block-blast'} 
                onClick={() => setActiveGame('block-blast')}
                label="VAJ BLAST"
                color="bg-green-500"
            />
        </div>

        {/* Game Container */}
        <div className="w-full flex-1 min-h-[500px] relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeGame}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                >
                    {activeGame === 'coin-flip' && <CoinFlip />}
                    {activeGame === 'quiet-game' && <QuietGame />}
                    {activeGame === 'block-blast' && <BlockBlast />}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

function GameTab({ active, onClick, label, color }: { active: boolean, onClick: () => void, label: string, color: string }) {
    return (
        <Button
            onClick={onClick}
            className={`
                relative h-10 md:h-12 px-3 md:px-6 font-display text-sm md:text-xl uppercase transition-all whitespace-nowrap shrink-0
                border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)]
                hover:-translate-y-1 hover:shadow-[4px_4px_0_rgba(0,0,0,1)] md:hover:shadow-[6px_6px_0_rgba(0,0,0,1)]
                active:translate-y-0 active:shadow-[1px_1px_0_rgba(0,0,0,1)]
                ${active ? `${color} text-white scale-105 z-10` : 'bg-white text-black hover:bg-gray-100'}
            `}
        >
            {label}
        </Button>
    )
}
