import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StoreNameInputProps {
  value: string;
  onChange: (value: string) => void;
  userId: string | null;
}

const PRESET_STORES = [
  'セブンイレブン',
  'ファミリーマート',
  'ローソン',
  'ミニストップ',
  'デイリーヤマザキ',
];

// CORS対応済みのエンドポイントを優先してフォールバック
const OVERPASS_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const fetchWithFallback = async (query: string) => {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return await res.json();
    } catch {
      continue;
    }
  }
  throw new Error('全エンドポイントで失敗');
};

interface NearbyStore {
  name: string;
  distance: number;
}

const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// 近くのコンビニをOverpass APIで取得（具体的な店舗名＋距離付き）
const getNearbyConbini = async (): Promise<NearbyStore[]> => {
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 5000,
      maximumAge: 60000,
    })
  );

  const { latitude: lat, longitude: lon } = position.coords;
  const radius = 300;

  const query = `
    [out:json][timeout:10];
    (
      node["shop"="convenience"](around:${radius},${lat},${lon});
      node["amenity"="convenience"](around:${radius},${lat},${lon});
    );
    out body;
  `;

  const data = await fetchWithFallback(query);

  const seen = new Set<string>();
  const stores: NearbyStore[] = [];

  for (const el of data.elements as any[]) {
    const rawName: string | undefined = el.tags?.['name:ja'] || el.tags?.name;
    if (!rawName) continue;
    if (!/セブン|ファミリー|ローソン|ミニストップ|デイリー|コンビニ/i.test(rawName)) continue;
    const name = rawName.length > 22 ? rawName.slice(0, 22) + '…' : rawName;
    if (seen.has(name)) continue;
    seen.add(name);
    stores.push({ name, distance: calcDistance(lat, lon, el.lat, el.lon) });
  }

  return stores.sort((a, b) => a.distance - b.distance);
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: '7px 14px 4px',
  fontSize: '11px', fontWeight: '700',
  color: 'var(--ios-text-secondary)',
  backgroundColor: '#F9F9FB',
  borderBottom: '0.5px solid var(--ios-border)',
};

const itemButtonBase = (pressed: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  width: '100%', textAlign: 'left',
  padding: '14px 20px', minHeight: '48px',
  border: 'none', borderBottom: '1px solid #f0f0f0',
  backgroundColor: pressed ? 'var(--ios-primary-light)' : 'transparent',
  cursor: 'pointer', userSelect: 'none',
  WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
  transition: 'background-color 0.1s ease',
});

// 距離付き近くの店舗セクション
const NearbyDropdownSection: React.FC<{
  stores: NearbyStore[];
  onSelect: (s: string) => void;
}> = ({ stores, onSelect }) => {
  const [pressed, setPressed] = useState<string | null>(null);
  return (
    <div>
      <div style={sectionHeaderStyle}>📍 近くのコンビニ（300m以内）</div>
      {stores.map(store => (
        <button
          key={store.name}
          type="button"
          onPointerDown={e => { e.preventDefault(); setPressed(store.name); onSelect(store.name); }}
          onPointerUp={() => setPressed(null)}
          onPointerLeave={() => setPressed(null)}
          style={itemButtonBase(pressed === store.name)}
        >
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ios-text-main)' }}>
            {store.name}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--ios-text-secondary)', fontWeight: '500', flexShrink: 0, marginLeft: '8px' }}>
            約{store.distance}m
          </span>
        </button>
      ))}
    </div>
  );
};

// 通常の候補セクション（最近・定番）
const DropdownSection: React.FC<{
  label: string;
  stores: string[];
  onSelect: (s: string) => void;
}> = ({ label, stores, onSelect }) => {
  const [pressed, setPressed] = useState<string | null>(null);
  return (
    <div>
      <div style={sectionHeaderStyle}>{label}</div>
      {stores.map(store => (
        <button
          key={store}
          type="button"
          onPointerDown={e => { e.preventDefault(); setPressed(store); onSelect(store); }}
          onPointerUp={() => setPressed(null)}
          onPointerLeave={() => setPressed(null)}
          style={itemButtonBase(pressed === store)}
        >
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ios-text-main)' }}>
            {store}
          </span>
        </button>
      ))}
    </div>
  );
};

const StoreNameInput: React.FC<StoreNameInputProps> = ({ value, onChange, userId }) => {
  const [open, setOpen] = useState(false);
  const [recentStores, setRecentStores] = useState<string[]>([]);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showOsmCredit, setShowOsmCredit] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  // 位置情報キャッシュ（1分間有効）
  const geoCacheRef = useRef<{ stores: NearbyStore[]; ts: number } | null>(null);

  // ドロップダウンを開くたびに最近の履歴を取得
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('usage_history')
          .select('store_name')
          .eq('user_id', userId)
          .not('store_name', 'is', null)
          .order('used_at', { ascending: false })
          .limit(100);

        if (cancelled || !data) return;
        const recent = [...new Set(
          data.map((r: any) => r.store_name as string).filter(Boolean)
        )].slice(0, 5);
        setRecentStores(recent);
      } catch {
        // 取得失敗時は候補なしのまま表示
      }
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

  // ラッパー外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setGeoError(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleGeoSearch = async () => {
    // キャッシュが有効なら再利用
    if (geoCacheRef.current && Date.now() - geoCacheRef.current.ts < 60_000) {
      setNearbyStores(geoCacheRef.current.stores);
      setShowOsmCredit(true);
      setOpen(true);
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    try {
      const stores = await getNearbyConbini();
      geoCacheRef.current = { stores, ts: Date.now() };
      setNearbyStores(stores);
      setShowOsmCredit(true);
    } catch (e: any) {
      const msg =
        e?.code === 1 ? '位置情報の許可が必要です' :
        e?.code === 3 ? '位置情報の取得に失敗しました' :
        '店舗情報の取得に失敗しました';
      setGeoError(msg);
    } finally {
      setGeoLoading(false);
      setOpen(true);
    }
  };

  const handleSelect = (store: string) => {
    onChange(store);
    setOpen(false);
    setGeoError(null);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* ラベル行 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '6px',
      }}>
        <label className="ios-input-label" style={{ margin: 0 }}>店舗名</label>
        <button
          type="button"
          onClick={handleGeoSearch}
          disabled={geoLoading}
          style={{
            border: 'none', background: 'none', padding: '2px 0',
            cursor: geoLoading ? 'default' : 'pointer',
            fontSize: '12px', color: 'var(--ios-primary)', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '3px',
            opacity: geoLoading ? 0.6 : 1,
          }}
        >
          <MapPin size={12} strokeWidth={2.5} />
          {geoLoading ? '取得中...' : '現在地から探す'}
        </button>
      </div>

      {/* テキスト入力 */}
      <input
        type="text"
        className="ios-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="例: セブンイレブン"
        style={{ width: '100%', boxSizing: 'border-box' }}
      />

      {/* エラー表示 */}
      {geoError && (
        <p style={{
          margin: '6px 0 0', padding: '8px 12px',
          backgroundColor: '#FFF0F0',
          border: '1px solid rgba(255,59,48,0.2)',
          borderRadius: '10px',
          fontSize: '12px', color: 'var(--ios-red)', fontWeight: '600',
        }}>
          {geoError}
        </p>
      )}

      {/* ドロップダウン */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--ios-border)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          zIndex: 1000,
          maxHeight: '260px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {nearbyStores.length > 0 && (
            <NearbyDropdownSection
              stores={nearbyStores}
              onSelect={handleSelect}
            />
          )}
          {recentStores.length > 0 && (
            <DropdownSection
              label="🕐 最近使った店舗"
              stores={recentStores}
              onSelect={handleSelect}
            />
          )}
          <DropdownSection
            label="📋 定番"
            stores={PRESET_STORES}
            onSelect={handleSelect}
          />
          {showOsmCredit && (
            <div style={{
              padding: '5px 12px',
              fontSize: '10px', color: 'var(--ios-text-secondary)',
              borderTop: '0.5px solid var(--ios-border)',
              textAlign: 'right',
            }}>
              地図データ © OpenStreetMap contributors
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreNameInput;
