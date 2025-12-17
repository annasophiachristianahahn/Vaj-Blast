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
    
    // 14. Rectangle 2x3 - 2 rotations
    { points: [[0,0], [1,0], [2,0], [0,1], [1,1], [2,1]], id: 'rect-2x3-h', weight: 'hard', category: 'stressor' },
    { points: [[0,0], [0,1], [0,2], [1,0], [1,1], [1,2]], id: 'rect-2x3-v', weight: 'hard', category: 'stressor' },

    // 15. Big L (3x3 bounds) - 4 rotations ("Big Three" threat)
    { points: [[0,0], [0,1], [0,2], [1,2], [2,2]], id: 'big-L-1', weight: 'hard', category: 'stressor' }, // ⌞
    { points: [[0,0], [1,0], [2,0], [0,1], [0,2]], id: 'big-L-2', weight: 'hard', category: 'stressor' }, // ⌜
    { points: [[0,0], [1,0], [2,0], [2,1], [2,2]], id: 'big-L-3', weight: 'hard', category: 'stressor' }, // ⌝
    { points: [[2,0], [2,1], [2,2], [1,0], [0,0]], id: 'big-L-4', weight: 'hard', category: 'stressor' }, // ⌟
    
    // 16. Plus Shape (3x3 bounds)
    { points: [[1,0], [0,1], [1,1], [2,1], [1,2]], id: 'plus', weight: 'hard', category: 'stressor' },
    
    // 17. U-Shape (3x2 bounds) - 4 rotations
    { points: [[0,0], [2,0], [0,1], [1,1], [2,1]], id: 'U-up', weight: 'hard', category: 'stressor' },
    { points: [[0,0], [0,1], [1,0], [2,0], [2,1]], id: 'U-down', weight: 'hard', category: 'stressor' },
    { points: [[0,0], [0,1], [0,2], [1,0], [1,2]], id: 'U-left', weight: 'hard', category: 'stressor' },
    { points: [[1,0], [1,1], [1,2], [0,0], [0,2]], id: 'U-right', weight: 'hard', category: 'stressor' },
    
    // 19. Diagonal 3 (3 blocks) - 2 types
    { points: [[0,0], [1,1], [2,2]], id: 'diag-3-1', weight: 'hard', category: 'stressor' },
    { points: [[0,2], [1,1], [2,0]], id: 'diag-3-2', weight: 'hard', category: 'stressor' },
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
  
  // BAG SYSTEM: Track current bag of shapes (Simplified for new logic, primarily used for ensuring variety)
  // We will shift from a "finite bag" to a "weighted generator" as per new logic
  
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
  
  const analyzeBoard = (currentGrid: (string | null)[][]) => {
      let emptyCount = 0;
      let holes = 0; // Isolated 1-cell gaps
      
      // Basic counts
      for(let r=0; r<GRID_SIZE; r++) {
          for(let c=0; c<GRID_SIZE; c++) {
              if (!currentGrid[r][c]) {
                  emptyCount++;
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
      }
      
      return { emptyCount, holes };
  };

  const getDynamicWeights = (metrics: { emptyCount: number, holes: number }) => {
      // DEFAULT WEIGHTS (Standard balanced gameplay)
      let weights = {
          safety: 0.1, // Drastically reduced to prevent "filler" feeling
          structural: 0.8, // Focus on Tetris-like shapes
          stressor: 0.1
      };

      // CONTEXTUAL ADJUSTMENTS
      if (metrics.emptyCount > 55) {
          // Early Game: Almost purely structural
          weights = { safety: 0.05, structural: 0.85, stressor: 0.1 };
      } else if (metrics.emptyCount < 30) {
          // Board Tightening: Introduce safety, but don't flood it
          weights = { safety: 0.3, structural: 0.65, stressor: 0.05 };
      } else if (metrics.emptyCount < 15) {
          // Critical: Now we need safety
          weights = { safety: 0.8, structural: 0.2, stressor: 0.0 };
      } else if (metrics.holes > 5) { // Increased threshold for "Swiss Cheese"
          // Fragmented: Needs patching
          weights.safety += 0.3;
          weights.stressor = 0;
      }
      
      return weights;
  };

  const pickWeightedShape = (weights: { safety: number, structural: number, stressor: number }) => {
      const rand = Math.random();
      let category = 'structural';
      
      // Normalize weights
      const total = weights.safety + weights.structural + weights.stressor;
      const wS = weights.safety / total;
      const wSt = weights.structural / total;
      
      if (rand < wS) category = 'safety';
      else if (rand < wS + wSt) category = 'structural';
      else category = 'stressor';
      
      // Filter shapes by category
      const pool = SHAPES.filter(s => s.category === category);
      return pool[Math.floor(Math.random() * pool.length)];
  };

  // Check if there is ANY valid sequence to place these 3 shapes
  const isBatchSolvable = (currentGrid: (string | null)[][], shapes: any[]) => {
      // This function is now deprecated in favor of the integrated check in generateNewShapes
      // Keeping it as a dummy or for potential external checks
      if (shapes.length === 0) return true;
      const permutations = getPermutations(shapes);
      for (const perm of permutations) {
          const result = canSolveSequence(currentGrid, perm);
          if (result.solvable) return true;
      }
      return false;
  };

  const getPermutations = (arr: any[]): any[][] => {
      if (arr.length === 0) return [[]];
      const firstEl = arr[0];
      const rest = arr.slice(1);
      const permsWithoutFirst = getPermutations(rest);
      const allPerms: any[][] = [];
      
      permsWithoutFirst.forEach((perm) => {
          for (let i = 0; i <= perm.length; i++) {
              const start = perm.slice(0, i);
              const end = perm.slice(i);
              allPerms.push([...start, firstEl, ...end]);
          }
      });
      return allPerms;
  };

  // Depth-first search to see if a sequence of shapes can be placed
  // Returns { solvable: boolean, maxClears: number }
  const canSolveSequence = (currentGrid: (string | null)[][], sequence: any[]): { solvable: boolean, maxClears: number } => {
      if (sequence.length === 0) return { solvable: true, maxClears: 0 };
      
      const [head, ...tail] = sequence;
      
      // Find all valid placements for 'head'
      const validMoves: {r: number, c: number}[] = [];
      for(let r=0; r<GRID_SIZE; r++) {
          for(let c=0; c<GRID_SIZE; c++) {
              if (canPlaceShape(r, c, head, currentGrid)) {
                  validMoves.push({r, c});
                  // Optimization: If board is very open, we don't need to check ALL valid moves.
                  if (validMoves.length > 5) break; 
              }
          }
          if (validMoves.length > 5) break;
      }
      
      if (validMoves.length === 0) return { solvable: false, maxClears: 0 };
      
      let bestResult = { solvable: false, maxClears: 0 };

      // For each valid move, simulate and recurse
      for (const move of validMoves) {
          // Simulate placement
          const nextGrid = simulatePlacement(currentGrid, head, move.r, move.c);
          
          // Check if lines cleared (crucial! clearing makes room)
          const lines = findLinesToClear(nextGrid);
          const currentClears = lines.length;
          const gridAfterClear = lines.length > 0 ? clearLinesFromGrid(nextGrid, lines) : nextGrid;
          
          const result = canSolveSequence(gridAfterClear, tail);
          
          if (result.solvable) {
              const totalClears = currentClears + result.maxClears;
              if (totalClears > bestResult.maxClears) {
                  bestResult = { solvable: true, maxClears: totalClears };
              }
              // If we found a solvable path, mark as solvable (but keep searching for better clears)
              bestResult.solvable = true;
          }
      }
      
      return bestResult;
  };

  const simulatePlacement = (currentGrid: (string | null)[][], shape: any, r: number, c: number) => {
      // Deep copy grid
      const newGrid = currentGrid.map(row => [...row]);
      shape.points.forEach(([dx, dy]: number[]) => {
          newGrid[r + dy][c + dx] = 'placeholder'; // Use dummy value
      });
      return newGrid;
  };

  function generateNewShapes(imgIndex: number, currentGrid: (string | null)[][]) {
      const img = getRoundImage(imgIndex);
      
      // 1. Analyze Board
      const metrics = analyzeBoard(currentGrid);
      const totalBlocks = countBlocks(currentGrid);
      const weights = getDynamicWeights(metrics);
      
      // 2. ENDGAME PROTOCOL (The "Full Clear" Assistant)
      // If the board is nearly empty (< 10 blocks), we STOP random generation
      // and actively give the player the exact tools to finish the job.
      if (totalBlocks > 0 && totalBlocks < 10) {
           let endgameBatch: any[] = [];
           // Strategy: Give mostly 1x1s and small pieces to let user snipe the last blocks
           // OR find a perfect sequence if possible.
           
           // Try to find a perfect clear sequence first
           const perfectBatch = findPerfectClearBatch(currentGrid);
           
           if (perfectBatch) {
               endgameBatch = perfectBatch;
           } else {
               // Fallback: Give a mix of small pieces, but not just dots.
               // 40% Dot, 40% Domino, 20% Corner
               for(let i=0; i<3; i++) {
                   const r = Math.random();
                   if (r < 0.4) endgameBatch.push(SHAPES.find(s => s.id === 'dot'));
                   else if (r < 0.8) endgameBatch.push(SHAPES.find(s => s.id === 'domino-h') || SHAPES.find(s => s.id === 'domino-v'));
                   else endgameBatch.push(SHAPES.find(s => s.id.startsWith('corner-3')));
               }
           }
           
           // Apply and return early
           const finalShapes = endgameBatch.map((s, i) => ({ 
               ...s, 
               img: getRoundImage(imgIndex), 
               uniqueId: `${s.id}-${Date.now()}-${i}` 
           }));
           setCurrentShapes(finalShapes);
           return;
      }

      // 3. CONSTRUCTIVE GENERATION (Standard Play)
      // Instead of guessing a batch, we build one that is guaranteed to work
      // and biases towards clearing lines if the board is tight.
      
      let bestBatch: any[] = [];
      
      // Attempt to build a batch 5 times, keep the one with best score
      let bestBatchScore = -1;
      
      for(let attempt=0; attempt<5; attempt++) {
          let currentBatch: any[] = [];
          // Clone grid for simulation
          let simGrid = currentGrid.map(row => [...row]);
          let batchScore = 0;
          
          // Pick 3 shapes sequentially
          for(let i=0; i<3; i++) {
              // Contextual Selection
              let candidateShape;
              
              // RESCUE MODE: If board is tight (<25 empty) or fragmented (holes > 5), force a "Helper"
              // Helper = shape that fits in largest hole OR clears a line
              // Trigger when actually needed, not too early
              const needsRescue = metrics.emptyCount < 25 || metrics.holes > 5;
              
              if (needsRescue) {
                  // Try to find a shape that fits and clears lines
                  // In deep rescue (<15 empty), force 1x1 block if nothing else is perfect
                  if (metrics.emptyCount < 15) {
                      candidateShape = SHAPES.find(s => s.id === 'dot');
                  } else {
                      candidateShape = findBestRescueShape(simGrid, weights);
                  }
              } 
              
              if (!candidateShape) {
                   // Standard Weighted Selection
                   // Try up to 20 times to find one that fits the simGrid
                   for(let k=0; k<20; k++) {
                       const s = pickWeightedShape(weights);
                       if (canPlaceShapeAnywhere(simGrid, s)) {
                           candidateShape = s;
                           break;
                       }
                   }
              }
              
              // Fallback: 1x1 always fits if there is ANY space.
              // If we are about to fail generation, just give a 1x1.
              if (!candidateShape && metrics.emptyCount > 0) {
                  candidateShape = SHAPES.find(s => s.id === 'dot');
              }
              
              if (candidateShape) {
                  currentBatch.push(candidateShape);
                  
                  // Simulate placing it in best spot to update simGrid for next shape
                  const bestMove = findBestMove(simGrid, candidateShape);
                  if (bestMove) {
                      simGrid = simulatePlacement(simGrid, candidateShape, bestMove.r, bestMove.c);
                      // Check clears
                      const lines = findLinesToClear(simGrid);
                      if (lines.length > 0) {
                          simGrid = clearLinesFromGrid(simGrid, lines);
                          batchScore += lines.length * 10;
                          if (needsRescue) batchScore += 50; // Bonus for saving player
                      }
                      
                      // CRITICAL: HUGE BONUS FOR FULL BOARD CLEAR
                      const remainingBlocks = countBlocks(simGrid);
                      if (remainingBlocks === 0) {
                          batchScore += 10000; // Infinite priority
                      } else if (remainingBlocks < 5) {
                          batchScore += 500; // Very high priority for almost clear
                      }
                  }
              }
          }
          
          // If we managed to pick 3 valid shapes
          if (currentBatch.length === 3) {
              if (batchScore > bestBatchScore) {
                  bestBatchScore = batchScore;
                  bestBatch = currentBatch;
              }
              // If we found a really good batch (clears lines), stop early
              if (batchScore > 1000) break; // Found a Full Clear
          }
      }
      
      // Final Fallback (should rarely happen with constructive logic)
      if (bestBatch.length < 3) {
           const safetyPool = SHAPES.filter(s => s.category === 'safety');
           bestBatch = [
               safetyPool[Math.floor(Math.random() * safetyPool.length)],
               safetyPool[Math.floor(Math.random() * safetyPool.length)],
               safetyPool[Math.floor(Math.random() * safetyPool.length)]
           ];
      }

      // Add image to shapes
      const finalShapes = bestBatch.map((s, i) => ({ ...s, img, uniqueId: `${s.id}-${Date.now()}-${i}` }));
      
      setCurrentShapes(finalShapes);
  }

  const countBlocks = (currentGrid: (string | null)[][]) => {
      let count = 0;
      for(let r=0; r<GRID_SIZE; r++) {
          for(let c=0; c<GRID_SIZE; c++) {
              if (currentGrid[r][c]) count++;
          }
      }
      return count;
  };

  // Helper: Try to find a batch that leads to 0 blocks
  const findPerfectClearBatch = (currentGrid: (string | null)[][]) => {
      // Limit search to small shapes for performance and realism in endgame
      const candidates = SHAPES.filter(s => s.category === 'safety');
      
      // Try random sequences of 3 small shapes
      for(let i=0; i<50; i++) {
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
  const findBestRescueShape = (currentGrid: (string | null)[][], weights: any) => {
      // Prioritize safety shapes for rescue
      const candidates = SHAPES.filter(s => s.category === 'safety' || s.category === 'structural');
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

  // Helper: Find best move for a shape (max clears, or just fits)
  const findBestMove = (currentGrid: (string | null)[][], shape: any) => {
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

  const canPlaceShapeAnywhere = (currentGrid: (string | null)[][], shape: any) => {
      for(let r=0; r<GRID_SIZE; r++) {
          for(let c=0; c<GRID_SIZE; c++) {
              if (canPlaceShape(r, c, shape, currentGrid)) return true;
          }
      }
      return false;
  };

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
                  generateNewShapes(nextImgIndex, finalGrid);
              } else {
                  // Check game over with remaining shapes and NEW grid state
                  checkGameOver(finalGrid, newShapes);
              }
          }, 250); // 0.25s duration
      } else {
          if (newShapes.every(s => !s)) {
              generateNewShapes(currentImageIndex, newGrid);
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
                                      'bg-white/20 border-white/40'}`}
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
                                gridTemplateColumns: `repeat(${Math.max(...shape.points.map(p => p[0])) + 1}, ${cellSize * 0.6}px)`,
                                gridTemplateRows: `repeat(${Math.max(...shape.points.map(p => p[1])) + 1}, ${cellSize * 0.6}px)`
                            }}
                        >
                            {shape.points.map(([x, y], idx) => (
                                <div 
                                    key={idx}
                                    className="w-full h-full border border-white/10 rounded-sm shadow-sm"
                                    style={{ 
                                        gridColumn: x + 1, 
                                        gridRow: y + 1,
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