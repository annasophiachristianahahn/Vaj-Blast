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

// Define shapes (tetromino-ish)
const SHAPES = [
    { points: [[0,0]], id: 'dot' },
    { points: [[0,0], [1,0]], id: 'line2' },
    { points: [[0,0], [1,0], [2,0]], id: 'line3' },
    { points: [[0,0], [0,1], [1,0], [1,1]], id: 'square' },
    { points: [[0,0], [1,0], [0,1]], id: 'L-small' },
];

export default function BlockBlast() {
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [selectedShape, setSelectedShape] = useState<number | null>(null);
  const [currentShapes, setCurrentShapes] = useState(() => generateShapes());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  function generateShapes() {
      return [
          { ...SHAPES[Math.floor(Math.random() * SHAPES.length)], img: IMAGES[Math.floor(Math.random() * IMAGES.length)] },
          { ...SHAPES[Math.floor(Math.random() * SHAPES.length)], img: IMAGES[Math.floor(Math.random() * IMAGES.length)] },
          { ...SHAPES[Math.floor(Math.random() * SHAPES.length)], img: IMAGES[Math.floor(Math.random() * IMAGES.length)] },
      ];
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
          
          setGrid(newGrid);
          
          // Remove used shape
          const newShapes = [...currentShapes];
          newShapes[selectedShape] = null as any; // Mark as used
          setCurrentShapes(newShapes);
          setSelectedShape(null);
          
          // Check for lines
          checkLines(newGrid);
          
          // Check refill
          if (newShapes.every(s => !s)) {
              setCurrentShapes(generateShapes());
          }
      }
  };

  const checkLines = (currentGrid: (string | null)[][]) => {
      let linesCleared = 0;
      const rowsToClear = currentGrid.map((row, r) => row.every(cell => cell !== null) ? r : -1).filter(r => r !== -1);
      const colsToClear = Array(GRID_SIZE).fill(0).map((_, c) => currentGrid.every(row => row[c] !== null) ? c : -1).filter(c => c !== -1);
      
      if (rowsToClear.length > 0 || colsToClear.length > 0) {
          const newGrid = currentGrid.map(row => [...row]);
          
          rowsToClear.forEach(r => {
              for(let c=0; c<GRID_SIZE; c++) newGrid[r][c] = null;
          });
          colsToClear.forEach(c => {
              for(let r=0; r<GRID_SIZE; r++) newGrid[r][c] = null;
          });
          
          setGrid(newGrid);
          setScore(s => s + (rowsToClear.length + colsToClear.length) * 100);
      }
  };

  const resetGame = () => {
      setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
      setCurrentShapes(generateShapes());
      setScore(0);
      setGameOver(false);
  };

  return (
    <Layout>
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="flex justify-between w-full items-center">
            <h1 className="text-3xl font-display text-primary">VAJ BLAST</h1>
            <div className="font-mono text-xl">SCORE: {score}</div>
        </div>

        {/* Grid */}
        <div 
            className="grid gap-1 bg-black/50 p-2 rounded-xl border-4 border-white/20 shadow-2xl"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        >
            {grid.map((row, r) => 
                row.map((cell, c) => (
                    <motion.div
                        key={`${r}-${c}`}
                        onClick={() => handleGridClick(r, c)}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-sm border border-white/5 cursor-pointer hover:bg-white/10 transition-colors ${cell ? 'bg-white' : 'bg-transparent'}`}
                        style={{
                            backgroundImage: cell ? `url(${cell})` : 'none',
                            backgroundSize: 'cover',
                        }}
                        initial={false}
                        animate={{ scale: cell ? 1 : 1, opacity: 1 }}
                    />
                ))
            )}
        </div>

        {/* Shape Selector */}
        <div className="flex gap-4 h-24 items-center justify-center w-full">
            {currentShapes.map((shape, i) => (
                shape ? (
                    <motion.div
                        key={i}
                        onClick={() => setSelectedShape(i)}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${selectedShape === i ? 'bg-primary ring-2 ring-white scale-110' : 'bg-black/40 hover:bg-black/60'}`}
                        whileTap={{ scale: 0.9 }}
                    >
                        <div 
                            className="grid gap-0.5"
                            style={{ 
                                gridTemplateColumns: `repeat(${Math.max(...shape.points.map(p => p[0])) + 1}, 10px)`,
                                gridTemplateRows: `repeat(${Math.max(...shape.points.map(p => p[1])) + 1}, 10px)`
                            }}
                        >
                            {shape.points.map((p, idx) => (
                                <div 
                                    key={idx} 
                                    className="w-2.5 h-2.5 bg-white rounded-[1px]"
                                    style={{ 
                                        gridColumnStart: p[0] + 1,
                                        gridRowStart: p[1] + 1,
                                        backgroundImage: `url(${shape.img})`,
                                        backgroundSize: 'cover'
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : <div key={i} className="w-16 h-16" />
            ))}
        </div>

        <div className="text-xs opacity-50 text-center">
            Select a shape below, then click on the grid to place it.
        </div>
        
        <Button onClick={resetGame} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            RESET GAME
        </Button>
      </div>
    </Layout>
  );
}
