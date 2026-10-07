import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import NewAnalysis from './pages/NewAnalysis';
import Workspace from './pages/Workspace';
import TerrainViewer from './pages/TerrainViewer';
import History from './pages/History';
import NotFound from './pages/NotFound';
import { checkBackendHealth, checkAiHealth } from './services/api';

const AI_RETRY_DELAYS = [5000, 10000, 20000, 30000];

export default function App() {
  const [backendHealth, setBackendHealth] = useState({ online: false });
  const [aiHealth, setAiHealth] = useState({ online: false, status: 'unavailable', retryAttempt: 0 });
  const retryAttemptRef = useRef(0);

  const refreshStatus = useCallback(async () => {
    const bRes = await checkBackendHealth();
    setBackendHealth(bRes);

    const aRes = await checkAiHealth();
    const retryAttempt = aRes.status === 'waking_up' || aRes.status === 'loading' ? retryAttemptRef.current + 1 : 0;
    retryAttemptRef.current = retryAttempt;
    setAiHealth({ ...aRes, retryAttempt });
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (aiHealth.status !== 'waking_up' && aiHealth.status !== 'loading') {
      retryAttemptRef.current = 0;
      return undefined;
    }

    const delayIndex = Math.min(retryAttemptRef.current, AI_RETRY_DELAYS.length - 1);
    const timeout = setTimeout(() => {
      refreshStatus();
    }, AI_RETRY_DELAYS[delayIndex]);

    return () => clearTimeout(timeout);
  }, [aiHealth.status, refreshStatus]);

  const aiStatus = aiHealth.status || 'unavailable';
  return (
    <BrowserRouter>
      <div className="h-screen w-screen bg-geo-950 text-slate-800 flex flex-col font-sans geo-grid-pattern selection:bg-blue-600 selection:text-white overflow-hidden">
        {/* Top Geospatial Navbar */}
        <Navbar 
          backendStatus={backendHealth.online ? 'online' : 'offline'}
          aiStatus={aiStatus}
        />

        {/* Body Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route 
                path="/" 
                element={<Dashboard />}
              />
              <Route path="/new-analysis" element={<NewAnalysis />} />
              <Route path="/workspace" element={<Workspace />} />
              <Route path="/terrain-viewer" element={<TerrainViewer />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
