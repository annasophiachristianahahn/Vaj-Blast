import { Layout } from "@/components/Layout";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { Mesh, Vector3, MathUtils } from "three";
import { Text, Center, Environment, Float, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function Coin({ flipping, result, onFlipStart }: { flipping: boolean, result: 'HEADS' | 'TAILS' | null, onFlipStart: () => void }) {
  const mesh = useRef<Mesh>(null!);
  // Randomize spin speed slightly for every flip so it doesn't look identical
  const [spinSpeed, setSpinSpeed] = useState(50);
  
  useEffect(() => {
      if (flipping) {
          setSpinSpeed(40 + Math.random() * 20); // Random speed between 40 and 60
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
            
            mesh.current.rotation.x += diffX * 8 * delta;

            // Y Axis dampening (return to 0)
            let diffY = 0 - mesh.current.rotation.y;
            if (diffY > Math.PI) diffY -= Math.PI * 2;
            if (diffY < -Math.PI) diffY += Math.PI * 2;
            mesh.current.rotation.y += diffY * 8 * delta;

            // Z Axis dampening (return to 0)
            let diffZ = 0 - mesh.current.rotation.z;
            if (diffZ > Math.PI) diffZ -= Math.PI * 2;
            if (diffZ < -Math.PI) diffZ += Math.PI * 2;
            mesh.current.rotation.z += diffZ * 8 * delta;
        }
    }
  });

  return (
    <Float speed={flipping ? 20 : 2} rotationIntensity={flipping ? 5 : 0.5} floatIntensity={flipping ? 5 : 1}>
        <mesh 
            ref={mesh} 
            rotation={[Math.PI / 2, 0, 0]} // Initial: Heads facing camera
            onClick={(e) => {
                e.stopPropagation();
                onFlipStart();
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
        >
        <cylinderGeometry args={[2.5, 2.5, 0.2, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
        
        {/* Heads Text - Front Face */}
        <group position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <Center>
                <Text fontSize={1} color="#B8860B" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                    $VAJ
                </Text>
            </Center>
            {/* Add a ring/marker to distinguish heads visually if text is blurry */}
            <mesh position={[0, 0, -0.01]}>
                <ringGeometry args={[2.3, 2.4, 32]} />
                <meshBasicMaterial color="#B8860B" />
            </mesh>
        </group>

        {/* Tails Text - Back Face */}
        <group position={[0, -0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <Center>
                <Text fontSize={0.8} color="#FFF" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                    TAILS
                </Text>
            </Center>
             <mesh position={[0, 0, -0.01]}>
                <ringGeometry args={[2.3, 2.4, 32]} />
                <meshBasicMaterial color="#FFF" />
            </mesh>
        </group>
        
        {/* Edge texture detail (optional, just gold for now) */}
        </mesh>
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
    }, 1500); 
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start py-2">
      <div className="w-full h-[35vh] md:h-[45vh] relative">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <spotLight position={[-10, -10, -10]} intensity={0.5} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Coin flipping={flipping} result={result} onFlipStart={flipCoin} />
          <Environment preset="city" />
        </Canvas>
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
