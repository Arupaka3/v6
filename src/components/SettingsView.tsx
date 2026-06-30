import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { SpendingGoal, Receipt } from '../types';
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
  const [resetMode, setResetMode] = useState<ResetMode>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [reductionRate, setReductionRate] = useState<number>(() => {
    const s = localStorage.getItem('cobaco_reduction_rate');
    if (s) { const n = parseInt(s, 10); if (REDUCTION_RATES.includes(n)) return n; }
    return 20;
  });

  // sync localAvatarUrl when prop changes
  useEffect(() => { setLocalAvatarUrl(avatarUrl); }, [avatarUrl]);

  // fetch display name on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('profiles').select('display_name').eq('id', session.user.id).single();
        if (data?.display_name) setDisplayName(data.display_name);
      } catch { /* table may not exist */ }
    })();
  }, [session.user.id]);

  const handleSaveDisplayName = async (name: string) => {
    setDisplayName(name);
    try {
      await supabase.from('profiles').upsert({ id: session.user.id, display_name: name }, { onConflict: 'id' });
    } catch { /* ignore if table doesn't exist */ }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { onNotify('パスワードは6文字以上で入力してください'); return; }
    if (newPassword !== confirmPassword) { onNotify('パスワードが一致しません'); return; }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword(''); setConfirmPassword(''); setShowPasswordForm(false);
      onNotify('パスワードを変更しました');
    } catch {
      onNotify('パスワード変更に失敗しました');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Resize to 96×96 with center-crop, store as base64
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = 96; canvas.height = 96;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 96, 96);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      try {
        const { error } = await supabase.from('profiles').upsert(
          { id: session.user.id, avatar_url: dataUrl },
          { onConflict: 'id' }
        );
        if (error) throw error;
        setLocalAvatarUrl(dataUrl);
        onAvatarChange(dataUrl);
        onNotify('プロフィール写真を更新しました');
      } catch {
        onNotify('写真の保存に失敗しました');
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); onNotify('画像の読み込みに失敗しました'); };
    img.src = objectUrl;
  };

  const cycleReductionRate = () => {
    const next = REDUCTION_RATES[(REDUCTION_RATES.indexOf(reductionRate) + 1) % REDUCTION_RATES.length];
    setReductionRate(next);
    localStorage.setItem('cobaco_reduction_rate', String(next));
  };

  const [csvPreview, setCsvPreview] = useState<string | null>(null);

  const handleExportCSV = async () => {
    if (receipts.length === 0) { onNotify('エクスポートするデータがありません'); return; }
    const header = '日付,店舗名,金額,商品名';
    const rows = receipts.map(r => {
      const date = r.date.replace('T', ' ').slice(0, 16);
      const store = `"${r.storeName.replace(/"/g, '""')}"`;
      const items = `"${(r.items || []).join(' ')}"`;
      return `${date},${store},${r.amount},${items}`;
    });
    const csv = '﻿' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // iOS: Web Share API でファイル共有
    if (typeof navigator.share === 'function') {
      const file = new File([blob], 'yorimichi_log.csv', { type: 'text/csv' });
      try {
        await navigator.share({ files: [file], title: 'よりみちログ データ' });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return; // ユーザーがキャンセル
      }
    }

    // デスクトップ: Blob URL でダウンロード
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yorimichi_log.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // 最終フォールバック: テキストをモーダルで表示してコピー
      setCsvPreview(csv);
    }
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
        {/* パスワード変更行 */}
        <div style={{ borderTop: '0.5px solid var(--ios-border)' }}>
          <div
            onClick={() => setShowPasswordForm(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', padding: '0 16px', cursor: 'pointer', backgroundColor: '#fff' }}
          >
            <span style={{ fontSize: '15px', color: 'var(--ios-text-main)' }}>パスワードを変更</span>
            <ChevronRight size={16} color="var(--ios-text-secondary)" style={{ transform: showPasswordForm ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
          {showPasswordForm && (
            <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#fff' }}>
              <input
                type="password"
                className="ios-input"
                placeholder="新しいパスワード（6文字以上）"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ fontSize: '14px' }}
              />
              <input
                type="password"
                className="ios-input"
                placeholder="パスワードを再入力"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ fontSize: '14px' }}
              />
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="ios-btn"
                style={{ fontSize: '14px', padding: '10px', opacity: passwordLoading ? 0.6 : 1 }}
              >
                {passwordLoading ? '変更中...' : 'パスワードを変更する'}
              </button>
            </div>
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

      {/* マイリストセクション */}
      <SectionHeader>マイリスト</SectionHeader>
      <SettingsBlock>
        <TapRow label="定番商品・よく行く店舗を管理" last onClick={onNavigateToMyItems} />
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

      {/* CSV プレビューモーダル（フォールバック） */}
      {csvPreview !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 6000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px 36px', width: '100%', maxHeight: '70vh', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '800' }}>CSVデータ</span>
              <button onClick={() => setCsvPreview(null)} style={{ border: 'none', background: 'var(--ios-gray-light)', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>×</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', margin: 0 }}>以下のテキストを全選択してコピーしてください</p>
            <textarea
              readOnly
              value={csvPreview}
              style={{ flex: 1, minHeight: '160px', fontSize: '11px', fontFamily: 'monospace', border: '1px solid var(--ios-border)', borderRadius: '10px', padding: '10px', resize: 'none', color: 'var(--ios-text-main)', backgroundColor: '#F9F9FB' }}
              onFocus={e => e.target.select()}
            />
            <button
              onClick={() => { navigator.clipboard.writeText(csvPreview).then(() => { onNotify('コピーしました'); setCsvPreview(null); }); }}
              className="ios-btn"
            >
              クリップボードにコピー
            </button>
          </div>
        </div>
      )}

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
