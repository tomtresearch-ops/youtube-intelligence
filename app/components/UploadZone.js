'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, FileImage, AlertCircle, Smartphone, BarChart3, FileText } from 'lucide-react'

export default function UploadZone({ onFilesSelected }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleDragEnter = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
  }

  const handleFiles = (files) => {
    setError('')
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files')
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB')
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-8">
      {/* Main Title */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Transform Screenshots into
          <span className="block text-purple-400">Searchable Knowledge</span>
        </h1>
        <p className="text-slate-300 text-lg max-w-3xl mx-auto">
          Upload iPhone screenshots of YouTube videos, whiteboards, or articles. AI extracts, summarizes, and organizes everything into your personal knowledge base.
        </p>
      </div>

      {/* Capture Knowledge Zone */}
      <div
        className={`relative cursor-pointer transition-all duration-200 ${
          isDragOver ? 'border-purple-400 bg-purple-900/20' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-6 text-center">
            {/* Upload Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Upload className="w-10 h-10 text-white" />
              </div>
            </div>
            
            {/* Title and Instructions */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">
                Capture Knowledge
              </h2>
              <p className="text-slate-300 text-lg">
                Drag & drop or tap to select multiple screenshots from your iPhone
              </p>
            </div>
            
            {/* Supported Content Types */}
            <div className="flex justify-center space-x-8 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4" />
                <span>iPhone Screenshots</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Charts & Whiteboards</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Articles & PDFs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white text-lg">Batch Upload</h3>
          </div>
          <p className="text-slate-300 text-sm">
            Select multiple screenshots for efficient processing
          </p>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white text-lg">AI Processing</h3>
          </div>
          <p className="text-slate-300 text-sm">
            Automatic extraction and NBLM-quality summarization
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white text-lg">Instant Search</h3>
          </div>
          <p className="text-slate-300 text-sm">
            Natural language queries across your knowledge base
          </p>
        </div>
      </div>
    </div>
  )
}