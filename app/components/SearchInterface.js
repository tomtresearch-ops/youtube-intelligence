'use client'

import { useState } from 'react'
import { Search, Loader2, Filter, Clock } from 'lucide-react'

export default function SearchInterface({ onSearch, isSearching }) {
  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState([
    'AI tools from videos',
    'crypto analysis whiteboards',
    'meeting notes yesterday',
    'productivity frameworks'
  ])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      
      // Add to recent searches
      setRecentSearches(prev => [
        query.trim(),
        ...prev.filter(s => s !== query.trim()).slice(0, 9)
      ])
    }
  }

  const handleRecentSearchClick = (searchQuery) => {
    setQuery(searchQuery)
    onSearch(searchQuery)
  }

  const exampleQueries = [
    'Show me videos about machine learning',
    'Find whiteboards with business models',
    'Charts about cryptocurrency trends',
    'Meeting notes from last week',
    'Articles about productivity',
    'YouTube videos by specific channel'
  ]

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Search Your Visual Intelligence
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Use natural language to search across all your processed content. 
          Find videos, insights, and data from your visual uploads.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for AI tools, crypto analysis, meeting notes..."
            className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
            disabled={isSearching}
          />
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">Recent Searches</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(search)}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Example Queries */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Example Searches</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => handleRecentSearchClick(example)}
              className="text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200 text-sm text-gray-700"
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>

      {/* Search Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Search Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use natural language: "Show me videos about AI"</li>
          <li>• Search by content type: "whiteboards", "charts", "videos"</li>
          <li>• Filter by time: "yesterday", "last week", "this month"</li>
          <li>• Look for people or companies: "videos mentioning OpenAI"</li>
        </ul>
      </div>
    </div>
  )
}