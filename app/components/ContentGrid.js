'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Brain, Target, TrendingUp, Clock, Users, BarChart3, Lightbulb, Zap, AlertTriangle, FileImage, CheckCircle } from 'lucide-react'

export default function ContentGrid({ results, isShowingAllContent, hasSearchResults }) {
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (id, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${id}-${section}`]: !prev[`${id}-${section}`]
    }))
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">No Knowledge Found</h3>
        <p className="text-slate-400">Upload a screenshot to start building your knowledge library.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {isShowingAllContent ? 'Knowledge Library' : 'Search Results'}
        </h2>
        {hasSearchResults && (
          <div className="text-sm text-slate-400">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      <div className="space-y-6">
        {results.map((result, index) => (
          <div key={result.id || index} className="bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm overflow-hidden">
            
            {/* Collapsible Title Header */}
            <button
              onClick={() => toggleSection(result.id || index, 'title')}
              className="w-full p-6 text-left hover:bg-slate-700/30 transition-colors border-b border-slate-700/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <FileImage className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white leading-tight">
                      {result.title || result.filename || 'Untitled Content'}
                    </h3>
                    {result.channel && (
                      <p className="text-sm text-slate-400 mt-1">{result.channel}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm text-slate-400">
                      {result.processedDate ? new Date(result.processedDate).toLocaleDateString() : 'Unknown date'}
                    </div>
                    {result.confidenceScore && (
                      <div className="text-xs text-slate-500">
                        Confidence: {result.confidenceScore}%
                      </div>
                    )}
                  </div>
                  {expandedSections[`${result.id || index}-title`] ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Content - Single Unified Brief */}
            {expandedSections[`${result.id || index}-title`] && (
              <div className="p-6 space-y-8">
                
                {/* Executive Summary */}
                {result.summary && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <span>Executive Summary</span>
                    </h4>
                    <div className="bg-slate-700/30 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-slate-200 leading-relaxed">{result.summary}</p>
                    </div>
                  </div>
                )}

                {/* Single Unified Brief with Numbered Sections */}
                <div className="space-y-6">
                  
                  {/* Section 1: Key Insights */}
                  {result.keyInsights && result.keyInsights.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <span className="text-blue-400 font-mono">1.</span>
                        <Lightbulb className="w-5 h-5 text-blue-400" />
                        <span>Key Insights</span>
                      </h4>
                      <div className="space-y-2 pl-8">
                        {result.keyInsights.map((insight, insightIndex) => (
                          <div key={insightIndex} className="flex items-start space-x-3">
                            <span className="text-blue-400 mt-1">•</span>
                            <p className="text-slate-200 text-sm leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 2: Frameworks & Systems */}
                  {result.frameworks && result.frameworks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <span className="text-green-400 font-mono">2.</span>
                        <Target className="w-5 h-5 text-green-400" />
                        <span>Frameworks & Systems</span>
                      </h4>
                      <div className="space-y-2 pl-8">
                        {result.frameworks.map((framework, frameworkIndex) => (
                          <div key={frameworkIndex} className="flex items-start space-x-3">
                            <span className="text-green-400 mt-1">•</span>
                            <p className="text-slate-200 text-sm leading-relaxed">{framework}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Timelines & Predictions */}
                  {result.timelines && result.timelines.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <span className="text-orange-400 font-mono">3.</span>
                        <TrendingUp className="w-5 h-5 text-orange-400" />
                        <span>Timelines & Predictions</span>
                      </h4>
                      <div className="space-y-2 pl-8">
                        {result.timelines.map((timeline, timelineIndex) => (
                          <div key={timelineIndex} className="flex items-start space-x-3">
                            <span className="text-orange-400 mt-1">•</span>
                            <p className="text-slate-200 text-sm leading-relaxed">{timeline}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 4: Tools & Resources */}
                  {result.tools && result.tools.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <span className="text-blue-400 font-mono">4.</span>
                        <Zap className="w-5 h-5 text-blue-400" />
                        <span>Tools & Resources</span>
                      </h4>
                      <div className="space-y-2 pl-8">
                        {result.tools.map((tool, toolIndex) => (
                          <div key={toolIndex} className="flex items-start space-x-3">
                            <span className="text-blue-400 mt-1">•</span>
                            <p className="text-slate-200 text-sm leading-relaxed">{tool}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 5: Jobs & Industries */}
                  {result.jobs && result.jobs.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <span className="text-purple-400 font-mono">5.</span>
                        <Users className="w-5 h-5 text-purple-400" />
                        <span>Jobs & Industries</span>
                      </h4>
                      <div className="space-y-2 pl-8">
                        {result.jobs.map((job, jobIndex) => (
                          <div key={jobIndex} className="flex items-start space-x-3">
                            <span className="text-purple-400 mt-1">•</span>
                            <p className="text-slate-200 text-sm leading-relaxed">{job}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 6: Actionable Items */}
                  {result.actionableItems && result.actionableItems.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <span className="text-yellow-400 font-mono">6.</span>
                        <Target className="w-5 h-5 text-yellow-400" />
                        <span>Actionable Items</span>
                      </h4>
                      <div className="space-y-2 pl-8">
                        {result.actionableItems.map((action, actionIndex) => (
                          <div key={actionIndex} className="flex items-start space-x-3">
                            <span className="text-yellow-400 mt-1">•</span>
                            <p className="text-slate-200 text-sm leading-relaxed">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 7: People & Entities */}
                  {result.people && result.people.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <span className="text-red-400 font-mono">7.</span>
                        <Users className="w-5 h-5 text-red-400" />
                        <span>People & Entities</span>
                      </h4>
                      <div className="space-y-2 pl-8">
                        {result.people.map((person, personIndex) => (
                          <div key={personIndex} className="flex items-start space-x-3">
                            <span className="text-red-400 mt-1">•</span>
                            <p className="text-slate-200 text-sm leading-relaxed">{person}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 8: Numbers & Data */}
                  {result.numbers && result.numbers.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <span className="text-green-400 font-mono">8.</span>
                        <BarChart3 className="w-5 h-5 text-green-400" />
                        <span>Numbers & Data</span>
                      </h4>
                      <div className="space-y-2 pl-8">
                        {result.numbers.map((number, numberIndex) => (
                          <div key={numberIndex} className="flex items-start space-x-3">
                            <span className="text-green-400 mt-1">•</span>
                            <p className="text-slate-200 text-sm leading-relaxed">{number}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Details Footer */}
                {result.videoUrl && (
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>Source: YouTube</span>
                      <a 
                        href={result.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Watch Original Video →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}