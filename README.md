# LexiKey

LexiKey is a keyword-first English vocabulary memorization starter built with
Next.js, Tailwind CSS, and Redux Toolkit.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Redux Toolkit
- React Redux

## Project Structure

- `src/app/providers.tsx` wires Redux into the App Router.
- `src/lib/store.ts` creates the Redux store.
- `src/lib/hooks.ts` exports typed Redux hooks.
- `src/features/vocabulary/` contains the starter vocabulary feature.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## GitHub

Create a GitHub repository, then connect it:

```bash
git remote add origin https://github.com/YOUR_NAME/lexikey.git
git push -u origin main
```
