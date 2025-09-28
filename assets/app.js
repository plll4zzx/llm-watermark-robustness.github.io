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
    const container = $('#reading-container');   // 论文内容区
    const tocBox = $('#reading-toc');            // 左侧目录区
    const summary = $('#reading-summary');

    container.innerHTML = '<p class="muted">Loading…</p>';
    tocBox.innerHTML = ''; // 每次刷新清空目录

    let url, label;
    if (mode === 'formal') { url = 'data/index.json'; label = 'Formal curated list'; }
    else if (mode === 'latest') { url = 'data/candidates_latest.json'; label = 'Discovery by keywords'; }
    else if (mode === 'cites') { url = 'data/candidates_citations.json'; label = 'Discovery by seed citations'; }

    try {
        const res = await fetch(url, { cache: 'no-store' });
        let items = await res.json();

        summary.textContent = `${label}: ${items.length} entries`;
        container.innerHTML = '';

        // -------------------------
        // Formal 模式：按第一个 tag 分组
        // -------------------------
        if (mode === 'formal') {
            const groups = {};
            items.forEach(p => {
                const tags = p.tags || [];
                const group = tags.length > 0 ? tags[0] : 'Untagged';
                if (!groups[group]) groups[group] = [];
                groups[group].push(p);
            });

            renderGroupedContent('Tags', groups, mode, container, tocBox);

            // -------------------------
            // Latest 模式：按年份分组
            // -------------------------
        } else if (mode === 'latest') {
            // 🔹 先整体排序：year 降序 → arxivId 降序
            items.sort((a, b) => {
                const ya = a.year || 0, yb = b.year || 0;
                if (ya !== yb) return yb - ya;
                const ida = (a.arxivId || '').toString();
                const idb = (b.arxivId || '').toString();
                return idb.localeCompare(ida, 'en', { numeric: true });
            });

            // 🔹 分组
            const groups = {};
            items.forEach(p => {
                const y = p.year || 'Unknown Year';
                if (!groups[y]) groups[y] = [];
                groups[y].push(p);
            });

            // 🔹 转成数组并排序（保证严格逆序）
            const orderedGroups = Object.entries(groups)
                .sort(([a], [b]) => {
                    const ya = a === 'Unknown Year' ? -Infinity : parseInt(a, 10);
                    const yb = b === 'Unknown Year' ? -Infinity : parseInt(b, 10);
                    return yb - ya; // 年份大的排前
                });

            // 🔹 转回对象（可选，renderGroupedContent 支持数组也行）
            const sortedGroups = {};
            orderedGroups.forEach(([y, papers]) => { sortedGroups[y] = papers; });

            renderGroupedContent('Years', sortedGroups, mode, container, tocBox);
        } else if (mode === 'cites') {

            // -------------------------
            // Cites 模式：按 seedMatched 分组
            // -------------------------
            const groups = {};
            items.forEach(p => {
                const seed = p.seedMatched || 'Unknown Seed';
                if (!groups[seed]) groups[seed] = [];
                groups[seed].push(p);
            });

            // 小组内排序
            Object.values(groups).forEach(papers => {
                papers.sort((a, b) => {
                    const ya = a.year || 0, yb = b.year || 0;
                    if (ya !== yb) return yb - ya;
                    const ida = (a.arxivId || '').toString();
                    const idb = (b.arxivId || '').toString();
                    return idb.localeCompare(ida, 'en', { numeric: true });
                });
            });

            renderGroupedContent('Seeds', groups, mode, container, tocBox);
        }

    } catch (err) {
        container.innerHTML = `<p class="muted">Failed to load ${label}. Ensure <code>${url}</code> exists.</p>`;
        summary.textContent = '';
    }
}

function renderGroupedContent(title, groups, mode, container, tocBox) {
    // 渲染目录
    const toc = document.createElement('nav');
    toc.className = 'toc';
    toc.innerHTML = `<h4>${title}</h4><ul></ul>`;
    const tocList = toc.querySelector('ul');
    tocBox.appendChild(toc);

    // 渲染每个分组
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

        // 卡片区
        const groupDiv = document.createElement('div');
        groupDiv.className = 'cards';
        papers.forEach(renderPaperCard(groupDiv));
        container.appendChild(groupDiv);
    });
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

// 主题切换
const themeToggle = document.getElementById('theme-toggle');

// 初始化：根据 localStorage 或系统偏好
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeToggle.textContent = savedTheme === "dark" ? "🌙 Dark" : "🌞 Light";
} else if (prefersDark) {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "🌙 Dark";
} else {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggle.textContent = "🌞 Light";
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    themeToggle.textContent = newTheme === "dark" ? "🌙 Dark" : "🌞 Light";
});