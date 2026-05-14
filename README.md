# LexiKey

LexiKey is a keyword-first English vocabulary memorization starter built with
Next.js, Tailwind CSS, and Redux Toolkit.

## Getting Started

Install dependencies and run the development server:

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Notion Integration

Set the following environment variables in `.env.local`:

```bash
NOTION_API_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
```

Database columns (property names) must be:

- `단어`
- `뜻`
- `품사` (복수 값 허용, multi_select 권장)
- `예문`
- `암기 상태` (`학습 필요`, `완료`)

Then share the database with your Notion integration.

## Mobile Learning Flow

- Initial load: fetches `학습 필요` cards from Notion in random order
- Card tap: reveals `단어`, `뜻`, `예문`
- Swipe left: keeps card as `학습 필요` and moves to next card
- Swipe right: stores `완료` target locally and removes card from deck
- Sync button: sends locally completed IDs to Notion in batch

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Redux Toolkit
- React Redux

## Project Structure

- `src/app/api/words/route.ts` loads learning cards from Notion.
- `src/app/api/words/sync/route.ts` syncs locally completed cards in batch.
- `src/lib/notion.ts` handles Notion API calls.
- `src/features/vocabulary/` contains mobile swipe-card UI and Redux state.

## Scripts

```bash
yarn dev
yarn build
yarn start
yarn lint
```

## GitHub

Create a GitHub repository, then connect it:

```bash
git remote add origin https://github.com/YOUR_NAME/lexikey.git
git push -u origin main
```
