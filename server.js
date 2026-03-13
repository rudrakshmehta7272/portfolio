/**
 * ╔══════════════════════════════════════════════════════╗
 *   MY PORTFOLIO — Full Stack Server
 *   Run:  node server.js
 *   Open: http://localhost:3000
 * ╚══════════════════════════════════════════════════════╝
 */

const express        = require('express');
const multer         = require('multer');
const cors           = require('cors');
const session        = require('express-session');
const bcrypt         = require('bcryptjs');
const path           = require('path');
const fs             = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── DIRECTORIES ──────────────────────────────────────────
const DATA_FILE   = path.join(__dirname, 'data', 'portfolio.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── DEFAULT DATA ─────────────────────────────────────────
const DEFAULTS = {
  profile: {
    name: 'Your Name',
    title: 'Your Professional Title',
    bio: 'Write your bio here. Tell the world what you do and what makes you unique.',
    email: 'you@example.com',
    contactNote: 'Open to freelance & full-time opportunities',
    photoPath: null,
    availability: 'available',
    stats: { projects: '0', experience: '0', clients: '0' }
  },
  work: [],
  skills: [],
  links: [],
  theme: {
    accent: '#7c6aff', accent2: '#ff6ab0', accent3: '#6affda',
    bg: '#080810', surface: '#0f0f1a', surface2: '#161625'
  },
  passwordHash: bcrypt.hashSync('admin123', 10)
};

function db() {
  if (!fs.existsSync(DATA_FILE)) return JSON.parse(JSON.stringify(DEFAULTS));
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch(e) { return JSON.parse(JSON.stringify(DEFAULTS)); }
}
function saveDB(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
if (!fs.existsSync(DATA_FILE)) saveDB(DEFAULTS);

// ── MULTER ────────────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOADS_DIR),
    filename:    (_, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e6) + path.extname(file.originalname))
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(_, file, cb) {
    cb(null, /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/i.test(path.extname(file.originalname)));
  }
});

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'portfolio-secret-' + Math.random(),
  resave: false, saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function auth(req, res, next) {
  if (req.session.ok) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ════════════════════════════════════════════════════════
//  PUBLIC API
// ════════════════════════════════════════════════════════
app.get('/api/portfolio', (req, res) => {
  const { passwordHash, ...safe } = db();
  res.json(safe);
});

app.post('/api/auth/login', (req, res) => {
  const data = db();
  if (bcrypt.compareSync(req.body.password || '', data.passwordHash)) {
    req.session.ok = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!req.session.ok });
});

// ════════════════════════════════════════════════════════
//  PROTECTED API
// ════════════════════════════════════════════════════════

// PROFILE
app.put('/api/profile', auth, (req, res) => {
  const data = db();
  data.profile = { ...data.profile, ...req.body };
  saveDB(data); res.json({ success: true, profile: data.profile });
});

app.post('/api/profile/photo', auth, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const data = db();
  if (data.profile.photoPath) {
    const old = path.join(UPLOADS_DIR, path.basename(data.profile.photoPath));
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  data.profile.photoPath = `/uploads/${req.file.filename}`;
  saveDB(data); res.json({ success: true, path: data.profile.photoPath });
});

// WORK
app.get('/api/work', (req, res) => res.json(db().work));

app.post('/api/work', auth, upload.single('media'), (req, res) => {
  const data = db();
  const item = {
    id: Date.now(),
    type:        req.body.type || 'project',
    title:       req.body.title,
    category:    req.body.category || 'Project',
    description: req.body.description || '',
    url:         req.body.url || '#',
    media: req.file
      ? `/uploads/${req.file.filename}`
      : (req.body.mediaUrl || null),
    mediaType: req.file
      ? (req.file.mimetype.startsWith('video') ? 'video' : 'image')
      : ((req.body.mediaUrl||'').includes('youtube') || (req.body.mediaUrl||'').includes('vimeo') ? 'embed' : 'image')
  };
  data.work.unshift(item);
  saveDB(data); res.json({ success: true, item });
});

app.put('/api/work/:id', auth, (req, res) => {
  const data = db();
  const i = data.work.findIndex(w => w.id == req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Not found' });
  data.work[i] = { ...data.work[i], ...req.body };
  saveDB(data); res.json({ success: true });
});

app.delete('/api/work/:id', auth, (req, res) => {
  const data = db();
  const item = data.work.find(w => w.id == req.params.id);
  if (item?.media?.startsWith('/uploads/')) {
    const f = path.join(UPLOADS_DIR, path.basename(item.media));
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  data.work = data.work.filter(w => w.id != req.params.id);
  saveDB(data); res.json({ success: true });
});

// SKILLS
app.get('/api/skills', (req, res) => res.json(db().skills));
app.post('/api/skills', auth, (req, res) => {
  const data = db();
  const skill = { id: Date.now(), name: req.body.name, icon: req.body.icon || '⚡' };
  data.skills.push(skill);
  saveDB(data); res.json({ success: true, skill });
});
app.delete('/api/skills/:id', auth, (req, res) => {
  const data = db();
  data.skills = data.skills.filter(s => s.id != req.params.id);
  saveDB(data); res.json({ success: true });
});

// LINKS
app.get('/api/links', (req, res) => res.json(db().links));
app.post('/api/links', auth, (req, res) => {
  const data = db();
  const link = { id: Date.now(), name: req.body.name, url: req.body.url, icon: req.body.icon || '🔗', social: !!req.body.social };
  data.links.push(link);
  saveDB(data); res.json({ success: true, link });
});
app.delete('/api/links/:id', auth, (req, res) => {
  const data = db();
  data.links = data.links.filter(l => l.id != req.params.id);
  saveDB(data); res.json({ success: true });
});

// THEME
app.put('/api/theme', auth, (req, res) => {
  const data = db();
  data.theme = { ...data.theme, ...req.body };
  saveDB(data); res.json({ success: true });
});

// PASSWORD
app.put('/api/auth/password', auth, (req, res) => {
  const { current, newPassword } = req.body;
  const data = db();
  if (!bcrypt.compareSync(current, data.passwordHash))
    return res.status(401).json({ error: 'Wrong current password' });
  data.passwordHash = bcrypt.hashSync(newPassword, 10);
  saveDB(data); res.json({ success: true });
});

// EXPORT
app.get('/api/export', auth, (req, res) => {
  const { passwordHash, ...safe } = db();
  res.setHeader('Content-Disposition', 'attachment; filename="portfolio-backup.json"');
  res.json(safe);
});

// IMPORT
app.post('/api/import', auth, express.json({ limit: '50mb' }), (req, res) => {
  try {
    const imported = req.body;
    const data = db();
    const merged = { ...data, ...imported, passwordHash: data.passwordHash };
    saveDB(merged); res.json({ success: true });
  } catch(e) { res.status(400).json({ error: 'Invalid data' }); }
});

// ── SERVE FRONTEND ────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  ✦ Portfolio Server is running!      ║');
  console.log(`║  → http://localhost:${PORT}            ║`);
  console.log('║  Admin password: admin123            ║');
  console.log('║  Change it in the Admin > Settings   ║');
  console.log('╚══════════════════════════════════════╝\n');
});
