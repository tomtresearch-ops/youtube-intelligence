'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

export default function SearchInterface({ onSearch, isSearching }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Search Knowledge</h2>
        <p className="text-slate-300">
          Ask anything about your captured content using natural language
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your captured knowledge..."
            className="block w-full pl-10 pr-4 py-3 border border-slate-600 rounded-lg bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="absolute inset-y-0 right-0 px-4 flex items-center bg-gradient-to-r from-purple-500 to-blue-600 text-white font-medium rounded-r-lg hover:from-purple-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {/* Search Examples */}
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-slate-400 text-center mb-3">Try searching for:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            'frameworks mentioned',
            'specific numbers',
            'people discussed',
            'timeline predictions',
            'key insights',
            'methodologies'
          ].map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example)
                onSearch(example)
              }}
              className="px-3 py-1 text-xs bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 hover:text-white transition-colors duration-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}