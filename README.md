# Spelling Bee

A browser-only vocabulary game for ages 10–13. It uses a static HTML, CSS, and JavaScript site with no build step or account.

## Run locally

From the project directory, run `python -m http.server 8000` and open [localhost:8000](http://localhost:8000). The JavaScript modules need an HTTP server when you preview the app.

## Publish on GitHub Pages

1. Push the project to the repository's `main` branch.
2. Open the repository's **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose **main**, select **/(root)**, and save. GitHub shows the published URL on the Pages settings screen once deployment finishes.

## Word lists

`words.js` holds the source-list metadata and word records. The initial Word Bank transcribes the two supplied pages from the 2026–2027 Scripps National Spelling Bee School Spelling Bee Study List. It includes 74 Two Bee entries, 67 Three Bee entries, 3 printed British variants, and 19 purple highlights.

Add a collection to `sources` and register its words with a unique ID. Keep the spelling and capitalization in `word`, use `variants` for accepted spellings, and pass `highlighted: true` for words highlighted on the original paper. Optional fields include `roots`, `family`, `derived`, `synonyms`, `antonyms`, and `origin`. Keep IDs stable so that existing progress, saved sets, and backups still resolve. Definitions and sentences are written for this app. The Study card links to Merriam-Webster for reference.

## Local profiles

The profile menu lets learners switch profiles or export and import a JSON backup. A backup includes all profiles, sets, results, and preferences. Import adds copies of those profiles to the current browser. Audio uses the browser's speech synthesis and depends on the English voices available on the device.
