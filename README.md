# YouTube Intelligence - Transform Screenshots into Searchable Knowledge

A powerful AI-powered application that transforms iPhone screenshots into searchable, intelligent knowledge. Upload screenshots of YouTube videos, whiteboards, charts, or articles, and our AI extracts, summarizes, and organizes everything into your personal knowledge base.

## ✨ Features

- **🎯 Intelligent Content Detection** - Automatically identifies YouTube videos, whiteboards, charts, and documents
- **🧠 OBSESSIVE AI Extraction** - Comprehensive extraction of frameworks, numbers, people, timelines, and insights
- **📱 iPhone Screenshot Support** - Optimized for mobile screenshots and photos
- **🔍 Natural Language Search** - Search your knowledge base using conversational queries
- **📊 Knowledge Analytics** - Track your learning progress and content processing
- **⚡ Batch Processing** - Upload multiple screenshots for efficient processing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Claude API key
- YouTube Data API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd youtube-intelligence
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   # Claude API Key for AI analysis
   CLAUDE_API_KEY=your_claude_api_key_here
   
   # YouTube API Key for video search and metadata
   YOUTUBE_API_KEY=your_youtube_api_key_here
   
   # Next.js environment
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 API Keys Setup

### Claude API
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and generate an API key
3. Add the key to your `.env.local` file

### YouTube Data API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API key)
5. Add the key to your `.env.local` file

## 📱 How to Use

1. **Capture Knowledge**
   - Upload iPhone screenshots of YouTube videos, whiteboards, or articles
   - Drag & drop or tap to select multiple files
   - AI automatically detects content type and processes accordingly

2. **AI Processing**
   - For YouTube videos: Extracts title, channel, transcript, and generates comprehensive summaries
   - For visual content: OCR extraction with intelligent analysis and insights
   - OBSESSIVE extraction of frameworks, numbers, people, and key concepts

3. **Search & Discover**
   - Use natural language to search your knowledge base
   - Find specific insights, frameworks, or content
   - Browse by content type or processing date

4. **Knowledge Analytics**
   - Track your learning progress
   - Monitor processing costs and confidence scores
   - View content type breakdowns

## 🏗️ Architecture

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with custom dark theme
- **AI Processing**: Claude 3.5 Sonnet for content analysis
- **Video Processing**: YouTube Data API for metadata extraction
- **Database**: SQLite for local storage and search indexing
- **Deployment**: Vercel-ready configuration

## 🎨 UI Features

- **Dark Theme**: Sophisticated dark interface with purple/blue gradients
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern Components**: Polished cards, buttons, and interactive elements
- **Smooth Animations**: Subtle transitions and hover effects
- **Intuitive Navigation**: Clear tabs for Capture, Library, and Stats

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run vercel-build` - Build for Vercel deployment

### Project Structure

```
youtube-intelligence/
├── app/                    # Next.js app directory
│   ├── components/        # React components
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Main page
├── api/                   # API routes
│   ├── process.js         # Content processing
│   ├── search.js          # Search functionality
│   └── batch.js           # Batch processing
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Manual Deployment

1. Build the application: `npm run build`
2. Start production server: `npm run start`
3. Configure your hosting provider

## 📈 Performance

- **Processing Speed**: Optimized batch processing with configurable delays
- **API Efficiency**: Smart caching and error handling
- **Search Performance**: Full-text search indexing for fast queries
- **Cost Optimization**: Batch processing to minimize API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your API keys are correct
3. Ensure all dependencies are installed
4. Check the browser's network tab for API failures

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Advanced filtering and categorization
- [ ] Export functionality (PDF, Markdown)
- [ ] Collaborative knowledge sharing
- [ ] Mobile app development
- [ ] Integration with note-taking apps

---

**Transform your screenshots into searchable knowledge today! 🚀**
