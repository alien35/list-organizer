import type { CapabilityDomain, DomainRollup, HierarchyRollup, HierarchyRoot, ProductCoverage } from '../types.ts';

export function computeHierarchyRollup(root: HierarchyRoot): HierarchyRollup {
  // 1. Collect all products
  const productSet = new Set<string>();
  for (const domain of root.domains) {
    for (const cap of domain.capabilities) {
      if (cap.status) {
        Object.keys(cap.status).forEach(p => productSet.add(p));
      }
    }
  }

  const products = Array.from(productSet);
  if (products.length === 0) {
    products.push('our_app');
  }

  const domainRollups: DomainRollup[] = [];
  const overallCounts: Record<string, number> = {};
  products.forEach(p => (overallCounts[p] = 0));
  let totalCaps = 0;

  for (const domain of root.domains) {
    const caps = domain.capabilities || [];
    const count = caps.length;
    totalCaps += count;

    const coverage: Record<string, ProductCoverage> = {};
    const gaps: Record<string, string[]> = {};
    const differentiators: string[] = [];

    products.forEach(p => {
      coverage[p] = { count: 0, percentage: 0 };
      gaps[p] = [];
    });

    for (const cap of caps) {
      const status = cap.status || {};
      const ourHasIt = status['our_app'] === true;

      // Check if differentiator
      let othersHaveIt = false;
      for (const p of products) {
        if (p !== 'our_app' && status[p] === true) {
          othersHaveIt = true;
        }
      }
      if (ourHasIt && !othersHaveIt && products.length > 1) {
        differentiators.push(cap.name);
      }

      // Count coverage & gaps
      for (const p of products) {
        if (status[p] === true) {
          coverage[p].count++;
          overallCounts[p]++;
        } else {
          gaps[p].push(cap.name);
        }
      }
    }

    // Compute percentages
    for (const p of products) {
      coverage[p].percentage = count > 0 
        ? Math.round((coverage[p].count / count) * 100) 
        : 0;
    }

    domainRollups.push({
      domainId: domain.id,
      domainName: domain.name,
      icon: domain.icon,
      consumerBenefit: domain.consumer_benefit,
      totalCapabilities: count,
      coverage,
      gaps,
      differentiators
    });
  }

  // Compute overall coverage
  const overallCoverage: Record<string, ProductCoverage> = {};
  for (const p of products) {
    overallCoverage[p] = {
      count: overallCounts[p],
      percentage: totalCaps > 0 ? Math.round((overallCounts[p] / totalCaps) * 100) : 0
    };
  }

  // Compute head-to-head for our_app vs competitors
  const headToHead: Record<string, { wins: number; losses: number; ties: number }> = {};
  if (products.includes('our_app')) {
    for (const p of products) {
      if (p === 'our_app') continue;
      let wins = 0;
      let losses = 0;
      let ties = 0;

      for (const domain of root.domains) {
        for (const cap of domain.capabilities) {
          const ourStatus = cap.status?.['our_app'] === true;
          const theirStatus = cap.status?.[p] === true;

          if (ourStatus && !theirStatus) wins++;
          else if (!ourStatus && theirStatus) losses++;
          else ties++;
        }
      }

      headToHead[p] = { wins, losses, ties };
    }
  }

  return {
    products,
    totalCapabilities: totalCaps,
    domains: domainRollups,
    overallCoverage,
    headToHead
  };
}
