// Visual Intelligence Processor - Enhanced Vercel API Route with OBSESSIVE Extraction
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

// Extract text content using OCR and AI analysis with OBSESSIVE extraction
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
      max_tokens: 4000,
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
            text: `You are an obsessive intelligence extraction specialist. Your ONLY job is to find and extract EVERY specific detail, framework, number, name, and concept from this image. Miss NOTHING.

CRITICAL EXTRACTION MANDATE:
- Find EVERY named framework, system, acronym, or model (like "FACE RIPS", "MAP-MAD", etc.)
- Extract EVERY number, date, percentage, dollar amount, timeline (2026, 2027, $2.71 trillion, etc.)
- List EVERY person, company, book, tool mentioned by name
- Document EVERY process, method, or step-by-step explanation
- Capture EVERY prediction, forecast, or timeline estimate

Extract with OBSESSIVE detail and return JSON with:

{
    "core_thesis": "Single sentence capturing the main argument or key insight",
    
    "named_frameworks_extracted": [
        "EVERY framework mentioned by name with complete breakdown of all components",
        "Any acronym or system (like FACE RIPS, MAP-MAD) with each letter/part explained",
        "Models or theories referenced with full details"
    ],
    
    "all_numbers_and_data": [
        "EVERY specific number: dollar amounts, percentages, years, quantities with full context",
        "All timelines and dates mentioned: 2026, 2027, specific timeframes",
        "Financial figures: trillion dollar amounts, budget numbers, costs",
        "Statistics and metrics: view counts, percentages, rates"
    ],
    
    "extracted_intelligence": {
        "specific_methods": [
            "Method/approach described with complete details",
            "Process explained with all steps and context"
        ],
        "tools_and_resources": [
            "Tool/platform mentioned: what it does and specific capabilities",
            "Resource referenced: full details and context provided"
        ],
        "concepts_explained": [
            "Complex idea broken down with examples",
            "Theory or principle with real-world applications described"
        ]
    },
    
    "detailed_breakdown": {
        "argument_structure": "How the speaker builds their case from A to B to C",
        "supporting_evidence": [
            "Evidence type 1: specific examples and data points",
            "Proof point 2: how it supports the main thesis"
        ],
        "methodology_explained": [
            "Step-by-step process described in the content",
            "Approach or system outlined with implementation details"
        ]
    },
    
    "critical_information": {
        "contrarian_positions": [
            "Surprising viewpoint that challenges conventional thinking",
            "Unusual perspective with supporting reasoning provided"
        ],
        "important_distinctions": [
            "Key differences between concept A and concept B explained",
            "Clarification of commonly confused ideas"
        ],
        "notable_claims": [
            "Significant assertion made with supporting context",
            "Important statement with implications explained"
        ]
    },
    
    "entities_and_references": {
        "people_mentioned": ["Name: role and specific relevance to content"],
        "companies_technologies": ["Company/tech: what they do and why mentioned"],
        "books_resources": ["Resource: key relevance and takeaway"],
        "specific_examples": ["Real example: what happened and why it matters"]
    },
    
    "intelligence_synthesis": {
        "connections_made": [
            "How concept A relates to trend B",
            "Why insight X matters for understanding Y"
        ],
        "implications_analysis": [
            "What this means for industry/field Z",
            "How this changes the landscape of topic A"
        ],
        "future_predictions": [
            "Specific prediction with timeline and reasoning",
            "Expected outcome with supporting logic"
        ]
    },
    
    "consumption_value": {
        "why_this_matters": "Clear explanation of why this content is worth your time",
        "key_competitive_advantage": "What you gain by understanding this information",
        "decision_support": "How this intelligence helps with specific decisions you might face"
    },
    
    "executive_distillation": {
        "tldr": "Most important takeaway in one sentence",
        "action_priority": "Single highest-value action from this content", 
        "remember_this": "Key insight you'll want to recall weeks later"
    }
}

OBSESSIVE EXTRACTION REQUIREMENTS:
- SCAN the image for ANY framework mentioned by name (FACE RIPS, MAP-MAD, etc.) - extract EVERY component
- FIND every single number, date, dollar amount, percentage - capture with full context  
- LOCATE every person name, company name, book title, tool name - list with relevance
- EXTRACT every process described step-by-step
- CAPTURE every prediction with specific timeline
- If a framework is mentioned, extract ALL its components and explanations
- If numbers are given, capture the EXACT figures and what they refer to
- Miss NOTHING - be obsessively thorough

Return ONLY valid JSON with no markdown formatting.`
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
      core_thesis: 'Failed to extract text',
      named_frameworks_extracted: [],
      all_numbers_and_data: [],
      extracted_intelligence: {},
      detailed_breakdown: {},
      critical_information: {},
      entities_and_references: {},
      intelligence_synthesis: {},
      consumption_value: {},
      executive_distillation: {
        tldr: 'Text extraction failed',
        action_priority: 'Review image manually',
        remember_this: 'Processing error occurred'
      }
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

// Generate enhanced analysis using Claude with OBSESSIVE extraction
async function generateAnalysis(content, contentType, metadata = {}) {
  const isYoutube = contentType === 'youtube';
  const analysisPrompt = isYoutube 
    ? `You are an obsessive intelligence extraction specialist. Your ONLY job is to find and extract EVERY specific detail, framework, number, name, and concept from this transcript. Miss NOTHING.

Video: "${metadata.title}" by ${metadata.channel}

Transcript:
${content.substring(0, 8000)}

CRITICAL EXTRACTION MANDATE:
- Find EVERY named framework, system, acronym, or model (like "FACE RIPS", "MAP-MAD", etc.)
- Extract EVERY number, date, percentage, dollar amount, timeline (2026, 2027, $2.71 trillion, etc.)
- List EVERY person, company, book, tool mentioned by name
- Document EVERY process, method, or step-by-step explanation
- Capture EVERY prediction, forecast, or timeline estimate

Extract with OBSESSIVE detail and return JSON with:

{
    "core_thesis": "Single sentence capturing the main argument or key insight",
    
    "named_frameworks_extracted": [
        "EVERY framework mentioned by name with complete breakdown of all components",
        "Any acronym or system (like FACE RIPS, MAP-MAD) with each letter/part explained",
        "Models or theories referenced with full details"
    ],
    
    "all_numbers_and_data": [
        "EVERY specific number: dollar amounts, percentages, years, quantities with full context",
        "All timelines and dates mentioned: 2026, 2027, specific timeframes",
        "Financial figures: trillion dollar amounts, budget numbers, costs",
        "Statistics and metrics: view counts, percentages, rates"
    ],
    
    "extracted_intelligence": {
        "specific_methods": [
            "Method/approach described with complete details",
            "Process explained with all steps and context"
        ],
        "tools_and_resources": [
            "Tool/platform mentioned: what it does and specific capabilities",
            "Resource referenced: full details and context provided"
        ],
        "concepts_explained": [
            "Complex idea broken down with examples",
            "Theory or principle with real-world applications described"
        ]
    },
    
    "detailed_breakdown": {
        "argument_structure": "How the speaker builds their case from A to B to C",
        "supporting_evidence": [
            "Evidence type 1: specific examples and data points",
            "Proof point 2: how it supports the main thesis"
        ],
        "methodology_explained": [
            "Step-by-step process described in the content",
            "Approach or system outlined with implementation details"
        ]
    },
    
    "critical_information": {
        "contrarian_positions": [
            "Surprising viewpoint that challenges conventional thinking",
            "Unusual perspective with supporting reasoning provided"
        ],
        "important_distinctions": [
            "Key differences between concept A and concept B explained",
            "Clarification of commonly confused ideas"
        ],
        "notable_claims": [
            "Significant assertion made with supporting context",
            "Important statement with implications explained"
        ]
    },
    
    "entities_and_references": {
        "people_mentioned": ["Name: role and specific relevance to content"],
        "companies_technologies": ["Company/tech: what they do and why mentioned"],
        "books_resources": ["Resource: key relevance and takeaway"],
        "specific_examples": ["Real example: what happened and why it matters"]
    },
    
    "intelligence_synthesis": {
        "connections_made": [
            "How concept A relates to trend B",
            "Why insight X matters for understanding Y"
        ],
        "implications_analysis": [
            "What this means for industry/field Z",
            "How this changes the landscape of topic A"
        ],
        "future_predictions": [
            "Specific prediction with timeline and reasoning",
            "Expected outcome with supporting logic"
        ]
    },
    
    "consumption_value": {
        "why_this_matters": "Clear explanation of why this content is worth your time",
        "key_competitive_advantage": "What you gain by understanding this information",
        "decision_support": "How this intelligence helps with specific decisions you might face"
    },
    
    "executive_distillation": {
        "tldr": "Most important takeaway in one sentence",
        "action_priority": "Single highest-value action from this content", 
        "remember_this": "Key insight you'll want to recall weeks later"
    }
}

OBSESSIVE EXTRACTION REQUIREMENTS:
- SCAN the transcript for ANY framework mentioned by name (FACE RIPS, MAP-MAD, etc.) - extract EVERY component
- FIND every single number, date, dollar amount, percentage - capture with full context  
- LOCATE every person name, company name, book title, tool name - list with relevance
- EXTRACT every process described step-by-step
- CAPTURE every prediction with specific timeline
- If a framework is mentioned, extract ALL its components and explanations
- If numbers are given, capture the EXACT figures and what they refer to
- Miss NOTHING - be obsessively thorough

Return ONLY valid JSON with no markdown formatting.`
    : `You are an obsessive intelligence extraction specialist. Your ONLY job is to find and extract EVERY specific detail, framework, number, name, and concept from this content. Miss NOTHING.

Content: ${content.substring(0, 4000)}

CRITICAL EXTRACTION MANDATE:
- Find EVERY named framework, system, acronym, or model (like "FACE RIPS", "MAP-MAD", etc.)
- Extract EVERY number, date, percentage, dollar amount, timeline (2026, 2027, $2.71 trillion, etc.)
- List EVERY person, company, book, tool mentioned by name
- Document EVERY process, method, or step-by-step explanation
- Capture EVERY prediction, forecast, or timeline estimate

Extract with OBSESSIVE detail and return JSON with:

{
    "core_thesis": "Single sentence capturing the main argument or key insight",
    
    "named_frameworks_extracted": [
        "EVERY framework mentioned by name with complete breakdown of all components",
        "Any acronym or system (like FACE RIPS, MAP-MAD) with each letter/part explained",
        "Models or theories referenced with full details"
    ],
    
    "all_numbers_and_data": [
        "EVERY specific number: dollar amounts, percentages, years, quantities with full context",
        "All timelines and dates mentioned: 2026, 2027, specific timeframes",
        "Financial figures: trillion dollar amounts, budget numbers, costs",
        "Statistics and metrics: view counts, percentages, rates"
    ],
    
    "extracted_intelligence": {
        "specific_methods": [
            "Method/approach described with complete details",
            "Process explained with all steps and context"
        ],
        "tools_and_resources": [
            "Tool/platform mentioned: what it does and specific capabilities",
            "Resource referenced: full details and context provided"
        ],
        "concepts_explained": [
            "Complex idea broken down with examples",
            "Theory or principle with real-world applications described"
        ]
    },
    
    "detailed_breakdown": {
        "argument_structure": "How the speaker builds their case from A to B to C",
        "supporting_evidence": [
            "Evidence type 1: specific examples and data points",
            "Proof point 2: how it supports the main thesis"
        ],
        "methodology_explained": [
            "Step-by-step process described in the content",
            "Approach or system outlined with implementation details"
        ]
    },
    
    "critical_information": {
        "contrarian_positions": [
            "Surprising viewpoint that challenges conventional thinking",
            "Unusual perspective with supporting reasoning provided"
        ],
        "important_distinctions": [
            "Key differences between concept A and concept B explained",
            "Clarification of commonly confused ideas"
        ],
        "notable_claims": [
            "Significant assertion made with supporting context",
            "Important statement with implications explained"
        ]
    },
    
    "entities_and_references": {
        "people_mentioned": ["Name: role and specific relevance to content"],
        "companies_technologies": ["Company/tech: what they do and why mentioned"],
        "books_resources": ["Resource: key relevance and takeaway"],
        "specific_examples": ["Real example: what happened and why it matters"]
    },
    
    "intelligence_synthesis": {
        "connections_made": [
            "How concept A relates to trend B",
            "Why insight X matters for understanding Y"
        ],
        "implications_analysis": [
            "What this means for industry/field Z",
            "How this changes the landscape of topic A"
        ],
        "future_predictions": [
            "Specific prediction with timeline and reasoning",
            "Expected outcome with supporting logic"
        ]
    },
    
    "consumption_value": {
        "why_this_matters": "Clear explanation of why this content is worth your time",
        "key_competitive_advantage": "What you gain by understanding this information",
        "decision_support": "How this intelligence helps with specific decisions you might face"
    },
    
    "executive_distillation": {
        "tldr": "Most important takeaway in one sentence",
        "action_priority": "Single highest-value action from this content", 
        "remember_this": "Key insight you'll want to recall weeks later"
    }
}

OBSESSIVE EXTRACTION REQUIREMENTS:
- SCAN the content for ANY framework mentioned by name (FACE RIPS, MAP-MAD, etc.) - extract EVERY component
- FIND every single number, date, dollar amount, percentage - capture with full context  
- LOCATE every person name, company name, book title, tool name - list with relevance
- EXTRACT every process described step-by-step
- CAPTURE every prediction with specific timeline
- If a framework is mentioned, extract ALL its components and explanations
- If numbers are given, capture the EXACT figures and what they refer to
- Miss NOTHING - be obsessively thorough

Return ONLY valid JSON with no markdown formatting.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: analysisPrompt
      }]
    })
  });
  
  const data = await response.json();
  try {
    return JSON.parse(data.content[0].text);
  } catch (e) {
    return {
      core_thesis: 'Failed to generate enhanced analysis',
      named_frameworks_extracted: [],
      all_numbers_and_data: [],
      extracted_intelligence: {},
      detailed_breakdown: {},
      critical_information: {},
      entities_and_references: {},
      intelligence_synthesis: {},
      consumption_value: {},
      executive_distillation: {
        tldr: 'Analysis generation failed',
        action_priority: 'Review content manually',
        remember_this: 'Processing error occurred'
      }
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
          transcript, JSON.stringify(analysis), JSON.stringify(analysis.named_frameworks_extracted),
          JSON.stringify(analysis.all_numbers_and_data), JSON.stringify(analysis.entities_and_references?.people_mentioned || []),
          videoMatch.confidence, processingCost, JSON.stringify(contentDetection)
        ]);
        
        // Update search index
        await updateSearchIndex(db, insertResult.lastID, {
          title: videoMatch.title,
          channel: videoMatch.channel,
          enhanced_summary: analysis.core_thesis,
          key_insights: JSON.stringify(analysis.named_frameworks_extracted),
          topics: JSON.stringify(analysis.all_numbers_and_data),
          people_mentioned: JSON.stringify(analysis.entities_and_references?.people_mentioned || []),
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
        { title: ocrResult.core_thesis }
      );
      
      // Store in database
      const insertResult = await db.run(`
        INSERT INTO processed_content 
        (filename, content_type, title, extracted_text, enhanced_summary, 
         key_insights, topics, people_mentioned, confidence_score, 
         processing_cost, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        filename, 'ocr', ocrResult.core_thesis, JSON.stringify(ocrResult),
        JSON.stringify(analysis), JSON.stringify(analysis.named_frameworks_extracted),
        JSON.stringify(analysis.all_numbers_and_data), JSON.stringify(analysis.entities_and_references?.people_mentioned || []),
        contentDetection.confidence, processingCost, JSON.stringify(ocrResult)
      ]);
      
      // Update search index
      await updateSearchIndex(db, insertResult.lastID, {
        title: ocrResult.core_thesis,
        enhanced_summary: analysis.core_thesis,
        key_insights: JSON.stringify(analysis.named_frameworks_extracted),
        topics: JSON.stringify(analysis.all_numbers_and_data),
        people_mentioned: JSON.stringify(analysis.entities_and_references?.people_mentioned || []),
        extracted_text: JSON.stringify(ocrResult)
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
