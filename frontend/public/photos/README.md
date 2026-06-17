# Match photos

End-of-match photos, named by match date and shown automatically on each match
page (`/match/<date>`). File name must be the match date in `YYYY-MM-DD` format,
extension `.jpg`.

## Adding new photos (recommended)

Same routine as adding the workbook after a match:

1. Drop the raw photo into `photos_inbox/` at the repo root. Name it by the match
   date — either `DD-MM-YYYY.jpg` (e.g. `15-06-2026.jpg`) or `YYYY-MM-DD.jpg`.
2. Run the importer:

   ```bash
   python backend/import_photos.py
   ```

   It crops every photo to a tidy 16:9, downsizes to 1600px wide, optimises the
   JPEG and writes it here with the correct `YYYY-MM-DD.jpg` name. It then prints
   which matches still have no photo.

   - `--src DIR` to import from another folder (default `photos_inbox/`).
   - `--force` to re-process a date that already has a photo here.

   If a photo was shot far from the group and needs zooming, add an entry to
   `backend/photos_crops.json` (`{"YYYY-MM-DD": {"zoom": 1.3, "x": 0.5, "y": 0.5}}`)
   and re-run with `--force`. Photos with no entry just get a plain centred 16:9
   crop — so if you've already cropped a photo yourself, no entry is needed.

3. Commit & push (or upload via the GitHub web UI). The site picks them up on the
   next deploy.

The `photos_inbox/` folder is gitignored — only the processed photos in this
folder are tracked.

## Notes

- If no file exists for a date, the match page shows a "no photo" placeholder, so
  it's fine to skip matches where no photo was taken (e.g. draws).
- A photo whose date has no match yet (workbook not updated) is reported as an
  "orphan" by the importer — it'll light up automatically once that match's data
  is added.
