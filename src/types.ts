export interface Receipt {
  id: string;
  amount: number;
  date: string; // ISO 8601形式 (YYYY-MM-DDTHH:mm)
  storeName: string;
  isImpulse: boolean; // 自己申告または自動判定による衝動買いフラグ
  impulseReasons: string[]; // 衝動買い判定の理由 (例: ["深夜利用", "1日2回以上", "連続利用"])
  items?: string[]; // 購入品目 (例: ["エナジードリンク", "ポテトチップス"])
}

export type ActiveTab = 'home' | 'scan' | 'history' | 'analytics';
