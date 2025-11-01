import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function TestPage() {
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('text, answer, difficulty')
        .order('difficulty', { ascending: true })

      if (error) console.error('خطأ في جلب البيانات:', error)
      else setQuestions(data)
    }

    fetchQuestions()
  }, [])

  return (
    <div style={{ padding: '2rem', direction: 'rtl', fontFamily: 'sans-serif' }}>
      <h1>📋 اختبار الاتصال بـ Supabase</h1>
      <p>عدد الأسئلة: {questions.length}</p>
      <ul>
        {questions.map((q, i) => (
          <li key={i} style={{ marginBottom: '1rem' }}>
            <strong>السؤال:</strong> {q.text} <br />
            <strong>الإجابة:</strong> {q.answer} <br />
            <strong>الصعوبة:</strong> {q.difficulty}
          </li>
        ))}
      </ul>
    </div>
  )
}
