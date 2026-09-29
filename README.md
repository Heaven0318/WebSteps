# WebSteps

**An interactive roadmap for learning HTML, CSS, and JavaScript by building.**

🌐 **Visit the learning app:** [https://heaven0318.github.io/WebSteps/](https://heaven0318.github.io/WebSteps/)

WebSteps is a browser-based course with a guided curriculum, hands-on code playground, projects, quizzes, and progress tracking. It helps learners move from web fundamentals to building and publishing complete projects.

## What is included

- 16 modules and 48 lessons covering HTML, CSS, JavaScript, accessibility, and publishing.
- Four guided projects with requirements and in-browser checks.
- An editable HTML/CSS/JavaScript playground with a sandboxed preview and console output.
- Quizzes, a searchable reference library, roadmap navigation, and lesson-by-lesson progress.
- Guest progress saved in the browser, plus versioned progress backup export and import.
- Optional accounts and cloud progress using Supabase. Account email flows need production Auth redirect settings and SMTP before general use.

## Start learning

Open the [WebSteps learning app](https://heaven0318.github.io/WebSteps/), choose a module from the roadmap, and work through its lessons and projects. You can try the course without an account; guest progress stays in that browser. Export a backup from Settings before clearing browser data or switching devices.

## Run locally

The app is static and has no install step. From the repository root, serve the dist directory over HTTP:

```sh
python -m http.server 4173 --directory dist
```

Then open http://localhost:4173/. Hash routes such as /#/lesson/lesson-06 can be bookmarked and loaded directly. Opening dist/index.html as a file:// URL is not supported because JavaScript modules and IndexedDB require a browser origin.

## How it is built

- `dist/index.html`, `dist/styles.css`, and `dist/app.js` provide the app shell and interface.
- `dist/curriculum.js` contains the versioned lessons, quizzes, and project definitions.
- `dist/runner.js` runs learner code in an opaque-origin sandboxed iframe and bridges console output and project checks. A Worker preflight catches syntax errors and immediate runaway loops, but cannot prevent every browser-native or event-triggered hang.
- `dist/storage.js` stores guest progress locally with IndexedDB.
- `dist/account-service.js` integrates optional Supabase authentication and cloud progress.
- `dist/demos.js`, `dist/quiz-second.js`, `dist/project-solutions.js`, and `dist/enhancements.css` provide supporting learning interactions.
- `supabase/schema.sql` defines the learning-state table and owner-only row-level security policies.
- `supabase/functions/delete-websteps-account/` contains the authenticated account-deletion function.
- `.github/workflows/pages.yml` publishes the `dist/` folder to GitHub Pages when `main` is updated.

## Accounts and Supabase

Guest learning and local progress do not require an account. The optional cloud account feature uses the Supabase project configured in `dist/account-config.js`; its browser-side project URL and publishable key are designed to be public. Never put a Supabase secret or service-role key in this repository or browser code.

Before enabling public signups, set the Supabase Auth Site URL to https://heaven0318.github.io/WebSteps/, allow that origin and http://localhost:4173/** as redirect URLs, and configure a production SMTP provider. Until the email settings are completed and verified, registration, confirmation, and password-reset emails may not work reliably. The deployed site is usable for guest learning in the meantime.

Keep row-level security enabled so users can access only their own cloud learning state. Test signup, email verification, password reset, login/logout, account deletion, guest-to-account transfer, conflict handling, and cross-device sync with test accounts before relying on cloud progress.

## Testing before release

Check the homepage, a direct lesson URL, a complete guest lesson, quizzes, project checks, backup export/import, mobile navigation, keyboard focus, responsive layouts, and the browser console on the deployed site. Automated project checks cover only some requirements; learners should also review objectives themselves. Automated checks do not prove complete accessibility, visual, semantic, or responsive quality.

## Privacy and data

Guest progress is stored in that browser and does not sync automatically. Clearing site data may remove it, so export a backup in Settings. Account-based learning-state sync uses the Supabase backend and its row-level security policies.
