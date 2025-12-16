import { Layout } from "@/components/Layout";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Mesh, Vector3 } from "three";
import { Text, Center, Environment, Float, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function Coin({ flipping, result, onFlipEnd, onFlipStart }: { flipping: boolean, result: 'HEADS' | 'TAILS' | null, onFlipEnd: () => void, onFlipStart: () => void }) {
  const mesh = useRef<Mesh>(null!);
  const [rotationSpeed, setRotationSpeed] = useState(0);
  
  useFrame((state, delta) => {
    if (flipping) {
        mesh.current.rotation.x += 50 * delta; // Increased speed for rapid spin
        mesh.current.rotation.y += 25 * delta;
    } else {
        // Landing animation
        if (result) {
            const targetRotationX = result === 'HEADS' ? 0 : Math.PI;
             // Simple interpolation to land
            mesh.current.rotation.x = mesh.current.rotation.x % (Math.PI * 2);
            
            // Snap to nearest face
            const currentX = mesh.current.rotation.x;
            const diff = targetRotationX - currentX;
            
            if (Math.abs(diff) > 0.1) {
                mesh.current.rotation.x += diff * 10 * delta; // Faster landing snap
            } else {
                mesh.current.rotation.x = targetRotationX;
            }
             mesh.current.rotation.y *= 0.90; // Slow down spin faster
        }
    }
  });

  return (
    <Float speed={flipping ? 20 : 2} rotationIntensity={flipping ? 10 : 1} floatIntensity={flipping ? 5 : 1}>
        <mesh 
            ref={mesh} 
            rotation={[0, 0, 0]}
            onClick={(e) => {
                e.stopPropagation();
                onFlipStart();
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
        >
        <cylinderGeometry args={[2.5, 2.5, 0.2, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
        
        {/* Heads Text */}
        <group position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <Center>
                <Text fontSize={1} color="#B8860B" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                    $VAJ
                </Text>
            </Center>
        </group>

        {/* Tails Text */}
        <group position={[0, -0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <Center>
                <Text fontSize={0.8} color="#B8860B" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                    TAILS
                </Text>
            </Center>
        </group>
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
        setResult(outcome);
        setFlipping(false);
    }, 1500); // Slightly shorter for snappier feel
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start py-4">
      <div className="w-full h-[40vh] md:h-[50vh] relative">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <spotLight position={[-10, -10, -10]} intensity={0.5} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Coin flipping={flipping} result={result} onFlipEnd={() => {}} onFlipStart={flipCoin} />
          <Environment preset="city" />
        </Canvas>
      </div>
      
      <div className="flex flex-col items-center gap-4 mt-4 relative z-10 min-h-[80px]">
        {result && !flipping && (
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="text-4xl md:text-6xl font-display text-primary drop-shadow-[2px_2px_0_rgba(0,0,0,1)] md:drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
            >
                {result}!
            </motion.div>
        )}
        
        <div className="text-xs md:text-sm opacity-50 font-mono animate-pulse mt-2">
            TAP COIN TO FLIP
        </div>
      </div>
    </div>
  );
}
