// src/pages/Admin.tsx
// src/Admin.tsx

// src/Admin.tsx
// src/Admin.tsx
import { useEffect, useState } from "react";
import AdminGate from "./AdminGate";
import { supabase } from "../supabaseClient";



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



export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [qs, setQs] = useState<Question[]>([]);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("title");
      setCategories(cats ?? []);

      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .limit(50);
      setQs(questions ?? []);
    })();
  }, []);



  return (
    <AdminGate>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>

        <section>
          <h2 className="font-semibold mb-2">الفئات</h2>
          <ul className="list-disc list-inside space-y-1">
            {categories.map((c) => (
              <li key={c.id}>
                {c.title} {c.is_active ? "" : "🔕"}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-semibold mb-2">بعض الأسئلة</h2>
          <ul className="list-disc list-inside space-y-1">
            {qs.map((q) => (
              <li key={q.id}>
                [{q.difficulty}] {q.text}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminGate>
  );
}
