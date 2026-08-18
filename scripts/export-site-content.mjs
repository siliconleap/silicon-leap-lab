#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const usage = `Usage:
  node scripts/export-site-content.mjs <experiment-dir> <site-repo-dir>

Example:
  node scripts/export-site-content.mjs experiments/2026-08-markdown-only-content-pipeline ../silicon-leap-site
`;

const [experimentArg, siteRepoArg] = process.argv.slice(2);

if (!experimentArg || !siteRepoArg) {
  console.error(usage);
  process.exit(1);
}

const labRoot = process.cwd();
const experimentDir = path.resolve(labRoot, experimentArg);
const siteRepoDir = path.resolve(labRoot, siteRepoArg);
const experimentSlug = path.basename(experimentDir);
const experimentReadme = path.join(experimentDir, 'README.md');

if (!existsSync(experimentReadme)) {
  console.error(`Missing experiment README: ${experimentReadme}`);
  process.exit(1);
}

const sourceReadme = readFileSync(experimentReadme, 'utf8');
const experimentQuestion = extractQuestion(sourceReadme);

const drafts = [
  {
    lang: 'zh',
    source: path.join(experimentDir, 'drafts/site/blog-zh.md'),
    target: path.join(siteRepoDir, `src/content/experiments/zh/${experimentSlug}.md`),
  },
  {
    lang: 'en',
    source: path.join(experimentDir, 'drafts/site/blog.md'),
    target: path.join(siteRepoDir, `src/content/experiments/en/${experimentSlug}.md`),
  },
];

let exported = 0;

for (const draft of drafts) {
  if (!existsSync(draft.source)) continue;

  const { frontmatter, body } = parseMarkdown(readFileSync(draft.source, 'utf8'));
  const title = required(frontmatter.title, `${draft.source}: title`);
  const date = required(frontmatter.date, `${draft.source}: date`);
  const tags = parseTags(frontmatter.tags);
  const question = frontmatter.question || extractDraftQuestion(body, draft.lang) || experimentQuestion;
  const description = frontmatter.description || frontmatter.summary || question;
  const output = [
    '---',
    `title: ${yamlString(title)}`,
    `question: ${yamlString(question)}`,
    `date: ${date}`,
    `tags: [${tags.map((tag) => yamlString(tag)).join(', ')}]`,
    `description: ${yamlString(description)}`,
    '---',
    '',
    rewriteAndCopyImages(body, path.dirname(draft.source), path.dirname(draft.target)).trimStart(),
  ].join('\n');

  mkdirSync(path.dirname(draft.target), { recursive: true });
  writeFileSync(draft.target, output.endsWith('\n') ? output : `${output}\n`);
  console.log(`Exported ${draft.lang}: ${path.relative(siteRepoDir, draft.target)}`);
  exported += 1;
}

if (exported === 0) {
  console.error(`No site drafts found under ${path.join(experimentDir, 'drafts/site')}`);
  process.exit(1);
}

function extractQuestion(markdown) {
  const match = markdown.match(/^## Question\s+([\s\S]*?)(?=^##\s|$)/m);
  if (!match) return '这次实验在验证什么？';
  return match[1].trim().replace(/\s+/g, ' ');
}

function extractDraftQuestion(markdown, lang) {
  const heading = lang === 'en' ? 'The question' : '问题';
  const match = markdown.match(new RegExp('^## ' + heading + '\\s+([\\s\\S]*?)(?=^##\\s|$)', 'm'));
  if (!match) return '';
  return match[1].trim().split('\n').find((line) => line.trim())?.trim() ?? '';
}

function rewriteAndCopyImages(markdown, sourceDir, targetDir) {
  return markdown.replace(/!\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g, (match, alt, rawUrl, suffix) => {
    if (/^(https?:)?\/\//.test(rawUrl) || rawUrl.startsWith("/")) return match;

    const sourceImage = path.resolve(sourceDir, rawUrl);
    if (!existsSync(sourceImage)) {
      throw new Error("Missing referenced image: " + sourceImage);
    }

    const targetAssetsDir = path.join(targetDir, "assets");
    const targetName = path.basename(sourceImage);
    mkdirSync(targetAssetsDir, { recursive: true });
    copyFileSync(sourceImage, path.join(targetAssetsDir, targetName));

    return "![" + alt + "](assets/" + targetName + suffix + ")";
  });
}

function parseMarkdown(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Markdown draft must start with YAML frontmatter.');
  }

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    frontmatter[pair[1]] = pair[2].trim().replace(/^"(.*)"$/, '$1');
  }

  return { frontmatter, body: match[2] };
}

function parseTags(value) {
  if (!value) return [];
  const match = value.match(/^\[(.*)\]$/);
  if (!match) return [value];
  return match[1]
    .split(',')
    .map((tag) => tag.trim().replace(/^"(.*)"$/, '$1'))
    .filter(Boolean);
}

function required(value, label) {
  if (!value) throw new Error(`Missing required field: ${label}`);
  return value;
}

function yamlString(value) {
  return JSON.stringify(String(value));
}
