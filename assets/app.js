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
    const summary = $('#reading-summary');
    container.innerHTML = '<p class="muted">Loading…</p>';
    let url, label;
    if (mode === 'formal') { url = 'data/index.json'; label = 'Formal curated list'; }
    if (mode === 'latest') { url = 'data/candidates_latest.json'; label = 'Discovery by keywords'; }
    if (mode === 'cites') { url = 'data/candidates_citations.json'; label = 'Discovery by seed citations'; }
    try {
        const res = await fetch(url, { cache: 'no-store' });
        const items = await res.json();
        summary.textContent = `${label}: ${items.length} entries`;
        container.innerHTML = '';
        items.forEach(renderPaperCard(container));
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