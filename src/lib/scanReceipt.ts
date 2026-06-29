import { createWorker } from 'tesseract.js';

export const scanReceipt = async (
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<{
  store_name: string;
  amount: number | null;
  date: string;
  items: string[];
  raw_text: string;
  confidence: 'high' | 'medium' | 'low';
}> => {
  const worker = await createWorker('jpn+eng', 1, {
    workerPath: '/tesseract-worker.min.js',
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    }
  });

  const resizedImage = await resizeImage(imageFile, 1200);
  const { data } = await worker.recognize(resizedImage);
  await worker.terminate();

  const rawText = data.text;

  // 合計金額の抽出
  const amountPatterns = [
    /合計[^\d]*(\d[\d,]+)/,
    /お会計[^\d]*(\d[\d,]+)/,
    /小計[^\d]*(\d[\d,]+)/,
    /¥\s*(\d[\d,]+)/,
    /￥\s*(\d[\d,]+)/,
    /(\d[\d,]+)\s*円/,
  ];

  let amount: number | null = null;
  for (const pattern of amountPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      const val = parseInt(match[1].replace(/,/g, ''), 10);
      if (val >= 1 && val <= 99999) { amount = val; break; }
    }
  }

  // 店舗名の抽出
  const storePatterns = [
    { pattern: /セブン[‐\-]?イレブン|7[\-‐]?eleven/i, name: 'セブンイレブン' },
    { pattern: /ファミリーマート|family\s*mart/i, name: 'ファミリーマート' },
    { pattern: /ローソン|lawson/i, name: 'ローソン' },
    { pattern: /ミニストップ|ministop/i, name: 'ミニストップ' },
  ];

  let store_name = 'コンビニ';
  for (const { pattern, name } of storePatterns) {
    if (pattern.test(rawText)) { store_name = name; break; }
  }

  // 日付の抽出
  const datePatterns = [
    /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})/,
    /(\d{2})[年\/\-](\d{1,2})[月\/\-](\d{1,2})/,
  ];

  let date = new Date().toISOString().split('T')[0];
  for (const pattern of datePatterns) {
    const match = rawText.match(pattern);
    if (match) {
      const year = match[1].length === 2 ? `20${match[1]}` : match[1];
      date = `${year}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      break;
    }
  }

  // 商品名の抽出
  // レシートの商品行パターン：「商品名　金額」または「商品名　数量×単価　金額」の形式が多い
  const EXCLUDE_PATTERNS = [
    /\d{2,4}[-–−]\d{3,4}[-–−]\d{4}/,          // 電話番号
    /\(\d{2,4}\)\s*\d{3,4}[-–−]\d{4}/,         // 電話番号（括弧付き）
    /TEL|FAX/i,                                  // TEL/FAX表記
    /\d{1,2}:\d{2}/,                             // 時刻
    /^[A-Za-z0-9\s\(\)\-\%\.\/]+$/,             // 日本語を含まない英数字のみ
    /[A-Z]{6,}/,                                 // 6文字以上の英大文字羅列
    /https?:|www\./,                             // URL
    /丁目|番地|号室/,                            // 住所
    /\d+%/,                                      // パーセント付き数値
    /店|支店|本店/,                              // 店舗名系
    /領収|レシート|明細|合計|小計|税|おつり|お釣|お預|日付/, // レシートヘッダー系
    /ありがとう|またのご|いらっしゃいませ/,      // 挨拶文
    /^\d+$/,                                     // 数字のみ
    /^[ぁ-ん]{1,2}$/,                           // 1〜2文字のひらがなのみ
    /会員|ポイント|番号|No\.|NO\./i,            // 会員番号系
    /\d{4}[年\/]\d{1,2}[月\/]\d{1,2}/,         // 日付
  ];

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const extractedItems: string[] = [];

  for (const line of lines) {
    // 金額っぽい数字で終わる行を商品行と判定
    const isMoneyLine = /\d{2,4}$/.test(line.replace(/[,，]/g, ''));

    const isExcluded = EXCLUDE_PATTERNS.some(p => p.test(line));
    const isTooShort = line.replace(/[\s\d¥￥,，]/g, '').length < 2;

    if (isMoneyLine && !isExcluded && !isTooShort) {
      const itemName = line
        .replace(/[\s　]+\d[\d,，]*\s*$/, '')  // 末尾の金額を除去
        .replace(/^\d+\s*/, '')               // 先頭の番号を除去
        .trim();
      if (itemName.length >= 2 && itemName.length <= 20) {
        extractedItems.push(itemName);
      }
    }
  }

  const items = extractedItems.slice(0, 8);

  const confidence = amount !== null
    ? (data.confidence > 70 ? 'high' : 'medium')
    : 'low';

  return { store_name, amount, date, items, raw_text: rawText, confidence };
};

const resizeImage = (file: File, maxWidth: number): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
    };
    img.src = url;
  });
};
