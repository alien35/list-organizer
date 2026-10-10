/**
 * Predictable ID Generator for Domains and Capabilities
 * Examples: DOM-01, DOM-02; CAP-011, CAP-012, CAP-021
 */

export function formatDomainId(index: number): string {
  const num = (index + 1).toString().padStart(2, '0');
  return `DOM-${num}`;
}

export function formatCapabilityId(domainIndex: number, capabilityIndex: number): string {
  const dNum = (domainIndex + 1).toString().padStart(2, '0');
  const cNum = (capabilityIndex + 1).toString();
  return `CAP-${dNum}${cNum}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
