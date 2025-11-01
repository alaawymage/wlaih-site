import { useEffect, useMemo, useState } from "react";
import supabase from "./lib/supabaseClient";
import "./index.css";
import logoUrl from "/logo-wlaih.svg";

/* =========================
   Types
========================= */
type Difficulty = "easy" | "medium" | "hard";

type Category = {
  id: string;
  title: string;
  slug: string | null;
  is_active: boolean;
};

type Question = {
  id: string;
  category_id: string;
  text: string;
  answer: string;
  difficulty: Difficulty;
  is_active: boolean;
};

type CategoryWithQuestions = Category & {
  questions: Question[];
};

/* =========================
   Helpers
========================= */
const difficultyToPoints = (d: Difficulty) =>
  d === "easy" ? 200 : d === "medium" ? 400 : 600;

/** ترتيب صعوبات موحّد (لترتيب الكروت 200 ثم 400 ثم 600) */
const byDifficulty = (a: Question, b: Question) => {
  const map: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
  return map[a.difficulty] - map[b.difficulty];
};

/* =========================
   App
========================= */
export default function App() {
  const [categories, setCategories] = useState<CategoryWithQuestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // حالة السؤال المفتوح
  const [selected, setSelected] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // نقاط الفرق (محلية مبدئية)
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // 1) الفئات
        const { data: cats, error: catsErr } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("title", { ascending: true });

        if (catsErr) throw catsErr;

        // 2) الأسئلة
        const { data: qs, error: qsErr } = await supabase
          .from("questions")
          .select("*")
          .eq("is_active", true)
          .order("difficulty", { ascending: true });

        if (qsErr) throw qsErr;

        // 3) ربط الأسئلة مع الفئات
        const grouped: CategoryWithQuestions[] =
          (cats || []).map((c) => ({
            ...c,
            questions: (qs || [])
              .filter((q) => q.category_id === c.id)
              .sort(byDifficulty),
          })) || [];

        setCategories(grouped);
      } catch (e: any) {
        setErrorMsg(e?.message || "خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // عدد الأعمدة (لضبط الشبكة)
  const columns = useMemo(
    () => Math.min(Math.max(categories.length, 1), 6),
    [categories.length]
  );

  const openQuestion = (q: Question) => {
    setSelected(q);
    setShowAnswer(false);
  };

  const closeQuestion = () => {
    setSelected(null);
    setShowAnswer(false);
  };

  const awardToA = () => {
    if (!selected) return;
    setScoreA((s) => s + difficultyToPoints(selected.difficulty));
    closeQuestion();
  };

  const awardToB = () => {
    if (!selected) return;
    setScoreB((s) => s + difficultyToPoints(selected.difficulty));
    closeQuestion();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      {/* ===== Header ===== */}
      <header className="w-full border-b bg-white/75 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="ولـيّه" className="w-9 h-9" />
            <h1 className="text-2xl font-extrabold tracking-tight">ولـيّه</h1>
          </div>

          <div className="flex items-center gap-2">
            <ScoreBadge label="الفريق A" score={scoreA} />
            <ScoreBadge label="الفريق B" score={scoreB} />
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 pt-6 pb-16">
        {loading && (
          <div className="rounded-xl border bg-white p-6 text-center shadow-sm">
            جارِ تحميل البيانات…
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm text-rose-700">
            حدث خطأ: {errorMsg}
          </div>
        )}

        {!loading && !errorMsg && (
          <>
            {/* شبكة الفئات */}
            <div
              className={`grid gap-4 sm:gap-6`}
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b bg-slate-50">
                    <h2 className="font-semibold">{cat.title}</h2>
                    <div className="text-[11px] text-slate-500">
                      {cat.questions.length} سؤال متاح
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {cat.questions.length === 0 && (
                      <div className="text-xs text-slate-500">
                        لا توجد أسئلة في هذه الفئة.
                      </div>
                    )}

                    {/* كروت النقاط (200/400/600) فقط */}
                    {cat.questions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => openQuestion(q)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold
                                   hover:bg-slate-50 transition shadow-sm"
                      >
                        {difficultyToPoints(q.difficulty)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* تلميح وسط الصفحة */}
            <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm text-center">
              <p className="text-sm text-slate-600">
                ابدأ باختيار فئة ثم اضغط على سؤال لإظهاره. 👋
                <br />
                المقدم يعتمد النقاط شفهيًا بعد إظهار الإجابة.
              </p>
            </div>
          </>
        )}
      </main>

      {/* ===== Footer ===== */}
      <footer className="max-w-6xl mx-auto px-4 pb-10 text-center">
        <div className="text-xs text-slate-500">
          © ولـيّه 2025 — جميع الحقوق محفوظة
        </div>
      </footer>

      {/* ===== Modal: السؤال/الإجابة ===== */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-base font-bold">
                سؤال بقيمة {difficultyToPoints(selected.difficulty)} نقطة
              </h3>
              <button
                onClick={closeQuestion}
                className="text-slate-500 hover:text-slate-700"
                aria-label="إغلاق"
              >
                إغلاق
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="text-lg leading-8">{selected.text}</div>

              {!showAnswer ? (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                  >
                    إظهار الإجابة
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-sm text-emerald-700 mb-1">
                    الإجابة الصحيحة:
                  </div>
                  <div className="text-xl font-bold">{selected.answer}</div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex flex-wrap items-center gap-2">
              <button
                onClick={awardToA}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              >
                اعتماد النقاط للفريق A
              </button>
              <button
                onClick={awardToB}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                اعتماد النقاط للفريق B
              </button>
              <div className="ms-auto">
                <button
                  onClick={closeQuestion}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-800 text-sm hover:bg-slate-200"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== Small UI piece ====== */
function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-sm font-bold">{score}</div>
    </div>
  );
}
