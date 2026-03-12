"use client";

import { useState } from "react";

type UnchikuResult = {
  name: string;
  trivia: string;
  howToDrink: string;
  bestFor: string;
  oneLiner: string;
};

export default function Home() {
  const [sakeName, setSakeName] = useState("");
  const [result, setResult] = useState<UnchikuResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!sakeName.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/unchiku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sakeName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "エラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const cards = result
    ? [
        {
          emoji: "🍶",
          title: "通ぶれる豆知識",
          content: result.trivia,
          bg: "bg-red-lantern",
        },
        {
          emoji: "🍻",
          title: "おすすめの飲み方",
          content: result.howToDrink,
          bg: "bg-navy",
        },
        {
          emoji: "👤",
          title: "こんな人に合う",
          content: result.bestFor,
          bg: "bg-brown",
        },
        {
          emoji: "🎤",
          title: "一言うんちく",
          content: result.oneLiner,
          bg: "bg-gold",
        },
      ]
    : [];

  return (
    <main className="min-h-screen pb-16">
      {/* ヘッダー */}
      <header className="relative pt-6 pb-8 text-center">
        {/* 提灯デコレーション */}
        <div className="flex justify-center gap-6 mb-4">
          <span className="lantern-swing text-4xl inline-block">🏮</span>
          <span
            className="lantern-swing text-4xl inline-block"
            style={{ animationDelay: "0.5s" }}
          >
            🏮
          </span>
          <span
            className="lantern-swing text-4xl inline-block"
            style={{ animationDelay: "1s" }}
          >
            🏮
          </span>
        </div>

        <h1 className="font-[family-name:var(--font-yuji-boku)] text-4xl sm:text-5xl text-red-lantern mb-2">
          酒ウンチク御殿
        </h1>
        <p className="text-brown text-sm sm:text-base">
          〜 知ったかぶりの極意、ここにあり 〜
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-4">
        {/* 入力エリア */}
        <section className="bg-white/70 rounded-2xl border-3 border-brown/30 p-6 mb-8 shadow-lg">
          <h2 className="font-[family-name:var(--font-yuji-boku)] text-xl text-navy mb-4 hand-underline inline-block">
            お酒を教えてくんなまし
          </h2>

          {/* テキスト入力 */}
          <div className="mb-6">
            <label
              htmlFor="sake-name"
              className="block text-brown-light text-sm font-medium mb-1"
            >
              🍺 お酒の名前
            </label>
            <input
              id="sake-name"
              type="text"
              value={sakeName}
              onChange={(e) => setSakeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSubmit();
              }}
              placeholder="例：獺祭、ジャックダニエル、エビスビール..."
              className="w-full px-4 py-3 rounded-xl border-2 border-brown/20 bg-cream/50
                         text-brown text-lg placeholder:text-brown/30
                         focus:outline-none focus:border-red-lantern focus:ring-2 focus:ring-red-lantern/20
                         transition-all"
            />
          </div>

          {/* 送信ボタン */}
          <button
            onClick={handleSubmit}
            disabled={loading || !sakeName.trim()}
            className="w-full py-4 rounded-xl text-white text-lg font-bold
                       bg-red-lantern hover:bg-red-lantern-light
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all active:scale-[0.98]
                       shadow-md hover:shadow-lg cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">🍶</span>
                ウンチク生成中...
              </span>
            ) : (
              "🔍 ウンチクを調べる"
            )}
          </button>
        </section>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-lantern/10 border-2 border-red-lantern/30 rounded-xl p-4 mb-8 text-center">
            <p className="text-red-lantern font-medium">😵 {error}</p>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="space-y-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="loading-shimmer h-28 rounded-xl" />
            ))}
          </div>
        )}

        {/* 結果表示 */}
        {result && (
          <section>
            <h2 className="font-[family-name:var(--font-yuji-boku)] text-2xl text-center text-navy mb-6">
              ✨ 「{result.name}」のウンチク ✨
            </h2>
            <div className="space-y-4">
              {cards.map((card, i) => (
                <div
                  key={card.title}
                  className={`fade-in-up stagger-${i + 1} rounded-2xl overflow-hidden shadow-md border-2 border-brown/10`}
                >
                  <div
                    className={`${card.bg} px-4 py-2 flex items-center gap-2`}
                  >
                    <span className="text-xl">{card.emoji}</span>
                    <h3 className="text-white font-bold text-base">
                      {card.title}
                    </h3>
                  </div>
                  <div className="bg-white p-4">
                    <p
                      className={`text-brown leading-relaxed ${
                        card.title === "一言うんちく"
                          ? "font-[family-name:var(--font-yuji-boku)] text-xl text-center py-2"
                          : ""
                      }`}
                    >
                      {card.title === "一言うんちく" && "「"}
                      {card.content}
                      {card.title === "一言うんちく" && "」"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* フッター */}
      <footer className="mt-16 text-center text-brown/40 text-xs pb-4">
        <p>※ウンチクの内容はAIが生成したものです。ご利用は自己責任で。</p>
        <p className="mt-1">🍶 酒ウンチク御殿 🍶</p>
      </footer>
    </main>
  );
}
