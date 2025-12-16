import { Layout } from "@/components/Layout";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Import generated assets
import catImg from "@assets/generated_images/pixel_art_crying_cat_meme.png";
import dogeImg from "@assets/generated_images/doge_coin_style_shiba_inu.png";
import pepeImg from "@assets/generated_images/pepe_frog_style_funny_face.png";
import skullImg from "@assets/generated_images/skull_emoji_with_flames.png";

const IMAGES = [catImg, dogeImg, pepeImg, skullImg];
const GRID_SIZE = 8;

// Define shapes
const SHAPES = [
    // 1. Single & Small Blocks
    { points: [[0,0]], id: 'dot' },
    { points: [[0,0], [1,0]], id: '1x2' },
    { points: [[0,0], [0,1]], id: '2x1' },
    { points: [[0,0], [1,0], [0,1], [1,1]], id: 'square-2x2' },

    // 2. Straight Lines
    { points: [[0,0], [1,0], [2,0]], id: '1x3' },
    { points: [[0,0], [0,1], [0,2]], id: '3x1' },
    { points: [[0,0], [1,0], [2,0], [3,0]], id: '1x4' },
    { points: [[0,0], [0,1], [0,2], [0,3]], id: '4x1' },
    { points: [[0,0], [1,0], [2,0], [3,0], [4,0]], id: '1x5' },
    { points: [[0,0], [0,1], [0,2], [0,3], [0,4]], id: '5x1' },

    // 3. L-Shapes (Small & Large)
    { points: [[0,0], [0,1], [1,1]], id: 'L-small-1' },
    { points: [[0,0], [1,0], [0,1]], id: 'L-small-2' },
    { points: [[0,0], [1,0], [1,1]], id: 'L-small-3' },
    { points: [[1,0], [1,1], [0,1]], id: 'L-small-4' },
    { points: [[0,0], [0,1], [0,2], [1,2], [2,2]], id: 'L-large-1' }, // 3x3 L
    { points: [[2,0], [2,1], [2,2], [1,2], [0,2]], id: 'L-large-2' },
    { points: [[0,0], [1,0], [2,0], [0,1], [0,2]], id: 'L-large-3' },
    { points: [[0,0], [1,0], [2,0], [2,1], [2,2]], id: 'L-large-4' },

    // 4. T-Shapes
    { points: [[0,0], [1,0], [2,0], [1,1]], id: 'T-down' },
    { points: [[1,0], [1,1], [1,2], [0,1]], id: 'T-left' },
    { points: [[0,1], [1,1], [2,1], [1,0]], id: 'T-up' },
    { points: [[0,0], [0,1], [0,2], [1,1]], id: 'T-right' },

    // 5. Zig-Zag / S Shapes
    { points: [[0,1], [1,1], [1,0], [2,0]], id: 'S-horiz' },
    { points: [[0,0], [1,0], [1,1], [2,1]], id: 'Z-horiz' },
    { points: [[0,0], [0,1], [1,1], [1,2]], id: 'S-vert' },
    { points: [[1,0], [1,1], [0,1], [0,2]], id: 'Z-vert' },

    // 6. Large / Chunky Shapes
    { points: [[0,0], [1,0], [2,0], [0,1], [1,1], [2,1], [0,2], [1,2], [2,2]], id: 'square-3x3' },
    { points: [[1,0], [0,1], [1,1], [2,1], [1,2]], id: 'plus' },
    { points: [[0,0], [0,1], [1,1], [1,2], [2,2]], id: 'stairs' },
];

export default function BlockBlast() {
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [selectedShape, setSelectedShape] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Round management
  const [round, setRound] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Helper to get image for current round
  const getRoundImage = (index: number) => IMAGES[index % IMAGES.length];
  
  // Shapes state needs to depend on round image
  const [currentShapes, setCurrentShapes] = useState<{points: number[][], id: string, img: string}[]>([]);

  // Initialize shapes on mount
  useEffect(() => {
      generateNewShapes(currentImageIndex);
  }, []);

  function generateNewShapes(imgIndex: number) {
      const img = getRoundImage(imgIndex);
      const newShapes = [
          { ...SHAPES[Math.floor(Math.random() * SHAPES.length)], img },
          { ...SHAPES[Math.floor(Math.random() * SHAPES.length)], img },
          { ...SHAPES[Math.floor(Math.random() * SHAPES.length)], img },
      ];
      setCurrentShapes(newShapes);
  }

  const handleGridClick = (r: number, c: number) => {
      if (selectedShape === null || gameOver) return;
      
      const shape = currentShapes[selectedShape];
      if (!shape) return;

      // Check if placeable
      const canPlace = shape.points.every(([dx, dy]) => {
          const nr = r + dy;
          const nc = c + dx;
          return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !grid[nr][nc];
      });

      if (canPlace) {
          const newGrid = grid.map(row => [...row]);
          shape.points.forEach(([dx, dy]) => {
              newGrid[r + dy][c + dx] = shape.img;
          });
          
          // Remove used shape
          const newShapes = [...currentShapes];
          newShapes[selectedShape] = null as any; // Mark as used
          setCurrentShapes(newShapes);
          setSelectedShape(null);
          
          // Check for lines FIRST
          const gridAfterLines = checkLines(newGrid);
          
          // Check for empty board (Round Clear)
          const isBoardEmpty = gridAfterLines.every(row => row.every(cell => cell === null));
          if (isBoardEmpty && score > 0) { // Ensure it's not just the start of game
              setRound(r => r + 1);
              setCurrentImageIndex(i => i + 1);
              // Use NEXT image for next round immediately? Or just for new shapes?
              // Let's swap immediately for visual feedback? 
              // Actually, user said "graduate to the next round", so new shapes should use new image.
              // Existing blocks are gone anyway.
          }

          setGrid(gridAfterLines);

          // Check refill shapes if all used
          if (newShapes.every(s => !s)) {
              // If we just cleared board, we use next image index, otherwise current
              const nextImgIndex = isBoardEmpty && score > 0 ? currentImageIndex + 1 : currentImageIndex;
              generateNewShapes(nextImgIndex);
          }
      }
  };

  const checkLines = (currentGrid: (string | null)[][]) => {
      let linesCleared = 0;
      const rowsToClear = currentGrid.map((row, r) => row.every(cell => cell !== null) ? r : -1).filter(r => r !== -1);
      const colsToClear = Array(GRID_SIZE).fill(0).map((_, c) => currentGrid.every(row => row[c] !== null) ? c : -1).filter(c => c !== -1);
      
      const newGrid = currentGrid.map(row => [...row]);

      if (rowsToClear.length > 0 || colsToClear.length > 0) {
          rowsToClear.forEach(r => {
              for(let c=0; c<GRID_SIZE; c++) newGrid[r][c] = null;
          });
          colsToClear.forEach(c => {
              for(let r=0; r<GRID_SIZE; r++) newGrid[r][c] = null;
          });
          
          setScore(s => s + (rowsToClear.length + colsToClear.length) * 100);
      }
      
      return newGrid;
  };

  const resetGame = () => {
      setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
      setRound(1);
      setCurrentImageIndex(0);
      generateNewShapes(0);
      setScore(0);
      setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[90vw] md:max-w-md mt-2 mx-auto">
        <div className="flex justify-between w-full items-center px-2">
            <div>
                <h1 className="text-2xl font-display text-primary">VAJ BLAST</h1>
                <div className="text-xs font-mono opacity-70">ROUND {round}</div>
            </div>
            <div className="font-mono text-lg">SCORE: {score}</div>
        </div>

        {/* Grid */}
        <div 
            className="grid gap-0.5 bg-black/50 p-1.5 rounded-xl border-4 border-white/20 shadow-2xl w-full aspect-square max-w-[320px]"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        >
            {grid.map((row, r) => 
                row.map((cell, c) => (
                    <motion.div
                        key={`${r}-${c}`}
                        onClick={() => handleGridClick(r, c)}
                        className={`w-full h-full rounded-sm border border-white/5 cursor-pointer hover:bg-white/10 transition-colors ${cell ? 'bg-white' : 'bg-transparent'}`}
                        style={{
                            backgroundImage: cell ? `url(${cell})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                        initial={false}
                        animate={{ scale: cell ? 1 : 1, opacity: 1 }}
                    />
                ))
            )}
        </div>

        {/* Shape Selector */}
        <div className="flex gap-4 h-32 items-center justify-center w-full">
            {currentShapes.map((shape, i) => (
                shape ? (
                    <motion.div
                        key={i}
                        onClick={() => setSelectedShape(i)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${selectedShape === i ? 'bg-primary ring-2 ring-white scale-110' : 'bg-black/40 hover:bg-black/60'}`}
                        whileTap={{ scale: 0.9 }}
                    >
                        <div 
                            className="grid gap-1"
                            style={{ 
                                gridTemplateColumns: `repeat(${Math.max(...shape.points.map(p => p[0])) + 1}, 20px)`,
                                gridTemplateRows: `repeat(${Math.max(...shape.points.map(p => p[1])) + 1}, 20px)`
                            }}
                        >
                            {shape.points.map((p, idx) => (
                                <div 
                                    key={idx} 
                                    className="w-5 h-5 bg-white rounded-[2px]"
                                    style={{ 
                                        gridColumnStart: p[0] + 1,
                                        gridRowStart: p[1] + 1,
                                        backgroundImage: `url(${shape.img})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : <div key={i} className="w-16 h-16" />
            ))}
        </div>

        <div className="text-xs opacity-50 text-center">
            Select a shape below, then click on the grid to place it. Clear the board to advance!
        </div>
        
        <Button onClick={resetGame} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            RESET GAME
        </Button>
      </div>
  );
}
