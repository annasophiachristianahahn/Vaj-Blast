import { Layout } from "@/components/Layout";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import { Group, Mesh, MeshStandardMaterial, Color, BufferGeometry, Float32BufferAttribute } from "three";
import { Float, Environment, useGLTF } from "@react-three/drei";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Use public path
const coinModelPath = "/coin_v3.glb";

// Preload the model
useGLTF.preload(coinModelPath);

function SplitCoin({ flipping, result, onFlipStart }: { flipping: boolean, result: 'HEADS' | 'TAILS' | null, onFlipStart: () => void }) {
  const meshRef = useRef<Group>(null!);
  const { scene } = useGLTF(coinModelPath);
  const { viewport } = useThree();

  // Calculate responsive scale based on viewport width
  // Minimum scale of 3.5, max of 5, scaling with viewport width
  // This ensures it fits on mobile but isn't too small on desktop
  const scale = Math.min(Math.max(viewport.width * 0.7, 3.5), 5);
  
  // Process geometry to split into groups
  const processedNode = useMemo(() => {
    // Clone scene to avoid mutating original cache
    const clonedScene = scene.clone();
    
    // Find the mesh
    let foundMesh: Mesh | null = null;
    clonedScene.traverse((child) => {
        if ((child as Mesh).isMesh && !foundMesh) {
            foundMesh = child as Mesh;
        }
    });

    if (!foundMesh) return clonedScene;
    
    // Explicitly cast to Mesh to satisfy TypeScript flow analysis
    const targetMesh = foundMesh as Mesh;

    const geometry = targetMesh.geometry.clone();
    
    // Check if we have normals and indices
    if (!geometry.attributes.normal || !geometry.index) {
        console.warn("Coin geometry missing normals or index");
        return clonedScene;
    }

    const normals = geometry.attributes.normal.array;
    const indices = geometry.index.array;
    
    const headIndices: number[] = [];
    const tailIndices: number[] = [];
    const edgeIndices: number[] = [];

    // 1. CENTER THE GEOMETRY
    // This is critical for position-based logic. If the model is offset, 
    // classifying by > 0 or < 0 will cut it in arbitrary places.
    geometry.center();
    geometry.computeBoundingBox();
    
    const bbox = geometry.boundingBox!;
    const rangeX = bbox.max.x - bbox.min.x;
    const rangeY = bbox.max.y - bbox.min.y;
    const rangeZ = bbox.max.z - bbox.min.z;
    
    // 2. Identify Thickness Axis (Smallest dimension)
    let thicknessAxis = 'x';
    let minRange = rangeX;
    
    if (rangeY < minRange) {
        thicknessAxis = 'y';
        minRange = rangeY;
    }
    if (rangeZ < minRange) {
        thicknessAxis = 'z';
        minRange = rangeZ;
    }
    
    console.log(`Detected coin thickness axis: ${thicknessAxis} (Ranges: X=${rangeX.toFixed(3)}, Y=${rangeY.toFixed(3)}, Z=${rangeZ.toFixed(3)})`);

    // 3. Align Thickness to Z-Axis (Camera Facing)
    // We want the face of the coin to look at the camera (Z-axis).
    // So the thickness should run along Z.
    
    if (thicknessAxis === 'x') {
        geometry.rotateY(-Math.PI / 2); // Align X thickness to Z
    } else if (thicknessAxis === 'y') {
        geometry.rotateX(Math.PI / 2); // Align Y thickness to Z
    }
    // If Z, it's already aligned.
    
    // Now that we've rotated, re-compute bounding box to be sure of new dimensions
    geometry.computeBoundingBox();
    const newBbox = geometry.boundingBox!;
    const thickness = newBbox.max.z - newBbox.min.z;
    
    // 4. Classify Faces
    // Now Thickness is along Z.
    // Center is 0.
    // Front Face is at +Z (approx thickness/2)
    // Back Face is at -Z (approx -thickness/2)
    
    // Threshold: slightly inside the outer surface to capture the relief
    const zThreshold = thickness * 0.25; 

    // Iterate over faces (triangles)
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        // We only care about Z now because we aligned it!
        const az = positions[a * 3 + 2];
        const bz = positions[b * 3 + 2];
        const cz = positions[c * 3 + 2];
        
        const avgZ = (az + bz + cz) / 3;

        // Classify
        // +Z Side -> Tails (Chocolate) -> Front Face facing Camera
        // -Z Side -> Heads (Pink) -> Back Face
        
        // Wait, normally we want Heads to be the "Front".
        // If we want Heads to be the default face visible, it should be at +Z.
        // Let's assign +Z to Heads.
        
        if (avgZ > zThreshold) {
            headIndices.push(a, b, c); // +Z is Heads (Pink)
        } else {
            // Everything else (Negative side AND Edge) goes to Tails (Chocolate)
            tailIndices.push(a, b, c); 
        }
    }

    // Combine indices
    const newIndices = [...headIndices, ...tailIndices];
    
    // Update geometry index
    geometry.setIndex(newIndices);

    // Create groups
    geometry.clearGroups();
    let offset = 0;
    
    // Group 0: Heads (Pink)
    if (headIndices.length > 0) {
        geometry.addGroup(offset, headIndices.length, 0);
        offset += headIndices.length;
    }
    
    // Group 1: Tails (Chocolate)
    if (tailIndices.length > 0) {
        geometry.addGroup(offset, tailIndices.length, 1);
        offset += tailIndices.length;
    }

    // Create Materials
    
    // HEADS -> Pink Chrome
    const headsMaterial = new MeshStandardMaterial({
        color: new Color("#ff69b4"), // Hot pink
        roughness: 0.05,
        metalness: 0.9,
        envMapIntensity: 2.0,
        name: "PinkChrome"
    });

    // TAILS -> Chocolate Brown
    const tailsMaterial = new MeshStandardMaterial({
        color: new Color("#3e2723"), // Deep chocolate
        roughness: 0.4,
        metalness: 0.1,
        emissive: new Color("#5d4037"),
        emissiveIntensity: 0.05,
        envMapIntensity: 0.8,
        name: "Chocolate"
    });

    // Assign new geometry and material array to the mesh
    targetMesh.geometry = geometry;
    targetMesh.material = [headsMaterial, tailsMaterial];
    
    // Ensure shadow casting
    targetMesh.castShadow = true;
    targetMesh.receiveShadow = true;

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
    if (!meshRef.current) return;

    if (flipping) {
        meshRef.current.rotation.x += spinSpeed * delta;
        meshRef.current.rotation.y += 10 * delta;
        meshRef.current.rotation.z += 5 * delta; // Add Z rotation for chaotic tumble
    } else {
        // Landing animation
        if (result) {
            // Logic must match the geometry alignment
            // Group 0 (Heads) is +X
            // Group 1 (Tails) is -X
            
            // Note: The Primitive is rotated by [0, Math.PI/2, 0] inside the group.
            // This rotates Local X -> World Z.
            // So Heads (+X) points to +Z (Front).
            // Tails (-X) points to -Z (Back).
            
            // To show Heads (Front), we want +Z facing camera (which is +Z). So Rotation Y = 0.
            // To show Tails (Back), we want -Z facing camera. So Rotation Y = PI.
            
            // Wait, standard Coin Flip logic (X axis flip):
            // Let's use X-axis flipping for the main motion.
            
            // If Heads (+Z world face): X Rot = 0.
            // If Tails (-Z world face): X Rot = PI (Upside down? No, flips Z to -Z).
            // Actually, X-rotation of PI flips Y to -Y and Z to -Z.
            // So X=PI shows the Back.
            
            // HEADS -> X=0
            // TAILS -> X=PI
            const targetRotationX = result === 'HEADS' ? 0 : Math.PI;
            
            // Corrections for upright orientation
            // HEADS (X=0): Top is Top. Z=0.
            // TAILS (X=PI): Top becomes Bottom. Need Z=PI to fix it.
            const targetRotationZ = result === 'HEADS' ? 0 : Math.PI;

            // Normalize current rotation to 0..2PI
            meshRef.current.rotation.x = meshRef.current.rotation.x % (Math.PI * 2);
            if (meshRef.current.rotation.x < 0) meshRef.current.rotation.x += Math.PI * 2;
            
            // Normalize Y and Z to 0..2PI
            meshRef.current.rotation.y = meshRef.current.rotation.y % (Math.PI * 2);
            meshRef.current.rotation.z = meshRef.current.rotation.z % (Math.PI * 2);

            // Smoothly interpolate to target
            
            // X Axis Snap
            let diffX = targetRotationX - meshRef.current.rotation.x;
            if (diffX > Math.PI) diffX -= Math.PI * 2;
            if (diffX < -Math.PI) diffX += Math.PI * 2;
            meshRef.current.rotation.x += diffX * 10 * delta;

            // Y Axis dampening (return to 0)
            let diffY = 0 - meshRef.current.rotation.y;
            if (diffY > Math.PI) diffY -= Math.PI * 2;
            if (diffY < -Math.PI) diffY += Math.PI * 2;
            meshRef.current.rotation.y += diffY * 10 * delta;

            // Z Axis Snap
            let diffZ = targetRotationZ - meshRef.current.rotation.z;
            if (diffZ > Math.PI) diffZ -= Math.PI * 2;
            if (diffZ < -Math.PI) diffZ += Math.PI * 2;
            meshRef.current.rotation.z += diffZ * 10 * delta;
            
            // Add subtle wobble when settled
            if (Math.abs(diffX) < 0.1 && Math.abs(diffY) < 0.1 && Math.abs(diffZ) < 0.1) {
                 meshRef.current.rotation.x = targetRotationX + Math.sin(state.clock.elapsedTime * 5) * 0.05;
                 meshRef.current.rotation.y = 0 + Math.cos(state.clock.elapsedTime * 3) * 0.05;
                 meshRef.current.rotation.z = targetRotationZ + Math.sin(state.clock.elapsedTime * 4) * 0.02;
            }
        } else {
             // Idle state
             const t = state.clock.elapsedTime;
             meshRef.current.rotation.x = Math.sin(t * 3) * 0.3; 
             meshRef.current.rotation.y = Math.cos(t * 2.5) * 0.4;
             meshRef.current.rotation.z = Math.sin(t * 4) * 0.2;
        }
    }
  });

  return (
    <Float speed={flipping ? 20 : 2} rotationIntensity={flipping ? 5 : 0.5} floatIntensity={flipping ? 5 : 1}>
        <group 
            ref={meshRef} 
            rotation={[0, 0, 0]} 
            onClick={(e) => {
                e.stopPropagation();
                onFlipStart();
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
        >
            {/* 
                Geometry is now auto-aligned to Z-axis in the processing step.
                No extra rotation needed here.
            */}
            <primitive object={processedNode} scale={scale} rotation={[0, 0, 0]} />
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
            <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
            {/* Enhanced lighting for metal reflections */}
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 5, 5]} intensity={3} />
            <pointLight position={[10, 10, 10]} intensity={2} />
            <pointLight position={[-10, -10, 10]} intensity={1.5} color="#ffaa00" /> {/* Warm light for chocolate/orange highlights */}
            <spotLight position={[0, 5, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
            <SplitCoin flipping={flipping} result={result} onFlipStart={flipCoin} />
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
