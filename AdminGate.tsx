import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

type Props = { children: React.ReactNode };

// إيميلات المالكين من الـ ENV (تفيد لو بتضيف أكثر من إيميل)
const ALLOWED = (import.meta.env.VITE_ADMIN_EMAIL || "")
  .toLowerCase()
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export default function AdminGate({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // راقب جلسة المستخدم
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserEmail(data.user?.email ?? null);
      setLoading(false);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // شاشة انتظار
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        جاري التحميل...
      </div>
    );
  }

  // إذا ما في جلسة: اعرض تسجيل الدخول (ماچك لينك)
  if (!userEmail) {
    const sendOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg(null);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`, // يرجعك لنفس الصفحة بعد الضغط على الرابط
        },
      });
      if (error) setErrorMsg(error.message);
      else setSent(true);
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm bg-white">
          <h1 className="text-xl font-bold mb-2 text-center">تسجيل دخول الإدارة</h1>
          <p className="text-sm text-gray-600 mb-4 text-center">
            أدخل إيميلك لتستلم رابط الدخول (Magic Link)
          </p>

          {sent ? (
            <div className="text-green-600 text-center">
              تم إرسال الرابط إلى بريدك الإلكتروني. افحص الإيميل واضغط الرابط للمتابعة.
            </div>
          ) : (
            <form onSubmit={sendOtp} className="space-y-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
              <button
                type="submit"
                className="w-full rounded-lg bg-black text-white py-2 hover:opacity-90"
              >
                إرسال رابط الدخول
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // السماح فقط للإيميلات المحددة
  const allowed = ALLOWED.includes(userEmail.toLowerCase());
  if (!allowed) {
    return (
      <div className="min-h-screen grid place-items-center text-red-600">
        غير مصرح بالدخول ({userEmail})
      </div>
    );
  }

  // لو كل شيء تمام.. اعرض لوحة التحكم
  return <>{children}</>;
}
