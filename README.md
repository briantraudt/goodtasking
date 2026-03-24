# Good Tasking

Good Tasking is a daily command center for running software projects with more clarity. The goal is simple: open the app in the morning and immediately know what matters today, which projects need attention, and how your time should be spent.

## Product Direction

Good Tasking works best when it stays focused on three jobs:

1. Help you manage multiple software projects in one place.
2. Help you decide what deserves attention today.
3. Help you turn that decision into a workable schedule.

The strongest version of the product is not a generic productivity app. It is a trusted place to start the day.

## Current Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase

## Local Development

1. Install dependencies:

```sh
npm install
```

2. Create a local env file from the example:

```sh
cp .env.example .env
```

3. Start the app:

```sh
npm run dev
```

4. Build for production:

```sh
npm run build
```

## Environment Variables

The app expects the following values:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

Use the values from your Supabase project in `.env`.

## Near-Term Refinement Priorities

1. Make the dashboard feel like a true morning briefing.
2. Reduce feature sprawl by tying every AI feature back to daily planning.
3. Strengthen project-level visibility so stalled projects are obvious.
4. Add clearer onboarding for software-specific workflows.

## Repo Notes

- `.env.example` is safe to commit.
- `.env` should stay local and should not be committed.
