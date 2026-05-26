import { useState, useEffect } from 'react';
import type { ActiveTab, Receipt } from './types';
import { initialReceipts } from './data/sampleData';
import TabBar from './components/TabBar';
import HomeView from './components/HomeView';
import ScanView from './components/ScanView';
import HistoryView from './components/HistoryView';
import AnalyticsView from './components/AnalyticsView';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [islandActive, setIslandActive] = useState(false);
  const [islandMessage, setIslandMessage] = useState('');

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    const saved = localStorage.getItem('cobaco_receipts');
    if (saved) {
      try {
        setReceipts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved receipts', e);
        setReceipts(initialReceipts);
      }
    } else {
      setReceipts(initialReceipts);
      localStorage.setItem('cobaco_receipts', JSON.stringify(initialReceipts));
    }
  }, []);

  // データを保存する
  const saveReceipts = (updated: Receipt[]) => {
    setReceipts(updated);
    localStorage.setItem('cobaco_receipts', JSON.stringify(updated));
  };

  // ダイナミックアイランド通知をトリガーする
  const triggerNotification = (message: string) => {
    setIslandMessage(message);
    setIslandActive(true);
    setTimeout(() => {
      setIslandActive(false);
    }, 3000);
  };

  // レシートの追加
  const handleAddReceipt = (newReceipt: Omit<Receipt, 'id'>) => {
    const receiptWithId: Receipt = {
      ...newReceipt,
      id: Date.now().toString()
    };
    const updated = [receiptWithId, ...receipts];
    saveReceipts(updated);
    triggerNotification('レシートを保存しました 💾');
    setActiveTab('home');
  };

  // レシートの削除
  const handleDeleteReceipt = (id: string) => {
    const updated = receipts.filter(r => r.id !== id);
    saveReceipts(updated);
    triggerNotification('履歴を削除しました 🗑️');
  };

  // 時間を取得してステータスバーに表示
  const [currentTime, setCurrentTime] = useState('14:23');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="phone-frame">
      {/* ステータスバー */}
      <div className="phone-status-bar">
        <span>{currentTime}</span>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* ダイナミックアイランド (通知機能付き) */}
      <div className={`phone-island ${islandActive ? 'active' : ''}`}>
        {islandActive && (
          <div style={{
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: '600',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {islandMessage}
          </div>
        )}
      </div>

      {/* メインビューエリア */}
      <main className="scrollable">
        {activeTab === 'home' && (
          <HomeView
            receipts={receipts}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'scan' && (
          <ScanView
            onAddReceipt={handleAddReceipt}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView
            receipts={receipts}
            onDelete={handleDeleteReceipt}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView
            receipts={receipts}
          />
        )}
      </main>

      {/* ナビゲーションバー */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ホームインジケータ */}
      <div className="phone-home-indicator"></div>
    </div>
  );
}

export default App;
