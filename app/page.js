'use client'

import { useState, useCallback } from 'react'
import { Upload, Search, FileImage, Youtube, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <FileImage className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Visual Intelligence</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{processingFiles.filter(f => f.status === 'completed').length} processed</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Search</span>
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
      </main>
    </div>
  )
}