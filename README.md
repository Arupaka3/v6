# ConviTrack (Cobaco) - コンビニ浪費改善アプリ

コンビニでのついつい無駄遣いしてしまう習慣を可視化し、賢く貯金・自己投資に回すための iOS風モバイルファーストWebアプリケーションです。

🚀 **本番環境デプロイ先 URL:**  
[https://v4-sable-zeta.vercel.app/](https://v4-sable-zeta.vercel.app/)

---

## 📱 アプリの主な機能

### 1. ユーザー認証とデータ保護 (Supabase)
* メールアドレスとパスワードによる安全な新規登録・ログイン・ログアウト。
* Row Level Security (RLS) により、ログインしたユーザー自身のデータのみを厳重に保護。

### 2. コンビニ利用履歴のクラウド管理 (CRUD)
* 利用日時、店舗名、金額、商品のクラウド保存・一覧取得。
* 登録したデータの編集・削除（確認ダイアログ付き）に対応。

### 3. 未来予測・欲しいもの達成シミュレーション (Step 2)
* 実際のコンビニ利用履歴から「今月の支出」「過去30日間の支出」「全期間の平均月間支出」を動的に算出。
* 削減率（10%, 20%, 30%, 50%）を切り替え可能なシミュレーター。
* コンビニ利用を削減することで「欲しいもの（目標）が何ヶ月早く購入できるか」を可視化。
* 欲しいものごとの貯蓄進捗バー（達成率）の表示。
* 月間貯蓄設定（基本貯金ペース）の自由な変更・クラウド保存。

---

## 🛠️ 技術スタック

* **Frontend**: React (TypeScript), Vite, Vanilla CSS
* **Backend / Database / Auth**: Supabase (PostgreSQL), Row Level Security (RLS)
* **Icons**: Lucide React
* **Hosting**: Vercel

---

## ⚙️ ローカル開発環境のセットアップ

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/Arupaka3/v4.git
   cd v4
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **環境変数（.env）の作成**
   プロジェクトルートに `.env` ファイルを作成し、ご自身の Supabase の鍵を記述してください。
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **開発サーバーの起動**
   ```bash
   npm run dev
   ```
