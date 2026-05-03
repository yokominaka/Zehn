import React, { useState, useRef, useEffect } from "react";
import { ai } from "@/src/lib/gemini";
import { ImagePlus, Send, X, Loader2, PenTool, Mic, Square, History, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { useQalamStore, QalamEntry } from "@/src/store/qalam";
import { useLocation } from "react-router-dom";

export default function Qalam() {
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [verse, setVerse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { history, addEntry, removeEntry } = useQalamStore();
  const location = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<QalamEntry | null>(null);

  useEffect(() => {
    // Check if we need to open the latest entry
    if (location.state?.openLatest && history.length > 0) {
      setVerse(history[0].verse);
      // Clean up state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, history]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setVerse(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setVerse(null);
  };

  const startRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        let finalTranscript = note ? note + " " : ""; 

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let currentFinal = "";
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          finalTranscript += currentFinal;
          setLiveTranscript(currentInterim);
          setNote(finalTranscript + currentInterim);
        };
        
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          stopRecording();
          toast.error("Microphone error: " + event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } else {
        toast.error("Speech recognition is not supported in this browser.");
      }
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      toast.error("Microphone access denied. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setLiveTranscript("");
  };

  const generateVerse = async () => {
    if (!note.trim() && !imageFile) return;
    
    setIsGenerating(true);
    setError(null);
    setVerse(null);
    
    try {
      let parts: any[] = [];
      
      const promptText = `**Role:** You are the core intelligence of "Zehn," an AI-powered emotional reflection engine. Your personality is that of a "Wiser Cousin": empathetic, culturally grounded (specifically in Pakistani/Lahore contexts), minimalist, and insightful.

'The Qalam' - a poetic synthesis engine. Your goal is to convert the user's input into a "Sher" (Urdu couplet). Balance traditional Sufi-inspired wisdom with modern context.

You MUST generate the verse in pure Roman Urdu (do NOT use English words), AND provide the native Urdu script version.

Below the verses, you MUST provide a poetic English translation. The translation must be highly accurate to the original Urdu metaphors, but you must prioritize making the English phrasing deeply rhythmic and soul-heavy. Keep the English minimal, profound, and emotionally resonant.

${note ? `User's text note: "${note}"` : ""}

Write the verse now based on the image/text vibes. Keep it short, maximum 2 lines per language. Output ONLY the required text with no introductory or concluding remarks. Do not wrap in quotes. Structure it exactly like this, with line breaks between each section:

[Roman Urdu Couplet]

[Urdu Script Couplet]

[Soul-Heavy English Translation]`;
      
      parts.push({ text: promptText });
      
      if (imageFile && imagePreview) {
        const base64Data = imagePreview.split(",")[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: imageFile.type
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: parts
          }
        ]
      });
      
      const result = response.text.trim();
      setVerse(result);
      addEntry({
        note: note, 
        verse: result,
        imageUrl: imagePreview || undefined,
      });
      setNote("");
    } catch (err: any) {
      console.error(err);
      if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.status === "RESOURCE_EXHAUSTED") {
        setError("API Quota exceeded. Zehn needs a break too. Wait a bit or check your plan.");
      } else {
        setError("Failed to synthesize verse.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex flex-col space-y-2 pt-6 px-2 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <PenTool className="w-8 h-8 text-text-primary flex-shrink-0 mt-0.5" />
            <div className="flex items-baseline space-x-3 -translate-y-1">
              <h1 className="text-4xl font-sans font-semibold tracking-tighter text-text-primary leading-none drop-shadow-sm">Qalam</h1>
              <span className="text-2xl font-serif text-text-secondary font-light">قلم</span>
            </div>
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center text-text-secondary hover:bg-black/10 hover:text-text-primary transition-all active:scale-95"
            aria-label="History"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[14px] font-medium text-text-secondary tracking-wide uppercase">
          Poetic Synthesis
        </p>
      </div>
      
      <div className="flex-1 flex flex-col pt-4">
        {/* Output Section */}
        <div className="flex-1 overflow-y-auto mb-6 px-2 relative">
          <AnimatePresence mode="wait">
            {verse ? (
              <motion.div
                key="verse"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/80 backdrop-blur-xl rounded-[28px] p-8 border border-white shadow-[0_8px_32px_rgb(0,0,0,0.06)] h-full flex flex-col justify-center items-center text-center relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                  <PenTool className="w-40 h-40" />
                </div>
                
                <p className="text-2xl md:text-3xl font-serif text-text-primary leading-relaxed whitespace-pre-wrap">
                  {verse.split("").map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, filter: 'blur(4px)', y: 5 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      transition={{ delay: index * 0.015, duration: 0.3 }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </p>
                
                <div className="mt-12 w-12 h-1 bg-border rounded-full" />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center px-4"
              >
                <div className="w-20 h-20 rounded-full bg-white/50 border border-white shadow-sm flex items-center justify-center mb-6">
                  <PenTool className="w-8 h-8 text-text-tertiary/60" />
                </div>
                <p className="text-[15px] text-text-secondary max-w-[280px] leading-relaxed">
                  Provide an image or write down your feelings. Qalam will translate it into poetic wisdom.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Overlays */}
          <AnimatePresence>
            {showHistory && !selectedHistoryEntry && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 z-20 bg-white/95 backdrop-blur-3xl rounded-[28px] overflow-hidden flex flex-col border border-black/[0.05]"
              >
                <div className="p-4 flex items-center justify-between border-b border-black/[0.05]">
                  <h3 className="font-bold tracking-widest text-[11px] uppercase text-text-secondary">Archive (History)</h3>
                  <button onClick={() => setShowHistory(false)} className="p-2 bg-black/5 rounded-full hover:bg-black/10">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
                      <History className="w-8 h-8 mb-4" />
                      <p className="text-sm font-medium">No verses synthesized yet.</p>
                    </div>
                  ) : (
                    history.map(entry => (
                      <div 
                        key={entry.id} 
                        className="bg-white rounded-[20px] p-4 shadow-sm border border-black/[0.02] cursor-pointer hover:bg-black/[0.02] transition-colors relative group"
                        onClick={() => setSelectedHistoryEntry(entry)}
                      >
                        <p className="text-[13px] text-text-tertiary mb-3 line-clamp-2 italic">
                          "{entry.note.length > 50 ? entry.note.substring(0, 50) + "..." : (entry.note || "Image entry")}"
                        </p>
                        <p className="font-serif text-[15px] rtl leading-relaxed line-clamp-2 whitespace-pre-wrap">
                          {entry.verse.split('\n')[0] || "..."}
                        </p>
                        <div className="mt-3 flex justify-between items-center text-[10px] text-text-tertiary uppercase font-bold tracking-wider">
                          <span>{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEntry(entry.id);
                          }}
                          className="absolute -right-2 -top-2 w-8 h-8 bg-white border border-black/5 shadow-sm text-text-secondary hover:text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Detailed View for History Entry */}
            {selectedHistoryEntry && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-30 bg-white/95 backdrop-blur-3xl rounded-[28px] overflow-hidden flex flex-col shadow-xl border border-white"
              >
                <div className="p-4 flex justify-end">
                  <button onClick={() => setSelectedHistoryEntry(null)} className="p-3 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col items-center justify-center text-center">
                  <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-tertiary mb-8">
                    Past Synthesis
                  </h2>
                  <p className="text-2xl md:text-3xl font-serif text-text-primary leading-relaxed whitespace-pre-wrap">
                    {selectedHistoryEntry.verse}
                  </p>
                  <p className="mt-12 text-[12px] uppercase opacity-40 font-bold tracking-[0.2em]">
                     {new Date(selectedHistoryEntry.date).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Section */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[32px] p-3 shadow-[0_-8px_32px_rgb(0,0,0,0.04)] mb-safe transition-all duration-300 flex flex-col">
          {error && <p className="text-[11px] text-red-500 font-bold tracking-wider px-4 pt-2 -mb-2">{error}</p>}
          
          <AnimatePresence>
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="px-2 pt-2 relative"
              >
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm border border-black/5 bg-white">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={removeImage}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-2"
              >
                <div className="flex items-center space-x-2 text-accent-red font-medium text-xs tracking-wider uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
                  <span>Listening...</span>
                </div>
                <p className="text-sm text-text-secondary italic">
                  {liveTranscript || "Speak into the void..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 relative">
            <input 
              type="file" 
              accept="image/*"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-black/5 text-text-secondary hover:bg-black/10 hover:text-text-primary transition-colors"
              aria-label="Upload Image"
            >
              <ImagePlus className="w-[20px] h-[20px]" />
            </button>
            
            <div className="flex-1 bg-black/5 rounded-[24px] min-h-[48px] flex items-center px-4 relative border border-transparent focus-within:border-black/10 focus-within:bg-white transition-all">
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setVerse(null);
                }}
                placeholder="Share your vibe..."
                className="w-full bg-transparent border-none outline-none resize-none py-3 text-[15px] text-text-primary placeholder:text-text-tertiary max-h-[120px] custom-scrollbar"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isGenerating && (note.trim() || imageFile)) {
                      generateVerse();
                    }
                  }
                }}
              />
            </div>
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all active:scale-95",
                isRecording ? "bg-accent-red text-white hover:bg-red-600 animate-pulse outline outline-2 outline-offset-2 outline-accent-red/30" : "bg-black/5 text-text-secondary hover:bg-black/10 hover:text-text-primary"
              )}
            >
              {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-[20px] h-[20px]" />}
            </button>

            <button 
              onClick={generateVerse}
              disabled={isGenerating || (!note.trim() && !imageFile)}
              className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-text-primary text-white hover:bg-black disabled:opacity-40 disabled:hover:bg-text-primary transition-all shadow-[0_4px_12px_rgb(0,0,0,0.15)] active:scale-95"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
