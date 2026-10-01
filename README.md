# Campus Kin

Campus Kin is a mobile-first matchmaking app for verified Siddhartha Educational Institutions students. It uses Next.js App Router, Supabase Auth/Postgres, and database-enforced contact privacy. The app is for adults aged 18 and over.

## Connect a Supabase project

1. Create a dedicated Supabase **test** project. Do not seed a production project.
2. In the Supabase SQL Editor for that project, run `supabase/migrations/202610010001_initial_schema.sql`.
3. In Authentication settings, enable email/password sign-in and email confirmation. Set the minimum password length to 10.
4. In Authentication > Email Templates > Confirm signup, include the six-digit `{{ .Token }}` code in the message. The signup screen verifies this with Supabase's `signup` OTP type; a link-only template will not work with the code-entry screen.
5. Set the Supabase Site URL to `http://localhost:3000`. Add local and production app origins to the redirect allow list if you later enable link-based sign-in.
6. Copy `.env.example` to `.env.local`. Set the project URL, anon key, and local app URL from the Supabase dashboard. Keep `.env.local` private.
7. Run `npm run dev` and open `http://localhost:3000`.

For live deployment, configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the canonical HTTPS `NEXT_PUBLIC_APP_URL` in the hosting provider. Set the production Site URL, configure production SMTP and the six-digit Confirm signup email template, and enable email confirmation. Never add a service-role key to the hosted app's environment.

## Free-tier limits

Vercel Hobby is free but restricted to non-commercial personal use ([plan](https://vercel.com/docs/plans/hobby), [fair-use rules](https://vercel.com/docs/limits/fair-use-guidelines)). Use it only if this remains an unpaid, non-commercial student pilot. Supabase Free currently includes 50,000 monthly active users and a 500 MB database, but free projects pause after one week of inactivity and do not include automatic backups or an uptime SLA ([current pricing](https://supabase.com/pricing)). These tiers are useful for a small pilot, not guaranteed real-world availability. Review current terms and quotas before launch.

## Fake test profiles and logins

The repository includes a one-time seeder for one QA login and six fake student profiles. It creates Auth users with synthetic `@siddhartha.co.in` addresses and confirmed email status inside the test project; these addresses do not have inboxes. Seed bios are visibly labeled, and avatars and Instagram handles are fabricated. The QA login is an ordinary student account; this app does not implement an admin role or admin console.

Only run the seeder against the dedicated test project:

1. Copy `.env.test.example` to `.env.test.local`. Keep this separate from `.env.local`; the service-role key must never enter a browser or production environment.
2. In `.env.test.local`, set the test project's `SUPABASE_SERVICE_ROLE_KEY` and its `CAMPUSKIN_TEST_PROJECT_REF`.
3. Set `CAMPUSKIN_TEST_PASSWORD` to a unique password of at least 12 characters. The script assigns it to all seven test logins and never prints it.
4. Type `ALLOW_TEST_SEED=I_UNDERSTAND_THIS_IS_NOT_PRODUCTION` explicitly in `.env.test.local`.
5. Run `npm run seed:test`. The script verifies the Supabase hostname/ref, refuses unmarked existing accounts, and prints the generated login IDs and Auth user IDs.

Never use the service-role key or test-seed command with production data. To test a mutual match, sign in to the QA account and like a fixture; then sign in to that fixture account and like the QA profile. The second like should reveal only that mutual match's fake handle.

## Verification

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` before deployment. The seed command requires Node.js 20.9+ for `--env-file`.
