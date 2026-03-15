import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES_DIR = path.join(ROOT, 'src', 'locales');
const LANGUAGES = ['en', 'ar', 'fr'];
const BASE_LANGUAGE = 'en';
const PLURAL_SUFFIX_RE = /_(zero|one|two|few|many|other)$/;

function walkJsonFiles(dir) {
  const entries = readdirSync(dir).sort();
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      for (const child of walkJsonFiles(fullPath)) {
        files.push(path.join(entry, child));
      }
      continue;
    }

    if (entry.endsWith('.json')) {
      files.push(entry);
    }
  }

  return files;
}

function flattenKeys(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenKeys(item, `${prefix}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      return flattenKeys(child, nextPrefix);
    });
  }

  return prefix ? [prefix] : [];
}

function normalizeKey(key) {
  return key.replace(PLURAL_SUFFIX_RE, '');
}

function loadLanguageFiles(language) {
  const results = new Map();
  const namespaceDir = path.join(LOCALES_DIR, language);

  for (const relativePath of walkJsonFiles(namespaceDir)) {
    results.set(relativePath, path.join(namespaceDir, relativePath));
  }

  return results;
}

function readJsonKeys(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);
  return new Set(flattenKeys(json).map(normalizeKey));
}

const filesByLanguage = new Map(
  LANGUAGES.map((language) => [language, loadLanguageFiles(language)]),
);
const baseFiles = filesByLanguage.get(BASE_LANGUAGE);
const issues = [];

for (const language of LANGUAGES) {
  const fileMap = filesByLanguage.get(language);
  const missingFiles = [...baseFiles.keys()].filter((key) => !fileMap.has(key));
  const extraFiles = [...fileMap.keys()].filter((key) => !baseFiles.has(key));

  if (missingFiles.length > 0) {
    issues.push(
      `[${language}] Missing files:\n${missingFiles.map((file) => `  - ${file}`).join('\n')}`,
    );
  }

  if (extraFiles.length > 0) {
    issues.push(
      `[${language}] Extra files not present in ${BASE_LANGUAGE}:\n${extraFiles.map((file) => `  - ${file}`).join('\n')}`,
    );
  }
}

for (const [relativePath, basePath] of baseFiles.entries()) {
  const baseKeys = readJsonKeys(basePath);

  for (const language of LANGUAGES) {
    if (language === BASE_LANGUAGE) continue;

    const filePath = filesByLanguage.get(language).get(relativePath);
    if (!filePath) continue;

    const languageKeys = readJsonKeys(filePath);
    const missingKeys = [...baseKeys].filter((key) => !languageKeys.has(key));
    const extraKeys = [...languageKeys].filter((key) => !baseKeys.has(key));

    if (missingKeys.length > 0) {
      issues.push(
        `[${language}] Missing keys in ${relativePath}:\n${missingKeys.map((key) => `  - ${key}`).join('\n')}`,
      );
    }

    if (extraKeys.length > 0) {
      issues.push(
        `[${language}] Extra keys in ${relativePath} not present in ${BASE_LANGUAGE}:\n${extraKeys.map((key) => `  - ${key}`).join('\n')}`,
      );
    }
  }
}

if (issues.length > 0) {
  console.error('Translation parity check failed.\n');
  console.error(issues.join('\n\n'));
  process.exit(1);
}

console.log('Translation parity check passed.');
