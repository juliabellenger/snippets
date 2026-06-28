# Enhancements

Pending features and improvements for the life dashboard.

---

## Emails

- **Create Task button → popup**: Instead of immediately creating a task silently, clicking "📋 Task" should open a small popup/modal with:
  - Title field pre-populated with the email subject
  - Due date field pre-populated with today's date
  - A confirm button to create the task, and a cancel/dismiss option

---

## Icons

- Replace all emoji icons site-wide with monochrome SVG icons (e.g. lucide-react) so they can be styled with the app's slate text color instead of rendering as colorful OS emoji glyphs.

---

## Secret Manager

- Add `GEMINI_API_KEY` to GCP Secret Manager and deploy.yml so it's available in production (currently only set in local .env).

---
