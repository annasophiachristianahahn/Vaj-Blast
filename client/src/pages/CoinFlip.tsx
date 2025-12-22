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
            const originalMaterial = mesh.material as MeshStandardMaterial;
            const color = originalMaterial.color;
            
            // Heuristic to detect pink vs brown side based on brightness
            // Pink is lighter, Brown is darker
            // Adjust threshold based on the actual model colors if needed
            const brightness = (color.r + color.g + color.b) / 3;
            const isPinkSide = brightness > 0.3; // Threshold

            const newMaterial = new MeshStandardMaterial({
                map: originalMaterial.map,
                normalMap: originalMaterial.normalMap,
            });

            if (isPinkSide) {
                // Pink Chrome
                newMaterial.color = new Color("#ff69b4"); // Hot pink
                newMaterial.roughness = 0.05; // Extremely smooth
                newMaterial.metalness = 0.9; // Very metallic
                newMaterial.envMapIntensity = 2.0;
            } else {
                // Chocolate Brown with highlights
                newMaterial.color = new Color("#3e2723"); // Deep chocolate
                newMaterial.roughness = 0.3;
                newMaterial.metalness = 0.4;
                newMaterial.emissive = new Color("#ff4500"); // Orange/Red glow
                newMaterial.emissiveIntensity = 0.1;
                newMaterial.envMapIntensity = 1.0;
            }
            
            mesh.material = newMaterial;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
    });
    
    return clonedScene;
  }, [scene]);

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
            // HEADS: Face camera (0).
            // TAILS: Face away (PI).
            // The model is natively facing the camera (Z-up), so we flip around X axis.
            // User: "The pink side should be heads"
            // If Pink is currently "upside down" and facing front at 0, 
            // and the user wants it to be heads.
            
            // Let's stick to the X-axis logic for heads/tails faces.
            // 0 = one side, PI = other side.
            
            const targetRotationX = result === 'HEADS' ? 0 : Math.PI;
            
            // Normalize current rotation to 0..2PI
            mesh.current.rotation.x = mesh.current.rotation.x % (Math.PI * 2);
            if (mesh.current.rotation.x < 0) mesh.current.rotation.x += Math.PI * 2;
            
            // Normalize Y and Z to 0
            mesh.current.rotation.y = mesh.current.rotation.y % (Math.PI * 2);
            mesh.current.rotation.z = mesh.current.rotation.z % (Math.PI * 2);

            // Smoothly interpolate to target
            
            // X Axis Snap
            let diffX = targetRotationX - mesh.current.rotation.x;
            // Shortest path logic
            if (diffX > Math.PI) diffX -= Math.PI * 2;
            if (diffX < -Math.PI) diffX += Math.PI * 2;
            
            mesh.current.rotation.x += diffX * 25 * delta;

            // Y Axis dampening (return to 0)
            let diffY = 0 - mesh.current.rotation.y;
            if (diffY > Math.PI) diffY -= Math.PI * 2;
            if (diffY < -Math.PI) diffY += Math.PI * 2;
            mesh.current.rotation.y += diffY * 25 * delta;

            // Z Axis dampening (return to 0)
            let diffZ = 0 - mesh.current.rotation.z;
            if (diffZ > Math.PI) diffZ -= Math.PI * 2;
            if (diffZ < -Math.PI) diffZ += Math.PI * 2;
            mesh.current.rotation.z += diffZ * 25 * delta;
            
            // Add subtle wobble when settled
            if (Math.abs(diffX) < 0.1 && Math.abs(diffY) < 0.1 && Math.abs(diffZ) < 0.1) {
                 mesh.current.rotation.x += Math.sin(state.clock.elapsedTime * 2) * 0.005;
                 mesh.current.rotation.y += Math.cos(state.clock.elapsedTime * 1.5) * 0.005;
            }
        } else {
             // Idle state (before first flip)
             // Subtle wobble / undulate on all 3 axes
             const t = state.clock.elapsedTime;
             mesh.current.rotation.x = Math.sin(t * 0.5) * 0.1;
             mesh.current.rotation.y = Math.sin(t * 0.3) * 0.15;
             mesh.current.rotation.z = Math.sin(t * 0.7) * 0.05;
        }
    }
  });

  return (
    <Float speed={flipping ? 20 : 2} rotationIntensity={flipping ? 5 : 0.5} floatIntensity={flipping ? 5 : 1}>
        <group 
            ref={mesh} 
            rotation={[0, 0, 0]} // Initial: Heads facing camera (0,0,0 for Z-forward model)
            onClick={(e) => {
                e.stopPropagation();
                onFlipStart();
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
        >
            {/* 
              Rotation adjustment:
              [0, Math.PI / 2, Math.PI] 
              - Math.PI / 2 on Y fixes the side-view issue.
              - Math.PI on Z flips the face upside down (fixing "pink is upside down").
            */}
            <primitive object={clone} scale={4} rotation={[Math.PI, Math.PI / 2, 0]} />
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
        const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
        console.log("Coin Flip Result:", outcome); // Debug log
        setResult(outcome);
        setFlipping(false);
    }, 500); // Reduced to 0.5s to allow for faster perceived action including landing
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
                            {result || "$VAJ"}
                        </span>
                    </div>
                    <p className="text-white/60 text-sm">3D View Unavailable (WebGL Error)</p>
                </div>
            }
        >
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
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
