import { Layout } from "@/components/Layout";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

// Import generated assets
import { BLOCK_BLAST_IMAGES } from "@/lib/gameAssets";
import gramsImage from "@assets/grams-400_1766349849850.jpg";

const IMAGES = BLOCK_BLAST_IMAGES;
const GRID_SIZE = 8;

// Define shapes based on official Block Blast mechanics
// 19 unique shape types + their rotations
const SHAPES = [
    // --- SAFETY PRIMITIVES (Patch gaps, keep game alive) ---
    // 1. Single Block (1x1)
    { points: [[0,0]], id: 'dot', weight: 'common', category: 'safety' },
    
    // 2. Domino (1x2) - 2 rotations
    { points: [[0,0], [1,0]], id: 'domino-h', weight: 'common', category: 'safety' },
    { points: [[0,0], [0,1]], id: 'domino-v', weight: 'common', category: 'safety' },
    
    // 4. Triomino Corner (L-3) - 4 rotations
    { points: [[0,0], [0,1], [1,1]], id: 'corner-3-1', weight: 'common', category: 'safety' }, // ⌞
    { points: [[1,0], [1,1], [0,1]], id: 'corner-3-2', weight: 'common', category: 'safety' }, // ⌝
    { points: [[0,0], [1,0], [1,1]], id: 'corner-3-3', weight: 'common', category: 'safety' }, // ⌟
    { points: [[0,0], [1,0], [0,1]], id: 'corner-3-4', weight: 'common', category: 'safety' }, // ⌜
    
    // 18. Diagonal 2 (2 blocks) - 2 types
    { points: [[0,0], [1,1]], id: 'diag-2-1', weight: 'medium', category: 'safety' },
    { points: [[0,1], [1,0]], id: 'diag-2-2', weight: 'medium', category: 'safety' },

    // --- STRUCTURAL BUILDERS (Fill regions, set up clears) ---
    // 3. Triomino Line (1x3) - 2 rotations
    { points: [[0,0], [1,0], [2,0]], id: 'line-3-h', weight: 'common', category: 'structural' },
    { points: [[0,0], [0,1], [0,2]], id: 'line-3-v', weight: 'common', category: 'structural' },

    // 5. Tetris I (1x4) - 2 rotations
    { points: [[0,0], [1,0], [2,0], [3,0]], id: 'line-4-h', weight: 'medium', category: 'structural' },
    { points: [[0,0], [0,1], [0,2], [0,3]], id: 'line-4-v', weight: 'medium', category: 'structural' },
    
    // 6. Tetris O (2x2)
    { points: [[0,0], [1,0], [0,1], [1,1]], id: 'square-2x2', weight: 'medium', category: 'structural' },
    
    // 7. Tetris T - 4 rotations
    { points: [[0,0], [1,0], [2,0], [1,1]], id: 'T-down', weight: 'medium', category: 'structural' },
    { points: [[1,0], [1,1], [1,2], [0,1]], id: 'T-left', weight: 'medium', category: 'structural' },
    { points: [[0,1], [1,1], [2,1], [1,0]], id: 'T-up', weight: 'medium', category: 'structural' },
    { points: [[0,0], [0,1], [0,2], [1,1]], id: 'T-right', weight: 'medium', category: 'structural' },
    
    // 8. Tetris L - 4 rotations
    { points: [[0,0], [0,1], [0,2], [1,2]], id: 'L-1', weight: 'medium', category: 'structural' },
    { points: [[0,0], [1,0], [2,0], [0,1]], id: 'L-2', weight: 'medium', category: 'structural' },
    { points: [[0,0], [1,0], [1,1], [1,2]], id: 'L-3', weight: 'medium', category: 'structural' },
    { points: [[2,0], [2,1], [1,1], [0,1]], id: 'L-4', weight: 'medium', category: 'structural' },
    
    // 9. Tetris J - 4 rotations (mirrored L)
    { points: [[1,0], [1,1], [1,2], [0,2]], id: 'J-1', weight: 'medium', category: 'structural' },
    { points: [[0,0], [0,1], [1,0], [2,0]], id: 'J-2', weight: 'medium', category: 'structural' },
    { points: [[0,0], [0,1], [0,2], [1,0]], id: 'J-3', weight: 'medium', category: 'structural' },
    { points: [[0,1], [1,1], [2,1], [2,0]], id: 'J-4', weight: 'medium', category: 'structural' },
    
    // 10. Tetris S - 2 rotations
    { points: [[0,1], [1,1], [1,0], [2,0]], id: 'S-h', weight: 'medium', category: 'structural' },
    { points: [[0,0], [0,1], [1,1], [1,2]], id: 'S-v', weight: 'medium', category: 'structural' },
    
    // 11. Tetris Z - 2 rotations
    { points: [[0,0], [1,0], [1,1], [2,1]], id: 'Z-h', weight: 'medium', category: 'structural' },
    { points: [[1,0], [1,1], [0,1], [0,2]], id: 'Z-v', weight: 'medium', category: 'structural' },

    // --- SPACE STRESSORS (Consume space, test discipline) ---
    // 12. Line 5 (1x5) - 2 rotations ("Big Three" threat)
    { points: [[0,0], [1,0], [2,0], [3,0], [4,0]], id: 'line-5-h', weight: 'hard', category: 'stressor' },
    { points: [[0,0], [0,1], [0,2], [0,3], [0,4]], id: 'line-5-v', weight: 'hard', category: 'stressor' },
    
    // 13. Square 3x3 ("Big Three" threat)
    { points: [[0,0], [1,0], [2,0], [0,1], [1,1], [2,1], [0,2], [1,2], [2,2]], id: 'square-3x3', weight: 'hard', category: 'stressor' },
];

// Component for handling the amplified drag logic
const DraggableShape = ({ shape, index, setRef, onDrag, onDragEnd, cellSize, gridRef }: any) => {
    const dragX = useMotionValue(0);
    const dragY = useMotionValue(0);
    const [isDragging, setIsDragging] = useState(false);
    
    // Sensitivity & Offset Logic
    // We remove the multiplier (it causes the "wild" feeling).
    // Instead, we rely purely on a generous Y-offset for mobile visibility.
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
    const yOffset = isSmallScreen ? -100 : 0; // Float 100px above finger on mobile
    
    // Visual Transform
    // On mobile, we visually shift the shape UP so the user's finger doesn't cover it.
    // The physics remain 1:1 for perfect control.
    const visualY = useTransform(dragY, (v) => {
        return v + (isDragging ? yOffset : 0);
    });
    
    // We still render the shape, but we wrap it in a larger invisible touch target
    // to make it easier to grab without being precise.

    return (
        <div className="relative w-full h-full flex items-center justify-center touch-none select-none">
            {/* INVISIBLE DRAG PROXY - Larger touch target */}
            <motion.div
                drag
                dragSnapToOrigin
                dragElastic={0.1}
                dragMomentum={false}
                style={{ x: dragX, y: dragY }}
                onDragStart={(e) => {
                    setIsDragging(true);
                    // Haptic feedback
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        try { navigator.vibrate(10); } catch(e) {} 
                    }
                }}
                onDrag={(e, info) => onDrag(e, info, index)}
                onDragEnd={(e, info) => {
                    setIsDragging(false);
                    onDragEnd(e, info, index);
                }}
                className="absolute -inset-4 z-50 cursor-grab active:cursor-grabbing opacity-0 touch-none"
            />
            
            {/* VISUAL SHAPE */}
            <motion.div
                ref={setRef}
                style={{ x: dragX, y: visualY }}
                animate={{ 
                    scale: isDragging ? 1.1 : 0.8, // Start smaller in tray, pop to normal size
                    zIndex: isDragging ? 100 : 10,
                    opacity: isDragging ? 0.9 : 1,
                    filter: isDragging ? 'brightness(1.2) drop-shadow(0 15px 30px rgba(0,0,0,0.4))' : 'none'
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="pointer-events-none rounded-lg"
            >
                <div 
                    className="grid gap-0.5 pointer-events-none"
                    style={{ 
                        gridTemplateColumns: `repeat(${Math.max(...shape.points.map((p:any) => p[0])) + 1}, ${cellSize * 0.6}px)`,
                        gridTemplateRows: `repeat(${Math.max(...shape.points.map((p:any) => p[1])) + 1}, ${cellSize * 0.6}px)`
                    }}
                >
                    {shape.points.map(([x, y]: number[], idx: number) => (
                        <div 
                            key={idx}
                            className="w-full h-full border border-white/10 rounded-sm shadow-sm relative overflow-hidden"
                            style={{ 
                                gridColumn: x + 1, 
                                gridRow: y + 1,
                                backgroundImage: `url(${shape.img})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                filter: shape.filter || 'none'
                            }}
                        >
                             <div 
                                className="absolute inset-0 opacity-60 mix-blend-hard-light"
                                style={{ backgroundColor: shape.color }}
                            />
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

// Helper for random fun colors - UPGRADED PALETTE
const getRandomFunColor = () => {
    const colors = [
        'hsl(330, 100%, 60%)', // Hot Pink
        'hsl(270, 100%, 65%)', // Electric Purple
        'hsl(210, 100%, 60%)', // Bright Blue
        'hsl(180, 100%, 50%)', // Cyan
        'hsl(120, 100%, 45%)', // Lime Green
        'hsl(45, 100%, 55%)',  // Gold/Yellow
        'hsl(15, 100%, 60%)',  // Bright Orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Rainbow Sweep Overlay Component - AMPLIFIED
const RainbowSweep = () => (
    <>
        <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '200%', opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.8, ease: "easeOut" }} // Faster
            className="absolute inset-0 z-40 pointer-events-none rainbow-gradient mix-blend-screen opacity-80 skew-x-12"
        />
        <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '200%', opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }} // Trailing echo
            className="absolute inset-0 z-40 pointer-events-none rainbow-gradient mix-blend-overlay opacity-50 -skew-x-12"
        />
    </>
);

export default function BlockBlast() {
  // GRID STATE NOW STORES OBJECTS { img, color }
  const [grid, setGrid] = useState<({ img: string, color: string, filter?: string } | null)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Round management
  const [round, setRound] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [moveCount, setMoveCount] = useState(0); // Track moves to trigger aggressive assist
  
  // BAG SYSTEM: Track current bag of shapes (Simplified for new logic, primarily used for ensuring variety)
  // We will shift from a "finite bag" to a "weighted generator" as per new logic
  
  // Animation state
  const [clearingCells, setClearingCells] = useState<{r: number, c: number}[]>([]);
  const [shakeGrid, setShakeGrid] = useState(false); // For clears (big shake)
  const [nudgeGrid, setNudgeGrid] = useState(false); // For placements (small shake)
  const [showExplosion, setShowExplosion] = useState(false);
  const [rainbowSweep, setRainbowSweep] = useState(false); // New rainbow sweep state
  
  // Placement preview state
  const [hoverPlacement, setHoverPlacement] = useState<{r: number, c: number, shapeIndex: number} | null>(null);
  
  // Cell size for matching selector to grid
  const [cellSize, setCellSize] = useState(30);

  // Helper to get image for current round (Modified to random picker per shape)
  // const getRoundImage = (index: number) => IMAGES[index % IMAGES.length];
  
  // Shapes state needs to depend on round image
  const [currentShapes, setCurrentShapes] = useState<{points: number[][], id: string, img: string, color: string, filter?: string}[]>([]);
  
  // Grid Ref for drag calculations
  const gridRef = useRef<HTMLDivElement>(null);
  // Refs for shape elements to get their bounding rects during drag
  const shapeRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Ref to track the last valid placement during drag
  const lastValidPlacementRef = useRef<{r: number, c: number, shapeIndex: number} | null>(null);

  // Initialize shapes on mount
  useEffect(() => {
      generateNewShapes(currentImageIndex, grid);
      updateCellSize();
      window.addEventListener('resize', updateCellSize);
      return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  const updateCellSize = () => {
    if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        setCellSize((rect.width - 12) / GRID_SIZE);
    }
  };

  // --- ANALYSIS ENGINE ---
  
  const analyzeBoard = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][]) => {
      let emptyCount = 0;
      let holes = 0; // Isolated 1-cell gaps
      let almostCompleteLines = 0; // Rows/Cols with only 1-2 empty spots
      
      // Basic counts
      for(let r=0; r<GRID_SIZE; r++) {
          let rowEmpty = 0;
          for(let c=0; c<GRID_SIZE; c++) {
              if (!currentGrid[r][c]) {
                  emptyCount++;
                  rowEmpty++;
                  
                  // Check if it's a hole (surrounded by filled cells or edges)
                  let neighbors = 0;
                  if (r>0 && currentGrid[r-1][c]) neighbors++;
                  else if (r===0) neighbors++;
                  
                  if (r<GRID_SIZE-1 && currentGrid[r+1][c]) neighbors++;
                  else if (r===GRID_SIZE-1) neighbors++;
                  
                  if (c>0 && currentGrid[r][c-1]) neighbors++;
                  else if (c===0) neighbors++;
                  
                  if (c<GRID_SIZE-1 && currentGrid[r][c+1]) neighbors++;
                  else if (c===GRID_SIZE-1) neighbors++;
                  
                  if (neighbors === 4) holes++;
              }
          }
          if (rowEmpty > 0 && rowEmpty <= 2) almostCompleteLines++;
      }

      // Check cols for almost complete
      for(let c=0; c<GRID_SIZE; c++) {
          let colEmpty = 0;
          for(let r=0; r<GRID_SIZE; r++) {
              if (!currentGrid[r][c]) colEmpty++;
          }
          if (colEmpty > 0 && colEmpty <= 2) almostCompleteLines++;
      }
      
      return { emptyCount, holes, almostCompleteLines };
  };

  const getDynamicWeights = (metrics: { emptyCount: number, holes: number, almostCompleteLines: number }) => {
      // DEFAULT WEIGHTS (Standard balanced gameplay)
      let weights = {
          safety: 0.15, 
          structural: 0.65, 
          stressor: 0.20
      };

      // 1. Board Health Adjustment (Entropy based)
      if (metrics.emptyCount > 50) {
          // OPEN BOARD: Development Phase
          // PURE STRUCTURE. No small pieces yet.
          weights = { safety: 0.0, structural: 0.85, stressor: 0.15 };
      } else if (metrics.emptyCount < 30) {
          // TIGHTENING: Mid-game tension
          // Reduce stressors, increase safety tools.
          weights = { safety: 0.35, structural: 0.60, stressor: 0.05 };
      } else if (metrics.emptyCount < 15) {
          // CRITICAL: Survival Mode
          // Mostly safety pieces to allow recovery.
          weights = { safety: 0.80, structural: 0.20, stressor: 0.0 };
      }

      // 2. "Swiss Cheese" Factor & Crisis Management
      // If board has many single holes, we NEED 1x1 or 1x2s to fix it.
      // BUT: If the board is very open, don't panic yet. Only panic if we have a lot of holes relative to space.
      if (metrics.holes > 2 || (metrics.holes > 0 && metrics.emptyCount < 45)) {
           // We have holes! Allow safety pieces now.
          weights.safety = Math.max(weights.safety, 0.4);
          weights.structural = Math.max(weights.structural - 0.2, 0.1);
      }
      
      // 3. "Sniper" Opportunity
      // If we have lines ready to clear (almostCompleteLines), slightly boost 1x1/1x2/1x3 availability
      // implicitly by boosting safety/structural.
      if (metrics.almostCompleteLines > 0) {
          weights.safety = Math.max(weights.safety, 0.3);
      }
      
      // Normalize
      const total = weights.safety + weights.structural + weights.stressor;
      weights.safety /= total;
      weights.structural /= total;
      weights.stressor /= total;

      return weights;
  };

  const pickWeightedShape = (weights: { safety: number, structural: number, stressor: number }) => {
      const rand = Math.random();
      let category = 'structural';
      
      if (rand < weights.safety) category = 'safety';
      else if (rand < weights.safety + weights.structural) category = 'structural';
      else category = 'stressor';
      
      const pool = SHAPES.filter(s => s.category === category);
      return pool[Math.floor(Math.random() * pool.length)];
  };

  const simulatePlacement = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][], shape: any, r: number, c: number) => {
      const newGrid = currentGrid.map(row => [...row]);
      shape.points.forEach(([dx, dy]: number[]) => {
          if (r + dy < GRID_SIZE && c + dx < GRID_SIZE) {
               newGrid[r + dy][c + dx] = { 
                   img: shape.img || '', 
                   color: shape.color || '',
                   filter: shape.filter || 'none'
               }; 
          }
      });
      return newGrid;
  };

  const isBatchSolvable = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][], batch: any[]) => {
      const permutations = [
          [0, 1, 2], [0, 2, 1],
          [1, 0, 2], [1, 2, 0],
          [2, 0, 1], [2, 1, 0]
      ];

      for (const perm of permutations) {
          let tempGrid = currentGrid.map(row => [...row]);
          let possible = true;
          
          for (const index of perm) {
              const shape = batch[index];
              const move = findBestMove(tempGrid, shape);
              
              if (move) {
                  tempGrid = simulatePlacement(tempGrid, shape, move.r, move.c);
                  const lines = findLinesToClear(tempGrid);
                  if (lines.length > 0) {
                      tempGrid = clearLinesFromGrid(tempGrid, lines);
                  }
              } else {
                  possible = false;
                  break;
              }
          }
          if (possible) return true;
      }
      return false;
  };

  // --- SMART HELPERS ---
  
  // Helper: Identify which shapes would fit perfectly into "almost complete" lines
  const getHelpfulShapes = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][]) => {
      const helpfulShapeIds = new Set<string>();

      // 1. Scan Rows
      for(let r=0; r<GRID_SIZE; r++) {
          let emptyIndices: number[] = [];
          for(let c=0; c<GRID_SIZE; c++) {
              if (!currentGrid[r][c]) emptyIndices.push(c);
          }

          if (emptyIndices.length === 1) {
              // Single gap -> Dot
              helpfulShapeIds.add('dot');
          } else if (emptyIndices.length === 2) {
              if (emptyIndices[1] === emptyIndices[0] + 1) {
                  // Consecutive -> Horizontal Domino
                  helpfulShapeIds.add('domino-h');
              } else {
                  // Separated -> Dots
                  helpfulShapeIds.add('dot');
              }
          } else if (emptyIndices.length === 3) {
             if (emptyIndices[1] === emptyIndices[0] + 1 && emptyIndices[2] === emptyIndices[1] + 1) {
                  // 3 Consecutive -> Line 3 Horizontal
                  helpfulShapeIds.add('line-3-h');
             }
          }
      }

      // 2. Scan Columns
      for(let c=0; c<GRID_SIZE; c++) {
          let emptyIndices: number[] = [];
          for(let r=0; r<GRID_SIZE; r++) {
              if (!currentGrid[r][c]) emptyIndices.push(r);
          }

          if (emptyIndices.length === 1) {
              // Single gap -> Dot
              helpfulShapeIds.add('dot');
          } else if (emptyIndices.length === 2) {
              if (emptyIndices[1] === emptyIndices[0] + 1) {
                  // Consecutive -> Vertical Domino
                  helpfulShapeIds.add('domino-v');
              } else {
                  // Separated -> Dots
                  helpfulShapeIds.add('dot');
              }
          } else if (emptyIndices.length === 3) {
             if (emptyIndices[1] === emptyIndices[0] + 1 && emptyIndices[2] === emptyIndices[1] + 1) {
                  // 3 Consecutive -> Line 3 Vertical
                  helpfulShapeIds.add('line-3-v');
             }
          }
      }
      
      return Array.from(helpfulShapeIds);
  };

  // --- GENERATOR CORE ---

  function generateNewShapes(imgIndex: number, currentGrid: ({ img: string, color: string, filter?: string } | null)[][], currentMoves: number = 0) {
      // No single image per round anymore
      
      // 1. Analyze Board State
      const metrics = analyzeBoard(currentGrid);
      const weights = getDynamicWeights(metrics);
      
      let finalBatch: any[] = [];
      let attempts = 0;
      let foundValidBatch = false;

      // 0. Try to find a Perfect Clear (All Clear) opportunity
      // If the board is mostly empty (e.g. < 12 blocks), try to find a sequence that clears it all.
      // This directly addresses the user's request to "make it easier to clear the entire board".
      const filledBlocks = GRID_SIZE * GRID_SIZE - metrics.emptyCount;
      if (filledBlocks > 0 && filledBlocks < 25) { // Increased threshold from 12 to 25
          const perfectBatch = findPerfectClearBatch(currentGrid);
          if (perfectBatch) {
              // Found a magic sequence! Use it.
              const formattedShapes = perfectBatch.map((s: any, i: number) => {
                  const isSepia = Math.random() < 0.05;
                  return { 
                      ...s, 
                      img: BLOCK_BLAST_IMAGES[Math.floor(Math.random() * BLOCK_BLAST_IMAGES.length)], 
                      color: isSepia ? 'transparent' : getRandomFunColor(),
                      filter: isSepia ? 'sepia(1)' : 'none',
                      uniqueId: `${s.id}-${Date.now()}-${i}` 
                  };
              });
              setCurrentShapes(formattedShapes);
              return;
          }
      }

      // 0.5. PERMANENT MIRACLE ASSIST
      // We always try to give the user a "Miracle Shape" if one exists that clears lines.
      // This satisfies "assistance at every move" and "spoon feed helpful shapes".
      const miracleShape = findMiracleShape(currentGrid);
      
      if (miracleShape) {
          finalBatch.push(miracleShape);
          
          // Fill the rest with shapes that are solvable
          // We don't filter out complex shapes here, satisfying "do not remove complex shapes"
          // We just ensure they are placed
          
          // WIN FASTER TWEAK: 
          // If we found a miracle shape, we want to follow it up with MORE helpful shapes
          // to chain clears. So we will try to find a SECOND miracle shape or rescue shape.
          
          // Try to find a second high-value shape
          let secondShape = null;
          // Temporarily simulate the miracle shape placement to find the next best move
          const miracleMove = findBestMove(currentGrid, miracleShape);
          if (miracleMove) {
             let tempGrid = simulatePlacement(currentGrid, miracleShape, miracleMove.r, miracleMove.c);
             const lines = findLinesToClear(tempGrid);
             if (lines.length > 0) tempGrid = clearLinesFromGrid(tempGrid, lines);
             secondShape = findMiracleShape(tempGrid) || findBestRescueShape(tempGrid, weights);
          }

          if (secondShape) {
              finalBatch.push(secondShape);
          }

          while(finalBatch.length < 3) {
             // For the filler shape, adhere STRICTLY to the weights.
             // If we are in early game (high empty count), this will force Structural shapes.
             const shape = pickWeightedShape(weights);
             finalBatch.push(shape);
          }

          // Check if this constructed batch is solvable
           if (isBatchSolvable(currentGrid, finalBatch)) {
              foundValidBatch = true;
           } else {
               // Fallback
               finalBatch = [];
           }
      } else {
        // No miracle clear available? Fallback to standard aggressive logic
        if (currentMoves > 2) {
             // ... existing aggressive logic ...
             // Try to find a "Rescue Shape" (best clearer) and guarantee it as the first shape
            const bestRescue = findBestRescueShape(currentGrid, weights);
            if (bestRescue) {
               finalBatch.push(bestRescue);
            }
            
            // Fill the rest with weighted picks, but prioritize safety
            while(finalBatch.length < 3) {
               const shape = pickWeightedShape({ safety: 0.8, structural: 0.2, stressor: 0.0 });
               finalBatch.push(shape);
            }
  
            // Check if this constructed batch is solvable
             if (isBatchSolvable(currentGrid, finalBatch)) {
                foundValidBatch = true;
             } else {
                 finalBatch = [];
             }
        }
      }

      // Try to construct a valid batch (Constrained Sampler)
      // We try up to 20 times to find a batch that is "solvable" (has at least one valid permutation)
      while (!foundValidBatch && attempts < 20) {
          attempts++;
          let batch: any[] = [];

          // Selection Strategy:
          // Shape A: Pure weighted random
          // Shape B: Weighted random, but bias towards different category if possible
          // Shape C: Weighted random

          // Rule: Max 1 Stressor per batch (unless board is super open)
          let stressorCount = 0;
          const helpfulIds = getHelpfulShapes(currentGrid);

          for (let i = 0; i < 3; i++) {
              let shape: any;

              // SMART GENERATOR INJECTION
              // If we have helpful shapes identified, and this is the FIRST shape in the batch,
              // let's try to guarantee a helpful one (50% chance if there are helpful options).
              // This makes the game feel "smart" but not "too easy".
              if (i === 0 && helpfulIds.length > 0 && Math.random() < 0.95) {
                  const targetId = helpfulIds[Math.floor(Math.random() * helpfulIds.length)];
                  const targetShape = SHAPES.find(s => s.id === targetId);
                  shape = targetShape || pickWeightedShape(weights);
              } else {
                  shape = pickWeightedShape(weights);
              }
              
              // Soft Constraint: Diversity
              // If we already picked this ID, try to pick another (50% chance reroll)
              if (batch.some(s => s.id === shape.id) && Math.random() > 0.5) {
                  shape = pickWeightedShape(weights);
              }

              // Hard Constraint: Cap stressors
              if (shape.category === 'stressor') {
                  if (stressorCount >= 1 && metrics.emptyCount < 45) {
                      // Too many stressors for this board state, downgrade to structural
                      const structPool = SHAPES.filter(s => s.category === 'structural');
                      shape = structPool[Math.floor(Math.random() * structPool.length)];
                  } else {
                      stressorCount++;
                  }
              }

              batch.push(shape);
          }

          // Validation: Is this batch solvable?
          // We check if there exists ANY sequence [A,B,C], [A,C,B], etc. that fits on the board.
          const check = isBatchSolvable(currentGrid, batch);
          
          if (check) {
              finalBatch = batch;
              foundValidBatch = true;
          } else {
              // If not solvable, we loop again. 
              // As attempts increase, we implicitly might get luckier or we fall back.
          }
      }

      // FALLBACK: If we couldn't find a solvable batch in 20 tries (rare, but possible on tight boards)
      // We construct a "Safety Batch" guaranteed to help.
      if (!foundValidBatch) {
          // "Panic Mode" Logic
          if (metrics.emptyCount < 10) {
             finalBatch = [SHAPES[0], SHAPES[1], SHAPES[2]]; // Dot, Domino, Corner
          } else {
             // Just give 3 random Safety shapes
             const safetyPool = SHAPES.filter(s => s.category === 'safety');
             finalBatch = [
                 safetyPool[Math.floor(Math.random() * safetyPool.length)],
                 safetyPool[Math.floor(Math.random() * safetyPool.length)],
                 safetyPool[Math.floor(Math.random() * safetyPool.length)]
             ];
          }
      }

      // FINAL SANITY CHECK:
      // Even the fallback batch might not fit if the board is 100% full minus 1 spot.
      // We run the "downgrade to dot" logic on the final selection.
      finalBatch = finalBatch.map(shape => {
          if (canPlaceShapeAnywhere(currentGrid, shape)) return shape;
          if (canPlaceShapeAnywhere(currentGrid, SHAPES[0])) return SHAPES[0]; // 1x1 Dot
          return SHAPES[0]; // Game is likely over, but return dot.
      });

      const formattedShapes = finalBatch.map((s, i) => {
          const isSepia = Math.random() < 0.05;
          return { 
              ...s, 
              img: BLOCK_BLAST_IMAGES[Math.floor(Math.random() * BLOCK_BLAST_IMAGES.length)], 
              color: isSepia ? 'transparent' : getRandomFunColor(), 
              filter: isSepia ? 'sepia(1)' : 'none',
              uniqueId: `${s.id}-${Date.now()}-${i}` 
          };
      });
      
      setCurrentShapes(formattedShapes);
  }


  const countBlocks = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][]) => {
      let count = 0;
      for(let r=0; r<GRID_SIZE; r++) {
          for(let c=0; c<GRID_SIZE; c++) {
              if (currentGrid[r][c]) count++;
          }
      }
      return count;
  };

  // Helper: Try to find a batch that leads to 0 blocks
  const findPerfectClearBatch = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][]) => {
      // Use practically ALL shapes except the massive ones for the perfect search.
      // This ensures we find a "cool" solution if one exists (e.g. clearing with a T-shape).
      const candidates = SHAPES.filter(s => s.category !== 'stressor');
      
      // Try random sequences of 3 shapes
      // INCREASED ITERATIONS to 500 to guarantee finding a solution if it exists
      for(let i=0; i<500; i++) { 
          const s1 = candidates[Math.floor(Math.random() * candidates.length)];
          const s2 = candidates[Math.floor(Math.random() * candidates.length)];
          const s3 = candidates[Math.floor(Math.random() * candidates.length)];
          
          // Simulate s1
          let sim1 = currentGrid.map(row => [...row]);
          const m1 = findBestMove(sim1, s1);
          if (!m1) continue;
          sim1 = simulatePlacement(sim1, s1, m1.r, m1.c);
          const l1 = findLinesToClear(sim1);
          if (l1.length > 0) sim1 = clearLinesFromGrid(sim1, l1);
          if (countBlocks(sim1) === 0) return [s1, s2, s3]; // Found it early!

          // Simulate s2
          const m2 = findBestMove(sim1, s2);
          if (!m2) continue;
          sim1 = simulatePlacement(sim1, s2, m2.r, m2.c);
          const l2 = findLinesToClear(sim1);
          if (l2.length > 0) sim1 = clearLinesFromGrid(sim1, l2);
          if (countBlocks(sim1) === 0) return [s1, s2, s3];

          // Simulate s3
          const m3 = findBestMove(sim1, s3);
          if (!m3) continue;
          sim1 = simulatePlacement(sim1, s3, m3.r, m3.c);
          const l3 = findLinesToClear(sim1);
          if (l3.length > 0) sim1 = clearLinesFromGrid(sim1, l3);
          if (countBlocks(sim1) === 0) return [s1, s2, s3];
      }
      return null;
  };

  // Helper: Find a shape that fits and ideally clears lines
  const findBestRescueShape = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][], weights: any) => {
      // EXPANDED RESCUE POOL:
      // Don't just pick safety shapes. If a big Structural shape fits and clears lines, use it!
      // This makes the "rescue" feel less like "pity mode" and more like "clutch gaming".
      let candidates = SHAPES.filter(s => s.category === 'safety' || s.category === 'structural');
      
      // EARLY GAME FILTER: If board is very open (>45 empty), BAN 1x1 dot and 1x2 domino from Rescue pool too.
      // This prevents "pity" shapes from appearing when we don't really need them.
      const metrics = analyzeBoard(currentGrid);
      if (metrics.emptyCount > 45) {
          candidates = candidates.filter(s => s.id !== 'dot' && !s.id.startsWith('domino'));
      }

      // Shuffle candidates to avoid same rescue piece every time
      candidates.sort(() => Math.random() - 0.5);
      
      let bestShape = null;
      let maxClears = -1;
      let minRemaining = Infinity;
      
      for (const shape of candidates) {
          const move = findBestMove(currentGrid, shape);
          if (move) {
              // It fits!
              if (move.remaining < minRemaining) {
                  minRemaining = move.remaining;
                  bestShape = shape;
              }
              
              if (move.clears > maxClears) {
                  maxClears = move.clears;
                  bestShape = shape;
              }
              // If it clears lines, take it immediately
              // Unless we are super close to full clear
              if (move.clears > 0 && minRemaining > 5) return shape;
              if (minRemaining === 0) return shape; // INSTANT WIN
          }
      }
      return bestShape;
  };
  
  // Helper: Find the ABSOLUTE best shape to clear lines from the entire pool
  const findMiracleShape = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][]) => {
      // Check ALL shapes
      let candidates = [...SHAPES];
      
      // EARLY GAME FILTER: If board is very open (>45 empty), BAN 1x1 dot.
      // This prevents the AI from choosing 'dot' as a miracle shape unless absolutely necessary.
      const metrics = analyzeBoard(currentGrid);
      if (metrics.emptyCount > 45) {
          candidates = candidates.filter(s => s.id !== 'dot');
      }

      // Randomize slightly to avoid same shape spam
      candidates.sort(() => Math.random() - 0.5);
      
      let bestShape = null;
      let maxClears = -1;
      
      for (const shape of candidates) {
          const move = findBestMove(currentGrid, shape);
          if (move) {
              // Priority: Max Clears
              if (move.clears > maxClears) {
                  maxClears = move.clears;
                  bestShape = shape;
              }
          }
      }
      
      // If we found a shape that clears lines, return it.
      // If no shape clears lines, we fallback to finding one that just fits (via existing logic elsewhere)
      return maxClears > 0 ? bestShape : null;
  };

  // Helper: Find best move for a shape (max clears, or just fits)
  const findBestMove = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][], shape: any) => {
      let bestMove = null;
      let maxClears = -1;
      let minRemaining = Infinity;
      
      for(let r=0; r<GRID_SIZE; r++) {
          for(let c=0; c<GRID_SIZE; c++) {
              if (canPlaceShape(r, c, shape, currentGrid)) {
                   // Simulate
                   const simGrid = simulatePlacement(currentGrid, shape, r, c);
                   const lines = findLinesToClear(simGrid);
                   
                   let remaining = 0;
                   if (lines.length > 0) {
                        const clearedGrid = clearLinesFromGrid(simGrid, lines);
                        remaining = countBlocks(clearedGrid);
                   } else {
                        remaining = countBlocks(simGrid);
                   }

                   // Priority 1: Full Board Clear
                   if (remaining === 0) {
                       return { r, c, clears: lines.length, remaining: 0 };
                   }

                   // Priority 2: Maximize Clears
                   if (lines.length > maxClears) {
                       maxClears = lines.length;
                       minRemaining = remaining;
                       bestMove = { r, c, clears: lines.length, remaining };
                   } 
                   // Priority 3: Minimize Remaining Blocks (if same clears)
                   else if (lines.length === maxClears) {
                       if (remaining < minRemaining) {
                           minRemaining = remaining;
                           bestMove = { r, c, clears: lines.length, remaining };
                       }
                   }
              }
          }
      }
      return bestMove;
  };

  const canPlaceShapeAnywhere = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][], shape: any) => {
      for(let r=0; r<GRID_SIZE; r++) {
          for(let c=0; c<GRID_SIZE; c++) {
              if (canPlaceShape(r, c, shape, currentGrid)) return true;
          }
      }
      return false;
  };

  // Check if ANY available shape can fit ANYWHERE on the grid
  const checkGameOver = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][], shapes: any[]) => {
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
  const getPlacementPosition = (shapeIndex: number, shape: any, pointer: {x: number, y: number}) => {
      if (!gridRef.current) return null;
      
      const gridRect = gridRef.current.getBoundingClientRect();
      const isSmallScreen = window.innerWidth < 768;
      
      // OFFSET CONSTANTS
      const SNAP_PREVIEW_OFFSET_Y = isSmallScreen ? 50 : 0; 
      // 3. Grid Padding: The grid has p-1.5 (6px) padding that we must account for
      const GRID_PADDING = 6; 

      // CRITICAL FIX: Use the ACTUAL bounding box of the dragged element
      // This solves the issue where grabbing a shape by its corner/edge causes misalignment
      // because the pointer is not at the visual center.
      let visualCenterX, visualCenterY;
      
      const shapeElement = shapeRefs.current[shapeIndex];
      
      if (shapeElement) {
          // If we have the ref, use the robust method: getBoundingClientRect()
          // This gives the exact visual center on screen, regardless of where the user grabbed it.
          const rect = shapeElement.getBoundingClientRect();
          visualCenterX = rect.left + rect.width / 2;
          // Note: rect.top already includes the drag visual offset (-100px lift)
          visualCenterY = rect.top + rect.height / 2;
      } else {
           // Fallback (should rarely happen if refs are working)
           // If we don't have the ref, assume pointer is center (less accurate)
           const DRAG_Y_OFFSET = isSmallScreen ? -100 : 0;
           visualCenterX = pointer.x;
           visualCenterY = pointer.y + DRAG_Y_OFFSET;
      }
      
      // Search Position: Look slightly BELOW the shape for the target slot
      // This puts the highlight underneath the floating shape so user can see it
      // The shape is floating high, the target slot is low.
      const searchCenterX = visualCenterX;
      // Since visualCenterY is the high floating position, we look 50px below it
      // (which is still 50px above the finger position roughly)
      const searchCenterY = visualCenterY + SNAP_PREVIEW_OFFSET_Y;

      // Calculate Visual Top-Left based on the search center
      // We normalize the size to the GRID CELL SIZE.
      // Even if the shape is visually scaled smaller/larger, we map its center
      // to a theoretical grid-sized shape to find the alignment.
      const shapeW_cells = Math.max(...shape.points.map((p: any) => p[0])) + 1;
      const shapeH_cells = Math.max(...shape.points.map((p: any) => p[1])) + 1;
      const shapeW_px = shapeW_cells * cellSize;
      const shapeH_px = shapeH_cells * cellSize;

      const visualTopLeftX = searchCenterX - (shapeW_px / 2);
      const visualTopLeftY = searchCenterY - (shapeH_px / 2);

      // Convert to grid-relative coordinates
      // We subtract GRID_PADDING to align 0,0 with the top-left of the first cell (inside padding)
      const relativeX = visualTopLeftX - gridRect.left - GRID_PADDING;
      const relativeY = visualTopLeftY - gridRect.top - GRID_PADDING;

      let bestPlacement = null;
      let minDistance = Infinity;
      
      // Magnetic Snap Threshold - Increased for mobile forgiveness
      const SNAP_THRESHOLD = cellSize * 1.5;

      for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
              if (canPlaceShape(r, c, shape, grid)) {
                  // Where would this shape start in pixels (relative to inner grid content)?
                  // We approximate grid positions using cellSize which includes gap share
                  const targetX = c * cellSize;
                  const targetY = r * cellSize;
                  
                  // Distance between search position and this candidate target
                  const dist = Math.hypot(targetX - relativeX, targetY - relativeY);
                  
                  if (dist < minDistance && dist < SNAP_THRESHOLD) {
                      minDistance = dist;
                      bestPlacement = { r, c };
                  }
              }
          }
      }

      return bestPlacement;
  };

  const handleDrag = (event: any, info: any, shapeIndex: number) => {
      if (gameOver) return;
      const shape = currentShapes[shapeIndex];
      if (!shape) return;

      // Use the global pointer position from the drag event
      const placement = getPlacementPosition(shapeIndex, shape, info.point);
      
      if (placement) {
          const newPlacement = { ...placement, shapeIndex };
          setHoverPlacement(newPlacement);
          lastValidPlacementRef.current = newPlacement;
      } else {
          setHoverPlacement(null);
          lastValidPlacementRef.current = null;
      }
  };

  const handleDragEnd = (event: any, info: any, shapeIndex: number) => {
    setHoverPlacement(null);
    if (!gridRef.current || gameOver) return;

    const shape = currentShapes[shapeIndex];
    if (!shape) return;

    // Use the last valid placement found during drag
    // This is much more reliable than recalculating on dragEnd where the element might have shifted
    const placement = lastValidPlacementRef.current;
    
    // Clear the ref for next time
    lastValidPlacementRef.current = null;

    // Verify the placement belongs to this shape (sanity check)
    if (placement && placement.shapeIndex === shapeIndex) {
        // Trigger small nudge on placement
        setNudgeGrid(true);
        setTimeout(() => setNudgeGrid(false), 200);

        placeShape(placement.r, placement.c, shape, shapeIndex);
    }
  };

  const canPlaceShape = (r: number, c: number, shape: any, currentGrid: ({ img: string, color: string, filter?: string } | null)[][]) => {
      return shape.points.every(([dx, dy]: number[]) => {
          const nr = r + dy;
          const nc = c + dx;
          return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !currentGrid[nr][nc];
      });
  };

  const placeShape = (r: number, c: number, shape: any, shapeIndex: number) => {
      const newGrid = grid.map(row => [...row]);
      shape.points.forEach(([dx, dy]: number[]) => {
          newGrid[r + dy][c + dx] = { 
              img: shape.img, 
              color: shape.color,
              filter: shape.filter || 'none'
          };
      });
      setGrid(newGrid);

      const newShapes = [...currentShapes];
      newShapes[shapeIndex] = null as any; 
      setCurrentShapes(newShapes);

      const linesToClear = findLinesToClear(newGrid);

      if (linesToClear.length > 0) {
          setClearingCells(linesToClear);
          setShakeGrid(true); // Trigger grid shake
          setRainbowSweep(true); // Trigger rainbow sweep
          
          // Haptic feedback (Android only)
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try { navigator.vibrate([50, 50, 50]); } catch(e) {}
          }
          
          setTimeout(() => {
              setShakeGrid(false); // Stop shake
              setRainbowSweep(false);
              const finalGrid = clearLinesFromGrid(newGrid, linesToClear);
              setGrid(finalGrid);
              setClearingCells([]);
              setScore(s => s + linesToClear.length * 10);
              
              const isBoardEmpty = finalGrid.every(row => row.every(cell => cell === null));
              
              if (isBoardEmpty && score > 0) {
                  // PERFECT CLEAR / WIN STATE
                  setRound(r => r + 1);
                  setCurrentImageIndex(i => i + 1);
                  
                  // Trigger explosion
                  setShowExplosion(true);
                  setTimeout(() => setShowExplosion(false), 2500);

                  // DISCARD OLD SHAPES & GENERATE FRESH BATCH immediately
                  // We ignore whatever was left in 'newShapes'
                  generateNewShapes(currentImageIndex + 1, finalGrid);
              } else {
                  // Standard flow
                  if (newShapes.every(s => !s)) {
                      generateNewShapes(currentImageIndex, finalGrid);
                  } else {
                      // Check game over with remaining shapes and NEW grid state
                      checkGameOver(finalGrid, newShapes);
                  }
              }
          }, 250); // 0.25s duration
      } else {
          // Standard place feedback (no sound needed per user request)
          if (newShapes.every(s => !s)) {
              generateNewShapes(currentImageIndex, newGrid);
          } else {
              // Check game over with remaining shapes and NEW grid state
              checkGameOver(newGrid, newShapes);
          }
      }
  };

  const findLinesToClear = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][]) => {
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

  const clearLinesFromGrid = (currentGrid: ({ img: string, color: string, filter?: string } | null)[][], cellsToClear: {r: number, c: number}[]) => {
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
      generateNewShapes(0, Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
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
        <style>{`
            /* DESKTOP ONLY OVERRIDES */
            @media (min-width: 768px) {
                .desktop-grid-wrapper {
                    align-items: flex-start !important; /* Anchor to top instead of center */
                    padding-top: 20px;
                }
                .desktop-grid {
                    /* Reduce grid to 90% of its calculated size */
                    width: calc(min(100%, 100vh - 180px) * 0.9) !important;
                    /* Ensure it stays square */
                    aspect-ratio: 1/1 !important;
                }
            }
        `}</style>

        {/* Explosion Overlay */}
        <AnimatePresence>
            {showExplosion && (
                <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
                    {/* Background Flash */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: [0, 0.8, 0] }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-white mix-blend-overlay"
                    />
                    
                    {/* Shockwave */}
                     <motion.div 
                        initial={{ scale: 0, opacity: 1, borderWidth: "50px" }} 
                        animate={{ scale: 3, opacity: 0, borderWidth: "0px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-64 h-64 rounded-full border-white absolute"
                    />

                    {/* Text */}
                    <motion.div
                         initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                         animate={{ scale: [0.5, 1.2, 1], opacity: 1, rotate: 0 }}
                         exit={{ scale: 1.5, opacity: 0 }}
                         transition={{ duration: 0.5, type: "spring" }}
                         className="relative z-10 flex flex-col items-center drop-shadow-2xl"
                    >
                         <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-tighter"
                             style={{ WebkitTextStroke: "3px black" }}>
                             BLASTED!
                         </h1>
                    </motion.div>

                    {/* Particles */}
                    {[...Array(30)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: 0, y: 0, scale: 0 }}
                            animate={{ 
                                x: (Math.random() - 0.5) * window.innerWidth, 
                                y: (Math.random() - 0.5) * window.innerHeight, 
                                scale: [0, Math.random() + 0.5, 0],
                                rotate: Math.random() * 720
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute w-12 h-12 bg-contain bg-center bg-no-repeat"
                            style={{ 
                                backgroundImage: `url(${BLOCK_BLAST_IMAGES[Math.floor(Math.random() * BLOCK_BLAST_IMAGES.length)]})` 
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>

        {/* Custom Game Over Overlay */}
        <AnimatePresence>
            {gameOver && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"
                >
                    <motion.div 
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 20 }}
                        className="bg-black/80 border-2 border-[#FF10F0] p-4 rounded-xl shadow-2xl flex flex-col items-center gap-2 text-white w-full max-w-xs backdrop-blur-md"
                    >
                        <h2 className="text-5xl font-display text-[#FF10F0] animate-pulse text-center drop-shadow-[0_4px_0_rgba(0,0,0,1)] leading-none mt-2"
                            style={{ WebkitTextStroke: "2px black" }}>
                            GAME OVER
                        </h2>
                        <div className="relative w-32 h-32 animate-bounce overflow-hidden rounded-full border-4 border-white/20 shadow-2xl my-2">
                            <img 
                                src={gramsImage} 
                                alt="Game Over" 
                                className="w-full h-full object-cover"
                            />
                            {/* Animated Tears - Adjusted Alignment & Removed Tint */}
                            {/* Left Eye Tear */}
                            <motion.div
                                initial={{ top: '42%', left: '32%', opacity: 0, scale: 0 }}
                                animate={{ top: ['42%', '90%'], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2, ease: "easeIn" }}
                                className="absolute w-2 h-3 bg-cyan-300 rounded-full drop-shadow-[0_0_2px_rgba(0,255,255,0.8)] z-10"
                            />
                            {/* Right Eye Tear */}
                            <motion.div
                                initial={{ top: '42%', right: '32%', opacity: 0, scale: 0 }}
                                animate={{ top: ['42%', '90%'], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.2, delay: 0.5, ease: "easeIn" }}
                                className="absolute w-2 h-3 bg-cyan-300 rounded-full drop-shadow-[0_0_2px_rgba(0,255,255,0.8)] z-10"
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-mono">FINAL SCORE</p>
                            <p className="text-4xl font-bold text-[#7FFF00]">{score}</p>
                        </div>
                        
                        <Button 
                            onClick={resetGame} 
                            className="w-full bg-[#FF10F0] hover:bg-[#D000C0] text-[#7FFF00] border border-[#7FFF00] font-bold text-lg h-12 mt-4"
                        >
                            NEW VAJ BLAST
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Score Display */}
        <div className="w-full flex items-center justify-center py-0.5 mt-2 relative z-10">
             <div className="bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 shadow-xl flex flex-col items-center transform hover:scale-105 transition-transform scale-90">
                <div className="text-[9px] font-mono text-[#FF10F0] tracking-widest mb-0">SCORE</div>
                <div className="text-2xl font-['Chewy','cursive'] text-[#7FFF00] drop-shadow-[0_2px_10px_rgba(127,255,0,0.3)] tabular-nums leading-none tracking-wider">
                    {score}
                </div>
            </div>
        </div>

        {/* Grid Area - Maximize Size */}
        <div className="flex-1 flex items-center justify-center w-full min-h-0 my-0.5 px-4 relative desktop-grid-wrapper">
            <motion.div 
                ref={gridRef}
                animate={{ 
                    x: shakeGrid ? [0, -4, 4, -4, 4, 0] : (nudgeGrid ? [0, -2, 2, 0] : 0),
                    y: shakeGrid ? [0, 4, -4, 4, -4, 0] : (nudgeGrid ? [0, 2, -2, 0] : 0),
                    scale: shakeGrid ? [1, 1.02, 1] : (nudgeGrid ? [1, 1.005, 1] : 1),
                }}
                transition={{ duration: shakeGrid ? 0.3 : 0.15, ease: "easeInOut" }}
                className="grid gap-0.5 bg-black/80 p-1.5 rounded-xl border-4 border-white/20 shadow-2xl relative z-0 backdrop-blur-md chrome-grid overflow-hidden desktop-grid"
                style={{ 
                    aspectRatio: '1/1',
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                    width: 'min(100%, 100vh - 180px)', // Constrain width based on available height
                    height: 'auto', // Let aspect ratio drive height based on width
                    maxWidth: '100%',
                    maxHeight: '100%'
                }}
            >
                {/* Rainbow Sweep Overlay */}
                <AnimatePresence>
                    {rainbowSweep && <RainbowSweep />}
                </AnimatePresence>

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
                                      'bg-white/20 border-white/40'}`}
                                style={{
                                    backgroundImage: cell ? `url(${cell.img})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    filter: cell?.filter || 'none'
                                }}
                            >
                                {cell && (
                                    <div 
                                        className="absolute inset-0 opacity-60 mix-blend-hard-light"
                                        style={{ backgroundColor: cell.color }}
                                    />
                                )}
                                
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
            </motion.div>
        </div>

        {/* Shape Selector - Draggable */}
        <div className="flex gap-4 h-[100px] items-center justify-evenly w-full relative z-10 px-2 overflow-visible shrink-0 mb-4">
            {currentShapes.map((shape, i) => (
                shape ? (
                    <DraggableShape
                        key={i}
                        shape={shape}
                        index={i}
                        setRef={(el: any) => { shapeRefs.current[i] = el; }}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        cellSize={cellSize}
                        gridRef={gridRef}
                    />
                ) : <div key={i} className="w-12 h-12" />
            ))}
        </div>
      </div>
  );
}