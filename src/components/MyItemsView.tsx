import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MyItem } from '../types';

interface MyItemsViewProps {
  userId: string;
  onBack: () => void;
}

const MyItemsView: React.FC<MyItemsViewProps> = ({ userId, onBack }) => {
  const [items, setItems] = useState<MyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('my_items')
      .select('*')
      .eq('user_id', userId)
      .order('use_count', { ascending: false });
    if (data) setItems(data as MyItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [userId]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await supabase.rpc('upsert_my_item', { p_user_id: userId, p_name: name });
      setNewName('');
      await fetchItems();
    } catch (e) {
      console.error('Failed to add my_item', e);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('my_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleEditSave = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    await supabase.from('my_items').update({ name }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, name } : i));
    setEditingId(null);
  };

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0',
            color: 'var(--ios-primary)', display: 'flex', alignItems: 'center', gap: '2px',
            fontSize: '14px', fontWeight: '600',
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          戻る
        </button>
        <span style={{ fontSize: '18px', fontWeight: '800' }}>マイ定番商品</span>
      </div>

      {/* ローディング */}
      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', fontSize: '14px' }}>読み込み中...</p>
      )}

      {/* 空状態 */}
      {!loading && items.length === 0 && (
        <div className="ios-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--ios-text-main)', marginBottom: '8px' }}>
            まだ定番商品がありません
          </p>
          <p style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', lineHeight: 1.6 }}>
            よく買う商品を登録しておくと、<br />
            レシート入力時にすぐ選択できます！
          </p>
        </div>
      )}

      {/* 商品一覧 */}
      {!loading && items.length > 0 && (
        <div className="ios-card" style={{ padding: '0' }}>
          {items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 16px',
                borderBottom: idx < items.length - 1 ? '0.5px solid var(--ios-border)' : 'none',
                gap: '10px',
              }}
            >
              {editingId === item.id ? (
                /* 編集モード */
                <>
                  <input
                    type="text"
                    className="ios-input"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleEditSave(item.id); }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    style={{ flex: 1, fontSize: '14px', padding: '6px 10px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleEditSave(item.id)}
                    style={{
                      border: 'none', borderRadius: '8px', padding: '7px 10px',
                      backgroundColor: 'var(--ios-primary)', cursor: 'pointer', display: 'flex',
                    }}
                  >
                    <Check size={14} color="#FFF" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    style={{
                      border: 'none', borderRadius: '8px', padding: '7px 10px',
                      backgroundColor: '#E5E5EA', cursor: 'pointer', display: 'flex',
                    }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                /* 表示モード */
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ios-text-main)' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', marginLeft: '8px' }}>
                      使用回数: {item.use_count}回
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEditingId(item.id); setEditingName(item.name); }}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      padding: '6px', color: 'var(--ios-primary)', display: 'flex',
                    }}
                    aria-label="編集"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      padding: '6px', color: 'var(--ios-red)', display: 'flex',
                    }}
                    aria-label="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 新規追加フォーム */}
      <div className="ios-card" style={{ marginTop: '16px', padding: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ios-text-main)', marginBottom: '10px' }}>
          新しい商品を追加
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="ios-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            placeholder="商品名を入力（例: おにぎり）"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="ios-btn"
            onClick={handleAdd}
            style={{ width: 'auto', padding: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={14} strokeWidth={3} />
            追加
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyItemsView;
