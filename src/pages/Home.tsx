import { useState, useRef, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useVibesStore, VibeEntry } from "@/src/store/vibes";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatTone } from "@/src/lib/utils";
import { Sparkles, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { createPortal } from "react-dom";

export default function Home() {
  const vibes = useVibesStore(state => state.vibes);
  const [selectedVibe, setSelectedVibe] = useState<VibeEntry | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const renderDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "dd MMM");
  };

  const downloadImage = (dataUrl: string, id: string) => {
    const link = document.createElement('a');
    link.download = `zehn-vibe-${id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleShare = async () => {
    if (!cardRef.current || !selectedVibe) return;
    setIsSharing(true);
    
    try {
      // Need a small timeout to allow state update to render and DOM to layout (hiding buttons, expanding height)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(cardRef.current, { 
        style: { transform: "none", borderRadius: "40px", maxHeight: "none", height: "max-content" }, 
        cacheBust: false, 
        quality: 1.0, 
        pixelRatio: 2 
      });
      
      if (navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `zehn-vibe-${selectedVibe.id}.png`, { type: 'image/png' });
          await navigator.share({
            title: 'My Zehn Vibe',
            text: 'A glimpse of my state, reflected on Zehn.',
            files: [file]
          });
        } catch (err: any) {
          // If Share is canceled or fails, download instead
          if (err.name !== 'AbortError') {
             downloadImage(dataUrl, selectedVibe.id);
          }
        }
      } else {
        downloadImage(dataUrl, selectedVibe.id);
      }
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-6">
      <section className="flex flex-col flex-1 pb-12 pt-24 px-1 mt-2">
        <div className="flex justify-between items-end mb-6 px-2 border-b border-border/40 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-text-primary flex-shrink-0" />
            <div className="flex items-baseline space-x-3 -translate-y-0.5">
              <h2 className="text-3xl font-sans font-semibold tracking-tighter text-text-primary leading-none drop-shadow-sm">Aks</h2>
              <span className="text-2xl font-serif text-text-secondary font-light">عکس</span>
            </div>
          </div>
          <span className="text-xs bg-white/60 backdrop-blur-sm border border-white px-3 py-1.5 rounded-full text-text-secondary font-bold tracking-wider shadow-[0_2px_8px_rgb(0,0,0,0.02)]">
            {vibes.length} VIBE{vibes.length !== 1 ? 'S' : ''}
          </span>
        </div>
        
        <div className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-2xl border border-white/80 rounded-[28px] p-6 shadow-[0_8px_24px_rgb(0,0,0,0.04)] relative overflow-hidden group mb-6 flex-shrink-0">
          <div className="absolute top-0 right-0 w-[173px] h-[137px] bg-gradient-to-br from-amber-100/40 to-orange-100/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
          <p className="text-[15px] font-medium text-text-primary/90 leading-relaxed relative z-10 tracking-wide">
            Welcome to your aesthetic reflection engine.
            <span className="block mt-2 text-text-secondary text-[14px]">
              Express your raw state in <strong className="text-text-primary font-semibold">Sada</strong>, and watch it manifest across the galaxy.
            </span>
          </p>
        </div>

        <div className="flex-1 relative bg-white/20 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-[0_8px_40px_rgb(0,0,0,0.02)] overflow-hidden p-6 flex flex-col items-center">
          <div className="absolute inset-0 opacity-50 mix-blend-multiply pointer-events-none transition-all duration-1000">
            {/* Blurry atmospheric background, changes based on latest vibe */}
            {vibes.length > 0 && (
              <>
                <div 
                  className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-70"
                  style={{ backgroundColor: vibes[0]?.uiState?.color || "#F9F8F6" }}
                />
                {vibes.length > 1 && (
                  <div 
                    className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-60"
                    style={{ backgroundColor: vibes[1]?.uiState?.color || "#D1D5DB" }}
                  />
                )}
              </>
            )}
          </div>
          
          {vibes.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full h-full space-y-4 px-8 text-center mt-10 z-10">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-2 shadow-inner">
                <Sparkles className="w-6 h-6 text-text-tertiary" />
              </div>
              <p className="text-text-primary text-[17px] font-medium tracking-tight">Your galaxy is empty</p>
              <p className="text-sm text-text-secondary leading-relaxed">Go to Sada to log your first vibe and see it manifest here.</p>
            </div>
          ) : (
            <div 
              className="relative grid grid-cols-2 gap-5 h-full w-full content-start overflow-y-auto custom-scrollbar z-10 px-1 py-2 pr-2"
            >
              {vibes.map((vibe) => (
                <motion.div
                  key={vibe.id}
                  layoutId={`vibe-card-${vibe.id}`}
                  onClick={() => setSelectedVibe(vibe)}
                  className="aspect-square rounded-[24px] bg-white/40 backdrop-blur-xl shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-white/60 flex flex-col items-center justify-center cursor-pointer hover:scale-[1.03] hover:-translate-y-1 hover:shadow-[0_24px_48px_rgb(0,0,0,0.08)] hover:bg-white/60 transition-all duration-500 overflow-hidden relative group"
                >
                  {vibe.imageUrl ? (
                    <>
                      <motion.img 
                        layoutId={`vibe-image-${vibe.id}`}
                        src={vibe.imageUrl} 
                        crossOrigin="anonymous"
                        alt={formatTone(vibe.tone)}
                        className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <span className="relative z-10 text-[10px] uppercase font-bold tracking-[0.2em] text-white/90 mt-auto mb-5 drop-shadow-sm">
                        {renderDate(vibe.date)}
                      </span>
                    </>
                  ) : (
                    <>
                      <div 
                        className="w-10 h-10 rounded-full animate-pulse blur-md shadow-inner"
                        style={{ backgroundColor: vibe.uiState?.color || "#e5e7eb" }}
                      ></div>
                      <span className="absolute bottom-5 text-[10px] uppercase font-bold tracking-[0.2em] text-text-secondary">
                        {renderDate(vibe.date)}
                      </span>
                    </>
                  )}
                </motion.div>
              ))}
              
              {/* Empty slots for visual balance */}
              {Array.from({ length: Math.max(0, 4 - vibes.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-[24px] bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-text-tertiary">Empty</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {createPortal(
        <AnimatePresence>
          {selectedVibe && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex flex-col items-center justify-end p-4 bg-black/40 backdrop-blur-md"
              onClick={() => setSelectedVibe(null)}
            >
            <motion.div 
              layoutId={`vibe-card-${selectedVibe.id}`}
              className={cn(
                "w-full max-w-[400px] bg-surface/90 backdrop-blur-3xl border border-white/60 shadow-[0_32px_64px_rgb(0,0,0,0.2)] rounded-[40px] overflow-hidden relative mb-4 flex flex-col",
                !isSharing && "max-h-[85vh]"
              )}
              onClick={(e) => e.stopPropagation()}
              ref={cardRef}
            >
              <div className={cn("custom-scrollbar relative", !isSharing && "overflow-y-auto")}>
                {selectedVibe.imageUrl && (
                  <div className="w-full h-72 relative">
                    <motion.img 
                      layoutId={`vibe-image-${selectedVibe.id}`}
                      src={selectedVibe.imageUrl} 
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface/90 to-transparent" />
                  </div>
                )}
                
                <div className={cn("px-8 pb-8 relative", selectedVibe.imageUrl ? "-mt-20" : "pt-10")}>
                  <div className="flex justify-between items-end mb-8 relative z-10">
                    <div>
                      <span className="inline-block px-2 py-1 rounded-[8px] bg-white/70 backdrop-blur-md text-[10px] uppercase font-bold tracking-[0.2em] text-black shadow-sm mb-1">
                        {renderDate(selectedVibe.date)} • {format(new Date(selectedVibe.date), "h:mm a")}
                      </span>
                      <h2 className="text-4xl font-light tracking-tight text-text-primary mt-1">
                        {formatTone(selectedVibe.tone)}
                      </h2>
                    </div>
                    <div 
                      className="w-10 h-10 rounded-full shadow-[inset_0_2px_8px_rgb(0,0,0,0.1)] border border-white/50"
                      style={{ backgroundColor: selectedVibe.uiState?.color || "#e5e7eb" }}
                    />
                  </div>

                  {selectedVibe.transcription && (
                    <div className="mb-6">
                      <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-tertiary mb-3 pl-1">The Audio</h3>
                      <p className="text-[15px] italic font-serif text-text-secondary leading-relaxed bg-black/5 p-5 rounded-[24px] border border-black/[0.02] whitespace-pre-wrap">
                        "{isSharing && selectedVibe.transcription.length > 200 
                            ? selectedVibe.transcription.substring(0, 200) + '...'
                            : selectedVibe.transcription}"
                      </p>
                    </div>
                  )}

                  {selectedVibe.verse && (
                    <div className="mb-6">
                      <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-tertiary mb-3 pl-1">Qalam Synthesis</h3>
                      <p className="text-[17px] font-serif text-text-primary border-l-[3px] border-text-tertiary/30 pl-5 py-1 min-h-[4rem]">
                        {selectedVibe.verse}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-tertiary">Energy</span>
                      <span className="text-[15px] font-medium tracking-tight mt-1">{selectedVibe.energyLevel} / 10</span>
                    </div>
                    
                    {!isSharing ? (
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setSelectedVibe(null)}
                          className="bg-black/5 text-text-secondary hover:text-text-primary px-4 py-2.5 rounded-full text-[11px] uppercase tracking-[0.15em] font-bold hover:bg-black/10 active:scale-95 transition-all"
                        >
                          Close
                        </button>
                        <button 
                          onClick={handleShare}
                          className="bg-black text-white px-5 py-2.5 rounded-full text-[11px] uppercase tracking-[0.15em] font-bold hover:bg-black/80 hover:scale-105 active:scale-95 transition-all shadow-md flex items-center space-x-2"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end w-full space-x-2 opacity-50">
                        <Sparkles className="w-4 h-4 text-text-primary" />
                        <span className="text-[12px] font-sans font-semibold tracking-tighter text-text-primary">Zehn</span>
                        <span className="text-[14px] font-serif text-text-secondary font-light">ذہن</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}
