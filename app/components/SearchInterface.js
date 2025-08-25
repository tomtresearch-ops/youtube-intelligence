'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

export default function SearchInterface({ onSearch, isSearching, isShowingAllContent = false, hasSearchResults = false }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const handleClearSearch = () => {
    setQuery('')
    onSearch('') // This will load all content
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isShowingAllContent ? 'Your Knowledge Library' : 'Search Your Knowledge'}
        </h2>
        <p className="text-slate-400">
          {isShowingAllContent 
            ? 'Browse and explore all your captured knowledge' 
            : 'Find specific insights, frameworks, and information'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="flex space-x-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for insights, frameworks, people, or topics..."
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Show clear search button when we have search results */}
      {hasSearchResults && query.trim() && (
        <div className="text-center">
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-sm transition-colors"
          >
            ← Back to All Knowledge
          </button>
        </div>
      )}

      {!isShowingAllContent && (
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-3">Search Examples:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Mo Gawdat', 'AI predictions', '15 years', 'frameworks', 'Google executive'].map((example) => (
              <button
                key={example}
                onClick={() => onSearch(example)}
                className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-sm transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}