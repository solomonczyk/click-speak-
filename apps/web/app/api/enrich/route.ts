import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  term: z.string().min(1).max(200).trim(),
  sourceLang: z.string().length(2),
  targetLang: z.string().length(2),
  useLLM: z.boolean().optional().default(false),
  openRouterKey: z.string().optional(),
});

async function lookupDictionary(term: string, lang: string) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(term)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || null;
    const meaning = entry.meanings?.[0];
    const definition = meaning?.definitions?.[0];

    return {
      phonetic,
      partOfSpeech: meaning?.partOfSpeech || null,
      exampleTarget: definition?.example || null,
    };
  } catch {
    return null;
  }
}

async function translateDeepL(text: string, sourceLang: string, targetLang: string) {
  const key = process.env.DEEPL_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        auth_key: key,
        text,
        source_lang: sourceLang.toUpperCase(),
        target_lang: targetLang.toUpperCase(),
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.translations?.[0]?.text || null;
  } catch {
    return null;
  }
}

// Free LLM enrichment via OpenRouter
async function enrichWithLLM(
  term: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string
) {
  const model = "google/gemini-flash-1.5";

  const prompt = `You are a language learning assistant. For the word "${term}" (${sourceLang} → ${targetLang}), provide:

1. Translation to ${targetLang}
2. IPA phonetic transcription
3. Part of speech (noun/verb/adjective/adverb/etc)
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
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://click-speak.vercel.app",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    // Parse JSON from response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/({[\s\S]*})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const parsed = JSON.parse(jsonStr);

    // Generate image URL using Pollinations.ai (free)
    let imageUrl: string | null = null;
    if (parsed.imagePrompt) {
      const encodedPrompt = encodeURIComponent(parsed.imagePrompt);
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Date.now()}`;
    }

    return {
      translation: parsed.translation || "",
      phonetic: parsed.phonetic || null,
      partOfSpeech: parsed.partOfSpeech || null,
      exampleTarget: parsed.exampleTarget || null,
      exampleNative: parsed.exampleNative || null,
      imageUrl,
    };
  } catch (error) {
    console.error("LLM enrichment failed:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Неверные параметры", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { term, sourceLang, targetLang, useLLM, openRouterKey } = parsed.data;
    const warnings: string[] = [];

    // If LLM enrichment is requested and API key is provided
    if (useLLM && openRouterKey) {
      const llmResult = await enrichWithLLM(term, sourceLang, targetLang, openRouterKey);
      
      if (llmResult) {
        return NextResponse.json({
          term,
          translation: llmResult.translation,
          exampleTarget: llmResult.exampleTarget,
          exampleNative: llmResult.exampleNative,
          partOfSpeech: llmResult.partOfSpeech,
          phonetic: llmResult.phonetic,
          imageUrl: llmResult.imageUrl,
          cefrLevel: null,
          audioUrl: null,
          partial: false,
          warnings: [],
          enrichedBy: "llm",
        });
      } else {
        warnings.push("LLM_FAILED");
      }
    }

    // Fallback to dictionary + translation
    const [dictResult, translation] = await Promise.all([
      lookupDictionary(term, sourceLang),
      translateDeepL(term, sourceLang, targetLang),
    ]);

    let exampleNative: string | null = null;
    if (dictResult?.exampleTarget && translation) {
      exampleNative = await translateDeepL(dictResult.exampleTarget, sourceLang, targetLang);
    }

    if (!dictResult) warnings.push("DICTIONARY_FAILED");
    if (!translation) warnings.push("TRANSLATE_FAILED");

    const partial = warnings.length > 0;

    return NextResponse.json({
      term,
      translation: translation || "",
      exampleTarget: dictResult?.exampleTarget || null,
      exampleNative,
      partOfSpeech: dictResult?.partOfSpeech || null,
      phonetic: dictResult?.phonetic || null,
      imageUrl: null,
      cefrLevel: null,
      audioUrl: null,
      partial,
      warnings,
      enrichedBy: "dictionary",
    });
  } catch (e) {
    console.error("Enrich error:", e);
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message: "Ошибка обработки запроса" } },
      { status: 502 }
    );
  }
}
