// src/components/AdminGate.tsx
import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("app_admins")
        .select("email")
        .eq("email", user.email)
        .maybeSingle();

      setAllowed(!!data && !error);
      setLoading(false);
    };
    check();
  }, []);

  if (loading) return <div className="p-6">جارِ التحقق…</div>;
  if (!allowed) return <div className="p-6">غير مصرح لك بالدخول</div>;

  return <>{children}</>;
}
