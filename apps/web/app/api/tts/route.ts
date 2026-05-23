import { NextRequest, NextResponse } from "next/server";

const VOICE_MAP: Record<string, string> = {
  es: "es-ES-ElviraNeural",
  en: "en-US-JennyNeural",
  ru: "ru-RU-SvetlanaNeural",
  fr: "fr-FR-DeniseNeural",
  de: "de-DE-KatjaNeural",
  it: "it-IT-ElsaNeural",
  pt: "pt-BR-FranciscaNeural",
  ja: "ja-JP-NanamiNeural",
  zh: "zh-CN-XiaoxiaoNeural",
  ko: "ko-KR-SunHiNeural",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const lang = searchParams.get("lang");
  const voiceId = searchParams.get("voiceId");

  if (!text || !lang) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Параметры text и lang обязательны" } },
      { status: 400 }
    );
  }

  const key = process.env.AZURE_TTS_KEY;
  const region = process.env.AZURE_TTS_REGION;

  if (!key || !region) {
    return new NextResponse(null, { status: 204 });
  }

  const voice = voiceId || VOICE_MAP[lang] || "en-US-JennyNeural";

  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">
      <voice name="${voice}">${escapeXml(text)}</voice>
    </speak>
  `.trim();

  try {
    const res = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        },
        body: ssml,
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      return new NextResponse(null, { status: 204 });
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
