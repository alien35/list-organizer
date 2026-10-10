import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { computeHierarchyRollup } from '../src/analytics/rollup.ts';
import type { HierarchyRoot } from '../src/types.ts';

describe('Analytics & Rollup', () => {
  const root: HierarchyRoot = {
    root_scope: "Digital Notary",
    domains: [
      {
        id: "DOM-01",
        name: "Signing Experience & Speed",
        consumer_benefit: "Fast signatures",
        capabilities: [
          {
            id: "CAP-011",
            name: "Instant Mobile Signing",
            description: "Hand phone on-site",
            status: { our_app: true, competitor_a: false }
          },
          {
            id: "CAP-012",
            name: "SMS Link",
            description: "Text message link",
            status: { our_app: true, competitor_a: true }
          }
        ]
      }
    ]
  };

  it('computes domain coverage and differentiators', () => {
    const rollup = computeHierarchyRollup(root);
    assert.strictEqual(rollup.totalCapabilities, 2);
    assert.strictEqual(rollup.domains[0].coverage.our_app.percentage, 100);
    assert.strictEqual(rollup.domains[0].coverage.competitor_a.percentage, 50);
    assert.deepStrictEqual(rollup.domains[0].differentiators, ['Instant Mobile Signing']);
    assert.strictEqual(rollup.headToHead?.competitor_a.wins, 1);
  });
});
