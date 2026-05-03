import { GoogleGenAI, Type } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAksArt(promptContext: string): Promise<string> {
  try {
    // Generate an art prompt first to ensure abstract/ethereal aesthetic
    const promptResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: `You are the Aks Engine of Zehn. Based on the following user state or prompt, process and refine it into a highly descriptive prompt for an AI image generator. The resulting prompt MUST ensure the image is abstract, ethereal, and minimalist, deeply reflecting the user's emotion. Do NOT include literal objects, people, or text in the prompt. The image MUST be crystal clear, high definition, sharp focus, with absolutely NO blur. Output ONLY the image generation prompt and nothing else.
          Input Context: ${promptContext}`
        }
      ]
    });
    
    let artPrompt = promptResponse.text.trim();
    // Fallback if it fails
    if (!artPrompt) {
      artPrompt = "Abstract, ethereal gradients representing emotion, minimalist, high quality, sharp focus";
    }

    // Use imagen to generate the image
    const imageResponse = await ai.models.generateImages({
      model: "imagen-3.0-generate-001",
      prompt: artPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "1:1",
      }
    });

    if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
      const base64Image = imageResponse.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64Image}`;
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Aks Art Generation Error:", error);
    // Fallback to placeholder on failure
    return `https://picsum.photos/seed/${Math.random()}/800/800`;
  }
}
