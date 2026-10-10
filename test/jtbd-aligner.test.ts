import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { analyzeJtbdAlignment } from '../src/organizer/jtbd-aligner.ts';

describe('JTBD Aligner', () => {
  it('detects engineering-centric database infrastructure names', () => {
    const result = analyzeJtbdAlignment("Database & S3 Infrastructure");
    assert.strictEqual(result.isEngineeringCentric, true);
    assert.strictEqual(result.suggestedName, "Data Safety & Peace of Mind");
  });

  it('detects auth and credential infrastructure names', () => {
    const result = analyzeJtbdAlignment("Authentication & IAM Service");
    assert.strictEqual(result.isEngineeringCentric, true);
    assert.strictEqual(result.suggestedName, "Signer Trust & Identity Verification");
  });

  it('approves customer-facing outcome domains', () => {
    const result = analyzeJtbdAlignment("Signing Experience & Speed");
    assert.strictEqual(result.isEngineeringCentric, false);
    assert.strictEqual(result.suggestedName, "Signing Experience & Speed");
  });
});
