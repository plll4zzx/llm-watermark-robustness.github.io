#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the formal (curated) index from /articles/*.yaml to /data/index.json
Requires: pip install pyyaml
"""
import json, pathlib, yaml
ROOT = pathlib.Path(__file__).resolve().parents[1]
ART = ROOT / 'articles'
DATA = ROOT / 'data'; DATA.mkdir(exist_ok=True)


allp = []
for y in sorted(ART.glob('*.yaml')):
    with open(y, 'r', encoding='utf-8') as f:
        rec = yaml.safe_load(f)
        # Ensure keys present
        rec.setdefault('tags', [])
        rec.setdefault('citationCount', None)
        allp.append(rec)


(DATA / 'index.json').write_text(json.dumps(allp, ensure_ascii=False, indent=2))
print(f"Built {len(allp)} curated entries → data/index.json")