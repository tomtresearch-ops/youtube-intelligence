'use client'

import { Youtube, FileText, ExternalLink, Calendar, Tag, User } from 'lucide-react'

export default function ContentGrid({ results }) {
  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />
      case 'ocr':
        return <FileText className="w-4 h-4 text-blue-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-600">Try a different search query or upload more content to search.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Search Results ({results.length})
        </h3>
        <div className="text-sm text-gray-500">
          Sorted by relevance
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {results.map((item, index) => (
          <div key={item.id || index} className="card hover:shadow-md transition-shadow duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getContentTypeIcon(item.type)}
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {item.type === 'youtube' ? 'YouTube Video' : 'Visual Content'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {item.confidence_score && (
                  <span className="text-xs text-gray-500">
                    {Math.round(item.confidence_score * 100)}% match
                  </span>
                )}
                {item.video_url && (
                  <a
                    href={item.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Title and Channel */}
            <div className="mb-3">
              <h4 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                {item.title || item.filename || 'Untitled Content'}
              </h4>
              {item.channel && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <User className="w-3 h-3" />
                  <span>{item.channel}</span>
                </div>
              )}
            </div>

            {/* Summary */}
            {item.enhanced_summary && (
              <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                {truncateText(item.enhanced_summary)}
              </p>
            )}

            {/* Key Insights */}
            {item.key_insights && (
              <div className="mb-3">
                <h5 className="text-xs font-medium text-gray-900 mb-2">Key Insights:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {JSON.parse(item.key_insights || '[]').slice(0, 2).map((insight, insightIndex) => (
                    <li key={insightIndex} className="flex items-start space-x-1">
                      <span className="text-gray-400 flex-shrink-0">•</span>
                      <span className="line-clamp-2">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Topics/Tags */}
            {item.topics && JSON.parse(item.topics || '[]').length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {JSON.parse(item.topics).slice(0, 4).map((topic, topicIndex) => (
                    <span
                      key={topicIndex}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(item.processed_date)}</span>
              </div>
              {item.duration && (
                <span className="text-xs text-gray-500">{item.duration}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More (if applicable) */}
      {results.length >= 20 && (
        <div className="text-center">
          <button className="btn-secondary">
            Load More Results
          </button>
        </div>
      )}
    </div>
  )
}