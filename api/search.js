// Enhanced Search API for Visual Intelligence System
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

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
  
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Missing search query' });
  }
  
  try {
    const database = await initDatabase();
    
    // Enhanced search across all content using FTS5
    const searchResults = await database.all(`
      SELECT 
        pc.id,
        pc.filename,
        pc.content_type,
        pc.video_url,
        pc.title,
        pc.channel,
        pc.enhanced_summary,
        pc.key_insights,
        pc.topics,
        pc.people_mentioned,
        pc.processed_date,
        pc.confidence_score,
        pc.raw_transcript,
        pc.extracted_text,
        pc.metadata
      FROM processed_content pc
      WHERE pc.status = 'completed'
      AND (
        pc.title LIKE ? OR 
        pc.enhanced_summary LIKE ? OR 
        pc.key_insights LIKE ? OR
        pc.topics LIKE ? OR
        pc.people_mentioned LIKE ? OR
        pc.raw_transcript LIKE ? OR
        pc.extracted_text LIKE ?
      )
      ORDER BY pc.processed_date DESC
      LIMIT 50
    `, [
      `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, 
      `%${query}%`, `%${query}%`, `%${query}%`
    ]);
    
    // Process and format results
    const formattedResults = searchResults.map(result => {
      try {
        // Parse the enhanced analysis data
        const enhancedData = JSON.parse(result.enhanced_summary || '{}');
        const keyInsights = JSON.parse(result.key_insights || '[]');
        const topics = JSON.parse(result.topics || '[]');
        const peopleMentioned = JSON.parse(result.people_mentioned || '[]');
        const metadata = JSON.parse(result.metadata || '{}');
        
        return {
          id: result.id,
          title: result.title || enhancedData.core_thesis || 'Untitled Content',
          channel: result.channel || 'Unknown',
          url: result.video_url,
          contentType: result.content_type,
          summary: enhancedData.core_thesis || 'No summary available',
          tldr: enhancedData.executive_distillation?.tldr || '',
          insights: keyInsights || [],
          topics: topics || [],
          peopleMentioned: peopleMentioned || [],
          date: result.processed_date,
          confidence: result.confidence_score,
          frameworks: enhancedData.named_frameworks_extracted || [],
          numbers: enhancedData.all_numbers_and_data || [],
          methods: enhancedData.extracted_intelligence?.specific_methods || [],
          tools: enhancedData.extracted_intelligence?.tools_and_resources || [],
          predictions: enhancedData.intelligence_synthesis?.future_predictions || [],
          actionPriority: enhancedData.executive_distillation?.action_priority || '',
          rememberThis: enhancedData.executive_distillation?.remember_this || ''
        };
      } catch (parseError) {
        console.error('Error parsing result data:', parseError);
        return {
          id: result.id,
          title: result.title || 'Untitled Content',
          channel: result.channel || 'Unknown',
          url: result.video_url,
          contentType: result.content_type,
          summary: 'Data parsing error',
          tldr: '',
          insights: [],
          topics: [],
          peopleMentioned: [],
          date: result.processed_date,
          confidence: result.confidence_score,
          frameworks: [],
          numbers: [],
          methods: [],
          tools: [],
          predictions: [],
          actionPriority: '',
          rememberThis: ''
        };
      }
    });
    
    // Get search statistics
    const totalCount = await database.get('SELECT COUNT(*) as count FROM processed_content WHERE status = "completed"');
    const youtubeCount = await database.get('SELECT COUNT(*) as count FROM processed_content WHERE status = "completed" AND content_type = "youtube"');
    const otherCount = await database.get('SELECT COUNT(*) as count FROM processed_content WHERE status = "completed" AND content_type = "ocr"');
    
    const searchStats = {
      totalResults: formattedResults.length,
      totalKnowledge: totalCount?.count || 0,
      youtubeVideos: youtubeCount?.count || 0,
      otherContent: otherCount?.count || 0
    };
    
    res.status(200).json({
      results: formattedResults,
      stats: searchStats,
      query: query
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      details: error.message,
      results: [],
      stats: {
        totalResults: 0,
        totalKnowledge: 0,
        youtubeVideos: 0,
        otherContent: 0
      }
    });
  }
}