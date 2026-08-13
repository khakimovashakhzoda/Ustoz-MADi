'use client';

import { useState, useEffect, useRef } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nbhzzlwjnbkpwapqtqxk.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaHp6bHdqbmJrcHdhcHF0cXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTc2MDAsImV4cCI6MjEwMjA5MzYwMH0.LqWGFDnM8louqgedx3C5GrpwdImImCs7rSdiaB_ff6w';

async function supabaseRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  if (!SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY topilmadi');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.method === 'POST' ? 'return=representation' : 'return=representation',
      ...(options.headers || {})
    },
    cache: 'no-store'
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Supabase ${response.status}`);
  return text ? JSON.parse(text) : ([] as any);
}

const supabaseGet = <T = any>(table: string, query = 'select=*') =>
  supabaseRequest<T[]>(`${table}?${query}`);

const supabasePost = <T = any>(table: string, body: any) =>
  supabaseRequest<T[]>(table, { method: 'POST', body: JSON.stringify(body) });

const supabasePatch = <T = any>(table: string, query: string, body: any) =>
  supabaseRequest<T[]>(`${table}?${query}`, { method: 'PATCH', body: JSON.stringify(body) });

const supabaseDelete = <T = any>(table: string, query: string) =>
  supabaseRequest<T[]>(`${table}?${query}`, { method: 'DELETE' });

function quoteFilterValue(value: string) {
  return encodeURIComponent(value);
}

function getYoutubeEmbedUrl(input: string) {
  const value = input.trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
      }
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2];
        if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
      }
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.split('/')[2];
        if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
      }
    }

    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
    }
  } catch {
    // URL emas bo'lsa, pastdagi original qiymat qaytariladi.
  }

  return value;
}


type SupportType = 'text' | 'image' | 'video' | 'file' | 'audio';

type SupportMessage = {
  id: string | number;
  sourceId?: string;
  sourceKind?: 'studentMessage' | 'adminReply' | 'local';
  studentEmail: string;
  sender: 'student' | 'admin';
  type: SupportType;
  text: string;
  media: string;
  fileName?: string;
  createdAt: string;
  deleted?: boolean;
};

export default function CoursesPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'courses' | 'support' | 'admin'>('courses');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLessonCourse, setSelectedLessonCourse] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeVideo, setActiveVideo] = useState<any>(null);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [newAnnouncementType, setNewAnnouncementType] = useState<'text' | 'image' | 'video' | 'audio' | 'file'>('text');
  const [newAnnouncementMedia, setNewAnnouncementMedia] = useState('');
  const [newAnnouncementFileName, setNewAnnouncementFileName] = useState('');
  const [isAnnouncementRecording, setIsAnnouncementRecording] = useState(false);
  const annMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const annAudioChunksRef = useRef<Blob[]>([]);

  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportText, setSupportText] = useState('');
  const [supportType, setSupportType] = useState<SupportType>('text');
  const [supportMedia, setSupportMedia] = useState('');
  const [supportFileName, setSupportFileName] = useState('');
  const [isSupportRecording, setIsSupportRecording] = useState(false);
  const supportRecorderRef = useRef<MediaRecorder | null>(null);
  const supportAudioChunksRef = useRef<Blob[]>([]);

  const [selectedSupportStudent, setSelectedSupportStudent] = useState('');
  const [adminSupportText, setAdminSupportText] = useState('');
  const [adminSupportType, setAdminSupportType] = useState<SupportType>('text');
  const [adminSupportMedia, setAdminSupportMedia] = useState('');
  const [adminSupportFileName, setAdminSupportFileName] = useState('');
  const [isAdminSupportRecording, setIsAdminSupportRecording] = useState(false);
  const adminSupportRecorderRef = useRef<MediaRecorder | null>(null);
  const adminSupportAudioChunksRef = useRef<Blob[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newLessonCount, setNewLessonCount] = useState(1);
  const [newLessons, setNewLessons] = useState<Array<{ title: string; videoUrl: string; description: string; resources: string }>>([
    { title: '1-Dars', videoUrl: '', description: '', resources: '' }
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ title: '', description: '', price: '' });
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonEditData, setLessonEditData] = useState({ title: '', videoUrl: '', description: '', resources: '' });

  const ADMIN_EMAIL = 'khakimovashahzoda027@gmail.com';

  const [courses, setCourses] = useState([
    {
      id: 1,
      title: 'Full-Stack Web Development',
      description: 'Noldan professional darajagacha zamonaviy veb-ilovalar yaratish.',
      price: '450,000 soʻm',
      lessons: [
        { id: 101, title: '1-Dars: Kirish va Muhitni Sozlash', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: '', resources: '' },
        { id: 102, title: '2-Dars: Asosiy komponentlar bilan ishlash', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: '', resources: '' }
      ]
    },
    {
      id: 2,
      title: 'Mobile App Creation',
      description: 'Android va iOS uchun mukammal ilovalar yaratish.',
      price: '500,000 soʻm',
      lessons: [
        { id: 201, title: '1-Dars: Mobil ilovaga kirish', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: '', resources: '' }
      ]
    }
  ]);

  const [students, setStudents] = useState<any[]>([]);
  const [profileIds, setProfileIds] = useState<Record<string, string>>({});

  const loadCoursesFromSupabase = async () => {
    try {
      const courseRows: any[] = await supabaseGet('courses', 'select=*');
      const lessonRows: any[] = await supabaseGet('lessons', 'select=*');
      if (!Array.isArray(courseRows) || courseRows.length === 0) return;

      const mapped = courseRows.map((c: any) => ({
        id: c.id,
        title: c.title ?? c.name ?? 'Kurs',
        description: c.description ?? c.desc ?? '',
        price: c.price ?? c.price_text ?? '',
        lessons: (lessonRows || [])
          .filter((l: any) => String(l.course_id ?? l.courseId ?? '') === String(c.id))
          .map((l: any) => ({
            id: l.id,
            title: l.title ?? l.name ?? 'Dars',
            videoUrl: l.video_url ?? l.videoUrl ?? l.video ?? '',
            description: l.description ?? '',
            resources: l.resources ?? l.links ?? ''
          }))
      }));
      setCourses(mapped);
    } catch (error) {
      console.warn('Supabase courses/lessons yuklanmadi, mavjud fallback saqlandi.', error);
    }
  };

  const loadProfilesFromSupabase = async () => {
    try {
      const rows: any[] = await supabaseGet('profiles', 'select=*');
      if (!Array.isArray(rows)) return;
      const map: Record<string, string> = {};
      let saved: any[] = [];
      try { saved = JSON.parse(localStorage.getItem('ustoz_madi_students') || '[]'); } catch { saved = []; }
      const mapped = rows
        .filter((p: any) => p.email)
        .map((p: any, index: number) => {
          const old = saved.find((s: any) => s.email === p.email) || {};
          map[p.email] = String(p.id ?? p.uuid ?? p.user_id ?? '');
          return {
            id: p.id ?? p.uuid ?? p.user_id ?? old.id ?? index + 1,
            email: p.email,
            joinedDate: p.joined_date ?? p.created_at ?? old.joinedDate ?? '',
            status: p.status ?? old.status ?? 'Qulflangan (Kutmoqda)',
            accessGrantedAt: p.access_granted_at ?? p.accessGrantedAt ?? old.accessGrantedAt ?? '',
            accessExpiresAt: p.access_expires_at ?? p.accessExpiresAt ?? old.accessExpiresAt ?? '',
            accessDurationDays: Number(p.access_duration_days ?? p.accessDurationDays ?? old.accessDurationDays ?? 0)
          };
        });
      if (mapped.length) {
        setStudents(mapped);
        localStorage.setItem('ustoz_madi_students', JSON.stringify(mapped));
      }
      setProfileIds(map);
    } catch (error) {
      console.warn('Supabase profiles yuklanmadi, localStorage fallback ishlaydi.', error);
    }
  };

  const loadSupportFromSupabase = async () => {
    try {
      const rows: any[] = await supabaseGet('support_tickets', 'select=*&order=created_at.asc');
      if (!Array.isArray(rows)) return;
      const emailById: Record<string, string> = {};
      Object.entries(profileIds).forEach(([email, id]) => { emailById[String(id)] = email; });
      const normalized: SupportMessage[] = [];
      rows.forEach((r: any) => {
        const email = r.student_email ?? r.email ?? emailById[String(r.user_id)] ?? '';
        if (!email) return;
        const createdAt = r.created_at ?? new Date().toISOString();
        if (r.message || r.media_url) {
          normalized.push({
            id: String(r.id ?? `local-${Date.now()}-${normalized.length}`),
            sourceId: r.id != null ? String(r.id) : undefined,
            sourceKind: r.id != null ? 'studentMessage' : 'local',
            studentEmail: email,
            sender: 'student',
            type: (r.media_type ?? 'text') as SupportType,
            text: r.message ?? '',
            media: r.media_url ?? '',
            fileName: r.file_name ?? '',
            createdAt
          });
        }
        if (r.admin_reply || r.admin_media_url) {
          normalized.push({
            id: `admin-${String(r.id ?? Date.now())}`,
            sourceId: r.id != null ? String(r.id) : undefined,
            sourceKind: r.id != null ? 'adminReply' : 'local',
            studentEmail: email,
            sender: 'admin',
            type: (r.admin_media_type ?? r.media_type ?? 'text') as SupportType,
            text: r.admin_reply ?? '',
            media: r.admin_media_url ?? '',
            fileName: r.admin_file_name ?? '',
            createdAt: r.replied_at ?? createdAt
          });
        }
      });
      setSupportMessages(normalized);
      localStorage.setItem('ustoz_madi_support', JSON.stringify(normalized));
    } catch (error) {
      console.warn('Supabase support_tickets yuklanmadi, localStorage fallback ishlaydi.', error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const email = localStorage.getItem('user_email') || 'student1@gmail.com';
      setUserEmail(email);

      const savedStudents = localStorage.getItem('ustoz_madi_students');
      if (savedStudents) setStudents(JSON.parse(savedStudents));
      else setStudents([{ id: 1, email: 'student1@gmail.com', joinedDate: '2026-08-01', status: 'Qulflangan (Kutmoqda)', accessGrantedAt: '', accessExpiresAt: '', accessDurationDays: 0 }]);

      const savedSupport = localStorage.getItem('ustoz_madi_support');
      if (savedSupport) setSupportMessages(JSON.parse(savedSupport));
      const savedAnn = localStorage.getItem('ustoz_madi_announcements');
      if (savedAnn) setAnnouncements(JSON.parse(savedAnn));

      await loadProfilesFromSupabase();
      await loadCoursesFromSupabase();
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loading) localStorage.setItem('ustoz_madi_support', JSON.stringify(supportMessages));
  }, [supportMessages, loading]);

  useEffect(() => {
    if (loading) return;
    loadSupportFromSupabase();
    const timer = window.setInterval(() => loadSupportFromSupabase(), 5000);
    return () => window.clearInterval(timer);
  }, [loading, userEmail, Object.keys(profileIds).length]);

  const updateStudentsInStorage = async (updatedList: any[]) => {
    setStudents(updatedList);
    localStorage.setItem('ustoz_madi_students', JSON.stringify(updatedList));
    const changed = updatedList;
    for (const s of changed) {
      const profileId = profileIds[s.email];
      if (!profileId) continue;
      try {
        await supabasePatch('profiles', `id=eq.${quoteFilterValue(profileId)}`, {
          status: s.status,
          access_granted_at: s.accessGrantedAt || null,
          access_expires_at: s.accessExpiresAt || null,
          access_duration_days: s.accessDurationDays || 0
        });
      } catch {
        try {
          await supabasePatch('profiles', `id=eq.${quoteFilterValue(profileId)}`, { status: s.status });
        } catch { /* profiles jadvali eski sxemada bo‘lsa local fallback saqlanadi */ }
      }
    }
  };

  const updateSupportInStorage = (updatedList: SupportMessage[]) => {
    setSupportMessages(updatedList);
    localStorage.setItem('ustoz_madi_support', JSON.stringify(updatedList));
  };

  const handleDeleteStudent = (id: number) => {
    if (confirm("Rostdan ham ushbu o'quvchini o'chirmoqchimisiz?")) {
      updateStudentsInStorage(students.filter(s => s.id !== id));
    }
  };

  const handlePaymentConfirm = async () => {
    if (userEmail && userEmail !== ADMIN_EMAIL) {
      const exists = students.find(s => s.email === userEmail);
      if (!exists) {
        const newStudent = { id: Date.now(), email: userEmail, joinedDate: new Date().toLocaleString(), status: 'Qulflangan (Kutmoqda)', accessGrantedAt: '', accessExpiresAt: '', accessDurationDays: 0 };
        try {
          const inserted: any[] = await supabasePost('profiles', { email: userEmail, status: 'Qulflangan (Kutmoqda)' });
          if (inserted?.[0]?.id) setProfileIds(prev => ({ ...prev, [userEmail]: String(inserted[0].id) }));
        } catch { /* local fallback */ }
        await updateStudentsInStorage([newStudent, ...students]);
      }
    }
    setShowPaymentModal(false);
    window.open('https://t.me/Madina_Course', '_blank');
  };

  const handleNewLessonCountChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (digitsOnly === '') {
      setNewLessonCount(0);
      setNewLessons([]);
      return;
    }
    const count = Number(digitsOnly);
    if (!Number.isSafeInteger(count) || count < 0) return;
    setNewLessonCount(count);
    setNewLessons(prev => Array.from({ length: count }, (_, index) => prev[index] || ({
      title: `${index + 1}-Dars`,
      videoUrl: '',
      description: '',
      resources: ''
    })));
  };

  const handleNewLessonCountBlur = () => {
    if (!newLessonCount || newLessonCount < 1) {
      setNewLessonCount(1);
      setNewLessons(prev => prev[0] ? [prev[0]] : [{ title: '1-Dars', videoUrl: '', description: '', resources: '' }]);
    }
  };

  const updateNewLesson = (index: number, field: 'title' | 'videoUrl' | 'description' | 'resources', value: string) => {
    setNewLessons(prev => prev.map((lesson, i) => i === index ? { ...lesson, [field]: value } : lesson));
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice.trim()) {
      alert('Kurs nomi va narxini kiriting.');
      return;
    }

    const safeLessonCount = Math.max(1, newLessonCount);
    if (newLessonCount < 1) {
      setNewLessonCount(1);
      setNewLessons(prev => prev[0] ? [prev[0]] : [{ title: '1-Dars', videoUrl: '', description: '', resources: '' }]);
    }
    const lessonDrafts = newLessons.slice(0, safeLessonCount).map((lesson, index) => ({
      title: lesson.title.trim() || `${index + 1}-Dars`,
      videoUrl: getYoutubeEmbedUrl(lesson.videoUrl),
      description: lesson.description.trim(),
      resources: lesson.resources.trim()
    }));

    const localCourse: any = {
      id: Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      price: newPrice.trim(),
      lessons: lessonDrafts.map((lesson, index) => ({ id: Date.now() + index + 1, ...lesson }))
    };

    try {
      const inserted: any[] = await supabasePost('courses', {
        title: localCourse.title,
        description: localCourse.description,
        price: localCourse.price
      });

      if (inserted?.[0]?.id) localCourse.id = inserted[0].id;

      const courseId = inserted?.[0]?.id ?? localCourse.id;
      const createdLessons: any[] = [];

      for (let index = 0; index < lessonDrafts.length; index++) {
        const lesson = lessonDrafts[index];
        try {
          const insertedLesson: any[] = await supabasePost('lessons', {
            course_id: courseId,
            title: lesson.title,
            video_url: lesson.videoUrl,
            description: lesson.description,
            resources: lesson.resources
          });
          createdLessons.push({
            id: insertedLesson?.[0]?.id ?? localCourse.lessons[index].id,
            ...lesson
          });
        } catch (lessonError) {
          console.warn(`Lesson ${index + 1} Supabase'ga saqlanmadi, local fallback ishlatildi.`, lessonError);
          createdLessons.push(localCourse.lessons[index]);
        }
      }

      localCourse.lessons = createdLessons;
    } catch (courseError) {
      console.warn("Kurs Supabase'ga saqlanmadi, local fallback ishlatildi.", courseError);
    }

    setCourses(prev => [...prev, localCourse]);
    setNewTitle('');
    setNewDesc('');
    setNewPrice('');
    setNewLessonCount(1);
    setNewLessons([{ title: '1-Dars', videoUrl: '', description: '', resources: '' }]);
    alert(`${localCourse.title} kursi ${localCourse.lessons.length} ta video darslik bilan qo‘shildi.`);
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Ushbu kursni o'chirasizmi?")) return;
    try { await supabaseDelete('courses', `id=eq.${encodeURIComponent(String(id))}`); } catch { /* local fallback */ }
    setCourses(prev => prev.filter(c => String(c.id) !== String(id)));
  };

  const toggleAccess = async (id: number, durationDays = 30) => {
    const target = students.find(s => String(s.id) === String(id));
    if (!target) return;
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + durationDays);
    const active = String(target.status || '').includes('Faol');
    const updated = students.map(s => String(s.id) === String(id)
      ? active
        ? { ...s, status: 'Qulflangan (Kutmoqda)', accessGrantedAt: '', accessExpiresAt: '', accessDurationDays: 0 }
        : { ...s, status: 'Faol (Ruxsat berilgan)', accessGrantedAt: now.toISOString(), accessExpiresAt: expires.toISOString(), accessDurationDays: durationDays }
      : s
    );
    await updateStudentsInStorage(updated);
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setEditData({ title: c.title, description: c.description, price: c.price });
  };

  const saveEdit = async (id: number) => {
    try { await supabasePatch('courses', `id=eq.${encodeURIComponent(String(id))}`, { title: editData.title, description: editData.description, price: editData.price }); } catch { /* local fallback */ }
    setCourses(prev => prev.map(c => String(c.id) === String(id) ? { ...c, ...editData } : c));
    setEditingId(null);
  };

  const startLessonEdit = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setLessonEditData({
      title: lesson.title || '',
      videoUrl: lesson.videoUrl || '',
      description: lesson.description || '',
      resources: lesson.resources || ''
    });
  };

  const saveLessonEdit = async (courseId: number, lessonId: number) => {
    try { await supabasePatch('lessons', `id=eq.${encodeURIComponent(String(lessonId))}`, { title: lessonEditData.title, video_url: getYoutubeEmbedUrl(lessonEditData.videoUrl), description: lessonEditData.description, resources: lessonEditData.resources }); } catch { /* local fallback */ }
    setCourses(prev => prev.map(c => String(c.id) === String(courseId) ? { ...c, lessons: c.lessons.map((lesson: any) => String(lesson.id) === String(lessonId) ? { ...lesson, ...lessonEditData, videoUrl: getYoutubeEmbedUrl(lessonEditData.videoUrl) } : lesson) } : c));
    setEditingLessonId(null);
    setLessonEditData({ title: '', videoUrl: '', description: '', resources: '' });
  };

  const deleteLessonInfo = async (courseId: number, lessonId: number) => {
    if (!confirm("Ushbu video darslikning tavsifi va havolalarini o'chirasizmi?")) return;
    try { await supabasePatch('lessons', `id=eq.${encodeURIComponent(String(lessonId))}`, { description: '', resources: '' }); } catch { /* local fallback */ }
    setCourses(prev => prev.map(c => String(c.id) === String(courseId) ? { ...c, lessons: c.lessons.map((lesson: any) => String(lesson.id) === String(lessonId) ? { ...lesson, description: '', resources: '' } : lesson) } : c));
  };

  const handleCopyCard = () => {
    navigator.clipboard.writeText('5614681813315631');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelection = (
    e: React.ChangeEvent<HTMLInputElement>,
    setMediaState: (val: string) => void,
    setNameState?: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaState(reader.result as string);
      if (setNameState) setNameState(file.name);
    };
    reader.readAsDataURL(file);
  };

  const startAudioRecording = async (
    setRecording: (v: boolean) => void,
    recorderRef: React.MutableRefObject<MediaRecorder | null>,
    chunksRef: React.MutableRefObject<Blob[]>,
    setMedia: (v: string) => void,
    setName?: (v: string) => void,
    setType?: (v: SupportType) => void
  ) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        alert('Bu brauzer ovoz yozishni qo‘llab-quvvatlamaydi. Chrome/Edge brauzerida qayta urinib ko‘ring.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      const supportedMime = mimeCandidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      setType?.('audio');

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        alert('Ovoz yozishda xatolik yuz berdi.');
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || supportedMime || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: finalType });
        const reader = new FileReader();
        reader.onloadend = () => {
          setMedia(reader.result as string);
          setName?.(`Ovozli xabar.${finalType.includes('mp4') ? 'mp4' : finalType.includes('ogg') ? 'ogg' : 'webm'}`);
          setType?.('audio');
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        recorderRef.current = null;
      };

      recorder.start(250);
      setRecording(true);
    } catch (error) {
      console.error('Audio recording error:', error);
      alert('Mikrofondan foydalanishga ruxsat berilmadi! Brauzer sozlamalaridan mikrofon ruxsatini yoqing.');
      setRecording(false);
    }
  };

  const stopAudioRecording = (
    setRecording: (v: boolean) => void,
    recorderRef: React.MutableRefObject<MediaRecorder | null>
  ) => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendSupportMessage = async () => {
    if (!supportText.trim() && !supportMedia) return;

    const createdAt = new Date().toISOString();
    const userId = profileIds[userEmail];
    let savedToSupabase = false;

    try {
      const inserted: any[] = await supabasePost('support_tickets', {
        user_id: userId || null,
        message: supportText,
        media_url: supportMedia || null,
        media_type: supportType,
        file_name: supportFileName || null,
        status: 'open',
        created_at: createdAt
      });
      const row = inserted?.[0];
      const msg: SupportMessage = {
        id: String(row?.id ?? Date.now()),
        sourceId: row?.id != null ? String(row.id) : undefined,
        sourceKind: row?.id != null ? 'studentMessage' : 'local',
        studentEmail: userEmail,
        sender: 'student',
        type: supportType,
        text: supportText,
        media: supportMedia,
        fileName: supportFileName,
        createdAt
      };
      updateSupportInStorage([...supportMessages, msg]);
      savedToSupabase = !!row?.id;
    } catch (error) {
      console.warn('Support xabari Supabasega yuborilmadi:', error);
      const msg: SupportMessage = {
        id: Date.now(), sourceKind: 'local', studentEmail: userEmail, sender: 'student',
        type: supportType, text: supportText, media: supportMedia, fileName: supportFileName, createdAt
      };
      updateSupportInStorage([...supportMessages, msg]);
    }

    setSupportText('');
    setSupportMedia('');
    setSupportFileName('');
    setSupportType('text');
    if (savedToSupabase) await loadSupportFromSupabase();
  };

  const sendAdminSupportMessage = async () => {
    if (!selectedSupportStudent || (!adminSupportText.trim() && !adminSupportMedia)) return;

    const userId = profileIds[selectedSupportStudent];
    let replied = false;
    let replyTicketId = '';

    try {
      const tickets: any[] = await supabaseGet(
        'support_tickets',
        `select=*&user_id=eq.${encodeURIComponent(String(userId || ''))}&order=created_at.desc&limit=1`
      );
      const latest = tickets?.[0];

      if (latest?.id != null) {
        await supabasePatch('support_tickets', `id=eq.${encodeURIComponent(String(latest.id))}`, {
          admin_reply: adminSupportText,
          admin_media_url: adminSupportMedia || null,
          admin_media_type: adminSupportType,
          admin_file_name: adminSupportFileName || null,
          status: 'answered',
          replied_at: new Date().toISOString()
        });
        replied = true;
        replyTicketId = String(latest.id);
      }
    } catch (error) {
      console.warn('Admin javobi Supabasega yozilmadi:', error);
    }

    if (!replied) {
      const msg: SupportMessage = {
        id: Date.now(), sourceKind: 'local', studentEmail: selectedSupportStudent, sender: 'admin',
        type: adminSupportType, text: adminSupportText, media: adminSupportMedia,
        fileName: adminSupportFileName, createdAt: new Date().toISOString()
      };
      updateSupportInStorage([...supportMessages, msg]);
    }

    setAdminSupportText('');
    setAdminSupportMedia('');
    setAdminSupportFileName('');
    setAdminSupportType('text');
    if (replied && replyTicketId) await loadSupportFromSupabase();
  };

  const deleteSupportMessage = async (message: SupportMessage) => {
    if (!confirm('Ushbu xabarni o‘chirmoqchimisiz?')) return;

    try {
      if (message.sourceKind === 'adminReply' && message.sourceId) {
        await supabasePatch('support_tickets', `id=eq.${encodeURIComponent(message.sourceId)}`, {
          admin_reply: null,
          admin_media_url: null,
          admin_media_type: null,
          admin_file_name: null,
          status: 'open',
          replied_at: null
        });
      } else if (message.sourceKind === 'studentMessage' && message.sourceId) {
        await supabaseDelete('support_tickets', `id=eq.${encodeURIComponent(message.sourceId)}`);
      }
    } catch (error) {
      console.error('Xabarni Supabase’dan o‘chirishda xato:', error);
      alert('Xabarni serverdan o‘chirishda xatolik yuz berdi. Supabase RLS/Delete policy ruxsatlarini tekshiring.');
      return;
    }

    setSupportMessages(prev => prev.filter(m => m.id !== message.id));
    try {
      const current = JSON.parse(localStorage.getItem('ustoz_madi_support') || '[]');
      localStorage.setItem('ustoz_madi_support', JSON.stringify(current.filter((m: SupportMessage) => m.id !== message.id)));
    } catch {}
  };

  const clearStudentSupport = async (email: string) => {
    if (!confirm(`${email} bilan barcha chat tarixini o‘chirasizmi?`)) return;
    const userId = profileIds[email];

    try {
      if (!userId) throw new Error('O‘quvchining Supabase user_id topilmadi.');
      await supabaseDelete('support_tickets', `user_id=eq.${encodeURIComponent(String(userId))}`);
    } catch (error) {
      console.error('Chat tarixini Supabase’dan o‘chirishda xato:', error);
      alert('Chat tarixini serverdan o‘chirishda xatolik yuz berdi. Supabase RLS/Delete policy ruxsatlarini tekshiring.');
      return;
    }

    setSupportMessages(prev => prev.filter(m => m.studentEmail !== email));
    try {
      const current = JSON.parse(localStorage.getItem('ustoz_madi_support') || '[]');
      localStorage.setItem('ustoz_madi_support', JSON.stringify(current.filter((m: SupportMessage) => m.studentEmail !== email)));
    } catch {}
    if (selectedSupportStudent === email) setSelectedSupportStudent('');
  };

  const clearAllSupport = async () => {
    if (!confirm("Barcha 24/7 qo‘llab-quvvatlash tarixini butunlay o‘chirasizmi?")) return;

    try {
      const rows: any[] = await supabaseGet('support_tickets', 'select=id');
      for (const row of rows || []) {
        if (row?.id != null) {
          await supabaseDelete('support_tickets', `id=eq.${encodeURIComponent(String(row.id))}`);
        }
      }
    } catch (error) {
      console.error('Barcha support tarixini Supabase’dan o‘chirishda xato:', error);
      alert('Barcha tarixni serverdan o‘chirishda xatolik yuz berdi. Supabase RLS/Delete policy ruxsatlarini tekshiring.');
      return;
    }

    setSupportMessages([]);
    localStorage.setItem('ustoz_madi_support', '[]');
    setSelectedSupportStudent('');
  };

  const handleSendAnnouncement = () => {
    if (!newAnnouncementText.trim() && !newAnnouncementMedia) return;

    const ann = {
      id: Date.now(),
      text: newAnnouncementText,
      type: newAnnouncementType,
      media: newAnnouncementMedia,
      fileName: newAnnouncementFileName,
      date: new Date().toLocaleString(),
      isDeleted: false
    };

    const updated = [ann, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('ustoz_madi_announcements', JSON.stringify(updated));
    setNewAnnouncementText('');
    setNewAnnouncementMedia('');
    setNewAnnouncementFileName('');
  };

  const handleDeleteAnnouncement = (annId: number) => {
    const updated = announcements.filter(ann => ann.id !== annId);
    setAnnouncements(updated);
    localStorage.setItem('ustoz_madi_announcements', JSON.stringify(updated));
  };

  const renderMessageMedia = (m: SupportMessage) => {
    if (!m.media) return null;
    if (m.type === 'image') return <img src={m.media} alt="Rasm" className="max-h-64 max-w-full rounded-xl border border-white/10" />;
    if (m.type === 'video') return <video src={m.media} controls className="max-h-64 max-w-full rounded-xl border border-white/10" />;
    if (m.type === 'audio') return <audio src={m.media} controls className="w-full max-w-xs" />;
    if (m.type === 'file') return <a href={m.media} download={m.fileName || 'fayl'} className="text-cyan-300 underline text-xs">📁 {m.fileName || 'Faylni ochish'}</a>;
    return null;
  };

  if (loading) {
    return <div className="min-h-screen bg-[#030712] flex items-center justify-center text-white">Yuklanmoqda...</div>;
  }

  const currentStudent = students.find(s => s.email === userEmail);
  const expired =
    userEmail !== ADMIN_EMAIL &&
    currentStudent?.accessExpiresAt &&
    new Date(currentStudent.accessExpiresAt).getTime() <= Date.now();

  if (expired && currentStudent.status.includes('Faol')) {
    const updated = students.map(s => s.id === currentStudent.id ? { ...s, status: 'Muddati tugagan' } : s);
    updateStudentsInStorage(updated);
  }

  const isBlocked = userEmail !== ADMIN_EMAIL && (currentStudent?.status === 'Muddati tugagan');
  const isAccessGranted =
    userEmail === ADMIN_EMAIL ||
    (!!currentStudent && currentStudent.status.includes('Faol') && !expired);
  const isCourseLocked = userEmail !== ADMIN_EMAIL && !isAccessGranted;

  const mySupport = supportMessages
    .filter(m => m.studentEmail === userEmail)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const supportStudents = Array.from(
    new Set(supportMessages.map(m => m.studentEmail))
  );

  const selectedChat = supportMessages
    .filter(m => m.studentEmail === selectedSupportStudent)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6 md:p-12 relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
              Ustoz MADi 🚀
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Kirilgan email: <span className="text-cyan-400">{userEmail}</span>
            </p>
          </div>

          <div className="flex bg-slate-900 rounded-2xl p-1 gap-1 border border-white/5 flex-wrap">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'courses' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
            >
              Kurslar
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${activeTab === 'support' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
            >
              24/7 Qo'llab-quvvatlash 💬
              {supportMessages.some(m => m.studentEmail === userEmail && m.sender === 'admin') && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              )}
            </button>

            {userEmail === ADMIN_EMAIL && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'admin' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
              >
                Admin Panel
              </button>
            )}
          </div>
        </header>

        {activeTab === 'courses' && (isBlocked || isCourseLocked) ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-[2.5rem] border border-red-500/20 text-center p-8 max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🚫</div>
            <h2 className="text-3xl font-black text-white mb-4">Kirish cheklangan</h2>
            <p className="text-slate-400 text-base mb-8">
              {isBlocked
                ? 'Assalomu aleykum hurmatli oʻquvchi, sizning kursni oʻrganish vaqtidagi muddatingiz tugadi!'
                : 'Sizga hozircha kursdan foydalanishga ruxsat berilmagan. Admin ruxsat berganidan keyin darslar ochiladi.'}
              {isBlocked && ' Qayta toʻlov qiling va darslarni davom ettiring.'}
            </p>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-cyan-600/20"
            >
              To'lov qilish 💳
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'support' && userEmail !== ADMIN_EMAIL && (
              <div className="max-w-4xl mx-auto bg-slate-900/60 rounded-3xl border border-cyan-500/20 overflow-hidden">
                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                  <div>
                    <h2 className="font-black text-xl">24/7 Qo'llab-quvvatlash 💬</h2>
                    <p className="text-slate-500 text-xs mt-1">Savolingizni yozing, admin shu chatning o'zida javob beradi.</p>
                  </div>
                </div>

                <div className="h-[520px] overflow-y-auto p-5 space-y-4">
                  {mySupport.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center">
                      Hozircha xabarlar yo'q.<br />Birinchi xabaringizni yuboring.
                    </div>
                  )}

                  {mySupport.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl border ${m.sender === 'student' ? 'bg-cyan-950/40 border-cyan-500/20' : 'bg-purple-950/30 border-purple-500/20'}`}>
                        <div className="text-[10px] text-slate-500 mb-2">
                          {m.sender === 'student' ? 'Siz' : 'Admin'} · {new Date(m.createdAt).toLocaleString()}
                        </div>
                        {m.text && <p className="text-sm whitespace-pre-wrap mb-2">{m.text}</p>}
                        {renderMessageMedia(m)}
                        <button
                          onClick={() => deleteSupportMessage(m)}
                          className="mt-2 text-[10px] text-red-400 hover:text-red-300"
                        >
                          O'chirish 🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-white/10 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={supportType}
                      onChange={e => {
                        setSupportType(e.target.value as SupportType);
                        setSupportMedia('');
                        setSupportFileName('');
                      }}
                      className="bg-slate-950 p-2.5 rounded-xl text-xs border border-white/10"
                    >
                      <option value="text">Matn</option>
                      <option value="image">Rasm 🖼️</option>
                      <option value="video">Video 🎬</option>
                      <option value="audio">Ovoz 🎙️</option>
                    </select>

                    <input
                      value={supportText}
                      onChange={e => setSupportText(e.target.value)}
                      placeholder="Xabaringizni yozing..."
                      className="flex-1 min-w-[180px] bg-slate-950 p-3 rounded-xl border border-white/10 text-sm"
                    />

                    <label className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-xl text-xs font-bold cursor-pointer">
                      📎 Fayl
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const isVideo = file.type.startsWith('video/');
                          setSupportType(isVideo ? 'video' : 'image');
                          handleFileSelection(e, setSupportMedia, setSupportFileName);
                        }}
                      />
                    </label>

                    <button
                      onClick={() =>
                        isSupportRecording
                          ? stopAudioRecording(setIsSupportRecording, supportRecorderRef)
                          : startAudioRecording(
                              setIsSupportRecording,
                              supportRecorderRef,
                              supportAudioChunksRef,
                              setSupportMedia,
                              setSupportFileName,
                              setSupportType
                            )
                      }
                      className={`${isSupportRecording ? 'bg-red-600 animate-pulse' : 'bg-slate-800'} px-4 py-3 rounded-xl text-xs font-bold`}
                    >
                      {isSupportRecording ? '⏹️ To‘xtatish' : '🎙️ Ovoz'}
                    </button>

                    <button onClick={sendSupportMessage} className="bg-cyan-600 hover:bg-cyan-500 px-5 py-3 rounded-xl text-xs font-bold">
                      Yuborish ➤
                    </button>
                  </div>

                  {supportMedia && (
                    <div className="text-emerald-400 text-xs">Fayl/xabar tayyor: {supportFileName || 'media'} ✅</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'support' && userEmail === ADMIN_EMAIL && (
              <div className="space-y-8">
                <div className="bg-slate-900/60 p-6 rounded-3xl border border-purple-500/20 space-y-5">
                  <div className="flex justify-between items-center gap-3 flex-wrap">
                    <div>
                      <h3 className="font-bold text-purple-200 text-xl">24/7 Qo'llab-quvvatlash 💬</h3>
                      <p className="text-slate-500 text-xs mt-1">Har bir o'quvchi bilan alohida lichka.</p>
                    </div>
                    <button onClick={clearAllSupport} className="text-red-400 text-xs border border-red-500/20 px-3 py-2 rounded-xl">
                      Barcha tarixni tozalash 🗑️
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="bg-slate-950 rounded-2xl border border-white/5 p-3 space-y-2">
                      <h4 className="text-xs font-bold text-cyan-300 px-2 py-2">O'quvchilar</h4>
                      {supportStudents.length === 0 ? (
                        <p className="text-slate-600 text-xs p-2">Hozircha xabar yo'q.</p>
                      ) : (
                        supportStudents.map(email => {
                          const unread = supportMessages.some(m => m.studentEmail === email && m.sender === 'student');
                          return (
                            <button
                              key={email}
                              onClick={() => setSelectedSupportStudent(email)}
                              className={`w-full text-left p-3 rounded-xl border transition-all ${selectedSupportStudent === email ? 'bg-cyan-950/50 border-cyan-500/30' : 'bg-slate-900 border-white/5 hover:border-cyan-500/20'}`}
                            >
                              <div className="flex justify-between gap-2">
                                <span className="text-xs text-white truncate">👤 {email}</span>
                                {unread && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {supportMessages.filter(m => m.studentEmail === email).length} ta xabar
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                      {!selectedSupportStudent ? (
                        <div className="h-[620px] flex items-center justify-center text-slate-600 text-sm text-center">
                          Chap tomondan o'quvchini tanlang.<br />
                          Shu yerda to'g'ridan-to'g'ri lichka ochiladi.
                        </div>
                      ) : (
                        <>
                          <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-white">👤 {selectedSupportStudent}</p>
                              <p className="text-[10px] text-slate-500">24/7 Support chat</p>
                            </div>
                            <button onClick={() => clearStudentSupport(selectedSupportStudent)} className="text-red-400 text-[10px]">
                              Chatni tozalash 🗑️
                            </button>
                          </div>

                          <div className="h-[420px] overflow-y-auto p-4 space-y-3">
                            {selectedChat.map(m => (
                              <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl border ${m.sender === 'admin' ? 'bg-purple-950/40 border-purple-500/20' : 'bg-cyan-950/40 border-cyan-500/20'}`}>
                                  <div className="text-[9px] text-slate-500 mb-1">
                                    {m.sender === 'admin' ? 'Admin' : 'O‘quvchi'} · {new Date(m.createdAt).toLocaleString()}
                                  </div>
                                  {m.text && <p className="text-sm whitespace-pre-wrap mb-2">{m.text}</p>}
                                  {renderMessageMedia(m)}
                                  <button onClick={() => deleteSupportMessage(m)} className="mt-2 text-[9px] text-red-400">
                                    O'chirish 🗑️
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="p-4 border-t border-white/10 space-y-2">
                            <div className="flex gap-2 flex-wrap">
                              <select
                                value={adminSupportType}
                                onChange={e => {
                                  setAdminSupportType(e.target.value as SupportType);
                                  setAdminSupportMedia('');
                                  setAdminSupportFileName('');
                                }}
                                className="bg-slate-900 p-2.5 rounded-xl text-xs border border-white/10"
                              >
                                <option value="text">Matn</option>
                                <option value="image">Rasm 🖼️</option>
                                <option value="video">Video 🎬</option>
                                <option value="audio">Ovoz 🎙️</option>
                                <option value="file">Fayl 📁</option>
                              </select>

                              <input
                                value={adminSupportText}
                                onChange={e => setAdminSupportText(e.target.value)}
                                placeholder="O'quvchiga javob yozing..."
                                className="flex-1 min-w-[160px] bg-slate-900 p-3 rounded-xl border border-white/10 text-sm"
                              />

                              <label className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-xl text-xs font-bold cursor-pointer">
                                📎 Tanlash
                                <input
                                  type="file"
                                  accept={adminSupportType === 'image' ? 'image/*' : adminSupportType === 'video' ? 'video/*' : '*/*'}
                                  className="hidden"
                                  onChange={e => handleFileSelection(e, setAdminSupportMedia, setAdminSupportFileName)}
                                />
                              </label>

                              <button
                                onClick={() =>
                                  isAdminSupportRecording
                                    ? stopAudioRecording(setIsAdminSupportRecording, adminSupportRecorderRef)
                                    : startAudioRecording(
                                        setIsAdminSupportRecording,
                                        adminSupportRecorderRef,
                                        adminSupportAudioChunksRef,
                                        setAdminSupportMedia,
                                        setAdminSupportFileName,
                                        setAdminSupportType
                                      )
                                }
                                className={`${isAdminSupportRecording ? 'bg-red-600 animate-pulse' : 'bg-purple-600'} px-4 py-3 rounded-xl text-xs font-bold`}
                              >
                                {isAdminSupportRecording ? '⏹️ To‘xtatish' : '🎙️ Ovoz'}
                              </button>

                              <button onClick={sendAdminSupportMessage} className="bg-purple-600 hover:bg-purple-500 px-5 py-3 rounded-xl text-xs font-bold">
                                Javob yuborish ➤
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'admin' && userEmail === ADMIN_EMAIL && (
              <div className="space-y-8">
                <div className="bg-slate-900/60 p-6 rounded-3xl border border-purple-500/20 space-y-4">
                  <h3 className="font-bold text-purple-200">Umumiy E'lon / Yangiliklar 📢</h3>

                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={newAnnouncementType}
                      onChange={e => {
                        setNewAnnouncementType(e.target.value as any);
                        setNewAnnouncementMedia('');
                        setNewAnnouncementFileName('');
                      }}
                      className="bg-slate-950 p-2.5 rounded-xl text-xs border border-white/10"
                    >
                      <option value="text">Matn</option>
                      <option value="image">Rasm 🖼️</option>
                      <option value="video">Video 🎬</option>
                      <option value="file">Fayl 📁</option>
                      <option value="audio">Ovoz 🎙️</option>
                    </select>

                    <input
                      value={newAnnouncementText}
                      onChange={e => setNewAnnouncementText(e.target.value)}
                      placeholder="Yangilik matni..."
                      className="flex-1 min-w-[180px] bg-slate-950 p-3 rounded-xl border border-white/10 text-sm"
                    />

                    {newAnnouncementType !== 'audio' && (
                      <label className="bg-slate-800 px-4 py-3 rounded-xl text-xs font-bold cursor-pointer">
                        📎 Fayl tanlash
                        <input
                          type="file"
                          accept={newAnnouncementType === 'image' ? 'image/*' : newAnnouncementType === 'video' ? 'video/*' : '*/*'}
                          className="hidden"
                          onChange={e => handleFileSelection(e, setNewAnnouncementMedia, setNewAnnouncementFileName)}
                        />
                      </label>
                    )}

                    {newAnnouncementType === 'audio' && (
                      <button
                        onClick={() =>
                          isAnnouncementRecording
                            ? stopAudioRecording(setIsAnnouncementRecording, annMediaRecorderRef)
                            : startAudioRecording(
                                setIsAnnouncementRecording,
                                annMediaRecorderRef,
                                annAudioChunksRef,
                                setNewAnnouncementMedia,
                                setNewAnnouncementFileName
                              )
                        }
                        className={`${isAnnouncementRecording ? 'bg-red-600 animate-pulse' : 'bg-purple-600'} px-4 py-3 rounded-xl text-xs font-bold`}
                      >
                        {isAnnouncementRecording ? "⏹️ To'xtatish" : "🎙️ Ovoz yozish"}
                      </button>
                    )}

                    <button onClick={handleSendAnnouncement} className="bg-purple-600 px-5 py-3 rounded-xl text-xs font-bold">
                      Barchaga yuborish 📢
                    </button>
                  </div>

                  <div className="space-y-2">
                    {announcements.map(ann => (
                      <div key={ann.id} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex justify-between gap-4">
                        <div className="space-y-2">
                          {ann.text && <p className="text-xs">{ann.text}</p>}
                          {ann.type === 'image' && <img src={ann.media} alt="Yangilik" className="max-h-32 rounded-lg" />}
                          {ann.type === 'video' && <video src={ann.media} controls className="max-h-32 rounded-lg" />}
                          {ann.type === 'audio' && <audio src={ann.media} controls />}
                          {ann.type === 'file' && <a href={ann.media} download={ann.fileName} className="text-cyan-300 underline text-xs">📁 {ann.fileName || 'Fayl'}</a>}
                          <p className="text-[10px] text-purple-400">{ann.date}</p>
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-400 text-xs">O'chirish 🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-6 rounded-3xl border border-purple-500/20">
                  <h3 className="font-bold text-purple-200 mb-4">O'quvchilar nazorati 👨‍🎓</h3>
                  <div className="space-y-3">
                    {students.map(s => (
                      <div key={s.id} className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-start gap-4 flex-wrap">
                          <div>
                            <p className="text-sm font-bold">{s.email}</p>
                            <p className="text-[10px] text-slate-500">Ro'yxatdan o'tgan: {s.joinedDate}</p>
                            <p className={`text-xs mt-1 ${s.status.includes('Faol') ? 'text-emerald-400' : 'text-red-400'}`}>{s.status}</p>

                            {s.accessGrantedAt && (
                              <div className="mt-2 text-[10px] text-slate-400 space-y-1">
                                <p>🟢 Ruxsat berilgan: <span className="text-cyan-300">{new Date(s.accessGrantedAt).toLocaleString()}</span></p>
                                <p>⏳ Muddat: <span className="text-cyan-300">{s.accessDurationDays} kun</span></p>
                                <p>🔴 Tugaydi: <span className="text-red-300">{new Date(s.accessExpiresAt).toLocaleString()}</span></p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <select
                              defaultValue="30"
                              className="bg-slate-900 text-xs p-2 rounded-xl border border-white/10"
                              onChange={e => toggleAccess(s.id, Number(e.target.value))}
                            >
                              <option value="7">7 kun</option>
                              <option value="30">30 kun</option>
                              <option value="60">60 kun</option>
                              <option value="90">90 kun</option>
                              <option value="180">180 kun</option>
                              <option value="365">365 kun</option>
                            </select>
                            <button onClick={() => toggleAccess(s.id, 30)} className="bg-cyan-600 px-4 py-2 rounded-xl text-xs font-bold">
                              {s.status.includes('Faol') ? 'Ruxsatni yopish' : 'Ruxsat berish'}
                            </button>
                            <button onClick={() => handleDeleteStudent(s.id)} className="text-red-400 px-3 py-2 rounded-xl text-xs border border-red-500/20">
                              O'chirish
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddCourse} className="bg-slate-900/60 p-6 rounded-3xl border border-purple-500/20 space-y-5">
                  <div>
                    <h3 className="font-bold text-purple-200 text-lg">Yangi Kurs Qo'shish ➕</h3>
                    <p className="text-slate-500 text-xs mt-1">Kursni va uning barcha video darsliklarini shu joyning o‘zida yarating. Keyin kodni o‘zgartirish shart emas. YouTube Unlisted videolar ham qo‘llab-quvvatlanadi.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      placeholder="Kurs nomi"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="bg-slate-950 p-3 rounded-xl border border-white/10 text-sm"
                    />
                    <input
                      placeholder="Kurs tavsifi"
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      className="bg-slate-950 p-3 rounded-xl border border-white/10 text-sm"
                    />
                    <input
                      placeholder="Narxi"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      className="bg-slate-950 p-3 rounded-xl border border-white/10 text-sm"
                    />
                  </div>

                  <div className="bg-slate-950/70 rounded-2xl border border-purple-500/10 p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-purple-200">Video darsliklar soni 🎬</p>
                        <p className="text-[10px] text-slate-500 mt-1">Masalan, 20 kiritsangiz pastda 20 ta dars uchun alohida joy ochiladi.</p>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newLessonCount === 0 ? '' : String(newLessonCount)}
                        onChange={e => handleNewLessonCountChange(e.target.value)}
                        onBlur={handleNewLessonCountBlur}
                        placeholder="Masalan: 7"
                        className="w-full md:w-32 bg-slate-900 p-3 rounded-xl border border-purple-500/20 text-sm font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                    {newLessons.slice(0, newLessonCount).map((lesson, index) => (
                      <div key={index} className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-black text-cyan-300">🎬 {index + 1}-Dars</h4>
                          <span className="text-[10px] text-slate-600">#{index + 1}</span>
                        </div>

                        <input
                          placeholder={`Dars ${index + 1} nomi`}
                          value={lesson.title}
                          onChange={e => updateNewLesson(index, 'title', e.target.value)}
                          className="w-full bg-slate-900 p-3 rounded-xl border border-white/10 text-sm"
                        />

                        <div className="space-y-2">
                          <input
                            type="url"
                            placeholder="YouTube yopiq (Unlisted) havolasi"
                            value={lesson.videoUrl}
                            onChange={e => updateNewLesson(index, 'videoUrl', e.target.value)}
                            className="w-full bg-slate-900 p-3 rounded-xl border border-white/10 text-sm"
                          />
                          <p className="text-[10px] text-amber-300/80">
                            🔒 YouTube'da <b>Unlisted / Havola orqali kirish</b> qilib qo‘yilgan videoni shu yerga joylang. Tizim watch/youtu.be havolasini avtomatik video oynasiga moslaydi.
                          </p>
                        </div>

                        <textarea
                          placeholder="Dars tavsifi / darsda foydalanilgan ma'lumotlar"
                          value={lesson.description}
                          onChange={e => updateNewLesson(index, 'description', e.target.value)}
                          className="w-full bg-slate-900 p-3 rounded-xl border border-white/10 text-sm min-h-[80px]"
                        />

                        <textarea
                          placeholder="Qo‘shimcha URL/havolalar — har birini yangi qatordan yozing"
                          value={lesson.resources}
                          onChange={e => updateNewLesson(index, 'resources', e.target.value)}
                          className="w-full bg-slate-900 p-3 rounded-xl border border-white/10 text-sm min-h-[70px]"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                    <p className="text-[10px] text-slate-500">Jami: <span className="text-cyan-300 font-bold">{newLessonCount} ta dars</span>. Har bir dars uchun nom, video URL, tavsif va qo‘shimcha URL kiritishingiz mumkin.</p>
                    <button type="submit" className="bg-purple-600 px-6 py-3 rounded-xl font-bold text-xs hover:bg-purple-500">
                      Kursni va {newLessonCount} ta darsni qo‘shish ➕
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map(course => (
                    <div key={course.id} className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 hover:border-cyan-500/20 transition-all">
                      {editingId === course.id ? (
                        <div className="space-y-3">
                          <input value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} className="w-full bg-slate-950 p-3 rounded-xl" />
                          <input value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} className="w-full bg-slate-950 p-3 rounded-xl" />
                          <input value={editData.price} onChange={e => setEditData({ ...editData, price: e.target.value })} className="w-full bg-slate-950 p-3 rounded-xl" />
                          <button onClick={() => saveEdit(course.id)} className="bg-cyan-600 px-4 py-2 rounded-xl text-xs font-bold">Saqlash</button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl font-black">{course.title}</h2>
                          <p className="text-slate-400 text-sm mt-2">{course.description}</p>
                          <p className="text-cyan-300 font-bold mt-4">{course.price}</p>
                          <div className="mt-5 space-y-2">
                            {course.lessons.map((lesson: any) => (
                              <div key={lesson.id} className="space-y-2">
                                <button
                                  onClick={() => setActiveVideo(lesson)}
                                  className="w-full text-left bg-slate-950 p-3 rounded-xl border border-white/5 hover:border-cyan-500/30 text-xs"
                                >
                                  🎬 {lesson.title}
                                </button>

                                {(lesson.description || lesson.resources) && (
                                  <div className="bg-slate-950/70 p-3 rounded-xl border border-cyan-500/10 space-y-2">
                                    {lesson.description && (
                                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{lesson.description}</p>
                                    )}
                                    {lesson.resources && (
                                      <div className="space-y-1">
                                        {lesson.resources.split('\n').filter((link: string) => link.trim()).map((link: string, index: number) => (
                                          <a
                                            key={`${lesson.id}-${index}`}
                                            href={link.trim()}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block text-xs text-cyan-300 underline break-all"
                                          >
                                            🔗 {link.trim()}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <p className="text-[10px] text-slate-500 px-1">
                                  Savollaringiz bo‘lsa, 24/7 Qo‘llab-quvvatlash tugmasini bosib savol bering. 💬
                                </p>

                                {userEmail === ADMIN_EMAIL && (
                                  editingLessonId === lesson.id ? (
                                    <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/20 space-y-2">
                                      <input
                                        value={lessonEditData.title}
                                        onChange={e => setLessonEditData({ ...lessonEditData, title: e.target.value })}
                                        placeholder="Video darslik nomi"
                                        className="w-full bg-slate-900 p-2.5 rounded-xl text-xs border border-white/10"
                                      />
                                      <div className="space-y-1">
                                        <input
                                          value={lessonEditData.videoUrl}
                                          onChange={e => setLessonEditData({ ...lessonEditData, videoUrl: e.target.value })}
                                          placeholder="YouTube yopiq (Unlisted) havolasi"
                                          className="w-full bg-slate-900 p-2.5 rounded-xl text-xs border border-white/10"
                                        />
                                        <p className="text-[9px] text-amber-300/80">🔒 Unlisted videoning havolasini kiriting. Saqlanganda embed formatiga avtomatik o‘tkaziladi.</p>
                                      </div>
                                      <textarea
                                        value={lessonEditData.description}
                                        onChange={e => setLessonEditData({ ...lessonEditData, description: e.target.value })}
                                        placeholder="Videoda foydalanilgan ma'lumotlar / tavsif"
                                        className="w-full bg-slate-900 p-2.5 rounded-xl text-xs border border-white/10 min-h-[80px]"
                                      />
                                      <textarea
                                        value={lessonEditData.resources}
                                        onChange={e => setLessonEditData({ ...lessonEditData, resources: e.target.value })}
                                        placeholder="Havolalar (har bir havolani yangi qatordan yozing)"
                                        className="w-full bg-slate-900 p-2.5 rounded-xl text-xs border border-white/10 min-h-[70px]"
                                      />
                                      <div className="flex gap-2">
                                        <button onClick={() => saveLessonEdit(course.id, lesson.id)} className="bg-cyan-600 px-3 py-2 rounded-xl text-xs font-bold">
                                          Saqlash
                                        </button>
                                        <button onClick={() => setEditingLessonId(null)} className="bg-slate-800 px-3 py-2 rounded-xl text-xs">
                                          Bekor qilish
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex gap-3 px-1">
                                      <button onClick={() => startLessonEdit(lesson)} className="text-cyan-300 text-[10px]">
                                        Dars tavsifi/havolalarini tahrirlash
                                      </button>
                                      {(lesson.description || lesson.resources) && (
                                        <button onClick={() => deleteLessonInfo(course.id, lesson.id)} className="text-red-400 text-[10px]">
                                          O‘chirish
                                        </button>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            ))}
                          </div>
                          {userEmail === ADMIN_EMAIL && (
                            <div className="flex gap-2 mt-4">
                              <button onClick={() => startEdit(course)} className="text-cyan-300 text-xs">Tahrirlash</button>
                              <button onClick={() => handleDeleteCourse(course.id)} className="text-red-400 text-xs">O'chirish</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {activeVideo && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-slate-950 rounded-3xl border border-white/10 p-5">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">{activeVideo.title}</h3>
                        <button onClick={() => setActiveVideo(null)} className="text-slate-400 hover:text-white">✕</button>
                      </div>
                      <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                        <iframe src={activeVideo.videoUrl} className="w-full h-full" allowFullScreen />
                      </div>

                      {(activeVideo.description || activeVideo.resources) && (
                        <div className="mt-4 bg-slate-900 rounded-2xl p-4 border border-white/5 space-y-3">
                          {activeVideo.description && (
                            <div>
                              <p className="text-xs font-bold text-cyan-300 mb-1">Dars tavsifi</p>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">{activeVideo.description}</p>
                            </div>
                          )}
                          {activeVideo.resources && (
                            <div>
                              <p className="text-xs font-bold text-cyan-300 mb-1">Foydalanilgan havolalar</p>
                              {activeVideo.resources.split('\n').filter((link: string) => link.trim()).map((link: string, index: number) => (
                                <a
                                  key={`modal-${activeVideo.id}-${index}`}
                                  href={link.trim()}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-xs text-cyan-300 underline break-all"
                                >
                                  🔗 {link.trim()}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setActiveVideo(null);
                          setActiveTab('support');
                        }}
                        className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 px-4 py-3 rounded-xl text-xs font-bold"
                      >
                        Savollaringiz bo‘lsa, 24/7 Qo‘llab-quvvatlash orqali savol bering 💬
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-950 max-w-md w-full rounded-3xl border border-cyan-500/20 p-6 space-y-5">
              <h3 className="text-xl font-black">To'lov 💳</h3>
              <p className="text-slate-400 text-sm">Quyidagi karta raqamiga to'lov qiling:</p>
              <div className="bg-slate-900 p-4 rounded-2xl">
                <p className="text-sm font-bold text-white mb-2">Karta egasi: <span className="text-cyan-300">XAKIMOVA SHAXZODA</span></p>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm">5614 6818 1331 5631</span>
                  <button onClick={handleCopyCard} className="text-cyan-300 text-xs">{copied ? 'Nusxalandi ✅' : 'Nusxalash'}</button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-slate-800 py-3 rounded-xl text-xs font-bold">Bekor qilish</button>
                <button onClick={handlePaymentConfirm} className="flex-1 bg-cyan-600 py-3 rounded-xl text-xs font-bold">To'lovni tasdiqlash</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}