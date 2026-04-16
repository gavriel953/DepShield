/**
 * DepShield — Dependency File Parser
 * Parses package.json, requirements.txt, and Gemfile formats
 */

/**
 * Auto-detect file type and parse dependencies
 * @param {string} content - Raw file content
 * @param {string} hint - User-provided hint: 'auto', 'npm', 'pip', 'gem'
 * @returns {{ ecosystem: string, dependencies: Array<{name: string, version: string}> }}
 */
export function parseDependencyFile(content, hint = 'auto') {
  const trimmed = content.trim();

  if (hint !== 'auto') {
    const parsers = { npm: parsePackageJson, pip: parseRequirementsTxt, gem: parseGemfile };
    const parser = parsers[hint];
    if (parser) return parser(trimmed);
  }

  // Auto-detect
  if (looksLikeJson(trimmed)) return parsePackageJson(trimmed);
  if (looksLikeGemfile(trimmed)) return parseGemfile(trimmed);
  return parseRequirementsTxt(trimmed);
}

function looksLikeJson(content) {
  return content.startsWith('{');
}

function looksLikeGemfile(content) {
  return /^source\s+['"]|^gem\s+['"]|^group\s+:/m.test(content);
}

/**
 * Parse package.json (npm/yarn/pnpm)
 */
function parsePackageJson(content) {
  try {
    const pkg = JSON.parse(content);
    const deps = [];

    const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    for (const section of sections) {
      if (pkg[section] && typeof pkg[section] === 'object') {
        for (const [name, version] of Object.entries(pkg[section])) {
          deps.push({
            name,
            version: typeof version === 'string' ? version : '*',
            section,
          });
        }
      }
    }

    return { ecosystem: 'npm', dependencies: deps };
  } catch (e) {
    throw new Error('Invalid package.json: ' + e.message);
  }
}

/**
 * Parse requirements.txt (pip)
 */
function parseRequirementsTxt(content) {
  const deps = [];
  const lines = content.split('\n');

  for (let line of lines) {
    line = line.trim();
    // Skip comments, empty lines, and flags
    if (!line || line.startsWith('#') || line.startsWith('-')) continue;

    // Handle inline comments
    const commentIdx = line.indexOf('#');
    if (commentIdx > 0) line = line.substring(0, commentIdx).trim();

    // Parse name and version specifier
    const match = line.match(/^([a-zA-Z0-9_.-]+)\s*([<>=!~]+\s*[^\s,;]+)?/);
    if (match) {
      deps.push({
        name: match[1],
        version: match[2] ? match[2].trim() : '*',
        section: 'dependencies',
      });
    }
  }

  return { ecosystem: 'pip', dependencies: deps };
}

/**
 * Parse Gemfile (Ruby)
 */
function parseGemfile(content) {
  const deps = [];
  const lines = content.split('\n');
  let currentGroup = 'default';

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    // Track groups
    const groupMatch = line.match(/^group\s+:(\w+)/);
    if (groupMatch) {
      currentGroup = groupMatch[1];
      continue;
    }
    if (line === 'end') {
      currentGroup = 'default';
      continue;
    }

    // Parse gem declarations
    const gemMatch = line.match(/^gem\s+['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?/);
    if (gemMatch) {
      deps.push({
        name: gemMatch[1],
        version: gemMatch[2] || '*',
        section: currentGroup,
      });
    }
  }

  return { ecosystem: 'gem', dependencies: deps };
}
