import React from 'react';
import { Clock, AlertTriangle, Lightbulb, TrendingDown } from 'lucide-react';
import type { Receipt } from '../types';

interface AnalyticsViewProps {
  receipts: Receipt[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ receipts }) => {
  const totalCount = receipts.length;
  const impulseCount = receipts.filter(r => r.isImpulse).length;

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

  // 3. 大学生向け動的アドバイス生成
  const getAdvises = () => {
    const advises: string[] = [];

    if (totalCount === 0) {
      return ['レシートデータを追加すると、あなたの利用傾向に基づいた習慣改善アドバイスが表示されます！'];
    }

    // 傾向1: 夜間利用
    const nightRatio = getPercentage(night);
    if (nightRatio >= 35) {
      advises.push('🌙 22時以降の「深夜利用」が非常に高いです。深夜のカップ麺やアイスは1回で500円以上になりがち。夜食はドラッグストアやスーパーで買い置きすると支出が半額になります！');
    }

    // 傾向2: 1日複数回
    // 同一日に複数レシートがあるかチェック
    const dateCounts: { [key: string]: number } = {};
    receipts.forEach(r => {
      const dStr = r.date.split('T')[0];
      dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;
    });
    const multiUseDays = Object.values(dateCounts).filter(count => count >= 2).length;
    if (multiUseDays >= 2) {
      advises.push('⚡ 1日に複数回コンビニに行く習慣があるようです。朝のコーヒー、昼のお弁当、夕方のカフェ...と無意識に立ち寄るたびに数百円ずつ失われています。「水筒を持ち歩く」「コンビニは1日1回まで」のルールを作ってみましょう。');
    }

    // 傾向3: 高額支出
    const highAmountCount = receipts.filter(r => r.amount >= 1000).length;
    if (highAmountCount >= 2) {
      advises.push('💸 1回あたり1,000円を超える高額な買い物が複数あります。コンビニでのお弁当＋デザート＋飲み物のセット購入は高くつきます。学食の利用や、お弁当を持参する日を週1日でも作ると効果的です。');
    }

    // 傾向4: ついで買い
    const tsuydeCount = reasonCounts['ついで買い'] || 0;
    if (tsuydeCount >= 2) {
      advises.push('お菓子やドリンクなどの「ついで買い」が多いようです。レジ横のホットスナックや新作スイーツに誘惑されていませんか？「目的の商品以外は視界に入れない」強さを持ってみましょう。');
    }

    // 標準的なアドバイス（アドバイスが少ない場合）
    if (advises.length === 0) {
      advises.push('🎉 素晴らしい自制心です！コンビニの無駄な利用がよくコントロールされています。引き続きこの調子で、必要な時だけ賢く利用しましょう。');
    }

    return advises;
  };

  const advises = getAdvises();

  return (
    <div>
      <div className="view-title">
        <span>習慣分析</span>
      </div>

      {/* 衝動買い傾向サマリー */}
      <div className="ios-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={18} color="var(--ios-orange)" />
          あなたの浪費タイプ
        </span>
        
        {totalCount === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', padding: '10px 0', fontSize: '13px' }}>
            データ不足のため、十分な分析ができません。
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ios-text-main)', marginBottom: '8px' }}>
              {night >= morning + lunch 
                ? '「深夜の誘惑」タイプ 🌙' 
                : impulseCount >= totalCount / 2 
                ? '「ついフラフラ寄り道」タイプ 🛍️' 
                : '「堅実派セーバー」タイプ 🔰'}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ios-text-secondary)', lineHeight: '1.5' }}>
              コンビニ支出全体の{' '}
              <strong style={{ color: 'var(--ios-red)', fontFamily: 'Outfit' }}>
                {totalCount > 0 ? Math.round((impulseCount / totalCount) * 100) : 0}%
              </strong>{' '}
              が、衝動的な支出（無意識または不要な買い物）と分析されています。
            </p>
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
                <div style={{ width: `${getPercentage(evening)}%`, height: '100%', backgroundColor: 'var(--ios-accent)', borderRadius: '4px' }}></div>
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
            <TrendingDown size={18} color="var(--ios-red)" />
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

      {/* 習慣改善アドバイス */}
      <div className="ios-card" style={{ backgroundColor: 'var(--ios-primary-light)', borderColor: 'rgba(52, 199, 89, 0.1)' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ios-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Lightbulb size={18} />
          習慣改善アドバイス
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {advises.map((advise, idx) => (
            <div 
              key={idx} 
              style={{ 
                fontSize: '13px', 
                color: '#1B9A5E', 
                lineHeight: '1.5',
                paddingLeft: '10px',
                borderLeft: '2px solid var(--ios-primary)'
              }}
            >
              {advise}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
