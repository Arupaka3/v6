import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { SpendingGoal, Receipt } from '../types';
import { supabase } from '../lib/supabase';

interface SettingsViewProps {
  session: Session;
  spendingGoal: SpendingGoal;
  monthlyBaseSavings: number;
  monthlyIncome: number | null;
  receipts: Receipt[];
  onBack: () => void;
  onNavigateToMyItems: () => void;
  onUpdateSpendingGoal: (goal: SpendingGoal) => void;
  onUpdateBaseSavings: (amount: number) => void;
  onUpdateMonthlyIncome: (income: number) => void;
  onLogout: () => void;
  onDeleteAllData: () => Promise<void>;
  onNotify: (message: string) => void;
}

// ── 内部コンポーネント ────────────────────────────────────

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
  last?: boolean;
  noChevron?: boolean;
  centered?: boolean;
  onClick?: () => void;
}

const TapRow: React.FC<TapRowProps> = ({ label, value, danger, last, noChevron, centered, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: centered ? 'center' : 'space-between',
      height: '52px',
      padding: '0 16px',
      borderBottom: last ? 'none' : '0.5px solid var(--ios-border)',
      cursor: onClick ? 'pointer' : 'default',
      backgroundColor: '#fff',
    }}
  >
    <span style={{ fontSize: '15px', color: danger ? 'var(--ios-red)' : 'var(--ios-text-main)', fontWeight: danger ? '600' : '400' }}>
      {label}
    </span>
    {!centered && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {value && (
          <span style={{ fontSize: '14px', color: 'var(--ios-text-secondary)' }}>{value}</span>
        )}
        {!noChevron && onClick && (
          <ChevronRight size={16} color="var(--ios-text-secondary)" />
        )}
      </div>
    )}
  </div>
);

interface EditableNumRowProps {
  label: string;
  rawValue: number;
  last?: boolean;
  onSave: (n: number) => void;
}

const EditableNumRow: React.FC<EditableNumRowProps> = ({ label, rawValue, last, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(rawValue));

  useEffect(() => {
    if (!editing) setInputVal(String(rawValue));
  }, [rawValue, editing]);

  const handleBlur = () => {
    const n = parseInt(inputVal.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n) && n >= 0) {
      onSave(n);
    }
    setEditing(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '52px',
        padding: '0 16px',
        borderBottom: last ? 'none' : '0.5px solid var(--ios-border)',
        backgroundColor: '#fff',
        cursor: 'pointer',
      }}
      onClick={() => setEditing(true)}
    >
      <span style={{ fontSize: '15px', color: 'var(--ios-text-main)' }}>{label}</span>
      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '15px', color: 'var(--ios-text-secondary)' }}>¥</span>
          <input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            style={{
              fontSize: '15px',
              border: 'none',
              outline: 'none',
              textAlign: 'right',
              width: '100px',
              backgroundColor: 'transparent',
              color: 'var(--ios-text-main)',
            }}
          />
        </div>
      ) : (
        <span style={{ fontSize: '15px', color: 'var(--ios-text-secondary)' }}>
          ¥{rawValue.toLocaleString()}
        </span>
      )}
    </div>
  );
};

interface EditableTextRowProps {
  label: string;
  rawValue: string;
  last?: boolean;
  placeholder?: string;
  onSave: (s: string) => void;
}

const EditableTextRow: React.FC<EditableTextRowProps> = ({ label, rawValue, last, placeholder, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(rawValue);

  useEffect(() => {
    if (!editing) setInputVal(rawValue);
  }, [rawValue, editing]);

  const handleBlur = () => {
    onSave(inputVal.trim());
    setEditing(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '52px',
        padding: '0 16px',
        borderBottom: last ? 'none' : '0.5px solid var(--ios-border)',
        backgroundColor: '#fff',
        cursor: 'pointer',
      }}
      onClick={() => setEditing(true)}
    >
      <span style={{ fontSize: '15px', color: 'var(--ios-text-main)' }}>{label}</span>
      {editing ? (
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          placeholder={placeholder}
          style={{
            fontSize: '15px',
            border: 'none',
            outline: 'none',
            textAlign: 'right',
            width: '150px',
            backgroundColor: 'transparent',
            color: 'var(--ios-text-main)',
          }}
        />
      ) : (
        <span style={{ fontSize: '15px', color: 'var(--ios-text-secondary)' }}>
          {rawValue || <span style={{ fontStyle: 'italic', color: '#C7C7CC' }}>{placeholder}</span>}
        </span>
      )}
    </div>
  );
};

// ── メインコンポーネント ──────────────────────────────────

const REDUCTION_RATES = [10, 20, 30, 50];

const SettingsView: React.FC<SettingsViewProps> = ({
  session,
  spendingGoal,
  monthlyBaseSavings,
  monthlyIncome,
  receipts,
  onBack,
  onNavigateToMyItems,
  onUpdateSpendingGoal,
  onUpdateBaseSavings,
  onUpdateMonthlyIncome,
  onLogout,
  onDeleteAllData,
  onNotify,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // コンビニ削減率
  const [reductionRate, setReductionRate] = useState<number>(() => {
    const saved = localStorage.getItem('cobaco_reduction_rate');
    if (saved) {
      const n = parseInt(saved, 10);
      if (REDUCTION_RATES.includes(n)) return n;
    }
    return 20;
  });

  // 表示名をSupabaseから取得
  useEffect(() => {
    const fetchDisplayName = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .single();
        if (!error && data && data.display_name) {
          setDisplayName(data.display_name);
        }
      } catch {
        // テーブルが存在しない場合等は無視
      }
    };
    fetchDisplayName();
  }, [session.user.id]);

  // 表示名保存
  const handleSaveDisplayName = async (name: string) => {
    try {
      await supabase
        .from('profiles')
        .upsert({ id: session.user.id, display_name: name }, { onConflict: 'id' });
      setDisplayName(name);
    } catch {
      // エラーは無視
    }
  };

  // パスワードリセット
  const handleResetPassword = async () => {
    try {
      await supabase.auth.resetPasswordForEmail(session.user.email!);
      onNotify('パスワード変更メールを送信しました');
    } catch {
      onNotify('メール送信に失敗しました');
    }
  };

  // 削減率のサイクル
  const cycleReductionRate = () => {
    const idx = REDUCTION_RATES.indexOf(reductionRate);
    const next = REDUCTION_RATES[(idx + 1) % REDUCTION_RATES.length];
    setReductionRate(next);
    localStorage.setItem('cobaco_reduction_rate', String(next));
  };

  // CSV書き出し
  const handleExportCSV = () => {
    const header = '日付,店舗名,金額,商品名';
    const rows = receipts.map(r => {
      const date = r.date.replace('T', ' ').slice(0, 16);
      const items = (r.items || []).join(' ');
      return `${date},${r.storeName},${r.amount},${items}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yorimichi_log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 全データ削除の確認
  const handleConfirmDelete = async () => {
    await onDeleteAllData();
    onNotify('データを削除しました');
    setShowResetConfirm(false);
  };

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <button
          onClick={onBack}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--ios-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '14px',
            fontWeight: '600',
            padding: '4px 0',
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          ホームに戻る
        </button>
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0 16px', letterSpacing: '-0.5px' }}>設定</h1>

      {/* アカウントセクション */}
      <SectionHeader>アカウント</SectionHeader>
      <SettingsBlock>
        {/* メールアドレス表示 */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '0.5px solid var(--ios-border)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', fontWeight: '600', marginBottom: '2px' }}>
            ログイン中のアカウント
          </div>
          <div style={{ fontSize: '14px', color: 'var(--ios-text-secondary)', wordBreak: 'break-all' }}>
            {session.user.email}
          </div>
        </div>
        <EditableTextRow
          label="表示名"
          rawValue={displayName}
          placeholder="未設定"
          onSave={handleSaveDisplayName}
        />
        <TapRow
          label="パスワードを変更"
          last
          onClick={handleResetPassword}
        />
      </SettingsBlock>

      {/* 支出・予算設定セクション */}
      <SectionHeader>支出・予算設定</SectionHeader>
      <SettingsBlock>
        <EditableNumRow
          label="月間コンビニ予算"
          rawValue={spendingGoal.monthlyAmountLimit}
          onSave={n => onUpdateSpendingGoal({ ...spendingGoal, monthlyAmountLimit: n })}
        />
        <EditableNumRow
          label="月間貯蓄目標額"
          rawValue={monthlyBaseSavings}
          onSave={onUpdateBaseSavings}
        />
        <EditableNumRow
          label="月間収入"
          rawValue={monthlyIncome ?? 0}
          onSave={onUpdateMonthlyIncome}
        />
        <TapRow
          label="コンビニ削減率"
          value={`${reductionRate}%`}
          last
          onClick={cycleReductionRate}
        />
      </SettingsBlock>

      {/* マイ定番商品セクション */}
      <SectionHeader>マイ定番商品</SectionHeader>
      <SettingsBlock>
        <TapRow
          label="マイ定番商品を管理"
          last
          onClick={onNavigateToMyItems}
        />
      </SettingsBlock>

      {/* データ管理セクション */}
      <SectionHeader>データ管理</SectionHeader>
      <SettingsBlock>
        <TapRow
          label="データをCSVで書き出す"
          onClick={handleExportCSV}
        />
        <TapRow
          label="全データをリセット"
          danger
          last
          onClick={() => setShowResetConfirm(true)}
        />
      </SettingsBlock>

      {/* アプリ情報セクション */}
      <SectionHeader>アプリ情報</SectionHeader>
      <SettingsBlock>
        <TapRow
          label="バージョン"
          value="v0.0.0"
          noChevron
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '52px',
          padding: '0 16px',
          borderBottom: '0.5px solid var(--ios-border)',
          backgroundColor: '#fff',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--ios-text-secondary)', lineHeight: 1.4 }}>
            地図データ © OpenStreetMap contributors
          </span>
        </div>
        <TapRow
          label="フィードバックを送る"
          last
          onClick={() => { window.location.href = 'mailto:s24g1115nm@chibatech.ac.jp'; }}
        />
      </SettingsBlock>

      {/* ログアウトセクション */}
      <SectionHeader>ログアウト</SectionHeader>
      <SettingsBlock>
        <TapRow
          label="ログアウト"
          danger
          last
          centered
          noChevron
          onClick={onLogout}
        />
      </SettingsBlock>

      <div style={{ height: '32px' }} />

      {/* 全データ削除確認ダイアログ */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 6000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '28px 24px',
            maxWidth: '300px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--ios-text-main)' }}>
              本当に削除しますか？
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ios-text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              本当に全データを削除しますか？この操作は取り消せません
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#E5E5EA',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: 'var(--ios-text-main)',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--ios-red)',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#fff',
                }}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
