import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BehavioralTracker } from '../components/adaptive-ui/BehavioralTracker';
import { useAppStore } from '../store';

export function MainLayout() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Auto-close sidebar on small screens
      if (window.innerWidth < 768 && sidebarOpen) {
        toggleSidebar();
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <BehavioralTracker />
      <div 
        className="app-shell"
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Header />
        
        {/* KIROWEEN DEMO BANNER */}
        {showDemoBanner && (
          <div style={{
            backgroundColor: '#f39c12',
            color: '#2c3e50',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 99,
            flexShrink: 0
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
                🧙 CHIMERA - Self-Evolving AI Knowledge Vault
              </h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                <strong>Watch the UI evolve!</strong> Click the red "TRIGGER UI EVOLUTION" button to see the interface adapt in real-time. 
                CHIMERA tracks your behavior and automatically mutates the UI to optimize your workflow. 
                Each evolution changes colors, layouts, and features based on usage patterns.
              </p>
            </div>
            <button
              onClick={() => setShowDemoBanner(false)}
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: 'none',
                color: '#2c3e50',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '4px',
                marginLeft: '20px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
            >
              Got it! ✓
            </button>
          </div>
        )}
        <div 
          className="app-body"
          style={{ 
            display: 'flex', 
            flex: 1,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {sidebarOpen && <Sidebar />}
          <main 
            className="main-content"
            style={{ 
              flex: 1, 
              overflow: 'auto',
              backgroundColor: '#f5f5f5',
              position: 'relative',
              minWidth: 0 // Allows flex item to shrink below content size
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
