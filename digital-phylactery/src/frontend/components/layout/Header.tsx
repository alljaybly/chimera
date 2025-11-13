import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useState } from 'react';

export function Header() {
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const location = useLocation();
  const [generation, setGeneration] = useState(0);
  const [isEvolving, setIsEvolving] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const triggerEvolution = () => {
    setIsEvolving(true);
    const nextGen = generation + 1;
    setGeneration(nextGen);
    
    // SCREEN FLASH EFFECT
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 99999;
      pointer-events: none;
      animation: flashEffect 0.5s ease-out;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
    
    // Visual evolution effects
    const header = document.querySelector('header');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // Color schemes for each generation
    const colorSchemes = [
      { header: '#2c3e50', sidebar: '#34495e', bg: '#ecf0f1', name: 'Default' },
      { header: '#8e44ad', sidebar: '#9b59b6', bg: '#f4ecf7', name: 'Purple Haze' },
      { header: '#e74c3c', sidebar: '#c0392b', bg: '#fadbd8', name: 'Crimson Fire' },
      { header: '#3498db', sidebar: '#2980b9', bg: '#d6eaf8', name: 'Ocean Blue' },
      { header: '#16a085', sidebar: '#1abc9c', bg: '#d1f2eb', name: 'Emerald Teal' },
      { header: '#f39c12', sidebar: '#f1c40f', bg: '#fef5e7', name: 'Golden Sun' },
    ];
    
    const scheme = colorSchemes[nextGen % colorSchemes.length];
    
    if (header) {
      header.style.backgroundColor = scheme.header;
      header.style.transition = 'background-color 0.8s ease';
      header.style.transform = 'scale(1.02)';
      setTimeout(() => {
        (header as HTMLElement).style.transform = 'scale(1)';
      }, 300);
    }
    
    if (sidebar) {
      (sidebar as HTMLElement).style.backgroundColor = scheme.sidebar;
      (sidebar as HTMLElement).style.transition = 'background-color 0.8s ease';
    }
    
    if (mainContent) {
      (mainContent as HTMLElement).style.backgroundColor = scheme.bg;
      (mainContent as HTMLElement).style.transition = 'background-color 0.8s ease';
    }

    // HUGE CENTER NOTIFICATION
    const bigNotification = document.createElement('div');
    bigNotification.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">🧬</div>
      <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">
        EVOLUTION ${nextGen}
      </div>
      <div style="font-size: 20px; opacity: 0.9;">
        ${scheme.name} Theme Activated
      </div>
    `;
    bigNotification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 48px 64px;
      border-radius: 24px;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 100000;
      animation: popIn 0.5s ease-out forwards;
    `;
    document.body.appendChild(bigNotification);

    setTimeout(() => {
      bigNotification.style.animation = 'popOut 0.3s ease-in forwards';
      setTimeout(() => bigNotification.remove(), 300);
    }, 1500);

    // PARTICLE EFFECTS
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.textContent = ['🧬', '⚡', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)];
      particle.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        font-size: 32px;
        z-index: 99998;
        pointer-events: none;
        animation: particleFloat ${1 + Math.random()}s ease-out forwards;
        animation-delay: ${Math.random() * 0.3}s;
      `;
      particle.style.setProperty('--angle', `${Math.random() * 360}deg`);
      particle.style.setProperty('--distance', `${200 + Math.random() * 200}px`);
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1500);
    }

    // SUCCESS BADGE
    setTimeout(() => {
      const badge = document.createElement('div');
      badge.textContent = `✓ Generation ${nextGen} Active`;
      badge.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(45deg, #2ecc71, #27ae60);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
      `;
      document.body.appendChild(badge);

      setTimeout(() => {
        badge.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => badge.remove(), 300);
      }, 2000);
    }, 800);

    // Simulate evolution process
    setTimeout(() => {
      setIsEvolving(false);
    }, 1000);
  };

  return (
    <header style={{
      height: '60px',
      backgroundColor: '#2c3e50',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      flexShrink: 0,
      zIndex: 100
    }}>
      <button
        onClick={toggleSidebar}
        data-sidebar-toggle
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          marginRight: '20px',
          padding: '5px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'background-color 0.2s'
        }}
        title="Toggle sidebar"
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        ☰
      </button>
      <h1 style={{ 
        margin: 0, 
        fontSize: '24px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap'
      }}>
        Digital Phylactery
      </h1>

      {/* KIROWEEN DEMO MODE */}
      <div style={{
        marginLeft: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        border: '2px solid rgba(255,255,255,0.3)'
      }}>
        <button
          onClick={triggerEvolution}
          disabled={isEvolving}
          style={{
            background: isEvolving 
              ? 'linear-gradient(45deg, #ff6b6b, #ee5a6f)' 
              : 'linear-gradient(45deg, #e74c3c, #c0392b)',
            border: 'none',
            color: 'white',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isEvolving ? 'not-allowed' : 'pointer',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            transform: isEvolving ? 'scale(0.95)' : 'scale(1)',
            animation: isEvolving ? 'pulse 1s infinite' : 'none',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (!isEvolving) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isEvolving) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
            }
          }}
        >
          🧪 {isEvolving ? 'EVOLVING...' : 'TRIGGER UI EVOLUTION'}
        </button>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '4px 12px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: '4px',
          minWidth: '120px'
        }}>
          <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: 'bold' }}>
            UI GENERATION
          </span>
          <span style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: generation > 0 ? '#f39c12' : 'white',
            textShadow: generation > 0 ? '0 0 10px rgba(243,156,18,0.8)' : 'none'
          }}>
            {generation}
          </span>
        </div>
      </div>

      <nav style={{ 
        marginLeft: 'auto',
        display: 'flex',
        gap: '8px'
      }}>
        <Link 
          to="/" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            backgroundColor: isActive('/') ? 'rgba(255,255,255,0.2)' : 'transparent',
            fontWeight: isActive('/') ? 'bold' : 'normal'
          }}
          onMouseEnter={(e) => {
            if (!isActive('/')) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isActive('/') ? 'rgba(255,255,255,0.2)' : 'transparent';
          }}
        >
          Graph
        </Link>
        <Link 
          to="/search" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            backgroundColor: isActive('/search') ? 'rgba(255,255,255,0.2)' : 'transparent',
            fontWeight: isActive('/search') ? 'bold' : 'normal'
          }}
          onMouseEnter={(e) => {
            if (!isActive('/search')) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isActive('/search') ? 'rgba(255,255,255,0.2)' : 'transparent';
          }}
        >
          Search
        </Link>
        <Link 
          to="/history" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            backgroundColor: isActive('/history') ? 'rgba(255,255,255,0.2)' : 'transparent',
            fontWeight: isActive('/history') ? 'bold' : 'normal'
          }}
          onMouseEnter={(e) => {
            if (!isActive('/history')) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isActive('/history') ? 'rgba(255,255,255,0.2)' : 'transparent';
          }}
        >
          History
        </Link>
      </nav>
    </header>
  );
}
