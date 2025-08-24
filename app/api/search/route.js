// Next.js App Router API route
import { NextResponse } from 'next/server';

// Visual Intelligence Search API
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Database connection
let db;
async function initDatabase() {
  if (!db) {
    db = await open({
      filename: '/tmp/visual_intelligence.db',
      driver: sqlite3.Database
    });
  }
  return db;
}

// Enhanced natural language search using Claude to understand intent
async function parseSearchQuery(query) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Parse this search query and extract search terms for a visual intelligence database. Return JSON with:
        {
          "keywords": ["term1", "term2", ...],
          "content_types": ["youtube", "ocr", "both"],
          "time_filter": "recent|week|month|all",
          "people": ["person1", ...],
          "topics": ["topic1", ...],
          "search_intent": "specific|broad|conceptual"
        }
        
        Query: "${query}"
        
        Examples:
        - "AI tools from videos" → keywords: ["AI", "tools"], content_types: ["youtube"]
        - "crypto analysis whiteboards" → keywords: ["crypto", "analysis"], content_types: ["ocr"], topics: ["cryptocurrency"]
        - "meeting notes yesterday" → keywords: ["meeting", "notes"], time_filter: "recent"
        - "videos mentioning OpenAI" → keywords: ["OpenAI"], content_types: ["youtube"], people: ["OpenAI"]`
      }]
    })
  });
  
  const data = await response.json();
  try {
    return JSON.parse(data.content[0].text);
  } catch (e) {
    return {
      keywords: query.split(' ').filter(word => word.length > 2),
      content_types: ["both"],
      time_filter: "all",
      people: [],
      topics: [],
      search_intent: "broad"
    };
  }
}

// Perform full-text search with filters
async function performSearch(searchParams, limit = 20) {
  const db = await initDatabase();
  
  let baseQuery = `
    SELECT c.*, cs.rank
    FROM processed_content c
    JOIN content_search cs ON c.id = cs.id
    WHERE 1=1
  `;
  
  const queryParams = [];
  
  // Add FTS search if keywords exist
  if (searchParams.keywords && searchParams.keywords.length > 0) {
    const ftsQuery = searchParams.keywords.map(keyword => `"${keyword}"`).join(' OR ');
    baseQuery += ` AND content_search MATCH ?`;
    queryParams.push(ftsQuery);
  }
  
  // Filter by content type
  if (searchParams.content_types && !searchParams.content_types.includes("both")) {
    const contentTypeFilter = searchParams.content_types.map(() => '?').join(',');
    baseQuery += ` AND c.content_type IN (${contentTypeFilter})`;
    queryParams.push(...searchParams.content_types);
  }
  
  // Filter by time
  if (searchParams.time_filter && searchParams.time_filter !== "all") {
    let timeConstraint;
    switch (searchParams.time_filter) {
      case "recent":
        timeConstraint = "datetime(c.processed_date) > datetime('now', '-1 day')";
        break;
      case "week":
        timeConstraint = "datetime(c.processed_date) > datetime('now', '-7 days')";
        break;
      case "month":
        timeConstraint = "datetime(c.processed_date) > datetime('now', '-30 days')";
        break;
    }
    if (timeConstraint) {
      baseQuery += ` AND ${timeConstraint}`;
    }
  }
  
  // Add ordering and limit
  baseQuery += ` ORDER BY cs.rank DESC, c.processed_date DESC LIMIT ?`;
  queryParams.push(limit);
  
  const results = await db.all(baseQuery, queryParams);
  
  // If FTS didn't return enough results, try semantic similarity search
  if (results.length < 5 && searchParams.keywords.length > 0) {
    const semanticResults = await performSemanticSearch(searchParams, limit - results.length);
    return [...results, ...semanticResults.filter(sr => !results.find(r => r.id === sr.id))];
  }
  
  return results;
}

// Semantic search using Claude for content understanding
async function performSemanticSearch(searchParams, limit = 10) {
  const db = await initDatabase();
  
  // Get all content for semantic comparison
  const allContent = await db.all(`
    SELECT id, title, enhanced_summary, key_insights, topics, content_type
    FROM processed_content
    ORDER BY processed_date DESC
    LIMIT 100
  `);
  
  if (allContent.length === 0) return [];
  
  // Use Claude to find semantically similar content
  const searchQuery = searchParams.keywords.join(' ');
  const contentDescriptions = allContent.map(item => ({
    id: item.id,
    description: `${item.title} - ${item.enhanced_summary} - Topics: ${item.topics || '[]'} - Type: ${item.content_type}`
  }));
  
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
        content: `Find content semantically similar to the search query: "${searchQuery}"
        
        Content items:
        ${contentDescriptions.slice(0, 20).map((item, index) => `${index + 1}. ID:${item.id} - ${item.description}`).join('\n')}
        
        Return JSON array of relevant item IDs in order of relevance:
        ["id1", "id2", ...]
        
        Focus on conceptual similarity, not just keyword matching.`
      }]
    })
  });
  
  try {
    const data = await response.json();
    const semanticMatches = JSON.parse(data.content[0].text);
    
    // Get full content for semantic matches
    const semanticResults = [];
    for (const matchId of semanticMatches.slice(0, limit)) {
      const content = allContent.find(item => item.id.toString() === matchId.toString());
      if (content) {
        semanticResults.push({ ...content, rank: 0.5 }); // Lower rank for semantic matches
      }
    }
    
    return semanticResults;
  } catch (e) {
    console.error('Semantic search failed:', e);
    return [];
  }
}

// Generate search suggestions
async function generateSuggestions(query) {
  const db = await initDatabase();
  
  // Get recent unique topics and titles for suggestions
  const recentContent = await db.all(`
    SELECT DISTINCT title, topics, people_mentioned
    FROM processed_content
    ORDER BY processed_date DESC
    LIMIT 50
  `);
  
  const allTopics = new Set();
  const allPeople = new Set();
  
  recentContent.forEach(item => {
    try {
      const topics = JSON.parse(item.topics || '[]');
      const people = JSON.parse(item.people_mentioned || '[]');
      topics.forEach(topic => allTopics.add(topic));
      people.forEach(person => allPeople.add(person));
    } catch (e) {
      // Skip invalid JSON
    }
  });
  
  return {
    topics: Array.from(allTopics).slice(0, 10),
    people: Array.from(allPeople).slice(0, 10),
    recent_titles: recentContent.slice(0, 5).map(item => item.title)
  };
}

// Next.js API handler
export async function POST(request) {
  try {
    const body = await request.json();
    const { query } = body;
    
    if (!query) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }
    
    const results = await searchContent(query);
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}