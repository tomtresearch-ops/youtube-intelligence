# Environment Setup Guide

## Quick Setup

1. **Create `.env.local` file** in the root directory
2. **Add your API keys** (see below)
3. **Restart the development server**

## Required Environment Variables

```bash
# Claude API Key for AI analysis
# Get from: https://console.anthropic.com/
CLAUDE_API_KEY=your_claude_api_key_here

# YouTube API Key for video search and metadata
# Get from: https://console.cloud.google.com/apis/credentials
YOUTUBE_API_KEY=your_youtube_api_key_here

# Next.js environment
NODE_ENV=development
```

## Getting Your API Keys

### Claude API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy and paste into `.env.local`

### YouTube Data API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Go to Credentials
5. Create API Key
6. Copy and paste into `.env.local`

## Testing the Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** to [http://localhost:3000](http://localhost:3000)

3. **Upload a screenshot** to test the processing

4. **Check the console** for any API errors

## Troubleshooting

- **"API key invalid"** - Double-check your keys in `.env.local`
- **"Missing environment variable"** - Restart the dev server after adding keys
- **"Rate limit exceeded"** - Check your API quotas and billing

## Security Notes

- **Never commit** `.env.local` to Git (it's already in `.gitignore`)
- **Keep your API keys** private and secure
- **Rotate keys** regularly for production use
