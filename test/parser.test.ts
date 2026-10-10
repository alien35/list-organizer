import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { parseRawList } from '../src/parser/text-parser.ts';
import { parseHierarchy, stringifyYaml } from '../src/parser/yaml-parser.ts';

describe('Text Parser', () => {
  it('parses markdown bullet lists with colons and why it matters', () => {
    const raw = `
- Tamper-Evident Certificate: Generates signed PDF summary. Why it matters: Proof for court
- Instant Mobile Signing - Hand tablet to signers on site
    `;
    const items = parseRawList(raw);
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].name, 'Tamper-Evident Certificate');
    assert.strictEqual(items[0].description, 'Generates signed PDF summary.');
    assert.strictEqual(items[0].why_it_matters, 'Proof for court');
    assert.strictEqual(items[1].name, 'Instant Mobile Signing');
  });

  it('parses markdown checklists', () => {
    const raw = `
- [x] Biometric ID Verification: Scan passport
- [ ] SMS Notifications: Text signers
    `;
    const items = parseRawList(raw);
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].status?.our_app, true);
    assert.strictEqual(items[1].status?.our_app, false);
  });

  it('parses JSON array of feature objects or strings', () => {
    const raw = JSON.stringify([
      { name: "Audit Trail", description: "Immutable event log", why_it_matters: "Compliance" },
      "Mobile In-Person Signing"
    ]);
    const items = parseRawList(raw);
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].name, 'Audit Trail');
    assert.strictEqual(items[1].name, 'Mobile In-Person Signing');
  });
});

describe('YAML Parser & Serializer', () => {
  it('round-trips hierarchy yaml', () => {
    const yaml = `root_scope: "Digital Notary"
domains:
  - id: DOM-01
    name: "Legal Compliance & Security"
    icon: "🛡️"
    consumer_benefit: "Ensure every transaction is audit-ready."

    capabilities:
      - id: CAP-011
        name: "Audit Certificate"
        description: "Cryptographically signed summary."
        why_it_matters: "Proof in court"
        status:
          our_app: true
          competitor_a: false
        references:
          - source: "Official Docs"
            url: "https://example.com"
            quote: "Signed audit"
`;
    const parsed = parseHierarchy(yaml);
    assert.strictEqual(parsed.root_scope, 'Digital Notary');
    assert.strictEqual(parsed.domains.length, 1);
    assert.strictEqual(parsed.domains[0].capabilities.length, 1);
    assert.strictEqual(parsed.domains[0].capabilities[0].status?.our_app, true);
    assert.strictEqual(parsed.domains[0].capabilities[0].references?.length, 1);

    const serialized = stringifyYaml(parsed);
    assert.ok(serialized.includes('DOM-01'));
    assert.ok(serialized.includes('Audit Certificate'));
  });
});
