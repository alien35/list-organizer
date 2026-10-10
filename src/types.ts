/**
 * Types for Hierarchical Feature Refinement & Cognitive Information Architecture
 * Rooted in Miller (1956) 7±2, Kang et al. (1990), Wei et al. (2024),
 * Larson & Czerwinski (1998), and Requirements Traceability.
 */

export interface TraceabilityReference {
  source: string;
  url?: string;
  quote?: string;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  why_it_matters?: string;
  status?: Record<string, boolean>;
  references?: TraceabilityReference[];
  tags?: string[];
}

export interface CapabilityDomain {
  id: string;
  name: string;
  icon?: string;
  consumer_benefit: string;
  capabilities: Capability[];
}

export interface HierarchyRoot {
  root_scope?: string;
  description?: string;
  domains: CapabilityDomain[];
  metadata?: Record<string, unknown>;
}

export interface RawListItem {
  raw: string;
  name: string;
  description?: string;
  category?: string;
  why_it_matters?: string;
  status?: Record<string, boolean>;
  references?: TraceabilityReference[];
}

export interface DomainMetric {
  id: string;
  name: string;
  count: number;
  exceedsMillerLimit: boolean; // count > 9 (Miller upper bound)
  belowMillerOptimal: boolean; // count < 3
  isMillerOptimal: boolean;    // 3 <= count <= 7 (or 9)
}

export interface JtbdViolation {
  domainId: string;
  domainName: string;
  detectedPattern: string;
  suggestedOutcome: string;
}

export interface CognitiveValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  metrics: {
    totalDomains: number;
    totalCapabilities: number;
    depth: number;
    averageCapabilitiesPerDomain: number;
    domainsExceedingMillerLimit: number;
    jtbdViolationsCount: number;
    cognitiveLoadScore: number; // 0-100 (100 is optimal HCI scannability)
    domainMetrics: DomainMetric[];
    jtbdViolations: JtbdViolation[];
  };
}

export interface ProductCoverage {
  count: number;
  percentage: number;
}

export interface DomainRollup {
  domainId: string;
  domainName: string;
  icon?: string;
  consumerBenefit: string;
  totalCapabilities: number;
  coverage: Record<string, ProductCoverage>;
  gaps: Record<string, string[]>; // product -> list of capability names it lacks
  differentiators: string[]; // capabilities our_app has that all competitors lack
}

export interface HierarchyRollup {
  products: string[];
  totalCapabilities: number;
  domains: DomainRollup[];
  overallCoverage: Record<string, ProductCoverage>;
  headToHead?: Record<string, { wins: number; losses: number; ties: number }>;
}

export interface AgentContextPrompt {
  rootScope: string;
  superFeature: string;
  consumerBenefit: string;
  siblingFeatures: string[];
  instructions: string;
}
