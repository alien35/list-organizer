import type { HierarchyRoot } from '../types.ts';

export function renderToJson(root: HierarchyRoot, pretty: boolean = true): string {
  return JSON.stringify(root, null, pretty ? 2 : undefined);
}
