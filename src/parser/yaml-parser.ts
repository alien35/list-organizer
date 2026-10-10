import type { HierarchyRoot, CapabilityDomain, Capability, TraceabilityReference } from '../types.ts';

/**
 * Robust Zero-Dependency YAML / JSON Serializer & Deserializer
 * specifically optimized for Hierarchical Feature Registries.
 */

export function parseHierarchy(content: string): HierarchyRoot {
  const trimmed = content.trim();
  if (!trimmed) {
    return { domains: [] };
  }

  // Attempt JSON parsing first if it starts with {
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.domains)) {
        return parsed as HierarchyRoot;
      }
      if (Array.isArray(parsed)) {
        return { domains: parsed as CapabilityDomain[] };
      }
    } catch {
      // Fall through to YAML parser
    }
  }

  return parseYamlHierarchy(trimmed);
}

function parseYamlHierarchy(yaml: string): HierarchyRoot {
  const lines = yaml.split(/\r?\n/);
  const result: HierarchyRoot = {
    domains: []
  };

  let currentDomain: Partial<CapabilityDomain> | null = null;
  let currentCap: Partial<Capability> | null = null;
  let currentRef: Partial<TraceabilityReference> | null = null;
  let currentSection: 'root' | 'domains' | 'domain' | 'capabilities' | 'capability' | 'status' | 'references' = 'root';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const indent = rawLine.search(/\S/);

    // Top level keys
    if (rawLine.startsWith('root_scope:')) {
      result.root_scope = cleanYamlValue(rawLine.replace(/^root_scope:/, ''));
      continue;
    }
    if (rawLine.startsWith('description:')) {
      result.description = cleanYamlValue(rawLine.replace(/^description:/, ''));
      continue;
    }
    if (/^domains:\s*$/.test(line)) {
      currentSection = 'domains';
      continue;
    }

    // Section transitions
    if (/^\s*capabilities:\s*$/.test(line)) {
      currentSection = 'capabilities';
      continue;
    }
    if (/^\s*status:\s*$/.test(line)) {
      currentSection = 'status';
      continue;
    }
    if (/^\s*references:\s*(\[\])?$/.test(line)) {
      if (currentRef && currentCap && currentCap.references) {
        currentCap.references.push(currentRef as TraceabilityReference);
        currentRef = null;
      }
      currentSection = 'references';
      continue;
    }

    // Detect Domain item (e.g. "  - id: DOM-01")
    const isDomainItem = (
      /^\s*-\s*id:\s*DOM-/i.test(line) ||
      (line.startsWith('- id:') && indent <= 4 && currentSection !== 'capabilities' && currentSection !== 'capability' && currentSection !== 'status' && currentSection !== 'references')
    );

    // Detect Capability item (e.g. "      - id: CAP-011")
    const isCapItem = !isDomainItem && (
      /^\s*-\s*id:\s*CAP-/i.test(line) ||
      (line.startsWith('- id:') && (currentSection === 'capabilities' || currentSection === 'capability' || currentSection === 'status' || currentSection === 'references' || indent > 4))
    );

    // Detect Reference item (e.g. "          - source: ...")
    const isRefItem = /^\s*-\s*source:\s*(.*)/.test(line);

    if (isDomainItem) {
      if (currentRef && currentCap && currentCap.references) {
        currentCap.references.push(currentRef as TraceabilityReference);
        currentRef = null;
      }
      if (currentCap && currentDomain && currentDomain.capabilities) {
        currentDomain.capabilities.push(finalizeCapability(currentCap));
        currentCap = null;
      }
      if (currentDomain) {
        result.domains.push(finalizeDomain(currentDomain));
      }

      const match = line.match(/^\s*-\s*id:\s*([^\n#]+)/);
      currentDomain = {
        id: cleanYamlValue(match ? match[1] : `DOM-${result.domains.length + 1}`),
        capabilities: []
      };
      currentSection = 'domain';
      continue;
    }

    if (isCapItem) {
      if (currentRef && currentCap && currentCap.references) {
        currentCap.references.push(currentRef as TraceabilityReference);
        currentRef = null;
      }
      if (currentCap && currentDomain && currentDomain.capabilities) {
        currentDomain.capabilities.push(finalizeCapability(currentCap));
      }

      const match = line.match(/^\s*-\s*id:\s*([^\n#]+)/);
      currentCap = {
        id: cleanYamlValue(match ? match[1] : `CAP-${(currentDomain?.capabilities?.length || 0) + 1}`),
        status: {},
        references: []
      };
      currentSection = 'capability';
      continue;
    }

    if (isRefItem) {
      if (currentRef && currentCap && currentCap.references) {
        currentCap.references.push(currentRef as TraceabilityReference);
      }
      const match = line.match(/^\s*-\s*source:\s*(.*)/);
      currentRef = {
        source: cleanYamlValue(match ? match[1] : '')
      };
      currentSection = 'references';
      continue;
    }

    // Key-value parsing
    const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const val = cleanYamlValue(kvMatch[2]);

      // Check section switches that might have inline values like "references: []"
      if (key === 'references') {
        currentSection = 'references';
        continue;
      }
      if (key === 'capabilities') {
        currentSection = 'capabilities';
        continue;
      }
      if (key === 'status') {
        currentSection = 'status';
        continue;
      }

      if (currentSection === 'status' && currentCap) {
        if (!currentCap.status) currentCap.status = {};
        currentCap.status[key] = val.toLowerCase() === 'true' || val === 'yes' || val === '1';
        continue;
      }

      if (currentSection === 'references' && currentRef) {
        if (key === 'url') currentRef.url = val;
        else if (key === 'quote') currentRef.quote = val;
        else if (key === 'source') currentRef.source = val;
        continue;
      }

      if (currentCap && (currentSection === 'capability' || currentSection === 'status' || currentSection === 'references')) {
        if (key === 'name') currentCap.name = val;
        else if (key === 'description') currentCap.description = val;
        else if (key === 'why_it_matters') currentCap.why_it_matters = val;
        continue;
      }

      if (currentDomain) {
        if (key === 'name') currentDomain.name = val;
        else if (key === 'icon') currentDomain.icon = val;
        else if (key === 'consumer_benefit') currentDomain.consumer_benefit = val;
        continue;
      }
    }
  }

  // Final flush
  if (currentRef && currentCap && currentCap.references) {
    currentCap.references.push(currentRef as TraceabilityReference);
  }
  if (currentCap && currentDomain && currentDomain.capabilities) {
    currentDomain.capabilities.push(finalizeCapability(currentCap));
  }
  if (currentDomain) {
    result.domains.push(finalizeDomain(currentDomain));
  }

  return result;
}

function cleanYamlValue(val: string): string {
  let v = val.trim();
  const commentIdx = v.indexOf(' #');
  if (commentIdx !== -1) {
    v = v.substring(0, commentIdx).trim();
  }
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.substring(1, v.length - 1);
  }
  if (v === '[]') return '';
  return v;
}

function finalizeCapability(cap: Partial<Capability>): Capability {
  return {
    id: cap.id || 'CAP-000',
    name: cap.name || 'Unnamed Capability',
    description: cap.description || '',
    why_it_matters: cap.why_it_matters,
    status: cap.status || {},
    references: cap.references || []
  };
}

function finalizeDomain(dom: Partial<CapabilityDomain>): CapabilityDomain {
  return {
    id: dom.id || 'DOM-00',
    name: dom.name || 'Unnamed Domain',
    icon: dom.icon,
    consumer_benefit: dom.consumer_benefit || '',
    capabilities: dom.capabilities || []
  };
}

export function stringifyYaml(root: HierarchyRoot): string {
  const lines: string[] = [];

  if (root.root_scope) {
    lines.push(`root_scope: "${escapeQuotes(root.root_scope)}"`);
  }
  if (root.description) {
    lines.push(`description: "${escapeQuotes(root.description)}"`);
  }
  if (lines.length > 0) {
    lines.push('');
  }

  lines.push('domains:');

  for (const domain of root.domains) {
    lines.push(`  - id: ${domain.id}`);
    lines.push(`    name: "${escapeQuotes(domain.name)}"`);
    if (domain.icon) {
      lines.push(`    icon: "${domain.icon}"`);
    }
    lines.push(`    consumer_benefit: "${escapeQuotes(domain.consumer_benefit)}"`);
    lines.push('');
    lines.push('    capabilities:');

    for (const cap of domain.capabilities) {
      lines.push(`      - id: ${cap.id}`);
      lines.push(`        name: "${escapeQuotes(cap.name)}"`);
      lines.push(`        description: "${escapeQuotes(cap.description)}"`);
      if (cap.why_it_matters) {
        lines.push(`        why_it_matters: "${escapeQuotes(cap.why_it_matters)}"`);
      }

      if (cap.status && Object.keys(cap.status).length > 0) {
        lines.push('        status:');
        for (const [prod, hasIt] of Object.entries(cap.status)) {
          lines.push(`          ${prod}: ${hasIt}`);
        }
      }

      if (cap.references && cap.references.length > 0) {
        lines.push('        references:');
        for (const ref of cap.references) {
          lines.push(`          - source: "${escapeQuotes(ref.source)}"`);
          if (ref.url) {
            lines.push(`            url: "${escapeQuotes(ref.url)}"`);
          }
          if (ref.quote) {
            lines.push(`            quote: "${escapeQuotes(ref.quote)}"`);
          }
        }
      } else {
        lines.push('        references: []');
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}
