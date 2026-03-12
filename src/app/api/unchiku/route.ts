import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `お酒の達人として回答。以下のJSON形式のみで回答し、他のテキストは含めないこと。

{"name":"正式名称","nameReading":"ひらがな読み","region":"産地","brewery":"酒蔵・メーカー","type":"種類","description":"特徴1文","trivia":"豆知識2文（飲み会で使える意外な事実）","howToDrink":"おすすめの飲み方2文（温度・グラス・つまみ）","bestFor":"こんな人に合う1文（ユーモア込み）","oneLiner":"ドヤ顔で言える一言"}

ルール: 楽しく語りかけ口調で、基本事実は正確に、専門用語は避ける`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body as { name?: string };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "お酒の名前を入力してください" },
        { status: 400 }
      );
    }

    const models = [
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "google/gemma-3-12b-it:free",
      "google/gemma-3-4b-it:free",
      "stepfun/step-3.5-flash:free",
    ];

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: `「${name.trim()}」について教えて` },
    ];

    let parsed = null;
    for (const model of models) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          max_tokens: 1024,
          messages,
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) continue;
        const cleaned = content
          .replace(/<think>[\s\S]*?<\/think>/g, "")
          .replace(/```json\n?|\n?```/g, "")
          .trim();
        parsed = JSON.parse(cleaned);
        if (parsed.name && parsed.trivia) break;
        parsed = null;
      } catch (e) {
        console.error(`Model ${model} failed:`, e instanceof Error ? e.message : e);
        continue;
      }
    }

    if (!parsed) throw new Error("すべてのモデルがビジー状態です。しばらく待ってから再度お試しください");

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `ウンチク生成に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
