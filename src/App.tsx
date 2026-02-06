import './App.css';
import { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Check,
  Layout,
  RefreshCw,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

import { cn } from './lib/utils';
import { config } from './lib/config';
import TextEditor from './components/TextEditor';
import { refreshAccessToken, storeTokens } from './lib/auth';
import { CompanyAutocomplete } from './components/CompanyAutocomplete';
import {
  type Board,
  fetchBoards,
  fetchBoardColumns,
  type CompanySuggestion,
  type BoardColumn as Column,
} from './lib/services';

interface JobInfo {
  company: string;
  salary?: string;
  jobTitle: string;
  postUrl?: string;
  location?: string;
  description?: string;
  companyData?: CompanySuggestion | null;
}

interface ScrapeResponse {
  salary?: string;
  company?: string;
  postUrl?: string;
  jobTitle?: string;
  location?: string;
  description?: string;
}

function App() {
  const [jobInfo, setJobInfo] = useState<JobInfo>({
    salary: '',
    company: '',
    postUrl: '',
    jobTitle: '',
    location: '',
    description: '',
    companyData: null,
  });

  const [status, setStatus] = useState<
    'idle' | 'scanning' | 'found' | 'error' | 'not_found'
  >('scanning');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Board & List State
  const [boards, setBoards] = useState<Board[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);

  // 1. Token Sync - Find frontend tab and ask for tokens
  const syncToken = useCallback(async () => {
    console.log('App: Starting token sync...');

    // Baseline: Always check storage first
    chrome.storage.local.get(['accessToken', 'refreshToken'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError.message);
        return;
      }
      if (result.accessToken && !accessToken) {
        console.log('App: Token recovered from storage');
        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken || null);
      }
    });

    try {
      const tabs = await chrome.tabs.query({});
      // Look for localhost or 127.0.0.1 on common ports (HTTP/HTTPS) or production URL
      const frontendTabs = tabs.filter(
        (t) =>
          t.url?.includes('localhost:3001') ||
          t.url?.includes('localhost:3000') ||
          t.url?.includes('127.0.0.1:3001') ||
          t.url?.includes('127.0.0.1:3000') ||
          t.url?.includes('localhost:5173') || // Vite default fallback
          (config.frontendUrl &&
            t.url?.includes(config.frontendUrl.replace(/^https?:\/\//, ''))),
      );

      if (frontendTabs.length > 0) {
        console.log(
          `App: Probing ${frontendTabs.length} potential session tabs...`,
        );
        for (const tab of frontendTabs) {
          if (!tab.id) continue;

          chrome.tabs.sendMessage(
            tab.id,
            { action: 'getTokens' },
            async (response) => {
              if (chrome.runtime.lastError) {
                return;
              }
              if (response?.accessToken) {
                console.log(`App: Token sync SUCCESS via tab ${tab.id}`);
                setAccessToken(response.accessToken);
                setRefreshToken(response.refreshToken || null);
                storeTokens(
                  response.accessToken,
                  response.refreshToken || '',
                ).catch((err) => console.error('Failed to store tokens:', err));
              }
            },
          );
        }
      }
    } catch (err) {
      console.error('App: Token sync failed:', err);
    }
  }, [accessToken]);

  useEffect(() => {
    syncToken();
    // Re-check for token every 5 seconds if not yet synced and popup is open
    const interval = setInterval(() => {
      if (!accessToken) syncToken();
    }, 5000);
    return () => clearInterval(interval);
  }, [syncToken, accessToken]);

  // 2. Fetch Boards when token is available
  useEffect(() => {
    if (accessToken) {
      fetchBoards(accessToken)
        .then((data) => {
          setBoards(data);
          if (data.length === 1) {
            // Auto-select if only one board
            setSelectedBoardId(data[0].id);
          } else if (data.length > 1) {
            chrome.storage.local.get(['lastBoardId'], (result) => {
              const id = result.lastBoardId || data[0].id;
              setSelectedBoardId(id);
            });
          }
        })
        .catch((err) => {
          console.error('App: Failed to fetch boards:', err);
          if (err.message?.includes('401')) {
            console.warn('App: Session expired. Attempting token refresh...');
            // Try to refresh token
            if (refreshToken) {
              refreshAccessToken(refreshToken)
                .then((tokens) => {
                  setAccessToken(tokens.accessToken);
                  setRefreshToken(tokens.refreshToken);
                  // Retry fetching boards with new token
                  return fetchBoards(tokens.accessToken);
                })
                .then((data) => {
                  setBoards(data);
                })
                .catch(() => {
                  // Refresh failed, clear tokens and sync
                  setAccessToken(null);
                  setRefreshToken(null);
                  chrome.storage.local.remove(['accessToken', 'refreshToken']);
                  syncToken();
                });
            } else {
              setAccessToken(null);
              chrome.storage.local.remove('accessToken');
              syncToken();
            }
          } else {
            setStatus('error');
            setErrorMsg(
              'Failed to load job boards. Please make sure you are logged in to the web app.',
            );
          }
        });
    }
  }, [accessToken, refreshToken, syncToken]);

  // 3. Fetch Columns when Board changes
  useEffect(() => {
    if (accessToken && selectedBoardId) {
      fetchBoardColumns(accessToken, selectedBoardId)
        .then((data) => {
          setColumns(data);
          if (data.length > 0) {
            setSelectedColumnId(data[0].id);
            chrome.storage.local.set({ lastBoardId: selectedBoardId });
          }
        })
        .catch((err) => {
          console.error('App: Failed to fetch columns:', err);
          if (err.message?.includes('401')) {
            setAccessToken(null);
            chrome.storage.local.remove('accessToken');
            syncToken();
          }
        });
    }
  }, [accessToken, selectedBoardId, syncToken]);

  const scrapeData = useCallback(async (retries = 3) => {
    setStatus('scanning');
    setErrorMsg('');

    // Track mounted state to prevent updates after unmount
    let isMounted = true;

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.id) {
        if (isMounted) {
          setStatus('error');
          setErrorMsg('No active tab found.');
        }
        return;
      }

      // First, check if content script is already loaded with a ping
      const checkAndInjectScript = async (): Promise<boolean> => {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id!, { action: 'ping' }, (response) => {
            if (chrome.runtime.lastError || !response?.status) {
              // Content script not loaded, try to inject it
              console.log('App: Content script not loaded, injecting...');
              const manifest = chrome.runtime.getManifest();
              const scriptFile = manifest.content_scripts?.[0]?.js?.[0];

              if (scriptFile) {
                chrome.scripting
                  .executeScript({
                    target: { tabId: tab.id! },
                    files: [scriptFile],
                  })
                  .then(() => {
                    console.log('App: Script injected successfully');
                    // Wait for script to initialize
                    setTimeout(() => resolve(true), 1200);
                  })
                  .catch((err) => {
                    console.error('App: Injection failed:', err);
                    resolve(false);
                  });
              } else {
                console.warn('App: Could not find content script in manifest');
                resolve(false);
              }
            } else {
              console.log('App: Content script already loaded and ready');
              resolve(true);
            }
          });
        });
      };

      // Ensure content script is loaded
      const isReady = await checkAndInjectScript();
      if (!isMounted) return; // Stop if unmounted

      if (!isReady) {
        setStatus('error');
        setErrorMsg(
          'Failed to load extension on this page. Please refresh the page.',
        );
        return;
      }

      const attemptSendMessage = (attempt: number) => {
        chrome.tabs.sendMessage(
          tab.id!,
          { action: 'scrapeJobInfo' },
          async (response: ScrapeResponse) => {
            if (chrome.runtime.lastError) {
              console.log(
                'App: Content script error on attempt',
                attempt,
                ':',
                chrome.runtime.lastError.message,
              );

              if (attempt < retries && isMounted) {
                setTimeout(() => attemptSendMessage(attempt + 1), 1500);
              } else if (isMounted) {
                setStatus('error');
                setErrorMsg(
                  'Unable to scrape job data. Please refresh the page and try again.',
                );
              }
              return;
            }

            if (!isMounted) return; // Don't update state if unmounted

            if (response && (response.company || response.jobTitle)) {
              setJobInfo((prev) => ({
                ...prev,
                company: response.company || '',
                jobTitle: response.jobTitle || '',
                location: response.location || '',
                description: response.description || '',
                postUrl: response.postUrl || tab.url || '',
                salary: response.salary || '',
              }));
              setStatus('found');
            } else {
              setStatus('not_found');
            }
          },
        );
      };
      attemptSendMessage(0);
    } catch (err) {
      console.error('App: Scrape error:', err);
      if (isMounted) {
        setStatus('error');
        setErrorMsg('Extension error.');
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous state update warnings
    const handle = requestAnimationFrame(async () => {
      const cleanup = await scrapeData();
      return cleanup;
    });

    return () => {
      cancelAnimationFrame(handle);
    };
  }, [scrapeData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setJobInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!selectedBoardId) return;
    setIsSaving(true);

    const fullDescription = jobInfo.description || '';

    // Generate unique storage key for this job data
    const storageKey = `job_draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Calculate salary value once (reused in both try and catch blocks)
    const salaryValue =
      jobInfo.salary &&
      jobInfo.salary.trim() &&
      !jobInfo.salary.match(/^[€$£]0*$/)
        ? jobInfo.salary
        : '';

    // Store full job data in chrome.storage (no truncation)
    const jobData = {
      company: jobInfo.company,
      companyDomain: jobInfo.companyData?.domain || '',
      companyLogo: jobInfo.companyData?.logo || null,
      title: jobInfo.jobTitle,
      location: jobInfo.location || '',
      description: fullDescription, // Full description, no truncation
      url: jobInfo.postUrl || '',
      salary: salaryValue,
      columnId: selectedColumnId,
      boardId: selectedBoardId,
      autoSave: true, // Always auto-save
      timestamp: Date.now(),
      storageKey: storageKey,
    };

    try {
      // Store in chrome.storage.local (has much higher limits than URL params)
      await chrome.storage.local.set({ [storageKey]: jobData });

      // Send message to background script to handle tab detection and message passing
      chrome.runtime.sendMessage(
        {
          action: 'sendJobData',
          data: jobData,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Failed to send message to background:',
              chrome.runtime.lastError,
            );
          } else {
            console.log('Job data sent via:', response?.method);
          }
        },
      );

      // Clean up old draft data (older than 1 hour)
      chrome.storage.local
        .get(null)
        .then((items) => {
          const oneHourAgo = Date.now() - 60 * 60 * 1000;
          const keysToRemove = Object.keys(items).filter((key) => {
            if (key.startsWith('job_draft_')) {
              const item = items[key];
              return item.timestamp && item.timestamp < oneHourAgo;
            }
            return false;
          });
          if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove);
          }
        })
        .catch((err) => {
          console.error('Error cleaning up old drafts:', err);
        });
    } catch (error) {
      console.error('Error storing job data:', error);
      // Fallback: send message anyway, background will use URL params
      chrome.runtime.sendMessage(
        {
          action: 'sendJobData',
          data: jobData,
        },
        (response) => {
          console.log('Fallback job data sent via:', response?.method);
        },
      );
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  return (
    <div className="w-105 min-h-145 bg-white text-slate-900 font-sans selection:bg-blue-100 flex flex-col">
      <div className="p-5 flex flex-col flex-1 space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center">
              <img
                src="/images/icons/icon-48.png"
                alt="Job Tracker Helper"
                className="w-9 h-9 rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-slate-800 tracking-tight leading-none">
                Job Tracker Helper
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1 block">
                Your automated job application assistant
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              syncToken();
              scrapeData();
            }}
            className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all duration-300"
            title="Rescan & Sync"
          >
            <RefreshCw
              size={18}
              strokeWidth={2.5}
              className={status === 'scanning' ? 'animate-spin' : ''}
            />
          </button>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-hidden mb-2.5">
          {status === 'scanning' ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-400">
                Scanning for job details...
              </p>
            </div>
          ) : status === 'not_found' || status === 'error' ? (
            <div className="py-8 text-center space-y-4 bg-slate-50 rounded-2xl border border-slate-100 p-6">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={24} className="text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800">Connection Issue</h3>
                <p className="text-xs text-slate-500 leading-relaxed px-2">
                  {status === 'error'
                    ? errorMsg
                    : 'The page script is not responding. This usually happens after an extension update or if the page was open before the extension was installed.'}
                </p>
              </div>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-700 leading-normal text-left flex gap-2">
                  <div className="mt-0.5">💡</div>
                  <p>
                    Clicking below will refresh this tab to reconnect the
                    script.{' '}
                    <strong>
                      You will need to reopen this popup after the refresh.
                    </strong>
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const [tab] = await chrome.tabs.query({
                      active: true,
                      currentWindow: true,
                    });
                    if (tab?.id) {
                      chrome.tabs.reload(tab.id);
                      // Use a slight delay to ensure the command is sent before the popup closes
                      setTimeout(() => window.close(), 100);
                    }
                  }}
                  className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh & Reconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-2 overflow-visible">
              {/* Job Form */}
              <div className="space-y-2 overflow-visible">
                <div className="flex gap-4 overflow-visible">
                  <div className="flex-1 space-y-1.5 overflow-visible">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Company
                    </label>
                    <CompanyAutocomplete
                      value={jobInfo.company}
                      onChange={(val) =>
                        setJobInfo((prev) => ({ ...prev, company: val }))
                      }
                      onCompanySelect={(company) =>
                        setJobInfo((prev) => ({
                          ...prev,
                          company: company.name,
                          companyData: company,
                        }))
                      }
                      selectedCompany={jobInfo.companyData}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="w-[140px] space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Location
                    </label>
                    <input
                      name="location"
                      value={jobInfo.location}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. Remote"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Job Title
                  </label>
                  <input
                    name="jobTitle"
                    value={jobInfo.jobTitle}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Software Engineer"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="w-[140px] space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Salary
                    </label>
                    <input
                      name="salary"
                      value={jobInfo.salary}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. $120k"
                    />
                  </div>

                  {/* Board Selection */}
                  <div className="flex-1 space-y-1.5 relative">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      {boards.length === 1 ? 'Board' : 'Save to Board'}
                    </label>
                    <button
                      onClick={() => {
                        if (boards.length > 1) setShowBoardMenu(!showBoardMenu);
                      }}
                      className={cn(
                        'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-1 text-sm font-bold text-slate-700 flex items-center justify-between transition-all',
                        boards.length > 1
                          ? 'hover:border-slate-300'
                          : 'cursor-default opacity-80',
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Layout
                          size={14}
                          className="text-blue-500 flex-shrink-0"
                        />
                        <span className="truncate">
                          {selectedBoard?.name ||
                            (!accessToken
                              ? 'Sync Required'
                              : boards.length === 0
                                ? 'No boards found'
                                : 'Select Board')}
                        </span>
                      </div>
                      {boards.length > 1 && (
                        <ChevronDown
                          size={14}
                          className={cn(
                            'text-slate-400 transition-transform',
                            showBoardMenu && 'rotate-180',
                          )}
                        />
                      )}
                    </button>

                    {showBoardMenu && boards.length > 1 && (
                      <div className="absolute z-50 bottom-full mb-1 w-full bg-white border border-slate-100 rounded-xl shadow-2xl p-1 animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-[200px] overflow-y-auto">
                        {boards.map((board) => (
                          <button
                            key={board.id}
                            onClick={() => {
                              setSelectedBoardId(board.id);
                              setShowBoardMenu(false);
                            }}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between transition-colors',
                              selectedBoardId === board.id
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-600 hover:bg-slate-50',
                            )}
                          >
                            <span className="truncate">{board.name}</span>
                            {selectedBoardId === board.id && (
                              <Check size={14} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* List Selection */}
                {columns.length > 0 && (
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Select List
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {columns.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => setSelectedColumnId(col.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                            selectedColumnId === col.id
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
                          )}
                        >
                          {col.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Job Description
                  </label>
                  <TextEditor
                    value={jobInfo.description || ''}
                    onChange={(value) =>
                      setJobInfo((prev) => ({ ...prev, description: value }))
                    }
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => handleSave()}
                  disabled={isSaving || !selectedBoardId}
                  className="w-full max-w-md py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-[13px] disabled:opacity-50"
                >
                  <Zap size={16} fill="white" strokeWidth={0} />
                  Quick Save
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-slate-50 flex justify-between items-center">
          <button
            onClick={() => syncToken()}
            className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight hover:text-blue-600 transition-colors"
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                accessToken
                  ? 'bg-green-500 ring-4 ring-green-50'
                  : 'bg-amber-400 ring-4 ring-amber-50 animate-pulse',
              )}
            ></div>
            <span>
              {accessToken
                ? `Board: ${selectedBoard?.name || '...'}`
                : 'Sync with Web App'}
            </span>
          </button>
          <span className="text-[10px] text-slate-400 font-mono">v1.6.1</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
