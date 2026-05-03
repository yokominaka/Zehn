import { useVibesStore } from "@/src/store/vibes";
import { format } from "date-fns";
import { Activity } from "lucide-react";
import { formatTone } from "@/src/lib/utils";

export default function Halaat() {
  const vibes = useVibesStore(state => state.vibes);
  
  // Create a 28-day grid (4 weeks) for the heatmap pattern
  const gridCells = Array.from({ length: 28 });
  
  // Fill from end to represent recent at the bottom/right
  const recentVibes = vibes.slice(0, 28).reverse();

  return (
    <div className="flex h-full flex-col space-y-8">
      <div className="flex flex-col space-y-2 pt-6 px-2">
        <div className="flex items-start space-x-3">
          <Activity className="w-8 h-8 text-text-primary flex-shrink-0 mt-0.5" />
          <div className="flex items-baseline space-x-3 -translate-y-1">
            <h1 className="text-4xl font-sans font-semibold tracking-tighter text-text-primary leading-none drop-shadow-sm">Halaat</h1>
            <span className="text-2xl font-serif text-text-secondary font-light">حالات</span>
          </div>
        </div>
        <p className="text-[14px] font-medium text-text-secondary tracking-wide uppercase">
          Monthly Vibe Heatmap
        </p>
      </div>

      <div className="bg-surface rounded-3xl p-6 border border-border flex-1 flex flex-col shadow-sm max-h-[60vh] relative">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-text-tertiary mb-6">
          Vibe Pattern
        </h2>
        
        {vibes.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/60 backdrop-blur-[2px] rounded-3xl">
            <Activity className="w-8 h-8 text-text-tertiary mb-3 opacity-50" />
            <p className="text-text-secondary text-sm font-medium">No readings yet.</p>
            <p className="text-text-tertiary text-xs mt-1">Speak into Sada to start tracking.</p>
          </div>
        )}

        <div className="grid grid-cols-7 gap-3 content-start">
          {gridCells.map((_, index) => {
            // Find if we have a vibe for this slot
            // Since recentVibes might be < 28, we offset it so the most recent ones are at the end
            const offset = 28 - recentVibes.length;
            
            if (index < offset) {
              // Empty past days
              return (
                <div key={`empty-${index}`} className="aspect-square w-full rounded-full bg-[#E5E5E5] mix-blend-multiply opacity-50"></div>
              );
            }
            
            const vibe = recentVibes[index - offset];
            const isLatest = index === 27; // The very last cell
            
            return (
              <div 
                key={`vibe-${vibe.id}`} 
                className={`aspect-square w-full rounded-full relative group cursor-pointer transition-transform hover:scale-110 ${isLatest ? 'border-2 border-text-body shadow-sm' : ''}`}
                style={{ backgroundColor: vibe.uiState.color }}
              >
                {isLatest && (
                  <span 
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: vibe.uiState.color }}
                  ></span>
                )}
                {/* Tooltip on hover */}
                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface text-text-primary text-[10px] uppercase tracking-widest font-bold py-1 px-2 rounded-md border border-border whitespace-nowrap shadow-xl z-10 transition-opacity pointer-events-none">
                  {format(new Date(vibe.date), "dd MMM")} • {formatTone(vibe.tone)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-auto pt-6 flex justify-between items-center text-[9px] uppercase tracking-widest text-text-tertiary border-t border-border mt-6">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-blue"></span> Calm / Sad</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-mustard"></span> Neutral / Peace</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-rose"></span> High Energy / Chaos</span>
        </div>
      </div>
    </div>
  );
}
