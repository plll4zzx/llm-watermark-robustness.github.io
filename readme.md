
# LLM Watermark Hub
Static GitHub Pages site with manual updaters for LLM watermark research.


## Fast start
1. Click **Use this template** → create your repo `yourname.github.io` (or any repo + enable Pages).
2. Put files as-is. Commit & push. Turn on **Settings → Pages → Branch: main, / (root)**.
3. Create `projects/projects.json` with your papers.
4. (Optional) Get a free Semantic Scholar API key and add it as repo Secret `S2_API_KEY`.
python -m http.server 8000

## Daily workflow
- **Discover new papers**: `python scripts/update_new_papers.py` → `data/candidates_latest.json`.
- **Find new citations to seeds**: edit `seeds/important_papers.yaml`, then `python scripts/update_citations.py` → `data/candidates_citations.json`.
- **Curate**: for papers you accept, create `/articles/<slug>.yaml` and fill metadata.
- **Publish formal list**: `python scripts/build_index.py` → updates `data/index.json`.
- **View**: Reading List → choose *Formal* (curated) or the two discovery feeds.


## Paper YAML schema (under /articles)
```yaml
id: unique-slug
title: "Paper title"
authors: ["Alice", "Bob"]
year: 2025
venue: "ArXiv" # or conf/journal
url: https://...
arxivId: 2501.01234 # optional
tags: [attack, defense, survey, eval]
abstract: >-
One-paragraph abstract.
source: manual|semantic_scholar
addedAt: 2025-09-28
citationCount: 12 # optional

---


## 8) Nice-to-haves (future)
- Tag filters + search box on Reading List
- Per-paper pages (build from YAML to `/papers/<id>.html`)
- RSS/Atom feed from curated list
- Export BibTeX/CSV


---


### You’re ready to publish
1. Copy this structure into your repo.
2. Push to GitHub and enable Pages.
3. Add your first curated YAML + run `build_index.py`.
4. Add `projects/projects.json` with your publications.


Enjoy your LLM Watermark Hub! 🚀