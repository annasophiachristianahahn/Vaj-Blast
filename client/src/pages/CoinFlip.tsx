import { Layout } from "@/components/Layout";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Mesh, Vector3 } from "three";
import { Text, Center, Environment, Float, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function Coin({ flipping, result, onFlipEnd }: { flipping: boolean, result: 'HEADS' | 'TAILS' | null, onFlipEnd: () => void }) {
  const mesh = useRef<Mesh>(null!);
  const [rotationSpeed, setRotationSpeed] = useState(0);
  
  useFrame((state, delta) => {
    if (flipping) {
        mesh.current.rotation.x += 20 * delta;
        mesh.current.rotation.y += 10 * delta;
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
                mesh.current.rotation.x += diff * 5 * delta;
            } else {
                mesh.current.rotation.x = targetRotationX;
            }
             mesh.current.rotation.y *= 0.95; // Slow down spin
        }
    }
  });

  return (
    <Float speed={flipping ? 10 : 2} rotationIntensity={flipping ? 5 : 1} floatIntensity={flipping ? 5 : 1}>
        <mesh ref={mesh} rotation={[0, 0, 0]}>
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
    
    setTimeout(() => {
        const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
        setResult(outcome);
        setFlipping(false);
    }, 2000);
  };

  return (
    <Layout>
      <div className="h-[60vh] w-full relative">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <spotLight position={[-10, -10, -10]} intensity={0.5} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Coin flipping={flipping} result={result} onFlipEnd={() => {}} />
          <Environment preset="city" />
        </Canvas>
      </div>
      
      <div className="flex flex-col items-center gap-4 mt-4">
        {result && !flipping && (
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="text-6xl font-display text-primary drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
            >
                {result}!
            </motion.div>
        )}
        
        <Button 
            onClick={flipCoin} 
            disabled={flipping}
            className="text-2xl h-16 px-12 bg-primary hover:bg-primary/80 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all rounded-xl font-display uppercase"
        >
            {flipping ? "FLIPPING..." : "FLIP COIN"}
        </Button>
      </div>
    </Layout>
  );
}
