import type { HierarchyRoot, CapabilityDomain, Capability } from '../types.ts';

export interface MarkdownRenderOptions {
  includeTitle?: boolean;
  products?: string[];
  productLabels?: Record<string, string>;
}

export function renderToMarkdown(root: HierarchyRoot, options: MarkdownRenderOptions = {}): string {
  const sections: string[] = [];

  if (options.includeTitle && root.root_scope) {
    sections.push(`# ${root.root_scope}\n`);
    if (root.description) {
      sections.push(`> ${root.description}\n`);
    }
  }

  // Determine all products evaluated across the hierarchy
  const productSet = new Set<string>();
  if (options.products && options.products.length > 0) {
    options.products.forEach(p => productSet.add(p));
  } else {
    for (const domain of root.domains) {
      for (const cap of domain.capabilities) {
        if (cap.status) {
          Object.keys(cap.status).forEach(p => productSet.add(p));
        }
      }
    }
  }

  const products = Array.from(productSet);
  if (products.length === 0) {
    products.push('our_app', 'competitor_a');
  }

  const domainBlocks = root.domains.map((domain, index) => {
    return renderDomainSection(domain, products, options.productLabels);
  });

  return sections.concat(domainBlocks.join('\n\n---\n\n')).join('\n');
}

function renderDomainSection(
  domain: CapabilityDomain, 
  products: string[],
  labels?: Record<string, string>
): string {
  const lines: string[] = [];
  const icon = domain.icon ? `${domain.icon} ` : '';

  lines.push(`### ${icon}${domain.name}`);
  if (domain.consumer_benefit) {
    lines.push(`*${domain.consumer_benefit}*`);
  }
  lines.push('');

  // Table header
  const headers = ['Capability'];
  const alignments = [':---'];

  for (const prod of products) {
    const label = labels?.[prod] || formatProductLabel(prod);
    headers.push(label);
    alignments.push(':---:');
  }

  headers.push('Why It Matters', 'Evidence');
  alignments.push(':---', ':---');

  lines.push(`| ${headers.join(' | ')} |`);
  lines.push(`| ${alignments.join(' | ')} |`);

  // Table rows
  for (const cap of domain.capabilities) {
    const rowCols: string[] = [];
    rowCols.push(`**${cap.name}**`);

    for (const prod of products) {
      const val = cap.status ? cap.status[prod] : undefined;
      if (val === true) rowCols.push('✅');
      else if (val === false) rowCols.push('❌');
      else rowCols.push('—');
    }

    const why = cap.why_it_matters || cap.description || 'Core workflow capability';
    rowCols.push(escapePipes(why));

    // Evidence column
    if (cap.references && cap.references.length > 0) {
      const refLinks = cap.references.map(ref => {
        if (ref.url) {
          return `[${ref.source} ↗](${ref.url})`;
        }
        return ref.source;
      });
      rowCols.push(refLinks.join(', '));
    } else {
      rowCols.push('—');
    }

    lines.push(`| ${rowCols.join(' | ')} |`);
  }

  return lines.join('\n');
}

function formatProductLabel(key: string): string {
  if (key === 'our_app') return 'Our App';
  if (key === 'competitor_a') return 'Competitor A';
  if (key === 'competitor_b') return 'Competitor B';

  return key
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function escapePipes(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}
