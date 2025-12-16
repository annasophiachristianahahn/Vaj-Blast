import { Layout } from "@/components/Layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CoinFlip from "./CoinFlip";
import QuietGame from "./QuietGame";
import BlockBlast from "./BlockBlast";
import TicTacToe from "./TicTacToe";
import { Button } from "@/components/ui/button";

type GameType = 'coin-flip' | 'quiet-game' | 'block-blast' | 'tic-tac-toe';

export default function Home() {
  const [activeGame, setActiveGame] = useState<GameType>('coin-flip');

  return (
    <Layout>
      <div className="flex flex-col items-center gap-2 md:gap-4 w-full h-full max-w-[100vw] overflow-hidden pt-4">

        {/* Game Selector */}
        <div className="w-full z-20 px-4 flex flex-col items-center gap-4">
            {/* Main Games Row - Force all items to fit without scrolling on larger screens, scroll on very small */}
            <div className="grid grid-cols-3 w-full gap-2 pb-1">
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

            {/* Extra Game Button Below */}
            <Button
                onClick={() => setActiveGame('tic-tac-toe')}
                className={`
                    w-full h-auto min-h-[44px] py-2 px-2 font-display text-xs sm:text-sm md:text-lg uppercase transition-all whitespace-normal leading-none
                    border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]
                    hover:-translate-y-1 hover:shadow-[4px_4px_0_rgba(0,0,0,1)]
                    active:translate-y-0 active:shadow-[1px_1px_0_rgba(0,0,0,1)]
                    ${activeGame === 'tic-tac-toe' ? 'bg-yellow-400 text-black scale-[1.02]' : 'bg-white text-black hover:bg-gray-100'}
                `}
            >
                ang larong Tic Tac Toe sa papel
            </Button>
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

function GameTab({ active, onClick, label, color }: { active: boolean, onClick: () => void, label: string, color: string }) {
    return (
        <Button
            onClick={onClick}
            className={`
                relative h-12 md:h-14 w-full px-1 md:px-6 font-display text-xs sm:text-sm md:text-xl uppercase transition-all whitespace-normal overflow-hidden leading-none
                border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)]
                hover:-translate-y-1 hover:shadow-[4px_4px_0_rgba(0,0,0,1)] md:hover:shadow-[6px_6px_0_rgba(0,0,0,1)]
                active:translate-y-0 active:shadow-[1px_1px_0_rgba(0,0,0,1)]
                ${active ? `${color} text-white scale-[1.02] z-10` : 'bg-white text-black hover:bg-gray-100'}
            `}
        >
            <span className="w-full break-words">{label}</span>
        </Button>
    )
}
