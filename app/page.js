'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, Search, FileImage, Youtube, FileText, Loader2, CheckCircle, AlertCircle, Brain, Zap, BarChart3 } from 'lucide-react'
import UploadZone from './components/UploadZone'
import SearchInterface from './components/SearchInterface'
import ProcessingStatus from './components/ProcessingStatus'
import ContentGrid from './components/ContentGrid'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('upload') // Changed back to Capture as default
  const [processingFiles, setProcessingFiles] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Fetch stats data
  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setStats({
        overview: { totalKnowledge: 0, thisWeek: 0, avgConfidence: 0, totalCost: 0 },
        contentTypes: { youtubeVideos: 0, otherContent: 0 },
        performance: { avgProcessingTime: 0, highConfidenceRate: 0 }
      })
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // Load all content by default
  const loadAllContent = useCallback(async () => {
    setIsSearching(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '' }) // Empty query to get all content
      })
      const results = await response.json()
      setSearchResults(results.results || [])
    } catch (error) {
      console.error('Failed to load content:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Fetch stats when component mounts and when processing completes
  useEffect(() => {
    fetchStats()
    loadAllContent() // Load all content by default
  }, [fetchStats, loadAllContent])

  // Refresh stats when processing completes
  useEffect(() => {
    if (processingFiles.some(f => f.status === 'completed')) {
      fetchStats()
      loadAllContent() // Reload content when new processing completes
    }
  }, [processingFiles, fetchStats, loadAllContent])

  // Load content when switching to Library tab
  useEffect(() => {
    if (activeTab === 'search') {
      loadAllContent()
    }
  }, [activeTab, loadAllContent])

  const handleFilesSelected = useCallback(async (files) => {
    const newProcessingFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      status: 'processing',
      progress: 0,
      type: 'youtube', // Will be determined by AI
      result: null
    }))

    setProcessingFiles(prev => [...prev, ...newProcessingFiles])

    // Process files
    for (const fileInfo of newProcessingFiles) {
      try {
        await processFile(fileInfo)
      } catch (error) {
        updateFileStatus(fileInfo.id, 'error', { error: error.message })
      }
    }
  }, [])

  const processFile = async (fileInfo, forceReprocess = false) => {
    updateFileStatus(fileInfo.id, 'processing', { progress: 10 })

    // Convert file to base64
    const base64 = await fileToBase64(fileInfo.file)
    updateFileStatus(fileInfo.id, 'processing', { progress: 30 })

    // Send to processing API
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: fileInfo.name,
        imageBase64: base64,
        force_reprocess: forceReprocess
      })
    })

    updateFileStatus(fileInfo.id, 'processing', { progress: 70 })

    const result = await response.json()
    console.log('API Response:', result) // Debug log
    updateFileStatus(fileInfo.id, 'processing', { progress: 100 })

    if (result.status === 'success' || result.status === 'completed') {
      // Map the API response to the expected structure
      const mappedResult = {
        ...result,
        contentType: result.contentType || result.content_type || 'ocr',
        analysis: result.analysis || result.ocr || result
      }
      updateFileStatus(fileInfo.id, 'completed', { result: mappedResult })
    } else if (result.error) {
      updateFileStatus(fileInfo.id, 'error', { error: result.error })
    } else {
      // If no explicit error but also no success, treat as completed
      const mappedResult = {
        ...result,
        contentType: result.contentType || result.content_type || 'ocr',
        analysis: result.analysis || result.ocr || result
      }
      updateFileStatus(fileInfo.id, 'completed', { result: mappedResult })
    }
  }

  const updateFileStatus = (id, status, data = {}) => {
    setProcessingFiles(prev => prev.map(file => 
      file.id === id ? { ...file, status, ...data } : file
    ))
  }

  const handleForceReprocess = (file) => {
    // Create a new file info for reprocessing
    const fileInfo = {
      id: Math.random().toString(36).substr(2, 9),
      file: file.file,
      name: file.name,
      status: 'processing',
      progress: 0,
      type: 'youtube',
      result: null
    }
    
    setProcessingFiles(prev => [...prev, fileInfo])
    processFile(fileInfo, true) // Force reprocess
  }

  const handleDeleteFile = async (file) => {
    console.log('Deleting file:', file.name);
    
    try {
      // Remove from processing files
      setProcessingFiles(prev => prev.filter(f => f.id !== file.id));
      
      // Remove from search results
      setSearchResults(prev => prev.filter(f => f.filename !== file.name));
      
      // Clear search if this was the only result
      if (searchResults.length === 1) {
        setSearchQuery('');
      }
      
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = error => reject(error)
    })
  }

  const handleSearch = async (query) => {
    setIsSearching(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query || '' })
      })
      const results = await response.json()
      setSearchResults(results.results || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-white">Knowledge Library</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{stats?.overview?.totalKnowledge || 0} processed</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-800/30 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upload'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Capture</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Library</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stats'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Stats</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <UploadZone onFilesSelected={handleFilesSelected} />
            {processingFiles.length > 0 && (
                              <ProcessingStatus files={processingFiles} onForceReprocess={handleForceReprocess} onDeleteFile={handleDeleteFile} />
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-8">
            <SearchInterface 
              onSearch={handleSearch} 
              isSearching={isSearching} 
              isShowingAllContent={searchResults.length > 0 && !isSearching}
              hasSearchResults={searchResults.length > 0}
            />
            {searchResults.length > 0 && (
              <ContentGrid results={searchResults} />
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Knowledge Stats</h2>
              <p className="text-slate-400">Your second brain analytics</p>
            </div>
            
            {loadingStats ? (
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total Knowledge</p>
                        <p className="text-3xl font-bold text-white">{stats?.overview?.totalKnowledge || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">This Week</p>
                        <p className="text-3xl font-bold text-white">{stats?.overview?.thisWeek || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Avg Confidence</p>
                        <p className="text-3xl font-bold text-white">{stats?.overview?.avgConfidence || 0}%</p>
                      </div>
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Zap className="w-6 h-6 text-green-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total Cost</p>
                        <p className="text-3xl font-bold text-white">${stats?.overview?.totalCost || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-400 text-xl">$</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Types and Performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Content Types</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-slate-300">YouTube Videos</span>
                        </div>
                        <span className="text-white font-semibold">{stats?.contentTypes?.youtubeVideos || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-slate-300">Other Content</span>
                        </div>
                        <span className="text-white font-semibold">{stats?.contentTypes?.otherContent || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Avg Processing Time</span>
                        <span className="text-white font-semibold">{Math.round((stats?.performance?.avgProcessingTime || 0) / 1000)}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">High Confidence Rate</span>
                        <span className="text-white font-semibold">{stats?.performance?.highConfidenceRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Empty State or Recent Activity */}
                {stats?.overview?.totalKnowledge === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Knowledge Captured Yet</h3>
                    <p className="text-slate-400 mb-6">Start uploading screenshots to see your analytics</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200"
                    >
                      Start Capturing Knowledge
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {stats?.recentActivity?.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              activity.type === 'youtube' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>
                            <span className="text-slate-300 truncate max-w-xs">{activity.title}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-slate-400">
                            <span>{activity.confidence}%</span>
                            <span>{new Date(activity.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}