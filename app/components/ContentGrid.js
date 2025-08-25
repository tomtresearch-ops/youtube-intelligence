'use client'

import { ExternalLink, Calendar, User, FileText } from 'lucide-react'

export default function ContentGrid({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Results Found</h3>
        <p className="text-slate-400">Try adjusting your search terms or upload some screenshots first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Search Results ({results.length})
        </h3>
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>Sorted by most recent</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {results.map((result, index) => (
          <div
            key={index}
            className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-colors duration-200"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {result.title || 'Untitled Content'}
                  </h4>
                  {result.channel && (
                    <div className="flex items-center space-x-2 text-sm text-slate-400 mb-2">
                      <User className="w-4 h-4" />
                      <span>{result.channel}</span>
                    </div>
                  )}
                </div>
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-4 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Summary */}
              {result.summary && (
                <div className="space-y-2">
                  <p className="text-slate-300 leading-relaxed">
                    {result.summary}
                  </p>
                  {result.tldr && (
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-sm font-medium text-purple-400 mb-1">TL;DR</p>
                      <p className="text-sm text-slate-300">{result.tldr}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Key Insights */}
              {result.insights && result.insights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-300">Key Insights:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.insights.slice(0, 4).map((insight, insightIndex) => (
                      <div
                        key={insightIndex}
                        className="flex items-start space-x-2 text-sm"
                      >
                        <span className="text-purple-400 mt-1">•</span>
                        <span className="text-slate-300">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  {result.date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(result.date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}