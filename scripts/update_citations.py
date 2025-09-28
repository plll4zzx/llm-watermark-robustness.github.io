#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Manual Update #2: given seed papers, fetch their recent citations.
Inputs: seeds/important_papers.yaml
Outputs: data/candidates_citations.json
Requires: pip install requests pyyaml
Env var: S2_API_KEY
"""
import os, json, time, pathlib, requests, yaml
from ..scripts.utili import update_json_with_new_entries


ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'; DATA.mkdir(exist_ok=True)
SEEDS = ROOT / 'seeds' / 'important_papers.yaml'
HEADERS = { 'x-api-key': os.environ.get('S2_API_KEY','') }


FIELDS = 'title,abstract,authors,venue,year,externalIds,citationCount,url'


with open(SEEDS, 'r', encoding='utf-8') as f:
    seeds = yaml.safe_load(f)['seeds']


out = []
for s in seeds:
    query = s.get('title')
    # 1) find candidate seed paper id
    sr = requests.get(
        'https://api.semanticscholar.org/graph/v1/paper/search',
        params={'query': query, 'limit': 1, 'fields':'paperId,title,year'},
        headers=HEADERS, timeout=30
    )
    sr.raise_for_status(); sdata = sr.json().get('data', [])
    if not sdata: 
        continue
    pid = sdata[0]['paperId']
    # 2) fetch citations
    cr = requests.get(
        f'https://api.semanticscholar.org/graph/v1/paper/{pid}/citations',
        params={'fields': FIELDS, 'limit': 1000, 'offset': 0}, headers=HEADERS, timeout=30
    )
    cr.raise_for_status(); cdata = cr.json().get('data', [])
    for c in cdata:
        p = c.get('citingPaper') or {}
        eid = p.get('externalIds') or {}
        out.append({
            'title': p.get('title'),
            'authors': [a.get('name') for a in (p.get('authors') or [])],
            'venue': p.get('venue'),
            'year': p.get('year'),
            'url': p.get('url') or (('ArXiv' in eid and f"https://arxiv.org/abs/{eid.get('ArXiv')}") or None),
            'arxivId': eid.get('ArXiv'),
            'citationCount': p.get('citationCount'),
            'tags': [],
            'source': 'semantic_scholar',
            'seedMatched': s['title']
        })
    print(f"Seed '{s['title']}' ({pid}): found {len(cdata)} citations")
    time.sleep(1.1)

update_json_with_new_entries(pathlib.Path(DATA)/'candidates_citations.json', out)