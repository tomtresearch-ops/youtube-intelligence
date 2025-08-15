'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, FileImage, AlertCircle } from 'lucide-react'

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
    <div className="space-y-6">
      {/* Upload Instructions */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Screenshots
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload screenshots of YouTube videos, whiteboards, charts, articles, or PDFs. 
          Our AI will extract and organize the content to make it searchable.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`mobile-upload-zone cursor-pointer transition-all duration-200 ${
          isDragOver ? 'border-primary-500 bg-primary-50' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              Drop images here or tap to select
            </p>
            <p className="text-sm text-gray-500">
              Support for iPhone screenshots, photos, and files up to 10MB
            </p>
          </div>
          
          <div className="flex justify-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileImage className="w-4 h-4" />
              <span>Gallery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Content Type Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <FileImage className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="font-medium text-gray-900">YouTube Videos</h3>
          </div>
          <p className="text-sm text-gray-600">
            Screenshot any YouTube video to extract title, channel, get full transcript, and AI summary
          </p>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileImage className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Visual Content</h3>
          </div>
          <p className="text-sm text-gray-600">
            Charts, whiteboards, meeting notes, articles - converted to structured, searchable data
          </p>
        </div>
      </div>
    </div>
  )
}