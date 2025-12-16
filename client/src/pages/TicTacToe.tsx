import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

// Import generated assets
import player1Image from "@assets/generated_images/pixel_art_happy_meme_face_for_tic_tac_toe_player_1.png";
import player2Image from "@assets/generated_images/pixel_art_angry_meme_face_for_tic_tac_toe_player_2.png";
import paperTexture from "@assets/generated_images/crumpled_lined_paper_with_tea_stains.png";

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
        className="relative p-2 rounded-sm shadow-2xl w-full max-w-[95vw] aspect-square"
        style={{
            backgroundImage: `url(${paperTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '10px 10px 20px rgba(0,0,0,0.5)'
        }}
      >
        {/* Paper texture overlay could go here */}
        
        <div className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              onClick={() => handleClick(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full h-full
                flex items-center justify-center text-4xl relative overflow-hidden
                border-[#800020]/80
                ${index < 6 ? 'border-b-4' : ''}
                ${index % 3 !== 2 ? 'border-r-4' : ''}
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
                            className="w-[80%] h-[80%] object-contain filter drop-shadow-md"
                            alt="Player 1"
                        />
                    )}
                    {cell === "O" && (
                        <motion.img 
                            src={player2Image} 
                            initial={{ scale: 0, rotate: 45, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-[80%] h-[80%] object-contain filter drop-shadow-md"
                            alt="Player 2"
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
                        <div className="text-4xl font-display text-white drop-shadow-lg mb-4 animate-bounce">
                            {winner === "TIE" ? "TIE" : "WINNER!"}
                        </div>
                        {winner !== "TIE" && (
                            <img 
                                src={winner === "X" ? player1Image : player2Image} 
                                className="w-24 h-24 mx-auto mb-4 border-4 border-white rounded-full shadow-lg"
                            />
                        )}
                        <Button onClick={resetGame} size="lg" className="font-display tracking-wider">
                            PLAY AGAIN
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex gap-8 items-center opacity-80">
        <div className={`flex flex-col items-center ${isXNext && !winner ? "scale-110 text-yellow-400 font-bold" : "opacity-50"}`}>
            <div className="w-12 h-12 rounded-full border-2 border-current overflow-hidden mb-1">
                <img src={player1Image} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-mono">PLAYER 1</span>
        </div>
        <div className="text-xl font-display">VS</div>
        <div className={`flex flex-col items-center ${!isXNext && !winner ? "scale-110 text-yellow-400 font-bold" : "opacity-50"}`}>
             <div className="w-12 h-12 rounded-full border-2 border-current overflow-hidden mb-1">
                <img src={player2Image} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-mono">PLAYER 2</span>
        </div>
      </div>
    </div>
  );
}
