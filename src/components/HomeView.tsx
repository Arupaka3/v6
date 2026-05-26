import React from 'react';
import { Plus, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import type { Receipt, ActiveTab } from '../types';

interface HomeViewProps {
  receipts: Receipt[];
  onNavigate: (tab: ActiveTab) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ receipts, onNavigate }) => {
  // 今月の支出合計・利用回数を計算 (ここでは全データの合計を簡易的に当月分とする)
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalCount = receipts.length;

  // 衝動買いスコアの計算
  // 衝動買いフラグが立っている割合 ＋ 深夜利用や1日複数回のペナルティを加味
  const impulseCount = receipts.filter(r => r.isImpulse).length;
  
  // 深夜利用(22:00 - 05:00)のカウント
  const lateNightCount = receipts.filter(r => {
    const hour = new Date(r.date).getHours();
    return hour >= 22 || hour < 5;
  }).length;

  // スコア計算ロジック
  let impulseScore = 0;
  if (totalCount > 0) {
    const ratioScore = (impulseCount / totalCount) * 80; // 割合で最大80点
    const penaltyScore = Math.min(lateNightCount * 10, 20); // 深夜利用ペナルティで最大20点
    impulseScore = Math.min(Math.round(ratioScore + penaltyScore), 100);
  }

  // スコアのレベルに応じた色とテキストの判定
  let scoreColor = 'var(--ios-primary)';
  let scoreBg = 'var(--ios-primary-light)';
  let scoreText = '健全な支出です';
  if (impulseScore >= 70) {
    scoreColor = 'var(--ios-red)';
    scoreBg = 'var(--ios-red-light)';
    scoreText = '衝動買い危険度・高';
  } else if (impulseScore >= 40) {
    scoreColor = 'var(--ios-orange)';
    scoreBg = 'var(--ios-orange-light)';
    scoreText = 'やや無意識の利用あり';
  }

  // 最新3件の履歴
  const recentReceipts = receipts.slice(0, 3);

  // コンビニごとのテーマカラー取得用
  const getStoreTheme = (name: string) => {
    if (name.includes('セブン')) return { bg: '#E6F3ED', color: '#1B9A5E', name: 'セブン' };
    if (name.includes('ファミリー') || name.includes('ファミマ')) return { bg: '#EAF6FF', color: '#00A0E9', name: 'ファミマ' };
    if (name.includes('ローソン')) return { bg: '#FFF9E6', color: '#005BAC', name: 'ローソン' };
    return { bg: '#F2F2F7', color: '#8E8E93', name: 'その他' };
  };

  // グラフ用データ作成 (過去7日間の支出推移)
  const getGraphData = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const dailyAmounts = days.map(day => {
      return receipts
        .filter(r => r.date.startsWith(day))
        .reduce((sum, r) => sum + r.amount, 0);
    });

    const maxAmount = Math.max(...dailyAmounts, 1000); // 最小高さ保障

    return { days, dailyAmounts, maxAmount };
  };

  const { days, dailyAmounts, maxAmount } = getGraphData();

  // SVG折れ線グラフの座標計算
  const width = 360;
  const height = 110;
  const padding = 15;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = dailyAmounts.map((amt, idx) => {
    const x = padding + (idx / 6) * chartWidth;
    const y = padding + chartHeight - (amt / maxAmount) * chartHeight;
    return { x, y, amount: amt };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  // グラデーション塗りつぶし用のパス
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : '';

  return (
    <div>
      <div className="view-title">
        <span>ホーム</span>
        <button 
          onClick={() => onNavigate('scan')}
          style={{
            border: 'none',
            background: 'var(--ios-primary-light)',
            color: 'var(--ios-primary)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* サマリーカード */}
      <div className="ios-card" style={{ background: 'linear-gradient(135deg, #1B9A5E 0%, #34C759 100%)', color: '#FFFFFF', padding: '24px' }}>
        <div style={{ fontSize: '13px', opacity: 0.85, fontWeight: 500, marginBottom: '4px' }}>今月のコンビニ支出</div>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '16px' }}>
          <span style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'Outfit' }}>¥{totalAmount.toLocaleString()}</span>
          <span style={{ fontSize: '14px', marginLeft: '4px', opacity: 0.85 }}>/ 予算 ¥10,000</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>利用回数</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Outfit' }}>{totalCount} <span style={{ fontSize: '12px', fontWeight: 500 }}>回</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>1回平均</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Outfit' }}>
              ¥{totalCount > 0 ? Math.round(totalAmount / totalCount).toLocaleString() : 0}
            </div>
          </div>
        </div>
      </div>

      {/* 衝動買いスコアカード */}
      <div className="ios-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          border: `6px solid ${scoreBg}`,
          borderTopColor: scoreColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(-45deg)'
        }}>
          <span style={{
            fontSize: '18px',
            fontWeight: 800,
            color: scoreColor,
            fontFamily: 'Outfit',
            transform: 'rotate(45deg)'
          }}>
            {impulseScore}%
          </span>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700 }}>衝動買いスコア</span>
            <span className="ios-badge" style={{ backgroundColor: scoreBg, color: scoreColor }}>
              {scoreText}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', lineHeight: '1.4' }}>
            {impulseScore >= 70 
              ? '深夜の利用や1日に複数回利用が目立ちます。無意識のコンビニ寄りを減らす工夫をしましょう。'
              : impulseScore >= 40
              ? 'ある程度セーブできていますが、ついで買いや夜間の利用に注意が必要です。'
              : '素晴らしいペースです！コンビニ浪費をしっかりコントロールできています。'}
          </p>
        </div>
      </div>

      {/* グラフカード */}
      <div className="ios-card" style={{ padding: '16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="var(--ios-primary)" />
            直近7日間の支出推移
          </span>
          <span style={{ fontSize: '11px', color: 'var(--ios-text-secondary)' }}>
            最大: ¥{maxAmount.toLocaleString()}
          </span>
        </div>
        
        <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
          {dailyAmounts.reduce((s, a) => s + a, 0) === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', height: '100%', fontSize: '13px', color: 'var(--ios-text-secondary)' }}>
              データがありません。レシートを追加してください。
            </div>
          ) : (
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--ios-primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--ios-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* 横のグリッドライン */}
              <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="rgba(0,0,0,0.05)" strokeDasharray="3,3" />
              <line x1={padding} y1={padding + chartHeight/2} x2={width-padding} y2={padding + chartHeight/2} stroke="rgba(0,0,0,0.05)" strokeDasharray="3,3" />
              <line x1={padding} y1={padding + chartHeight} x2={width-padding} y2={padding + chartHeight} stroke="rgba(0,0,0,0.08)" />

              {/* グラフの塗りつぶし領域 */}
              {areaD && <path d={areaD} fill="url(#chart-grad)" />}

              {/* グラフの線 */}
              {pathD && <path d={pathD} fill="none" stroke="var(--ios-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

              {/* プロット点とラベル */}
              {points.map((p, idx) => {
                const date = new Date(days[idx]);
                const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
                
                return (
                  <g key={idx}>
                    {p.amount > 0 && (
                      <>
                        <circle cx={p.x} cy={p.y} r="4.5" fill="#FFFFFF" stroke="var(--ios-primary)" strokeWidth="2.5" />
                        {/* 金額ポップアップ（高い点のみ、またはホバー風に表示） */}
                        {p.amount > 300 && (
                          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9px" fontWeight="700" fill="var(--ios-primary)" fontFamily="Outfit">
                            ¥{p.amount}
                          </text>
                        )}
                      </>
                    )}
                    {/* 日付ラベル */}
                    <text x={p.x} y={height - 2} textAnchor="middle" fontSize="9px" fontWeight="600" fill="var(--ios-text-secondary)">
                      {dayLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* 直近の利用履歴 */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700 }}>直近の利用履歴</span>
          <button 
            onClick={() => onNavigate('history')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ios-primary)',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            すべて見る
            <ChevronRight size={14} />
          </button>
        </div>

        {recentReceipts.length === 0 ? (
          <div className="ios-card" style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', padding: '30px 20px', fontSize: '14px' }}>
            履歴がまだありません。<br/>下のカメラボタンからレシートを追加しましょう！
          </div>
        ) : (
          recentReceipts.map(receipt => {
            const theme = getStoreTheme(receipt.storeName);
            const dateObj = new Date(receipt.date);
            const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
            
            return (
              <div 
                key={receipt.id} 
                className="ios-card interactive" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  cursor: 'pointer'
                }}
                onClick={() => onNavigate('history')}
              >
                {/* コンビニミニロゴマーク */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: theme.bg,
                  color: theme.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '14px'
                }}>
                  {theme.name[0]}
                </div>

                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{receipt.storeName}</span>
                    {receipt.isImpulse && (
                      <span className="ios-badge ios-badge-danger" style={{ padding: '2px 4px', fontSize: '9px' }}>
                        衝動買い
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    <Calendar size={10} />
                    {dateStr}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'Outfit', color: receipt.isImpulse ? 'var(--ios-red)' : 'var(--ios-text-main)' }}>
                    ¥{receipt.amount.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--ios-text-secondary)', display: 'block' }}>
                    {receipt.items && receipt.items.length > 0 ? `${receipt.items[0]}等` : '商品未登録'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* クイックアクション */}
      <button 
        className="ios-btn"
        onClick={() => onNavigate('scan')}
        style={{ marginTop: '8px', marginBottom: '16px' }}
      >
        <Plus size={20} />
        レシートを読み取る
      </button>
    </div>
  );
};

export default HomeView;
