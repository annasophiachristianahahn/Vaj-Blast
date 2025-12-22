import { Layout } from "@/components/Layout";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import { Group, Vector3, MathUtils, Mesh, MeshStandardMaterial, Color, TextureLoader } from "three";
import { Text, Center, Environment, Float, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Import images directly
import player1Image from "@assets/vaj-400_1766349849850.jpg";
import player2Image from "@assets/grams-400_1766349849850.jpg";

function Coin({ flipping, result, onFlipStart }: { flipping: boolean, result: 'HEADS' | 'TAILS' | null, onFlipStart: () => void }) {
  const mesh = useRef<Group>(null!);
  
  // Load textures
  const [vajTexture, gramsTexture] = useLoader(TextureLoader, [player1Image, player2Image]);

  // Create materials
  const materials = useMemo(() => {
    // HEADS (Front/Top) -> Pink Chrome -> Vajunnie
    const headsMaterial = new MeshStandardMaterial({
        map: vajTexture,
        color: new Color("#ff69b4"), // Hot pink
        roughness: 0.05, // Extremely smooth
        metalness: 0.9, // Very metallic
        envMapIntensity: 2.0,
    });

    // TAILS (Back/Bottom) -> Chocolate -> Grams
    const tailsMaterial = new MeshStandardMaterial({
        map: gramsTexture,
        color: new Color("#3e2723"), // Deep chocolate
        roughness: 0.4, // Satin finish
        metalness: 0.1, // Organic
        emissive: new Color("#5d4037"), // Subtle brown glow
        emissiveIntensity: 0.05,
        envMapIntensity: 0.8,
    });

    // Edge -> Gold
    const edgeMaterial = new MeshStandardMaterial({
        color: "#ffd700",
        roughness: 0.3,
        metalness: 1.0,
    });

    return { heads: headsMaterial, tails: tailsMaterial, edge: edgeMaterial };
  }, [vajTexture, gramsTexture]);

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
            
            // HEADS -> Show Pink (Top/Front) -> X=0
            // TAILS -> Show Chocolate (Bottom/Back) -> X=PI (Upside down)

            const targetRotationX = result === 'HEADS' ? 0 : Math.PI;
            
            // HEADS (X=0) -> Z=0 to be upright
            // TAILS (X=PI) -> Needs Z=PI to be upright (since X flip inverts it)
            const targetRotationZ = result === 'HEADS' ? 0 : Math.PI;
            
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
            mesh.current.rotation.x += diffX * 10 * delta;

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
                 mesh.current.rotation.y = 0 + Math.cos(state.clock.elapsedTime * 3) * 0.05;
                 mesh.current.rotation.z = targetRotationZ + Math.sin(state.clock.elapsedTime * 4) * 0.02;
            }
        } else {
             // Idle state
             const t = state.clock.elapsedTime;
             mesh.current.rotation.x = Math.sin(t * 3) * 0.3; 
             mesh.current.rotation.y = Math.cos(t * 2.5) * 0.4;
             mesh.current.rotation.z = Math.sin(t * 4) * 0.2;
        }
    }
  });

  return (
    <Float speed={flipping ? 20 : 2} rotationIntensity={flipping ? 5 : 0.5} floatIntensity={flipping ? 5 : 1}>
        <group 
            ref={mesh} 
            rotation={[0, 0, 0]} 
            onClick={(e) => {
                e.stopPropagation();
                onFlipStart();
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
        >
            {/* The Coin Geometry */}
            {/* Main Cylinder (Edge) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[4, 4, 0.5, 64]} />
                <primitive object={materials.edge} attach="material" />
            </mesh>

            {/* HEADS Face (Top) - Pink Chrome */}
            <mesh position={[0, 0, 0.26]} rotation={[0, 0, 0]}>
                <circleGeometry args={[4, 64]} />
                <primitive object={materials.heads} attach="material" />
            </mesh>

            {/* TAILS Face (Bottom) - Chocolate */}
            <mesh position={[0, 0, -0.26]} rotation={[0, Math.PI, 0]}>
                {/* Rotated Y by PI so texture is correct when flipped */}
                <circleGeometry args={[4, 64]} />
                <primitive object={materials.tails} attach="material" />
            </mesh>
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
        console.log("Coin Flip Result:", outcome); 
        setResult(outcome);
        setFlipping(false);
    }, 800); 
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
            <Canvas camera={{ position: [0, 0, 14], fov: 45 }}>
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