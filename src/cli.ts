#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { c } from './utils/colors.ts';
import { parseHierarchy, stringifyYaml } from './parser/yaml-parser.ts';
import { parseRawList } from './parser/text-parser.ts';
import { clusterFlatList } from './organizer/clusterer.ts';
import { validateHierarchy } from './validator/linter.ts';
import { renderToMarkdown } from './renderer/markdown.ts';
import { renderToInteractiveHtml } from './renderer/html.ts';
import { renderToJson } from './renderer/json.ts';
import { computeHierarchyRollup } from './analytics/rollup.ts';
import { buildHierarchicalFeaturePrompt, buildFullHierarchyPrompt } from './organizer/prompt-builder.ts';
import { LIST_ORGANIZER_SYSTEM_PROMPT } from './agent/system-prompt.ts';

const args = process.argv.slice(2);
const command = args[0] || 'help';

function printHeader(): void {
  console.log(c.bold(c.cyan('\n🏛️  List Organizer: Hierarchical Feature Refinement & Cognitive IA Toolkit')));
  console.log(c.dim('   Miller (1956) 7±2 • Wei et al. (2024) • Larson & Czerwinski (1998) • SPLE\n'));
}

function printHelp(): void {
  printHeader();
  console.log(c.bold('USAGE:'));
  console.log('  listorg <command> [options]\n');
  console.log(c.bold('COMMANDS:'));
  console.log(`  ${c.green('organize')} <file>       Transform a flat unorganized list into a 2-tier JTBD hierarchy`);
  console.log(`  ${c.green('validate')} <file>       Run Cognitive Science Linter (Miller 7±2, JTBD naming, depth)`);
  console.log(`  ${c.green('render')}   <file>       Render hierarchy to Consumer Markdown or Interactive HTML`);
  console.log(`  ${c.green('rollup')}   <file>       Compute domain coverage %, competitor gaps & differentiators`);
  console.log(`  ${c.green('prompt')}   <file>       Generate Wei et al. (2024) sibling-aware agent context prompt`);
  console.log(`  ${c.green('template')}             Print a starter YAML hierarchy conforming to the schema`);
  console.log(`  ${c.green('agent')}                Display the complete Agent System Prompt instructions\n`);
  console.log(c.bold('OPTIONS:'));
  console.log('  --format <md|html|yaml|json>  Output format for render/organize (default: md)');
  console.log('  --out <file>                  Save output to file instead of stdout');
  console.log('  --scope <text>                Root scope name (e.g. "Digital Notary Platform")');
  console.log('  --domain <name>               Target specific domain for prompt generation\n');
  console.log(c.bold('EXAMPLES:'));
  console.log('  listorg organize features.txt --format md');
  console.log('  listorg validate registry.yaml');
  console.log('  listorg render registry.yaml --format html --out report.html');
  console.log('  listorg rollup registry.yaml');
  console.log('  listorg prompt registry.yaml --domain "Signing Experience & Speed"\n');
}

function getArgValue(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

function handleOrganize(): void {
  const filePath = args[1];
  if (!filePath || filePath.startsWith('--')) {
    console.error(c.red('Error: Please specify an input file to organize.'));
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(c.red(`Error: File not found at ${resolved}`));
    process.exit(1);
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  const scope = getArgValue('--scope') || path.basename(filePath, path.extname(filePath));
  const format = getArgValue('--format') || 'md';
  const outFile = getArgValue('--out');

  console.log(c.cyan(`Parsing and clustering "${filePath}" using Miller 7±2 and JTBD heuristics...`));
  const rawItems = parseRawList(content);
  console.log(c.dim(`Extracted ${rawItems.length} flat capability items.`));

  const hierarchy = clusterFlatList(rawItems, {
    rootScope: scope,
    defaultProduct: 'our_app'
  });

  const validation = validateHierarchy(hierarchy);
  console.log(c.green(`✓ Organized into ${hierarchy.domains.length} domains. Cognitive Score: ${validation.metrics.cognitiveLoadScore}/100`));

  let output = '';
  if (format === 'yaml' || format === 'yml') {
    output = stringifyYaml(hierarchy);
  } else if (format === 'json') {
    output = renderToJson(hierarchy);
  } else if (format === 'html') {
    output = renderToInteractiveHtml(hierarchy);
  } else {
    output = renderToMarkdown(hierarchy, { includeTitle: true });
  }

  if (outFile) {
    const outResolved = path.resolve(process.cwd(), outFile);
    fs.writeFileSync(outResolved, output, 'utf-8');
    console.log(c.bold(c.green(`✓ Saved organized hierarchy to ${outResolved}`)));
  } else {
    console.log('\n' + output);
  }
}

function handleValidate(): void {
  const filePath = args[1];
  if (!filePath) {
    console.error(c.red('Error: Please specify a hierarchy file to validate.'));
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(c.red(`Error: File not found at ${resolved}`));
    process.exit(1);
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  const root = parseHierarchy(content);
  const result = validateHierarchy(root);

  printHeader();
  console.log(c.bold(`Auditing: ${path.basename(filePath)}`));
  console.log(c.dim(`Root Scope: ${root.root_scope || 'Unnamed Scope'}`));
  console.log(`Hierarchy Depth: ${result.metrics.depth} tiers (Larson & Czerwinski 1998 sweet spot: 2–3)\n`);

  // Domain breakdown
  console.log(c.bold('Cognitive Domain Distribution (Miller 7±2 Rule):'));
  for (const d of result.metrics.domainMetrics) {
    const statusIcon = d.isMillerOptimal ? c.green('●') : d.exceedsMillerLimit ? c.red('▲ [>9 OVERLOAD]') : c.yellow('◆');
    console.log(`  ${statusIcon} ${d.id.padEnd(8)} ${d.name.padEnd(40)} ${c.bold(d.count.toString().padStart(2))} items`);
  }

  console.log('\n' + c.bold('Cognitive Science Audit Summary:'));
  console.log(`  Total Domains:         ${result.metrics.totalDomains} (recommended 3–7, max 9)`);
  console.log(`  Total Capabilities:    ${result.metrics.totalCapabilities}`);
  console.log(`  Avg Items / Domain:    ${result.metrics.averageCapabilitiesPerDomain}`);
  console.log(`  Cognitive Load Score:  ${formatScore(result.metrics.cognitiveLoadScore)}/100\n`);

  if (result.errors.length > 0) {
    console.log(c.red(c.bold('❌ Violations:')));
    result.errors.forEach(e => console.log(`   ${c.red('•')} ${e}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log(c.yellow(c.bold('⚠️  Recommendations:')));
    result.warnings.forEach(w => console.log(`   ${c.yellow('•')} ${w}`));
    console.log('');
  }

  if (result.valid && result.warnings.length === 0) {
    console.log(c.green(c.bold('🎉 Perfect score! Hierarchy fully adheres to cognitive psychology and IA principles.\n')));
  } else if (result.valid) {
    console.log(c.cyan('✓ Valid hierarchy structure with minor cognitive optimization opportunities.\n'));
  } else {
    process.exit(1);
  }
}

function handleRender(): void {
  const filePath = args[1];
  if (!filePath) {
    console.error(c.red('Error: Please specify a hierarchy file to render.'));
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(c.red(`Error: File not found at ${resolved}`));
    process.exit(1);
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  const root = parseHierarchy(content);
  const format = getArgValue('--format') || 'md';
  const outFile = getArgValue('--out');

  let output = '';
  if (format === 'html') {
    output = renderToInteractiveHtml(root);
  } else if (format === 'yaml' || format === 'yml') {
    output = stringifyYaml(root);
  } else if (format === 'json') {
    output = renderToJson(root);
  } else {
    output = renderToMarkdown(root, { includeTitle: true });
  }

  if (outFile) {
    const outResolved = path.resolve(process.cwd(), outFile);
    fs.writeFileSync(outResolved, output, 'utf-8');
    console.log(c.bold(c.green(`✓ Rendered ${format.toUpperCase()} to ${outResolved}`)));
  } else {
    console.log(output);
  }
}

function handleRollup(): void {
  const filePath = args[1];
  if (!filePath) {
    console.error(c.red('Error: Please specify a hierarchy file for rollup analytics.'));
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), filePath);
  const content = fs.readFileSync(resolved, 'utf-8');
  const root = parseHierarchy(content);
  const rollup = computeHierarchyRollup(root);

  printHeader();
  console.log(c.bold(`Domain Rollup Metrics: ${root.root_scope || path.basename(filePath)}`));
  console.log(c.dim(`Total Capabilities Evaluated: ${rollup.totalCapabilities}\n`));

  console.log(c.bold('Domain-Level Coverage Breakdown:'));
  console.log('-------------------------------------------------------------------------------');
  console.log(`Domain ID  | Domain Name                       | Total | ${rollup.products.map(p => p.padEnd(12)).join(' | ')}`);
  console.log('-------------------------------------------------------------------------------');

  for (const d of rollup.domains) {
    const prodCols = rollup.products.map(p => {
      const cov = d.coverage[p];
      return `${cov.percentage}% (${cov.count})`.padEnd(12);
    }).join(' | ');

    console.log(`${d.domainId.padEnd(10)} | ${d.domainName.substring(0, 33).padEnd(33)} | ${d.totalCapabilities.toString().padStart(5)} | ${prodCols}`);
  }
  console.log('-------------------------------------------------------------------------------');

  console.log('\n' + c.bold('Overall Product Coverage:'));
  for (const p of rollup.products) {
    const oc = rollup.overallCoverage[p];
    console.log(`  ${c.cyan(p.padEnd(16))}: ${oc.percentage}% (${oc.count}/${rollup.totalCapabilities} capabilities)`);
  }

  if (rollup.headToHead && Object.keys(rollup.headToHead).length > 0) {
    console.log('\n' + c.bold('Head-To-Head Matrix (vs Our App):'));
    for (const [comp, h2h] of Object.entries(rollup.headToHead)) {
      console.log(`  vs ${comp}: ${c.green(h2h.wins + ' Wins')} | ${c.red(h2h.losses + ' Losses')} | ${c.dim(h2h.ties + ' Ties')}`);
    }
  }

  // Differentiators
  const allDiffs: { domain: string; name: string }[] = [];
  for (const d of rollup.domains) {
    d.differentiators.forEach(name => allDiffs.push({ domain: d.domainName, name }));
  }

  if (allDiffs.length > 0) {
    console.log('\n' + c.bold(c.green('🌟 Exclusive Differentiators (Our App covers, Competitors lack):')));
    allDiffs.forEach(df => console.log(`  • [${df.domain}] ${c.bold(df.name)}`));
  }
  console.log('');
}

function handlePrompt(): void {
  const filePath = args[1];
  if (!filePath) {
    console.error(c.red('Error: Please specify a hierarchy file.'));
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), filePath);
  const content = fs.readFileSync(resolved, 'utf-8');
  const root = parseHierarchy(content);
  const domainTarget = getArgValue('--domain');

  if (domainTarget) {
    const domain = root.domains.find(d => 
      d.name.toLowerCase().includes(domainTarget.toLowerCase()) || d.id === domainTarget
    );

    if (!domain) {
      console.error(c.red(`Error: Domain matching "${domainTarget}" not found.`));
      process.exit(1);
    }

    const siblings = domain.capabilities.map(c => c.name);
    const prompt = buildHierarchicalFeaturePrompt({
      rootScope: root.root_scope || 'Application Scope',
      superFeature: domain.name,
      consumerBenefit: domain.consumer_benefit,
      siblingFeatures: siblings
    });

    console.log(prompt);
  } else {
    // Global prompt
    const allNames = root.domains.flatMap(d => d.capabilities.map(c => c.name));
    const prompt = buildFullHierarchyPrompt(root.root_scope || 'Application Scope', allNames);
    console.log(prompt);
  }
}

function handleTemplate(): void {
  const template = `root_scope: "Digital Notary Platform"
description: "Hierarchical capability registry decomposed into customer-facing domains."

domains:
  - id: DOM-01
    name: "Legal Compliance & Security"
    icon: "🛡️"
    consumer_benefit: "Ensure every transaction is audit-ready and tamper-proof."
    
    capabilities:
      - id: CAP-011
        name: "Tamper-Evident Audit Certificate"
        description: "Generates a cryptographically signed PDF summary of all signer events."
        why_it_matters: "Proof of integrity for court disputes"
        status:
          our_app: true
          competitor_a: true
        references:
          - source: "CompetitorA Compliance Guide"
            url: "https://competitor.com/compliance"
            quote: "Every completed packet includes an audit certificate."

      - id: CAP-012
        name: "Biometric Signer Verification"
        description: "Validates signer identity via government ID scan and selfie match."
        why_it_matters: "Prevent identity fraud on high-value deals"
        status:
          our_app: false
          competitor_a: true
        references:
          - source: "CompetitorA Feature Page"
            url: "https://competitor.com/id-verify"
            quote: "Verify signers in real time with biometric ID checking."

  - id: DOM-02
    name: "Signing Experience & Speed"
    icon: "⚡"
    consumer_benefit: "Close agreements in minutes without friction or login requirements."
    
    capabilities:
      - id: CAP-021
        name: "Instant Mobile In-Person Signing"
        description: "Hand a tablet or phone to signers for immediate signature capture."
        why_it_matters: "Hand over your phone or tablet on-site"
        status:
          our_app: true
          competitor_a: false
        references: []
`;
  console.log(template);
}

function handleAgent(): void {
  console.log(LIST_ORGANIZER_SYSTEM_PROMPT);
}

function formatScore(score: number): string {
  if (score >= 90) return c.green(score.toString());
  if (score >= 70) return c.yellow(score.toString());
  return c.red(score.toString());
}

// Router
switch (command) {
  case 'organize':
    handleOrganize();
    break;
  case 'validate':
  case 'lint':
    handleValidate();
    break;
  case 'render':
    handleRender();
    break;
  case 'rollup':
  case 'analytics':
    handleRollup();
    break;
  case 'prompt':
    handlePrompt();
    break;
  case 'template':
    handleTemplate();
    break;
  case 'agent':
    handleAgent();
    break;
  case 'help':
  case '--help':
  case '-h':
  default:
    printHelp();
    break;
}
