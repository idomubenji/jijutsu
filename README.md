# Jijutsu (字術)

Jijutsu (lit. "character art") is an alchemy game where you can combine radicals to create kanji, and combine those kanji to make more advanced kanji and vocabulary.

## Tech Stack

- **Frontend**: NextJS, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase for authentication and database

## Features

- Landing page with rotating sakura animation around the Jijutsu logo
- Countdown timer until release date
- Waitlist functionality (pre-launch)
- User signup functionality (post-launch)
- Email notification to waitlisted users when the countdown completes

## Getting Started

### Prerequisites

- Node.js 16.8+ and npm/yarn
- A Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd jijutsu
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_RELEASE_DATE="2023-12-31T23:59:59"
   ```

4. Set up the Supabase database by executing the SQL statements in `supabase-schema.sql` in your Supabase SQL editor.

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

The project requires two main tables in Supabase:
- `waitlisted_users`: Stores emails of users who join the waitlist before launch
- `users`: Stores registered users after launch

Refer to `supabase-schema.sql` for the complete database schema setup.

## Countdown Timer

The countdown timer is configured to expire on the date specified in the `NEXT_PUBLIC_RELEASE_DATE` environment variable. You can adjust this date for testing purposes.

## Deployment

This is a [Next.js](https://nextjs.org/) project that can be deployed to Vercel, Netlify, or any other platform that supports Next.js.

1. Build the project:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Deploy the build to your hosting platform of choice.

## License

[MIT](LICENSE)

## Troubleshooting

### Kanji Recognition Issues

If you encounter errors with specific kanji not being recognized (e.g., "Kanji not found in dex: '唖'"), it might be because certain kanji entries are missing from the database despite being in the source data files. 

To fix this issue:

1. Make sure your environment variables are properly set in `.env.local`
2. Run the fix script:

```bash
# Install dependencies if not already installed
npm install

# Run the fix script
npx ts-node scripts/fix_kanji_data.ts
```

This script will:
1. Check if the problematic kanji exists in the database
2. Add it if missing
3. Handle unique constraint errors by using an alternative dex_number if needed

If you encounter other kanji recognition issues, please report them in the project's issue tracker.
