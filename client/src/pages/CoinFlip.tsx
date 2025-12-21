import { Layout } from "@/components/Layout";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import { Group, Vector3, MathUtils } from "three";
import { Text, Center, Environment, Float, Stars, useGLTF } from "@react-three/drei";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Use public path
const coinModelPath = "/coin_v2.glb";

// Preload the model
useGLTF.preload(coinModelPath);

function Coin({ flipping, result, onFlipStart }: { flipping: boolean, result: 'HEADS' | 'TAILS' | null, onFlipStart: () => void }) {
  const mesh = useRef<Group>(null!);
  const { scene } = useGLTF(coinModelPath);
  
  // Clone the scene so we can use it multiple times if needed, and to ensure fresh state
  const clone = useMemo(() => scene.clone(), [scene]);

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
            // HEADS: Face up (towards camera Z). X=PI/2.
            // TAILS: Face down (away from camera Z). X=3PI/2.
            // NOTE: Adjusted for the GLB model orientation if needed. 
            // Assuming standard cylinder orientation, but we might need to tweak based on the model.
            // Let's assume the model is flat on XZ plane or XY plane. 
            // If it's standing up, we might need different offsets. 
            // For now keeping same logic, but we can tweak if "Heads" is wrong side.
            const targetRotationX = result === 'HEADS' ? Math.PI / 2 : (Math.PI * 3 / 2);
            
            // Normalize current rotation to 0..2PI
            mesh.current.rotation.x = mesh.current.rotation.x % (Math.PI * 2);
            if (mesh.current.rotation.x < 0) mesh.current.rotation.x += Math.PI * 2;
            
            // Normalize Y and Z to 0
            mesh.current.rotation.y = mesh.current.rotation.y % (Math.PI * 2);
            mesh.current.rotation.z = mesh.current.rotation.z % (Math.PI * 2);

            // Smoothly interpolate to target
            // We use lerp-like behavior for smoothness
            
            // X Axis Snap
            let diffX = targetRotationX - mesh.current.rotation.x;
            // Shortest path logic
            if (diffX > Math.PI) diffX -= Math.PI * 2;
            if (diffX < -Math.PI) diffX += Math.PI * 2;
            
            mesh.current.rotation.x += diffX * 25 * delta; // Much faster landing speed (was 12)

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
        }
    }
  });

  return (
    <Float speed={flipping ? 20 : 2} rotationIntensity={flipping ? 5 : 0.5} floatIntensity={flipping ? 5 : 1}>
        <group 
            ref={mesh} 
            rotation={[Math.PI / 2, 0, 0]} // Initial: Heads facing camera
            onClick={(e) => {
                e.stopPropagation();
                onFlipStart();
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
        >
            {/* 
              Adjust scale and rotation to match previous cylinder.
              Previous cylinder was [2.5, 2.5, 0.2].
              GLBs are often normalized or arbitrary units. 
              Starting with scale={3} to make it big enough. 
              Rotation might need tweaking depending on how the model was exported.
            */}
            <primitive object={clone} scale={4} />
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
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <spotLight position={[-10, -10, -10]} intensity={0.5} />
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
