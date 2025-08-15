# Visual Intelligence System

Transform visual content into searchable intelligence. Upload screenshots of YouTube videos, whiteboards, charts, articles, or PDFs to extract and organize content for instant natural language search.

## 🚀 Features

### Track 1: YouTube Intelligence
- **Screenshot to Video**: Upload iPhone screenshot of YouTube video → extract title/channel → find actual video → get full transcript → generate AI summary
- **Smart Detection**: Automatically identifies YouTube content and matches to original videos
- **Rich Analysis**: Extract key insights, topics, people mentioned, and actionable takeaways

### Track 2: Visual Content → Structured Data
- **OCR Extraction**: Screenshots of whiteboards, charts, articles, PDFs → text extraction → structured data
- **Content Understanding**: Extract frameworks, data points, key insights, and relationships
- **Multiple Formats**: Handwritten notes, business charts, crypto analysis, meeting screenshots

### Unified Search
- **Natural Language**: Search using phrases like "Show me AI tools from videos" or "Find crypto analysis from whiteboards"
- **Semantic Search**: AI-powered understanding goes beyond keyword matching
- **Content Types**: Filter by YouTube videos, visual content, or search across all
- **Time Filters**: Find content from yesterday, last week, or specific time periods

### Modern Interface
- **Mobile-First**: Optimized for iPhone screenshot uploads
- **Batch Processing**: Handle 10+ screenshots at once
- **Real-Time Status**: Live processing updates and cost tracking
- **Clean Design**: Fast, intuitive interface for daily use

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Vercel API Routes, Node.js
- **Database**: SQLite with FTS5 for full-text search
- **AI**: Claude Vision API for image analysis, Claude Sonnet for text processing
- **APIs**: YouTube Data API for video matching
- **Deployment**: Vercel with automatic CI/CD

## 📋 Prerequisites

1. **Claude API Key**: Get from [Anthropic Console](https://console.anthropic.com/)
2. **YouTube Data API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/)
3. **Vercel Account**: For deployment ([vercel.com](https://vercel.com))

## 🔧 Installation & Setup

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd visual-intelligence-system
npm install
```

### 2. Environment Variables
Create environment variables in Vercel dashboard:

```bash
# Required API Keys
CLAUDE_API_KEY=your_claude_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🎯 Usage Guide

### Upload Screenshots
1. **Single Upload**: Drag & drop or click to select images
2. **Batch Upload**: Select multiple files (up to 50 at once)
3. **Mobile**: Use camera or gallery directly from iPhone
4. **Supported**: JPEG, PNG, WebP up to 10MB each

### Processing Types

**YouTube Videos**:
- Screenshot any YouTube video page
- AI detects video information and finds original
- Extracts full transcript and generates summary
- Cost: ~$0.08 per screenshot

**Visual Content**:
- Whiteboards, charts, meeting notes, articles
- OCR extraction with AI enhancement
- Structured data with key insights
- Cost: ~$0.08 per screenshot

### Search Your Content
- **Natural Language**: "Show me videos about AI tools"
- **Content Filter**: "crypto analysis whiteboards"
- **Time-based**: "meeting notes from yesterday"
- **People/Companies**: "videos mentioning OpenAI"

## 📊 API Reference

### Process Single File
```bash
POST /api/process
{
  "filename": "screenshot.jpg",
  "imageBase64": "base64_encoded_image"
}
```

### Batch Processing
```bash
POST /api/batch
{
  "files": [
    {
      "filename": "file1.jpg",
      "imageBase64": "base64_data"
    }
  ]
}

GET /api/batch?batchId=abc123
```

### Search Content
```bash
POST /api/search
{
  "query": "AI tools from videos",
  "limit": 20
}
```

## 💰 Cost Structure

- **Claude Vision**: $0.08 per image analysis
- **YouTube API**: Free (quota: 10,000 requests/day)
- **Vercel Hosting**: Free tier available
- **Estimated**: ~$8 for 100 screenshots/month

## 🔒 Security & Privacy

- **No Image Storage**: Images processed and discarded immediately
- **Local Database**: SQLite in Vercel's temporary storage
- **API Keys**: Securely stored in Vercel environment
- **CORS**: Configured for security

## 🚀 Performance

- **Processing Speed**: 15-30 seconds per image
- **Batch Processing**: 3 files processed simultaneously
- **Search Speed**: Sub-second full-text search
- **Mobile Optimized**: Fast uploads from iPhone

## 🛣 Roadmap

- [ ] **Advanced OCR**: Tesseract.js integration for offline processing
- [ ] **Video Summaries**: Direct YouTube video analysis
- [ ] **Export Features**: PDF reports, data export
- [ ] **Team Collaboration**: Shared workspaces
- [ ] **Mobile App**: Native iOS/Android apps
- [ ] **Integrations**: Notion, Obsidian, Roam Research

## 🐛 Troubleshooting

### Common Issues

**"Processing Failed"**
- Check image size (max 10MB)
- Verify image format (JPEG/PNG/WebP)
- Ensure clear, readable content

**"Video Not Found"**
- YouTube title/channel might be unclear in screenshot
- Try different screenshot with clearer text
- System will fall back to OCR extraction

**"Search Returns No Results"**
- Process more content first
- Try broader search terms
- Check for typos in search query

### Debug Mode
Set `NODE_ENV=development` for detailed logs.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: This README
- **API Questions**: Check API reference above

---

**Built for productivity enthusiasts who capture 100-200 visual insights monthly and want them instantly searchable rather than lost in camera roll chaos.**
