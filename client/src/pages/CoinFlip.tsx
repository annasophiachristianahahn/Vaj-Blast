import { Layout } from "@/components/Layout";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import { Group, Vector3, MathUtils, Mesh, MeshStandardMaterial, Color } from "three";
import { Text, Center, Environment, Float, Stars, useGLTF } from "@react-three/drei";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Use public path
const coinModelPath = "/coin_v3.glb";

// Preload the model
useGLTF.preload(coinModelPath);

function Coin({ flipping, result, onFlipStart }: { flipping: boolean, result: 'HEADS' | 'TAILS' | null, onFlipStart: () => void }) {
  const mesh = useRef<Group>(null!);
  const { scene } = useGLTF(coinModelPath);
  
  // Clone the scene so we can use it multiple times if needed, and to ensure fresh state
  const clone = useMemo(() => {
    const clonedScene = scene.clone();
    
    // Apply material enhancements
    clonedScene.traverse((child) => {
        if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            const originalMaterial = mesh.material;
            
            // Handle array of materials (multi-material mesh)
            if (Array.isArray(originalMaterial)) {
                 mesh.material = originalMaterial.map((mat, idx) => {
                     const standardMat = mat as MeshStandardMaterial;
                     return createEnhancedMaterial(standardMat, idx);
                 });
            } else {
                 mesh.material = createEnhancedMaterial(originalMaterial as MeshStandardMaterial);
            }
            
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
    });
    
    return clonedScene;
  }, [scene]);

  function createEnhancedMaterial(originalMaterial: MeshStandardMaterial, index?: number) {
      const color = originalMaterial.color;
      // Heuristic to detect pink vs brown side based on brightness
      // Pink is lighter, Brown is darker
      const brightness = (color.r + color.g + color.b) / 3;
      
      let isPinkSide = brightness > 0.3; // Threshold

      // If we have an index from a multi-material array, force differentiation
      // This ensures we have 2 different shaders even if colors are similar
      if (index !== undefined) {
          isPinkSide = index === 0;
      }
      
      // console.log(`Material assignment: Brightness=${brightness.toFixed(2)} Index=${index} IsPink=${isPinkSide}`);

      const newMaterial = new MeshStandardMaterial({
          map: originalMaterial.map,
          normalMap: originalMaterial.normalMap,
      });

      if (isPinkSide) {
          // Pink Chrome (Shader 1)
          newMaterial.color = new Color("#ff69b4"); // Hot pink
          newMaterial.roughness = 0.05; // Extremely smooth
          newMaterial.metalness = 0.9; // Very metallic
          newMaterial.envMapIntensity = 2.0;
      } else {
          // Chocolate Brown (Shader 2)
          newMaterial.color = new Color("#3e2723"); // Deep chocolate
          newMaterial.roughness = 0.4; // Satin finish
          newMaterial.metalness = 0.1; // Organic
          newMaterial.emissive = new Color("#5d4037"); // Subtle brown glow
          newMaterial.emissiveIntensity = 0.05;
          newMaterial.envMapIntensity = 0.8;
      }
      return newMaterial;
  }

  // Randomize spin speed slightly for every flip so it doesn't look identical
  const [spinSpeed, setSpinSpeed] = useState(50);
  
  useEffect(() => {
      if (flipping) {
          setSpinSpeed(60 + Math.random() * 30); // Faster speed for shorter duration
      }
  }, [flipping]);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    if (flipping) {
        mesh.current.rotation.x += spinSpeed * delta;
        mesh.current.rotation.y += 10 * delta;
        mesh.current.rotation.z += 5 * delta; // Add Z rotation for chaotic tumble
    } else {
        // Landing animation
        if (result) {
            // Target rotations
            // HEADS: Should show Chocolate side (Back).
            // TAILS: Should show Pink side (Front).
            
            // Front (Pink) is X=0. Back (Chocolate) is X=PI.
            // HEADS -> X=PI
            // TAILS -> X=0
            const targetRotationX = result === 'HEADS' ? Math.PI : 0;
            
            // Orientation correction (Z-axis):
            // Pink (X=0) needs Z=0 to be Upright.
            // Chocolate (X=PI) is inverted by the X-flip. To be Upright, it needs Z=PI.
            
            // HEADS (X=PI) -> Needs Z=PI
            // TAILS (X=0) -> Needs Z=0
            const targetRotationZ = result === 'HEADS' ? Math.PI : 0;
            
            // Normalize current rotation to 0..2PI
            mesh.current.rotation.x = mesh.current.rotation.x % (Math.PI * 2);
            if (mesh.current.rotation.x < 0) mesh.current.rotation.x += Math.PI * 2;
            
            // Normalize Y and Z to 0..2PI
            mesh.current.rotation.y = mesh.current.rotation.y % (Math.PI * 2);
            mesh.current.rotation.z = mesh.current.rotation.z % (Math.PI * 2);

            // Smoothly interpolate to target
            
            // X Axis Snap
            let diffX = targetRotationX - mesh.current.rotation.x;
            if (diffX > Math.PI) diffX -= Math.PI * 2;
            if (diffX < -Math.PI) diffX += Math.PI * 2;
            mesh.current.rotation.x += diffX * 10 * delta; // Slower damping for smoothness

            // Y Axis dampening (return to 0)
            let diffY = 0 - mesh.current.rotation.y;
            if (diffY > Math.PI) diffY -= Math.PI * 2;
            if (diffY < -Math.PI) diffY += Math.PI * 2;
            mesh.current.rotation.y += diffY * 10 * delta;

            // Z Axis Snap
            let diffZ = targetRotationZ - mesh.current.rotation.z;
            if (diffZ > Math.PI) diffZ -= Math.PI * 2;
            if (diffZ < -Math.PI) diffZ += Math.PI * 2;
            mesh.current.rotation.z += diffZ * 10 * delta;
            
            // Add subtle wobble when settled
            if (Math.abs(diffX) < 0.1 && Math.abs(diffY) < 0.1 && Math.abs(diffZ) < 0.1) {
                 // WOBBLE AROUND THE TARGET ROTATION
                 mesh.current.rotation.x = targetRotationX + Math.sin(state.clock.elapsedTime * 5) * 0.05;
                 // TargetY is always 0
                 mesh.current.rotation.y = 0 + Math.cos(state.clock.elapsedTime * 3) * 0.05;
                 // TargetZ
                 mesh.current.rotation.z = targetRotationZ + Math.sin(state.clock.elapsedTime * 4) * 0.02;
            }
        } else {
             // Idle state (before first flip)
             // Should show "Tails" (Pink side) as user requested flip.
             // Or actually, user didn't specify idle side.
             // But if Pink is TAILS, and we want to show Pink in Idle (usually Front side),
             // then Idle shows TAILS.
             
             // Base state for Idle is Pink (Front) -> X=0, Z=0.
             const t = state.clock.elapsedTime;
             mesh.current.rotation.x = Math.sin(t * 3) * 0.3; 
             mesh.current.rotation.y = Math.cos(t * 2.5) * 0.4;
             // Wobble around 0 (Upright)
             mesh.current.rotation.z = Math.sin(t * 4) * 0.2;
        }
    }
  });

  return (
    <Float speed={flipping ? 20 : 2} rotationIntensity={flipping ? 5 : 0.5} floatIntensity={flipping ? 5 : 1}>
        <group 
            ref={mesh} 
            rotation={[Math.PI, 0, Math.PI]} // Initial: Heads (Chocolate) Upright. 
            // Chocolate is X=PI, Z=PI.
            onClick={(e) => {
                e.stopPropagation();
                onFlipStart();
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
        >
            {/* 
              Rotation adjustment:
              Base model [0, PI/2, 0] is "Faces Camera" but "Upside Down".
              We handle the Z-flip in the animation logic (Idle Z=PI, Heads Z=PI).
            */}
            <primitive object={clone} scale={5} rotation={[0, Math.PI / 2, 0]} />
        </group>
    </Float>
  );
}

export default function CoinFlip() {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'HEADS' | 'TAILS' | null>(null);

  const flipCoin = () => {
    if (flipping) return;
    setFlipping(true);
    setResult(null);
    
    // Play a faster spin animation
    setTimeout(() => {
        // Use < 0.5 to ensure fair distribution
        const outcome = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
        console.log("Coin Flip Result:", outcome); // Debug log
        setResult(outcome);
        setFlipping(false);
    }, 600); // Slightly longer to allow full spin visual
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-2 min-h-0">
      <div className="w-full flex-1 relative min-h-[40vh]">
        <ErrorBoundary
            fallback={
                <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                    <div 
                        onClick={flipCoin}
                        className="w-48 h-48 rounded-full bg-yellow-400 border-8 border-yellow-600 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-xl"
                    >
                        <span className="text-4xl font-bold text-yellow-800">
                            {result || "FLIP"}
                        </span>
                    </div>
                    <p className="text-white/60 text-sm">3D View Unavailable (WebGL Error)</p>
                </div>
            }
        >
            <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
            {/* Enhanced lighting for metal reflections */}
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={2} />
            <pointLight position={[-10, -10, 10]} intensity={1.5} color="#ffaa00" /> {/* Warm light for chocolate/orange highlights */}
            <spotLight position={[0, 5, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
            <Coin flipping={flipping} result={result} onFlipStart={flipCoin} />
            <Environment preset="city" />
            </Canvas>
        </ErrorBoundary>
      </div>
      
      <div className="flex flex-col items-center gap-2 mt-2 relative z-10 min-h-[60px]">
        {result && !flipping && (
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="text-3xl md:text-5xl font-display text-primary drop-shadow-[2px_2px_0_rgba(0,0,0,1)] md:drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
            >
                {result}!
            </motion.div>
        )}
        
        <div className="text-xs md:text-sm opacity-50 font-mono animate-pulse mt-1">
            TAP COIN TO FLIP
        </div>
      </div>
    </div>
  );
}
