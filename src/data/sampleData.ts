import type { Receipt } from '../types';

export const initialReceipts: Receipt[] = [
  {
    id: '1',
    amount: 1250,
    date: '2026-05-26T00:15', // 深夜利用、連続利用
    storeName: 'セブンイレブン 習志野店',
    isImpulse: true,
    impulseReasons: ['深夜利用', '高額支出'],
    items: ['とんこつラーメン', 'ポテトチップス', 'モンスターエナジー']
  },
  {
    id: '2',
    amount: 320,
    date: '2026-05-25T16:30', // 連続利用
    storeName: 'ファミリーマート 千葉大前店',
    isImpulse: true,
    impulseReasons: ['1日複数回', 'ついで買い'],
    items: ['ファミチキ', 'カフェラテ']
  },
  {
    id: '3',
    amount: 650,
    date: '2026-05-25T12:15', // 普通のランチ
    storeName: 'ファミリーマート 千葉大前店',
    isImpulse: false,
    impulseReasons: [],
    items: ['鮭おにぎり', 'サラダチキン', '緑茶']
  },
  {
    id: '4',
    amount: 480,
    date: '2026-05-24T23:45', // 深夜利用、連続利用
    storeName: 'ローソン 津田沼駅前店',
    isImpulse: true,
    impulseReasons: ['深夜利用', 'ついで買い'],
    items: ['からあげクン レッド', 'チョコモナカジャンボ']
  },
  {
    id: '5',
    amount: 580,
    date: '2026-05-23T19:00', // 連続利用
    storeName: 'セブンイレブン 習志野店',
    isImpulse: false,
    impulseReasons: [],
    items: ['幕の内弁当']
  },
  {
    id: '6',
    amount: 890,
    date: '2026-05-22T22:30', // 深夜利用、高額
    storeName: 'ローソン 津田沼駅前店',
    isImpulse: true,
    impulseReasons: ['深夜利用'],
    items: ['カップヌードル大盛', 'ストロングゼロ', 'ポテトフライ']
  },
  {
    id: '7',
    amount: 210,
    date: '2026-05-21T08:15', // 朝のコーヒー
    storeName: 'セブンイレブン 習志野店',
    isImpulse: false,
    impulseReasons: [],
    items: ['セブンカフェ ホットL']
  }
];
