'use client'

import { Loader2, CheckCircle, AlertCircle, FileImage } from 'lucide-react'

export default function ProcessingStatus({ files }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Processing Status</h3>
      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {file.status === 'processing' && (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                )}
                {file.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <FileImage className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-medium text-white truncate">
                    {file.name}
                  </p>
                </div>
                
                <div className="mt-1">
                  {file.status === 'processing' && (
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{file.progress}%</span>
                    </div>
                  )}
                  
                  {file.status === 'completed' && (
                    <p className="text-xs text-green-400">
                      Processing complete - {file.result?.contentType || 'unknown'} content detected
                    </p>
                  )}
                  
                  {file.status === 'error' && (
                    <p className="text-xs text-red-400">
                      {file.error || 'Processing failed'}
                    </p>
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