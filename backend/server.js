const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// Admin ekanligini tekshirish middleware
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token topilmadi' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Faqat admin uchun ruxsat etilgan!' });
  }
  req.user = user;
  next();
};

// Kurs yaratish (Faqat Admin)
app.post('/api/courses', verifyAdmin, async (req, res) => {
  const { title, description, price } = req.body;
  const { data, error } = await supabase.from('courses').insert([{ title, description, price }]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// O'quvchini tasdiqlash yoki ID raqamiga ruxsat berish (Faqat Admin)
app.post('/api/approve-student', verifyAdmin, async (req, res) => {
  const { userId, isApproved } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_approved: isApproved })
    .eq('id', userId)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Muvaffaqiyatli yangilandi', data });
});

// Savolga anonim javob yozish / Media yuklash (Faqat Admin)
app.post('/api/reply', verifyAdmin, upload.single('media'), async (req, res) => {
  const { lessonId, content, parentId } = req.body;
  let mediaUrl = null;
  let mediaType = null;

  if (req.file) {
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('media').upload(fileName, req.file.buffer);
    if (!error) {
      const { data: publicData } = supabase.storage.from('media').getPublicUrl(fileName);
      mediaUrl = publicData.publicUrl;
      mediaType = req.file.mimetype.startsWith('image') ? 'image' : req.file.mimetype.startsWith('audio') ? 'audio' : 'video';
    }
  }

  const { data, error } = await supabase.from('comments').insert([{
    lesson_id: lessonId,
    user_id: req.user.id,
    content,
    media_url: mediaUrl,
    media_type: mediaType,
    is_admin_reply: true,
    parent_id: parentId || null
  }]).select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server ishga tushdi: ${PORT}-port`));
// Foydalanuvchi obuna muddatini tekshirish API'si
app.post('/api/check-subscription', async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Foydalanuvchini profiles jadvalidan qidiramiz
    let { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    // Agar foydalanuvchi bazada topilmasa (yangi kirdi)
    if (!user) {
      const newUserData = {
        email,
        role: 'user',
        subscription_start: new Date(),
        subscription_end: new Date(new Date().getTime() - 1000), // Muddati tugagan qilib ochiladi
        is_active: false
      };
      
      await supabase
        .from('profiles')
        .insert([newUserData]);
        
      return res.json({ 
        active: false, 
        message: "Assalomu aleykum, Hurmatli oʻquvchi sizning darslardan foydalanish muddatingiz tugadi. Davom etish uchun qayta toʻlov qiling!" 
      });
    }

    // 2. Vaqtni tekshiramiz
    const now = new Date();
    const expiryDate = new Date(user.subscription_end);

    if (now > expiryDate || !user.is_active) {
      return res.json({
        active: false,
        message: "Assalomu aleykum, Hurmatli oʻquvchi sizning darslardan foydalanish muddatingiz tugadi. Davom etish uchun qayta toʻlov qiling!"
      });
    }

    // Agar muddat hali tugamagan bo'lsa
    res.json({
      active: true,
      user: user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});