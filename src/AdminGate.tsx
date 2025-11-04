// src/components/AdminGate.tsx
// src/AdminGate.tsx

// src/AdminGate.tsx
// src/AdminGate.tsx
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";




export default function AdminGate({ children }: PropsWithChildren) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setAllowed(false);

      const { data, error } = await supabase
        .from("app_admins")
        .select("email")
        .eq("email", user.email)
        .maybeSingle();

      if (error) {
        console.error(error);
        setAllowed(false);
      } else {
        setAllowed(!!data);
      }
    })();
  }, []);

  if (allowed === null) {
    return <div className="p-6">جاري التحقق…</div>;
  }


  if (!allowed) {
    return <div className="p-6">الدخول للمشرفين فقط.</div>;
  }


  return <>{children}</>;
}
