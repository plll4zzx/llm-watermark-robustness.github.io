llm-watermark-hub/
├─ index.html # Single-page site with tabs (Reading List, Projects, About)
├─ assets/
│ ├─ style.css
│ └─ app.js # Frontend logic (render tabs; load JSON)
├─ data/
│ ├─ index.json # BUILT from /articles/*.yaml (formal, curated list)
│ ├─ candidates_latest.json # OUTPUT of update_new_papers.py (discovery by keywords)
│ └─ candidates_citations.json# OUTPUT of update_citations.py (discovery via seed citations)
├─ articles/ # One curated paper per YAML file (you edit/approve)
│ └─ example.yaml
├─ projects/
│ └─ projects.json # Your published papers; shown in Projects tab
├─ seeds/
│ └─ important_papers.yaml # Seed list for citation-tracking
├─ scripts/
│ ├─ update_new_papers.py # Manual Update #1 (keyword search)
│ ├─ update_citations.py # Manual Update #2 (find new papers citing seeds)
│ └─ build_index.py # Convert curated YAMLs → data/index.json
├─ .github/
│ └─ workflows/
│ └─ update.yml # (Optional) Run scripts manually via GitHub Actions
└─ README.md # How to use


# LLM Watermark Hub
Static GitHub Pages site with manual updaters for LLM watermark research.


## Fast start
1. Click **Use this template** → create your repo `yourname.github.io` (or any repo + enable Pages).
2. Put files as-is. Commit & push. Turn on **Settings → Pages → Branch: main, / (root)**.
3. Create `projects/projects.json` with your papers.
4. (Optional) Get a free Semantic Scholar API key and add it as repo Secret `S2_API_KEY`.


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