import React, { useState, useRef } from 'react';
import { Camera, Edit3, CheckCircle, CreditCard, Link, Check, RefreshCw, Plus, X } from 'lucide-react';
import type { Receipt } from '../types';

// OLD: OCR.Space implementation (replaced by Tesseract.js)

interface ScanViewProps {
  onAddReceipt: (receipt: Omit<Receipt, 'id'>) => void;
  linkedPayments: string[];
  onLinkPayment: (provider: string) => void;
}

type ScanState = 'idle' | 'scanning' | 'confirm' | 'manual' | 'done';

const STORE_OPTIONS = ['セブンイレブン', 'ファミリーマート', 'ローソン', 'その他'] as const;

const providers = [
  { id: 'PayPay',      name: 'PayPay',  color: '#FF003F', bg: '#FFF0F3' },
  { id: 'Suica',       name: 'Suica',   color: '#00A960', bg: '#F0FFF4' },
  { id: 'RakutenPay',  name: '楽天ペイ', color: '#BF0000', bg: '#FFF0F0' },
  { id: 'dBarai',      name: 'd払い',   color: '#E60012', bg: '#FFF0F0' }
];

// 日付 input に iOS Safari のはみ出し対策スタイルを適用
const dateInputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  maxWidth: '100%',
  fontSize: '14px',
  appearance: 'none',
  WebkitAppearance: 'none',
  padding: '12px 16px',
  overflow: 'hidden',
};

// 商品タグ表示コンポーネント
const ItemTags: React.FC<{
  items: string[];
  onRemove: (idx: number) => void;
}> = ({ items, onRemove }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
    {items.map((item, idx) => (
      <span
        key={idx}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          backgroundColor: 'var(--ios-primary-light)', color: 'var(--ios-primary)',
          padding: '5px 10px', borderRadius: '20px',
          fontSize: '13px', fontWeight: '600',
        }}
      >
        {item}
        <button
          type="button"
          onClick={() => onRemove(idx)}
          style={{
            border: 'none', background: 'none', padding: '0 0 0 2px',
            cursor: 'pointer', color: 'var(--ios-primary)',
            display: 'flex', alignItems: 'center', lineHeight: 1,
          }}
          aria-label={`${item}を削除`}
        >
          <X size={12} strokeWidth={3} />
        </button>
      </span>
    ))}
  </div>
);

// 商品追加 UI（タグ一覧 + 追加ボタン & インライン入力）
const ItemsEditor: React.FC<{
  items: string[];
  onChange: (items: string[]) => void;
}> = ({ items, onChange }) => {
  const [inputVisible, setInputVisible] = useState(false);
  const [text, setText] = useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onChange([...items, trimmed]);
      setText('');
    }
    setInputVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
    if (e.key === 'Escape') { setInputVisible(false); setText(''); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <ItemTags items={items} onRemove={(idx) => onChange(items.filter((_, i) => i !== idx))} />

      {inputVisible ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="ios-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="商品名を入力"
            autoFocus
            style={{ flex: 1 }}
          />
          <button type="button" className="ios-btn" onClick={handleAdd}
            style={{ width: 'auto', padding: '0 16px', flexShrink: 0 }}>
            追加
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setInputVisible(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            border: '1.5px dashed var(--ios-primary)', borderRadius: '20px',
            padding: '5px 12px', fontSize: '13px', fontWeight: '600',
            color: 'var(--ios-primary)', backgroundColor: 'transparent',
            cursor: 'pointer', alignSelf: 'flex-start',
          }}
        >
          <Plus size={13} strokeWidth={3} />
          商品を追加
        </button>
      )}
    </div>
  );
};

// ------

const ScanView: React.FC<ScanViewProps> = ({ onAddReceipt, linkedPayments, onLinkPayment }) => {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [progress, setProgress] = useState(0);
  const [isFirstScan, setIsFirstScan] = useState(true);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);

  // OCR確認フォーム
  const [ocrStoreName, setOcrStoreName] = useState('コンビニ');
  const [ocrAmount, setOcrAmount] = useState<number | null>(null);
  const [ocrDate, setOcrDate] = useState('');
  const [ocrItems, setOcrItems] = useState<string[]>([]);

  // 手入力フォーム
  const [manualStore, setManualStore] = useState('セブンイレブン');
  const [manualCustomStore, setManualCustomStore] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualItems, setManualItems] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = () => new Date().toISOString().split('T')[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setScanState('scanning');
    setProgress(0);

    try {
      const { scanReceipt } = await import('../lib/scanReceipt');
      const result = await scanReceipt(file, (p) => setProgress(p));
      setIsFirstScan(false);

      setOcrStoreName(result.store_name);
      setOcrAmount(result.amount);
      setOcrDate(result.date);
      setOcrItems(result.items);

      if (result.confidence === 'low') {
        setManualStore(
          STORE_OPTIONS.includes(result.store_name as typeof STORE_OPTIONS[number])
            ? result.store_name : 'その他'
        );
        setManualCustomStore(
          STORE_OPTIONS.includes(result.store_name as typeof STORE_OPTIONS[number])
            ? '' : result.store_name
        );
        setManualDate(result.date);
        setManualAmount('');
        setManualItems(result.items);
        setScanState('manual');
      } else {
        setScanState('confirm');
      }
    } catch {
      setIsFirstScan(false);
      setManualStore('セブンイレブン');
      setManualCustomStore('');
      setManualDate(todayStr());
      setManualAmount('');
      setManualItems([]);
      setScanState('manual');
    }
  };

  const handleConfirmSave = () => {
    const storeName = ocrStoreName || 'コンビニ';
    const amount = ocrAmount ?? 0;
    const date = ocrDate || todayStr();
    onAddReceipt({
      storeName,
      amount,
      date: `${date}T12:00`,
      isImpulse: amount >= 1000,
      impulseReasons: amount >= 1000 ? ['高額支出'] : [],
      items: ocrItems,
    });
    setScanState('done');
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    const storeName = manualStore === 'その他' ? (manualCustomStore || 'コンビニ') : manualStore;
    const amount = parseInt(manualAmount, 10) || 0;
    const date = manualDate || todayStr();
    onAddReceipt({
      storeName,
      amount,
      date: `${date}T12:00`,
      isImpulse: amount >= 1000,
      impulseReasons: amount >= 1000 ? ['高額支出'] : [],
      items: manualItems,
    });
    setScanState('done');
  };

  const switchToManual = () => {
    setManualStore(
      STORE_OPTIONS.includes(ocrStoreName as typeof STORE_OPTIONS[number])
        ? ocrStoreName : 'その他'
    );
    setManualCustomStore(
      STORE_OPTIONS.includes(ocrStoreName as typeof STORE_OPTIONS[number])
        ? '' : ocrStoreName
    );
    setManualAmount(ocrAmount !== null ? String(ocrAmount) : '');
    setManualDate(ocrDate);
    setManualItems(ocrItems);
    setScanState('manual');
  };

  const resetToIdle = () => {
    setScanState('idle');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLinkPaymentClick = (providerId: string) => {
    if (linkedPayments.includes(providerId)) return;
    setLinkingProvider(providerId);
    setTimeout(() => {
      onLinkPayment(providerId);
      setLinkingProvider(null);
    }, 1500);
  };

  return (
    <div>
      <div className="view-title">
        <span>レシート・決済連携</span>
      </div>

      {/* ── idle ────────────────────────────────────────── */}
      {scanState === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* カメラ撮影エリア */}
          <div
            style={{
              height: '220px',
              border: '2.5px dashed var(--ios-gray-dark)',
              borderRadius: '24px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              padding: '20px', boxSizing: 'border-box', textAlign: 'center'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'var(--ios-primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ios-primary)', marginBottom: '12px'
            }}>
              <Camera size={28} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: '800', marginBottom: '6px' }}>
              レシートを撮影
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', lineHeight: '1.4' }}>
              カメラでレシートを撮影すると金額・店舗・日付・商品名を自動で読み取ります
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
            />
          </div>

          {/* 手入力ボタン */}
          <button
            type="button"
            className="ios-btn ios-btn-secondary"
            onClick={() => {
              setManualStore('セブンイレブン');
              setManualCustomStore('');
              setManualAmount('');
              setManualDate(todayStr());
              setManualItems([]);
              setScanState('manual');
            }}
            style={{ padding: '14px 20px', fontSize: '15px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Edit3 size={18} />
            手入力で登録
          </button>

          {/* 電子決済連携 */}
          <div className="ios-card" style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <CreditCard size={18} color="var(--ios-primary)" />
              電子決済自動記録 (将来機能)
            </span>
            <p style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
              普段お使いの電子決済サービスと連携することで、コンビニでの利用履歴を自動で取得・分析できるようになります。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {providers.map(provider => {
                const isLinked = linkedPayments.includes(provider.id);
                const isLinking = linkingProvider === provider.id;
                return (
                  <div
                    key={provider.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: provider.bg, padding: '12px 16px', borderRadius: '16px',
                      border: `1px solid ${provider.color}15`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontSize: '14px', fontWeight: '800', color: '#FFFFFF',
                        backgroundColor: provider.color, width: '32px', height: '32px',
                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {provider.name[0]}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ios-text-main)' }}>
                        {provider.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLinkPaymentClick(provider.id)}
                      disabled={isLinked || isLinking}
                      style={{
                        border: 'none', borderRadius: '10px', padding: '6px 12px',
                        fontSize: '11px', fontWeight: '700',
                        backgroundColor: isLinked ? 'var(--ios-primary)' : isLinking ? '#E5E5EA' : provider.color,
                        color: '#FFFFFF', cursor: isLinked || isLinking ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px', justifyContent: 'center'
                      }}
                    >
                      {isLinked ? (
                        <><Check size={12} strokeWidth={3} />連携済</>
                      ) : isLinking ? (
                        <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <><Link size={12} />連携</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            {linkedPayments.length > 0 && (
              <div style={{
                marginTop: '16px', padding: '10px',
                backgroundColor: 'var(--ios-primary-light)', borderRadius: '10px',
                fontSize: '10px', color: '#1B9A5E', textAlign: 'center', fontWeight: 600
              }}>
                電子決済の自動読み込みにより、サンプル履歴データが登録されました！
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── scanning ─────────────────────────────────────── */}
      {scanState === 'scanning' && (
        <div className="ios-card" style={{
          padding: '32px 24px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '20px', textAlign: 'center'
        }}>
          <RefreshCw size={44} color="var(--ios-primary)" style={{ animation: 'spin 2s linear infinite' }} />
          <div>
            <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--ios-primary)', marginBottom: '6px' }}>
              AIがレシートを解析中...
            </p>
            {isFirstScan && (
              <p style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', marginBottom: '12px' }}>
                言語データを読み込み中（初回のみ時間がかかります）
              </p>
            )}
          </div>
          <div style={{ width: '100%', backgroundColor: '#E5E5EA', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              backgroundColor: 'var(--ios-primary)', borderRadius: '8px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--ios-text-secondary)' }}>{progress}%</span>
        </div>
      )}

      {/* ── confirm ──────────────────────────────────────── */}
      {scanState === 'confirm' && (
        <div className="ios-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '0.5px solid var(--ios-border)', paddingBottom: '12px' }}>
            <CheckCircle size={20} color="var(--ios-primary)" />
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--ios-primary)' }}>
              読み取り結果の確認
            </span>
          </div>

          {/* 1. 店舗名 */}
          <div className="ios-input-group">
            <label className="ios-input-label">店舗名</label>
            <input
              type="text"
              className="ios-input"
              value={ocrStoreName}
              onChange={e => setOcrStoreName(e.target.value)}
            />
          </div>

          {/* 2. 金額 */}
          <div className="ios-input-group">
            <label className="ios-input-label">金額 (円)</label>
            <input
              type="number"
              className="ios-input"
              value={ocrAmount ?? ''}
              onChange={e => setOcrAmount(Number(e.target.value) || null)}
              min="1"
              placeholder="金額を入力"
            />
          </div>

          {/* 3. 日付 */}
          <div className="ios-input-group">
            <label className="ios-input-label">日付</label>
            <input
              type="date"
              className="ios-input"
              value={ocrDate}
              onChange={e => setOcrDate(e.target.value)}
              style={dateInputStyle}
            />
          </div>

          {/* 4. 商品名 */}
          <div className="ios-input-group" style={{ marginBottom: '24px' }}>
            <label className="ios-input-label">商品名（任意）</label>
            <p style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
              読み取り結果は参考です。必要に応じて修正してください。
            </p>
            <ItemsEditor items={ocrItems} onChange={setOcrItems} />
          </div>

          {/* 5. ボタン */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="ios-btn ios-btn-secondary"
              onClick={switchToManual}
              style={{ flex: 1 }}
            >
              修正する
            </button>
            <button
              type="button"
              className="ios-btn"
              onClick={handleConfirmSave}
              disabled={!ocrAmount || ocrAmount <= 0}
              style={{ flex: 2 }}
            >
              この内容で登録
            </button>
          </div>
        </div>
      )}

      {/* ── manual ───────────────────────────────────────── */}
      {scanState === 'manual' && (
        <form onSubmit={handleManualSave} className="ios-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '20px', borderBottom: '0.5px solid var(--ios-border)', paddingBottom: '12px' }}>
            手入力で登録
          </div>

          {/* 1. 店舗名（4択ボタン） */}
          <div className="ios-input-group">
            <label className="ios-input-label">店舗名</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              {STORE_OPTIONS.map(store => (
                <button
                  key={store}
                  type="button"
                  onClick={() => setManualStore(store)}
                  style={{
                    padding: '14px 8px', borderRadius: '12px',
                    border: '2px solid',
                    borderColor: manualStore === store ? 'var(--ios-primary)' : 'var(--ios-border)',
                    backgroundColor: manualStore === store ? 'var(--ios-primary-light)' : '#FFFFFF',
                    color: manualStore === store ? 'var(--ios-primary)' : 'var(--ios-text-main)',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  {store}
                </button>
              ))}
            </div>
            {manualStore === 'その他' && (
              <input
                type="text"
                className="ios-input"
                value={manualCustomStore}
                onChange={e => setManualCustomStore(e.target.value)}
                placeholder="店舗名を入力"
              />
            )}
          </div>

          {/* 2. 金額 */}
          <div className="ios-input-group">
            <label className="ios-input-label">金額 (円)</label>
            <input
              type="number"
              className="ios-input"
              value={manualAmount}
              onChange={e => setManualAmount(e.target.value)}
              required
              min="1"
              placeholder="例: 650"
            />
          </div>

          {/* 3. 日付 */}
          <div className="ios-input-group">
            <label className="ios-input-label">日付</label>
            <input
              type="date"
              className="ios-input"
              value={manualDate}
              onChange={e => setManualDate(e.target.value)}
              required
              style={dateInputStyle}
            />
          </div>

          {/* 4. 商品名 */}
          <div className="ios-input-group" style={{ marginBottom: '24px' }}>
            <label className="ios-input-label">商品名（任意）</label>
            <ItemsEditor items={manualItems} onChange={setManualItems} />
          </div>

          {/* 5. ボタン */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="ios-btn ios-btn-secondary"
              onClick={resetToIdle}
              style={{ flex: 1 }}
            >
              キャンセル
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

      {/* ── done ─────────────────────────────────────────── */}
      {scanState === 'done' && (
        <div className="ios-card" style={{
          padding: '40px 24px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '16px', textAlign: 'center'
        }}>
          <CheckCircle size={56} color="var(--ios-primary)" />
          <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ios-text-main)' }}>
            登録完了！
          </p>
          <p style={{ fontSize: '13px', color: 'var(--ios-text-secondary)' }}>
            レシートを記録しました
          </p>
          <button
            type="button"
            className="ios-btn"
            onClick={resetToIdle}
            style={{ marginTop: '8px', width: '100%' }}
          >
            続けて登録する
          </button>
        </div>
      )}
    </div>
  );
};

export default ScanView;
