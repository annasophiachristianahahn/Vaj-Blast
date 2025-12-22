import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

// Import generated assets
import player1Image from "@assets/vaj-400_1766349849850.jpg";
import player2Image from "@assets/grams-400_1766349849850.jpg";
import paperTexture from "@assets/generated_images/crumpled_lined_paper_with_tea_stains_optimized.jpg";

export default function TicTacToe() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
    } else if (!newBoard.includes(null)) {
      setWinner("TIE");
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 min-h-[60vh]">
      <div 
        className="relative flex items-center justify-center rounded-sm shadow-2xl w-full max-w-[95vw] aspect-square overflow-hidden"
        style={{
            backgroundImage: `url(${paperTexture})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            boxShadow: '10px 10px 20px rgba(0,0,0,0.5)'
        }}
      >
        {/* Paper texture overlay could go here */}
        
        <div className="grid grid-cols-3 grid-rows-3 gap-0 w-[90%] h-[90%] relative z-10">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              onClick={() => handleClick(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full h-full
                flex items-center justify-center text-4xl relative overflow-hidden
                border-[#800020] border-solid
                ${index < 6 ? 'border-b-4' : 'border-b-0'}
                ${index % 3 !== 2 ? 'border-r-4' : 'border-r-0'}
                ${winningLine?.includes(index) ? "bg-green-500/10" : ""}
              `}
            >
                <AnimatePresence>
                    {cell === "X" && (
                        <motion.img 
                            src={player1Image} 
                            initial={{ scale: 0, rotate: -45, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-[90%] h-[90%] object-contain filter drop-shadow-md"
                            alt="VAJUNNIE"
                        />
                    )}
                    {cell === "O" && (
                        <motion.img 
                            src={player2Image} 
                            initial={{ scale: 0, rotate: 45, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-[90%] h-[90%] object-contain filter drop-shadow-md"
                            alt="GRAMS"
                        />
                    )}
                </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Winner Overlay */}
        <AnimatePresence>
            {winner && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm"
                >
                    <div className="text-center p-4">
                        <div className="text-4xl font-display rainbow-gradient drop-shadow-lg mb-4 animate-bounce">
                            {winner === "TIE" ? "TIE" : "WINNER!"}
                        </div>
                        {winner !== "TIE" && (
                            <div className="relative w-40 h-40 mx-auto mb-6">
                                <img 
                                    src={winner === "X" ? player1Image : player2Image} 
                                    className="w-full h-full border-8 border-[#7FFF00] rounded-full shadow-2xl object-cover relative z-10"
                                />
                                {/* Sparkles Animation */}
                                {[...Array(20)].map((_, i) => {
                                    const randomColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
                                    return (
                                    <motion.div
                                        key={i}
                                        className="absolute top-1/2 left-1/2 w-4 h-4 z-20 pointer-events-none mix-blend-screen"
                                        style={{ color: randomColor }}
                                        initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                                        animate={{ 
                                            x: (Math.cos(i * (360/20) * (Math.PI/180)) * (60 + Math.random() * 60)), 
                                            y: (Math.sin(i * (360/20) * (Math.PI/180)) * (60 + Math.random() * 60)), 
                                            scale: [0, 1, 0], 
                                            opacity: [0, 1, 0],
                                            rotate: [0, 180, 360]
                                        }}
                                        transition={{ 
                                            duration: 0.8 + Math.random() * 0.5, 
                                            repeat: Infinity, 
                                            delay: Math.random() * 0.2,
                                            ease: "easeOut"
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_8px_currentColor]">
                                            <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
                                        </svg>
                                    </motion.div>
                                    );
                                })}
                            </div>
                        )}
                        <Button 
                            onClick={resetGame} 
                            size="lg" 
                            className="font-display tracking-wider text-2xl px-8 py-6 bg-[#FF10F0] text-[#7FFF00] border border-[#7FFF00] hover:bg-[#D000C0] hover:scale-105 transition-all"
                        >
                            PLAY AGAIN
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex gap-8 items-center opacity-90">
        <div className={`flex flex-col items-center transition-all duration-300 ${isXNext && !winner ? "scale-110 drop-shadow-md" : "opacity-60 grayscale-[0.3]"}`}>
            <div className={`w-24 h-24 rounded-full border-4 border-current overflow-hidden mb-2 shadow-lg bg-black/10 ${isXNext && !winner ? "text-[#7FFF00]" : ""}`}>
                <img src={player1Image} className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-['Chewy','cursive'] tracking-wider text-[#FF10F0]">VAJUNNIE</span>
        </div>
        <div className="text-3xl font-display font-black text-red-600">VS</div>
        <div className={`flex flex-col items-center transition-all duration-300 ${!isXNext && !winner ? "scale-110 drop-shadow-md" : "opacity-60 grayscale-[0.3]"}`}>
             <div className={`w-24 h-24 rounded-full border-4 border-current overflow-hidden mb-2 shadow-lg bg-black/10 ${!isXNext && !winner ? "text-[#7FFF00]" : ""}`}>
                <img src={player2Image} className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-['Chewy','cursive'] tracking-wider text-[#FF10F0]">GRAMS</span>
        </div>
      </div>
    </div>
  );
}
