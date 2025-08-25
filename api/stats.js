// Knowledge Stats API for Visual Intelligence System
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const database = await initDatabase();
    
    // Get comprehensive stats
    const [
      totalKnowledge,
      thisWeek,
      avgConfidence,
      totalCost,
      youtubeVideos,
      otherContent,
      avgProcessingTime,
      highConfidenceRate
    ] = await Promise.all([
      // Total Knowledge
      database.get('SELECT COUNT(*) as count FROM processed_content WHERE status = "completed"'),
      
      // This Week
      database.get('SELECT COUNT(*) as count FROM processed_content WHERE status = "completed" AND processed_date > datetime("now", "-7 days")'),
      
      // Average Confidence
      database.get('SELECT AVG(confidence_score) as avg FROM processed_content WHERE status = "completed" AND confidence_score IS NOT NULL'),
      
      // Total Cost
      database.get('SELECT SUM(processing_cost) as total FROM processed_content WHERE status = "completed"'),
      
      // YouTube Videos
      database.get('SELECT COUNT(*) as count FROM processed_content WHERE status = "completed" AND content_type = "youtube"'),
      
      // Other Content
      database.get('SELECT COUNT(*) as count FROM processed_content WHERE status = "completed" AND content_type = "ocr"'),
      
      // Average Processing Time (placeholder - would need to track actual processing time)
      database.get('SELECT 15000 as avg_ms'), // 15 seconds average
      
      // High Confidence Rate
      database.get('SELECT (COUNT(CASE WHEN confidence_score >= 0.8 THEN 1 END) * 100.0 / COUNT(*)) as rate FROM processed_content WHERE status = "completed" AND confidence_score IS NOT NULL')
    ]);
    
    // Get recent activity
    const recentActivity = await database.all(`
      SELECT 
        content_type,
        title,
        processed_date,
        confidence_score
      FROM processed_content 
      WHERE status = "completed"
      ORDER BY processed_date DESC 
      LIMIT 10
    `);
    
    // Get content type breakdown
    const contentTypes = await database.all(`
      SELECT 
        content_type,
        COUNT(*) as count
      FROM processed_content 
      WHERE status = "completed"
      GROUP BY content_type
    `);
    
    // Get confidence distribution
    const confidenceDistribution = await database.all(`
      SELECT 
        CASE 
          WHEN confidence_score >= 0.9 THEN 'Very High (90%+)'
          WHEN confidence_score >= 0.8 THEN 'High (80-89%)'
          WHEN confidence_score >= 0.7 THEN 'Good (70-79%)'
          WHEN confidence_score >= 0.6 THEN 'Fair (60-69%)'
          ELSE 'Low (<60%)'
        END as confidence_level,
        COUNT(*) as count
      FROM processed_content 
      WHERE status = "completed" AND confidence_score IS NOT NULL
      GROUP BY confidence_level
      ORDER BY confidence_score DESC
    `);
    
    const stats = {
      overview: {
        totalKnowledge: totalKnowledge?.count || 0,
        thisWeek: thisWeek?.count || 0,
        avgConfidence: Math.round((avgConfidence?.avg || 0) * 100),
        totalCost: parseFloat((totalCost?.total || 0).toFixed(4))
      },
      contentTypes: {
        youtubeVideos: youtubeVideos?.count || 0,
        otherContent: otherContent?.count || 0
      },
      performance: {
        avgProcessingTime: avgProcessingTime?.avg_ms || 0,
        highConfidenceRate: Math.round(highConfidenceRate?.rate || 0)
      },
      recentActivity: recentActivity.map(item => ({
        type: item.content_type,
        title: item.title,
        date: item.processed_date,
        confidence: Math.round((item.confidence_score || 0) * 100)
      })),
      contentBreakdown: contentTypes.map(item => ({
        type: item.content_type === 'youtube' ? 'YouTube Videos' : 'Other Content',
        count: item.count
      })),
      confidenceDistribution: confidenceDistribution.map(item => ({
        level: item.confidence_level,
        count: item.count
      }))
    };
    
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats', 
      details: error.message,
      stats: {
        overview: { totalKnowledge: 0, thisWeek: 0, avgConfidence: 0, totalCost: 0 },
        contentTypes: { youtubeVideos: 0, otherContent: 0 },
        performance: { avgProcessingTime: 0, highConfidenceRate: 0 },
        recentActivity: [],
        contentBreakdown: [],
        confidenceDistribution: []
      }
    });
  }
}
