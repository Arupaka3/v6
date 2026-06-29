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

  const items: string[] = [];

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
