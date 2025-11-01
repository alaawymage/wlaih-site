// src/pages/Admin.tsx
import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";
import AdminGate from "../components/AdminGate";

type Difficulty = "easy" | "medium" | "hard";

type Category = {
  id: string;
  title: string;
  image_url: string | null;
  is_active: boolean;
};

type Question = {
  id: string;
  category_id: string;
  text: string;
  answer: string;
  difficulty: Difficulty;
  is_active: boolean;
  options: string[] | null;
};

import React from "react";

export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      <p className="mt-2 text-slate-600">صفحة أدمن مؤقتة للتجربة.</p>
    </div>
  );
}


function Panel() {
  const [cats, setCats] = useState<Category[]>([]);
  const [qs, setQs] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [qText, setQText] = useState("");
  const [qAnswer, setQAnswer] = useState("");
  const [qDiff, setQDiff] = useState<Difficulty>("easy");
  const [qOptions, setQOptions] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    const { data: c } = await supabase
      .from("categories")
      .select("*")
      .order("title", { ascending: true });

    const { data: q } = await supabase
      .from("questions")
      .select("*")
      .order("difficulty", { ascending: true });

    setCats(c || []);
    setQs(q || []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addCategory = async () => {
    if (!title.trim()) return;
    const { error } = await supabase
      .from("categories")
      .insert({ title, is_active: true, image_url: imageUrl || null });
    if (error) alert(error.message);
    setTitle(""); setImageUrl("");
    refresh();
  };

  const addQuestion = async () => {
    if (!activeCat || !qText.trim() || !qAnswer.trim()) return;
    const optionsArr = qOptions
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    const { error } = await supabase.from("questions").insert({
      category_id: activeCat,
      text: qText,
      answer: qAnswer,
      difficulty: qDiff,
      is_active: true,
      options: optionsArr.length ? optionsArr : null,
    });
    if (error) alert(error.message);
    setQText(""); setQAnswer(""); setQDiff("easy"); setQOptions("");
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold mb-6">لوحة الإدارة</h1>

      {loading ? (
        <div>جارِ التحميل…</div>
      ) : (
        <>
          {/* الفئات */}
          <section className="mb-10">
            <h2 className="font-bold mb-3">الفئات</h2>
            <div className="flex gap-3 mb-3">
              <input
                className="border rounded p-2 flex-1"
                placeholder="عنوان الفئة"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="border rounded p-2 flex-1"
                placeholder="رابط صورة (اختياري)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                dir="ltr"
              />
              <button onClick={addCategory} className="px-4 py-2 bg-emerald-600 text-white rounded">
                إضافة فئة
              </button>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cats.map((c) => (
                <div key={c.id} className="border rounded p-3">
                  <div className="font-semibold">{c.title}</div>
                  {c.image_url && (
                    <img src={c.image_url} className="mt-2 rounded" />
                  )}
                  <div className="text-xs text-slate-500 mt-2">
                    {qs.filter((q) => q.category_id === c.id).length} سؤال
                  </div>
                  <button
                    className={`mt-2 text-sm px-3 py-1 rounded ${activeCat === c.id ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
                    onClick={() => setActiveCat(c.id)}
                  >
                    تحرير الأسئلة
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* أسئلة الفئة المحددة */}
          {activeCat && (
            <section className="mb-12">
              <h2 className="font-bold mb-3">
                الأسئلة — {cats.find((x) => x.id === activeCat)?.title}
              </h2>

              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <textarea
                  className="border rounded p-2"
                  placeholder="نص السؤال"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                />
                <textarea
                  className="border rounded p-2"
                  placeholder="الإجابة"
                  value={qAnswer}
                  onChange={(e) => setQAnswer(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <label>الصعوبة:</label>
                  <select
                    className="border rounded p-2"
                    value={qDiff}
                    onChange={(e) => setQDiff(e.target.value as any)}
                  >
                    <option value="easy">200 (easy)</option>
                    <option value="medium">400 (medium)</option>
                    <option value="hard">600 (hard)</option>
                  </select>
                </div>
                <textarea
                  className="border rounded p-2"
                  placeholder={"الاختيارات (اختياري) — سطر لكل خيار.\nمثال:\nخيار 1\nخيار 2\nخيار 3\nخيار 4"}
                  value={qOptions}
                  onChange={(e) => setQOptions(e.target.value)}
                />
              </div>

              <button onClick={addQuestion} className="px-4 py-2 bg-indigo-600 text-white rounded">
                إضافة سؤال
              </button>

              <div className="mt-6">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <div key={d} className="mb-6">
                    <div className="font-semibold mb-2">
                      {d === "easy" ? "200" : d === "medium" ? "400" : "600"} نقطة
                    </div>
                    <div className="space-y-2">
                      {qs
                        .filter((q) => q.category_id === activeCat && q.difficulty === d)
                        .map((q) => (
                          <div key={q.id} className="border rounded p-2">
                            <div className="text-sm">{q.text}</div>
                            <div className="text-xs text-emerald-700 mt-1">الإجابة: {q.answer}</div>
                            {q.options?.length ? (
                              <div className="text-xs text-slate-600 mt-1">
                                اختيارات: {q.options.join(" | ")}
                              </div>
                            ) : null}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
