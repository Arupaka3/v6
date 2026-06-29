export interface Receipt {
  id: string;
  amount: number;
  date: string; // ISO 8601形式 (YYYY-MM-DDTHH:mm)
  storeName: string;
  isImpulse: boolean; // 自己申告または自動判定による衝動買いフラグ
  impulseReasons: string[]; // 衝動買い判定の理由 (例: ["深夜利用", "1日2回以上", "連続利用"])
  items?: string[]; // 購入品目 (例: ["エナジードリンク", "ポテトチップス"])
}

export type ActiveTab = 'home' | 'scan' | 'analytics' | 'goals' | 'badges';

export interface SavingsGoal {
  id: string;
  name: string;
  price: number;
  createdAt: string;
  currentSavings: number;
}

export interface SpendingGoal {
  monthlyAmountLimit: number;
  monthlyCountLimit: number;
}

export interface Streak {
  currentStreak: number;
  bestStreak: number;
  lastConviniDate: string | null;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_key: string;
  unlocked_at: string;
}

export const ITEM_CATEGORIES = [
  'ホットスナック',
  '冷凍食品',
  '飲み物',
  'おにぎり・パン',
  'スイーツ',
  'カップ麺',
  '惣菜・サラダ',
  'その他',
] as const;
export type ItemCategory = typeof ITEM_CATEGORIES[number];

export interface MyItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  use_count: number;
  created_at: string;
}

export interface FavoriteStore {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

