import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MyItem, FavoriteStore } from '../types';
import { ITEM_CATEGORIES } from '../types';

interface MyItemsViewProps {
  userId: string;
  onBack: () => void;
}

const MyItemsView: React.FC<MyItemsViewProps> = ({ userId, onBack }) => {
  const [tab, setTab] = useState<'items' | 'stores'>('items');

  // ── items state ──────────────────────────────────────────
  const [items, setItems] = useState<MyItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('その他');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');

  // ── stores state ─────────────────────────────────────────
  const [stores, setStores] = useState<FavoriteStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [newStoreName, setNewStoreName] = useState('');

  const fetchItems = async () => {
    setItemsLoading(true);
    const { data } = await supabase.from('my_items').select('*').eq('user_id', userId).order('use_count', { ascending: false });
    if (data) setItems(data as MyItem[]);
    setItemsLoading(false);
  };

  const fetchStores = async () => {
    setStoresLoading(true);
    const { data } = await supabase.from('favorite_stores').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setStores(data as FavoriteStore[]);
    setStoresLoading(false);
  };

  useEffect(() => { fetchItems(); fetchStores(); }, [userId]);

  // items handlers
  const handleAddItem = async () => {
    const name = newItemName.trim();
    if (!name) return;
    const { error } = await supabase.rpc('upsert_my_item', { p_user_id: userId, p_name: name, p_category: newItemCategory });
    if (!error) { setNewItemName(''); await fetchItems(); }
  };

  const handleDeleteItem = async (id: string) => {
    await supabase.from('my_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleEditItemSave = async (id: string) => {
    const name = editingItemName.trim();
    if (!name) return;
    await supabase.from('my_items').update({ name }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, name } : i));
    setEditingItemId(null);
  };

  // stores handlers
  const handleAddStore = async () => {
    const name = newStoreName.trim();
    if (!name) return;
    const { error } = await supabase.from('favorite_stores').upsert({ user_id: userId, name }, { onConflict: 'user_id,name', ignoreDuplicates: true });
    if (!error) { setNewStoreName(''); await fetchStores(); }
  };

  const handleDeleteStore = async (id: string) => {
    await supabase.from('favorite_stores').delete().eq('id', id);
    setStores(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <button type="button" onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0', color: 'var(--ios-primary)', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '14px', fontWeight: '600' }}>
          <ChevronLeft size={18} strokeWidth={2.5} />
          設定に戻る
        </button>
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 16px', letterSpacing: '-0.3px' }}>マイリスト管理</h2>

      {/* タブ */}
      <div style={{ display: 'flex', backgroundColor: '#E5E5EA', borderRadius: '12px', padding: '3px', marginBottom: '20px' }}>
        {(['items', 'stores'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600',
              backgroundColor: tab === t ? '#fff' : 'transparent',
              color: tab === t ? 'var(--ios-text-main)' : 'var(--ios-text-secondary)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t === 'items' ? '定番商品' : 'よく行く店舗'}
          </button>
        ))}
      </div>

      {/* 定番商品タブ */}
      {tab === 'items' && (
        <div>
          {itemsLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', fontSize: '14px' }}>読み込み中...</p>
          ) : items.length === 0 ? (
            <div className="ios-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>まだ定番商品がありません</p>
              <p style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', lineHeight: 1.6 }}>よく買う商品を登録しておくと<br />レシート入力時にすぐ選択できます</p>
            </div>
          ) : (
            <div className="ios-card" style={{ padding: 0 }}>
              {ITEM_CATEGORIES.filter(cat => items.some(i => (i.category || 'その他') === cat)).map(cat => (
                <div key={cat}>
                  <div style={{ padding: '6px 16px 2px', fontSize: '11px', fontWeight: '700', color: 'var(--ios-text-secondary)', backgroundColor: '#F9F9FB' }}>{cat}</div>
                  {items.filter(i => (i.category || 'その他') === cat).map((item, idx, arr) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: idx < arr.length - 1 ? '0.5px solid var(--ios-border)' : 'none', gap: '10px' }}>
                      {editingItemId === item.id ? (
                        <>
                          <input type="text" className="ios-input" value={editingItemName} onChange={e => setEditingItemName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEditItemSave(item.id); if (e.key === 'Escape') setEditingItemId(null); }} autoFocus style={{ flex: 1, fontSize: '14px', padding: '6px 10px' }} />
                          <button type="button" onClick={() => handleEditItemSave(item.id)} style={{ border: 'none', borderRadius: '8px', padding: '7px 10px', backgroundColor: 'var(--ios-primary)', cursor: 'pointer', display: 'flex' }}><Check size={14} color="#fff" /></button>
                          <button type="button" onClick={() => setEditingItemId(null)} style={{ border: 'none', borderRadius: '8px', padding: '7px 10px', backgroundColor: '#E5E5EA', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', marginLeft: '8px' }}>{item.use_count}回</span>
                          </div>
                          <button type="button" onClick={() => { setEditingItemId(item.id); setEditingItemName(item.name); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px', color: 'var(--ios-primary)', display: 'flex' }} aria-label="編集"><Pencil size={16} /></button>
                          <button type="button" onClick={() => handleDeleteItem(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px', color: 'var(--ios-red)', display: 'flex' }} aria-label="削除"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {/* 新規追加フォーム */}
          <div className="ios-card" style={{ marginTop: '16px', padding: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>新しい商品を追加</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input type="text" className="ios-input" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }} placeholder="商品名を入力" style={{ flex: 1 }} />
              <button type="button" className="ios-btn" onClick={handleAddItem} style={{ width: 'auto', padding: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14} strokeWidth={3} />追加</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ITEM_CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => setNewItemCategory(cat)} style={{ padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', border: `1.5px solid ${newItemCategory === cat ? 'var(--ios-primary)' : 'var(--ios-border)'}`, backgroundColor: newItemCategory === cat ? 'var(--ios-primary-light)' : '#fff', color: newItemCategory === cat ? 'var(--ios-primary)' : 'var(--ios-text-secondary)' }}>{cat}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* よく行く店舗タブ */}
      {tab === 'stores' && (
        <div>
          {storesLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', fontSize: '14px' }}>読み込み中...</p>
          ) : stores.length === 0 ? (
            <div className="ios-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>登録済みの店舗はありません</p>
              <p style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', lineHeight: 1.6 }}>よく行く店舗を登録すると<br />店舗名入力時に候補として表示されます</p>
            </div>
          ) : (
            <div className="ios-card" style={{ padding: 0 }}>
              {stores.map((store, idx) => (
                <div key={store.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: idx < stores.length - 1 ? '0.5px solid var(--ios-border)' : 'none', gap: '10px' }}>
                  <span style={{ flex: 1, fontSize: '15px', fontWeight: '500' }}>{store.name}</span>
                  <button type="button" onClick={() => handleDeleteStore(store.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px', color: 'var(--ios-red)', display: 'flex' }} aria-label="削除"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="ios-card" style={{ marginTop: '16px', padding: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>店舗を追加</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" className="ios-input" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddStore(); } }} placeholder="例: セブンイレブン 〇〇店" style={{ flex: 1 }} />
              <button type="button" className="ios-btn" onClick={handleAddStore} style={{ width: 'auto', padding: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14} strokeWidth={3} />追加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyItemsView;
