import type { CognitiveValidationResult, DomainMetric, HierarchyRoot, JtbdViolation } from '../types.ts';
import { analyzeJtbdAlignment } from '../organizer/jtbd-aligner.ts';

/**
 * Cognitive Science & Information Architecture Validator
 * Enforces Miller (1956), Larson & Czerwinski (1998), Wei et al. (2024),
 * and Jobs-To-Be-Done principles.
 */

export function validateHierarchy(root: HierarchyRoot): CognitiveValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const domainMetrics: DomainMetric[] = [];
  const jtbdViolations: JtbdViolation[] = [];

  const domains = root.domains || [];
  const totalDomains = domains.length;
  let totalCapabilities = 0;
  let domainsExceedingMiller = 0;

  // 1. Structure & Depth Checks (Larson & Czerwinski 1998)
  let depth = 0;
  if (root.root_scope) depth = 1;
  if (totalDomains > 0) depth = Math.max(depth, 2);
  const hasCapabilities = domains.some(d => d.capabilities && d.capabilities.length > 0);
  if (hasCapabilities) depth = 3;

  if (totalDomains === 0) {
    errors.push("Hierarchy has no Level 1 domains. A flat list fails cognitive scannability beyond 7±2 items (Miller, 1956).");
  } else if (totalDomains > 9) {
    errors.push(`Hierarchy contains ${totalDomains} domains, exceeding Miller's 7±2 upper limit (max 9). Readers cannot build a coherent mental model.`);
  } else if (totalDomains > 7) {
    warnings.push(`Hierarchy contains ${totalDomains} domains. Consider consolidating to the 3–7 domain sweet spot for faster scannability.`);
  } else if (totalDomains < 2) {
    warnings.push(`Hierarchy contains only ${totalDomains} domain. A single domain offers no architectural differentiation.`);
  }

  // 2. Domain & Capability Level Checks
  for (const domain of domains) {
    const caps = domain.capabilities || [];
    const count = caps.length;
    totalCapabilities += count;

    const exceedsLimit = count > 9;
    const isWarningLimit = count > 7;
    const belowLimit = count < 3;
    const isOptimal = count >= 3 && count <= 7;

    if (exceedsLimit) {
      domainsExceedingMiller++;
      errors.push(`Domain "${domain.name}" (${domain.id}) contains ${count} capabilities, exceeding Miller's 7±2 ceiling (max 9). Subdivide into focused sub-domains.`);
    } else if (isWarningLimit) {
      warnings.push(`Domain "${domain.name}" (${domain.id}) contains ${count} capabilities. The optimal cognitive range is 3–7 items.`);
    }

    if (belowLimit && totalDomains > 3) {
      warnings.push(`Domain "${domain.name}" (${domain.id}) has only ${count} items. Consider grouping with a related domain to maintain balanced breadth.`);
    }

    domainMetrics.push({
      id: domain.id,
      name: domain.name,
      count,
      exceedsMillerLimit: exceedsLimit,
      belowMillerOptimal: belowLimit,
      isMillerOptimal: isOptimal
    });

    // 3. Jobs-To-Be-Done (JTBD) Naming Check
    const jtbd = analyzeJtbdAlignment(domain.name);
    if (jtbd.isEngineeringCentric) {
      const violation: JtbdViolation = {
        domainId: domain.id,
        domainName: domain.name,
        detectedPattern: jtbd.matchedPattern || 'internal module naming',
        suggestedOutcome: jtbd.suggestedName
      };
      jtbdViolations.push(violation);
      warnings.push(`Domain "${domain.name}" appears engineering-centric (matched "${violation.detectedPattern}"). Rephrase around customer outcome, e.g., "${violation.suggestedOutcome}".`);
    }

    // Consumer benefit check
    if (!domain.consumer_benefit || domain.consumer_benefit.trim().length < 10) {
      warnings.push(`Domain "${domain.name}" (${domain.id}) is missing an outcome-oriented 'consumer_benefit' statement.`);
    }

    // 4. Atomic Capability Validation
    for (const cap of caps) {
      if (!cap.name || cap.name.trim().length === 0) {
        errors.push(`Capability in domain "${domain.name}" has an empty name.`);
      }
      if (!cap.description || cap.description.trim().length < 10) {
        warnings.push(`Capability "${cap.name}" (${cap.id}) has an underspecified description. Provide a concrete operational definition.`);
      }

      // References integrity
      if (cap.references && cap.references.length > 0) {
        for (const ref of cap.references) {
          if (!ref.source || ref.source.trim().length === 0) {
            warnings.push(`Capability "${cap.name}" has a reference missing 'source'.`);
          }
          if (ref.url && !ref.url.startsWith('http://') && !ref.url.startsWith('https://')) {
            warnings.push(`Capability "${cap.name}" reference URL "${ref.url}" should include http:// or https:// protocol.`);
          }
        }
      }
    }
  }

  // 3. Compute Cognitive Load Score (0 - 100)
  let score = 100;
  score -= errors.length * 15;
  score -= warnings.length * 4;
  score -= jtbdViolations.length * 5;
  if (totalDomains > 9) score -= 15;
  if (domainsExceedingMiller > 0) score -= (domainsExceedingMiller * 10);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const avgCaps = totalDomains > 0 ? Number((totalCapabilities / totalDomains).toFixed(1)) : 0;

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    metrics: {
      totalDomains,
      totalCapabilities,
      depth,
      averageCapabilitiesPerDomain: avgCaps,
      domainsExceedingMillerLimit: domainsExceedingMiller,
      jtbdViolationsCount: jtbdViolations.length,
      cognitiveLoadScore: score,
      domainMetrics,
      jtbdViolations
    }
  };
}
