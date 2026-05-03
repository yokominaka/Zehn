import { useState, useEffect } from "react";
import { useVibesStore } from "@/src/store/vibes";
import { ai } from "@/src/lib/gemini";
import { Asterisk } from "lucide-react";
import { formatTone } from "@/src/lib/utils";

export default function Nuskha() {
  const vibes = useVibesStore(state => state.vibes);
  const [intervention, setIntervention] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vibes.length > 0 && !intervention) {
      generateIntervention();
    }
  }, [vibes.length]);

  const generateIntervention = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const recentVibesText = vibes.slice(0, 3).map(v => `${formatTone(v.tone)}: ${v.sentiment}`).join("\n");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            text: `You are 'Nuskha' - a Recalibration Agent and an observant, wise friend. Your role is to analyze the user's recent emotional states and provide a highly useful, vast, and non-repetitive micro-intervention tailored to their current trajectory.

            Recent States:
            ${recentVibesText}

            Instructions for the Nuskha (Prescription):
            1. **Expansive & Grounding Interventions:** Provide highly specific physical, environmental, or somatic shifts. (e.g., "wash your face with freezing water", "step out onto the chatt/roof and look at the open sky for 2 minutes", "do a 4-4-4 box breathing technique", "dim the overhead lights and just sit in the dark").
            2. **Cognitive Reframing (Wiser Cousin philosophy):** Offer a philosophical shift. e.g., "This isn't a dead-end, it's just a speed bump. Sometimes you have to park the car and walk," or "Bazaar mein shor hai, thora side pe ho jao" (There is noise in the bazaar, step aside).
            3. **Vast Cultural Sandbox (AVOID CLICHÉS):** DO NOT constantly suggest "chai", "biryani", or "Coke Studio". Go deeper. Reference the quiet ambient stillness of a late-night drive, the distant echo of the Azaan, the introspective mood of the 'pehli baarish' (first rain), the dust and poetry of an old city, forgotten indie music, or the profound simplicity of Faiz Ahmed Faiz's verses.
            4. **Tone:** Empathetic, minimalist, observant context. No generic AI-isms or clinical advice like "Remember to practice self-care". Keep it raw. Use natural Roman Urdu mixed seamlessly with English.
            5. **Format:** Output a cohesive 3-4 sentence paragraph. Start with an authentic, grounding interjection (like "Chall, break ley lay", or "Screen band kar, dimaagh ghoom raha hai tera"), validate their immediate state, and give them the expansive recalibration advice.
            
            Generate the 'Nuskha' now:`
          }
        ]
      });
      setIntervention(response.text.replace(/["']/g, "").trim());
    } catch (err: any) {
      console.error(err);
      if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.status === "RESOURCE_EXHAUSTED") {
        setError("Zehn is resting. The API quota is exhausted.");
      } else {
        setError("Failed to prescribe an intervention.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex flex-col space-y-2 pt-6 px-2">
        <div className="flex items-start space-x-3">
          <Asterisk className="w-8 h-8 text-text-primary flex-shrink-0 mt-0.5" />
          <div className="flex items-baseline space-x-3 -translate-y-1">
            <h1 className="text-4xl font-sans font-semibold tracking-tighter text-text-primary leading-none drop-shadow-sm">Nuskha</h1>
            <span className="text-2xl font-serif text-text-secondary font-light">نسخہ</span>
          </div>
        </div>
        <p className="text-[14px] font-medium text-text-secondary tracking-wide uppercase">
          Vibe Correction
        </p>
      </div>

      <div className="bg-[#F9F3E8] border border-amber-200 rounded-3xl p-8 flex flex-col space-y-6 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
        </div>
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-amber-800 mb-4">
            Prescription
          </h2>
          {isGenerating ? (
            <div className="animate-pulse flex space-x-4">
               <div className="h-4 bg-amber-200 rounded w-3/4"></div>
               <div className="h-4 bg-amber-200 rounded w-1/2"></div>
            </div>
          ) : error ? (
            <p className="text-sm font-serif text-accent-rose leading-relaxed italic">
              {error}
            </p>
          ) : intervention ? (
            <p className="text-xl font-serif text-text-primary leading-relaxed whitespace-pre-wrap">
              {intervention}
            </p>
          ) : (
            <p className="text-xl font-serif text-text-primary leading-relaxed italic opacity-50">
              No recent vibes to correct. Go log a vibe in Sada.
            </p>
          )}
        </div>
        
        {intervention && (
          <button 
            onClick={generateIntervention}
            className="mt-4 bg-black text-white rounded-full px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#333] transition-all self-start"
          >
            Get Another Nuskha
          </button>
        )}
      </div>
    </div>
  );
}
