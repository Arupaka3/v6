import React, { useState } from 'react';
import { Award, CheckCircle2, Lock } from 'lucide-react';
import type { Receipt, SpendingGoal } from '../types';

interface BadgesViewProps {
  receipts: Receipt[];
  spendingGoal: SpendingGoal;
  linkedPayments: string[];
}

interface BadgeItem {
  id: string;
  name: string;
  desc: string;
  conditionDesc: string;
  icon: string; // 絵文字またはアイコン
  color: string;
  gradient: string;
  isUnlocked: boolean;
  unlockedDate?: string;
}

const BadgesView: React.FC<BadgesViewProps> = ({ receipts, spendingGoal, linkedPayments }) => {
  // 今月の支出合計と利用回数 (5月中)
  const thisMonthReceipts = receipts.filter(r => r.date.startsWith('2026-05'));
  const currentAmount = thisMonthReceipts.reduce((sum, r) => sum + r.amount, 0);
  const currentCount = thisMonthReceipts.length;

  // 衝動買いスコアの計算
  const impulseCount = thisMonthReceipts.filter(r => r.isImpulse).length;
  const lateNightCount = thisMonthReceipts.filter(r => {
    const hour = new Date(r.date).getHours();
    return hour >= 22 || hour < 5;
  }).length;

  let impulseScore = 0;
  if (currentCount > 0) {
    const ratioScore = (impulseCount / currentCount) * 80;
    const penaltyScore = Math.min(lateNightCount * 10, 20);
    impulseScore = Math.min(Math.round(ratioScore + penaltyScore), 100);
  }

  // ストリークの計算
  let noConvenienceStreak = 0;
  if (receipts.length > 0) {
    const sorted = [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDate = new Date(sorted[0].date);
    const today = new Date('2026-05-31T23:59:59');
    const diffTime = today.getTime() - lastDate.getTime();
    noConvenienceStreak = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  // 絞り込み用ステート
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // バッジ獲得判定
  const badges: BadgeItem[] = [
    {
      id: 'first_scan',
      name: '初回スキャン達成',
      desc: 'はじめの一歩！コンビニ利用の記録を開始しました。',
      conditionDesc: 'レシートを1件以上登録する',
      icon: '🥉',
      color: '#CD7F32',
      gradient: 'linear-gradient(135deg, #ECC49A 0%, #CD7F32 100%)',
      isUnlocked: receipts.length >= 1,
      unlockedDate: receipts.length >= 1 ? '2026/05/11' : undefined
    },
    {
      id: 'first_goal_achieved',
      name: '初回目標達成',
      desc: 'おめでとう！初めて設定した節約目標（金額または回数）をクリアしました。',
      conditionDesc: '節約目標を達成し、履歴が1件以上ある',
      icon: '🎖️',
      color: '#FF9500',
      gradient: 'linear-gradient(135deg, #FFD60A 0%, #FF9500 100%)',
      isUnlocked: receipts.length >= 1 && currentAmount <= spendingGoal.monthlyAmountLimit && currentCount <= spendingGoal.monthlyCountLimit,
      unlockedDate: (receipts.length >= 1 && currentAmount <= spendingGoal.monthlyAmountLimit && currentCount <= spendingGoal.monthlyCountLimit) ? '2026/05/31' : undefined
    },
    {
      id: 'streak_3',
      name: 'コンビニ断ち3日達成',
      desc: '素晴らしい忍耐力！コンビニに行かずに3日間過ごせました。',
      conditionDesc: 'コンビニ未利用ストリーク3日を達成する',
      icon: '🥈',
      color: '#C0C0C0',
      gradient: 'linear-gradient(135deg, #E6E6E6 0%, #999999 100%)',
      isUnlocked: noConvenienceStreak >= 3,
      unlockedDate: noConvenienceStreak >= 3 ? '2026/05/31' : undefined
    },
    {
      id: 'streak_7',
      name: '7日連続達成',
      desc: '驚異的な継続力！コンビニに行かずに1週間過ごせました。',
      conditionDesc: 'コンビニ未利用ストリーク7日を達成する',
      icon: '🔥',
      color: '#FF3B30',
      gradient: 'linear-gradient(135deg, #FF6961 0%, #FF3B30 100%)',
      isUnlocked: noConvenienceStreak >= 7,
      unlockedDate: noConvenienceStreak >= 7 ? '2026/05/31' : undefined
    },
    {
      id: 'impulse_control',
      name: '衝動買いスコア50以下',
      desc: '無意識の誘惑に打ち勝ち、衝動買いの傾向を大幅に抑制できています。',
      conditionDesc: '今月の衝動買いスコアが50%以下（データ数1以上）',
      icon: '🥇',
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFE766 0%, #FFD700 100%)',
      isUnlocked: receipts.length > 0 && impulseScore <= 50,
      unlockedDate: receipts.length > 0 && impulseScore <= 50 ? '2026/05/29' : undefined
    },
    {
      id: 'monthly_budget',
      name: '月間目標達成',
      desc: 'お見事！今月のコンビニ総支出を目標限度額内に収めました。',
      conditionDesc: '今月の支出が目標限度額以下（データ数1以上）',
      icon: '🏆',
      color: '#007AFF',
      gradient: 'linear-gradient(135deg, #74C6FF 0%, #007AFF 100%)',
      isUnlocked: thisMonthReceipts.length > 0 && currentAmount <= spendingGoal.monthlyAmountLimit,
      unlockedDate: thisMonthReceipts.length > 0 && currentAmount <= spendingGoal.monthlyAmountLimit ? '2026/05/31' : undefined
    },
    {
      id: 'cashless_expert',
      name: 'キャッシュレス連携達人',
      desc: '電子決済の自動連携を有効にし、自動でスマートな記録を開始しました。',
      conditionDesc: 'いずれかの電子決済連携を有効にする',
      icon: '💳',
      color: '#34C759',
      gradient: 'linear-gradient(135deg, #8EFF96 0%, #34C759 100%)',
      isUnlocked: linkedPayments.length >= 1,
      unlockedDate: linkedPayments.length >= 1 ? '2026/05/31' : undefined
    }
  ];

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  const filteredBadges = badges.filter(badge => {
    if (activeFilter === 'unlocked') return badge.isUnlocked;
    if (activeFilter === 'locked') return !badge.isUnlocked;
    return true;
  });

  return (
    <div>
      <div className="view-title">
        <span>バッジ一覧</span>
      </div>

      {/* バッジ獲得サマリー */}
      <div className="ios-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)', color: '#FFFFFF', padding: '20px', marginBottom: '16px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 215, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFD700',
          border: '1.5px solid rgba(255, 215, 0, 0.4)'
        }}>
          <Award size={32} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>獲得状況</div>
          <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit', margin: '2px 0' }}>
            {unlockedCount} / {badges.length} <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>獲得</span>
          </div>
          {/* プログレスバー */}
          <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden', marginTop: '6px' }}>
            <div style={{ width: `${(unlockedCount / badges.length) * 100}%`, height: '100%', backgroundColor: '#FFD700', borderRadius: '3px', transition: 'width 0.4s ease' }}></div>
          </div>
        </div>
      </div>

      {/* 絞り込みタブ (セグメンテッドコントロール) */}
      <div style={{
        display: 'flex',
        backgroundColor: 'rgba(120, 120, 128, 0.08)',
        padding: '2px',
        borderRadius: '9px',
        marginBottom: '16px'
      }}>
        {(['all', 'unlocked', 'locked'] as const).map(f => {
          const label = f === 'all' ? 'すべて' : f === 'unlocked' ? '獲得済み' : '未獲得';
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                flex: 1,
                border: 'none',
                background: isActive ? '#FFFFFF' : 'transparent',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                borderRadius: '7px',
                padding: '6px 0',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? 'var(--ios-text-main)' : 'var(--ios-text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* バッジリストグリッド */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredBadges.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', padding: '30px 0', fontSize: '13px' }}>
            該当するバッジがありません。
          </div>
        ) : (
          filteredBadges.map(badge => {
            return (
              <div 
                key={badge.id} 
                className="ios-card" 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '14px 16px',
                  margin: 0,
                  opacity: badge.isUnlocked ? 1 : 0.6,
                  backgroundColor: badge.isUnlocked ? '#FFFFFF' : '#FAFAFC',
                  border: badge.isUnlocked ? '1px solid rgba(0,0,0,0.03)' : '1px dashed var(--ios-border)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {badge.isUnlocked ? (
                    <CheckCircle2 size={16} color="var(--ios-primary)" strokeWidth={3} />
                  ) : (
                    <Lock size={16} color="var(--ios-gray-dark)" />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: '800', color: badge.isUnlocked ? 'var(--ios-text-main)' : 'var(--ios-text-secondary)' }}>
                    {badge.name}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '10px', 
                  color: badge.isUnlocked ? '#1B9A5E' : 'var(--ios-text-secondary)', 
                  fontWeight: '600',
                  backgroundColor: badge.isUnlocked ? 'var(--ios-primary-light)' : '#E5E5EA40',
                  border: badge.isUnlocked ? '1px solid rgba(52, 199, 89, 0.15)' : '1px solid var(--ios-border)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  display: 'inline-block',
                  alignSelf: 'flex-start'
                }}>
                  獲得条件: {badge.conditionDesc}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BadgesView;
