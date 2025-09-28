#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the formal (curated) index from /articles/*.yaml to /data/index.json
Requires: pip install pyyaml
"""
import json, pathlib, yaml
ROOT = pathlib.Path(__file__).resolve().parents[1]
ART = ROOT / 'articles'
DATA = ROOT / 'data'; DATA.mkdir(exist_ok=True)

class NoDatesSafeLoader(yaml.SafeLoader):
    pass

def no_dates_constructor(loader, node):
    return loader.construct_scalar(node)

NoDatesSafeLoader.add_constructor(
    u'tag:yaml.org,2002:timestamp', no_dates_constructor)

# with open(y, 'r', encoding='utf-8') as f:
#     rec = yaml.load(f, Loader=NoDatesSafeLoader)

allp = []
for y in sorted(ART.glob('*.yaml')):
    with open(y, 'r', encoding='utf-8') as f:
        # rec = yaml.safe_load(f)
        rec = yaml.load(f, Loader=NoDatesSafeLoader)
        # Ensure keys present
        rec.setdefault('tags', [])
        rec.setdefault('citationCount', None)
        allp.append(rec)


(DATA / 'index.json').write_text(json.dumps(allp, ensure_ascii=False, indent=2))
print(f"Built {len(allp)} curated entries → data/index.json")