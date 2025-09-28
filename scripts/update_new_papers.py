#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Manual Update #1: find new LLM watermark papers by keywords.
Outputs: data/candidates_latest.json
Requires: pip install requests pyyaml
Env var: S2_API_KEY (get one at https://www.semanticscholar.org/product/api)
"""
import os, json, time, pathlib, requests


ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
DATA.mkdir(exist_ok=True)


API = 'https://api.semanticscholar.org/graph/v1/paper/search'
HEADERS = { 'x-api-key': os.environ.get('S2_API_KEY','') }
FIELDS = 'title,abstract,authors,venue,year,externalIds,citationCount,url'

QUERIES = [
    # "LLM watermark",
    "large language model watermark",
    # "watermark large language model",
    # "watermark text generation"
]

all_items = []

for idx in range(len(QUERIES)):
    q=QUERIES[idx]
    params = {
        'query': q,
        'limit': 10,
        'fields': FIELDS,
        'offset': 0,
        'sort': 'year:desc'
    }
    while True:
        r = requests.get(API, params=params, headers=HEADERS, timeout=30)
        r.raise_for_status()
        data = r.json()
        items = data.get('data', [])
        for p in items:
            eid = p.get('externalIds') or {}
            all_items.append({
            'title': p.get('title'),
            'authors': [a.get('name') for a in (p.get('authors') or [])],
            'venue': p.get('venue'),
            'year': p.get('year'),
            'url': p.get('url') or (('ArXiv' in eid and f"https://arxiv.org/abs/{eid.get('ArXiv')}") or None),
            'arxivId': (p.get('externalIds') or {}).get('ArXiv'),
            'citationCount': p.get('citationCount'),
            'tags': [],
            'source': 'semantic_scholar'
            })
        params['offset'] += params['limit']
        print(f"Query {idx+1}/{len(QUERIES)} '{q}': fetched {len(items)} items (offset {params['offset']})")
        if len(items) == 0 or params['offset'] >= 30:
            break
        time.sleep(1.1)


(DATA / 'candidates_latest.json').write_text(json.dumps(all_items, ensure_ascii=False, indent=2))
print(f"Wrote {len(all_items)} items → data/candidates_latest.json")