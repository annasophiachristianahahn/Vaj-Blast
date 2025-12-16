import { Layout } from "@/components/Layout";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Round management
  const [round, setRound] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Animation state
  const [clearingCells, setClearingCells] = useState<{r: number, c: number}[]>([]);
  const [shakeGrid, setShakeGrid] = useState(false);
  
  // Helper to get image for current round
  const getRoundImage = (index: number) => IMAGES[index % IMAGES.length];
  
  // Shapes state needs to depend on round image
  const [currentShapes, setCurrentShapes] = useState<{points: number[][], id: string, img: string}[]>([]);
  
  // Grid Ref for drag calculations
  const gridRef = useRef<HTMLDivElement>(null);

  // Initialize shapes on mount
  useEffect(() => {
      generateNewShapes(currentImageIndex);
  }, []);

  function generateNewShapes(imgIndex: number) {
      const img = getRoundImage(imgIndex);
      const newShapes = [];
      
      for (let i = 0; i < 3; i++) {
          // ~1/7 chance for a single dot (approx 14%)
          // There are ~29 shapes. 
          // If we want 1/7 chance, we force 'dot' if rand < 1/7
          // Otherwise pick from full pool (which also contains dot, slightly increasing chance further but negligible)
          if (Math.random() < (1/7)) {
              newShapes.push({ ...SHAPES[0], img }); // SHAPES[0] is 'dot'
          } else {
              newShapes.push({ ...SHAPES[Math.floor(Math.random() * SHAPES.length)], img });
          }
      }
      setCurrentShapes(newShapes);

      // Check for game over immediately after generating new shapes
      // We need to wait for state update or pass newShapes directly
      // Since state update is async, we pass it directly
      checkGameOver(grid, newShapes);
  }

  // Check if ANY available shape can fit ANYWHERE on the grid
  const checkGameOver = (currentGrid: (string | null)[][], shapes: any[]) => {
      // Filter out null shapes (already placed)
      const availableShapes = shapes.filter(s => s !== null);
      
      if (availableShapes.length === 0) return; // Should not happen usually as we refill

      // For each available shape
      for (const shape of availableShapes) {
          // Try every position on the grid
          for (let r = 0; r < GRID_SIZE; r++) {
              for (let c = 0; c < GRID_SIZE; c++) {
                  if (canPlaceShape(r, c, shape, currentGrid)) {
                      return; // Found a valid move! Game continues.
                  }
              }
          }
      }

      // If we get here, NO moves are possible
      setGameOver(true);
  };

  const handleDragEnd = (event: any, info: any, shapeIndex: number) => {
    if (!gridRef.current || gameOver) return;

    const shape = currentShapes[shapeIndex];
    if (!shape) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const pointerX = info.point.x;
    const pointerY = info.point.y;

    if (
        pointerX < gridRect.left || 
        pointerX > gridRect.right || 
        pointerY < gridRect.top || 
        pointerY > gridRect.bottom
    ) {
        return; 
    }

    const cellWidth = gridRect.width / GRID_SIZE;
    const cellHeight = gridRect.height / GRID_SIZE;
    
    const relativeX = pointerX - gridRect.left;
    const relativeY = pointerY - gridRect.top;
    
    const rawC = Math.floor(relativeX / cellWidth);
    const rawR = Math.floor(relativeY / cellHeight);

    const shapeWidth = Math.max(...shape.points.map(p => p[0])) + 1;
    const shapeHeight = Math.max(...shape.points.map(p => p[1])) + 1;

    const c = rawC - Math.floor((shapeWidth - 1) / 2);
    const r = rawR - Math.floor((shapeHeight - 1) / 2);
    
    const offsets = [
        [0, 0], 
        [0, 1], [0, -1], [1, 0], [-1, 0], 
        [1, 1], [1, -1], [-1, 1], [-1, -1] 
    ];

    for (const [dr, dc] of offsets) {
        const testR = r + dr;
        const testC = c + dc;
        
        if (canPlaceShape(testR, testC, shape, grid)) {
            placeShape(testR, testC, shape, shapeIndex);
            return; 
        }
    }
  };

  const canPlaceShape = (r: number, c: number, shape: any, currentGrid: (string | null)[][]) => {
      return shape.points.every(([dx, dy]: number[]) => {
          const nr = r + dy;
          const nc = c + dx;
          return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !currentGrid[nr][nc];
      });
  };

  const placeShape = (r: number, c: number, shape: any, shapeIndex: number) => {
      const newGrid = grid.map(row => [...row]);
      shape.points.forEach(([dx, dy]: number[]) => {
          newGrid[r + dy][c + dx] = shape.img;
      });
      setGrid(newGrid);

      const newShapes = [...currentShapes];
      newShapes[shapeIndex] = null as any; 
      setCurrentShapes(newShapes);

      const linesToClear = findLinesToClear(newGrid);

      if (linesToClear.length > 0) {
          setClearingCells(linesToClear);
          setShakeGrid(true); // Trigger grid shake
          
          setTimeout(() => {
              setShakeGrid(false); // Stop shake
              const finalGrid = clearLinesFromGrid(newGrid, linesToClear);
              setGrid(finalGrid);
              setClearingCells([]);
              setScore(s => s + linesToClear.length * 10);
              
              const isBoardEmpty = finalGrid.every(row => row.every(cell => cell === null));
              if (isBoardEmpty && score > 0) {
                  setRound(r => r + 1);
                  setCurrentImageIndex(i => i + 1);
              }
              
              if (newShapes.every(s => !s)) {
                  const nextImgIndex = isBoardEmpty && score > 0 ? currentImageIndex + 1 : currentImageIndex;
                  generateNewShapes(nextImgIndex);
              } else {
                  // Check game over with remaining shapes and NEW grid state
                  checkGameOver(finalGrid, newShapes);
              }
          }, 250); // 0.25s duration
      } else {
          if (newShapes.every(s => !s)) {
              generateNewShapes(currentImageIndex);
          } else {
              // Check game over with remaining shapes and NEW grid state
              checkGameOver(newGrid, newShapes);
          }
      }
  };

  const findLinesToClear = (currentGrid: (string | null)[][]) => {
      const rowsToClear = currentGrid.map((row, r) => row.every(cell => cell !== null) ? r : -1).filter(r => r !== -1);
      const colsToClear = Array(GRID_SIZE).fill(0).map((_, c) => currentGrid.every(row => row[c] !== null) ? c : -1).filter(c => c !== -1);
      
      const cellsToClear: {r: number, c: number}[] = [];
      
      rowsToClear.forEach(r => {
          for(let c=0; c<GRID_SIZE; c++) cellsToClear.push({r, c});
      });
      colsToClear.forEach(c => {
          for(let r=0; r<GRID_SIZE; r++) cellsToClear.push({r, c});
      });
      
      return cellsToClear.filter((v, i, a) => a.findIndex(t => t.r === v.r && t.c === v.c) === i);
  };

  const clearLinesFromGrid = (currentGrid: (string | null)[][], cellsToClear: {r: number, c: number}[]) => {
      const newGrid = currentGrid.map(row => [...row]);
      cellsToClear.forEach(({r, c}) => {
          newGrid[r][c] = null;
      });
      return newGrid;
  };

  const resetGame = () => {
      setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
      setRound(1);
      setCurrentImageIndex(0);
      generateNewShapes(0);
      setScore(0);
      setGameOver(false);
      setClearingCells([]);
  };

  // Helper for generating random shake intensity
  const getRandomShake = () => ({
      x: [0, 
          Math.random() * 10 - 5, Math.random() * 10 - 5, 
          Math.random() * 10 - 5, Math.random() * 10 - 5, 
          Math.random() * 10 - 5, Math.random() * 10 - 5, 
          Math.random() * 10 - 5, Math.random() * 10 - 5, 
          0],
      y: [0, 
          Math.random() * 10 - 5, Math.random() * 10 - 5, 
          Math.random() * 10 - 5, Math.random() * 10 - 5, 
          Math.random() * 10 - 5, Math.random() * 10 - 5, 
          Math.random() * 10 - 5, Math.random() * 10 - 5, 
          0],
      rotate: [0, Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5, 0]
  });

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[90vw] md:max-w-md mt-2 mx-auto select-none touch-none relative">
        {/* Custom Game Over Overlay */}
        <AnimatePresence>
            {gameOver && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm rounded-xl"
                >
                    <motion.div 
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 20 }}
                        className="bg-black border-2 border-red-500/50 p-6 rounded-lg shadow-2xl flex flex-col items-center gap-4 text-white w-full max-w-sm"
                    >
                        <h2 className="text-4xl font-display text-red-500 animate-pulse text-center">GAME OVER</h2>
                        <img src={skullImg} alt="Game Over" className="w-24 h-24 animate-bounce" />
                        <div className="text-center">
                            <p className="text-2xl font-mono">FINAL SCORE</p>
                            <p className="text-4xl font-bold text-yellow-400">{score}</p>
                        </div>
                        <p className="text-sm opacity-60 text-center font-mono">The blockchain has crashed!</p>
                        
                        <Button 
                            onClick={resetGame} 
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg h-12 mt-2"
                        >
                            RESTART MINTING
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex justify-between w-full items-center px-2">
            <div>
                <h1 className="text-2xl font-display text-primary">VAJ BLAST</h1>
                <div className="text-xs font-mono opacity-70">ROUND {round}</div>
            </div>
            <div className="font-mono text-lg">SCORE: {score}</div>
        </div>

        {/* Grid */}
        <div 
            ref={gridRef}
            className="grid gap-0.5 bg-black/50 p-1.5 rounded-xl border-4 border-white/20 shadow-2xl w-full aspect-square max-w-[320px] relative z-0"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        >
            {grid.map((row, r) => 
                row.map((cell, c) => {
                    const isClearing = clearingCells.some(cell => cell.r === r && cell.c === c);
                    return (
                        <motion.div
                            key={`${r}-${c}`}
                            animate={shakeGrid && cell ? getRandomShake() : {}}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className={`w-full h-full rounded-sm border border-white/5 transition-colors relative ${cell ? 'bg-white' : 'bg-transparent'}`}
                            style={{
                                backgroundImage: cell ? `url(${cell})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        >
                            {/* Explosion Animation Overlay */}
                            <AnimatePresence>
                                {isClearing && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                                        animate={{ 
                                            opacity: [0, 1, 1, 0.8, 0], 
                                            scale: [0.5, 1.5, 2.5, 3, 3.5],
                                            rotate: [0, 45, 90, 180, 270],
                                            backgroundColor: ["#fff", "#ff0000", "#ffff00", "#ff4500", "#fff"]
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        className="absolute inset-0 z-20 rounded-full mix-blend-screen pointer-events-none"
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })
            )}
        </div>

        {/* Shape Selector - Draggable */}
        <div className="flex gap-4 h-32 items-center justify-center w-full relative z-10">
            {currentShapes.map((shape, i) => (
                shape ? (
                    <motion.div
                        key={i}
                        drag
                        dragSnapToOrigin
                        onDragEnd={(e, info) => handleDragEnd(e, info, i)}
                        whileDrag={{ scale: 1.1, zIndex: 100 }}
                        className={`p-3 rounded-lg cursor-grab active:cursor-grabbing transition-colors bg-black/40 hover:bg-black/60`}
                    >
                        <div 
                            className="grid gap-1 pointer-events-none"
                            style={{ 
                                gridTemplateColumns: `repeat(${Math.max(...shape.points.map(p => p[0])) + 1}, 24px)`,
                                gridTemplateRows: `repeat(${Math.max(...shape.points.map(p => p[1])) + 1}, 24px)`
                            }}
                        >
                            {shape.points.map((p, idx) => (
                                <div 
                                    key={idx} 
                                    className="w-6 h-6 bg-white rounded-[2px]"
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
            Drag shapes onto the grid. Clear lines to explode blocks!
        </div>
        
        <Button onClick={resetGame} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            RESET GAME
        </Button>
      </div>
  );
}
