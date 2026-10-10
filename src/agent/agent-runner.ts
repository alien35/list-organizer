import { parseRawList } from '../parser/text-parser.ts';
import { clusterFlatList, type ClusterOptions } from '../organizer/clusterer.ts';
import { validateHierarchy } from '../validator/linter.ts';
import { renderToMarkdown } from '../renderer/markdown.ts';
import { renderToInteractiveHtml } from '../renderer/html.ts';
import { stringifyYaml } from '../parser/yaml-parser.ts';
import type { HierarchyRoot } from '../types.ts';

export interface AgentRunResult {
  hierarchy: HierarchyRoot;
  validation: ReturnType<typeof validateHierarchy>;
  yaml: string;
  markdown: string;
  html: string;
}

/**
 * Executes full autonomous list organization on a raw input text/markdown/list
 */
export function runListOrganizerAgent(
  rawInput: string, 
  options: ClusterOptions = {}
): AgentRunResult {
  // 1. Parse raw unstructured items
  const items = parseRawList(rawInput);

  // 2. Cluster into 2-tier JTBD hierarchy adhering to Miller's 7±2 rule
  const hierarchy = clusterFlatList(items, options);

  // 3. Validate against cognitive science and IA rules
  const validation = validateHierarchy(hierarchy);

  // 4. Render outputs
  const yaml = stringifyYaml(hierarchy);
  const markdown = renderToMarkdown(hierarchy);
  const html = renderToInteractiveHtml(hierarchy);

  return {
    hierarchy,
    validation,
    yaml,
    markdown,
    html
  };
}
