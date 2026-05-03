import { Outlet, NavLink, useLocation, Link, useOutlet } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { Mic, PenTool, Sparkles, Activity, Asterisk, Info, Settings as SettingsIcon, X, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVibesStore } from "@/src/store/vibes";
import { useProfileStore } from "@/src/store/profile";
import { useAuth } from "../AuthProvider";

export function AppLayout() {
  const location = useLocation();
  const currentOutlet = useOutlet();
  const latestVibe = useVibesStore((state) => state.vibes[0]);
  const isNavHidden = useVibesStore((state) => state.isNavHidden);
  const setNavHidden = useVibesStore(state => state.setNavHidden);
  const fetchProfile = useProfileStore(state => state.fetchProfile);
  const clearProfile = useProfileStore(state => state.clearProfile);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      clearProfile();
    }
  }, [user, fetchProfile, clearProfile]);

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Hide nav on specific child pages
  useEffect(() => {
    setNavHidden(location.pathname === "/app/settings" || showWelcome || isInfoOpen);
    return () => setNavHidden(false);
  }, [location.pathname, showWelcome, isInfoOpen, setNavHidden]);

  useEffect(() => {
    if (showWelcome) {
      // Auto-dismiss after 6 seconds
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const navItems = [
    { name: "Aks", path: "/app", icon: Sparkles },
    { name: "Halaat", path: "/app/halaat", icon: Activity },
    // Center Floating Action Button placeholder
    { name: "Sada", path: "/app/sada", icon: Mic },
    { name: "Qalam", path: "/app/qalam", icon: PenTool },
  ];

  const bgColor = latestVibe?.uiState?.color || "#F9F8F6";
  const animationSpeed = latestVibe?.uiState?.animationSpeed || 4.0;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-surface relative">
      {/* Mood-based Background Animation */}
      <motion.div
        className="absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none"
        animate={{
          background: [
            `radial-gradient(circle at 20% 30%, ${bgColor} 0%, transparent 70%)`,
            `radial-gradient(circle at 80% 70%, ${bgColor} 0%, transparent 60%)`,
            `radial-gradient(circle at 40% 80%, ${bgColor} 0%, transparent 70%)`,
            `radial-gradient(circle at 20% 30%, ${bgColor} 0%, transparent 70%)`,
          ],
        }}
        transition={{
          duration: animationSpeed * 3,
          ease: "linear",
          repeat: Infinity,
        }}
      />

      {/* Fixed Header */}
      <div className="fixed top-6 left-6 z-[60] pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
            <h1 className="text-4xl font-sans font-semibold tracking-tighter text-text-primary leading-none drop-shadow-sm">Zehn</h1>
            <span className="text-2xl font-serif text-text-secondary font-light translate-y-0.5">ذہن</span>
          </Link>
          <div className="flex items-center ml-1">
            <button 
              onClick={() => setIsInfoOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-black/5 text-text-secondary hover:text-text-primary hover:bg-white shadow-[0_4px_12px_rgb(0,0,0,0.08)] transition-all duration-300 pointer-events-auto hover:scale-105 active:scale-95"
              aria-label="App Features Info"
            >
              <Info className="w-[16px] h-[16px] stroke-[2.5]" />
            </button>
            <Link 
              to="/app/settings"
              className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-black/5 text-text-secondary hover:text-text-primary hover:bg-white shadow-[0_4px_12px_rgb(0,0,0,0.08)] transition-all duration-300 pointer-events-auto hover:scale-105 active:scale-95"
              aria-label="Settings"
            >
              <SettingsIcon className="w-[16px] h-[16px] stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-8 relative z-10 custom-scrollbar">
        <div className="mx-auto max-w-md h-full px-6 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full flex flex-col"
            >
              {currentOutlet}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Low-Key Mobile Navigation */}
      <AnimatePresence>
        {!isNavHidden && (
          <motion.nav 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="relative z-50 px-6 pb-8 pt-2"
          >
            <div className="mx-auto max-w-sm">
              <div className="flex items-center justify-between rounded-full px-6 py-4 shadow-[0_8px_32px_rgb(0,0,0,0.08)] bg-white/70 backdrop-blur-2xl border border-white/60 relative z-50">
                {navItems.slice(0, 2).map((item) => (
                  <NavItem key={item.path} item={item} isActive={location.pathname === item.path} />
                ))}

                {/* Central Action / Nuskha Trigger */}
                <NavLink
                  to="/app/nuskha"
                  className={cn(
                    "group relative flex h-[52px] items-center justify-center rounded-full bg-text-primary text-white shadow-xl transition-all duration-300 active:scale-95 hover:bg-black overflow-hidden",
                    location.pathname === "/app/nuskha" 
                      ? "w-[110px] scale-105 shadow-[0_4px_16px_rgb(0,0,0,0.2)]" 
                      : "w-[52px] hover:w-[110px]"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-300",
                    location.pathname === "/app/nuskha" ? "opacity-0 scale-50 rotate-90" : "group-hover:opacity-0 group-hover:scale-50 group-hover:rotate-90"
                  )}>
                    <Asterisk className="h-7 w-7 stroke-[2]" />
                  </div>
                  <span className={cn(
                    "absolute text-[12px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300",
                    location.pathname === "/app/nuskha" ? "opacity-100 scale-100" : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
                  )}>
                    Nuskha
                  </span>
                </NavLink>

                {navItems.slice(2, 4).map((item) => (
                  <NavItem key={item.path} item={item} isActive={location.pathname === item.path} />
                ))}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-md"
            onClick={() => setIsInfoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white shadow-[0_32px_64px_rgb(0,0,0,0.15)] rounded-[36px] overflow-hidden relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-8 pt-8 pb-4 relative z-10">
                <h3 className="text-2xl font-light tracking-tight text-text-primary">About Zehn</h3>
                <button 
                  onClick={() => setIsInfoOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
              <div className="px-8 pb-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar relative z-0 pr-6">
                <div className="flex flex-col space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">What is Zehn?</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    An AI-powered emotional reflection engine. It processes your daily multimodal inputs and transforms your raw emotional data into aesthetic, culturally-grounded artifacts, helping you uncover the profound in the mundane.
                  </p>
                </div>
                
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary mb-4">Features</h4>
                  <div className="space-y-6">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-text-primary">Aks (عکس)</span>
                      <p className="text-sm text-text-secondary leading-relaxed">Your visual galaxy. Turns your daily emotional logs into abstract aesthetic artifacts.</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-text-primary">Halaat (حالات)</span>
                      <p className="text-sm text-text-secondary leading-relaxed">The vibe dashboard. Maps your energetic and emotional state over time.</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-text-primary">Sada (صدا)</span>
                      <p className="text-sm text-text-secondary leading-relaxed">Multimodal journal. Vent into the mic and let Zehn analyze the emotional subtext.</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-text-primary">Qalam (قلم)</span>
                      <p className="text-sm text-text-secondary leading-relaxed">Poetic synthesis. Rephrases your state of mind into a contemporary sher.</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-text-primary">Nuskha (نسخہ)</span>
                      <p className="text-sm text-text-secondary leading-relaxed">Vibe-correction. Micro-interventions drawn from local culture to realign your vibe.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Overlay */}
      <AnimatePresence>
        {showWelcome && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-surface/80 backdrop-blur-3xl"
            onClick={() => setShowWelcome(false)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="text-center px-8 max-w-sm flex flex-col items-center"
            >
              <h2 className="text-3xl font-light tracking-tight text-text-primary mb-2">
                Welcome, {user.displayName?.split(" ")[0] || "Seeker"}.
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-8">
                Your aesthetic reflection engine is ready.
              </p>
              
              <motion.div
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 1.2, duration: 0.5 }}
                 className="flex flex-col items-center gap-4"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 border border-black/5 shadow-sm text-text-secondary animate-[pulse_2s_ease-in-out_infinite]">
                  <Info className="w-[20px] h-[20px] stroke-[2]" />
                </div>
                <p className="text-xs uppercase tracking-widest font-bold text-text-tertiary">
                  Tap the (i) icon in the top left<br/>to understand Zehn
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const NavItem: React.FC<{ item: any; isActive: boolean }> = ({ item, isActive }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-colors duration-300",
        isActive ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {item.name}
      </span>
    </NavLink>
  );
}
