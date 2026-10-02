import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [backendHealth, setBackendHealth] = useState({ online: false });
  const [aiHealth, setAiHealth] = useState({ online: false });

  const refreshStatus = async () => {
    const bRes = await checkBackendHealth();
    setBackendHealth(bRes);
    const aRes = await checkAiHealth();
    setAiHealth(aRes);
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="h-screen w-screen bg-geo-950 text-slate-100 flex flex-col font-sans geo-grid-pattern selection:bg-blue-600 selection:text-white overflow-hidden">
        {/* Top Geospatial Navbar */}
        <Navbar 
          backendStatus={backendHealth.online ? 'online' : 'offline'}
          aiStatus={aiHealth.online ? 'online' : 'offline'}
        />

        {/* Body Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route 
                path="/" 
                element={<Dashboard backendHealth={backendHealth} aiHealth={aiHealth} />} 
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
