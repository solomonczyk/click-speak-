import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  term: z.string().min(1).max(200).trim(),
  sourceLang: z.string().length(2),
  targetLang: z.string().length(2),
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

    const { term, sourceLang, targetLang } = parsed.data;
    const warnings: string[] = [];

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
      cefrLevel: null,
      audioUrl: null,
      partial,
      warnings,
    });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message: "Ошибка обработки запроса" } },
      { status: 502 }
    );
  }
}
