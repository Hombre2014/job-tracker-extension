import { useState, useEffect } from 'react'
import './App.css'

interface JobInfo {
  company: string
  jobTitle: string
  location?: string
  description?: string
  postUrl?: string
  salary?: string
}

function App() {
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Default board ID from user's logs
  const [boardId, setBoardId] = useState('75ca1da2-80b9-4d74-a43a-1c0bbb2b2c2d')

  useEffect(() => {
    const scrapeData = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.id) return

        chrome.tabs.sendMessage(
          tab.id, 
          { action: 'scrapeJobInfo' }, 
          (response: JobInfo) => {
            if (chrome.runtime.lastError) {
              setError('Please refresh the job page and try again.')
              setLoading(false)
              return
            }
            
            if (response && (response.company || response.jobTitle)) {
              setJobInfo(response)
            } else {
              setError('Could not find job details on this page.')
            }
            setLoading(false)
          }
        )
      } catch (err) {
        setError('Navigate to a job posting to capture details.')
        setLoading(false)
      }
    }

    scrapeData()
  }, [])

  const handleSave = (autoSave: boolean) => {
    if (!jobInfo) return

    const baseUrl = 'http://localhost:3001'
    const params = new URLSearchParams({
      company: jobInfo.company,
      title: jobInfo.jobTitle,
      location: jobInfo.location || '',
      description: jobInfo.description || '',
      url: jobInfo.postUrl || '',
      salary: jobInfo.salary || '',
      autoSave: autoSave.toString()
    })

    const targetUrl = `${baseUrl}/home/boards/${boardId}/board?${params.toString()}`
    window.open(targetUrl, '_blank')
  }

  return (
    <div className="w-[380px] p-4 bg-slate-950 text-white font-sans border border-slate-800 shadow-2xl overflow-hidden rounded-xl">
      <header className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">J</div>
          <h1 className="text-lg font-extrabold tracking-tight">
            Job Tracker
          </h1>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">AI Scraper</span>
          <span className="text-[8px] text-slate-500 font-mono">v1.1.0</span>
        </div>
      </header>

      <main className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-slate-400 animate-pulse">Scanning page for job details...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
             <div className="flex items-center gap-2 text-red-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
               <span className="text-xs font-bold uppercase tracking-wider">Error Encountered</span>
             </div>
             <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
          </div>
        ) : jobInfo ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="space-y-3 p-4 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Company</label>
                  <p className="text-sm font-bold text-slate-100 truncate" title={jobInfo.company}>{jobInfo.company || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Location</label>
                  <p className="text-sm font-bold text-slate-100 truncate" title={jobInfo.location}>{jobInfo.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t border-white/5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Position Title</label>
                <p className="text-sm font-bold text-blue-400 truncate" title={jobInfo.jobTitle}>{jobInfo.jobTitle || 'No Title Found'}</p>
              </div>
            </div>

            <div className="space-y-2 px-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                <span>Target Board ID</span>
                <span className="text-slate-600 font-normal normal-case">Saved in settings</span>
              </label>
              <input 
                type="text" 
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                placeholder="Enter Board ID..."
              />
            </div>

            <div className="grid grid-cols-5 gap-2 pt-2">
              <button
                onClick={() => handleSave(true)}
                className="col-span-3 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black rounded-xl transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 text-sm"
              >
                <span>Automated Save</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </button>
              
              <button
                onClick={() => handleSave(false)}
                className="col-span-2 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2 text-sm"
              >
                <span>Edit First</span>
              </button>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="mt-6 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-600 font-medium italic">
        <span>Ready to sync with dashboard</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-green-500/70 not-italic font-bold">LIVE</span>
        </div>
      </footer>
    </div>
  )
}

export default App
