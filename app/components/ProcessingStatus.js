'use client'

import { Loader2, CheckCircle, AlertCircle, FileImage, Brain, Target, TrendingUp, Clock, Users, BarChart3, Lightbulb, Zap, AlertTriangle } from 'lucide-react'

export default function ProcessingStatus({ files, onForceReprocess }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center space-x-2">
        <Brain className="w-6 h-6 text-purple-400" />
        <span>Processing Status</span>
      </h3>
      
      <div className="space-y-6">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm"
          >
            {/* File Header */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-shrink-0">
                {file.status === 'processing' && (
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                )}
                {file.status === 'completed' && (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-8 h-8 text-red-400" />
                )}
              </div>
              
                                    <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <FileImage className="w-5 h-5 text-slate-400" />
                          <h4 className="text-lg font-semibold text-white">{file.name}</h4>
                        </div>
                        
                        {file.status === 'completed' && (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-slate-300">
                              {file.result?.contentType === 'youtube' ? '🎬 YouTube Video' : '📄 Document/Image'} • 
                              Enhanced Intelligence Extraction Complete
                            </p>
                            {onForceReprocess && (
                              <button
                                onClick={() => onForceReprocess(file)}
                                className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                                title="Force reprocess this file"
                              >
                                🔄 Reprocess
                              </button>
                            )}
                          </div>
                        )}
                      </div>
            </div>
            
            {/* Processing Progress */}
            {file.status === 'processing' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Processing...</span>
                  <span className="text-slate-400">{file.progress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Enhanced Analysis Results */}
            {file.status === 'completed' && file.result?.analysis && (
              <div className="space-y-6">
                {/* Executive Summary */}
                <div className="bg-gradient-to-r from-slate-900/80 to-purple-900/20 rounded-xl p-6 border border-purple-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <Target className="w-5 h-5 text-purple-400" />
                    <h5 className="text-lg font-semibold text-white">Executive Summary</h5>
                  </div>
                  
                  {file.result.analysis.core_thesis && (
                    <div className="mb-4">
                      <h6 className="text-sm font-medium text-purple-300 mb-2">Core Thesis</h6>
                      <p className="text-white leading-relaxed">{file.result.analysis.core_thesis}</p>
                    </div>
                  )}
                  
                  {file.result.analysis.executive_distillation?.tldr && (
                    <div className="mb-4">
                      <h6 className="text-sm font-medium text-blue-300 mb-2">TL;DR</h6>
                      <p className="text-slate-200 leading-relaxed">{file.result.analysis.executive_distillation.tldr}</p>
                    </div>
                  )}
                  
                  {file.result.analysis.executive_distillation?.action_priority && (
                    <div className="mb-4">
                      <h6 className="text-sm font-medium text-orange-300 mb-2">Action Priority</h6>
                      <p className="text-slate-200 leading-relaxed">{file.result.analysis.executive_distillation.action_priority}</p>
                    </div>
                  )}
                  
                  {file.result.analysis.executive_distillation?.remember_this && (
                    <div>
                      <h6 className="text-sm font-medium text-red-300 mb-2">Remember This</h6>
                      <p className="text-slate-200 leading-relaxed">{file.result.analysis.executive_distillation.remember_this}</p>
                    </div>
                  )}
                </div>
                
                {/* Key Insights Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Frameworks & Methods */}
                  {file.result.analysis.named_frameworks_extracted && file.result.analysis.named_frameworks_extracted.length > 0 && (
                    <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-600/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <Lightbulb className="w-5 h-5 text-green-400" />
                        <h6 className="text-base font-semibold text-white">Key Frameworks & Methods</h6>
                      </div>
                      <div className="space-y-3">
                        {file.result.analysis.named_frameworks_extracted.slice(0, 5).map((framework, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-slate-200 text-sm leading-relaxed">{framework}</p>
                          </div>
                        ))}
                        {file.result.analysis.named_frameworks_extracted.length > 5 && (
                          <p className="text-slate-400 text-sm pt-2">
                            +{file.result.analysis.named_frameworks_extracted.length - 5} more frameworks...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Numbers & Data */}
                  {file.result.analysis.all_numbers_and_data && file.result.analysis.all_numbers_and_data.length > 0 && (
                    <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-600/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <BarChart3 className="w-5 h-5 text-yellow-400" />
                        <h6 className="text-base font-semibold text-white">Key Numbers & Data</h6>
                      </div>
                      <div className="space-y-3">
                        {file.result.analysis.all_numbers_and_data.slice(0, 5).map((data, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-slate-200 text-sm leading-relaxed">{data}</p>
                          </div>
                        ))}
                        {file.result.analysis.all_numbers_and_data.length > 5 && (
                          <p className="text-slate-400 text-sm pt-2">
                            +{file.result.analysis.all_numbers_and_data.length - 5} more data points...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Additional Intelligence */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Critical Information */}
                  {file.result.analysis.critical_information && (
                    <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-600/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        <h6 className="text-base font-semibold text-white">Critical Information</h6>
                      </div>
                      <div className="space-y-3">
                        {file.result.analysis.critical_information.contrarian_positions && file.result.analysis.critical_information.contrarian_positions.length > 0 && (
                          <div>
                            <h7 className="text-sm font-medium text-orange-300 mb-2 block">Contrarian Positions</h7>
                            {file.result.analysis.critical_information.contrarian_positions.slice(0, 3).map((position, idx) => (
                              <div key={idx} className="flex items-start space-x-3 mb-2">
                                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-slate-200 text-sm leading-relaxed">{position}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {file.result.analysis.critical_information.notable_claims && file.result.analysis.critical_information.notable_claims.length > 0 && (
                          <div>
                            <h7 className="text-sm font-medium text-red-300 mb-2 block">Notable Claims</h7>
                            {file.result.analysis.critical_information.notable_claims.slice(0, 3).map((claim, idx) => (
                              <div key={idx} className="flex items-start space-x-3 mb-2">
                                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-slate-200 text-sm leading-relaxed">{claim}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Future Predictions */}
                  {file.result.analysis.intelligence_synthesis?.future_predictions && file.result.analysis.intelligence_synthesis.future_predictions.length > 0 && (
                    <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-600/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        <h6 className="text-base font-semibold text-white">Future Predictions</h6>
                      </div>
                      <div className="space-y-3">
                        {file.result.analysis.intelligence_synthesis.future_predictions.slice(0, 4).map((prediction, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-slate-200 text-sm leading-relaxed">{prediction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* People & Entities */}
                {file.result.analysis.entities_and_references?.people_mentioned && file.result.analysis.entities_and_references.people_mentioned.length > 0 && (
                  <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-600/50">
                    <div className="flex items-center space-x-3 mb-4">
                      <Users className="w-5 h-5 text-purple-400" />
                      <h6 className="text-base font-semibold text-white">People & Entities Mentioned</h6>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {file.result.analysis.entities_and_references.people_mentioned.slice(0, 6).map((person, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <p className="text-slate-200 text-sm">{person}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* YouTube Video Info (if applicable) */}
                {file.result?.video && (
                  <div className="bg-gradient-to-r from-red-900/20 to-red-800/10 rounded-xl p-5 border border-red-500/20">
                    <div className="flex items-center space-x-3 mb-4">
                      <Zap className="w-5 h-5 text-red-400" />
                      <h6 className="text-base font-semibold text-white">YouTube Video Details</h6>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-red-300">Title:</span>
                        <p className="text-white text-sm mt-1">{file.result.video.title}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-red-300">Channel:</span>
                        <p className="text-white text-sm mt-1">{file.result.video.channel}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-red-300">URL:</span>
                        <a 
                          href={file.result.video.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm mt-1 block break-all"
                        >
                          {file.result.video.url}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Error State */}
            {file.status === 'error' && (
              <div className="bg-red-900/20 rounded-xl p-5 border border-red-500/20">
                <div className="flex items-center space-x-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <h6 className="text-base font-semibold text-red-300">Processing Failed</h6>
                </div>
                <p className="text-red-200">{file.error || 'An unknown error occurred during processing'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}