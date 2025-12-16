import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col items-center gap-8 w-full">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-center"
        >
            <h1 className="text-6xl md:text-8xl font-display text-primary drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black tracking-tighter transform -rotate-2">
            VAJUNNIE
            </h1>
            <p className="text-xl font-bold bg-black/50 px-4 py-1 rounded-full mt-2 border border-primary/50 text-primary-foreground backdrop-blur-sm">
            THE CHAOS APP
            </p>
        </motion.div>

        <div className="grid gap-4 w-full">
            <GameCard 
                title="COIN FLIP" 
                desc="Test your luck" 
                href="/coin-flip" 
                color="bg-red-500"
                delay={0.1}
            />
            <GameCard 
                title="THE QUIET GAME" 
                desc="Don't make a sound" 
                href="/quiet-game" 
                color="bg-purple-500"
                delay={0.2}
            />
            <GameCard 
                title="BLOCK BLAST" 
                desc="Meme puzzle madness" 
                href="/block-blast" 
                color="bg-green-500"
                delay={0.3}
            />
        </div>
      </div>
    </Layout>
  );
}

function GameCard({ title, desc, href, color, delay }: { title: string, desc: string, href: string, color: string, delay: number }) {
    return (
        <Link href={href}>
            <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay }}
                whileHover={{ scale: 1.05, rotate: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full p-6 rounded-xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] cursor-pointer transition-colors ${color} group relative overflow-hidden`}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h2 className="text-3xl font-display text-white drop-shadow-md uppercase">{title}</h2>
                <p className="font-bold opacity-90 text-black/80">{desc}</p>
            </motion.div>
        </Link>
    )
}
