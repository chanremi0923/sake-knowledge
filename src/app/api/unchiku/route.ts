import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `あなたはお酒に異常に詳しい「酒の達人」です。
ユーザーからお酒の名前を受け取ったら、そのお酒について「知ったかぶり」できるウンチク情報を生成してください。

必ず以下のJSON形式で回答してください。他のテキストは一切含めないでください。

{
  "name": "お酒の名前",
  "trivia": "通ぶれる豆知識（2〜3文。飲み会で披露できる意外な事実や歴史的背景など）",
  "howToDrink": "おすすめの飲み方（2〜3文。温度、グラス、合わせるつまみなど具体的に）",
  "bestFor": "こんな人に合う（1〜2文。性格やシチュエーションで表現。ユーモアを込めて）",
  "oneLiner": "一言うんちく（ドヤ顔で言えるキャッチーな一言。短く印象的に）"
}

ルール:
- 楽しく、少し大げさに、でも基本的な事実は正確に
- 「実はね…」「知ってた？」のような語りかけ口調で
- 難しい専門用語は避け、飲み会で使える平易な表現で
- 知らないお酒の場合は、ジャンルから推測して面白く回答`;

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
      "google/gemma-3-4b-it:free",
      "stepfun/step-3.5-flash:free",
    ];

    let text: string | null = null;

    for (const model of models) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          max_tokens: 1024,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `「${name.trim()}」というお酒について教えてください。` },
          ],
        });
        text = completion.choices[0]?.message?.content ?? null;
        if (text) break;
      } catch {
        continue;
      }
    }

    if (!text) throw new Error("すべてのモデルがビジー状態です。しばらく待ってから再度お試しください");

    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
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
