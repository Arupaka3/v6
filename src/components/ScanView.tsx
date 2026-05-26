import React, { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle } from 'lucide-react';
import type { Receipt } from '../types';

interface ScanViewProps {
  onAddReceipt: (receipt: Omit<Receipt, 'id'>) => void;
}

// スキャン擬似データ（OCRシミュレーション用）
const PRESET_RECEIPTS = [
  {
    storeName: 'セブンイレブン 習志野店',
    amount: 1140,
    items: ['カップヌードル 謎肉特盛', 'ポテトチップスうすしお', 'ストロングゼロ 500ml'],
    isImpulse: true,
    impulseReasons: ['深夜利用', '高額支出']
  },
  {
    storeName: 'ファミリーマート 千葉大前店',
    amount: 450,
    items: ['ファミチキ', 'レッドブル 250ml'],
    isImpulse: true,
    impulseReasons: ['1日複数回', 'ついで買い']
  },
  {
    storeName: 'ローソン 津田沼駅前店',
    amount: 680,
    items: ['タルタルチキン南蛮弁当', 'お茶 500ml'],
    isImpulse: false,
    impulseReasons: []
  }
];

const ScanView: React.FC<ScanViewProps> = ({ onAddReceipt }) => {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'parsed'>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // フォームステート
  const [storeName, setStoreName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState('');
  const [isImpulse, setIsImpulse] = useState(false);
  const [impulseReasons, setImpulseReasons] = useState<string[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          startScanning();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // スキャンシミュレーション起動
  const startScanning = () => {
    setScanState('scanning');
    
    // 2.5秒後にスキャン完了し、OCR結果をセットする
    setTimeout(() => {
      // プリセットからランダムで結果を抽出
      const randomIndex = Math.floor(Math.random() * PRESET_RECEIPTS.length);
      const preset = PRESET_RECEIPTS[randomIndex];
      
      const now = new Date();
      // 深夜利用プリセットの場合は昨夜の時刻に設定
      if (preset.isImpulse && preset.impulseReasons.includes('深夜利用')) {
        now.setHours(23);
        now.setMinutes(45);
        now.setDate(now.getDate() - 1); // 1日前
      }
      
      // ISOローカル日時に変換 (YYYY-MM-DDTHH:mm)
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);

      setStoreName(preset.storeName);
      setAmount(preset.amount);
      setDate(localISOTime);
      setIsImpulse(preset.isImpulse);
      setImpulseReasons(preset.impulseReasons);
      setItems(preset.items);
      
      setScanState('parsed');
    }, 2500);
  };

  // サンプルレシートによるクイックスキャン
  const handleQuickScan = () => {
    // 適当なダミーレシート画像（SVGデータURI）をセット
    const dummyImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" style="background:%23FFF"><rect x="10" y="10" width="280" height="380" fill="none" stroke="%23CCC" stroke-width="2" stroke-dasharray="5,5"/><text x="150" y="50" font-size="20" font-weight="bold" font-family="sans-serif" text-anchor="middle" fill="%23666">RECEIPT</text><line x1="30" y1="80" x2="270" y2="80" stroke="%23EEE" stroke-width="2"/><text x="150" y="200" font-size="14" font-family="sans-serif" text-anchor="middle" fill="%23AAA">Convenience Store Receipt</text></svg>`;
    setUploadedImage(dummyImage);
    startScanning();
  };

  // 保存処理
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || amount <= 0 || !date) return;

    // フォーム入力値から衝動買いの追加理由を動的に判定
    const reasons = [...impulseReasons];
    const hour = new Date(date).getHours();
    
    // 深夜帯のチェック
    if ((hour >= 22 || hour < 5) && !reasons.includes('深夜利用')) {
      reasons.push('深夜利用');
    }
    
    // 高額支出のチェック (1000円以上)
    if (amount >= 1000 && !reasons.includes('高額支出')) {
      reasons.push('高額支出');
    }

    onAddReceipt({
      storeName,
      amount,
      date,
      isImpulse: isImpulse || reasons.length > 0,
      impulseReasons: isImpulse ? (reasons.length > 0 ? reasons : ['ついで買い']) : [],
      items
    });
  };

  // 商品アイテムの追加
  const handleAddItem = () => {
    if (newItemText.trim()) {
      setItems([...items, newItemText.trim()]);
      setNewItemText('');
    }
  };

  // 商品アイテムの削除
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="view-title">
        <span>レシート撮影</span>
      </div>

      {scanState === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* カメラファインダー風エリア */}
          <div 
            style={{
              height: '320px',
              border: '2px dashed var(--ios-gray-dark)',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              padding: '24px',
              boxSizing: 'border-box',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--ios-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ios-primary)',
              marginBottom: '16px'
            }}>
              <Camera size={32} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>レシート画像をアップロード</span>
            <span style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', lineHeight: '1.4' }}>
              カメラで撮影するか、ライブラリから画像を選択して自動で金額と日時を読み取ります。
            </span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', fontSize: '13px', margin: '8px 0' }}>
            または
          </div>

          {/* クイックシミュレーションボタン */}
          <button 
            type="button" 
            className="ios-btn ios-btn-secondary"
            onClick={handleQuickScan}
          >
            <Upload size={18} />
            サンプルデータで自動スキャンを試す
          </button>
        </div>
      )}

      {scanState === 'scanning' && (
        <div className="ios-card" style={{ 
          height: '320px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {uploadedImage && (
            <img 
              src={uploadedImage} 
              alt="Scan Target" 
              style={{ 
                position: 'absolute', 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                opacity: 0.15 
              }} 
            />
          )}
          
          {/* レーザースキャン線 */}
          <div className="scan-laser-line"></div>
          
          <RefreshCw className="animate-pulse-slow" size={48} color="var(--ios-primary)" style={{ animation: 'spin 2s linear infinite', marginBottom: '16px', zIndex: 11 }} />
          <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--ios-primary)', zIndex: 11 }}>AIがレシートを解析中...</span>
          <span style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', marginTop: '8px', zIndex: 11 }}>
            金額、日時、店舗名を取得しています。
          </span>
        </div>
      )}

      {scanState === 'parsed' && (
        <form onSubmit={handleSave} className="ios-card" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ios-primary)', fontWeight: '700', fontSize: '15px', marginBottom: '20px', borderBottom: '0.5px solid var(--ios-border)', paddingBottom: '12px' }}>
            <CheckCircle size={20} />
            <span>OCR 読み取り結果 (編集可能)</span>
          </div>

          {/* 店舗名 */}
          <div className="ios-input-group">
            <label className="ios-input-label">店舗名</label>
            <input 
              type="text" 
              className="ios-input" 
              value={storeName} 
              onChange={e => setStoreName(e.target.value)}
              required
              placeholder="例: セブンイレブン 習志野店"
            />
          </div>

          {/* 金額 */}
          <div className="ios-input-group">
            <label className="ios-input-label">金額 (円)</label>
            <input 
              type="number" 
              className="ios-input" 
              value={amount || ''} 
              onChange={e => setAmount(Number(e.target.value))}
              required
              min="1"
              placeholder="金額を入力"
            />
          </div>

          {/* 日時 */}
          <div className="ios-input-group">
            <label className="ios-input-label">日時</label>
            <input 
              type="datetime-local" 
              className="ios-input" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* 購入アイテムのリスト */}
          <div className="ios-input-group">
            <label className="ios-input-label">購入商品 (任意)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input 
                type="text" 
                className="ios-input" 
                value={newItemText} 
                onChange={e => setNewItemText(e.target.value)}
                placeholder="例: モンスターエナジー"
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                className="ios-btn" 
                onClick={handleAddItem}
                style={{ width: 'auto', padding: '0 16px' }}
              >
                追加
              </button>
            </div>
            
            {items.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {items.map((item, idx) => (
                  <span 
                    key={idx} 
                    className="ios-badge ios-badge-neutral"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '10px' }}
                  >
                    {item}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(idx)}
                      style={{ border: 'none', background: 'none', color: 'var(--ios-gray-dark)', padding: 0, cursor: 'pointer', fontSize: '11px', display: 'flex' }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 衝動買いセルフチェック */}
          <div className="ios-card" style={{ backgroundColor: isImpulse ? 'var(--ios-red-light)' : '#FAFAFC', border: isImpulse ? '1px solid rgba(255, 59, 48, 0.15)' : '1px solid var(--ios-border)', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
            <input 
              type="checkbox" 
              id="impulse-check" 
              checked={isImpulse} 
              onChange={e => {
                setIsImpulse(e.target.checked);
                if (!e.target.checked) setImpulseReasons([]);
                else if (impulseReasons.length === 0) setImpulseReasons(['ついで買い']);
              }}
              style={{
                width: '20px',
                height: '20px',
                accentColor: 'var(--ios-red)',
                cursor: 'pointer',
                marginTop: '2px'
              }}
            />
            <div style={{ flex: 1 }}>
              <label htmlFor="impulse-check" style={{ fontSize: '14px', fontWeight: '700', color: isImpulse ? 'var(--ios-red)' : 'var(--ios-text-main)', cursor: 'pointer' }}>
                これは「衝動買い」ですか？
              </label>
              <p style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                お腹が空いていないのに寄って買った、深夜につい寄ってしまった、予定外のものを買った等の場合はチェックを入れて習慣を自覚しましょう。
              </p>
              
              {isImpulse && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {['深夜利用', '1日複数回', 'ついで買い', 'ストレス解消', 'ご褒美'].map(reason => {
                    const active = impulseReasons.includes(reason);
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setImpulseReasons(impulseReasons.filter(r => r !== reason));
                          } else {
                            setImpulseReasons([...impulseReasons, reason]);
                          }
                        }}
                        className={`ios-badge ${active ? 'ios-badge-danger' : 'ios-badge-neutral'}`}
                        style={{ border: 'none', cursor: 'pointer', padding: '5px 10px' }}
                      >
                        {reason}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 送信ボタン */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="ios-btn ios-btn-secondary"
              onClick={() => {
                setScanState('idle');
                setUploadedImage(null);
              }}
              style={{ flex: 1 }}
            >
              再スキャン
            </button>
            <button 
              type="submit" 
              className="ios-btn"
              style={{ flex: 2 }}
            >
              保存する
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ScanView;
