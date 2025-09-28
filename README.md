# Zentry - Productivity App

A modern, productivity application built with React, TypeScript, and Tailwind CSS. Features task management, note-taking, class scheduling, PWA support, and customizable themes.

## ✨ Features

- ✅ **Task Management**: Create, edit, organize tasks with priorities and categories
- 📝 **Smart Notes**: Take notes with categories, search, and auto-save
- 📅 **Class Schedule**: Manage your class timetable with visual scheduling
- ⚙️ **Customization**: Multiple themes, dark mode, and user preferences
- 📱 **PWA Ready**: Install as native app, works offline, push notifications
- 💾 **Data Persistence**: All data saved locally with auto-backup
- 🎨 **Modern UI**: Beautiful interface with smooth animations and responsive design
- 🔒 **Privacy First**: All data stored locally, no external servers

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation & Development

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm i
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Alternative Development Methods

**Use Lovable** (Recommended)
Simply visit the [Lovable Project](https://lovable.dev/projects/d8f5eef7-4d38-48db-be4a-496f5ba33f84) and start prompting. Changes made via Lovable will be committed automatically.

**Edit directly in GitHub**
- Navigate to desired files and click the "Edit" button (pencil icon)
- Make changes and commit directly

**Use GitHub Codespaces**
- Click "Code" → "Codespaces" → "New codespace"
- Edit files directly in the browser environment

## 📦 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## 🌐 Deployment

### Quick Deploy via Lovable
Simply open [Lovable](https://lovable.dev/projects/d8f5eef7-4d38-48db-be4a-496f5ba33f84) and click Share → Publish.

### Deploy to Netlify
1. Build: `npm run build`
2. Deploy the `dist` folder to Netlify
3. The included `netlify.toml` provides optimized PWA settings

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Or connect your GitHub repo for automatic deployments

### Other Platforms
Deploy the static `dist` folder to:
- **GitHub Pages** (with GitHub Actions)
- **Firebase Hosting** (`firebase deploy`)
- **Surge.sh** (`surge dist/`)
- **Any CDN/Static Host**

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks with localStorage persistence
- **Routing**: React Router v6
- **PWA**: Service Worker, Web App Manifest, notifications
- **Icons**: Lucide React
- **Development**: ESLint, TypeScript, HMR

## 📱 PWA Features

- ✅ **Offline Support** - Core functionality without internet
- ✅ **Install Prompt** - Native app installation
- ✅ **Push Notifications** - Task reminders and updates  
- ✅ **Background Sync** - Data syncs when online
- ✅ **App-like Experience** - Native navigation

## 🎯 User Guide

### Task Management
- Add tasks with priorities and categories
- Filter by active/completed status
- Search through all tasks
- Edit inline or delete tasks

### Note Taking  
- Create categorized notes
- Auto-save functionality
- Full-text search
- Rich content support

### Class Scheduling
- Visual weekly schedule
- Add classes with details
- Color-coded organization
- Easy editing and management

### Customization
- Multiple color themes
- Dark/light mode toggle
- Profile management
- Data export/backup

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Custom Domain

Connect a custom domain via Project → Settings → Domains in [Lovable](https://lovable.dev).

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
