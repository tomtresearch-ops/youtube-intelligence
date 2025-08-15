// Batch Processing API for Visual Intelligence
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Import processing functions from main process.js
// (In a real setup, these would be in a shared module)

// For this implementation, I'll include the essential functions
async function initDatabase() {
  const db = await open({
    filename: '/tmp/visual_intelligence.db',
    driver: sqlite3.Database
  });
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS processed_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE,
      content_type TEXT,
      video_url TEXT,
      title TEXT,
      channel TEXT,
      duration TEXT,
      raw_transcript TEXT,
      extracted_text TEXT,
      enhanced_summary TEXT,
      key_insights TEXT,
      topics TEXT,
      people_mentioned TEXT,
      processed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      confidence_score REAL,
      processing_cost REAL,
      metadata TEXT
    )
  `);

  await db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS content_search USING fts5(
      id, title, channel, enhanced_summary, key_insights,
      topics, people_mentioned, extracted_text, raw_transcript
    )
  `);
  
  return db;
}

// Batch processing status tracking
const batchJobs = new Map();

// Create a new batch job
function createBatchJob(files) {
  const batchId = Math.random().toString(36).substr(2, 9);
  const job = {
    id: batchId,
    status: 'processing',
    created_at: new Date().toISOString(),
    total_files: files.length,
    processed_files: 0,
    successful_files: 0,
    failed_files: 0,
    estimated_cost: files.length * 0.08,
    actual_cost: 0,
    files: files.map(file => ({
      filename: file.filename,
      status: 'pending',
      result: null,
      error: null,
      processing_cost: 0.08
    }))
  };
  
  batchJobs.set(batchId, job);
  return job;
}

// Update batch job status
function updateBatchJob(batchId, updates) {
  const job = batchJobs.get(batchId);
  if (job) {
    Object.assign(job, updates);
    batchJobs.set(batchId, job);
  }
  return job;
}

// Update file status within batch
function updateFileInBatch(batchId, filename, status, result = null, error = null) {
  const job = batchJobs.get(batchId);
  if (job) {
    const fileIndex = job.files.findIndex(f => f.filename === filename);
    if (fileIndex !== -1) {
      job.files[fileIndex].status = status;
      job.files[fileIndex].result = result;
      job.files[fileIndex].error = error;
      
      // Update counters
      job.processed_files = job.files.filter(f => f.status === 'completed' || f.status === 'failed').length;
      job.successful_files = job.files.filter(f => f.status === 'completed').length;
      job.failed_files = job.files.filter(f => f.status === 'failed').length;
      job.actual_cost = job.files.reduce((sum, f) => sum + (f.status === 'completed' ? f.processing_cost : 0), 0);
      
      // Update overall status
      if (job.processed_files === job.total_files) {
        job.status = 'completed';
        job.completed_at = new Date().toISOString();
      }
      
      batchJobs.set(batchId, job);
    }
  }
  return job;
}

// Process a single file (simplified version)
async function processSingleFile(filename, imageBase64) {
  try {
    // This is a simplified version - in production, you'd import the full function
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        imageBase64
      })
    });
    
    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      filename
    };
  }
}

// Process batch of files
async function processBatch(batchId, files) {
  const job = batchJobs.get(batchId);
  if (!job) return;
  
  // Process files in parallel with concurrency limit
  const concurrencyLimit = 3; // Process 3 files at a time
  const chunks = [];
  
  for (let i = 0; i < files.length; i += concurrencyLimit) {
    chunks.push(files.slice(i, i + concurrencyLimit));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (file) => {
      try {
        updateFileInBatch(batchId, file.filename, 'processing');
        
        const result = await processSingleFile(file.filename, file.imageBase64);
        
        if (result.status === 'success') {
          updateFileInBatch(batchId, file.filename, 'completed', result);
        } else {
          updateFileInBatch(batchId, file.filename, 'failed', null, result.error);
        }
      } catch (error) {
        updateFileInBatch(batchId, file.filename, 'failed', null, error.message);
      }
    });
    
    await Promise.all(promises);
  }
  
  // Clean up completed jobs after 1 hour
  setTimeout(() => {
    batchJobs.delete(batchId);
  }, 60 * 60 * 1000);
}

// Main batch API handler
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET: Check batch status
  if (req.method === 'GET') {
    const { batchId } = req.query;
    
    if (!batchId) {
      return res.status(400).json({ error: 'Missing batchId parameter' });
    }
    
    const job = batchJobs.get(batchId);
    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' });
    }
    
    return res.status(200).json(job);
  }
  
  // POST: Start batch processing
  if (req.method === 'POST') {
    const { files } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Missing or empty files array' });
    }
    
    // Validate files
    const validationErrors = [];
    files.forEach((file, index) => {
      if (!file.filename || !file.imageBase64) {
        validationErrors.push(`File ${index + 1}: Missing filename or imageBase64`);
      }
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation errors', 
        details: validationErrors 
      });
    }
    
    // Limit batch size
    if (files.length > 50) {
      return res.status(400).json({ 
        error: 'Batch size too large', 
        details: 'Maximum 50 files per batch' 
      });
    }
    
    // Create batch job
    const job = createBatchJob(files);
    
    // Start processing asynchronously
    processBatch(job.id, files).catch(error => {
      console.error(`Batch processing error for ${job.id}:`, error);
      updateBatchJob(job.id, { 
        status: 'failed', 
        error: error.message,
        completed_at: new Date().toISOString()
      });
    });
    
    return res.status(202).json({
      message: 'Batch processing started',
      batchId: job.id,
      status: job.status,
      total_files: job.total_files,
      estimated_cost: job.estimated_cost
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// Export configuration for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increased for batch uploads
    },
  },
  maxDuration: 300, // 5 minutes for batch processing
}