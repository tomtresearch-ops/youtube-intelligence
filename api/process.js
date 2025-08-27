// Visual Intelligence Processor - Enhanced Vercel API Route
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Database setup with enhanced schema
let db;
async function initDatabase() {
  if (!db) {
    db = await open({
      filename: '/tmp/visual_intelligence.db',
      driver: sqlite3.Database
    });
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS processed_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE,
        content_type TEXT, -- 'youtube' or 'ocr'
        video_url TEXT,
        title TEXT,
        channel TEXT,
        duration TEXT,
        raw_transcript TEXT,
        extracted_text TEXT,
        enhanced_summary TEXT,
        key_insights TEXT, -- JSON array
        topics TEXT, -- JSON array
        people_mentioned TEXT, -- JSON array
        processed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        confidence_score REAL,
        processing_cost REAL,
        metadata TEXT -- JSON for additional data
      )
    `);

    // Create full-text search index
    await db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS content_search USING fts5(
        id,
        title,
        channel,
        enhanced_summary,
        key_insights,
        topics,
        people_mentioned,
        extracted_text,
        raw_transcript
      )
    `);
  }
  return db;
}

// Detect content type from screenshot using Claude Vision
async function detectContentType(imageBase64) {
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
            text: `Analyze this image and determine its content type. Return JSON with:
            {
              "type": "youtube" | "document" | "whiteboard" | "chart" | "other",
              "confidence": 0-1,
              "description": "brief description",
              "youtube_metadata": {
                "title": "...",
                "channel": "...",
                "timestamp": "...",
                "views": "..."
              } // only if type is youtube
            }
            
            For YouTube videos, extract title, channel, timestamp, views if visible.
            For other content, focus on identifying the type of visual information.`
          }
        ]
      }]
    })
  });
  
  const data = await response.json();
  try {
    return JSON.parse(data.content[0].text);
  } catch (e) {
    return { 
      type: 'other', 
      confidence: 0, 
      error: 'Failed to parse content type',
      description: 'Unknown content'
    };
  }
}

// Extract text content using OCR and AI analysis
async function extractTextContent(imageBase64) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
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
            text: `Extract and analyze all text content from this image. Return JSON with:
            {
              "extracted_text": "all visible text transcribed accurately",
              "title": "inferred title or main topic",
              "content_type": "whiteboard|chart|article|document|meeting_notes|other",
              "key_insights": ["insight1", "insight2", ...],
              "topics": ["topic1", "topic2", ...],
              "people_mentioned": ["person1", "person2", ...],
              "data_points": ["data1", "data2", ...], // for charts/graphs
              "frameworks": ["framework1", ...], // for business content
              "summary": "2-3 sentence summary of the content"
            }
            
            Focus on:
            - Accurate text transcription
            - Key insights and takeaways
            - Important data points or metrics
            - Business frameworks or methodologies
            - People, companies, or tools mentioned`
          }
        ]
      }]
    })
  });
  
  const data = await response.json();
  try {
    return JSON.parse(data.content[0].text);
  } catch (e) {
    return {
      extracted_text: 'Failed to extract text',
      title: 'Text extraction failed',
      content_type: 'other',
      key_insights: [],
      topics: [],
      people_mentioned: [],
      summary: 'Could not process image content'
    };
  }
}

// Find YouTube video using metadata
async function findYouTubeVideo(metadata) {
  if (!metadata.youtube_metadata || metadata.confidence < 0.5) return null;
  
  const { title, channel } = metadata.youtube_metadata;
  const searchQuery = `${title} ${channel}`.replace(/[^\w\s]/g, '');
  
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=5`
  );
  
  const data = await response.json();
  if (!data.items || data.items.length === 0) return null;
  
  // Find best match by title similarity
  let bestMatch = null;
  let bestScore = 0;
  
  for (const item of data.items) {
    const similarity = calculateSimilarity(title.toLowerCase(), item.snippet.title.toLowerCase());
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
    // Using a more reliable transcript service
    const response = await fetch(`https://youtube-transcript-api.herokuapp.com/transcript?video_id=${videoId}`);
    const data = await response.json();
    
    if (data.error) return null;
    
    return data.map(item => item.text).join(' ');
  } catch (e) {
    console.error('Transcript fetch failed:', e);
    return `Transcript not available for video: ${videoId}`;
  }
}

// Generate enhanced analysis using Claude
async function generateAnalysis(content, contentType, metadata = {}) {
  const isYoutube = contentType === 'youtube';
  const analysisPrompt = isYoutube 
    ? `Analyze this YouTube transcript and return a compact, content-driven outline.

Video: "${metadata.title}" by ${metadata.channel}

Transcript (truncated):
${content.substring(0, 8000)}

Style rules (strict):
- Use 3–6 natural, content-derived section headings (editorial tone). No generic buckets.
- Include only what’s present; omit anything absent (no placeholders or “not mentioned”).
- 1–3 bullets or 1 short paragraph per section; dedupe aggressively.
- If it’s a listicle (“7 ways…”, “5 tools…”), preserve the exact count with 1–2 line blurbs per item.
- If dated predictions exist, append a final "Timeline" block with bullets like "YYYY or YYYY–YYYY — claim"; otherwise omit.

Return JSON:
- summary: markdown outline following the rules above
- key_insights: 3–7 crisp, non-redundant takeaways
- topics: 5–12 tags
- people_mentioned: entities referenced

Hard constraints: No generic headings; no invented content; no meta filler.`
    : `Analyze this extracted visual content and enhance the analysis.

Content: ${content.substring(0, 4000)}

Return JSON with:
- summary: 2-3 sentence enhanced summary
- key_insights: array of 3-5 main insights (enhance existing ones)
- topics: array of relevant topics/tags (enhance existing ones)
- people_mentioned: array of people/companies mentioned
- frameworks: array of business frameworks or methodologies mentioned
- action_items: array of actionable takeaways

Focus on extracting maximum value and searchable insights.`;

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
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: `You are to return ONLY valid JSON matching the requested schema. Do not include prose, explanations, or code fences. Forbidden headings: "Executive Summary", "Key Insights", "Frameworks & Systems", "Timelines & Predictions". If a field is absent in source content, omit it; do not write placeholders.`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ]
    })
  });
  
  const data = await response.json();
  try {
    let text = data?.content?.[0]?.text || '';
    text = text.replace(/^```[a-zA-Z]*\n?|```$/g, '');
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(text);

    if (parsed && typeof parsed.summary === 'string') {
      const forbidden = [
        'Executive Summary',
        'Key Insights',
        'Frameworks & Systems',
        'Timelines & Predictions'
      ];
      const lines = parsed.summary.split('\n').filter(line => !forbidden.some(f => line.trim().startsWith(f)));
      parsed.summary = lines.join('\n');
    }

    return parsed;
  } catch (e) {
    return {
      summary: 'Analysis unavailable for this item right now.',
      key_insights: [],
      topics: [],
      people_mentioned: [],
      frameworks: [],
      action_items: []
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

// Update search index
async function updateSearchIndex(db, contentId, data) {
  await db.run(`
    INSERT OR REPLACE INTO content_search (
      id, title, channel, enhanced_summary, key_insights, 
      topics, people_mentioned, extracted_text, raw_transcript
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    contentId,
    data.title || '',
    data.channel || '',
    data.enhanced_summary || '',
    data.key_insights || '[]',
    data.topics || '[]',
    data.people_mentioned || '[]',
    data.extracted_text || '',
    data.raw_transcript || ''
  ]);
}

// Main processing function
async function processScreenshot(filename, imageBase64) {
  const processingCost = 0.08; // Claude Vision API cost per image
  
  try {
    const db = await initDatabase();
    
    // Check if already processed
    const existing = await db.get('SELECT id FROM processed_content WHERE filename = ?', filename);
    if (existing) {
      return { status: 'already_processed', filename };
    }
    
    console.log(`Processing ${filename}...`);
    
    // Step 1: Detect content type
    const contentDetection = await detectContentType(imageBase64);
    
    let result = {
      status: 'success',
      filename,
      contentType: contentDetection.type,
      confidence: contentDetection.confidence,
      processingCost
    };
    
    if (contentDetection.type === 'youtube' && contentDetection.confidence > 0.5) {
      // Process as YouTube video
      const videoMatch = await findYouTubeVideo(contentDetection);
      if (videoMatch) {
        const transcript = await getYouTubeTranscript(videoMatch.videoId);
        const analysis = await generateAnalysis(transcript, 'youtube', videoMatch);
        
        // Store in database
        const insertResult = await db.run(`
          INSERT INTO processed_content 
          (filename, content_type, video_url, title, channel, raw_transcript, 
           enhanced_summary, key_insights, topics, people_mentioned, 
           confidence_score, processing_cost, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          filename, 'youtube', videoMatch.url, videoMatch.title, videoMatch.channel,
          transcript, analysis.summary, JSON.stringify(analysis.key_insights),
          JSON.stringify(analysis.topics), JSON.stringify(analysis.people_mentioned),
          videoMatch.confidence, processingCost, JSON.stringify(contentDetection)
        ]);
        
        // Update search index
        await updateSearchIndex(db, insertResult.lastID, {
          title: videoMatch.title,
          channel: videoMatch.channel,
          enhanced_summary: analysis.summary,
          key_insights: JSON.stringify(analysis.key_insights),
          topics: JSON.stringify(analysis.topics),
          people_mentioned: JSON.stringify(analysis.people_mentioned),
          raw_transcript: transcript
        });
        
        result.video = videoMatch;
        result.analysis = analysis;
        
      } else {
        result.status = 'video_not_found';
        result.metadata = contentDetection.youtube_metadata;
      }
    } else {
      // Process as visual content (OCR)
      const ocrResult = await extractTextContent(imageBase64);
      const analysis = await generateAnalysis(
        JSON.stringify(ocrResult), 
        'ocr', 
        { title: ocrResult.title }
      );
      
      // Store in database
      const insertResult = await db.run(`
        INSERT INTO processed_content 
        (filename, content_type, title, extracted_text, enhanced_summary, 
         key_insights, topics, people_mentioned, confidence_score, 
         processing_cost, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        filename, 'ocr', ocrResult.title, ocrResult.extracted_text,
        analysis.summary, JSON.stringify(analysis.key_insights),
        JSON.stringify(analysis.topics), JSON.stringify(analysis.people_mentioned),
        contentDetection.confidence, processingCost, JSON.stringify(ocrResult)
      ]);
      
      // Update search index
      await updateSearchIndex(db, insertResult.lastID, {
        title: ocrResult.title,
        enhanced_summary: analysis.summary,
        key_insights: JSON.stringify(analysis.key_insights),
        topics: JSON.stringify(analysis.topics),
        people_mentioned: JSON.stringify(analysis.people_mentioned),
        extracted_text: ocrResult.extracted_text
      });
      
      result.contentType = 'ocr';
      result.ocr = ocrResult;
      result.analysis = analysis;
    }
    
    console.log(`Successfully processed ${filename} as ${result.contentType}`);
    return result;
    
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
    return { 
      status: 'error', 
      filename, 
      error: error.message,
      processingCost 
    };
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
  
  const { filename, imageBase64, batch } = req.body;
  
  if (!filename || !imageBase64) {
    return res.status(400).json({ error: 'Missing filename or imageBase64' });
  }
  
  // Handle single file processing
  if (!batch) {
    const result = await processScreenshot(filename, imageBase64);
    return res.status(200).json(result);
  }
  
  // Handle batch processing (if batch flag is set)
  // This would be implemented for processing multiple files
  return res.status(400).json({ error: 'Batch processing not yet implemented in this endpoint' });
}
