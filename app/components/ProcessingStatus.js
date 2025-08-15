'use client'

import { Loader2, CheckCircle, AlertCircle, Youtube, FileText, ExternalLink } from 'lucide-react'

export default function ProcessingStatus({ files }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Loader2 className="w-5 h-5 text-gray-400" />
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />
      case 'ocr':
        return <FileText className="w-4 h-4 text-blue-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusText = (file) => {
    switch (file.status) {
      case 'processing':
        return `Processing... ${file.progress || 0}%`
      case 'completed':
        if (file.result?.status === 'success') {
          return 'Successfully processed'
        } else if (file.result?.status === 'not_youtube_video') {
          return 'Not a YouTube video - trying OCR extraction'
        } else if (file.result?.status === 'video_not_found') {
          return 'YouTube video not found - extracting as document'
        }
        return 'Completed'
      case 'error':
        return `Error: ${file.error || 'Processing failed'}`
      default:
        return 'Waiting...'
    }
  }

  const getCostEstimate = (files) => {
    const completedFiles = files.filter(f => f.status === 'completed')
    const processingFiles = files.filter(f => f.status === 'processing')
    
    // Claude Vision API: $0.08 per image
    const cost = completedFiles.length * 0.08
    const estimatedCost = (completedFiles.length + processingFiles.length) * 0.08
    
    return { cost, estimatedCost }
  }

  const { cost, estimatedCost } = getCostEstimate(files)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Processing Status</h3>
        <div className="text-sm text-gray-500">
          Cost: ${cost.toFixed(3)} / Est. ${estimatedCost.toFixed(3)}
        </div>
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className="card">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(file.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </h4>
                  {file.result?.video && getTypeIcon('youtube')}
                  {file.result?.ocr && getTypeIcon('ocr')}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {getStatusText(file)}
                </p>

                {/* Progress Bar */}
                {file.status === 'processing' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${file.progress || 0}%` }}
                    />
                  </div>
                )}

                {/* Results Preview */}
                {file.status === 'completed' && file.result?.status === 'success' && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-900">
                        {file.result.video?.title || 'Extracted Content'}
                      </h5>
                      {file.result.video?.url && (
                        <a
                          href={file.result.video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    
                    {file.result.video?.channel && (
                      <p className="text-xs text-gray-500 mb-2">
                        by {file.result.video.channel}
                      </p>
                    )}
                    
                    {file.result.analysis?.summary && (
                      <p className="text-sm text-gray-700">
                        {file.result.analysis.summary}
                      </p>
                    )}
                    
                    {file.result.analysis?.key_insights && file.result.analysis.key_insights.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-900 mb-1">Key Insights:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {file.result.analysis.key_insights.slice(0, 3).map((insight, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-gray-400">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {files.filter(f => f.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {files.filter(f => f.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {files.filter(f => f.status === 'error').length}
            </div>
            <div className="text-sm text-gray-500">Errors</div>
          </div>
        </div>
      )}
    </div>
  )
}