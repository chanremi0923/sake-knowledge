import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

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

    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (image) {
      const base64Match = image.match(
        /^data:(image\/[a-zA-Z+]+);base64,(.+)$/
      );
      if (base64Match) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: base64Match[1] as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data: base64Match[2],
          },
        });
      }
      content.push({
        type: "text",
        text: name
          ? `この画像のお酒について教えてください。名前は「${name}」です。`
          : "この画像のお酒について教えてください。画像からお酒を特定して回答してください。",
      });
    } else {
      content.push({
        type: "text",
        text: `「${name}」というお酒について教えてください。`,
      });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const result = JSON.parse(textBlock.text);
    return NextResponse.json(result);
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
