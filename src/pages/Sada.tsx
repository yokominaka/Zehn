import { useState, useRef, useEffect } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatTone } from "@/src/lib/utils";
import { useVibesStore } from "@/src/store/vibes";
import { useQalamStore } from "@/src/store/qalam";
import { ai, generateAksArt } from "@/src/lib/gemini";
import { useNavigate } from "react-router-dom";
import { Mic } from "lucide-react";
import { toast } from "sonner";

export default function Sada() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  
  const vibes = useVibesStore(state => state.vibes);
  const addVibe = useVibesStore(state => state.addVibe);
  const updateVibeImage = useVibesStore(state => state.updateVibeImage);
  const result = vibes.find(v => v.id === resultId) || null;

  const [liveTranscript, setLiveTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const shouldProcessRef = useRef<boolean>(true);
  const navigate = useNavigate();

  const updateAudioLevel = () => {
    if (analyzerRef.current) {
      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
      analyzerRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(average);
    }
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const startRecording = async () => {
    setLiveTranscript("");
    shouldProcessRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up audio analyzer
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      updateAudioLevel();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleStopRecording;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setLiveTranscript(currentTranscript);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      mediaRecorder.start();
      setIsRecording(true);
      setResultId(null);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
        toast.error("Microphone access denied. Please grant permission.");
      } else {
        toast.error("Could not access microphone: " + err.message);
      }
    }
  };

  const stopRecording = (process: boolean = true) => {
    shouldProcessRef.current = process;
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
    
    if (!process) {
      setLiveTranscript("");
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        shouldProcessRef.current = false;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStopRecording = async () => {
    if (!shouldProcessRef.current) return;
    
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (!base64data) throw new Error("Failed to read audio blob");

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              inlineData: {
                data: base64data,
                mimeType: "audio/webm",
              }
            },
            {
              text: `Analyze this audio vent/mushaira. Provide the precise transcription (with Roman Urdu/Hinglish interpretation if present). Detect the emotional tone (e.g. Melancholy, Hype, Zen, Chaos, Khuwar / Exhausted) and energy level (1-10). Suggest UI transformations: color (hex code depending on vibe), spacing (wide or tight), animation_speed (float, e.g. 3.0 for calm, 0.5 for fast). CRITICAL INSTRUCTION: If the vibe is 'rushed', 'anxious' or 'chaos', counteract it with calming UI (slow animation_speed like 5.0, 'wide' spacing, and soothing colors). If the vibe is 'excited' or 'hype', enhance it with energetic UI (fast animation_speed like 0.8, 'tight' spacing, and vibrant colors). For context, here is a rough live speech-to-text transcript you can use to correct or expand upon: "${liveTranscript}"`
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transcription: { type: Type.STRING, description: "Transcription of the audio including Roman Urdu/Hinglish phrases" },
                tone: { type: Type.STRING, description: "The overarching tone (e.g. Melancholy, Hype, Zen, Chaos, Khuwar / Exhausted)" },
                energyLevel: { type: Type.NUMBER, description: "Energy level from 1 to 10" },
                sentiment: { type: Type.STRING, description: "Short description of the sentiment" },
                culturalContext: { type: Type.STRING, description: "Explanation of any cultural nuances (e.g., 'Khuwar / Exhausted' acting as feeling exhausted)" },
                verse: {
                  type: Type.OBJECT,
                  description: "A poetic synthesis (Qalam) representing the user's emotion",
                  properties: {
                    romanUrdu: { type: Type.STRING, description: "Roman Urdu Couplet" },
                    urduScript: { type: Type.STRING, description: "Native Urdu Script Couplet" },
                    englishTranslation: { type: Type.STRING, description: "A deeply rhythmic and soul-heavy English Translation" }
                  },
                  required: ["romanUrdu", "urduScript", "englishTranslation"]
                },
                uiState: {
                  type: Type.OBJECT,
                  properties: {
                    color: { type: Type.STRING, description: "Hex color representing the vibe (e.g. #8EBCFF for calm, #FF6B6B for chaos)" },
                    spacing: { type: Type.STRING, description: "Spacing recommendation: 'wide' or 'tight'" },
                    animationSpeed: { type: Type.NUMBER, description: "Animation duration in seconds (larger = calmer, smaller = frantic)" }
                  },
                  required: ["color", "spacing", "animationSpeed"]
                }
              },
              required: ["transcription", "tone", "energyLevel", "sentiment", "culturalContext", "uiState", "verse"]
            }
          }
        });

        const data = JSON.parse(response.text.trim());
        
        // Format the Qalam verse from structured data
        const formattedVerse = `${data.verse.romanUrdu}\n\n${data.verse.urduScript}\n\n${data.verse.englishTranslation}`;
        
        // Remove the inner verse object from data and replace with formatted string
        const vibeData = { ...data, verse: formattedVerse };
        
        addVibe(vibeData).then((newVibeId) => {
          setResultId(newVibeId);
          setIsProcessing(false);
          toast.success("Vibe crystallized. Aks & Qalam generated.");

          // Also push this synthesis explicitly into the Qalam archive for standalone access
          useQalamStore.getState().addEntry({
            note: data.transcription,
            verse: formattedVerse,
          });

          // Fire and forget image generation
          generateAksArt(`A representation of a vibe: ${data.tone}. Sentiment: ${data.sentiment}. Transcription: ${data.transcription}`)
            .then(imgUrl => updateVibeImage(newVibeId, imgUrl))
            .catch(console.error);
        });

      };
    } catch (error: any) {
      console.error("Analysis failed:", error);
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota") || error?.status === "RESOURCE_EXHAUSTED") {
        toast.error("Zehn is taking a breather. The API quota has been exceeded. Please try again soon.");
      } else {
        toast.error("Failed to analyze audio. Please try again.");
      }
      setIsProcessing(false);
    }
  };

  // Determine dynamic styling based on result
  const animationDuration = result ? `${result.uiState.animationSpeed}s` : '3s';
  const pulseDuration = result ? `${result.uiState.animationSpeed * 0.8}s` : '2s';
  const bgColorStyle = result ? { backgroundColor: result.uiState.color, opacity: 0.15 } : { backgroundColor: 'var(--color-accent-rose)', opacity: 0.2 };
  const pulseColorStyle = result ? { backgroundColor: result.uiState.color, opacity: 0.3 } : { backgroundColor: 'var(--color-accent-rose)', opacity: 0.4 };

  const containerSpacing = result?.uiState.spacing === 'wide' ? 'space-y-12' : 'space-y-6';
  const dynamicSize = 120 + (audioLevel * 0.5); // Range from 120 to ~200+ depending on volume

  return (
    <div className={cn("flex h-full flex-col transition-all duration-1000 pb-16 z-10", containerSpacing, result ? "pt-0" : "pt-8")}>
      <div className="flex flex-col space-y-2 z-20 transition-all duration-1000 px-2">
        <div className="flex items-start space-x-3">
          <Mic className="w-8 h-8 text-text-primary flex-shrink-0 mt-0.5" />
          <div className="flex items-baseline space-x-3 -translate-y-1">
            <h1 className="text-4xl font-sans font-semibold tracking-tighter text-text-primary leading-none drop-shadow-sm">Sada</h1>
            <span className="text-2xl font-serif text-text-secondary font-light">صدا</span>
          </div>
        </div>
        <p className="text-[14px] font-medium text-text-secondary tracking-wide uppercase">
          Emotional Texture
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center transition-all duration-1000">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="relative flex items-center justify-center w-full max-w-xs"
            >
              <div 
                className={cn("absolute rounded-full transition-all duration-75", isRecording ? "animate-ping" : "")} 
                style={{ ...bgColorStyle, width: isRecording ? dynamicSize + 40 : 176, height: isRecording ? dynamicSize + 40 : 176, animationDuration: isRecording ? '1.5s' : animationDuration }}
              />
              <div 
                className={cn("absolute rounded-full transition-all duration-75", isRecording ? "animate-ping" : "animate-pulse")} 
                style={{ ...pulseColorStyle, width: isRecording ? dynamicSize : 128, height: isRecording ? dynamicSize : 128, animationDuration: isRecording ? '1s' : pulseDuration }}
              />
              
              <button 
                onClick={() => isRecording ? stopRecording(true) : startRecording()}
                disabled={isProcessing}
                className={cn(
                  "relative z-10 w-20 h-20 text-white flex items-center justify-center rounded-full shadow-lg transition-all",
                  isProcessing ? "bg-text-tertiary cursor-not-allowed scale-95" : "bg-accent-red hover:scale-105",
                  isRecording && "scale-110 shadow-xl"
                )}
              >
                {isProcessing ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isRecording ? (
                  <div className="w-8 h-8 bg-white rounded-sm" />
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                )}
              </button>
              
              <AnimatePresence>
                {isRecording && !isProcessing && (
                  <motion.button
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => stopRecording(false)}
                    className="absolute -bottom-16 text-[10px] font-bold uppercase tracking-widest text-[#4a4a4a] hover:text-red-500 transition-colors bg-black/5 hover:bg-red-50 px-4 py-2 rounded-full border border-black/10 hover:border-red-200 shadow-sm"
                  >
                    Cancel
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex-1 flex flex-col items-center px-4"
            >
              <motion.div 
                className="absolute inset-0 z-0 pointer-events-none opacity-20 transition-colors duration-[3s]"
                style={{ backgroundColor: result.uiState.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
              />

              <div className="relative z-10 bg-surface/80 backdrop-blur-md border border-border p-8 rounded-3xl w-full shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary">Detected Vibe</span>
                  <div 
                    className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold text-white shadow-sm"
                    style={{ backgroundColor: result.uiState.color }}
                  >
                    {formatTone(result.tone)}
                  </div>
                </div>

                <div className="max-h-[25vh] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                  <p className="text-xl font-serif leading-relaxed text-text-body italic">
                    "{result.transcription}"
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary uppercase tracking-widest font-medium">Energy Level</span>
                    <span className="font-bold text-text-primary px-3 py-1 bg-surface-hover rounded-full">
                      {result.energyLevel}/10
                    </span>
                  </div>

                  <div className="bg-surface-hover rounded-2xl p-4 mt-4">
                    <h4 className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest mb-2">Cultural Subtext</h4>
                    <p className="text-xs text-text-body leading-relaxed">{result.culturalContext}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 sm:gap-0">
                  <button 
                    onClick={() => setResultId(null)}
                    className="text-xs uppercase tracking-widest font-bold text-text-secondary hover:text-text-primary transition-colors border-b border-transparent hover:border-text-primary pb-1"
                  >
                    Reset & Vent Again
                  </button>
                  <div className="flex space-x-6">
                    <button 
                      onClick={() => navigate('/app/qalam', { state: { openLatest: true } })}
                      className="text-xs uppercase tracking-widest font-bold text-text-primary hover:text-text-secondary transition-colors border-b border-transparent hover:border-text-secondary pb-1"
                    >
                      View Qalam
                    </button>
                    <button 
                      onClick={() => navigate('/app')}
                      className="text-xs uppercase tracking-widest font-bold text-text-primary hover:text-text-secondary transition-colors border-b border-transparent hover:border-text-secondary pb-1"
                    >
                      View Aks
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!result && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-16 text-sm text-text-secondary font-serif italic text-center max-w-[280px]"
            >
              {isRecording 
                ? (liveTranscript || "Listening... Let it out.") 
                : isProcessing 
                  ? "Analyzing the texture of your voice..." 
                  : "Tap to vent. We'll listen to the noise to find the feeling."}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

