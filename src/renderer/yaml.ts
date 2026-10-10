import type { HierarchyRoot } from '../types.ts';
import { stringifyYaml } from '../parser/yaml-parser.ts';

export function renderToYaml(root: HierarchyRoot): string {
  return stringifyYaml(root);
}
