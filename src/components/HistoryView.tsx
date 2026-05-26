import React, { useState } from 'react';
import { Trash2, Calendar, Search, AlertCircle, ShoppingBag } from 'lucide-react';
import type { Receipt } from '../types';

interface HistoryViewProps {
  receipts: Receipt[];
  onDelete: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ receipts, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'impulse' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // コンビニごとのテーマカラー取得用
  const getStoreTheme = (name: string) => {
    if (name.includes('セブン')) return { bg: '#E6F3ED', color: '#1B9A5E', name: 'セブン' };
    if (name.includes('ファミリー') || name.includes('ファミマ')) return { bg: '#EAF6FF', color: '#00A0E9', name: 'ファミマ' };
    if (name.includes('ローソン')) return { bg: '#FFF9E6', color: '#005BAC', name: 'ローソン' };
    return { bg: '#F2F2F7', color: '#8E8E93', name: 'その他' };
  };

  // フィルタリングと検索
  const filteredReceipts = receipts.filter(receipt => {
    // 検索クエリマッチ
    const matchesSearch = 
      receipt.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (receipt.items && receipt.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase())));

    // フィルタマッチ
    if (filter === 'impulse') return matchesSearch && receipt.isImpulse;
    if (filter === 'normal') return matchesSearch && !receipt.isImpulse;
    return matchesSearch;
  });

  return (
    <div>
      <div className="view-title">
        <span>利用履歴</span>
      </div>

      {/* 検索バー */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search 
          size={18} 
          color="var(--ios-gray-dark)" 
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
        />
        <input 
          type="text" 
          placeholder="店舗名や購入品で検索..." 
          className="ios-input" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '38px', borderRadius: '12px', height: '40px' }}
        />
      </div>

      {/* セグメンテッドコントロール (iOS風切り替え) */}
      <div style={{
        display: 'flex',
        backgroundColor: 'rgba(120, 120, 128, 0.08)',
        padding: '2px',
        borderRadius: '9px',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            flex: 1,
            border: 'none',
            background: filter === 'all' ? '#FFFFFF' : 'transparent',
            boxShadow: filter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            borderRadius: '7px',
            padding: '6px 0',
            fontSize: '13px',
            fontWeight: filter === 'all' ? '600' : '500',
            color: filter === 'all' ? 'var(--ios-text-main)' : 'var(--ios-text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          すべて
        </button>
        <button
          onClick={() => setFilter('impulse')}
          style={{
            flex: 1,
            border: 'none',
            background: filter === 'impulse' ? '#FFFFFF' : 'transparent',
            boxShadow: filter === 'impulse' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            borderRadius: '7px',
            padding: '6px 0',
            fontSize: '13px',
            fontWeight: filter === 'impulse' ? '600' : '500',
            color: filter === 'impulse' ? 'var(--ios-red)' : 'var(--ios-text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          衝動買い
        </button>
        <button
          onClick={() => setFilter('normal')}
          style={{
            flex: 1,
            border: 'none',
            background: filter === 'normal' ? '#FFFFFF' : 'transparent',
            boxShadow: filter === 'normal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            borderRadius: '7px',
            padding: '6px 0',
            fontSize: '13px',
            fontWeight: filter === 'normal' ? '600' : '500',
            color: filter === 'normal' ? 'var(--ios-primary)' : 'var(--ios-text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          通常利用
        </button>
      </div>

      {/* 履歴リスト */}
      {filteredReceipts.length === 0 ? (
        <div className="ios-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ios-text-secondary)' }}>
          <AlertCircle size={32} style={{ marginBottom: '10px', color: 'var(--ios-gray-dark)' }} />
          <p style={{ fontSize: '14px' }}>一致する履歴が見つかりませんでした。</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredReceipts.map(receipt => {
            const theme = getStoreTheme(receipt.storeName);
            const dateObj = new Date(receipt.date);
            const dateStr = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
            
            return (
              <div 
                key={receipt.id} 
                className="ios-card" 
                style={{ 
                  margin: 0, 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  borderLeft: receipt.isImpulse ? '4px solid var(--ios-red)' : '4px solid var(--ios-primary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* コンビニマーク＆店舗名 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: theme.bg,
                      color: theme.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '12px'
                    }}>
                      {theme.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700' }}>{receipt.storeName}</div>
                      <span style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <Calendar size={10} />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  {/* 削除ボタン */}
                  <button 
                    onClick={() => {
                      if (window.confirm('この履歴を削除してもよろしいですか？')) {
                        onDelete(receipt.id);
                      }
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--ios-text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className="trash-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* 金額と商品 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '0.5px solid var(--ios-border)', paddingTop: '10px' }}>
                  <div style={{ flex: 1 }}>
                    {receipt.items && receipt.items.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {receipt.items.map((item, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              fontSize: '10px', 
                              backgroundColor: 'rgba(0,0,0,0.04)', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            <ShoppingBag size={8} />
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', fontStyle: 'italic' }}>商品登録なし</span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Outfit', color: receipt.isImpulse ? 'var(--ios-red)' : 'var(--ios-text-main)' }}>
                    ¥{receipt.amount.toLocaleString()}
                  </div>
                </div>

                {/* 衝動買いの理由タグ */}
                {receipt.isImpulse && receipt.impulseReasons && receipt.impulseReasons.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {receipt.impulseReasons.map((reason, idx) => (
                      <span 
                        key={idx} 
                        className="ios-badge ios-badge-warning" 
                        style={{ fontSize: '9px', padding: '2px 6px' }}
                      >
                        ⚠️ {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
