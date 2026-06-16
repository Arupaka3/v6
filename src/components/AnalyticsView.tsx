import React, { useState } from 'react';
import { Clock, Lightbulb, ShieldAlert, TrendingUp } from 'lucide-react';
import type { Receipt } from '../types';

interface AnalyticsViewProps {
  receipts: Receipt[];
  monthlyIncome: number | null;
  onUpdateMonthlyIncome: (income: number) => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  receipts,
  monthlyIncome,
  onUpdateMonthlyIncome
}) => {
  const totalCount = receipts.length;

  // 1. 時間帯別の利用回数集計
  let morning = 0; // 5-11
  let lunch = 0;   // 11-17
  let evening = 0; // 17-22
  let night = 0;   // 22-5

  receipts.forEach(r => {
    const hour = new Date(r.date).getHours();
    if (hour >= 5 && hour < 11) morning++;
    else if (hour >= 11 && hour < 17) lunch++;
    else if (hour >= 17 && hour < 22) evening++;
    else night++;
  });

  const getPercentage = (count: number) => {
    return totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
  };

  // 2. 衝動買いの主な理由集計
  const reasonCounts: { [key: string]: number } = {};
  receipts.forEach(r => {
    if (r.isImpulse && r.impulseReasons) {
      r.impulseReasons.forEach(reason => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    }
  });

  const sortedReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // 3. 診断状態の管理ステート
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [isEditingIncome, setIsEditingIncome] = useState(false);

  // 平均月間コンビニ支出の算出
  let monthlyConvenienceSpent = 0;
  if (receipts.length > 0) {
    const today = new Date();
    const totalSpent = receipts.reduce((sum, r) => sum + r.amount, 0);
    const dates = receipts.map(r => new Date(r.date).getTime());
    const oldestDate = new Date(Math.min(...dates));
    const monthDiff = (today.getFullYear() - oldestDate.getFullYear()) * 12 + (today.getMonth() - oldestDate.getMonth()) + 1;
    monthlyConvenienceSpent = Math.round(totalSpent / Math.max(1, monthDiff));
  }

  // 依存度診断の計算とタイプ判定
  let dependencyRate = 0;
  if (monthlyIncome && monthlyIncome > 0) {
    dependencyRate = (monthlyConvenienceSpent / monthlyIncome) * 100;
  }
  const roundedRate = Math.min(100, Math.round(dependencyRate * 10) / 10);

  let typeName = 'コンビニ一般人';
  let icon = '🙂';
  let comment = '平均的な使い方です';
  let color = '#34C759'; // 緑
  let dependencyAdvises: string[] = [];

  if (roundedRate <= 3) {
    typeName = 'コンビニ賢者';
    icon = '🧙';
    comment = '完璧なコントロールです！';
    color = '#34C759';
    dependencyAdvises = [
      '🎉 素晴らしい自制心です！コンビニの無駄な利用を完璧に排除できています。',
      '💰 浮いたお金を「未来予測」タブに登録した欲しいものの貯金へ回すと、さらにモチベーションが高まります！'
    ];
  } else if (roundedRate <= 7) {
    typeName = 'コンビニ一般人';
    icon = '🙂';
    comment = '平均的な使い方です';
    color = '#34C759';
    dependencyAdvises = [
      '👍 健全な利用ペースです。この調子で必要な時だけの利用を続けましょう。',
      '☕ コーヒーなど特定の決まった買い物以外のついで買いを避けることで、さらに節約が進みます。'
    ];
  } else if (roundedRate <= 12) {
    typeName = 'コンビニ常連';
    icon = '😅';
    comment = '少し使いすぎかも';
    color = '#34C759';
    dependencyAdvises = [
      '🥤 ついで買いや寄り道が習慣化している可能性があります。少しだけ利用頻度を意識してみましょう。',
      '🍩 菓子類やデザートなどの甘い誘惑を週1〜2回に抑えるだけで、月数千円の節約効果が出ます！'
    ];
  } else if (roundedRate <= 20) {
    typeName = 'コンビニ依存気味';
    icon = '😰';
    comment = '見直しをおすすめします';
    color = '#FF9500'; // オレンジ
    dependencyAdvises = [
      '⚠️ 支出に占めるコンビニの割合が高めです。「マイボトルを持ち歩く」など、簡単なルール作りから始めましょう。',
      '🏪 なんとなくコンビニに立ち寄る習慣（寄り道ルート）自体を意識して変更すると非常に効果的です。'
    ];
  } else {
    typeName = 'コンビニ廃人';
    icon = '🚨';
    comment = '要注意レベルです';
    color = '#FF3B30'; // 赤
    dependencyAdvises = [
      '🚨 要注意レベルです。無意識のコンビニ寄りが月収を大きく圧迫している可能性があります。',
      '🚶‍♂️ 日常の飲料やスナックはスーパーやドラッグストアで買い置きするようにし、明日から「コンビニ断ち」を意識してください。'
    ];
  }

  return (
    <div>
      <div className="view-title">
        <span>習慣分析</span>
      </div>

      {/* コンビニ依存度診断カード */}
      <div className="ios-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <span style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={18} color="var(--ios-primary)" />
          コンビニ依存度診断
        </span>

        {totalCount === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', padding: '20px 0', fontSize: '13px' }}>
            データ不足のため、診断できません。レシートを追加してください。
          </div>
        ) : !showDiagnosis ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 10px', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              月間収入とコンビニ支出の割合から、あなたの依存度タイプと改善のアドバイスを診断します。
            </p>
            <button
              onClick={() => {
                setShowDiagnosis(true);
                if (monthlyIncome) {
                  setIncomeInput(monthlyIncome.toString());
                } else {
                  setIncomeInput('');
                }
              }}
              className="ios-btn"
              style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '12px', width: 'auto' }}
            >
              診断をスタート 🎯
            </button>
          </div>
        ) : (monthlyIncome === null || monthlyIncome === undefined || isEditingIncome) ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const income = Number(incomeInput);
              if (income > 0) {
                onUpdateMonthlyIncome(income);
                setIsEditingIncome(false);
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}
          >
            <div className="ios-input-group" style={{ margin: 0 }}>
              <label className="ios-input-label" style={{ fontSize: '11px' }}>月収を入力してください (円)</label>
              <input
                type="number"
                className="ios-input"
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                placeholder="例: 200000"
                min="1000"
                required
                style={{ padding: '8px 12px', fontSize: '14px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isEditingIncome && (
                <button
                  type="button"
                  onClick={() => setIsEditingIncome(false)}
                  className="ios-btn ios-btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px', width: 'auto' }}
                >
                  キャンセル
                </button>
              )}
              <button
                type="submit"
                className="ios-btn"
                style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px', flex: 1 }}
              >
                診断する
              </button>
            </div>
          </form>
        ) : (
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '14px', 
              animation: 'fadeIn 0.5s ease-out',
              padding: '10px 0' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '32px' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', fontWeight: 600 }}>あなたのコンビニ依存タイプ</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: color, marginTop: '2px' }}>
                  {typeName}
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: '700' }}>
                <span>月収に占めるコンビニ支出割合</span>
                <span style={{ color: color, fontFamily: 'Outfit' }}>{roundedRate}%</span>
              </div>
              <div style={{ height: '10px', backgroundColor: 'var(--ios-gray-light)', borderRadius: '5px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, roundedRate)}%`, 
                    height: '100%', 
                    backgroundColor: color, 
                    borderRadius: '5px',
                    transition: 'width 0.8s ease-out'
                  }}
                ></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--ios-text-secondary)', marginTop: '6px', fontWeight: 600 }}>
                <span>月平均コンビニ支出: ¥{monthlyConvenienceSpent.toLocaleString()}</span>
                <span>月収: ¥{monthlyIncome.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#FAFAFC', padding: '12px', borderRadius: '12px', borderLeft: `4px solid ${color}` }}>
              <p style={{ fontSize: '13px', color: 'var(--ios-text-main)', margin: 0, fontWeight: '600', lineHeight: 1.4 }}>
                {comment}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIncomeInput(monthlyIncome.toString());
                setIsEditingIncome(true);
              }}
              className="ios-btn ios-btn-secondary"
              style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px', width: 'auto', alignSelf: 'flex-start' }}
            >
              再診断（月収を変更）
            </button>
          </div>
        )}
      </div>

      {/* 利用時間帯分析 */}
      <div className="ios-card">
        <span style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <Clock size={18} color="var(--ios-primary)" />
          利用時間帯の割合
        </span>

        {totalCount === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', padding: '20px 0', fontSize: '13px' }}>
            履歴がありません。
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 朝 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>朝 (5:00 - 11:00)</span>
                <span style={{ fontWeight: '700', color: 'var(--ios-text-secondary)' }}>{morning}回 ({getPercentage(morning)}%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--ios-gray-light)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercentage(morning)}%`, height: '100%', backgroundColor: '#FFD60A', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* 昼 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>昼 (11:00 - 17:00)</span>
                <span style={{ fontWeight: '700', color: 'var(--ios-text-secondary)' }}>{lunch}回 ({getPercentage(lunch)}%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--ios-gray-light)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercentage(lunch)}%`, height: '100%', backgroundColor: 'var(--ios-primary)', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* 夜 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>夜 (17:00 - 22:00)</span>
                <span style={{ fontWeight: '700', color: 'var(--ios-text-secondary)' }}>{evening}回 ({getPercentage(evening)}%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--ios-gray-light)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercentage(evening)}%`, height: '100%', backgroundColor: 'var(--ios-orange)', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* 深夜 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--ios-red)' }}>深夜 (22:00 - 5:00) ⚠️</span>
                <span style={{ fontWeight: '700', color: 'var(--ios-red)' }}>{night}回 ({getPercentage(night)}%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--ios-gray-light)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercentage(night)}%`, height: '100%', backgroundColor: 'var(--ios-red)', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 衝動買いの主因 */}
      {totalCount > 0 && sortedReasons.length > 0 && (
        <div className="ios-card">
          <span style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <TrendingUp size={18} color="var(--ios-red)" />
            衝動買いの引き金 (上位)
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedReasons.map(([reason, count], idx) => (
              <div key={reason} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: idx === 0 ? 'var(--ios-red-light)' : 'var(--ios-gray-light)',
                    color: idx === 0 ? 'var(--ios-red)' : 'var(--ios-text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{reason}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ios-text-secondary)', fontFamily: 'Outfit' }}>
                  {count} 回発生
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 改善アドバイスカード */}
      {totalCount > 0 && dependencyAdvises.length > 0 && (
        <div className="ios-card" style={{ backgroundColor: 'var(--ios-primary-light)', borderColor: 'rgba(52, 199, 89, 0.15)' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ios-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Lightbulb size={18} />
            習慣改善アドバイス
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dependencyAdvises.map((advise, idx) => (
              <div 
                key={idx} 
                style={{ 
                  fontSize: '13px', 
                  color: '#1B9A5E', 
                  lineHeight: '1.5',
                  paddingLeft: '10px',
                  borderLeft: '2.5px solid var(--ios-primary)',
                  fontWeight: '500'
                }}
              >
                {advise}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
