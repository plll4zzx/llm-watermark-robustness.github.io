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
            // 先整体排序：year 降序 → arxivId 降序
            items.sort((a, b) => {
                const ya = a.year || 0, yb = b.year || 0;
                if (ya !== yb) return yb - ya;
                const ida = (a.arxivId || '').toString();
                const idb = (b.arxivId || '').toString();
                return idb.localeCompare(ida, 'en', { numeric: true });
            });

            // 分组
            const groups = {};
            items.forEach(p => {
                const y = p.year || 'Unknown Year';
                if (!groups[y]) groups[y] = [];
                groups[y].push(p);
            });

            // 🔹 转成数组并按“年份数值”降序；Unknown Year 放最后
            const orderedEntries = Object.entries(groups).sort(([a], [b]) => {
                const ya = a === 'Unknown Year' ? -Infinity : parseInt(a, 10);
                const yb = b === 'Unknown Year' ? -Infinity : parseInt(b, 10);
                return yb - ya; // 年份大的排前
            });

            // 直接把“数组 entries”传给渲染函数（保持你排序后的顺序）
            renderGroupedContent('Years', orderedEntries, mode, container, tocBox);
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

function renderGroupedContent(title, groupsOrEntries, mode, container, tocBox) {
    // 支持两种输入：数组 entries（优先，保序）或普通对象（无序）
    const entries = Array.isArray(groupsOrEntries)
        ? groupsOrEntries
        : Object.entries(groupsOrEntries);

    // 渲染目录
    const toc = document.createElement('nav');
    toc.className = 'toc';
    toc.innerHTML = `<h4>${title}</h4><ul></ul>`;
    const tocList = toc.querySelector('ul');
    tocBox.appendChild(toc);

    // 按 entries 的既定顺序渲染
    entries.forEach(([groupKey, papers], idx) => {
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

        // 小组内排序（稳妥起见再排一次）
        papers.sort((a, b) => {
            const ya = a.year || 0, yb = b.year || 0;
            if (ya !== yb) return yb - ya;
            const ida = (a.arxivId || '').toString();
            const idb = (b.arxivId || '').toString();
            return idb.localeCompare(ida, 'en', { numeric: true });
        });

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

const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {  // 滚动超过200px才显示
        backToTopBtn.style.display = 'block';
    } else {
        backToTopBtn.style.display = 'none';
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'  // 平滑滚动
    });
});

async function showProjects(mdFile, title) {
    const container = document.getElementById('project-container');
    const tocBox = document.getElementById('project-toc');

    container.innerHTML = '<p class="muted">Loading…</p>';
    tocBox.innerHTML = '';

    try {
        // 读取 markdown
        const res = await fetch(mdFile, { cache: 'no-store' });
        const text = await res.text();

        // 转成 HTML
        const html = marked.parse(text);

        // 插入内容
        container.innerHTML = html;

        // 🔹 生成目录
        const toc = document.createElement('nav');
        toc.className = 'toc';
        toc.innerHTML = `<h4>${title}</h4><ul></ul>`;
        const tocList = toc.querySelector('ul');

        // 抓取标题
        const headers = container.querySelectorAll('h1, h2, h3, h4');
        headers.forEach((h, idx) => {
            const id = `h-${idx}`;
            h.id = id;

            const li = document.createElement('li');
            li.style.marginLeft = `${(parseInt(h.tagName[1]) - 1) * 12}px`; // 按级别缩进
            li.innerHTML = `<a href="#${id}">${h.textContent}</a>`;
            tocList.appendChild(li);
        });

        tocBox.appendChild(toc);

    } catch (err) {
        container.innerHTML = `<p class="muted">Failed to load project doc.</p>`;
    }
}


async function showMarkdown(mdFile, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<p class="muted">Loading…</p>';

    try {
        const res = await fetch(mdFile, { cache: 'no-store' });
        const text = await res.text();
        const html = marked.parse(text);
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p class="muted">Failed to load ${mdFile}.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showProjects('projects/ndss26/char-ndss-en.md', 'Character-Level Perturbations Disrupt LLM Watermarks (NDSS)');
    showMarkdown('projects/about/cv.md', 'about-container');
});