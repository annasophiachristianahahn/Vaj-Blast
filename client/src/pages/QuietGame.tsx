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
  const audioChunksRef = useRef<Float32Array[]>([]);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Use RMS threshold (0.0 to 1.0)
  // 0.05 is roughly equivalent to a loud conversation/shout depending on mic gain
  const THRESHOLD_RMS = 0.15; 
  // Store more chunks for better context (e.g. 5 seconds buffer)
  const MAX_BUFFER_CHUNKS = 200; 

  const startGame = async () => {
    // Stop any existing playback
    if (playbackSourceRef.current) {
        playbackSourceRef.current.stop();
        playbackSourceRef.current.disconnect();
        playbackSourceRef.current = null;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        // Reset recording buffer
        audioChunksRef.current = [];
        
        const microphone = audioContext.createMediaStreamSource(stream);
        sourceNodeRef.current = microphone;

        // Use ScriptProcessor for both analysis and recording
        const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
        processorRef.current = scriptProcessor;
        
        let triggered = false;
        
        scriptProcessor.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer;
            const inputData = inputBuffer.getChannelData(0);
            
            // 1. Calculate Volume (RMS)
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            
            // Map RMS (0-0.5 typical) to 0-100 for visualizer
            // Multiplier 400 makes 0.25 RMS -> 100
            setVolume(Math.min(rms * 400, 100));
            
            // 2. Record Audio
            // Make a copy of the data
            const chunk = new Float32Array(inputData);
            audioChunksRef.current.push(chunk);
            
            // Keep buffer size limited but generous enough for context
            if (audioChunksRef.current.length > MAX_BUFFER_CHUNKS) {
                audioChunksRef.current.shift();
            }
            
            // 3. Check Threshold
            if (!triggered && rms > THRESHOLD_RMS) {
                triggered = true;
                // Continue recording for a moment to capture the full sound
                // e.g., 1.5 seconds (approx 30 chunks at 2048 samples/44.1kHz)
                let remainingChunks = 30;
                
                // We hijack the process to continue recording then stop
                const originalProcess = scriptProcessor.onaudioprocess;
                
                scriptProcessor.onaudioprocess = (evt) => {
                    // Still capture data
                    const currentInput = evt.inputBuffer.getChannelData(0);
                    const currentChunk = new Float32Array(currentInput);
                    audioChunksRef.current.push(currentChunk);
                    
                    // Maintain max size (though unlikely to overflow in 1.5s)
                    if (audioChunksRef.current.length > MAX_BUFFER_CHUNKS) {
                        audioChunksRef.current.shift();
                    }

                    remainingChunks--;
                    if (remainingChunks <= 0) {
                        endGameAndPlayRecording();
                    }
                };
            }
        };
        
        microphone.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
        
        setPlaying(true);
        setGameOver(false);
        setScore(0);
        
    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access needed to play!");
    }
  };

  const endGameAndPlayRecording = () => {
    if (!audioContextRef.current) return;
    
    // Stop capturing
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
    }
    
    setPlaying(false);
    setGameOver(true);
    
    playCapturedAudioLoop();
    cleanup();
  };
  
  const playCapturedAudioLoop = () => {
      if (!audioContextRef.current || audioChunksRef.current.length === 0) return;
      
      const ctx = audioContextRef.current;
      
      // Calculate total length
      const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
      
      // Create buffer
      const audioBuffer = ctx.createBuffer(1, totalLength, ctx.sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Flatten chunks
      let offset = 0;
      for (const chunk of audioChunksRef.current) {
          channelData.set(chunk, offset);
          offset += chunk.length;
      }
      
      // Play it in a loop
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true; // Loop the captured sound!
      source.connect(ctx.destination);
      source.start();
      
      playbackSourceRef.current = source;
  };

  const cleanup = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    // Don't close context immediately if we want to play back sound!
    // But we need to close it eventually if user navigates away or restarts.
    // For now, we keep it open for playback.
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
      return () => {
        if (playbackSourceRef.current) {
            playbackSourceRef.current.stop();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        cleanup();
      };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-8 w-full max-w-sm mx-auto p-4 min-h-[60vh]">
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-display text-primary mb-2 drop-shadow-md">SHHHH!</h1>
            <p className="opacity-80 text-base md:text-lg">Don't make a sound. Survive.</p>
        </div>

        <div className="relative w-full max-w-[300px] aspect-square bg-black/40 rounded-full border-4 border-white/20 flex items-center justify-center overflow-hidden backdrop-blur-md shadow-2xl">
            {/* Volume Indicator */}
            <motion.div 
                className="absolute inset-0 bg-red-600 rounded-full opacity-50"
                // Threshold visual ref is roughly 60 (0.15 * 400)
                animate={{ scale: playing ? Math.min(volume / 60, 1.5) : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            
            <div className="z-10 text-6xl font-mono font-bold drop-shadow-lg">
                {gameOver ? (
                    <div className="flex flex-col items-center">
                        <span className="text-red-500 animate-pulse">FAIL</span>
                        <span className="text-xs text-white/50 mt-2 font-sans animate-none tracking-widest text-center">PLAYING BACK<br/>SOUND LOOP...</span>
                    </div>
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
