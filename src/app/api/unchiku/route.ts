import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `あなたはお酒に異常に詳しい「酒の達人」です。
ユーザーからお酒の名前や画像を受け取ったら、そのお酒について「知ったかぶり」できるウンチク情報を生成してください。

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
- 画像の場合はまずお酒を特定してから回答
- 知らないお酒の場合は、ジャンルから推測して面白く回答`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, image } = body as {
      name?: string;
      image?: string;
    };

    if (!name && !image) {
      return NextResponse.json(
        { error: "お酒の名前か画像を入力してください" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (image) {
      const base64Match = image.match(
        /^data:(image\/[a-zA-Z+]+);base64,(.+)$/
      );
      if (base64Match) {
        parts.push({
          inlineData: {
            mimeType: base64Match[1],
            data: base64Match[2],
          },
        });
      }
      parts.push({
        text: name
          ? `この画像のお酒について教えてください。名前は「${name}」です。`
          : "この画像のお酒について教えてください。画像からお酒を特定して回答してください。",
      });
    } else {
      parts.push({
        text: `「${name}」というお酒について教えてください。`,
      });
    }

    const result = await model.generateContent({
      systemInstruction: SYSTEM_PROMPT,
      contents: [{ role: "user", parts }],
    });

    const text = result.response.text();
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
