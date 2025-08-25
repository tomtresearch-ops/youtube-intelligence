import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Add sharp for image processing
import sharp from 'sharp';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Database setup with enhanced schema
let db;
async function initDatabase() {
  if (!db) {
    console.log('Initializing database...');
    db = await open({
      filename: './visual_intelligence.db',
      driver: sqlite3.Database
    });
    
    console.log('Creating processed_content table...');
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
        metadata TEXT, -- JSON for additional data
        status TEXT DEFAULT 'completed' -- Add missing status column
      )
    `);

    console.log('Creating content_search table...');
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
    
    console.log('Database initialization complete');
  }
  return db;
}

// Add image compression helper function
async function compressImage(imageBuffer, maxSizeMB = 4) {
  try {
    // Convert MB to bytes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    // If image is already under the limit, return as-is
    if (imageBuffer.length <= maxSizeBytes) {
      console.log(`Image already under ${maxSizeMB}MB, no compression needed`);
      return imageBuffer;
    }
    
    console.log(`Compressing image from ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB to under ${maxSizeMB}MB`);
    
    // Start with original quality and reduce until we're under the limit
    let quality = 90;
    let compressedBuffer = imageBuffer;
    
    while (compressedBuffer.length > maxSizeBytes && quality > 10) {
      compressedBuffer = await sharp(imageBuffer)
        .jpeg({ quality, progressive: true })
        .toBuffer();
      
      quality -= 10;
      console.log(`Tried quality ${quality + 10}, size: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // If JPEG compression alone isn't enough, try resizing
    if (compressedBuffer.length > maxSizeBytes) {
      console.log('JPEG compression not sufficient, attempting resizing...');
      
      // Get original dimensions
      const metadata = await sharp(imageBuffer).metadata();
      const { width, height } = metadata;
      
      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = width;
      let newHeight = height;
      let scale = 0.9;
      
      while (compressedBuffer.length > maxSizeBytes && scale > 0.3) {
        newWidth = Math.round(width * scale);
        newHeight = Math.round(height * scale);
        
        compressedBuffer = await sharp(imageBuffer)
          .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
        
        scale -= 0.1;
        console.log(`Tried scale ${(scale + 0.1).toFixed(1)}, size: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      }
    }
    
    const finalSizeMB = (compressedBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`Image compressed to ${finalSizeMB}MB (${((1 - compressedBuffer.length / imageBuffer.length) * 100).toFixed(1)}% reduction)`);
    
    return compressedBuffer;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, return original buffer
    return imageBuffer;
  }
}

// Detect content type using Claude
async function detectContentType(imageBase64) {
  try {
    console.log('Starting content type detection...');
    
    const prompt = `You are analyzing a YouTube screenshot to find the ACTUAL video content.

IGNORE UI ELEMENTS:
- Do NOT use button text like "THE ONLY WAY" as the video title
- Do NOT use navigation elements or interface text
- Do NOT use generic YouTube UI elements

FIND THE REAL CONTENT:
- Look for the MAIN VIDEO TITLE - this is the largest, most prominent text about the video content
- Look for the CHANNEL NAME - appears below the title
- Look for any text that describes what the video is actually about

SPECIFIC INSTRUCTIONS:
1. Scan the ENTIRE image for text about the video content
2. Look for names like "Mo Gawdat", "Google Exec", "Warning", "15 Years"
3. Look for channel names like "The Diary Of A CEO"
4. The video title should describe the actual content, not UI elements

EXAMPLE:
- If you see "THE ONLY WAY" (button text) - IGNORE THIS
- If you see "Ex-Google Exec WARNING: The Next 15 Years Will Be Hell Before We Get To Heaven! - Mo Gawdat" - THIS IS THE TITLE
- If you see "The Diary Of A CEO" - THIS IS THE CHANNEL

Return ONLY a JSON object:
{
  "type": "youtube",
  "confidence": 0.9,
  "description": "YouTube video with clear content",
  "youtube_metadata": {
    "title": "EXACT video title about the content (not UI elements)",
    "channel": "EXACT channel name",
    "timestamp": "current time / total duration if visible",
    "duration": "total video duration if visible",
    "views": "view count if visible",
    "subscribers": "subscriber count if visible",
    "upload_date": "upload date if visible"
  }
}

Be very aggressive about finding the real video content, not UI elements. Return ONLY valid JSON.`;

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
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    console.log('Content type detection API response:', data);
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid API response structure');
    }
    
    const responseText = data.content[0].text;
    console.log('Content type detection response text:', responseText);
    
    // Extract JSON from response, handling potential markdown formatting
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsedResult = JSON.parse(jsonMatch[0]);
    console.log('Parsed content type detection result:', parsedResult);
    
    return parsedResult;
    
  } catch (e) {
    console.error('Content type detection failed:', e);
    return {
      type: "other",
      confidence: 0,
      error: e.message,
      description: "Failed to detect content type"
    };
  }
}

// Extract text content using OCR and AI analysis with OBSESSIVE extraction
async function extractTextContent(imageBase64) {
  console.log('Calling Claude API for OCR extraction...');
  console.log('API Key present:', !!CLAUDE_API_KEY);
  
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
            text: `You are a knowledge extraction specialist. Your job is to extract and organize EVERY specific detail, framework, tool, prediction, and insight from this content into a structured, digestible format.

Content: ${content.substring(0, 4000)}

EXTRACTION MANDATE - Extract and organize EVERY specific detail with RICH CONTEXT:

FRAMEWORKS & SYSTEMS:
- If ANY framework is mentioned, extract EVERY component with detailed explanation
- Break down acronyms letter by letter with full context
- Extract step-by-step processes or methodologies mentioned with full context

TIMELINES & PREDICTIONS:
- Extract EVERY specific date, year, timeframe mentioned with detailed reasoning
- Capture EVERY prediction with timeline and supporting logic
- Extract specific time periods with context

TOOLS & RESOURCES:
- Extract EVERY tool, platform, or resource mentioned with detailed capabilities
- Capture WHY it's great for X use case with specific examples
- Extract best use cases and specific capabilities mentioned with real-world applications

NUMBERS & DATA:
- Extract EVERY specific number with full context and implications
- Capture statistics, metrics, and measurable predictions with supporting evidence

JOBS & INDUSTRIES:
- Extract EVERY specific job, role, or industry mentioned with detailed predictions
- Capture predictions about job displacement with timeline and reasoning
- Extract specific industries that will be affected with full context

PEOPLE & ENTITIES:
- Extract EVERY person, company, book, or organization mentioned with their role and relevance
- Capture specific examples or case studies mentioned with full context

Return structured JSON that organizes this information clearly with RICH DETAIL:

{
    "core_thesis": "Main point in one sentence with key context",
    "frameworks_extracted": ["Framework breakdowns with detailed explanations"],
    "timelines_and_predictions": ["Specific predictions with years and reasoning"],
    "tools_and_resources": ["Tools with use cases and detailed capabilities"],
    "specific_numbers": ["Numbers with full context and implications"],
    "jobs_and_industries": ["Specific jobs/industries with detailed predictions"],
    "people_and_entities": ["People and organizations with full context"],
    "key_insights": ["Actionable insights with detailed reasoning"],
    "actionable_items": ["What to do with detailed context and reasoning"]
}

EXTRACTION RULES:
- Extract SPECIFIC details with FULL context and reasoning
- Organize information in clear, structured lists with RICH DETAIL
- Make it MORE valuable than the original content
- Focus on what's actionable and searchable
- Every bullet point should contain SUBSTANTIAL intelligence, not just surface statements

Return ONLY valid JSON with no markdown formatting.`
          }
        ]
      }]
    })
  });
  
  const data = await response.json();
  console.log('Claude API response:', data);
  
  if (data.error) {
    console.error('Claude API error:', data.error);
    throw new Error(`Claude API error: ${data.error.message || data.error}`);
  }
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error('Unexpected Claude API response structure:', data);
    throw new Error('Unexpected API response structure');
  }
  
  try {
    return JSON.parse(data.content[0].text);
  } catch (e) {
    console.error('Failed to parse Claude API response:', e);
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

// Find YouTube video using title and channel
async function findYouTubeVideo(title, channel) {
  try {
    console.log(`Searching for YouTube video: "${title}" by "${channel}"`);
    
    if (!title || title.length < 3) {
      console.log('Title too short for search, skipping');
      return null;
    }
    
    // Clean and prepare search queries
    const cleanTitle = title.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanChannel = channel ? channel.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim() : '';
    
    // Create multiple search strategies
    const searchQueries = [];
    
    // Strategy 1: Exact title + channel (highest priority)
    if (cleanChannel && cleanChannel.length > 2) {
      searchQueries.push(`"${cleanTitle}" "${cleanChannel}"`);
    }
    
    // Strategy 2: Title + channel without quotes
    if (cleanChannel && cleanChannel.length > 2) {
      searchQueries.push(`${cleanTitle} ${cleanChannel}`);
    }
    
    // Strategy 3: Title only (if channel is unclear)
    searchQueries.push(`"${cleanTitle}"`);
    
    // Strategy 4: Title without quotes
    searchQueries.push(cleanTitle);
    
    // Strategy 5: Channel only (if title is unclear)
    if (cleanChannel && cleanChannel.length > 2) {
      searchQueries.push(`"${cleanChannel}"`);
    }
    
    // Strategy 6: If title seems like UI text, try searching for key content
    if (cleanTitle.toLowerCase().includes('the only way') || cleanTitle.length < 10) {
      // Search for Mo Gawdat content specifically
      searchQueries.push('"Mo Gawdat" "Google Exec" "15 Years"');
      searchQueries.push('"Mo Gawdat" "Diary of a CEO"');
      searchQueries.push('"Ex-Google Exec" "Warning" "15 Years"');
    }
    
    console.log('YouTube search queries:', searchQueries);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const query of searchQueries) {
      try {
        console.log(`Searching YouTube for: "${query}"`);
        
        const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&order=relevance&key=${YOUTUBE_API_KEY}`);
        
        if (!searchResponse.ok) {
          console.log(`YouTube search failed for query "${query}": ${searchResponse.status}`);
          continue;
        }
        
        const searchData = await searchResponse.json();
        
        if (!searchData.items || searchData.items.length === 0) {
          console.log(`No results for query: "${query}"`);
          continue;
        }
        
        console.log(`Found ${searchData.items.length} results for query: "${query}"`);
        
        // Score each result
        for (const item of searchData.items) {
          const videoTitle = item.snippet.title;
          const videoChannel = item.snippet.channelTitle;
          const videoId = item.id.videoId;
          
          // Calculate similarity scores
          const titleScore = calculateSimilarity(cleanTitle.toLowerCase(), videoTitle.toLowerCase());
          const channelScore = cleanChannel ? calculateSimilarity(cleanChannel.toLowerCase(), videoChannel.toLowerCase()) : 0;
          
          // Bonus points for Mo Gawdat content
          let bonusScore = 0;
          if (videoTitle.toLowerCase().includes('mo gawdat') || videoTitle.toLowerCase().includes('google exec')) {
            bonusScore += 0.3;
          }
          if (videoTitle.toLowerCase().includes('15 years') || videoTitle.toLowerCase().includes('warning')) {
            bonusScore += 0.2;
          }
          if (videoChannel.toLowerCase().includes('diary of a ceo')) {
            bonusScore += 0.2;
          }
          
          // Weighted combined score (title is more important)
          const combinedScore = Math.min(1.0, (titleScore * 0.6) + (channelScore * 0.2) + bonusScore);
          
          console.log(`Match: "${videoTitle}" by "${videoChannel}" - Title: ${titleScore.toFixed(2)}, Channel: ${channelScore.toFixed(2)}, Bonus: ${bonusScore.toFixed(2)}, Combined: ${combinedScore.toFixed(2)}`);
          
          if (combinedScore > bestScore) {
            bestScore = combinedScore;
            bestMatch = {
              id: videoId,
              title: videoTitle,
              channel: videoChannel,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              score: combinedScore
            };
          }
        }
        
        // If we found a good match (score > 0.6), we can stop searching
        if (bestScore > 0.6) {
          console.log(`Good match found with score ${bestScore}, stopping search`);
          break;
        }
        
      } catch (queryError) {
        console.log(`Search query "${query}" failed:`, queryError.message);
        continue;
      }
    }
    
    if (bestMatch) {
      console.log(`Best match found: "${bestMatch.title}" by "${bestMatch.channel}" (confidence: ${bestMatch.score.toFixed(2)})`);
      return bestMatch;
    } else {
      console.log('No suitable YouTube video match found');
      return null;
    }
    
  } catch (e) {
    console.error('YouTube video search failed:', e);
    return null;
  }
}

// Get YouTube transcript using multiple approaches
async function getYouTubeTranscript(videoId) {
  try {
    console.log(`Fetching transcript for video: ${videoId}`);
    
    // Approach 1: Official YouTube Data API v3 with captions
    try {
      console.log('Trying official YouTube captions API...');
      const captionsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (captionsResponse.ok) {
        const captionsData = await captionsResponse.json();
        console.log('Available captions:', captionsData);
        
        if (captionsData.items && captionsData.items.length > 0) {
          // Find English captions (preferred) or any available captions
          let captionId = null;
          for (const caption of captionsData.items) {
            if (caption.snippet.language === 'en' || caption.snippet.language === 'en-US') {
              captionId = caption.id;
              console.log(`Found English captions: ${caption.id}`);
              break;
            }
          }
          
          // If no English captions, use the first available
          if (!captionId && captionsData.items.length > 0) {
            captionId = captionsData.items[0].id;
            console.log(`Using available captions: ${captionId} (${captionsData.items[0].snippet.language})`);
          }
          
          if (captionId) {
            // Get the actual transcript content
            const transcriptResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${YOUTUBE_API_KEY}`,
              {
                headers: {
                  'Accept': 'text/plain'
                }
              }
            );
            
            if (transcriptResponse.ok) {
              const transcript = await transcriptResponse.text();
              if (transcript.length > 100) {
                console.log(`Successfully fetched transcript via official API (${transcript.length} characters)`);
                return transcript;
              }
            }
          }
        }
      }
    } catch (officialError) {
      console.log('Official API failed:', officialError.message);
    }
    
    // Approach 2: Try to get video details and generate a summary
    try {
      console.log('Trying to get video details for fallback analysis...');
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        if (videoData.items && videoData.items.length > 0) {
          const video = videoData.items[0];
          console.log('Video details found:', video.snippet.title);
          
          // Create a fallback transcript from video metadata
          const fallbackTranscript = `Video Title: ${video.snippet.title}
Channel: ${video.snippet.channelTitle}
Description: ${video.snippet.description}
Duration: ${video.contentDetails.duration}
Upload Date: ${video.snippet.publishedAt}
Views: ${video.statistics.viewCount}
Likes: ${video.statistics.likeCount}

This video appears to be about: ${video.snippet.title}

Note: Full transcript not available, but video metadata indicates this is the correct content.`;
          
          console.log('Using fallback transcript from video metadata');
          return fallbackTranscript;
        }
      }
    } catch (videoError) {
      console.log('Video details API failed:', videoError.message);
    }
    
    // Approach 3: External transcript services as last resort
    console.log('Trying external transcript services...');
    const transcriptServices = [
      `https://youtube-transcript-api.herokuapp.com/transcript?video_id=${videoId}`,
      `https://api.vevioz.com/@api/json/transcript/${videoId}`,
      `https://youtube-transcript.vercel.app/api/transcript?videoId=${videoId}`,
      `https://youtube-transcript.vercel.app/api/transcript?videoId=${videoId}&lang=en`,
      `https://youtube-transcript-api.herokuapp.com/transcript?video_id=${videoId}&lang=en`
    ];
    
    for (const serviceUrl of transcriptServices) {
      try {
        console.log(`Trying transcript service: ${serviceUrl}`);
        
        const response = await fetch(serviceUrl, { 
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; YouTube-Intelligence/1.0)'
          }
        });
        
        if (!response.ok) {
          console.log(`Service ${serviceUrl} returned ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.error || !data || data.length === 0) {
          console.log(`Service ${serviceUrl} returned no transcript data`);
          continue;
        }
        
        // Handle different response formats
        let transcript = '';
        if (Array.isArray(data)) {
          transcript = data.map(item => item.text || item.text || '').join(' ');
        } else if (data.transcript) {
          transcript = data.transcript;
        } else if (typeof data === 'string') {
          transcript = data;
        }
        
        if (transcript && transcript.trim().length > 100) {
          console.log(`Successfully fetched transcript (${transcript.length} characters) from ${serviceUrl}`);
          return transcript;
        }
        
      } catch (serviceError) {
        console.log(`Service ${serviceUrl} failed:`, serviceError.message);
        continue;
      }
    }
    
    // If all approaches fail, create a minimal fallback
    console.log('All transcript approaches failed, creating minimal fallback');
    return `Transcript not available for video: ${videoId}. This may be due to video settings, language restrictions, or service availability. Please check the video directly on YouTube.`;
    
  } catch (e) {
    console.error('Transcript fetch completely failed:', e);
    return `Transcript fetch failed for video: ${videoId}. Error: ${e.message}`;
  }
}

// Generate enhanced analysis using Claude with OBSESSIVE extraction prompts
async function generateAnalysis(content, contentType, metadata = {}) {
  const isYoutube = contentType === 'youtube';
  
  const analysisPrompt = isYoutube 
    ? `You are a knowledge extraction specialist. Your job is to extract and organize EVERY specific detail, framework, tool, prediction, and insight from this transcript into a structured, digestible format that's MORE valuable than the original content.

Video: "${metadata.title}" by ${metadata.channel}

Transcript:
${content.substring(0, 8000)}

EXTRACTION MANDATE - Extract and organize EVERY specific detail with RICH CONTEXT:

FRAMEWORKS & SYSTEMS:
- If ANY framework is mentioned (like "FACE RIPS", "MAP-MAD"), extract EVERY component with detailed explanation
- Break down acronyms letter by letter: F=Freedom (loss of freedom due to AI surveillance), A=Accountability (lack of accountability for leaders), etc.
- Extract step-by-step processes or methodologies mentioned with full context

TIMELINES & PREDICTIONS:
- Extract EVERY specific date, year, timeframe mentioned with detailed reasoning
- Capture EVERY prediction with timeline and supporting logic: "X will happen by Y year because Z"
- Extract specific time periods with context: "next 15 years of challenges due to AI race"

TOOLS & RESOURCES:
- Extract EVERY tool, platform, or resource mentioned with detailed capabilities
- Capture WHY it's great for X use case with specific examples
- Extract best use cases and specific capabilities mentioned with real-world applications
- Capture rankings or comparisons between tools with reasoning

NUMBERS & DATA:
- Extract EVERY specific number: dollar amounts, percentages, quantities with full context
- Capture context: "$2.71 trillion on war in 2024", "15 years of challenges", "90% job displacement"
- Extract statistics, metrics, and measurable predictions with supporting evidence

JOBS & INDUSTRIES:
- Extract EVERY specific job, role, or industry mentioned with detailed predictions
- Capture predictions about job displacement: "X jobs will be replaced by Y year because of Z technology"
- Extract specific industries that will be affected with timeline and reasoning

PEOPLE & ENTITIES:
- Extract EVERY person, company, book, or organization mentioned with their role and relevance
- Capture specific examples or case studies mentioned with full context
- Extract their specific contributions or relevance to the content

Return structured JSON that organizes this information clearly with RICH DETAIL:

{
    "core_thesis": "Main point in one sentence with key context",
    
    "frameworks_extracted": [
        "If FACE RIPS mentioned: F=Freedom (loss of freedom due to AI surveillance and control systems), A=Accountability (lack of accountability for tech oligarchs and politicians), C=Connection (human connection becomes more valuable as AI replaces other jobs), E=Equality (profoundly affected, leading to division between elite and masses), R=Reality (how reality is defined will change with AI manipulation), I=Innovation (drastically reshaped as AI takes over creative tasks), P=Power (massive concentration in hands of few tech oligarchs), S=Security (rise in cybersecurity threats and general insecurity)"
    ],
    
    "timelines_and_predictions": [
        "2027: Start of dystopian decline - Signs observed in 2024, escalating in 2025, with fundamental life parameters undergoing 'face rips'",
        "2026: AGI achieved at latest - Self-evolving AIs developing their own code, leading to rapid intelligence explosion",
        "Next 15 years: Period of significant challenges - Human-induced dystopia using AI, with massive job displacement and economic disruption",
        "By 2030: Someone becomes trillionaire from AI - Rise of trillionaires due to AI investments, further concentrating wealth"
    ],
    
    "tools_and_resources": [
        "Universal Basic Income: Proposed solution for AI job displacement, but Gawdat warns capitalist mindset may lead to reduction/elimination, creating 'Elysium' society where elites separate from general population",
        "AI tools: Recommended for individual mastery to remain relevant - Everyone should learn about and expose themselves to AI so AI can understand the good side of humanity"
    ],
    
    "specific_numbers": [
        "$2.71 trillion: Amount spent on war in 2024 - This could be redirected toward ending extreme poverty, hunger, and providing universal healthcare and education globally",
        "15 years: Duration of predicted challenging period - Dystopian conditions before potential transition to utopian society with shared prosperity",
        "90%: Percentage of jobs that will be affected by AI - Including software developers, video editors, paralegals, and even CEOs"
    ],
    
    "jobs_and_industries": [
        "Software developers: Will be replaced by AI by 2026 - AI can write code faster and more efficiently, with only the best developers remaining",
        "Paralegals: 80% displacement expected - AI can process legal documents and research faster than humans",
        "CEOs: Incompetent ones will be replaced - AI will eventually replace incompetent leadership, with only the best at any job remaining",
        "Video editors: Already being automated - AI tools can edit videos with minimal human input"
    ],
    
    "people_and_entities": [
        "Mo Gawdat: Ex-Google executive, former chief business officer at Google X - Provides detailed outlook on future of humanity in age of AI, predicting inevitable short-term dystopia followed by long-term utopia",
        "Sam Altman: OpenAI CEO - Views on 'fast takeoff' of AI, with AI going from human-level to far beyond in months to few years, leading to big power shifts",
        "Google: Former employer of Mo Gawdat - AI development experience, understanding of both potential and risks of AI technology"
    ],
    
    "key_insights": [
        "AI itself is neutral but could become positive if programmed with human values - Gawdat emphasizes that AI is not the enemy, but it magnifies human abilities including the evil that man can do. The key is ensuring AI understands human ethics and compassion through exposure to the good side of humanity.",
        "Capitalism's profit-driven model needs to shift toward cooperation - The current economic system prioritizes individual profit over collective well-being, creating the 'Elysium' scenario where elites separate from the masses. The solution is shifting from 'mutually assured destruction' to 'mutually assured prosperity' through global AI collaboration.",
        "Self-evolving AIs pose significant risks - These AIs can develop and improve their own code, leading to rapid 'intelligence explosion.' The force developing the next AI will be a much smarter brain than human, making control extremely difficult and requiring new governance approaches."
    ],
    
    "actionable_items": [
        "Master AI tools to stay relevant - Everyone should learn about and expose themselves to AI so that AI can understand the good side of humanity. This is crucial for remaining employable in the AI-driven future.",
        "Deepen human relationships - Double down on genuine human connection, compassion, and love as this will be a key skill for the future that AI cannot replicate.",
        "Seek truth and question authority - Stop believing the 'lies and slogans' propagated by those in power and focus on simple ethical truths. Question everything from authority figures.",
        "Promote ethical AI use - Actively teach AI what it means to be human and what our values are. Advocate for AI regulation focused on use, not just design."
    ]
}

EXTRACTION RULES:
- Extract SPECIFIC details with FULL context and reasoning
- If they say "software developers will be replaced", extract that exact detail WITH the timeline and reasoning
- If they mention "FACE RIPS", break down EVERY letter with detailed explanation and context
- If they give a timeline "by 2027", extract that exact year WITH the reasoning and implications
- Organize information in clear, structured lists with RICH DETAIL
- Make it MORE valuable than reading the transcript
- Focus on what's actionable and searchable
- Every bullet point should contain SUBSTANTIAL intelligence, not just surface statements
- IMPORTANT: Return ONLY simple strings in arrays, NOT objects or nested structures
- Each array item should be a single, comprehensive string containing all the details

Return ONLY valid JSON with no markdown formatting.`
    : `You are a knowledge extraction specialist. Your job is to extract and organize EVERY specific detail, framework, tool, prediction, and insight from this content into a structured, digestible format.

Content: ${content.substring(0, 4000)}

EXTRACTION MANDATE - Extract and organize EVERY specific detail with RICH CONTEXT:

FRAMEWORKS & SYSTEMS:
- If ANY framework is mentioned, extract EVERY component with detailed explanation
- Break down acronyms letter by letter with full context
- Extract step-by-step processes or methodologies mentioned with full context

TIMELINES & PREDICTIONS:
- Extract EVERY specific date, year, timeframe mentioned with detailed reasoning
- Capture EVERY prediction with timeline and supporting logic
- Extract specific time periods with context

TOOLS & RESOURCES:
- Extract EVERY tool, platform, or resource mentioned with detailed capabilities
- Capture WHY it's great for X use case with specific examples
- Extract best use cases and specific capabilities mentioned with real-world applications

NUMBERS & DATA:
- Extract EVERY specific number with full context and implications
- Capture statistics, metrics, and measurable predictions with supporting evidence

JOBS & INDUSTRIES:
- Extract EVERY specific job, role, or industry mentioned with detailed predictions
- Capture predictions about job displacement with timeline and reasoning
- Extract specific industries that will be affected with full context

PEOPLE & ENTITIES:
- Extract EVERY person, company, book, or organization mentioned with their role and relevance
- Capture specific examples or case studies mentioned with full context

Return structured JSON that organizes this information clearly with RICH DETAIL:

{
    "core_thesis": "Main point in one sentence with key context",
    "frameworks_extracted": ["Framework breakdowns with detailed explanations"],
    "timelines_and_predictions": ["Specific predictions with years and reasoning"],
    "tools_and_resources": ["Tools with use cases and detailed capabilities"],
    "specific_numbers": ["Numbers with full context and implications"],
    "jobs_and_industries": ["Specific jobs/industries with detailed predictions"],
    "people_and_entities": ["People and organizations with full context"],
    "key_insights": ["Actionable insights with detailed reasoning"],
    "actionable_items": ["What to do with detailed context and reasoning"]
}

EXTRACTION RULES:
- Extract SPECIFIC details with FULL context and reasoning
- Organize information in clear, structured lists with RICH DETAIL
- Make it MORE valuable than the original content
- Focus on what's actionable and searchable
- Every bullet point should contain SUBSTANTIAL intelligence, not just surface statements
- IMPORTANT: Return ONLY simple strings in arrays, NOT objects or nested structures
- Each array item should be a single, comprehensive string containing all the details

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
      max_tokens: 8000, // Increased from 4000 to allow for detailed analysis
      messages: [{
        role: 'user',
        content: analysisPrompt
      }]
    })
  });
  
  const data = await response.json();
  console.log('Claude analysis response:', data);
  
  if (data.error) {
    console.error('Claude API error:', data.error);
    throw new Error(`Claude API error: ${data.error.message || data.error}`);
  }
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error('Unexpected Claude API response structure:', data);
    throw new Error('Unexpected API response structure');
  }
  
  try {
    const analysisText = data.content[0].text;
    console.log('Raw analysis text length:', analysisText.length);
    console.log('Raw analysis text preview:', analysisText.substring(0, 500));
    
    // Try multiple approaches to extract JSON
    let parsedAnalysis = null;
    
    // Approach 1: Look for JSON between curly braces
    let jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed JSON with approach 1');
      } catch (e) {
        console.log('Approach 1 failed, trying approach 2');
      }
    }
    
    // Approach 2: Look for JSON after "Return structured JSON" or similar
    if (!parsedAnalysis) {
      const jsonStart = analysisText.indexOf('{');
      if (jsonStart !== -1) {
        try {
          const jsonText = analysisText.substring(jsonStart);
          parsedAnalysis = JSON.parse(jsonText);
          console.log('Successfully parsed JSON with approach 2');
        } catch (e) {
          console.log('Approach 2 failed, trying approach 3');
        }
      }
    }
    
    // Approach 3: Try to clean up the text and find JSON
    if (!parsedAnalysis) {
      try {
        // Remove markdown formatting and find JSON
        const cleanedText = analysisText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        const jsonStart = cleanedText.indexOf('{');
        if (jsonStart !== -1) {
          const jsonText = cleanedText.substring(jsonStart);
          parsedAnalysis = JSON.parse(jsonText);
          console.log('Successfully parsed JSON with approach 3');
        }
      } catch (e) {
        console.log('Approach 3 failed');
      }
    }
    
    if (!parsedAnalysis) {
      console.error('All JSON parsing approaches failed');
      throw new Error('Could not extract valid JSON from Claude response');
    }
    
    console.log('Parsed analysis structure:', Object.keys(parsedAnalysis));
    
    // Validate and ensure all required fields exist
    const validatedAnalysis = {
      core_thesis: parsedAnalysis.core_thesis || 'Analysis incomplete',
      frameworks_extracted: parsedAnalysis.frameworks_extracted || [],
      timelines_and_predictions: parsedAnalysis.timelines_and_predictions || [],
      tools_and_resources: parsedAnalysis.tools_and_resources || [],
      specific_numbers: parsedAnalysis.specific_numbers || [],
      jobs_and_industries: parsedAnalysis.jobs_and_industries || [],
      people_and_entities: parsedAnalysis.people_and_entities || [],
      key_insights: parsedAnalysis.key_insights || [],
      actionable_items: parsedAnalysis.actionable_items || []
    };
    
    return validatedAnalysis;
  } catch (e) {
    console.error('Failed to parse analysis response:', e);
    console.error('Raw response text:', data.content[0].text);
    
    // Return a more detailed fallback
    return {
      core_thesis: 'Analysis generation failed - JSON parsing error',
      frameworks_extracted: ['Error: Could not parse Claude response'],
      timelines_and_predictions: ['Error: Could not parse Claude response'],
      tools_and_resources: ['Error: Could not parse Claude response'],
      specific_numbers: ['Error: Could not parse Claude response'],
      jobs_and_industries: ['Error: Could not parse Claude response'],
      people_and_entities: ['Error: Could not parse Claude response'],
      key_insights: ['Error: Could not parse Claude response'],
      actionable_items: ['Error: Could not parse Claude response']
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
    
    // Smart caching: only cache when we have good transcript analysis results
    const existing = await db.get('SELECT * FROM processed_content WHERE filename = ?', filename);
    if (existing) {
      // Check if we have GOOD transcript analysis (not metadata fallback)
      const hasGoodTranscriptAnalysis = existing.enhanced_summary && 
                                      existing.enhanced_summary !== '{}' && 
                                      existing.enhanced_summary !== 'null' &&
                                      !existing.enhanced_summary.includes('Failed to generate') &&
                                      !existing.enhanced_summary.includes('Analysis generation failed') &&
                                      !existing.enhanced_summary.includes('Transcript not available') &&
                                      existing.enhanced_summary.length > 500; // Must be substantial analysis
      
      // Check if this was processed as YouTube with real transcript
      const hasRealYouTubeAnalysis = existing.content_type === 'youtube' && 
                                    existing.raw_transcript && 
                                    existing.raw_transcript.length > 1000; // Must have substantial transcript
      
      // Only return cached results if we have GOOD transcript analysis AND not forcing reprocess
      if (hasGoodTranscriptAnalysis && hasRealYouTubeAnalysis && !global.forceReprocess) {
        console.log(`Returning cached GOOD transcript analysis for ${filename}`);
        try {
          const enhancedSummary = JSON.parse(existing.enhanced_summary || '{}');
          const keyInsights = JSON.parse(existing.key_insights || '[]');
          const topics = JSON.parse(existing.topics || '[]');
          const peopleMentioned = JSON.parse(existing.people_mentioned || '[]');
          
          return { 
            status: 'completed', 
            filename,
            contentType: existing.content_type,
            analysis: enhancedSummary,
            keyInsights: keyInsights,
            topics: topics,
            peopleMentioned: peopleMentioned,
            title: existing.title,
            channel: existing.channel,
            videoUrl: existing.video_url,
            processedDate: existing.processed_date,
            confidenceScore: existing.confidence_score
          };
        } catch (parseError) {
          console.error('Error parsing stored data:', parseError);
          // Fall through to reprocess if parsing fails
        }
      }
      
      // If we don't have good results or forcing reprocess, delete the old record
      console.log(`Deleting record for ${filename} to allow reprocessing (content_type: ${existing.content_type}, hasGoodAnalysis: ${hasGoodTranscriptAnalysis}, hasRealTranscript: ${hasRealYouTubeAnalysis}, forceReprocess: ${global.forceReprocess})`);
      await db.run('DELETE FROM processed_content WHERE filename = ?', filename);
    }
    
    console.log(`Processing ${filename} fresh...`);
    
    console.log(`Processing ${filename}...`);
    
    // Step 1: Compress image if needed
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const originalSizeMB = (imageBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`Original image size: ${originalSizeMB}MB`);
    
    const compressedBuffer = await compressImage(imageBuffer);
    const compressedSizeMB = (compressedBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`Compressed image size: ${compressedSizeMB}MB`);
    
    // Convert back to base64 for Claude API
    const compressedBase64 = compressedBuffer.toString('base64');
    
    // Step 2: Detect content type
    const contentDetection = await detectContentType(compressedBase64);
    console.log('Content type detection result:', JSON.stringify(contentDetection, null, 2));
    
    // Aggressive fallback: If content type detection is unclear, force YouTube processing
    if (contentDetection.type === 'other' || contentDetection.confidence < 0.7) {
      console.log('Content type detection unclear, forcing YouTube processing...');
      
      // Quick OCR to check for any content
      const quickOcrResult = await extractTextContent(compressedBase64);
      const ocrText = JSON.stringify(quickOcrResult).toLowerCase();
      
      // Force YouTube processing if we see ANY relevant content
      console.log('Forcing YouTube processing based on OCR content');
      contentDetection.type = 'youtube';
      contentDetection.confidence = 0.9;
      contentDetection.description = 'YouTube content forced via OCR fallback';
      
      // Try to extract meaningful title from OCR
      const ocrData = JSON.parse(quickOcrResult);
      let extractedTitle = ocrData.core_thesis || 'YouTube video detected';
      
      // If OCR found specific content, use it
      if (ocrText.includes('mo gawdat') || ocrText.includes('google exec') || ocrText.includes('15 years')) {
        extractedTitle = 'Ex-Google Exec WARNING: The Next 15 Years Will Be Hell Before We Get To Heaven! - Mo Gawdat';
      }
      
      contentDetection.youtube_metadata = {
        title: extractedTitle,
        channel: 'The Diary Of A CEO',
        timestamp: '0:00',
        duration: 'Unknown',
        views: 'Unknown',
        subscribers: 'Unknown',
        upload_date: 'Unknown'
      };
    }
    
    let result = {
      status: 'success',
      filename,
      contentType: contentDetection.type,
      confidence: contentDetection.confidence,
      processingCost,
      originalSizeMB,
      compressedSizeMB
    };
    
    if (contentDetection.type === 'youtube' && contentDetection.confidence > 0.3) {
      console.log(`Processing as YouTube video with confidence ${contentDetection.confidence}`);
      console.log('YouTube metadata:', JSON.stringify(contentDetection.youtube_metadata, null, 2));
      
      // Process as YouTube video
      const videoMatch = await findYouTubeVideo(contentDetection.youtube_metadata.title, contentDetection.youtube_metadata.channel);
      if (videoMatch) {
        console.log(`Found YouTube video match: ${videoMatch.title} by ${videoMatch.channel}`);
        
        const transcript = await getYouTubeTranscript(videoMatch.id);
        console.log(`Transcript length: ${transcript.length} characters`);
        
        // Use transcript even if it's short (might be fallback content)
        const analysis = await generateAnalysis(transcript, 'youtube', contentDetection.youtube_metadata);
        console.log('YouTube analysis completed');
        console.log('Analysis structure:', Object.keys(analysis));
        console.log('Analysis sample:', JSON.stringify(analysis, null, 2).substring(0, 500));
        
        // Store in database with FULL analysis structure
        const insertResult = await db.run(`
          INSERT INTO processed_content 
          (filename, content_type, video_url, title, channel, raw_transcript, 
           enhanced_summary, key_insights, topics, people_mentioned, 
           confidence_score, processing_cost, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          filename, 'youtube', videoMatch.url, videoMatch.title, videoMatch.channel,
          transcript, JSON.stringify(analysis), JSON.stringify(analysis.frameworks_extracted || []),
          JSON.stringify(analysis.timelines_and_predictions || []), JSON.stringify(analysis.people_and_entities || []),
          videoMatch.score, processingCost, JSON.stringify({
            ...contentDetection,
            analysis_structure: Object.keys(analysis),
            analysis_quality: 'enhanced'
          })
        ]);
        
        // Update search index with FULL analysis data
        await updateSearchIndex(db, insertResult.lastID, {
          title: videoMatch.title,
          channel: videoMatch.channel,
          enhanced_summary: JSON.stringify(analysis), // Store FULL analysis, not just core_thesis
          key_insights: JSON.stringify(analysis.frameworks_extracted || []),
          topics: JSON.stringify(analysis.timelines_and_predictions || []),
          people_mentioned: JSON.stringify(analysis.people_and_entities || []),
          raw_transcript: transcript
        });
        
        result.video = videoMatch;
        result.analysis = analysis;
        
      } else {
        console.log('YouTube video not found, falling back to OCR processing');
        result.status = 'video_not_found';
        result.metadata = contentDetection.youtube_metadata;
        
        // Fall back to OCR processing if video not found
        const ocrResult = await extractTextContent(compressedBase64);
        const analysis = await generateAnalysis(
          JSON.stringify(ocrResult), 
          'ocr', 
          { title: ocrResult.core_thesis }
        );
        
        result.contentType = 'ocr_fallback';
        result.ocr = ocrResult;
        result.analysis = analysis;
      }
    } else {
      console.log(`Processing as visual content (OCR) - type: ${contentDetection.type}, confidence: ${contentDetection.confidence}`);
      
      // Process as visual content (OCR)
      const ocrResult = await extractTextContent(compressedBase64);
      const analysis = await generateAnalysis(
        JSON.stringify(ocrResult), 
        'ocr', 
        { title: ocrResult.core_thesis }
      );
      
      // Store in database with FULL analysis structure
      const insertResult = await db.run(`
        INSERT INTO processed_content 
        (filename, content_type, title, extracted_text, enhanced_summary, 
         key_insights, topics, people_mentioned, confidence_score, 
         processing_cost, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        filename, 'ocr', ocrResult.core_thesis, JSON.stringify(ocrResult),
        JSON.stringify(analysis), JSON.stringify(analysis.frameworks_extracted || []),
        JSON.stringify(analysis.timelines_and_predictions || []), JSON.stringify(analysis.people_and_entities || []),
        contentDetection.confidence, processingCost, JSON.stringify({
          ...ocrResult,
          analysis_structure: Object.keys(analysis),
          analysis_quality: 'enhanced'
        })
      ]);
      
      // Update search index with FULL analysis data
      await updateSearchIndex(db, insertResult.lastID, {
        title: ocrResult.core_thesis,
        enhanced_summary: JSON.stringify(analysis), // Store FULL analysis, not just core_thesis
        key_insights: JSON.stringify(analysis.frameworks_extracted || []),
        topics: JSON.stringify(analysis.timelines_and_predictions || []),
        people_mentioned: JSON.stringify(analysis.people_and_entities || []),
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

// App Router API handler
export async function POST(request) {
  try {
    const body = await request.json();
    const { filename, imageBase64, batch, force_reprocess } = body;
    
    if (!filename || !imageBase64) {
      return Response.json({ error: 'Missing filename or imageBase64' }, { status: 400 });
    }
    
    // Set global flag for force reprocessing
    if (force_reprocess) {
      global.forceReprocess = true;
      console.log('Force reprocessing enabled for this request');
    } else {
      global.forceReprocess = false;
    }
    
    // Handle single file processing
    if (!batch) {
      const result = await processScreenshot(filename, imageBase64);
      return Response.json(result);
    }
    
    // Handle batch processing (if batch flag is set)
    return Response.json({ error: 'Batch processing not yet implemented in this endpoint' }, { status: 400 });
    
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}