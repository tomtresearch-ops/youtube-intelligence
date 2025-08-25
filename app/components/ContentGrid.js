'use client'

import { useState } from 'react'
import { ExternalLink, Calendar, User, FileText, Brain, Target, TrendingUp, Clock, Users, BarChart3, Lightbulb, Zap, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'

export default function ContentGrid({ results }) {
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (resultId, sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${resultId}-${sectionName}`]: !prev[`${resultId}-${sectionName}`]
    }))
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Knowledge Found</h3>
        <p className="text-slate-400">Upload some screenshots to start building your knowledge library.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Knowledge Library ({results.length})
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
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {result.contentType === 'youtube' ? (
                      <span className="text-lg">🎬</span>
                    ) : (
                      <span className="text-lg">📄</span>
                    )}
                    <h4 className="text-lg font-semibold text-white line-clamp-2">
                      {result.title || 'Untitled Content'}
                    </h4>
                  </div>
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

              {/* Executive Summary - Always Visible */}
              {result.summary && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h5 className="text-md font-semibold text-white">Executive Summary</h5>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-slate-200 leading-relaxed">
                      {result.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* TL;DR - Always Visible */}
              {result.tldr && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h5 className="text-md font-semibold text-white">TL;DR</h5>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4 border-l-4 border-yellow-500">
                    <p className="text-slate-200 font-medium">{result.tldr}</p>
                  </div>
                </div>
              )}

              {/* Collapsible Sections */}
              
              {/* Key Insights Grid */}
              {result.insights && result.insights.length > 0 && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection(result.id || index, 'insights')}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  >
                    {expandedSections[`${result.id || index}-insights`] ? (
                      <ChevronDown className="w-5 h-5 text-blue-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-blue-400" />
                    )}
                    <Lightbulb className="w-5 h-5 text-blue-400" />
                    <h5 className="text-md font-semibold text-white">Key Insights ({result.insights.length})</h5>
                  </button>
                  {expandedSections[`${result.id || index}-insights`] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                      {result.insights.slice(0, 6).map((insight, insightIndex) => (
                        <div
                          key={insightIndex}
                          className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50"
                        >
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span className="text-slate-200 text-sm leading-relaxed">{insight}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Frameworks & Methods */}
              {result.frameworks && result.frameworks.length > 0 && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection(result.id || index, 'frameworks')}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  >
                    {expandedSections[`${result.id || index}-frameworks`] ? (
                      <ChevronDown className="w-5 h-5 text-green-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-green-400" />
                    )}
                    <Target className="w-5 h-5 text-green-400" />
                    <h5 className="text-md font-semibold text-white">Frameworks & Methods ({result.frameworks.length})</h5>
                  </button>
                  {expandedSections[`${result.id || index}-frameworks`] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                      {result.frameworks.slice(0, 4).map((framework, frameworkIndex) => (
                        <div
                          key={frameworkIndex}
                          className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/50"
                        >
                          <span className="text-slate-200 text-sm">{framework}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Key Numbers & Data */}
              {result.numbers && result.numbers.length > 0 && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection(result.id || index, 'numbers')}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  >
                    {expandedSections[`${result.id || index}-numbers`] ? (
                      <ChevronDown className="w-5 h-5 text-red-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-red-400" />
                    )}
                    <BarChart3 className="w-5 h-5 text-red-400" />
                    <h5 className="text-md font-semibold text-white">Key Numbers & Data ({result.numbers.length})</h5>
                  </button>
                  {expandedSections[`${result.id || index}-numbers`] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                      {result.numbers.slice(0, 6).map((number, numberIndex) => (
                        <div
                          key={numberIndex}
                          className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/50"
                        >
                          <span className="text-slate-200 text-sm">{number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Future Predictions */}
              {result.predictions && result.predictions.length > 0 && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection(result.id || index, 'predictions')}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  >
                    {expandedSections[`${result.id || index}-predictions`] ? (
                      <ChevronDown className="w-5 h-5 text-orange-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-orange-400" />
                    )}
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    <h5 className="text-md font-semibold text-white">Future Predictions ({result.predictions.length})</h5>
                  </button>
                  {expandedSections[`${result.id || index}-predictions`] && (
                    <div className="space-y-2 pl-7">
                      {result.predictions.slice(0, 3).map((prediction, predictionIndex) => (
                        <div
                          key={predictionIndex}
                          className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-orange-500"
                        >
                          <span className="text-slate-200 text-sm">{prediction}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Items */}
              {(result.actionPriority || result.rememberThis) && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection(result.id || index, 'actions')}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  >
                    {expandedSections[`${result.id || index}-actions`] ? (
                      <ChevronDown className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-yellow-400" />
                    )}
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h5 className="text-md font-semibold text-white">Action Items</h5>
                  </button>
                  {expandedSections[`${result.id || index}-actions`] && (
                    <div className="space-y-2 pl-7">
                      {result.actionPriority && (
                        <div className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-yellow-500">
                          <p className="text-sm font-medium text-yellow-400 mb-1">Action Priority</p>
                          <p className="text-slate-200 text-sm">{result.actionPriority}</p>
                        </div>
                      )}
                      {result.rememberThis && (
                        <div className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-yellow-500">
                          <p className="text-sm font-medium text-yellow-400 mb-1">Remember This</p>
                          <p className="text-slate-200 text-sm">{result.rememberThis}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Critical Information */}
              {(result.contrarianPositions && result.contrarianPositions.length > 0) || 
               (result.importantDistinctions && result.importantDistinctions.length > 0) || 
               (result.notableClaims && result.notableClaims.length > 0) && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection(result.id || index, 'critical')}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  >
                    {expandedSections[`${result.id || index}-critical`] ? (
                      <ChevronDown className="w-5 h-5 text-red-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-red-400" />
                    )}
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h5 className="text-md font-semibold text-white">Critical Information</h5>
                  </button>
                  {expandedSections[`${result.id || index}-critical`] && (
                    <div className="space-y-3 pl-7">
                      {result.contrarianPositions && result.contrarianPositions.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-red-400 mb-2">Contrarian Positions</h6>
                          <div className="space-y-2">
                            {result.contrarianPositions.slice(0, 3).map((position, posIndex) => (
                              <div key={posIndex} className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-red-500">
                                <span className="text-slate-200 text-sm">{position}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.notableClaims && result.notableClaims.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-red-400 mb-2">Notable Claims</h6>
                          <div className="space-y-2">
                            {result.notableClaims.slice(0, 3).map((claim, claimIndex) => (
                              <div key={claimIndex} className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-red-500">
                                <span className="text-slate-200 text-sm">{claim}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Supporting Evidence & Methodology */}
              {(result.supportingEvidence && result.supportingEvidence.length > 0) || 
               (result.methodologyExplained && result.methodologyExplained.length > 0) && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection(result.id || index, 'evidence')}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  >
                    {expandedSections[`${result.id || index}-evidence`] ? (
                      <ChevronDown className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-indigo-400" />
                    )}
                    <Target className="w-5 h-5 text-indigo-400" />
                    <h5 className="text-md font-semibold text-white">Supporting Evidence & Methodology</h5>
                  </button>
                  {expandedSections[`${result.id || index}-evidence`] && (
                    <div className="space-y-3 pl-7">
                      {result.supportingEvidence && result.supportingEvidence.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-indigo-400 mb-2">Supporting Evidence</h6>
                          <div className="space-y-2">
                            {result.supportingEvidence.slice(0, 3).map((evidence, evIndex) => (
                              <div key={evIndex} className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-indigo-500">
                                <span className="text-slate-200 text-sm">{evidence}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.methodologyExplained && result.methodologyExplained.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-indigo-400 mb-2">Methodology</h6>
                          <div className="space-y-2">
                            {result.methodologyExplained.slice(0, 3).map((method, methodIndex) => (
                              <div key={methodIndex} className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-indigo-500">
                                <span className="text-slate-200 text-sm">{method}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Intelligence Synthesis */}
              {(result.connectionsMade && result.connectionsMade.length > 0) || 
               (result.implicationsAnalysis && result.implicationsAnalysis.length > 0) && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection(result.id || index, 'synthesis')}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  >
                    {expandedSections[`${result.id || index}-synthesis`] ? (
                      <ChevronDown className="w-5 h-5 text-purple-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-purple-400" />
                    )}
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h5 className="text-md font-semibold text-white">Intelligence Synthesis</h5>
                  </button>
                  {expandedSections[`${result.id || index}-synthesis`] && (
                    <div className="space-y-3 pl-7">
                      {result.connectionsMade && result.connectionsMade.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-purple-400 mb-2">Connections Made</h6>
                          <div className="space-y-2">
                            {result.connectionsMade.slice(0, 3).map((connection, connIndex) => (
                              <div key={connIndex} className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-purple-500">
                                <span className="text-slate-200 text-sm">{connection}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.implicationsAnalysis && result.implicationsAnalysis.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-purple-400 mb-2">Implications Analysis</h6>
                          <div className="space-y-2">
                            {result.implicationsAnalysis.slice(0, 3).map((implication, impIndex) => (
                              <div key={impIndex} className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-purple-500">
                                <span className="text-slate-200 text-sm">{implication}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Consumption Value */}
              {(result.whyThisMatters || result.keyCompetitiveAdvantage || result.decisionSupport) && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection(result.id || index, 'value')}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  >
                    {expandedSections[`${result.id || index}-value`] ? (
                      <ChevronDown className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-emerald-400" />
                    )}
                    <Lightbulb className="w-5 h-5 text-emerald-400" />
                    <h5 className="text-md font-semibold text-white">Why This Matters</h5>
                  </button>
                  {expandedSections[`${result.id || index}-value`] && (
                    <div className="space-y-3 pl-7">
                      {result.whyThisMatters && (
                        <div className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-emerald-500">
                          <p className="text-sm font-medium text-emerald-400 mb-1">Why This Matters</p>
                          <p className="text-slate-200 text-sm">{result.whyThisMatters}</p>
                        </div>
                      )}
                      {result.keyCompetitiveAdvantage && (
                        <div className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-emerald-500">
                          <p className="text-sm font-medium text-emerald-400 mb-1">Key Competitive Advantage</p>
                          <p className="text-slate-200 text-sm">{result.keyCompetitiveAdvantage}</p>
                        </div>
                      )}
                      {result.decisionSupport && (
                        <div className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-emerald-500">
                          <p className="text-sm font-medium text-emerald-400 mb-1">Decision Support</p>
                          <p className="text-slate-200 text-sm">{result.decisionSupport}</p>
                        </div>
                      )}
                    </div>
                  )}
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
                  {result.confidence && (
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="w-3 h-3" />
                      <span>Confidence: {Math.round(result.confidence * 100)}%</span>
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