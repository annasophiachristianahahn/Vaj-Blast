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
  
  // Placement preview state
  const [hoverPlacement, setHoverPlacement] = useState<{r: number, c: number, shapeIndex: number} | null>(null);
  
  // Cell size for matching selector to grid
  const [cellSize, setCellSize] = useState(30);

  // Helper to get image for current round
  const getRoundImage = (index: number) => IMAGES[index % IMAGES.length];
  
  // Shapes state needs to depend on round image
  const [currentShapes, setCurrentShapes] = useState<{points: number[][], id: string, img: string}[]>([]);
  
  // Grid Ref for drag calculations
  const gridRef = useRef<HTMLDivElement>(null);
  // Refs for shape elements to get their bounding rects during drag
  const shapeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize shapes on mount
  useEffect(() => {
      generateNewShapes(currentImageIndex);
      updateCellSize();
      window.addEventListener('resize', updateCellSize);
      return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  const updateCellSize = () => {
    if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        // Width includes padding (p-1.5 = 6px total horizontal) and gaps (0.5 * 7 = 3.5px)
        // Roughly rect.width / GRID_SIZE
        setCellSize((rect.width - 12) / GRID_SIZE);
    }
  };

  function generateNewShapes(imgIndex: number) {
      const img = getRoundImage(imgIndex);
      const newShapes = [];
      
      // Try to be helpful!
      const playableShapes = SHAPES.filter(s => {
          // Check if this shape can be placed ANYWHERE
          for (let r = 0; r < GRID_SIZE; r++) {
              for (let c = 0; c < GRID_SIZE; c++) {
                  if (canPlaceShape(r, c, s, grid)) return true;
              }
          }
          return false;
      });

      // If board is very full (few playable shapes), prioritize small shapes
      const isTightBoard = playableShapes.length < SHAPES.length * 0.7;
      
      // Calculate board fullness
      let filledCells = 0;
      grid.forEach(row => row.forEach(cell => { if(cell) filledCells++; }));
      const isVeryFull = filledCells > (GRID_SIZE * GRID_SIZE * 0.5); // Lower threshold for "full" (50%)

      for (let i = 0; i < 3; i++) {
          let selectedShape;

          // ULTRA EASY MODE LOGIC:
          // 1. If board is getting full (>50%), 50% chance for a single dot (the ultimate savior)
          if (isVeryFull && Math.random() < 0.5) {
              selectedShape = SHAPES[0]; // dot
          }
          // 2. If board is tight (few moves left), ALWAYS pick a shape that fits if possible
          else if (isTightBoard) {
               if (playableShapes.length > 0) {
                   // 100% chance to pick a playable shape
                   selectedShape = playableShapes[Math.floor(Math.random() * playableShapes.length)];
               } else {
                   // Fallback: Pick the smallest shapes (dot, 1x2, 2x1)
                   selectedShape = SHAPES[Math.floor(Math.random() * 3)];
               }
          } 
          // 3. Normal play: 1/8 chance (12.5%) for a single dot
          else if (Math.random() < 0.125) {
              selectedShape = SHAPES[0]; // dot
          }
          // 4. Otherwise random
          else {
              selectedShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
          }

          newShapes.push({ ...selectedShape, img });
      }
      
      setCurrentShapes(newShapes);
      // We need to wait for state update or pass newShapes directly
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

  // Shared logic to determine placement position
  const getPlacementPosition = (shapeIndex: number, shape: any) => {
      if (!gridRef.current || !shapeRefs.current[shapeIndex]) return null;

      const gridRect = gridRef.current.getBoundingClientRect();
      const shapeRect = shapeRefs.current[shapeIndex]!.getBoundingClientRect();

      const cellWidth = gridRect.width / GRID_SIZE;
      const cellHeight = gridRect.height / GRID_SIZE;
      
      // Calculate relative position of the shape's top-left corner
      // We use the shape's actual DOM position, which is accurate regardless of where user grabbed it
      const relativeX = shapeRect.left - gridRect.left;
      const relativeY = shapeRect.top - gridRect.top;
      
      // Calculate the floating point grid coordinates of the top-left corner
      const floatC = relativeX / cellWidth;
      const floatR = relativeY / cellHeight;

      // Round to nearest integer to find the "ideal" snap target
      // This works perfectly because if visual shape aligns with grid, relativeX will be a multiple of cellWidth
      const idealC = Math.round(floatC);
      const idealR = Math.round(floatR);
      
      // Check if this ideal spot is valid
      if (canPlaceShape(idealR, idealC, shape, grid)) {
          return { r: idealR, c: idealC };
      }
      
      // If ideal spot isn't valid, check immediate neighbors sorted by distance
      // We check the 8 surrounding cells, but prioritize those closest to the floating floatR/floatC
      const neighbors = [
          { r: idealR, c: idealC }, // Center (already checked but included for completeness logic)
          { r: idealR, c: idealC + 1 },
          { r: idealR, c: idealC - 1 },
          { r: idealR + 1, c: idealC },
          { r: idealR - 1, c: idealC },
          { r: idealR + 1, c: idealC + 1 },
          { r: idealR + 1, c: idealC - 1 },
          { r: idealR - 1, c: idealC + 1 },
          { r: idealR - 1, c: idealC - 1 },
      ];

      // Sort by distance to the "true" floating position
      neighbors.sort((a, b) => {
          const distA = Math.hypot(a.c - floatC, a.r - floatR);
          const distB = Math.hypot(b.c - floatC, b.r - floatR);
          return distA - distB;
      });

      // Find first valid placement within a reasonable "snap radius"
      // If the user is too far off (e.g. > 0.6 cells away), don't snap to a neighbor
      for (const p of neighbors) {
          const dist = Math.hypot(p.c - floatC, p.r - floatR);
          if (dist > 0.6) continue; // Tighter threshold for better precision

          if (canPlaceShape(p.r, p.c, shape, grid)) {
              return { r: p.r, c: p.c };
          }
      }

      return null;
  };

  const handleDrag = (event: any, info: any, shapeIndex: number) => {
      if (gameOver) return;
      const shape = currentShapes[shapeIndex];
      if (!shape) return;

      const placement = getPlacementPosition(shapeIndex, shape);
      if (placement) {
          setHoverPlacement({ ...placement, shapeIndex });
      } else {
          setHoverPlacement(null);
      }
  };

  const handleDragEnd = (event: any, info: any, shapeIndex: number) => {
    setHoverPlacement(null);
    if (!gridRef.current || gameOver) return;

    const shape = currentShapes[shapeIndex];
    if (!shape) return;

    const placement = getPlacementPosition(shapeIndex, shape);
    
    if (placement) {
        placeShape(placement.r, placement.c, shape, shapeIndex);
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
    <div className="flex flex-col items-center justify-between h-full w-full max-w-lg mx-auto select-none touch-none relative px-2 pb-2">
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

        {/* Grid Area - Maximize Size */}
        <div className="flex-1 flex items-center justify-center w-full min-h-0 my-2 px-4 relative">
            <div 
                ref={gridRef}
                className="grid gap-0.5 bg-black/80 p-1.5 rounded-xl border-4 border-white/20 shadow-2xl aspect-square max-w-full max-h-full relative z-0 backdrop-blur-md"
                style={{ 
                    gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                    width: 'min(100%, 100vh - 160px)'
                }}
            >
                {/* Score Overlay */}
                <div className="absolute top-2 right-2 z-20 flex flex-col items-end pointer-events-none mix-blend-difference">
                    <div className="text-[10px] font-mono text-white/80 leading-none mb-1">SCORE</div>
                    <div className="text-xl font-display text-yellow-400 tracking-wider leading-none">{score}</div>
                </div>

                {grid.map((row, r) => 
                    row.map((cell, c) => {
                        const isClearing = clearingCells.some(cell => cell.r === r && cell.c === c);
                        
                        // Check if this cell is part of the ghost preview
                        let isGhost = false;
                        if (hoverPlacement && !cell) {
                            const shape = currentShapes[hoverPlacement.shapeIndex];
                            if (shape) {
                                isGhost = shape.points.some(([dx, dy]: number[]) => 
                                    hoverPlacement.r + dy === r && hoverPlacement.c + dx === c
                                );
                            }
                        }

                        return (
                            <motion.div
                                key={`${r}-${c}`}
                                animate={shakeGrid && cell ? getRandomShake() : { x: 0, y: 0, rotate: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className={`w-full h-full rounded-sm border transition-colors relative 
                                    ${cell ? 'bg-white border-white/5' : 
                                      isGhost ? 'bg-green-500/60 border-2 border-green-400 animate-pulse z-10' : 
                                      'bg-white/10 border-white/20'}`}
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
        </div>

        {/* Shape Selector - Draggable */}
        <div className="flex gap-4 h-[100px] items-center justify-evenly w-full relative z-10 px-2 overflow-visible shrink-0 mb-4">
            {currentShapes.map((shape, i) => (
                shape ? (
                    <motion.div
                        key={i}
                        ref={el => { shapeRefs.current[i] = el; }}
                        drag
                        dragSnapToOrigin
                        onDrag={(e, info) => handleDrag(e, info, i)}
                        onDragEnd={(e, info) => handleDragEnd(e, info, i)}
                        whileDrag={{ scale: 1.5, zIndex: 100, opacity: 0.9 }} 
                        whileHover={{ scale: 1.05 }}
                        className={`p-1 rounded-lg cursor-grab active:cursor-grabbing transition-colors`}
                    >
                        <div 
                            className="grid gap-0.5 pointer-events-none"
                            style={{ 
                                // Use 65% of cell size for selector to make them visible but not huge
                                gridTemplateColumns: `repeat(${Math.max(...shape.points.map(p => p[0])) + 1}, ${cellSize * 0.65}px)`,
                                gridTemplateRows: `repeat(${Math.max(...shape.points.map(p => p[1])) + 1}, ${cellSize * 0.65}px)`
                            }}
                        >
                            {shape.points.map((p, idx) => (
                                <div 
                                    key={idx} 
                                    className="w-full h-full bg-white rounded-sm"
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
                ) : <div key={i} className="w-12 h-12" />
            ))}
        </div>
      </div>
  );
}
