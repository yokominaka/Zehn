import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useNavigate, useLocation } from "react-router-dom";
import React, { useMemo, useState } from "react";

export default function Welcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExiting, setIsExiting] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  const springConfig = { damping: 25, stiffness: 100 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-1, 1], [15, -15]);
  const rotateY = useTransform(smoothX, [-1, 1], [-15, 15]);

  const petals = useMemo(() => Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 20 + 10,
    initialRotate: Math.random() * 360,
    parallaxX: Math.random() * 100 - 50,
    parallaxY: Math.random() * 100 - 50,
    duration: Math.random() * 30 + 30, // slow rotation
    delay: Math.random() * 3,
  })), []);

  const playModernClickSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      
      // Clean, ethereal, crystal-like chime using two sine waves

      // First tone - deep and soft
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 1.5);

      // Second tone - higher, slight delay for texture
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.05); // G5 (perfect fifth)
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.05);
      gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 1.8);
    } catch (err) {
      console.error("Audio playback failed:", err);
    }
  };

  return (
    <motion.div 
      className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden relative"
      onMouseMove={handleMouseMove}
      animate={isExiting ? { opacity: 0, scale: 1.1, filter: "blur(12px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-30 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(0,0,0,0) 70%)",
          x: useTransform(smoothX, [-1, 1], [-100, 100]),
          y: useTransform(smoothY, [-1, 1], [-100, 100]),
        }}
      />

      {/* Minimalist White Petals / Flowers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {petals.map((petal) => (
          <motion.div
            key={petal.id}
            className="absolute"
            style={{
              top: petal.top,
              left: petal.left,
              x: useTransform(smoothX, [-1, 1], [-petal.parallaxX, petal.parallaxX]),
              y: useTransform(smoothY, [-1, 1], [-petal.parallaxY, petal.parallaxY]),
            }}
          >
            <motion.div
              className="bg-white/10 border border-white/20 backdrop-blur-sm pointer-events-auto mix-blend-screen"
              style={{
                width: petal.size,
                height: petal.size,
                borderRadius: '100% 0 100% 0',
                boxShadow: '0 0 15px rgba(255,255,255,0.05)'
              }}
              initial={{ opacity: 0, rotate: petal.initialRotate, scale: 0 }}
              animate={{ 
                opacity: [0.2, 0.5, 0.2], 
                rotate: petal.initialRotate + 360,
                scale: 1
              }}
              transition={{
                opacity: { duration: petal.duration * 0.3, repeat: Infinity, ease: "easeInOut", delay: petal.delay },
                rotate: { duration: petal.duration, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, delay: petal.delay, ease: "easeOut" }
              }}
              whileHover={{ 
                scale: 2.5, 
                backgroundColor: "rgba(255,255,255,0.9)",
                boxShadow: "0 0 40px rgba(255,255,255,0.6)",
                borderRadius: '50%',
                rotate: petal.initialRotate + 45,
                transition: { type: "spring", stiffness: 300, damping: 15 }
              }}
            />
          </motion.div>
        ))}
      </div>
      
      <motion.div
        style={{ rotateX, rotateY, perspective: 1000 }}
        className="z-10 flex flex-col items-center text-center p-8 cursor-pointer pointer-events-auto"
        onClick={() => {
          if (isExiting) return;
          playModernClickSound();
          setIsExiting(true);
          const returnTo = location.state?.returnTo || '/app';
          setTimeout(() => navigate(returnTo, { replace: true }), 750);
        }}
      >
        <motion.div 
          className="flex flex-col items-center mb-6 pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-white leading-none">
            Zehn
          </h1>
          <span className="text-2xl md:text-3xl font-serif text-white/50 mt-3 font-light">
            ذہن
          </span>
        </motion.div>
        
        <motion.p 
          className="text-sm md:text-base text-white/50 font-medium tracking-[0.3em] uppercase mb-16 max-w-sm leading-relaxed pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        >
          Emotional Texture Engine
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative"
        >
          <div className="absolute -inset-2 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <button className="relative bg-white text-black px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-500 overflow-hidden">
            <span className="relative z-10 pointer-events-none">Click to Continue</span>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
