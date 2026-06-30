import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MyItem } from '../types';

interface ItemSelectorProps {
  items: string[];
  onChange: (items: string[]) => void;
  userId: string | null;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({ items, onChange, userId }) => {
  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('my_items')
      .select('*')
      .eq('user_id', userId)
      .order('use_count', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!cancelled && data) setMyItems(data as MyItem[]);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const upsertItem = async (name: string) => {
    if (!userId) return;
    try {
      await supabase.rpc('upsert_my_item', { p_user_id: userId, p_name: name });
      // ローカルのカウントを楽観的に更新
      setMyItems(prev => {
        const existing = prev.find(i => i.name === name);
        if (existing) {
          return prev.map(i => i.name === name ? { ...i, use_count: i.use_count + 1 } : i);
        }
        return [
          ...prev,
          { id: Date.now().toString(), user_id: userId, name, category: 'その他', use_count: 1, created_at: new Date().toISOString() }
        ];
      });
    } catch {
      // upsert失敗は無視（機能に影響しない）
    }
  };

  const handleSelectMyItem = (name: string) => {
    if (items.includes(name)) return;
    onChange([...items, name]);
    upsertItem(name);
  };

  const handleAdd = () => {
    const name = inputText.trim();
    if (!name) return;
    if (!items.includes(name)) {
      onChange([...items, name]);
      upsertItem(name);
    }
    setInputText('');
    setShowInput(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* マイ定番から選ぶ */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ios-text-secondary)', margin: '0 0 8px' }}>
          マイ定番から選ぶ
        </p>
        {!userId ? (
          <p style={{ fontSize: '12px', color: 'var(--ios-text-secondary)' }}>ログイン後に利用できます</p>
        ) : myItems.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', lineHeight: 1.4 }}>
            まだ定番商品がありません。下から追加してください
          </p>
        ) : (
          <div style={{
            display: 'flex', gap: '6px',
            overflowX: 'auto', paddingBottom: '4px',
            WebkitOverflowScrolling: 'touch',
          }}>
            {myItems.map(item => {
              const selected = items.includes(item.name);
              return (
                <button
                  key={item.id}
                  type="button"
                  onPointerDown={() => handleSelectMyItem(item.name)}
                  style={{
                    flexShrink: 0,
                    padding: '8px 14px', borderRadius: '20px',
                    border: selected ? 'none' : '1.5px solid var(--ios-border)',
                    backgroundColor: selected ? 'var(--ios-primary)' : '#FFFFFF',
                    color: selected ? '#FFFFFF' : 'var(--ios-text-main)',
                    fontSize: '13px', fontWeight: '600',
                    cursor: selected ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'rgba(0,0,0,0.08)',
                    opacity: selected ? 0.75 : 1,
                  }}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 今回の商品 */}
      {items.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ios-text-secondary)', margin: '0 0 8px' }}>
            今回の商品
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {items.map((item, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  backgroundColor: 'var(--ios-primary-light)', color: 'var(--ios-primary)',
                  padding: '5px 10px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: '600',
                }}
              >
                {item}
                <button
                  type="button"
                  onPointerDown={e => { e.stopPropagation(); onChange(items.filter((_, i) => i !== idx)); }}
                  style={{
                    border: 'none', background: 'none', padding: '0 0 0 2px',
                    cursor: 'pointer', color: 'var(--ios-primary)',
                    display: 'flex', alignItems: 'center',
                  }}
                  aria-label={`${item}を削除`}
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 手入力で追加 */}
      {showInput ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="ios-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
              if (e.key === 'Escape') { setShowInput(false); setInputText(''); }
            }}
            placeholder="商品名を入力"
            autoFocus
            style={{ flex: 1 }}
          />
          <button type="button" className="ios-btn" onClick={handleAdd}
            style={{ width: 'auto', padding: '0 16px', flexShrink: 0 }}>
            追加
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            border: '1.5px dashed var(--ios-primary)', borderRadius: '20px',
            padding: '6px 14px', fontSize: '13px', fontWeight: '600',
            color: 'var(--ios-primary)', backgroundColor: 'transparent',
            cursor: 'pointer', alignSelf: 'flex-start',
            userSelect: 'none',
          }}
        >
          <Plus size={13} strokeWidth={3} />
          商品を追加
        </button>
      )}
    </div>
  );
};

export default ItemSelector;
