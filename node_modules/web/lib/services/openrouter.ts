import type { Card } from "@/lib/db/schema";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface EnrichmentResult {
  translation: string;
  exampleTarget: string;
  exampleNative: string;
  phonetic: string;
  partOfSpeech: string;
  imageUrl: string | null;
}

export async function enrichCardWithLLM(
  term: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string
): Promise<EnrichmentResult> {
  // Use free model from OpenRouter
  const model = "google/gemini-flash-1.5";

  const prompt = `You are a language learning assistant. For the word "${term}" (${sourceLang} → ${targetLang}), provide:

1. Translation to ${targetLang}
2. IPA phonetic transcription
3. Part of speech
4. One simple example sentence in ${sourceLang} using this word (A1-A2 level)
5. Translation of that sentence to ${targetLang}
6. A detailed image generation prompt (in English) that visually represents the meaning of "${term}". Make it concrete, specific, and suitable for flashcard learning.

Respond ONLY in this JSON format:
{
  "translation": "...",
  "phonetic": "...",
  "partOfSpeech": "...",
  "exampleTarget": "...",
  "exampleNative": "...",
  "imagePrompt": "..."
}`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://click-speak.vercel.app",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from LLM");
    }

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/({[\s\S]*})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const parsed = JSON.parse(jsonStr);

    // Generate image using Pollinations.ai (free, no API key needed)
    let imageUrl: string | null = null;
    if (parsed.imagePrompt) {
      const encodedPrompt = encodeURIComponent(parsed.imagePrompt);
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
    }

    return {
      translation: parsed.translation || "",
      exampleTarget: parsed.exampleTarget || "",
      exampleNative: parsed.exampleNative || "",
      phonetic: parsed.phonetic || "",
      partOfSpeech: parsed.partOfSpeech || "",
      imageUrl,
    };
  } catch (error) {
    console.error("LLM enrichment failed:", error);
    throw error;
  }
}

// Alternative: Use pollinations directly for image generation
export function generateImageUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Date.now()}`;
}

// Simple fetch with fallback for free models
export async function fetchWithFallback(
  term: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string
): Promise<Partial<EnrichmentResult>> {
  const freeModels = [
    "google/gemini-flash-1.5",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
  ];

  for (const model of freeModels) {
    try {
      const result = await tryEnrichWithModel(term, sourceLang, targetLang, apiKey, model);
      if (result.translation) {
        return result;
      }
    } catch (e) {
      console.warn(`Model ${model} failed, trying next...`);
      continue;
    }
  }

  throw new Error("All free models failed");
}

async function tryEnrichWithModel(
  term: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string,
  model: string
): Promise<Partial<EnrichmentResult>> {
  const prompt = `Word: "${term}" (${sourceLang} → ${targetLang})

Provide JSON:
{
  "translation": "translation to ${targetLang}",
  "phonetic": "IPA pronunciation",
  "partOfSpeech": "noun/verb/adj/etc",
  "exampleTarget": "simple sentence in ${sourceLang}",
  "exampleNative": "translation to ${targetLang}",
  "imageDescription": "visual description for image generation"
}`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) return {};

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return {};

  try {
    const match = content.match(/({[\s\S]*})/);
    if (!match) return {};
    const parsed = JSON.parse(match[1]);
    
    return {
      translation: parsed.translation,
      exampleTarget: parsed.exampleTarget,
      exampleNative: parsed.exampleNative,
      phonetic: parsed.phonetic,
      partOfSpeech: parsed.partOfSpeech,
      imageUrl: parsed.imageDescription ? generateImageUrl(parsed.imageDescription) : null,
    };
  } catch {
    return {};
  }
}
