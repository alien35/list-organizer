import type { HierarchyRoot, CapabilityDomain } from '../types.ts';

export function renderToInteractiveHtml(root: HierarchyRoot): string {
  const title = root.root_scope || 'Feature Capability Matrix';
  const subtitle = root.description || 'Hierarchical Feature Refinement & Competitive Comparison';

  // Gather products
  const productSet = new Set<string>();
  for (const domain of root.domains) {
    for (const cap of domain.capabilities) {
      if (cap.status) {
        Object.keys(cap.status).forEach(p => productSet.add(p));
      }
    }
  }
  const products = Array.from(productSet);
  if (products.length === 0) products.push('our_app', 'competitor_a');

  const domainTabs = root.domains.map((d, i) => `
    <button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="selectDomain(${i})">
      <span class="tab-icon">${d.icon || '📁'}</span>
      <span class="tab-name">${escapeHtml(d.name)}</span>
      <span class="tab-badge">${d.capabilities.length}</span>
    </button>
  `).join('\n');

  const domainPanels = root.domains.map((d, i) => `
    <div id="domain-panel-${i}" class="domain-panel ${i === 0 ? 'active' : ''}">
      <div class="domain-header">
        <div class="domain-title">
          <span class="header-icon">${d.icon || '📁'}</span>
          <h3>${escapeHtml(d.name)}</h3>
        </div>
        <p class="consumer-benefit"><em>"${escapeHtml(d.consumer_benefit)}"</em></p>
      </div>

      <div class="table-container">
        <table class="capability-table">
          <thead>
            <tr>
              <th class="col-cap">Capability</th>
              ${products.map(p => `<th class="col-prod">${formatProduct(p)}</th>`).join('')}
              <th class="col-why">Why It Matters</th>
              <th class="col-evidence">Evidence</th>
            </tr>
          </thead>
          <tbody>
            ${d.capabilities.map(cap => `
              <tr class="capability-row">
                <td class="cell-name">
                  <strong>${escapeHtml(cap.name)}</strong>
                  <div class="cap-desc">${escapeHtml(cap.description)}</div>
                </td>
                ${products.map(p => {
                  const val = cap.status ? cap.status[p] : undefined;
                  const icon = val === true ? '<span class="status-yes">✅</span>' : 
                               val === false ? '<span class="status-no">❌</span>' : '<span class="status-na">—</span>';
                  return `<td class="cell-status">${icon}</td>`;
                }).join('')}
                <td class="cell-why">${escapeHtml(cap.why_it_matters || '—')}</td>
                <td class="cell-evidence">
                  ${(cap.references && cap.references.length > 0) ? cap.references.map(r => `
                    <div class="ref-link">
                      ${r.url ? `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.source)} ↗</a>` : escapeHtml(r.source)}
                      ${r.quote ? `<div class="ref-quote">"${escapeHtml(r.quote)}"</div>` : ''}
                    </div>
                  `).join('') : '<span class="text-muted">—</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --accent: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 2rem 1.5rem; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { margin-bottom: 2rem; }
    h1 { font-size: 1.875rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
    .subtitle { color: var(--text-muted); font-size: 1rem; }
    
    .tab-bar { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; }
    .tab-btn { background: var(--card-bg); border: 1px solid var(--border); color: var(--text-muted); padding: 0.625rem 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 500; font-size: 0.875rem; transition: all 0.2s ease; }
    .tab-btn:hover { background: #2df; color: #000; border-color: #2df; }
    .tab-btn.active { background: #38bdf8; color: #0f172a; border-color: #38bdf8; font-weight: 600; }
    .tab-badge { background: rgba(0,0,0,0.2); padding: 0.125rem 0.375rem; border-radius: 12px; font-size: 0.75rem; }
    
    .domain-panel { display: none; }
    .domain-panel.active { display: block; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    .domain-header { background: var(--card-bg); padding: 1.25rem 1.5rem; border-radius: 10px 10px 0 0; border: 1px solid var(--border); border-bottom: none; }
    .domain-title { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; font-size: 1.25rem; font-weight: 600; }
    .consumer-benefit { color: #38bdf8; font-size: 0.95rem; }

    .table-container { overflow-x: auto; background: var(--card-bg); border: 1px solid var(--border); border-radius: 0 0 10px 10px; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #131d2e; padding: 0.875rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    td { padding: 1rem; border-bottom: 1px solid rgba(51, 65, 85, 0.4); font-size: 0.875rem; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    
    .col-cap { width: 30%; }
    .col-prod { text-align: center; width: 12%; }
    .cell-status { text-align: center; font-size: 1.1rem; }
    .col-why { width: 26%; }
    .col-evidence { width: 20%; }

    .cap-desc { font-size: 0.785rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: normal; }
    .ref-link a { color: #38bdf8; text-decoration: none; font-weight: 500; font-size: 0.8rem; }
    .ref-link a:hover { text-decoration: underline; }
    .ref-quote { font-size: 0.725rem; color: var(--text-muted); font-style: italic; margin-top: 0.2rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
    </header>

    <div class="tab-bar">
      ${domainTabs}
    </div>

    ${domainPanels}
  </div>

  <script>
    function selectDomain(index) {
      document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
      });
      document.querySelectorAll('.domain-panel').forEach((panel, i) => {
        panel.classList.toggle('active', i === index);
      });
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatProduct(p: string): string {
  if (p === 'our_app') return 'Our App';
  if (p === 'competitor_a') return 'Competitor A';
  return p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
