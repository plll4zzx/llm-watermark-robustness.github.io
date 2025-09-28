import json, pathlib

def update_json_with_new_entries(outfile: pathlib.Path, new_entries: list):
    """
    将新抓到的论文条目合并到已有 JSON 文件中。
    去重策略：按 (title.lower().strip(), year) 作为唯一键。
    
    参数:
        outfile (pathlib.Path): JSON 文件路径
        new_entries (list): 新抓到的论文条目（list of dict）
    
    返回:
        tuple: (文件名 str, 新增的条目 list)
    """
    # 1. 读取旧文件
    if outfile.exists():
        try:
            existing = json.loads(outfile.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            existing = []
    else:
        existing = []

    # 2. 用 dict 做去重
    uniq = {}
    for p in existing:
        key = (p.get('title','').strip().lower(), p.get('year'))
        uniq[key] = p

    # 3. 统计新加入的条目
    added = []
    add_num=0
    for p in new_entries:
        key = (p.get('title','').strip().lower(), p.get('year'))
        if key not in uniq:   # 是新条目
            added.append(p)
            add_num += 1
        uniq[key] = p  # 覆盖更新

    # 4. 写回文件
    outfile.write_text(
        json.dumps(list(uniq.values()), ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    print(f"Wrote {len(uniq)} items (+{add_num} new) → {outfile}")

    return str(outfile), added