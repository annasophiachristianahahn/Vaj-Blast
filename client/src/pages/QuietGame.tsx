import { Layout } from "@/components/Layout";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function QuietGame() {
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(null!);
  
  const THRESHOLD = 30; // Volume threshold (0-100 roughly)

  const startGame = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
        
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;
        
        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
        
        scriptProcessor.onaudioprocess = () => {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;
            const length = array.length;
            for (let i = 0; i < length; i++) {
                values += array[i];
            }
            const average = values / length;
            setVolume(average);
            
            if (average > THRESHOLD) {
                endGame();
            }
        };
        
        setPlaying(true);
        setGameOver(false);
        setScore(0);
        
    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access needed to play!");
    }
  };

  const endGame = () => {
    setPlaying(false);
    setGameOver(true);
    cleanup();
  };

  const cleanup = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playing) {
        interval = setInterval(() => {
            setScore(s => s + 1);
        }, 100);
    }
    return () => clearInterval(interval);
  }, [playing]);

  useEffect(() => {
      return () => cleanup();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-sm mx-auto p-4 min-h-[60vh]">
        <div className="text-center">
            <h1 className="text-4xl font-display text-primary mb-2 drop-shadow-md">SHHHH!</h1>
            <p className="opacity-80 text-lg">Don't make a sound. Survive.</p>
        </div>

        <div className="relative w-full aspect-square bg-black/40 rounded-full border-4 border-white/20 flex items-center justify-center overflow-hidden backdrop-blur-md shadow-2xl">
            {/* Volume Indicator */}
            <motion.div 
                className="absolute inset-0 bg-red-600 rounded-full opacity-50"
                animate={{ scale: playing ? Math.min(volume / THRESHOLD, 1.5) : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            
            <div className="z-10 text-6xl font-mono font-bold drop-shadow-lg">
                {gameOver ? (
                    <span className="text-red-500 animate-pulse">FAIL</span>
                ) : (
                    (score / 10).toFixed(1) + "s"
                )}
            </div>
        </div>

        {!playing && (
            <Button 
                onClick={startGame}
                className="w-full text-xl h-16 bg-green-600 hover:bg-green-500 text-white font-display tracking-wider shadow-lg border-2 border-green-400/50"
            >
                {gameOver ? "TRY AGAIN" : "START QUIET GAME"}
            </Button>
        )}

        {playing && (
            <div className="text-xl text-red-400 font-bold animate-pulse tracking-widest">
                LISTENING...
            </div>
        )}
      </div>
  );
}
