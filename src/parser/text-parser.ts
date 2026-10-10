import type { RawListItem } from '../types.ts';

/**
 * Parses raw unstructured text, markdown bullet lists, checklists,
 * CSV lines, or plain lines into structured RawListItem objects.
 */
export function parseRawList(input: string): RawListItem[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // Check if JSON array
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        return arr.map(item => {
          if (typeof item === 'string') {
            return parseSingleLine(item);
          }
          if (typeof item === 'object' && item !== null) {
            return {
              raw: JSON.stringify(item),
              name: item.name || item.title || item.feature || 'Unnamed Feature',
              description: item.description || item.desc || '',
              category: item.category || item.domain || undefined,
              why_it_matters: item.why_it_matters || item.value || undefined,
              status: item.status || undefined,
              references: item.references || []
            };
          }
          return parseSingleLine(String(item));
        });
      }
    } catch {
      // Fall through to line-based parsing
    }
  }

  // Check if CSV with header
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 1 && lines[0].includes(',')) {
    const headerCols = lines[0].toLowerCase().split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (headerCols.some(h => h.includes('feature') || h.includes('capability') || h.includes('name') || h.includes('item'))) {
      return parseCsvLines(lines, headerCols);
    }
  }

  // Markdown or plain text list parsing
  const items: RawListItem[] = [];
  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('//') || line.startsWith('===')) {
      continue; // Skip title / header separators
    }
    const parsed = parseSingleLine(line);
    if (parsed.name) {
      items.push(parsed);
    }
  }

  return items;
}

function parseSingleLine(line: string): RawListItem {
  let cleaned = line;

  // Check for checklist: - [ ] or - [x]
  let checkStatus: Record<string, boolean> | undefined;
  if (/^-\s*\[x\]/i.test(cleaned)) {
    checkStatus = { our_app: true };
    cleaned = cleaned.replace(/^-\s*\[x\]\s*/i, '');
  } else if (/^-\s*\[\s*\]/.test(cleaned)) {
    checkStatus = { our_app: false };
    cleaned = cleaned.replace(/^-\s*\[\s*\]\s*/, '');
  } else {
    // Strip bullet markers: -, *, +, numbers like 1., 1)
    cleaned = cleaned.replace(/^[-*+]\s+/, '').replace(/^\d+[\.\)]\s+/, '');
  }

  // Strip bold wrappers like **Feature Name**
  cleaned = cleaned.trim();
  let name = cleaned;
  let description = '';
  let why_it_matters: string | undefined;

  // Split on delimiter: colon ":", em-dash "—", en-dash "–", or pipe "|"
  const colonIdx = cleaned.indexOf(':');
  const dashIdx = cleaned.indexOf(' — ') !== -1 ? cleaned.indexOf(' — ') : cleaned.indexOf(' - ');
  const pipeIdx = cleaned.indexOf('|');

  if (pipeIdx !== -1) {
    // Table line format: | Name | Description | Status |
    const parts = cleaned.split('|').map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length >= 2) {
      name = parts[0].replace(/\*\*/g, '').trim();
      description = parts[1].trim();
      if (parts.length >= 3) {
        why_it_matters = parts[2].trim();
      }
    }
  } else if (colonIdx !== -1 && colonIdx < 60) {
    name = cleaned.substring(0, colonIdx).replace(/\*\*/g, '').trim();
    description = cleaned.substring(colonIdx + 1).trim();
  } else if (dashIdx !== -1 && dashIdx < 60) {
    name = cleaned.substring(0, dashIdx).replace(/\*\*/g, '').trim();
    description = cleaned.substring(dashIdx + 3).trim();
  } else {
    name = cleaned.replace(/\*\*/g, '').trim();
  }

  // If description has "Why it matters:" or "Value:"
  if (description) {
    const whyIdx = description.toLowerCase().indexOf('why it matters:');
    if (whyIdx !== -1) {
      why_it_matters = description.substring(whyIdx + 15).trim();
      description = description.substring(0, whyIdx).trim().replace(/[;,]$/, '');
    }
  }

  return {
    raw: line,
    name,
    description: description || `Provides ${name.toLowerCase()} functionality.`,
    why_it_matters,
    status: checkStatus
  };
}

function parseCsvLines(lines: string[], headers: string[]): RawListItem[] {
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('feature') || h.includes('capability') || h.includes('item'));
  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('detail') || h.includes('definition'));
  const catIdx = headers.findIndex(h => h.includes('category') || h.includes('domain') || h.includes('group'));
  const valueIdx = headers.findIndex(h => h.includes('why') || h.includes('matter') || h.includes('benefit') || h.includes('value'));

  const items: RawListItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (!rawCols[nameIdx]) continue;

    const status: Record<string, boolean> = {};
    headers.forEach((h, colI) => {
      if (colI !== nameIdx && colI !== descIdx && colI !== catIdx && colI !== valueIdx) {
        const val = rawCols[colI]?.toLowerCase();
        if (val === 'true' || val === 'yes' || val === '✅' || val === '1') {
          status[h] = true;
        } else if (val === 'false' || val === 'no' || val === '❌' || val === '0') {
          status[h] = false;
        }
      }
    });

    items.push({
      raw: lines[i],
      name: rawCols[nameIdx],
      description: descIdx !== -1 ? rawCols[descIdx] : `Provides ${rawCols[nameIdx].toLowerCase()} functionality.`,
      category: catIdx !== -1 ? rawCols[catIdx] : undefined,
      why_it_matters: valueIdx !== -1 ? rawCols[valueIdx] : undefined,
      status: Object.keys(status).length > 0 ? status : undefined
    });
  }

  return items;
}
