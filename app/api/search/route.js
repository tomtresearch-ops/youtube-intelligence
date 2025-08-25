// Enhanced Search API for Visual Intelligence System
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db;

async function initDatabase() {
  if (!db) {
    db = await open({
      filename: './visual_intelligence.db',
      driver: sqlite3.Database
    });
  }
  return db;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { query } = body;
    
    const database = await initDatabase();
    
    let searchResults;
    
    if (!query || query.trim() === '') {
      // If no query, return all content
      searchResults = await database.all(`
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
        ORDER BY pc.processed_date DESC
        LIMIT 50
      `);
    } else {
      // Enhanced search across all content using FTS5
      searchResults = await database.all(`
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
        WHERE (
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
    }
    
    // Process and format results
    const formattedResults = searchResults.map(result => {
      try {
        // Parse the enhanced analysis data - now stored as full JSON
        const enhancedData = JSON.parse(result.enhanced_summary || '{}');
        const keyInsights = JSON.parse(result.key_insights || '[]');
        const topics = JSON.parse(result.topics || '[]');
        const peopleMentioned = JSON.parse(result.people_mentioned || '[]');
        const metadata = JSON.parse(result.metadata || '{}');
        
        // Check if enhancedData is the full analysis or just core_thesis
        const isFullAnalysis = enhancedData.core_thesis && enhancedData.frameworks_extracted;
        
        return {
          id: result.id,
          title: result.title || enhancedData.core_thesis || 'Untitled Content',
          channel: result.channel || 'Unknown',
          url: result.video_url,
          contentType: result.content_type,
          summary: enhancedData.core_thesis || 'No summary available',
          tldr: enhancedData.core_thesis || '',
          insights: enhancedData.frameworks_extracted || keyInsights || [],
          topics: enhancedData.timelines_and_predictions || topics || [],
          peopleMentioned: enhancedData.people_and_entities || peopleMentioned || [],
          date: result.processed_date,
          confidence: result.confidence_score,
          frameworks: enhancedData.frameworks_extracted || [],
          numbers: enhancedData.specific_numbers || [],
          methods: enhancedData.frameworks_extracted || [],
          tools: enhancedData.tools_and_resources || [],
          predictions: enhancedData.timelines_and_predictions || [],
          actionPriority: enhancedData.actionable_items?.[0] || '',
          rememberThis: enhancedData.key_insights?.[0] || '',
          // Additional rich data fields from new structure
          timelines: enhancedData.timelines_and_predictions || [],
          tools: enhancedData.tools_and_resources || [],
          jobs: enhancedData.jobs_and_industries || [],
          entities: enhancedData.people_and_entities || [],
          actionableItems: enhancedData.actionable_items || [],
          keyInsights: enhancedData.key_insights || [],
          // Analysis quality indicator
          analysisQuality: metadata.analysis_quality || 'standard'
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
          rememberThis: '',
          contrarianPositions: [],
          importantDistinctions: [],
          notableClaims: [],
          supportingEvidence: [],
          methodologyExplained: [],
          connectionsMade: [],
          implicationsAnalysis: [],
          whyThisMatters: '',
          keyCompetitiveAdvantage: '',
          decisionSupport: '',
          analysisQuality: 'error'
        };
      }
    });
    
    // Get search statistics
    const totalCount = await database.get('SELECT COUNT(*) as count FROM processed_content');
    const youtubeCount = await database.get('SELECT COUNT(*) as count FROM processed_content WHERE content_type = "youtube"');
    const otherCount = await database.get('SELECT COUNT(*) as count FROM processed_content WHERE content_type = "ocr"');
    
    const searchStats = {
      totalResults: formattedResults.length,
      totalKnowledge: totalCount?.count || 0,
      youtubeVideos: youtubeCount?.count || 0,
      otherContent: otherCount?.count || 0
    };
    
    return Response.json({
      results: formattedResults,
      stats: searchStats,
      query: query
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ 
      error: 'Search failed', 
      details: error.message,
      results: [],
      stats: {
        totalResults: 0,
        totalKnowledge: 0,
        youtubeVideos: 0,
        otherContent: 0
      }
    }, { status: 500 });
  }
}
