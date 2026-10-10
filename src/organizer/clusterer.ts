import type { Capability, CapabilityDomain, HierarchyRoot, RawListItem } from '../types.ts';
import { formatCapabilityId, formatDomainId } from '../utils/id-generator.ts';
import { analyzeJtbdAlignment } from './jtbd-aligner.ts';

export interface ClusterOptions {
  rootScope?: string;
  description?: string;
  maxChildrenPerDomain?: number; // Miller upper bound (default: 7, max: 9)
  targetDomainCount?: number;    // Miller sweet spot (default: 5)
  defaultProduct?: string;
}

export function clusterFlatList(
  items: RawListItem[], 
  options: ClusterOptions = {}
): HierarchyRoot {
  const maxChildren = Math.min(options.maxChildrenPerDomain || 7, 9);
  const rootScope = options.rootScope || 'Application Capabilities';

  // 1. Group items directly by normalized JTBD outcome domains
  const buckets = new Map<string, { items: RawListItem[]; icon: string; benefit: string }>();

  for (const item of items) {
    let rawCategory = item.category;
    if (!rawCategory) {
      rawCategory = classifyItemHeuristic(item);
    }

    const jtbd = analyzeJtbdAlignment(rawCategory);
    const domainName = jtbd.suggestedName;

    if (!buckets.has(domainName)) {
      buckets.set(domainName, {
        items: [],
        icon: jtbd.icon,
        benefit: jtbd.consumerBenefit
      });
    }

    buckets.get(domainName)!.items.push(item);
  }

  // 2. Enforce Miller's 7±2 rule per domain
  const refinedDomains: CapabilityDomain[] = [];
  let dIndex = 0;

  for (const [domainName, bucket] of buckets.entries()) {
    const bucketItems = bucket.items;

    if (bucketItems.length <= maxChildren) {
      const domainId = formatDomainId(dIndex++);
      const capabilities = bucketItems.map((item, cIndex) => 
        buildCapability(domainId, dIndex - 1, cIndex, item, options.defaultProduct)
      );

      refinedDomains.push({
        id: domainId,
        name: domainName,
        icon: bucket.icon,
        consumer_benefit: bucket.benefit,
        capabilities
      });
    } else {
      // Chunk to respect Miller limit
      const chunks: RawListItem[][] = [];
      for (let i = 0; i < bucketItems.length; i += maxChildren) {
        chunks.push(bucketItems.slice(i, i + maxChildren));
      }

      chunks.forEach((chunk, chunkIdx) => {
        const subName = chunks.length > 1 ? `${domainName} (Part ${chunkIdx + 1})` : domainName;
        const domainId = formatDomainId(dIndex++);
        const capabilities = chunk.map((item, cIndex) =>
          buildCapability(domainId, dIndex - 1, cIndex, item, options.defaultProduct)
        );

        refinedDomains.push({
          id: domainId,
          name: subName,
          icon: bucket.icon,
          consumer_benefit: bucket.benefit,
          capabilities
        });
      });
    }
  }

  // 3. Balance domains if needed (keep 3–7 sweet spot)
  if (refinedDomains.length > 7) {
    mergeMicroDomains(refinedDomains, maxChildren);
  }

  return {
    root_scope: rootScope,
    description: options.description || `Hierarchical capability decomposition for ${rootScope}.`,
    domains: refinedDomains
  };
}

function buildCapability(
  domainId: string, 
  domainIdx: number, 
  capIdx: number, 
  item: RawListItem,
  defaultProduct?: string
): Capability {
  const capId = formatCapabilityId(domainIdx, capIdx);
  const status = item.status || (defaultProduct ? { [defaultProduct]: true } : { our_app: true });

  return {
    id: capId,
    name: item.name,
    description: item.description || `Executes ${item.name.toLowerCase()} for transaction participants.`,
    why_it_matters: item.why_it_matters || `Delivers high reliability and customer value for ${item.name.toLowerCase()}.`,
    status,
    references: item.references || []
  };
}

function classifyItemHeuristic(item: RawListItem): string {
  const text = `${item.name} ${item.description || ''} ${item.why_it_matters || ''}`.toLowerCase();

  if (/compliance|audit|certificate|tamper|kyc|notary journal|legal|court|seal|log|statutory/i.test(text)) {
    return "Legal Compliance & Security";
  }
  if (/speed|instant|mobile|tablet|signature|sign|quick|in-person|offline|guest/i.test(text)) {
    return "Signing Experience & Speed";
  }
  if (/biometric|id check|government id|identity|facial|kba|knowledge-based|credential|passport|driver license/i.test(text)) {
    return "Signer Trust & Identity Verification";
  }
  if (/pdf|template|tag|field|merge|editor|fillable|form|detect/i.test(text)) {
    return "Document Preparation & Automation";
  }
  if (/payment|billing|stripe|fee|invoicing|deposit|escrow/i.test(text)) {
    return "Seamless Payments & Flexible Checkout";
  }
  if (/notification|email|sms|webhook|alert|reminder/i.test(text)) {
    return "Real-Time Updates & Proactive Alerts";
  }
  if (/analytics|report|metrics|dashboard|turnaround|completion rate/i.test(text)) {
    return "Operational Oversight & Performance Analytics";
  }
  if (/api|sdk|crm|webhook|integration|rest/i.test(text)) {
    return "Ecosystem & Workflow Integration";
  }

  return "Core Capabilities";
}

function mergeMicroDomains(domains: CapabilityDomain[], maxLimit: number): void {
  const microIndices = domains
    .map((d, i) => ({ i, count: d.capabilities.length }))
    .filter(d => d.count <= 2)
    .map(d => d.i);

  if (microIndices.length >= 2 && domains.length > 5) {
    const firstIdx = microIndices[0];
    const targetDomain = domains[firstIdx];
    targetDomain.name = "Operational Platform & Enablement";
    targetDomain.icon = "⚙️";
    targetDomain.consumer_benefit = "Integrated infrastructure enabling seamless end-to-end execution.";

    for (let j = microIndices.length - 1; j >= 1; j--) {
      const idxToRemove = microIndices[j];
      const donor = domains[idxToRemove];
      if (targetDomain.capabilities.length + donor.capabilities.length <= maxLimit) {
        targetDomain.capabilities.push(...donor.capabilities);
        domains.splice(idxToRemove, 1);
      }
    }

    // Re-index remaining domains
    domains.forEach((d, i) => {
      d.id = formatDomainId(i);
      d.capabilities.forEach((c, cIdx) => {
        c.id = formatCapabilityId(i, cIdx);
      });
    });
  }
}
