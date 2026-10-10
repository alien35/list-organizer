import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { validateHierarchy } from '../src/validator/linter.ts';
import type { HierarchyRoot } from '../src/types.ts';

describe('Cognitive Linter', () => {
  it('flags domains that exceed Miller 7±2 limit (>9 items)', () => {
    const badRoot: HierarchyRoot = {
      root_scope: "Test Scope",
      domains: [
        {
          id: "DOM-01",
          name: "Test Domain",
          consumer_benefit: "Valid benefit description",
          capabilities: Array.from({ length: 11 }, (_, i) => ({
            id: `CAP-01${i}`,
            name: `Capability ${i}`,
            description: "A valid operational description for this feature."
          }))
        }
      ]
    };

    const result = validateHierarchy(badRoot);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes("exceeding Miller's 7±2 ceiling")));
  });

  it('flags engineering-centric domain names', () => {
    const engRoot: HierarchyRoot = {
      root_scope: "Test Scope",
      domains: [
        {
          id: "DOM-01",
          name: "Database & S3 Infrastructure",
          consumer_benefit: "Storage system",
          capabilities: [
            {
              id: "CAP-011",
              name: "Automated Backups",
              description: "Hourly cloud snapshot backups."
            }
          ]
        }
      ]
    };

    const result = validateHierarchy(engRoot);
    assert.ok(result.metrics.jtbdViolationsCount > 0);
    assert.ok(result.warnings.some(w => w.includes("engineering-centric")));
  });
});
