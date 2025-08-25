'use client'

import { Loader2, CheckCircle, AlertCircle, FileImage, Brain, Target, TrendingUp, Clock, Users, BarChart3, Lightbulb, Zap, AlertTriangle } from 'lucide-react'

export default function ProcessingStatus({ files, onForceReprocess }) {
  // Helper function to safely render array data
  const renderArrayData = (data, title, icon, maxItems = 5) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    
    return (
      <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-600/50">
        <div className="flex items-center space-x-3 mb-4">
          {icon}
          <h6 className="text-base font-semibold text-white">{title}</h6>
        </div>
        <div className="space-y-3">
          {data.slice(0, maxItems).map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-slate-200 text-sm leading-relaxed">
                {typeof item === 'string' ? item : JSON.stringify(item)}
              </p>
            </div>
          ))}
          {data.length > maxItems && (
            <p className="text-slate-400 text-sm pt-2">
              +{data.length - maxItems} more items...
            </p>
          )}
        </div>
      </div>
    );
  };

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
                </div>
                
                {/* Key Insights Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Frameworks & Methods */}
                  {renderArrayData(
                    file.result.analysis.frameworks_extracted,
                    "Key Frameworks & Methods",
                    <Lightbulb className="w-5 h-5 text-green-400" />
                  )}
                  
                  {/* Numbers & Data */}
                  {renderArrayData(
                    file.result.analysis.specific_numbers,
                    "Key Numbers & Data",
                    <BarChart3 className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                
                {/* Additional Intelligence */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Timelines & Predictions */}
                  {renderArrayData(
                    file.result.analysis.timelines_and_predictions,
                    "Timelines & Predictions",
                    <Clock className="w-5 h-5 text-blue-400" />
                  )}
                  
                  {/* Tools & Resources */}
                  {renderArrayData(
                    file.result.analysis.tools_and_resources,
                    "Tools & Resources",
                    <Zap className="w-5 h-5 text-orange-400" />
                  )}
                </div>
                
                {/* More Intelligence */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Jobs & Industries */}
                  {renderArrayData(
                    file.result.analysis.jobs_and_industries,
                    "Jobs & Industries",
                    <Users className="w-5 h-5 text-red-400" />
                  )}
                  
                  {/* People & Entities */}
                  {renderArrayData(
                    file.result.analysis.people_and_entities,
                    "People & Entities",
                    <Users className="w-5 h-5 text-green-400" />
                  )}
                </div>
                
                {/* Key Insights & Actionable Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Insights */}
                  {renderArrayData(
                    file.result.analysis.key_insights,
                    "Key Insights",
                    <Lightbulb className="w-5 h-5 text-purple-400" />
                  )}
                  
                  {/* Actionable Items */}
                  {renderArrayData(
                    file.result.analysis.actionable_items,
                    "Actionable Items",
                    <Target className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                
                {/* YouTube Video Details */}
                {file.result.contentType === 'youtube' && file.result.metadata && (
                  <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-600/50">
                    <div className="flex items-center space-x-3 mb-4">
                      <TrendingUp className="w-5 h-5 text-red-400" />
                      <h6 className="text-base font-semibold text-white">YouTube Video Details</h6>
                    </div>
                    <div className="space-y-2 text-sm">
                      {file.result.metadata.title && (
                        <p className="text-slate-200"><span className="text-slate-400">Title:</span> {file.result.metadata.title}</p>
                      )}
                      {file.result.metadata.channel && (
                        <p className="text-slate-200"><span className="text-slate-400">Channel:</span> {file.result.metadata.channel}</p>
                      )}
                      {file.result.metadata.videoUrl && (
                        <p className="text-slate-200">
                          <span className="text-slate-400">URL:</span> 
                          <a href={file.result.metadata.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 ml-1">
                            Watch on YouTube
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Error State */}
            {file.status === 'error' && (
              <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h5 className="text-lg font-semibold text-red-200">Processing Failed</h5>
                </div>
                <p className="text-red-100">{file.error || 'An unknown error occurred during processing.'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}