// src/pages/Login.tsx
import { useState } from "react";
import supabase from "../lib/supabaseClient";
import React from "react";


export default function Login() {
  const [email, setEmail] = useState("");

  const sendMagic = async () => {
    if (!email.trim()) return;
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/admin",
      },
    });
    alert("تم إرسال رابط تسجيل الدخول إلى ايميلك. افحص بريدك.");
  };

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">تسجيل دخول الإدارة</h1>
      <input
        className="border rounded w-full p-2 mb-3"
        placeholder="ادخل ايميلك"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        dir="ltr"
      />
      <button onClick={sendMagic} className="px-4 py-2 bg-indigo-600 text-white rounded">
        إرسال رابط الدخول
      </button>
    </div>
  );
}
