// YouTube Intelligence Processor - Vercel API Route
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Database setup
let db;
async function initDatabase() {
  if (!db) {
    db = await open({
      filename: '/tmp/youtube_intelligence.db',
      driver: sqlite3.Database
    });
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS processed_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE,
        video_url TEXT,
        title TEXT,
        channel TEXT,
        duration TEXT,
        raw_transcript TEXT,
        enhanced_summary TEXT,
        key_insights TEXT,
        processed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        confidence_score REAL
      )
    `);
  }
  return db;
}

// Extract video metadata from screenshot using Claude Vision
async function extractVideoMetadata(imageBase64) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: 'Extract YouTube video information from this screenshot. Return JSON with: title, channel, timestamp, views, confidence (0-1). If not a YouTube video, return confidence: 0.'
          }
        ]
      }]
    })
  });
  
  const data = await response.json();
  try {
    return JSON.parse(data.content[0].text);
  } catch (e) {
    return { confidence: 0, error: 'Failed to parse metadata' };
  }
}

// Find YouTube video using metadata
async function findYouTubeVideo(metadata) {
  if (metadata.confidence < 0.5) return null;
  
  const searchQuery = `${metadata.title} ${metadata.channel}`.replace(/[^\w\s]/g, '');
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=5`
  );
  
  const data = await response.json();
  if (!data.items || data.items.length === 0) return null;
  
  // Find best match by title similarity
  let bestMatch = null;
  let bestScore = 0;
  
  for (const item of data.items) {
    const similarity = calculateSimilarity(metadata.title.toLowerCase(), item.snippet.title.toLowerCase());
    if (similarity > bestScore && similarity > 0.6) {
      bestScore = similarity;
      bestMatch = {
        videoId: item.id.videoId,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        confidence: similarity
      };
    }
  }
  
  return bestMatch;
}

// Get YouTube transcript
async function getYouTubeTranscript(videoId) {
  try {
    // Simple transcript extraction - you may need to replace with working service
    const response = await fetch(`https://youtube-transcript-api.herokuapp.com/transcript?video_id=${videoId}`);
    const data = await response.json();
    
    if (data.error) return null;
    
    return data.map(item => item.text).join(' ');
  } catch (e) {
    console.error('Transcript fetch failed:', e);
    return `Transcript not available for video: ${videoId}`;
  }
}

// Generate enhanced summary using Claude
async function generateSummary(transcript, videoMetadata) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this YouTube video transcript and create an enhanced summary.

Video: "${videoMetadata.title}" by ${videoMetadata.channel}

Transcript:
${transcript.substring(0, 8000)}

Return JSON with:
- summary: 2-3 sentence overview
- key_insights: array of 3-5 main takeaways
- topics: array of relevant topics/tags
- people_mentioned: array of people/companies mentioned

Focus on actionable insights and key information.`
      }]
    })
  });
  
  const data = await response.json();
  try {
    return JSON.parse(data.content[0].text);
  } catch (e) {
    return {
      summary: 'Failed to generate summary',
      key_insights: [],
      topics: [],
      people_mentioned: []
    };
  }
}

// String similarity calculation
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Main processing function
async function processScreenshot(filename, imageBase64) {
  try {
    const db = await initDatabase();
    
    // Check if already processed
    const existing = await db.get('SELECT id FROM processed_videos WHERE filename = ?', filename);
    if (existing) {
      return { status: 'already_processed', filename };
    }
    
    console.log(`Processing ${filename}...`);
    
    // Step 1: Extract metadata from screenshot
    const metadata = await extractVideoMetadata(imageBase64);
    if (metadata.confidence < 0.5) {
      return { status: 'not_youtube_video', filename, confidence: metadata.confidence };
    }
    
    // Step 2: Find YouTube video
    const videoMatch = await findYouTubeVideo(metadata);
    if (!videoMatch) {
      return { status: 'video_not_found', filename, metadata };
    }
    
    // Step 3: Get transcript
    const transcript = await getYouTubeTranscript(videoMatch.videoId);
    
    // Step 4: Generate enhanced summary
    const analysis = await generateSummary(transcript, videoMatch);
    
    // Step 5: Store in database
    await db.run(`
      INSERT INTO processed_videos 
      (filename, video_url, title, channel, raw_transcript, enhanced_summary, key_insights, confidence_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      filename,
      videoMatch.url,
      videoMatch.title,
      videoMatch.channel,
      transcript,
      analysis.summary,
      JSON.stringify(analysis.key_insights),
      videoMatch.confidence
    ]);
    
    console.log(`Successfully processed ${filename}`);
    
    return {
      status: 'success',
      filename,
      video: videoMatch,
      analysis
    };
    
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
    return { status: 'error', filename, error: error.message };
  }
}

// Vercel API handler
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { filename, imageBase64 } = req.body;
  
  if (!filename || !imageBase64) {
    return res.status(400).json({ error: 'Missing filename or imageBase64' });
  }
  
  const result = await processScreenshot(filename, imageBase64);
  
  res.status(200).json(result);
}
