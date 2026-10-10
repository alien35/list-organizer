import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { renderToMarkdown } from '../src/renderer/markdown.ts';
import { renderToInteractiveHtml } from '../src/renderer/html.ts';
import type { HierarchyRoot } from '../src/types.ts';

describe('Renderers', () => {
  const root: HierarchyRoot = {
    root_scope: "Digital Notary",
    domains: [
      {
        id: "DOM-01",
        name: "Legal Compliance & Security",
        icon: "🛡️",
        consumer_benefit: "Ensure every transaction is audit-ready and tamper-proof.",
        capabilities: [
          {
            id: "CAP-011",
            name: "Tamper-Evident Certificate",
            description: "Signed PDF summary",
            why_it_matters: "Proof of integrity for court disputes",
            status: { our_app: true, competitor_a: true },
            references: [{ source: "CompA Docs", url: "https://example.com" }]
          }
        ]
      }
    ]
  };

  it('renders markdown table with emojis and status marks', () => {
    const md = renderToMarkdown(root);
    assert.ok(md.includes('### 🛡️ Legal Compliance & Security'));
    assert.ok(md.includes('*Ensure every transaction is audit-ready and tamper-proof.*'));
    assert.ok(md.includes('| Capability | Our App | Competitor A | Why It Matters | Evidence |'));
    assert.ok(md.includes('**Tamper-Evident Certificate**'));
    assert.ok(md.includes('[CompA Docs ↗](https://example.com)'));
  });

  it('renders interactive HTML component', () => {
    const html = renderToInteractiveHtml(root);
    assert.ok(html.includes('class="tab-btn active"'));
    assert.ok(html.includes('Tamper-Evident Certificate'));
    assert.ok(html.includes('function selectDomain'));
  });
});
