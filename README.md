# ✦ My Portfolio — Full Stack

## ⚡ Quick Start (2 steps)

### Windows
Double-click `START.bat`

### Mac / Linux
```bash
chmod +x start.sh && ./start.sh
```

### Manual
```bash
npm install
node server.js
```

Then open → **http://localhost:3000**

---

## 🔐 Admin Panel

Click **"✦ Admin"** in the nav bar.

**Default password:** `admin123`
*(Change it in Admin → Settings after first login)*

---

## ✏️ What you can customize

| Tab | What you can change |
|-----|---------------------|
| **Profile** | Name, photo, title, bio, stats, email |
| **Work** | Add/remove projects with images, videos, YouTube links |
| **Skills** | Add/remove skills with emoji icons |
| **Links** | Add/remove social links and profiles |
| **Theme** | Accent colors, background, 5 quick themes |
| **Settings** | Change password, export JSON backup, logout |

---

## 📁 File Structure

```
my-portfolio/
├── server.js          ← The backend server (Express)
├── package.json       ← Dependencies
├── START.bat          ← Windows launcher
├── start.sh           ← Mac/Linux launcher
├── public/
│   ├── index.html     ← The frontend website
│   └── uploads/       ← Uploaded photos & videos (auto-created)
└── data/
    └── portfolio.json ← Your data (auto-created on first run)
```

---

## 🌐 Deploy to the Internet

### Free option — Railway
1. Push folder to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Done! Your portfolio is live.

### VPS (DigitalOcean, etc.)
```bash
# On your server:
git clone <your-repo>
cd my-portfolio
npm install
PORT=80 node server.js
```

---

## Requirements
- Node.js 16+ (download from nodejs.org)
