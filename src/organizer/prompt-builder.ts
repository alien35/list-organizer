import type { CapabilityDomain, HierarchyRoot } from '../types.ts';

/**
 * Hierarchical Context Prompt Builder
 * Implements the empirical prompting architecture from Wei et al. (2024).
 * Passing Root + Super-Feature (Parent) + Sibling Features guarantees
 * 100% valid parent-child relationships and avoids redundant feature sprawl.
 */

export interface PromptContextParams {
  rootScope: string;
  superFeature: string;
  consumerBenefit?: string;
  siblingFeatures?: string[];
  candidateFeatures?: string[];
  competitors?: string[];
}

export function buildHierarchicalFeaturePrompt(params: PromptContextParams): string {
  const siblingsText = params.siblingFeatures && params.siblingFeatures.length > 0
    ? params.siblingFeatures.map(s => `  - ${s}`).join('\n')
    : '  (None yet; this is the first sub-feature in this domain)';

  const candidatesText = params.candidateFeatures && params.candidateFeatures.length > 0
    ? `\nCandidate flat items to organize/refine into this domain:\n${params.candidateFeatures.map(c => `  - ${c}`).join('\n')}`
    : '';

  const competitorText = params.competitors && params.competitors.length > 0
    ? `\nTarget products for boolean status evaluation: ${params.competitors.join(', ')}`
    : '';

  return `You are an expert Requirements Engineer and Cognitive Information Architect.
Following Wei et al. (2024) and Miller (1956), you structure capabilities using Hierarchical Feature Refinement.

### Context
1. Root Application Scope (Level 0):
   "${params.rootScope}"

2. Super-Feature / Parent Domain (Level 1):
   "${params.superFeature}"
   Consumer Benefit (JTBD): "${params.consumerBenefit || 'Deliver core user outcome'}"

3. Existing Sibling Sub-Features (Level 2 Context):
${siblingsText}
${candidatesText}
${competitorText}

### Instructions
Generate or organize atomic, verifiable sub-features (Level 2) strictly under this Super-Feature:
1. Cognitive Limit: Ensure the total number of sub-features in this domain does not exceed 7±2 (hard maximum 9).
2. Parent-Child Coherence: Every sub-feature must be an enabling capability directly contributing to the Super-Feature's Jobs-To-Be-Done benefit.
3. Non-Redundancy: Do NOT duplicate or heavily overlap with the existing sibling features listed above.
4. Operational Precision: Write an operational description ("What it executes") and "Why It Matters" (consumer value).
5. Grounding: Provide source evidence links where available.

### Output YAML Format:
\`\`\`yaml
capabilities:
  - id: CAP-011
    name: "Sub-Feature Name"
    description: "Operational definition of what it executes."
    why_it_matters: "Customer outcome or commercial benefit."
    status:
      our_app: true
      competitor_a: false
    references:
      - source: "Source documentation or URL"
        url: "https://example.com"
        quote: "Direct quotation demonstrating support"
\`\`\``;
}

/**
 * Builds a prompt to reorganize a flat list into the full two-level hierarchy
 */
export function buildFullHierarchyPrompt(
  rootScope: string, 
  rawItems: string[],
  competitors: string[] = ['our_app', 'competitor_a']
): string {
  return `You are an expert AI agent specializing in Hierarchical Feature Refinement (Kang et al., 1990; Wei et al., 2024) and Cognitive Information Architecture (Miller, 1956; Larson & Czerwinski, 1998).

Your task is to transform the unorganized flat list below into a 2-tier Hierarchical Feature Registry.

### Flat Unorganized List:
${rawItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

### Strict Cognitive Constraints:
1. 2-Tier Structure (Level 0 Root -> Level 1 Domains -> Level 2 Atomic Capabilities).
2. Miller's 7±2 Rule:
   - Root must have 3 to 7 parent domains (max 9).
   - Each domain must have 3 to 7 child capabilities (max 9). Never place >9 items in any domain.
3. Jobs-To-Be-Done (JTBD) Parent Naming:
   - ❌ Anti-pattern: Naming parents after engineering modules (e.g., "Database & S3 Infrastructure", "Auth Backend").
   - ✅ Outcome: Name parents after customer outcomes (e.g., "Data Safety & Peace of Mind", "Signer Trust & Identity Verification").
4. Operational Precision:
   - Children must be atomic and verifiable with concrete operational definitions.
5. Deterministic Boolean Flags:
   - Provide status for each target: ${competitors.join(', ')}.

Output your final hierarchy in standard YAML matching:
\`\`\`yaml
root_scope: "${rootScope}"
domains:
  - id: DOM-01
    name: "Customer Outcome Domain Name"
    icon: "🛡️"
    consumer_benefit: "High-level promise for this capability cluster."
    capabilities:
      - id: CAP-011
        name: "Atomic Capability Name"
        description: "Exact operational description of what is executed."
        why_it_matters: "Why the customer or buyer cares."
        status:
          ${competitors.map(c => `${c}: true`).join('\n          ')}
        references: []
\`\`\``;
}
