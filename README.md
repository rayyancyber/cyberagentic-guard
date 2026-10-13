# 🛡️ CyberGuard X - Full-Stack Cybersecurity Training & CTF Platform

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)

**Professional cybersecurity training platform with CTF challenges, SIEM detection, vulnerability management, and incident response workflows.**

[Features](#-features) • [Quick Start](#-quick-start) • [CTF Challenges](#-ctf-challenges) • [Tech Stack](#-tech-stack) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🎯 CTF Platform (NEW!)
- **16 Professional Challenges** across 7 categories (2,825 points total)
- **Progressive Hint System** - Reveal hints one by one
- **Instant Flag Validation** - Real-time scoring
- **Categories**: Web, Crypto, Binary, Forensics, OSINT, Network, Misc
- **Difficulty Levels**: Easy → Medium → Hard → Insane
- **Per-User Progress Tracking** with leaderboard support

### 🔴 Red Team Operations
- **Assessment Management** - Track penetration tests
- **Vulnerability Documentation** - CVSS 0-10 scoring
- **6 Hands-On Labs** - DVWA, Juice Shop, Metasploitable
- **Scope Validation** - Server-side enforcement
- **Finding Aggregation** - Link to assessments

### 🔵 Blue Team Operations
- **SIEM Detection Engine** - Build custom rules
- **Synthetic Event Injection** - Test without real attacks
- **Alert Triage Workflow** - New → Investigating → Resolved
- **Incident Response** - Full IR lifecycle (Open → Closed)
- **MTTA/MTTR Metrics** - Performance tracking

### 📊 Security Monitoring
- **24-Hour Timeline Chart** - Visualize events by severity
- **500 Event History** - Real-time log stream
- **Multi-Dimensional Filtering** - Severity, type, origin
- **Asset Correlation** - Link events to targets
- **Auto-Alert Generation** - Rule-based detection

### 📚 Learning Center
- **18 Lessons** across 4 comprehensive modules
  - OWASP Top 10 (5 lessons)
  - Penetration Testing Methodology (4 lessons)
  - Blue Team Fundamentals (4 lessons)
  - Secure Coding Practices (3 lessons)
- **Progress Tracking** - Per-user completion status
- **External Resources** - Links to OWASP, MITRE ATT&CK, NIST
- **Track Filtering** - Red Team / Blue Team / General

### 👥 Team Collaboration
- **Kanban Board** - 5 columns (Backlog → Done)
- **Task Management** - Priority, due dates, assignees
- **Finding Integration** - Link tasks to vulnerabilities
- **Team Roster** - View all analysts

### 🏆 Additional Features
- **Asset Management** - Lab target inventory with authorization workflow
- **Evidence Storage** - File uploads with SHA-256 integrity (10MB limit)
- **Audit Logging** - Track all database operations
- **Role-Based Access** - Admin, Red Team, Blue Team, Member
- **Dark/Light Theme** - User preference with persistence

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase account (for authentication)
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cyberguard-x-platform.git
cd cyberguard-x-platform

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your Firebase and Supabase credentials
```

### Environment Variables

Create a `.env` file with:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### Run Development Server

```bash
npm run dev

# Open http://localhost:8080
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🎯 CTF Challenges

### Challenge Categories

| Category | Count | Points | Description |
|----------|-------|--------|-------------|
| **Web** | 4 | 750 | SQL injection, XSS, JWT, admin panels |
| **Crypto** | 3 | 425 | Caesar, Base64, RSA factorization |
| **Binary** | 2 | 600 | Buffer overflow, format strings |
| **Forensics** | 2 | 300 | Metadata extraction, file carving |
| **OSINT** | 1 | 100 | Social media geolocation |
| **Network** | 2 | 325 | PCAP analysis, ARP spoofing |
| **Misc** | 2 | 325 | QR codes, encoding |
| **TOTAL** | **16** | **2,825** | |

### Easy Challenges (Start Here!)

1. **QR Code Secret** (50pts)
   - Category: Misc
   - Flag: `CG{qr_c0d3s_4r3_3z}`
   - Skills: QR scanning

2. **Caesar Cipher** (75pts)
   - Category: Crypto
   - Flag: `CG{caesar_cipher_is_blood}`
   - Skills: Classical cryptography

3. **Base64 Layers** (100pts)
   - Category: Crypto
   - Flag: `CG{b4s364_1s_n0t_3ncrypt10n}`
   - Skills: Encoding, decoding

4. **Hidden Admin Panel** (100pts)
   - Category: Web
   - Flag: `CG{r0b0ts_t3ll_s3cr3ts}`
   - Skills: Recon, directory traversal

### Try Your First Challenge

1. Navigate to **http://localhost:8080/ctf**
2. Click on "Caesar Cipher"
3. Click "Attempt Challenge"
4. Decrypt: `FT{fdhvdu_flskhu_wr_eorrg}`
5. Submit flag: `CG{caesar_cipher_is_blood}`
6. Earn 75 points! 🎉

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization

### Backend & Database
- **Supabase** - PostgreSQL database with RLS
- **Firebase Auth** - Authentication (Google OAuth + Email/Password)
- **Row-Level Security** - Database-level access control
- **Business Logic Triggers** - Auto-validation & alerts

### DevOps
- **Vite** - Fast build tool
- **Vercel** - Deployment platform (optional)
- **GitHub Actions** - CI/CD (optional)

---

## 📊 Database Schema

### 15 Tables with RLS Policies

| Table | Description | RLS Policy |
|-------|-------------|------------|
| `profiles` | User profiles | Own profile only |
| `user_roles` | Role assignments | Admins manage |
| `audit_log` | All operations | Admins read-only |
| `assets` | Lab targets | All read/insert |
| `assessments` | Red team tests | All read/insert |
| `findings` | Vulnerabilities | All read/insert |
| `detection_rules` | SIEM rules | All read/insert |
| `security_events` | Log stream | All read/insert |
| `alerts` | Rule matches | All read/insert |
| `incidents` | IR cases | All read/insert |
| `evidence` | File attachments | All read/insert |
| `team_tasks` | Kanban tasks | All read/insert |
| `task_comments` | Task discussion | All read/insert |
| `progress` | CTF/lab tracking | Own progress only |

### Automated Business Logic

- ✅ **First user auto-promoted to admin**
- ✅ **Auto-alert generation** on rule matches
- ✅ **Scope validation** for assessments
- ✅ **Production asset protection** (blocks offensive testing)
- ✅ **Audit logging** for all operations
- ✅ **Timestamp management** (created_at, updated_at)

---

## 🔒 Security Features

### Authentication & Authorization
- **Firebase Authentication** - Google OAuth + Email/Password
- **Supabase RLS** - Row-Level Security on all tables
- **Auto-Session Sync** - Firebase ↔ Supabase bridge
- **Session Auto-Refresh** - No logout on expiry
- **Role-Based Access** - 4 roles (admin, red_team, blue_team, member)

### Data Protection
- **Server-Side Validation** - Assessment scope enforcement
- **SHA-256 Checksums** - File integrity verification
- **10MB File Size Limit** - Evidence uploads
- **Audit Trail** - All INSERT/UPDATE/DELETE logged
- **Environment Protection** - Production assets cannot be authorized

---

## 📖 Training Paths

### Path 1: CTF Beginner (Easy Challenges)
```
1. QR Code Secret (50pts)
2. Caesar Cipher (75pts)
3. Base64 Layers (100pts)
4. Hidden Admin Panel (100pts)
Total: 325 points
```

### Path 2: Web Security Specialist
```
1. Complete OWASP Top 10 lessons
2. SQL Injection CTF (150pts)
3. XSS CTF (200pts)
4. JWT Forgery CTF (300pts)
5. DVWA Lab (100pts)
Total: 650 CTF + 100 lab points
```

### Path 3: Blue Team SOC Analyst
```
1. Complete Blue Team Fundamentals
2. Create 5 detection rules
3. Inject 20 synthetic events
4. Triage 10 alerts
5. Close 3 incidents
Total: Operational experience
```

---

## 🎓 Sample Data

The platform comes pre-seeded with:

- ✅ **4 Lab Assets** - DVWA, Juice Shop, Metasploitable, SIEM
- ✅ **4 Detection Rules** - Brute force, SQLi, server errors, access violations
- ✅ **9 Security Events** - Synthetic training events
- ✅ **3 Sample Findings** - SQLi, XSS, FTP misconfiguration
- ✅ **3 Sample Tasks** - Remediation workflow examples

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Ideas
- [ ] Add more CTF challenges
- [ ] Create challenge writeups
- [ ] Add more learning modules
- [ ] Improve UI/UX
- [ ] Add unit tests
- [ ] Write API documentation
- [ ] Create video tutorials

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OWASP** - Vulnerability classification framework
- **MITRE ATT&CK** - Detection engineering mappings
- **NIST** - Incident response guidelines (SP 800-61)
- **Cylab** - Inspiration for professional cyber academy features
- **Open Source Community** - Amazing tools and libraries

---

## 📬 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/cyberguard-x-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/cyberguard-x-platform/discussions)
- **Email**: your.email@example.com

---

## 🗺️ Roadmap

### v1.1 (Next Release)
- [ ] User leaderboard page
- [ ] Challenge writeups & solutions
- [ ] Team scoring system
- [ ] Export reports to PDF
- [ ] Docker deployment option

### v1.2 (Future)
- [ ] Live CTF competitions
- [ ] Custom challenge upload
- [ ] Badge & achievement system
- [ ] API for external integrations
- [ ] Mobile responsive improvements

### v2.0 (Long-term)
- [ ] Multi-tenant support
- [ ] Advanced analytics dashboard
- [ ] Integration with security tools (Burp, Nmap)
- [ ] Automated vulnerability scanning
- [ ] AI-powered hints

---

<div align="center">

**Built with ❤️ for the cybersecurity community**

⭐ Star this repo if you find it useful!

[Report Bug](https://github.com/YOUR_USERNAME/cyberguard-x-platform/issues) • [Request Feature](https://github.com/YOUR_USERNAME/cyberguard-x-platform/issues)

</div>
