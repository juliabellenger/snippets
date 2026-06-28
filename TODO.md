# TODO

## Bugs / Not Working

- [ ] **Tasks not appearing in Looking Forward panel** — upcomingTasks filter logic may be excluding all tasks (no due dates set, or all due today/overdue). Added console.log debug in page.tsx to diagnose — check browser console for `[tasks]` output to see due date values. Still not resolved as of 2026-06-28.

- [ ] **Emails Needing Attention not surfacing important read emails** — Gemini prompt may be too conservative, filtering out read emails from real people that should be shown. Still not resolved as of 2026-06-28.

- [ ] **Email filtering** — oscillating between too many and too few. Currently: fetch all inbox, run through Gemini with strict prompt. Needs real-world testing to tune.

## Not Yet Deployed / Manual Steps Required

- [ ] **Add GEMINI_API_KEY to GCP Secret Manager** — email Gemini filtering silently no-ops in production until this is done. Run:
  ```
  echo -n "AIzaSyCJidCZ09RBpm8jhCiI6dqthIsFWE8KsL8" | gcloud secrets create GEMINI_API_KEY --data-file=- --project=juliabellenger
  ```

- [ ] **Deploy firebase.json** — `firebase.json` was added to the repo but Firebase Hosting is deployed separately. Run `firebase deploy --only hosting` from this directory to apply:
  - Redirect `juliabellenger.com/` → `/snippets`
  - Rewrite `/snippets` and `/snippets/**` to Cloud Run

- [ ] **Sign-in redirect goes to juliabellenger.com instead of juliabellenger.com/snippets** — after completing Google OAuth, the app redirects to the root domain instead of `/snippets`. Login page sets `callbackUrl: "/snippets"` but something is overriding it. Must land on juliabellenger.com/snippets after sign-in. Still not resolved as of 2026-06-28.

## Pending — Need More Info

- [ ] **Photo-share pages** — remove nav links and block online access but keep files in repo. Need to know: where do these files live on your machine (or what are their paths on juliabellenger.com)?

## Cleanup (Low Priority)

- [ ] Remove `debug: true` from `auth.ts` (temporary, added to diagnose prod PKCE issue)
- [ ] Remove diagnostic `console.log` lines from `app/api/auth/[...nextauth]/route.ts`
- [ ] Remove temporary `console.log("[tasks]", ...)` debug line from `app/page.tsx` once task display is confirmed working
