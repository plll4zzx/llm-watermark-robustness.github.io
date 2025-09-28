const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));


const routes = {
    reading: () => showReading('formal'),
    projects: renderProjects,
    about: () => { }
};


window.addEventListener('DOMContentLoaded', () => {
    // Tabs
    $$('#year')[0] && ($('#year').textContent = new Date().getFullYear());
    $$('.tab').forEach(t => t.addEventListener('click', onTab));
    // Reading toggles
    $('#show-formal').addEventListener('click', () => showReading('formal'));
    $('#show-latest').addEventListener('click', () => showReading('latest'));
    $('#show-cites').addEventListener('click', () => showReading('cites'));
    // Route
    const hash = location.hash.replace('#', '') || 'reading';
    activate(hash);
});


function onTab(e) {
    e.preventDefault();
    const tab = e.currentTarget.dataset.tab;
    activate(tab);
}


function activate(tab) {
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === tab));
    routes[tab]?.();
    history.replaceState(null, '', `#${tab}`);
}

async function showReading(mode) {
    const container = $('#reading-container');
    const tocBox = $('#reading-toc');
    const summary = $('#reading-summary');
    container.innerHTML = '<p class="muted">Loading…</p>';
    tocBox.innerHTML = '';  // 清空目录

    let url, label;
    if (mode === 'formal') { url = 'data/index.json'; label = 'Formal curated list'; }
    if (mode === 'latest') { url = 'data/candidates_latest.json'; label = 'Discovery by keywords'; }
    if (mode === 'cites') { url = 'data/candidates_citations.json'; label = 'Discovery by seed citations'; }

    try {
        const res = await fetch(url, { cache: 'no-store' });
        let items = await res.json();
        summary.textContent = `${label}: ${items.length} entries`;
        container.innerHTML = '';

        if (mode === 'latest' || mode === 'cites') {
            // 🔹 分组逻辑和排序（保持之前的代码）
            const groups = {};
            if (mode === 'latest') {
                // 🔹 先整体排序
                items.sort((a, b) => {
                    const ya = a.year || 0, yb = b.year || 0;
                    if (ya !== yb) return yb - ya; // year 降序
                    const ida = (a.arxivId || '').toString();
                    const idb = (b.arxivId || '').toString();
                    return idb.localeCompare(ida, 'en', { numeric: true }); // arxivId 降序
                });

                // 🔹 按年份分组
                const groups = {};
                items.forEach(p => {
                    const y = p.year || 'Unknown Year';
                    if (!groups[y]) groups[y] = [];
                    groups[y].push(p);
                });

                // 🔹 年份组也按降序排列
                const sortedGroups = Object.keys(groups)
                    .sort((a, b) => {
                        const ya = a === 'Unknown Year' ? 0 : parseInt(a, 10);
                        const yb = b === 'Unknown Year' ? 0 : parseInt(b, 10);
                        return yb - ya;
                    })
                    .map(y => [y, groups[y]]);

                // 🔹 渲染目录和分组
                const toc = document.createElement('nav');
                toc.className = 'toc';
                toc.innerHTML = '<h4>Years</h4><ul></ul>';
                const tocList = toc.querySelector('ul');
                tocBox.appendChild(toc);

                sortedGroups.forEach(([year, papers], idx) => {
                    const sectionId = `${mode}-${idx}`;

                    // 目录项
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="#${sectionId}">${year}</a>`;
                    tocList.appendChild(li);

                    // 小标题
                    const header = document.createElement('h3');
                    header.id = sectionId;
                    header.textContent = year;
                    container.appendChild(header);

                    // 小组内再排序（确保一致性）
                    papers.sort((a, b) => {
                        const ya = a.year || 0, yb = b.year || 0;
                        if (ya !== yb) return yb - ya;
                        const ida = (a.arxivId || '').toString();
                        const idb = (b.arxivId || '').toString();
                        return idb.localeCompare(ida, 'en', { numeric: true });
                    });

                    // 渲染卡片
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'cards';
                    papers.forEach(renderPaperCard(groupDiv));
                    container.appendChild(groupDiv);
                });
            } else if (mode === 'cites') {
                // 🔹 按 seedMatched 分组
                const groups = {};
                items.forEach(p => {
                    const seed = p.seedMatched || 'Unknown Seed';
                    if (!groups[seed]) groups[seed] = [];
                    groups[seed].push(p);
                });

                // 🔹 渲染目录
                const toc = document.createElement('nav');
                toc.className = 'toc';
                toc.innerHTML = '<h4>Seeds</h4><ul></ul>';
                const tocList = toc.querySelector('ul');
                tocBox.appendChild(toc);

                // 🔹 渲染分组
                Object.entries(groups).forEach(([seed, papers], idx) => {
                    const sectionId = `${mode}-${idx}`;

                    // 目录项
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="#${sectionId}">${seed}</a>`;
                    tocList.appendChild(li);

                    // 小标题
                    const header = document.createElement('h3');
                    header.id = sectionId;
                    header.textContent = seed;
                    container.appendChild(header);

                    // 🔹 小组内排序：year 降序 → arxivId 降序
                    papers.sort((a, b) => {
                        const ya = a.year || 0, yb = b.year || 0;
                        if (ya !== yb) return yb - ya;
                        const ida = (a.arxivId || '').toString();
                        const idb = (b.arxivId || '').toString();
                        return idb.localeCompare(ida, 'en', { numeric: true });
                    });

                    // 卡片
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'cards';
                    papers.forEach(renderPaperCard(groupDiv));
                    container.appendChild(groupDiv);
                });
            } else {
                items.forEach(p => {
                    const seed = p.seedMatched || 'Unknown Seed';
                    if (!groups[seed]) groups[seed] = [];
                    groups[seed].push(p);
                });
            }

            // 🔹 渲染目录
            const toc = document.createElement('nav');
            toc.className = 'toc';
            toc.innerHTML = `<h4>${mode === 'latest' ? 'Years' : 'Seeds'}</h4><ul></ul>`;
            const tocList = toc.querySelector('ul');
            tocBox.appendChild(toc);

            // 🔹 渲染分组
            Object.entries(groups).forEach(([groupKey, papers], idx) => {
                const sectionId = `${mode}-${idx}`;

                // 目录项
                const li = document.createElement('li');
                li.innerHTML = `<a href="#${sectionId}">${groupKey}</a>`;
                tocList.appendChild(li);

                // 小标题
                const header = document.createElement('h3');
                header.id = sectionId;
                header.textContent = groupKey;
                container.appendChild(header);

                // 卡片
                const groupDiv = document.createElement('div');
                groupDiv.className = 'cards';
                papers.forEach(renderPaperCard(groupDiv));
                container.appendChild(groupDiv);
            });

        } else if (mode === 'formal') {
            // 🔹 你定义的目录顺序
            const TAG_ORDER = ["LLM watermark", "Attack", "Survey", "Analysis"];

            // 分组
            const groups = {};
            items.forEach(p => {
                const tags = p.tags || [];
                const group = tags.length > 0 ? tags[0] : 'Untagged';
                if (!groups[group]) groups[group] = [];
                groups[group].push(p);
            });

            // 渲染目录
            const toc = document.createElement('nav');
            toc.className = 'toc';
            toc.innerHTML = '<h4>Tags</h4><ul></ul>';
            const tocList = toc.querySelector('ul');
            tocBox.appendChild(toc);

            // 🔹 排序：先按 TAG_ORDER 中的顺序，再排其他
            const orderedGroups = Object.keys(groups).sort((a, b) => {
                const ia = TAG_ORDER.indexOf(a);
                const ib = TAG_ORDER.indexOf(b);
                if (ia === -1 && ib === -1) {
                    return a.localeCompare(b); // 都不在 TAG_ORDER，按字母排
                }
                if (ia === -1) return 1; // a 不在 TAG_ORDER，排后面
                if (ib === -1) return -1; // b 不在 TAG_ORDER，排后面
                return ia - ib; // 都在 TAG_ORDER，按顺序
            });

            // 渲染分组
            orderedGroups.forEach((group, idx) => {
                const sectionId = `${mode}-${idx}`;

                // 目录项
                const li = document.createElement('li');
                li.innerHTML = `<a href="#${sectionId}">${group}</a>`;
                tocList.appendChild(li);

                // 小标题
                const header = document.createElement('h3');
                header.id = sectionId;
                header.textContent = group;
                container.appendChild(header);

                // 卡片
                const groupDiv = document.createElement('div');
                groupDiv.className = 'cards';
                groups[group].forEach(renderPaperCard(groupDiv));
                container.appendChild(groupDiv);
            });
        } else {
            // formal: 平铺
            items.forEach(renderPaperCard(container));
        }

    } catch (err) {
        container.innerHTML = `<p class="muted">Failed to load ${label}. Ensure <code>${url}</code> exists.</p>`;
        summary.textContent = '';
    }
}





function renderPaperCard(container) {
    return (p) => {
        const card = document.createElement('article');
        card.className = 'card';
        const authors = (p.authors || []).join(', ');
        const venue = [p.venue, p.year].filter(Boolean).join(', ');
        const link = p.url || p.arxivId ? (p.url || `https://arxiv.org/abs/${p.arxivId}`) : '#';
        const tags = p.tags || [];
        card.innerHTML = `
            <h3><a href="${link}" target="_blank" rel="noopener">${p.title || 'Untitled'}</a></h3>
            <div class="meta">${authors || 'Unknown authors'}${venue ? ' — ' + venue : ''}${p.citationCount != null ? ` — cites: ${p.citationCount}` : ''}</div>
            ${p.abstract ? `<p class="small">${p.abstract.slice(0, 220)}${p.abstract.length > 220 ? '…' : ''}</p>` : ''}
            <div class="badges">${tags.map(t => `<span class="badge">${t}</span>`).join('')}</div>
        `;
        container.appendChild(card);
    };
}


async function renderProjects() {
    const container = $('#projects-container');
    container.innerHTML = '<p class="muted">Loading…</p>';
    try {
        const res = await fetch('projects/projects.json', { cache: 'no-store' });
        const items = await res.json();
        container.innerHTML = '';
        items.forEach(p => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <h3><a href="${p.url}" target="_blank" rel="noopener">${p.title}</a></h3>
                <div class="meta">${(p.authors || []).join(', ')} — ${p.venue || ''} ${p.year || ''}</div>
                ${p.note ? `<p class="small">${p.note}</p>` : ''}
            `;
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = '<p class="muted">Add <code>projects/projects.json</code> to show your papers.</p>';
    }
}