# Match photos

Drop end-of-match photos here, named by the match date:

```
2026-06-08.jpg
2026-05-18.jpg
...
```

- File name must be the match date in `YYYY-MM-DD` format, extension `.jpg`.
- The photo shows automatically on that match's page (`/match/<date>`).
- If no file exists for a date, the match page shows a "no photo" placeholder —
  so it's fine to skip matches where no photo was taken (e.g. draws).

After adding photos, commit & push (or upload them via the GitHub web UI) and the
site will include them on the next deploy.
