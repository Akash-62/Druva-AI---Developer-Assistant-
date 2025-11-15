<div align="center">

# 🤖 Druva AI Developer Assistant

<img src="https://img.shields.io/badge/React-19.2.0-blue?logo=react" alt="React">
<img src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript" alt="TypeScript">
<img src="https://img.shields.io/badge/Vite-6.2-purple?logo=vite" alt="Vite">
<img src="https://img.shields.io/badge/Tailwind-3.4-cyan?logo=tailwindcss" alt="Tailwind">

**A modern, responsive AI chat interface for developers.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 🎨 **UI/UX**
- 🌓 **Three Theme Modes**: Light, Dark, and OLED
- 📱 **Fully Responsive**: Works seamlessly on mobile, tablet, and desktop
- ⚡ **Smooth Animations**: Polished transitions and hover effects
- 🎯 **Arc Reactor Theme**: Unique futuristic branding

### 💬 **Chat Functionality**
- 🔄 **Real-time Streaming**: Live AI responses with streaming support
- ✏️ **Message Editing**: Edit and regenerate responses
- 🔁 **Regenerate Answers**: Get alternative responses
- 💾 **Conversation Persistence**: Auto-save to localStorage (survives refresh)
- 🗑️ **Delete Conversations**: Clean chat management with smooth animations
- 📝 **Markdown & LaTeX Support**: Render formatted text and math equations
- 💻 **Code Highlighting**: Syntax-highlighted code blocks with copy button for all languages
- 🎭 **Emotional AI**: Responds with warmth and personality like a real friend

### 🚀 **Technical Features**
- ⚛️ **React 19** with TypeScript
- 🎨 **Tailwind CSS** for styling
- 🤖 **Groq API** (Llama 3.3 70B)
- 📦 **Vite** for fast development
- ♿ **Accessible**: ARIA labels and keyboard navigation
- 🎭 **Component-based Architecture**: Clean and maintainable code

### 🎯 **Advanced Features**
- 🕐 **Live Date & Time**: Real-time clock with Indian Standard Time
- 👨‍💻 **Developer Info**: Connect with the creator (Akash S)
- 🎙️ **Voice Mode**: Speech recognition (Coming Soon)
- 📄 **Document Analysis**: Upload and analyze files (Coming Soon)
- ⚠️ **Smart Error Handling**: Friendly, helpful error messages
- 💾 **LocalStorage Persistence**: Your chats stay even after refresh

---

## 🖼️ Demo

### Desktop View
Three-panel layout with sidebar, chat area, and settings panel.

### Mobile View
Optimized responsive layout with collapsible panels.

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/druva-ai-chat.git
cd druva-ai-chat
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Key
Create a `.env.local` file in the root directory:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Groq API key:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

**Get your free API key at:** https://console.groq.com/keys

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Build for Production

```bash
npm run build
npm run preview
```

---

## 📂 Project Structure

```
druva-ai-chat/
├── components/
│   ├── ChatArea.tsx       # Main chat interface
│   ├── Header.tsx         # Top navigation bar
│   ├── Icons.tsx          # SVG icon components
│   ├── InputBar.tsx       # Message input field
│   ├── Message.tsx        # Individual message component
│   ├── RightPanel.tsx     # Settings/details panel
│   └── Sidebar.tsx        # Conversation history
├── hooks/
│   └── useDarkMode.ts     # Theme management hook
├── services/
│   └── groqService.ts     # Groq API integration
├── App.tsx                # Main app component
├── types.ts               # TypeScript type definitions
├── index.tsx              # App entry point
└── index.html             # HTML template
```

---

## 🎯 Usage

### Starting a New Chat
1. Click the **"New Chat"** button in the sidebar
2. Type your message in the input field
3. Press **Enter** or click the **Send** button

### Editing Messages
1. Hover over your message
2. Click the **pencil icon**
3. Edit the text and click **"Save & Submit"**

### Regenerating Responses
1. Hover over your message
2. Click the **refresh icon**
3. Get a new AI response

### Theme Switching
Click the theme icon in the header to cycle through:
- ☀️ Light Mode
- 🌙 Dark Mode
- ✨ OLED Mode (Pure black for OLED screens)

---

## 🎨 Customization

### Change AI Model
Edit `services/groqService.ts`:
```typescript
model: 'llama-3.3-70b-versatile', // Change to your preferred model
```

Available models:
- `llama-3.3-70b-versatile` (Default)
- `mixtral-8x7b-32768`
- `gemma-7b-it`

### Customize Colors
Edit the CSS variables in `index.html`:
```css
:root {
  --color-cyan-accent: #06b6d4; /* Change accent color */
  --color-bkg: #ffffff;
  /* ... other colors */
}
```

---

## 🐛 Troubleshooting

### API Key Error
**Error:** `VITE_GROQ_API_KEY is not set`

**Solution:** 
1. Create `.env.local` file
2. Add your API key: `VITE_GROQ_API_KEY=your_key_here`
3. Restart the dev server

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Responsiveness Issues
- Clear browser cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check console for errors

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

See [ENHANCEMENTS.md](ENHANCEMENTS.md) for feature suggestions.

---

## 📝 Changelog

### Version 1.1.0 (Latest)
- ✅ Fixed all responsiveness issues for mobile/tablet
- ✅ Improved sidebar and panel z-index management
- ✅ Enhanced message layout for small screens
- ✅ Optimized InputBar button positioning
- ✅ Added settings toggle to header
- ✅ Better breakpoint management

### Version 1.0.0
- Initial release with core chat functionality
- Theme support (Light/Dark/OLED)
- Message editing and regeneration
- Code syntax highlighting
- LaTeX rendering

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Groq** for the amazing AI API
- **Tailwind CSS** for the styling framework
- **React** team for the incredible library
- **Vite** for the blazing fast build tool
- **KaTeX** for LaTeX rendering

---

## 📧 Contact

**Author:** Your Name  
**Email:** your.email@example.com  
**GitHub:** [@yourusername](https://github.com/yourusername)

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with ❤️ and ☕

</div>
