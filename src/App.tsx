
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * لعبة «ولِيِّه» – موقع رسمي (React + Tailwind + Vite)
 * - صور للفئات ممكن تضيفها لاحقًا (حاليًا Basic)
 * - الأزرار تعرض النقاط فقط في عناوينها (بدون كلمة سهل/وسط/صعب)
 * - أسئلة دينية: الزيارة الناحية المقدسة + أدعية مشهورة + سيرة أهل البيت
 * - خانة تصحيح/اعتماد الإجابة للمضيف (منح نقاط مخصّصة)
 */

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u0671]/g;
const normalizeArabic = (s: string) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[\u0640]/g, "")
    .replace(/\s+/g, " ");

const cls = (...xs: (string | false | undefined)[]) => xs.filter(Boolean).join(" ");

type Q = {
  id: string;
  text: string;
  answer: string;
  accepted?: string[];
  points: number;
  difficulty: "easy" | "medium" | "hard";
  options?: string[];
  _visibleOptions?: string[];
  _used?: boolean;
};
type Cat = { id: string; title: string; color: string; image?: string; questions: Q[] };

const DATA: { categories: Cat[] } = {
  categories: [
    {
      id: "general",
      title: "عام",
      color: "bg-sky-100",
      questions: [
        { id: "g-e1", text: "ما هي عاصمة الكويت؟", answer: "الكويت", points: 100, difficulty: "easy", options: ["الكويت", "الرياض", "مسقط", "الدوحة"] },
        { id: "g-e2", text: "أكبر قارة في العالم؟", answer: "آسيا", points: 100, difficulty: "easy", options: ["أوروبا", "أفريقيا", "آسيا", "أستراليا"] },
        { id: "g-m1", text: "السنة التي استقلت فيها الكويت؟", answer: "1961", points: 200, difficulty: "medium" },
        { id: "g-m2", text: "كم عدد الكواكب في المجموعة الشمسية؟", answer: "8", points: 200, difficulty: "medium" },
        { id: "g-h1", text: "أطول نهر في العالم بحسب أغلب المراجع الحديثة؟", answer: "النيل", points: 300, difficulty: "hard" },
        { id: "g-h2", text: "العالم الذي اكتشف قانون الطفو؟", answer: "أرخميدس", points: 300, difficulty: "hard" },
      ],
    },
    {
      id: "ziyarat",
      title: "زيارات وأدعية وسيرة",
      color: "bg-emerald-100",
      questions: [
        {
          id: "zi-e1",
          text: "الزيارة الناحية المقدسة تُنسب لأي إمام؟",
          answer: "الإمام المهدي",
          accepted: ["المهدي", "الإمام المهدي", "محمد بن الحسن", "الحجة", "صاحب الزمان"],
          points: 100, difficulty: "easy",
        },
        {
          id: "zi-e2",
          text: "ما اسم دعاء ليالي القدر الذي يبدأ بـ (يا مَن هو)؟",
          answer: "دعاء الجوشن الكبير",
          accepted: ["الجوشن الكبير", "دعاء الجوشن الكبير", "الجوشن"],
          points: 100, difficulty: "easy",
        },
        {
          id: "zi-m1",
          text: "من الذي علّم كُميل بن زياد الدعاء المعروف بدعاء كميل؟",
          answer: "الإمام علي",
          accepted: ["علي", "أمير المؤمنين", "الإمام علي بن أبي طالب"],
          points: 200, difficulty: "medium",
        },
        {
          id: "zi-m2",
          text: "دعاء أبي حمزة الثمالي يُقرأ غالبًا في أي شهر؟",
          answer: "رمضان",
          accepted: ["رمضان", "شهر رمضان"],
          points: 200, difficulty: "medium",
        },
        {
          id: "zi-h1",
          text: "الزيارة الناحية تُقرأ في أي مناسبة متعلّقة بالإمام الحسين؟",
          answer: "عاشوراء",
          accepted: ["عاشوراء", "يوم عاشوراء", "العاشر من محرم"],
          points: 300, difficulty: "hard",
        },
        {
          id: "zi-h2",
          text: "ما الاسم الكامل لأبي حمزة الثمالي؟",
          answer: "ثابت بن دينار",
          accepted: ["ثابت بن دينار", "أبو حمزة الثمالي"],
          points: 300, difficulty: "hard",
        },
      ],
    },
    {
      id: "cars",
      title: "سيارات",
      color: "bg-amber-100",
      questions: [
        { id: "c-e1", text: "شركة تنتج موديل (كورولا)", answer: "تويوتا", points: 100, difficulty: "easy" },
        { id: "c-e2", text: "علامة (النجمة الثلاثية)", answer: "مرسيدس", points: 100, difficulty: "easy" },
        { id: "c-m1", text: "SUV فخم من لينكولن موديله؟", answer: "أفياتور", points: 200, difficulty: "medium" },
        { id: "c-m2", text: "بلد شركة (بي إم دبليو)", answer: "ألمانيا", points: 200, difficulty: "medium" },
        { id: "c-h1", text: "معنى حرف (R) في تصنيف الإطارات 275/40R22؟", answer: "راديال", points: 300, difficulty: "hard" },
        { id: "c-h2", text: "شركة (جينيسيس) تابعة لأي مجموعة؟", answer: "هيونداي", points: 300, difficulty: "hard" },
      ],
    },
    {
      id: "celeb",
      title: "مشاهير",
      color: "bg-rose-100",
      questions: [
        { id: "ce-e1", text: "ممثل شخصية (آيرون مان)", answer: "روبرت داوني", points: 100, difficulty: "easy" },
        { id: "ce-e2", text: "مغني (Blinding Lights)", answer: "ذا ويكند", points: 100, difficulty: "easy" },
        { id: "ce-m1", text: "مخرج فيلم (Tenet)", answer: "كريستوفر نولان", points: 200, difficulty: "medium" },
        { id: "ce-m2", text: "مؤسس شركة تسلا", answer: "إيلون ماسك", points: 200, difficulty: "medium" },
        { id: "ce-h1", text: "فرقة كورية شهيرة من 3 حروف", answer: "BTS", points: 300, difficulty: "hard" },
        { id: "ce-h2", text: "مغني الراب (إمينيم) اسمه الأول؟", answer: "مارشال", points: 300, difficulty: "hard" },
      ],
    },
    {
      id: "series",
      title: "مسلسلات",
      color: "bg-purple-100",
      questions: [
        { id: "s-e1", text: "مدينة مسلسل فريندز؟", answer: "نيويورك", points: 100, difficulty: "easy" },
        { id: "s-e2", text: "بطل مسلسل بريكنغ باد؟", answer: "والتر وايت", points: 100, difficulty: "easy" },
        { id: "s-m1", text: "بيت الورق أصله؟", answer: "إسباني", points: 200, difficulty: "medium" },
        { id: "s-m2", text: "مسلسل كوري شهير ألعاب مميتة", answer: "سكوييد غيم", points: 200, difficulty: "medium" },
        { id: "s-h1", text: "كم موسم لمسلسل لوست؟", answer: "6", points: 300, difficulty: "hard" },
        { id: "s-h2", text: "مخرج دارك؟", answer: "باران بو أودار", points: 300, difficulty: "hard" },
      ],
    },
    {
      id: "movies",
      title: "أفلام",
      color: "bg-lime-100",
      questions: [
        { id: "m-e1", text: "مخرج Inception؟", answer: "كريستوفر نولان", points: 100, difficulty: "easy" },
        { id: "m-e2", text: "Avatar من إخراج؟", answer: "جيمس كاميرون", points: 100, difficulty: "easy" },
        { id: "m-m1", text: "جائزة الأوسكار تسمى؟", answer: "أكاديمي أوورد", points: 200, difficulty: "medium" },
        { id: "m-m2", text: "عدد أفلام هاري بوتر الرئيسية؟", answer: "8", points: 200, difficulty: "medium" },
        { id: "m-h1", text: "أقدم مهرجان سينمائي دولي؟", answer: "البندقية", points: 300, difficulty: "hard" },
        { id: "m-h2", text: "فيلم العراب بالإنجليزي؟", answer: "The Godfather", points: 300, difficulty: "hard" },
      ],
    },
  ],
};

const TEAM_A = "الفريق A";
const TEAM_B = "الفريق B";
const defaultLifelines = () => ({ options: 1, block: 1, steal: 1 });

export default function App() {
  const [adminMode, setAdminMode] = useState(false);
  const [teams, setTeams] = useState([
    { name: TEAM_A, score: 0, lifelines: defaultLifelines() },
    { name: TEAM_B, score: 0, lifelines: defaultLifelines() },
  ]);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const currentTeam = teams[currentTeamIdx];
  const otherTeamIdx = 1 - currentTeamIdx;
  const otherTeam = teams[otherTeamIdx];

  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<{ categoryId: string; q: Q } | null>(null);
  const [answerInput, setAnswerInput] = useState("");

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isStealWindow, setIsStealWindow] = useState(false);
  const [stealByIdx, setStealByIdx] = useState<number | null>(null);

  const [overrideAnswer, setOverrideAnswer] = useState("");
  const [overridePoints, setOverridePoints] = useState("");

  const startTimer = (secs: number) => {
    clearInterval(timerRef.current);
    setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          onTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (!isPaused) {
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeTimer = () => {
    if (isPaused && timeLeft > 0) {
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            onTimeUp();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const resetBoard = () => {
    clearInterval(timerRef.current);
    setTeams([
      { name: TEAM_A, score: 0, lifelines: defaultLifelines() },
      { name: TEAM_B, score: 0, lifelines: defaultLifelines() },
    ]);
    setCurrentTeamIdx(0);
    setUsedQuestionIds(new Set());
    setSelected(null);
    setAnswerInput("");
    setTimeLeft(0);
    setIsPaused(false);
    setIsStealWindow(false);
    setStealByIdx(null);
    setOverrideAnswer("");
    setOverridePoints("");
  };

  const categories = DATA.categories;
  const availableByCat = useMemo(() => {
    const map: Record<string, Q[]> = {};
    for (const c of categories) map[c.id] = c.questions.filter((q) => !usedQuestionIds.has(q.id));
    return map;
  }, [usedQuestionIds]);

  const pickQuestion = (categoryId: string, q: Q) => {
    setSelected({ categoryId, q });
    setAnswerInput("");
    setIsStealWindow(false);
    setStealByIdx(null);
    setOverrideAnswer("");
    setOverridePoints("");
    startTimer(60);
  };

  const onTimeUp = () => {
    if (!isStealWindow && selected) {
      setCurrentTeamIdx((i) => 1 - i);
      setIsStealWindow(true);
      startTimer(30);
    } else {
      endRound(false);
    }
  };

  const isCorrect = (input: string, q: Q) => {
    const A = normalizeArabic(input);
    const correct = normalizeArabic(q.answer);
    if (A === correct) return true;
    if (Array.isArray(q.accepted)) return q.accepted.map(normalizeArabic).includes(A);
    return false;
  };

  const checkAnswer = (byIdx = currentTeamIdx) => {
    if (!selected) return;
    if (isCorrect(answerInput, selected.q)) {
      awardPoints(byIdx, selected.q.points);
      endRound(true);
    } else {
      if (!isStealWindow) {
        setCurrentTeamIdx((i) => 1 - i);
        setIsStealWindow(true);
        startTimer(30);
      } else {
        endRound(false);
      }
    }
  };

  const awardPoints = (teamIdx: number, pts: number) => {
    setTeams((ts) => ts.map((t, i) => (i === teamIdx ? { ...t, score: t.score + (Number(pts) || 0) } : t)));
  };

  const endRound = (answered: boolean) => {
    clearInterval(timerRef.current);
    if (selected) setUsedQuestionIds((prev) => new Set(prev).add(selected.q.id));
    setSelected(null);
    setAnswerInput("");
    setIsPaused(false);
    setIsStealWindow(false);
    setStealByIdx(null);
    setOverrideAnswer("");
    setOverridePoints("");
    if (!answered) setCurrentTeamIdx((i) => 1 - i);
  };

  const useOptions = () => {
    const idx = currentTeamIdx;
    if (!selected) return;
    if (teams[idx].lifelines.options <= 0) return;

    if (selected.q.options && selected.q.options.length >= 3) {
      const correct = selected.q.answer;
      const wrongs = selected.q.options.filter((o) => normalizeArabic(o) !== normalizeArabic(correct));
      const oneWrong = wrongs[Math.floor(Math.random() * wrongs.length)];
      selected.q._visibleOptions = shuffle([correct, oneWrong]);
    } else {
      selected.q._visibleOptions = [selected.q.answer];
    }

    setTeams((ts) => ts.map((t, i) => (i === idx ? { ...t, lifelines: { ...t.lifelines, options: t.lifelines.options - 1 } } : t)));
  };

  const useBlock = () => {
    const idx = currentTeamIdx;
    if (!selected) return;
    if (teams[idx].lifelines.block <= 0) return;
    pauseTimer();
    setIsStealWindow(false);
    setTeams((ts) => ts.map((t, i) => (i === idx ? { ...t, lifelines: { ...t.lifelines, block: t.lifelines.block - 1 } } : t)));
  };

  const trySteal = () => {
    const idx = otherTeamIdx;
    if (!selected) return;
    if (teams[idx].lifelines.steal <= 0) return;
    if (isPaused) return;

    setStealByIdx(idx);
    setIsStealWindow(true);
    clearInterval(timerRef.current);
    let stealTime = 5;
    setTimeLeft(stealTime);
    timerRef.current = setInterval(() => {
      stealTime -= 1;
      setTimeLeft(stealTime);
      if (stealTime <= 0) {
        clearInterval(timerRef.current);
        startTimer(20);
        setIsStealWindow(false);
        setStealByIdx(null);
      }
    }, 1000);

    setTeams((ts) => ts.map((t, i) => (i === idx ? { ...t, lifelines: { ...t.lifelines, steal: t.lifelines.steal - 1 } } : t)));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 md:p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">🎯 لعبة وِلِيِّه – موقعك الرسمي</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setAdminMode((v) => !v)} className={cls("px-3 py-1.5 rounded-2xl text-sm font-semibold shadow", adminMode ? "bg-slate-900 text-white" : "bg-white")}>
            وضع المُقدِّم: {adminMode ? "مفعّل" : "مقفول"}
          </button>
          <button onClick={resetBoard} className="px-3 py-1.5 rounded-2xl text-sm font-semibold shadow bg-white">إعادة ضبط</button>
        </div>
      </header>

      <TeamsBar teams={teams} currentTeamIdx={currentTeamIdx} onRename={(i, name) => setTeams((ts) => ts.map((t, idx) => (idx === i ? { ...t, name } : t)))} />

      <div className="grid md:grid-cols-6 sm:grid-cols-3 grid-cols-2 gap-3 mt-6">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} available={availableByCat[cat.id]?.length ?? 0} onPick={(q) => pickQuestion(cat.id, q)} disabled={!!selected} />
        ))}
      </div>

      {selected ? (
        <QuestionStage
          adminMode={adminMode}
          selected={selected}
          currentTeam={currentTeam}
          otherTeam={otherTeam}
          currentTeamIdx={currentTeamIdx}
          otherTeamIdx={otherTeamIdx}
          timeLeft={timeLeft}
          isPaused={isPaused}
          isStealWindow={isStealWindow}
          stealByIdx={stealByIdx}
          answerInput={answerInput}
          setAnswerInput={setAnswerInput}
          onCheck={() => checkAnswer(stealByIdx ?? currentTeamIdx)}
          onEndRound={() => endRound(false)}
          onOptions={useOptions}
          onBlock={useBlock}
          onSteal={trySteal}
          resumeTimer={resumeTimer}
          overrideAnswer={overrideAnswer}
          setOverrideAnswer={setOverrideAnswer}
          overridePoints={overridePoints}
          setOverridePoints={setOverridePoints}
          onOverrideAccept={(teamIdx: number) => {
            if (!selected) return;
            const pts = overridePoints ? Number(overridePoints) : selected.q.points;
            awardPoints(teamIdx, pts);
            endRound(true);
          }}
        />
      ) : (
        <IdleHint />
      )}

      <footer className="text-xs text-slate-500 mt-10">© {new Date().getFullYear()} Weliih – كل الحقوق محفوظة.</footer>
    </div>
  );
}

function TeamsBar({ teams, currentTeamIdx, onRename }: { teams: any[]; currentTeamIdx: number; onRename: (i: number, name: string) => void }) {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {teams.map((t, i) => (
        <div key={i} className={cls("rounded-2xl p-4 shadow bg-white border", i === currentTeamIdx ? "ring-2 ring-slate-900" : "")}>
          <div className="flex items-center justify-between">
            <input className="bg-transparent font-extrabold text-lg outline-none w-40" value={t.name} onChange={(e) => onRename(i, e.target.value)} />
            <div className="text-right">
              <div className="text-3xl font-black tabular-nums">{t.score}</div>
              <div className="text-xs text-slate-500">نقاط</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3 text-xs flex-wrap">
            <Badge>خيارات: {t.lifelines.options}</Badge>
            <Badge>بلوك: {t.lifelines.block}</Badge>
            <Badge>بوق: {t.lifelines.steal}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryCard({ cat, available, onPick, disabled }: { cat: Cat; available: number; onPick: (q: Q) => void; disabled: boolean }) {
  const grouped = useMemo(() => {
    const g: Record<"easy" | "medium" | "hard", Q[]> = { easy: [], medium: [], hard: [] };
    for (const q of cat.questions) g[q.difficulty]?.push(q);
    return g;
  }, [cat.questions]);

  return (
    <div className={cls("rounded-2xl p-4 shadow border space-y-3", cat.color)}>
      <div className="flex items-center justify-between">
        <div className="font-extrabold">{cat.title}</div>
        <Badge>{available} سؤال متاح</Badge>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <DifficultyRow list={grouped.easy} onPick={onPick} disabled={disabled} />
        <DifficultyRow list={grouped.medium} onPick={onPick} disabled={disabled} />
        <DifficultyRow list={grouped.hard} onPick={onPick} disabled={disabled} />
      </div>
    </div>
  );
}

function DifficultyRow({ list, onPick, disabled }: { list: Q[]; onPick: (q: Q) => void; disabled: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {list.map((q) => (
        <button
          key={q.id}
          disabled={disabled || q._used}
          onClick={() => onPick(q)}
          className={cls("rounded-xl p-2 text-sm font-semibold shadow bg-white text-left", (disabled || q._used) && "opacity-50 cursor-not-allowed")}
          title={`${q.points} نقطة`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate max-w-[140px]">{q.text}</span>
            <span className="text-xs font-bold">{q.points}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function QuestionStage({
  adminMode,
  selected,
  currentTeam,
  otherTeam,
  currentTeamIdx,
  otherTeamIdx,
  timeLeft,
  isPaused,
  isStealWindow,
  stealByIdx,
  answerInput,
  setAnswerInput,
  onCheck,
  onEndRound,
  onOptions,
  onBlock,
  onSteal,
  resumeTimer,
  overrideAnswer,
  setOverrideAnswer,
  overridePoints,
  setOverridePoints,
  onOverrideAccept,
}: any) {
  const q: Q = selected.q;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => setRevealed(false), [q?.id]);

  return (
    <div className="mt-8 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="rounded-2xl bg-white border shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">الدور الحالي</div>
              <div className="font-extrabold">{stealByIdx != null ? `سرقة: ${stealByIdx === 0 ? currentTeam.name : otherTeam.name}` : currentTeam.name}</div>
            </div>
            <Timer timeLeft={timeLeft} paused={isPaused} />
          </div>

          <div className="mt-4">
            <div className="text-sm text-slate-500">سؤال ({q.points} نقطة)</div>
            <div className="text-xl md:text-2xl font-black leading-relaxed mt-2">{q.text}</div>
          </div>

          {q._visibleOptions ? (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {q._visibleOptions.map((opt, i) => (
                <button key={i} className="bg-slate-100 rounded-xl p-3 text-start hover:bg-slate-200" onClick={() => setAnswerInput(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex gap-2 items-center">
            <input className="flex-1 rounded-xl border px-3 py-2 outline-none" placeholder="اكتب الإجابة هنا" value={answerInput} onChange={(e) => setAnswerInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onCheck()} />
            <button onClick={onCheck} className="rounded-xl px-4 py-2 bg-slate-900 text-white font-bold shadow">تحقق</button>
          </div>

          {/* أدوات المُضيف للتصحيح/الاعتماد */}
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">لو الإجابة تحتاج تعديل/اعتماد</div>
              <span className="text-xs text-slate-500">(للمضيف فقط)</span>
            </div>
            <div className="mt-2 grid sm:grid-cols-3 gap-2">
              <input disabled={!adminMode} className={cls("rounded-xl border px-3 py-2 outline-none", !adminMode && "opacity-50")} placeholder="تصحيح الإجابة (اختياري)" value={overrideAnswer} onChange={(e) => setOverrideAnswer(e.target.value)} />
              <input disabled={!adminMode} type="number" min="0" className={cls("rounded-xl border px-3 py-2 outline-none", !adminMode && "opacity-50")} placeholder={`نقاط (افتراضي ${q.points})`} value={overridePoints} onChange={(e) => setOverridePoints(e.target.value)} />
              <button disabled={!adminMode} onClick={() => onOverrideAccept(stealByIdx ?? currentTeamIdx)} className={cls("rounded-xl px-4 py-2 font-bold shadow", adminMode ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500")}>اعتماد ومنح نقاط</button>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">لو فيه خطأ إملائي/مرادف صحيح، تقدر تعتمد الإجابة وتحدد نقاط مخصّصة.</div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button onClick={onEndRound} className="rounded-xl px-3 py-2 bg-white border shadow text-sm font-semibold">إنهاء الجولة</button>
            <button onClick={resumeTimer} className="rounded-xl px-3 py-2 bg-white border shadow text-sm font-semibold">استئناف الوقت</button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white border shadow p-4">
          <div className="font-extrabold mb-2">⚙️ أدوات الجولة</div>
          <div className="flex flex-col gap-2">
            <button onClick={onOptions} className="rounded-xl px-3 py-2 bg-slate-100 font-semibold hover:bg-slate-200">🧩 خيارات (50/50)</button>
            <button onClick={isPaused ? resumeTimer : onBlock} className="rounded-xl px-3 py-2 bg-slate-100 font-semibold hover:bg-slate-200">{isPaused ? "▶️ استئناف المؤقّت" : "⏸️ بلوك (وقت مفتوح)"}</button>
            <button onClick={onSteal} className="rounded-xl px-3 py-2 bg-slate-100 font-semibold hover:bg-slate-200">⚡ بوق السؤال (سرقة)</button>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 leading-5">
            • «خيارات»: إن كان للسؤال خيارات، تُعرض ويُحذف نصفها تلقائياً (تبقى إجابتان).<br />
            • «بلوك»: يوقف الوقت ويمنع السرقة حتى الاستئناف.<br />
            • «بوق»: نافذة 5 ثوانٍ للفريق الآخر للمحاولة.
          </div>
        </div>

        <div className="rounded-2xl bg-white border shadow p-4">
          <div className="font-extrabold mb-2">ℹ️ معلومات</div>
          <InfoRow k="الفئة" v={selected.categoryId} />
          <InfoRow k="النقاط" v={`${q.points}`} />
        </div>
      </div>
    </div>
  );
}

function IdleHint() {
  return (
    <div className="mt-10 grid place-items-center">
      <div className="bg-white border rounded-2xl shadow p-6 text-center max-w-xl">
        <div className="text-3xl">👋</div>
        <div className="text-xl font-extrabold mt-2">ابدأ باختيار فئة ثم اضغط على سؤال</div>
        <div className="text-slate-500 mt-2 text-sm">الأزرار تعرض النقاط فقط. عند الحاجة، المضيف يقدر يصحّح الإجابة ويمنح نقاط.</div>
      </div>
    </div>
  );
}

function Timer({ timeLeft, paused }: { timeLeft: number; paused: boolean }) {
  return <div className={cls("rounded-full px-3 py-1 text-sm font-bold", paused ? "bg-amber-200" : "bg-slate-900 text-white")}>{paused ? "متوقف" : `${timeLeft}s`}</div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-white border px-2 py-0.5 shadow text-[11px]">{children}</span>;
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div className="text-slate-500">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
