// src/pages/Login.tsx
// src/Login.tsx

// src/Login.tsx
// src/Login.tsx
import { useState } from "react";
import { supabase } from "../supabaseClient";




export default function Login() {
  const [email, setEmail] = useState("");

  const sendMagic = async () => {
    if (!email.trim()) return;

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    alert("👌 تم إرسال رابط تسجيل الدخول إلى بريدك");
  };

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">تسجيل الدخول للمشرف</h1>

      <input
        className="border rounded px-3 py-2 w-full mb-3"
        placeholder="بريدك الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />



      <button
        className="bg-black text-white rounded px-4 py-2"
        onClick={sendMagic}
      >
        إرسال الرابط
      </button>
    </div>
  );
}
