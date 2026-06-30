import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { SpendingGoal, Receipt, FavoriteStore } from '../types';
import { supabase } from '../lib/supabase';

interface SettingsViewProps {
  session: Session;
  spendingGoal: SpendingGoal;
  monthlyBaseSavings: number;
  monthlyIncome: number | null;
  receipts: Receipt[];
  avatarUrl: string | null;
  onAvatarChange: (url: string) => void;
  onBack: () => void;
  onNavigateToMyItems: () => void;
  onUpdateSpendingGoal: (goal: SpendingGoal) => void;
  onUpdateBaseSavings: (amount: number) => void;
  onUpdateMonthlyIncome: (income: number) => void;
  onLogout: () => void;
  onResetCurrentMonth: () => Promise<void>;
  onResetAllReceipts: () => Promise<void>;
  onFullReset: () => Promise<void>;
  onNotify: (message: string) => void;
}

// ── shared sub-components ──────────────────────────────────

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ios-text-secondary)', padding: '20px 4px 6px', letterSpacing: '0.3px' }}>
    {children}
  </div>
);

const SettingsBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
    {children}
  </div>
);

interface TapRowProps {
  label: string;
  value?: string;
  danger?: boolean;
  warning?: boolean;
  last?: boolean;
  noChevron?: boolean;
  centered?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const TapRow: React.FC<TapRowProps> = ({ label, value, danger, warning, last, noChevron, centered, disabled, onClick }) => {
  const color = danger ? 'var(--ios-red)' : warning ? 'var(--ios-orange)' : 'var(--ios-text-main)';
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: centered ? 'center' : 'space-between',
        height: '52px', padding: '0 16px',
        borderBottom: last ? 'none' : '0.5px solid var(--ios-border)',
        cursor: (onClick && !disabled) ? 'pointer' : 'default',
        backgroundColor: '#fff',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: '15px', color, fontWeight: (danger || warning) ? '600' : '400' }}>
        {label}
      </span>
      {!centered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value && <span style={{ fontSize: '14px', color: 'var(--ios-text-secondary)' }}>{value}</span>}
          {!noChevron && onClick && !disabled && <ChevronRight size={16} color="var(--ios-text-secondary)" />}
        </div>
      )}
    </div>
  );
};

const EditableNumRow: React.FC<{ label: string; rawValue: number; last?: boolean; onSave: (n: number) => void }> = ({ label, rawValue, last, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(rawValue));
  useEffect(() => { if (!editing) setInputVal(String(rawValue)); }, [rawValue, editing]);
  const save = () => {
    const n = parseInt(inputVal.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n) && n >= 0) onSave(n);
    setEditing(false);
  };
  return (
    <div onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', padding: '0 16px', borderBottom: last ? 'none' : '0.5px solid var(--ios-border)', backgroundColor: '#fff', cursor: 'pointer' }}>
      <span style={{ fontSize: '15px', color: 'var(--ios-text-main)' }}>{label}</span>
      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '15px', color: 'var(--ios-text-secondary)' }}>¥</span>
          <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)} onBlur={save} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }} autoFocus style={{ fontSize: '15px', border: 'none', outline: 'none', textAlign: 'right', width: '100px', backgroundColor: 'transparent', color: 'var(--ios-text-main)' }} />
        </div>
      ) : (
        <span style={{ fontSize: '15px', color: 'var(--ios-text-secondary)' }}>¥{rawValue.toLocaleString()} <ChevronRight size={14} color="var(--ios-text-secondary)" /></span>
      )}
    </div>
  );
};

const EditableTextRow: React.FC<{ label: string; rawValue: string; last?: boolean; placeholder?: string; onSave: (s: string) => void }> = ({ label, rawValue, last, placeholder, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(rawValue);
  useEffect(() => { if (!editing) setInputVal(rawValue); }, [rawValue, editing]);
  const save = () => { onSave(inputVal.trim()); setEditing(false); };
  return (
    <div onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', padding: '0 16px', borderBottom: last ? 'none' : '0.5px solid var(--ios-border)', backgroundColor: '#fff', cursor: 'pointer' }}>
      <span style={{ fontSize: '15px', color: 'var(--ios-text-main)' }}>{label}</span>
      {editing ? (
        <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)} onBlur={save} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') setEditing(false); }} autoFocus placeholder={placeholder} style={{ fontSize: '15px', border: 'none', outline: 'none', textAlign: 'right', width: '150px', backgroundColor: 'transparent', color: 'var(--ios-text-main)' }} />
      ) : (
        <span style={{ fontSize: '15px', color: 'var(--ios-text-secondary)' }}>
          {rawValue || <span style={{ fontStyle: 'italic', color: '#C7C7CC' }}>{placeholder}</span>} <ChevronRight size={14} color="var(--ios-text-secondary)" />
        </span>
      )}
    </div>
  );
};

// ── confirm dialog ─────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  warning?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, confirmLabel, danger, warning, loading, onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
    <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '28px 24px', maxWidth: '300px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center' }}>
      <div style={{ fontSize: '17px', fontWeight: '800', marginBottom: '10px' }}>{title}</div>
      <p style={{ fontSize: '13px', color: 'var(--ios-text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#E5E5EA', fontSize: '15px', fontWeight: '600', cursor: 'pointer', color: 'var(--ios-text-main)' }}>
          キャンセル
        </button>
        <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: danger ? 'var(--ios-red)' : warning ? 'var(--ios-orange)' : 'var(--ios-primary)', fontSize: '15px', fontWeight: '600', cursor: 'pointer', color: '#fff', opacity: loading ? 0.6 : 1 }}>
          {loading ? '処理中...' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── main ───────────────────────────────────────────────────

const REDUCTION_RATES = [10, 20, 30, 50];

type ResetMode = 'current-month' | 'all-receipts' | 'full-1' | 'full-2' | null;

const SettingsView: React.FC<SettingsViewProps> = ({
  session, spendingGoal, monthlyBaseSavings, monthlyIncome, receipts,
  avatarUrl, onAvatarChange,
  onBack, onNavigateToMyItems,
  onUpdateSpendingGoal, onUpdateBaseSavings, onUpdateMonthlyIncome,
  onLogout, onResetCurrentMonth, onResetAllReceipts, onFullReset, onNotify,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(avatarUrl);
  const [favoriteStores, setFavoriteStores] = useState<FavoriteStore[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [showAddStore, setShowAddStore] = useState(false);
  const [resetMode, setResetMode] = useState<ResetMode>(null);
  const [deleting, setDeleting] = useState(false);
  const [passwordSent, setPasswordSent] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [reductionRate, setReductionRate] = useState<number>(() => {
    const s = localStorage.getItem('cobaco_reduction_rate');
    if (s) { const n = parseInt(s, 10); if (REDUCTION_RATES.includes(n)) return n; }
    return 20;
  });

  // sync localAvatarUrl when prop changes
  useEffect(() => { setLocalAvatarUrl(avatarUrl); }, [avatarUrl]);

  // fetch display name and favorite stores on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('profiles').select('display_name').eq('id', session.user.id).single();
        if (data?.display_name) setDisplayName(data.display_name);
      } catch { /* table may not exist */ }
    })();
    fetchFavoriteStores();
  }, [session.user.id]);

  const fetchFavoriteStores = async () => {
    const { data } = await supabase.from('favorite_stores').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (data) setFavoriteStores(data as FavoriteStore[]);
  };

  const handleAddStore = async () => {
    const name = newStoreName.trim();
    if (!name) return;
    const { error } = await supabase.from('favorite_stores').upsert({ user_id: session.user.id, name }, { onConflict: 'user_id,name', ignoreDuplicates: true });
    if (!error) { setNewStoreName(''); setShowAddStore(false); await fetchFavoriteStores(); }
  };

  const handleDeleteStore = async (id: string) => {
    await supabase.from('favorite_stores').delete().eq('id', id);
    setFavoriteStores(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveDisplayName = async (name: string) => {
    setDisplayName(name);
    try {
      await supabase.from('profiles').upsert({ id: session.user.id, display_name: name }, { onConflict: 'id' });
    } catch { /* ignore if table doesn't exist */ }
  };

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(session.user.email!, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setPasswordSent(true);
      onNotify('パスワード変更メールを送信しました');
      setTimeout(() => setPasswordSent(false), 5000);
    } catch {
      onNotify('メール送信に失敗しました。しばらく後で再試行してください');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${session.user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = urlData.publicUrl + '?t=' + Date.now();
      await supabase.from('profiles').upsert({ id: session.user.id, avatar_url: url }, { onConflict: 'id' });
      setLocalAvatarUrl(url);
      onAvatarChange(url);
      onNotify('プロフィール写真を更新しました');
    } catch {
      onNotify('写真のアップロードに失敗しました');
    }
  };

  const cycleReductionRate = () => {
    const next = REDUCTION_RATES[(REDUCTION_RATES.indexOf(reductionRate) + 1) % REDUCTION_RATES.length];
    setReductionRate(next);
    localStorage.setItem('cobaco_reduction_rate', String(next));
  };

  const handleExportCSV = () => {
    if (receipts.length === 0) { onNotify('エクスポートするデータがありません'); return; }
    const bom = '﻿';
    const header = '日付,店舗名,金額,商品名';
    const rows = receipts.map(r => {
      const date = r.date.replace('T', ' ').slice(0, 16);
      const store = `"${r.storeName.replace(/"/g, '""')}"`;
      const items = `"${(r.items || []).join(' ')}"`;
      return `${date},${store},${r.amount},${items}`;
    });
    const csv = bom + [header, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'yorimichi_log.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const runReset = async (fn: () => Promise<void>, successMsg: string) => {
    setDeleting(true);
    try {
      await fn();
      onNotify(successMsg);
      setResetMode(null);
      if (successMsg.includes('初期化')) onBack();
    } catch {
      onNotify('削除に失敗しました。もう一度お試しください。');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ios-primary)', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '14px', fontWeight: '600', padding: '4px 0' }}>
          <ChevronLeft size={18} strokeWidth={2.5} />
          ホームに戻る
        </button>
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0 16px', letterSpacing: '-0.5px' }}>設定</h1>

      {/* アカウントセクション */}
      <SectionHeader>アカウント</SectionHeader>
      <SettingsBlock>
        {/* アバター */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: '0.5px solid var(--ios-border)' }}>
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--ios-gray-light)', cursor: 'pointer', flexShrink: 0 }}
          >
            {localAvatarUrl ? (
              <img src={localAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ios-text-secondary)' }}>
                <Camera size={22} />
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ios-text-main)' }}>{displayName || '表示名未設定'}</div>
            <div style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>{session.user.email}</div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
        </div>
        <EditableTextRow label="表示名" rawValue={displayName} placeholder="未設定" onSave={handleSaveDisplayName} />
        <div
          onClick={handleResetPassword}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', padding: '0 16px', borderBottom: 'none', backgroundColor: '#fff', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '15px', color: 'var(--ios-text-main)' }}>パスワードを変更</span>
          {passwordSent ? (
            <span style={{ fontSize: '12px', color: 'var(--ios-primary)', fontWeight: '600' }}>メールを送信しました</span>
          ) : (
            <ChevronRight size={16} color="var(--ios-text-secondary)" />
          )}
        </div>
      </SettingsBlock>

      {/* 支出・予算設定セクション */}
      <SectionHeader>支出・予算設定</SectionHeader>
      <SettingsBlock>
        <EditableNumRow label="月間コンビニ予算" rawValue={spendingGoal.monthlyAmountLimit} onSave={n => onUpdateSpendingGoal({ ...spendingGoal, monthlyAmountLimit: n })} />
        <EditableNumRow label="月間貯蓄目標額" rawValue={monthlyBaseSavings} onSave={onUpdateBaseSavings} />
        <EditableNumRow label="月間収入" rawValue={monthlyIncome ?? 0} onSave={onUpdateMonthlyIncome} />
        <TapRow label="コンビニ削減率" value={`${reductionRate}%`} last onClick={cycleReductionRate} />
      </SettingsBlock>

      {/* よく行く店舗セクション */}
      <SectionHeader>よく行く店舗</SectionHeader>
      <SettingsBlock>
        {favoriteStores.map((store) => (
          <div key={store.id} style={{ display: 'flex', alignItems: 'center', height: '52px', padding: '0 16px', borderBottom: '0.5px solid var(--ios-border)', backgroundColor: '#fff' }}>
            <span style={{ flex: 1, fontSize: '15px', color: 'var(--ios-text-main)' }}>{store.name}</span>
            <button onClick={() => handleDeleteStore(store.id)} style={{ border: 'none', background: 'none', padding: '6px', cursor: 'pointer', color: 'var(--ios-red)', display: 'flex' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>−</span>
            </button>
          </div>
        ))}
        {showAddStore ? (
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: '8px', borderTop: favoriteStores.length > 0 ? '0.5px solid var(--ios-border)' : 'none', backgroundColor: '#fff' }}>
            <input
              type="text"
              value={newStoreName}
              onChange={e => setNewStoreName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddStore(); } if (e.key === 'Escape') { setShowAddStore(false); setNewStoreName(''); } }}
              placeholder="店舗名を入力"
              autoFocus
              className="ios-input"
              style={{ flex: 1, fontSize: '14px' }}
            />
            <button onClick={handleAddStore} className="ios-btn" style={{ width: 'auto', padding: '0 14px', flexShrink: 0 }}>追加</button>
            <button onClick={() => { setShowAddStore(false); setNewStoreName(''); }} style={{ border: 'none', background: 'none', color: 'var(--ios-text-secondary)', cursor: 'pointer', fontSize: '14px', padding: '4px' }}>×</button>
          </div>
        ) : (
          <div
            onClick={() => setShowAddStore(true)}
            style={{ display: 'flex', alignItems: 'center', height: '52px', padding: '0 16px', cursor: 'pointer', backgroundColor: '#fff', borderTop: favoriteStores.length > 0 ? '0.5px solid var(--ios-border)' : 'none' }}
          >
            <span style={{ fontSize: '15px', color: 'var(--ios-primary)', fontWeight: '600' }}>+ 店舗を追加</span>
          </div>
        )}
      </SettingsBlock>

      {/* マイ定番商品セクション */}
      <SectionHeader>マイ定番商品</SectionHeader>
      <SettingsBlock>
        <TapRow label="マイ定番商品を管理" last onClick={onNavigateToMyItems} />
      </SettingsBlock>

      {/* データ管理セクション */}
      <SectionHeader>データ管理</SectionHeader>
      <SettingsBlock>
        <TapRow label="データをCSVで書き出す" onClick={handleExportCSV} />
        <TapRow label="今月のデータをリセット" warning onClick={() => setResetMode('current-month')} />
        <TapRow label="全レシートをリセット" warning onClick={() => setResetMode('all-receipts')} />
        <TapRow label="アプリを初期化する" danger last onClick={() => setResetMode('full-1')} />
      </SettingsBlock>

      {/* アプリ情報セクション */}
      <SectionHeader>アプリ情報</SectionHeader>
      <SettingsBlock>
        <TapRow label="バージョン" value="v0.0.0" noChevron />
        <div style={{ display: 'flex', alignItems: 'center', height: '52px', padding: '0 16px', borderBottom: '0.5px solid var(--ios-border)', backgroundColor: '#fff' }}>
          <span style={{ fontSize: '13px', color: 'var(--ios-text-secondary)' }}>地図データ © OpenStreetMap contributors</span>
        </div>
        <TapRow label="フィードバックを送る" last onClick={() => { window.location.href = 'mailto:s24g1115nm@chibatech.ac.jp'; }} />
      </SettingsBlock>

      {/* ログアウトセクション */}
      <SectionHeader>ログアウト</SectionHeader>
      <SettingsBlock>
        <TapRow label="ログアウト" danger last centered noChevron onClick={onLogout} />
      </SettingsBlock>

      <div style={{ height: '32px' }} />

      {/* 確認ダイアログ */}
      {resetMode === 'current-month' && (
        <ConfirmDialog
          title="今月のデータを削除"
          message="今月のレシートデータを削除しますか？"
          confirmLabel="削除する"
          warning
          loading={deleting}
          onConfirm={() => runReset(onResetCurrentMonth, '今月のデータを削除しました')}
          onCancel={() => setResetMode(null)}
        />
      )}
      {resetMode === 'all-receipts' && (
        <ConfirmDialog
          title="全レシートを削除"
          message="全てのレシート履歴を削除しますか？この操作は取り消せません。"
          confirmLabel="全て削除する"
          warning
          loading={deleting}
          onConfirm={() => runReset(onResetAllReceipts, 'レシートデータを全て削除しました')}
          onCancel={() => setResetMode(null)}
        />
      )}
      {resetMode === 'full-1' && (
        <ConfirmDialog
          title="アプリを初期化しますか？"
          message="全てのデータ（レシート・目標・バッジ・定番商品）が削除されます。"
          confirmLabel="はい、初期化する"
          danger
          loading={deleting}
          onConfirm={() => setResetMode('full-2')}
          onCancel={() => setResetMode(null)}
        />
      )}
      {resetMode === 'full-2' && (
        <ConfirmDialog
          title="本当によろしいですか？"
          message="この操作は取り消せません。本当に全てのデータを削除しますか？"
          confirmLabel="完全に初期化する"
          danger
          loading={deleting}
          onConfirm={() => runReset(onFullReset, 'アプリを初期化しました')}
          onCancel={() => setResetMode(null)}
        />
      )}
    </div>
  );
};

export default SettingsView;
