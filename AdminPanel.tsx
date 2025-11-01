// src/AdminPanel.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './lib/supabaseClient';

// ===== Types =====
type Category = {
  id: string;
  title: string;
  slug: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};
type Question = {
  id: string;
  category_id: string;
  text: string;
  answer: string;
  options: string[] | null; // اختياريات للمساعدة
  points: 200 | 400 | 600;
  is_active: boolean;
  created_at: string;
};

// تنسيق بسيط
const Card: React.FC<React.PropsWithChildren<{title: string}>> = ({title, children}) => (
  <div className="p-4 rounded-2xl shadow border bg-white">
    <div className="font-bold mb-3">{title}</div>
    {children}
  </div>
);

export default function AdminPanel() {
  const [cats, setCats] = useState<Category[]>([]);
  const [qs, setQs] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const [catForm, setCatForm] = useState<Partial<Category>>({ title: '', slug: '', is_active: true });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const catImageRef = useRef<HTMLInputElement>(null);

  const [qForm, setQForm] = useState<Partial<Question>>({
    text: '', answer: '', points: 200, options: null, is_active: true, category_id: ''
  });
  const [editingQId, setEditingQId] = useState<string | null>(null);

  const pointsBuckets = useMemo(() => [200, 400, 600] as const, []);

  // ===== Load =====
  async function loadAll() {
    setLoading(true);
    const { data: cData, error: cErr } = await supabase.from('categories').select('*').order('created_at', {ascending:false});
    if (cErr) alert(cErr.message);
    else setCats(cData as Category[]);

    const { data: qData, error: qErr } = await supabase.from('questions').select('*').order('created_at', {ascending:false});
    if (qErr) alert(qErr.message);
    else setQs(qData as Question[]);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  // ===== Helpers =====
  function slugify(s: string) {
    return s?.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '') ?? '';
  }
  function clearCatForm() {
    setCatForm({ title: '', slug: '', is_active: true, image_url: '' });
    setEditingCatId(null);
    if (catImageRef.current) catImageRef.current.value = '';
  }
  function clearQForm() {
    setQForm({ text: '', answer: '', points: 200, options: null, is_active: true, category_id: '' });
    setEditingQId(null);
  }

  // ===== Categories CRUD =====
  async function upsertCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      let image_url = catForm.image_url || null;

      // رفع صورة إن وجدت
      const file = catImageRef.current?.files?.[0];
      if (file) {
        const ext = file.name.split('.').pop();
        const filePath = `cats/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('category-images').upload(filePath, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('category-images').getPublicUrl(filePath);
        image_url = pub.publicUrl;
      }

      const payload = {
        title: catForm.title?.trim() || '',
        slug: slugify(catForm.slug || catForm.title || ''),
        image_url,
        is_active: !!catForm.is_active,
      };

      if (editingCatId) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCatId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }

      clearCatForm();
      await loadAll();
    } catch (err:any) {
      alert(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  async function editCat(c: Category) {
    setCatForm(c);
    setEditingCatId(c.id);
  }
  async function deleteCat(id: string) {
    if (!confirm('حذف الفئة وكل أسئلتها؟')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert(error.message);
    else loadAll();
  }

  // ===== Questions CRUD =====
  async function upsertQuestion(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        category_id: qForm.category_id!,
        text: (qForm.text || '').trim(),
        answer: (qForm.answer || '').trim(),
        options: qForm.options ?? null,
        points: Number(qForm.points) as 200|400|600,
        is_active: !!qForm.is_active,
      };
      if (editingQId) {
        const { error } = await supabase.from('questions').update(payload).eq('id', editingQId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert(payload);
        if (error) throw error;
      }
      clearQForm();
      await loadAll();
    } catch (err:any) {
      alert(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }
  function editQ(q: Question) {
    setQForm(q);
    setEditingQId(q.id);
  }
  async function deleteQ(id: string) {
    if (!confirm('حذف السؤال؟')) return;
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) alert(error.message);
    else loadAll();
  }

  // ===== Random pick preview (للتأكد) =====
  function sample(catId: string, pts: 200|400|600) {
    const pool = qs.filter(q => q.category_id === catId && q.points === pts && q.is_active);
    if (pool.length === 0) return '— لا يوجد سؤال بهذه النقاط —';
    const r = pool[Math.floor(Math.random()*pool.length)];
    return r.text;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="w-10 h-10 rounded-lg" />
          <h1 className="text-2xl font-extrabold">لوحة التحكم — وليّه</h1>
        </div>
        <a href="/" className="text-sm underline">الرجوع للعبة</a>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* فئات */}
        <Card title="إدارة الفئات">
          <form onSubmit={upsertCategory} className="space-y-3">
            <input className="w-full border rounded p-2" placeholder="اسم الفئة"
              value={catForm.title ?? ''} onChange={e=>setCatForm(v=>({...v,title:e.target.value}))} />
            <input className="w-full border rounded p-2" placeholder="Slug (اختياري)"
              value={catForm.slug ?? ''} onChange={e=>setCatForm(v=>({...v,slug:e.target.value}))} />
            <input ref={catImageRef} type="file" accept="image/*" className="w-full border rounded p-2" />
            <label className="inline-flex items-center gap-2 select-none">
              <input type="checkbox" checked={!!catForm.is_active}
                onChange={e=>setCatForm(v=>({...v,is_active:e.target.checked}))}/>
              فعّال
            </label>
            <div className="flex gap-2">
              <button disabled={loading} className="px-4 py-2 rounded bg-black text-white">
                {editingCatId ? 'تحديث الفئة' : 'إضافة فئة'}
              </button>
              {editingCatId && (
                <button type="button" className="px-4 py-2 rounded border" onClick={clearCatForm}>إلغاء</button>
              )}
            </div>
          </form>

          <hr className="my-4" />
          <div className="space-y-2 max-h-80 overflow-auto">
            {cats.map(c=>(
              <div key={c.id} className="flex items-center justify-between border rounded p-2">
                <div className="flex items-center gap-3">
                  {c.image_url ? <img src={c.image_url} className="w-10 h-10 rounded object-cover"/> : <div className="w-10 h-10 bg-gray-100 rounded"/>}
                  <div>
                    <div className="font-bold">{c.title}</div>
                    <div className="text-xs text-gray-500">{c.slug}</div>
                    <div className="text-xs text-gray-500 mt-1">عينة 200: {sample(c.id,200)} </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded border" onClick={()=>editCat(c)}>تعديل</button>
                  <button className="px-3 py-1 rounded border text-red-600" onClick={()=>deleteCat(c.id)}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* أسئلة */}
        <Card title="إدارة الأسئلة">
          <form onSubmit={upsertQuestion} className="space-y-3">
            <select className="w-full border rounded p-2"
              value={qForm.category_id ?? ''} onChange={e=>setQForm(v=>({...v,category_id:e.target.value}))}>
              <option value="" disabled>اختر الفئة</option>
              {cats.map(c=> <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            <textarea className="w-full border rounded p-2" placeholder="نص السؤال"
              value={qForm.text ?? ''} onChange={e=>setQForm(v=>({...v,text:e.target.value}))}/>

            <textarea className="w-full border rounded p-2" placeholder="الإجابة"
              value={qForm.answer ?? ''} onChange={e=>setQForm(v=>({...v,answer:e.target.value}))}/>

            <input className="w-full border rounded p-2" placeholder='وسيلة مساعدة: اختيارات بصيغة ["A","B","C","D"] (اختياري)'
              value={qForm.options ? JSON.stringify(qForm.options) : ''}
              onChange={e=>{
                const v = e.target.value.trim();
                try { setQForm(f=>({...f, options: v? JSON.parse(v): null})); }
                catch { setQForm(f=>({...f, options: null})); }
              }}/>

            <div className="flex items-center gap-3">
              {pointsBuckets.map(p=>(
                <label key={p} className={`px-3 py-1 rounded border cursor-pointer ${qForm.points===p?'bg-black text-white':''}`}>
                  <input type="radio" name="pts" className="hidden"
                    checked={qForm.points===p} onChange={()=>setQForm(v=>({...v, points:p}))}/>
                  {p} نقطة
                </label>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 select-none">
              <input type="checkbox" checked={!!qForm.is_active}
                onChange={e=>setQForm(v=>({...v,is_active:e.target.checked}))}/>
              فعّال
            </label>

            <div className="flex gap-2">
              <button disabled={loading || !qForm.category_id} className="px-4 py-2 rounded bg-black text-white">
                {editingQId ? 'تحديث السؤال' : 'إضافة سؤال'}
              </button>
              {editingQId && (
                <button type="button" className="px-4 py-2 rounded border" onClick={clearQForm}>إلغاء</button>
              )}
            </div>
          </form>

          <hr className="my-4" />
          <div className="space-y-2 max-h-80 overflow-auto">
            {qs.slice(0,100).map(q=>(
              <div key={q.id} className="border rounded p-2">
                <div className="text-xs text-gray-500">{pointsBuckets.includes(q.points as any)? q.points : ''} نقطة</div>
                <div className="font-bold">{q.text}</div>
                <div className="text-sm text-green-700 mt-1">الإجابة: {q.answer}</div>
                {q.options && <div className="text-xs text-gray-600 mt-1">اختيارات: {q.options.join(' / ')}</div>}
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1 rounded border" onClick={()=>editQ(q)}>تعديل</button>
                  <button className="px-3 py-1 rounded border text-red-600" onClick={()=>deleteQ(q.id)}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <footer className="text-center text-xs text-gray-500 pt-4">
        © {new Date().getFullYear()} وليّه — جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
