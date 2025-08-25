'use client'

import { useState, useCallback } from 'react'
import { Upload, Search, FileImage, Youtube, FileText, Loader2, CheckCircle, AlertCircle, Brain, Zap, BarChart3 } from 'lucide-react'
import UploadZone from './components/UploadZone'
import SearchInterface from './components/SearchInterface'
import ProcessingStatus from './components/ProcessingStatus'
import ContentGrid from './components/ContentGrid'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('upload')
  const [processingFiles, setProcessingFiles] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

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

  const processFile = async (fileInfo) => {
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
        imageBase64: base64
      })
    })

    updateFileStatus(fileInfo.id, 'processing', { progress: 70 })

    const result = await response.json()
    updateFileStatus(fileInfo.id, 'processing', { progress: 100 })

    if (result.status === 'success') {
      updateFileStatus(fileInfo.id, 'completed', { result })
    } else {
      updateFileStatus(fileInfo.id, 'error', { error: result.error || 'Processing failed' })
    }
  }

  const updateFileStatus = (id, status, data = {}) => {
    setProcessingFiles(prev => prev.map(file => 
      file.id === id ? { ...file, status, ...data } : file
    ))
  }

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
        body: JSON.stringify({ query })
      })
      const results = await response.json()
      setSearchResults(results)
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
                <span>{processingFiles.filter(f => f.status === 'completed').length} processed</span>
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
              <ProcessingStatus files={processingFiles} />
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-8">
            <SearchInterface onSearch={handleSearch} isSearching={isSearching} />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Knowledge</p>
                    <p className="text-3xl font-bold text-white">0</p>
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
                    <p className="text-3xl font-bold text-white">0</p>
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
                    <p className="text-3xl font-bold text-white">0%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}