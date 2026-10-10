import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { clusterFlatList } from '../src/organizer/clusterer.ts';
import { parseRawList } from '../src/parser/text-parser.ts';

describe('Clusterer', () => {
  it('enforces Miller 7±2 law and subdivides large buckets', () => {
    const items = [];
    for (let i = 1; i <= 15; i++) {
      items.push({
        raw: `Feature ${i}`,
        name: `Audit Certificate Rule ${i}`,
        description: `Audit compliance rule ${i}`,
        category: "Legal Compliance & Security"
      });
    }

    const hierarchy = clusterFlatList(items, { maxChildrenPerDomain: 7 });
    // 15 items with max 7 should be split into multiple chunks
    assert.ok(hierarchy.domains.length >= 2);
    for (const d of hierarchy.domains) {
      assert.ok(d.capabilities.length <= 7, `Domain ${d.name} has ${d.capabilities.length} > 7`);
    }
  });

  it('assigns standardized DOM-XX and CAP-XX IDs', () => {
    const raw = `
- Audit Trail: Immutable event log
- Instant Signing: Sign on mobile
    `;
    const items = parseRawList(raw);
    const hierarchy = clusterFlatList(items);

    assert.ok(hierarchy.domains[0].id.startsWith('DOM-'));
    assert.ok(hierarchy.domains[0].capabilities[0].id.startsWith('CAP-'));
  });
});
