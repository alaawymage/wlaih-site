// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from './lib/supabaseClient';
import { Link } from "react-router-dom";
import AdminPanel from "./admin/AdminPanel";
import AdminGate from "./admin/AdminGate"; // 👈 جديد

export default function App() {
  // ... باقي الـ useState

  // 👇 هذا الشرط يفتح لوحة الإدارة فقط داخل Gate (بإيميلك)
  if (location.pathname === "/admin") {
    return (
      <AdminGate>
        <AdminPanel />
      </AdminGate>
    );
  }

  // ... بقية اللعبة
}



type Difficulty = "easy" | "medium" | "hard";
type Category = { id: string; title: string; image_url: string | null; is_active: boolean; };
type Question = {
  id: string; category_id: string; text: string; answer: string;
  difficulty: Difficulty; is_active: boolean; options: string[] | null;
};
type CategoryWithQuestions = Category & { questions: Question[] };

const POINTS: Record<Difficulty, number> = { easy: 200, medium: 400, hard: 600 };

export default function App() {
  const [data, setData] = useState<CategoryWithQuestions[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("title", { ascending: true });
    const { data: qs } = await supabase
      .from("questions")
      .select("*")
      .eq("is_active", true);

    const allCats = (cats || []) as Category[];
    const allQs = (qs || []) as Question[];
    const merged: CategoryWithQuestions[] = allCats.map((c) => ({
      ...c,
      questions: allQs.filter((q) => q.category_id === c.id),
    }));
    setData(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  function pickRandomQuestion(cat: CategoryWithQuestions, diff: Difficulty) {
    const pool = cat.questions.filter(
      (q) => q.difficulty === diff && !usedIds.has(q.id)
    );
    if (pool.length === 0) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  function openByPoints(cat: CategoryWithQuestions, diff: Difficulty) {
    const q = pickRandomQuestion(cat, diff);
    if (!q) {
      alert("لا يوجد سؤال متاح لهذه الدرجة (تم استخدام كل الأسئلة).");
      return;
    }
    setSelected(q);
    setShowAnswer(false);
    setShowChoices(false);
    setUsedIds((prev) => new Set(prev).add(q.id));
  }

  const shuffledChoices = useMemo(() => {
    if (!selected) return [];
    const base = selected.options?.length ? [...selected.options, selected.answer] : [];
    const unique = Array.from(new Set(base)); // لو الإجابة ضمن الخيارات
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    return unique;
  }, [selected]);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800">
      {/* الهيدر */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* لوغو بسيط بكلمة وِلِيّه */}
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-extrabold text-lg">
              و
            </div>
            <h1 className="text-xl font-extrabold tracking-wide">وِلِيّه</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/login" className="text-indigo-700 hover:underline">تسجيل دخول</Link>
            <Link to="/admin" className="text-indigo-700 hover:underline">الإدارة</Link>
          </nav>
        </div>
      </header>

      {/* الجسم */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* تعليمات قصيرة */}
        <div className="mb-5 text-sm text-slate-600">
          اضغط 200/400/600 لاختيار سؤال عشوائي من الفئة. السؤال يظهر داخل البوكس فقط.
          يمكن عرض “الاختيارات” أو إظهار “الإجابة”. النقاط: 200 / 400 / 600.
        </div>

        {loading ? (
          <div>جارِ التحميل…</div>
        ) : (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
            {data.map((cat) => (
              <div key={cat.id} className="rounded-2xl border bg-white shadow-sm">
                <div className="p-3 flex items-center justify-between border-b">
                  <div className="font-bold">{cat.title}</div>
                  {cat.image_url ? (
                    <img src={cat.image_url} className="w-10 h-10 rounded object-cover" />
                  ) : null}
                </div>
                <div className="p-3 grid grid-cols-3 gap-3">
                  {/* أزرار 200/400/600 فقط */}
                  <button onClick={() => openByPoints(cat, "easy")}
                    className="px-3 py-4 rounded-lg bg-slate-50 hover:bg-slate-100 border text-center font-bold">200</button>
                  <button onClick={() => openByPoints(cat, "medium")}
                    className="px-3 py-4 rounded-lg bg-slate-50 hover:bg-slate-100 border text-center font-bold">400</button>
                  <button onClick={() => openByPoints(cat, "hard")}
                    className="px-3 py-4 rounded-lg bg-slate-50 hover:bg-slate-100 border text-center font-bold">600</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* الفوتر */}
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-slate-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} — وِلِيّه. جميع الحقوق محفوظة.</div>
          <div className="text-[11px]">إصدار لعب جماعي شفهي — الأسئلة تُدار من لوحة الإدارة</div>
        </div>
      </footer>

      {/* المودال */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-lg">
                سؤال {POINTS[selected.difficulty]} نقطة
              </div>
              <button onClick={() => setSelected(null)}
                      className="text-slate-500 hover:text-slate-800">إغلاق</button>
            </div>

            <div className="mt-4 p-4 border rounded-lg bg-slate-50">
              <div className="leading-relaxed">{selected.text}</div>

              {/* وسيلة مساعدة: عرض الاختيارات */}
              {selected.options?.length ? (
                <button
                  onClick={() => setShowChoices(true)}
                  className="mt-3 px-3 py-2 rounded bg-amber-500 text-white text-sm"
                >
                  عرض الاختيارات
                </button>
              ) : null}

              {showChoices && shuffledChoices.length ? (
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  {shuffledChoices.map((opt, i) => (
                    <div key={i} className="border rounded p-3 text-sm bg-white">{opt}</div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                className="px-4 py-2 rounded bg-indigo-600 text-white"
                onClick={() => setShowAnswer((v) => !v)}
              >
                {showAnswer ? "إخفاء الإجابة" : "إظهار الإجابة"}
              </button>
              <button
                className="px-3 py-2 rounded border"
                onClick={() => { setSelected(null); }}
              >
                سؤال جديد
              </button>
            </div>

            {showAnswer && (
              <div className="mt-4 p-3 border rounded bg-emerald-50 text-emerald-900">
                <span className="font-bold">الإجابة: </span>
                {selected.answer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
