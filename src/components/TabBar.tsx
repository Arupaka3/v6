import React from 'react';
import { Home, Camera, Receipt, BarChart3 } from 'lucide-react';
import type { ActiveTab } from '../types';

interface TabBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        <Home size={24} />
        <span>ホーム</span>
      </button>

      <button
        className={`tab-item ${activeTab === 'scan' ? 'active' : ''}`}
        onClick={() => setActiveTab('scan')}
        style={{ position: 'relative' }}
      >
        <div style={{
          position: 'absolute',
          top: '-15px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: activeTab === 'scan' ? 'var(--ios-primary)' : 'var(--ios-card)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: activeTab === 'scan' ? '#FFFFFF' : 'var(--ios-primary)',
          transition: 'all 0.2s ease',
          border: '3px solid var(--ios-bg)'
        }}>
          <Camera size={26} />
        </div>
        <span style={{ marginTop: '36px' }}>スキャン</span>
      </button>

      <button
        className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => setActiveTab('history')}
      >
        <Receipt size={24} />
        <span>利用履歴</span>
      </button>

      <button
        className={`tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => setActiveTab('analytics')}
      >
        <BarChart3 size={24} />
        <span>習慣分析</span>
      </button>
    </nav>
  );
};

export default TabBar;
