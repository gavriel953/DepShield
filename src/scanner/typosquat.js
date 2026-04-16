/**
 * DepShield — Typosquatting Detection Engine
 * Detects packages with names suspiciously similar to popular packages
 */

import { NPM_PACKAGES, PIP_PACKAGES, GEM_PACKAGES, KNOWN_MALICIOUS } from '../data/popularPackages.js';

const ECOSYSTEM_PACKAGES = {
  npm: NPM_PACKAGES,
  pip: PIP_PACKAGES,
  gem: GEM_PACKAGES,
};

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Detect common typosquatting patterns
 */
function detectPattern(name, popularName) {
  const patterns = [];
  const nl = name.toLowerCase();
  const pl = popularName.toLowerCase();

  // Character swap (transposition)
  if (nl.length === pl.length) {
    let diffs = 0;
    for (let i = 0; i < nl.length; i++) {
      if (nl[i] !== pl[i]) diffs++;
    }
    if (diffs === 2) {
      // Check if it's a transposition
      for (let i = 0; i < nl.length - 1; i++) {
        if (nl[i] === pl[i + 1] && nl[i + 1] === pl[i]) {
          patterns.push('character-swap');
          break;
        }
      }
    }
  }

  // Missing character
  if (nl.length === pl.length - 1) {
    patterns.push('missing-character');
  }

  // Extra character
  if (nl.length === pl.length + 1) {
    patterns.push('extra-character');
  }

  // Homoglyph substitution (l/1, 0/O, etc.)
  const homoglyphs = { 'l': '1', '1': 'l', '0': 'o', 'o': '0', 'i': 'l', 'rn': 'm', 'm': 'rn' };
  for (const [from, to] of Object.entries(homoglyphs)) {
    if (nl.includes(from) && nl.replace(from, to) === pl) {
      patterns.push('homoglyph');
      break;
    }
  }

  // Separator confusion (- vs _ vs .)
  const normalize = s => s.replace(/[-_.]/g, '');
  if (normalize(nl) === normalize(pl) && nl !== pl) {
    patterns.push('separator-confusion');
  }

  // Suffix/prefix attack (adding -js, -cli, -node, etc.)
  const suffixes = ['-js', '.js', '-node', '-cli', '-api', '-sdk', '-lib', '-core', '-dev', '-pro', '-plus'];
  for (const suffix of suffixes) {
    if (nl === pl + suffix || nl + suffix === pl) {
      patterns.push('suffix-manipulation');
      break;
    }
  }

  // Repeated character
  for (let i = 0; i < pl.length; i++) {
    const doubled = pl.slice(0, i + 1) + pl[i] + pl.slice(i + 1);
    if (nl === doubled) {
      patterns.push('repeated-character');
      break;
    }
  }

  return patterns;
}

/**
 * Analyze a single package for typosquatting risk
 * @param {string} name - Package name to check
 * @param {string} ecosystem - 'npm', 'pip', or 'gem'
 * @returns {null | { type: 'typosquat', severity: string, score: number, details: object }}
 */
export function checkTyposquatting(name, ecosystem) {
  const popularPkgs = ECOSYSTEM_PACKAGES[ecosystem] || [];
  const malicious = KNOWN_MALICIOUS[ecosystem] || [];
  const normalizedName = name.toLowerCase();

  // Check if it IS a popular package (safe)
  if (popularPkgs.some(p => p.toLowerCase() === normalizedName)) {
    return null;
  }

  // Check known malicious list first
  if (malicious.some(m => m.toLowerCase() === normalizedName)) {
    return {
      type: 'malicious',
      severity: 'critical',
      score: 95,
      details: {
        reason: 'This package name appears in the known malicious packages database from public security advisories.',
        matchedPackage: name,
        recommendation: 'Remove this package immediately and audit your system for compromise.',
      },
    };
  }

  // Check similarity against popular packages
  let bestMatch = null;
  let bestDistance = Infinity;
  let bestPatterns = [];

  for (const popular of popularPkgs) {
    const pl = popular.toLowerCase();

    // Skip if identical
    if (normalizedName === pl) continue;

    // Only check packages with reasonable length similarity
    if (Math.abs(name.length - popular.length) > 3) continue;

    const distance = levenshtein(normalizedName, pl);

    // Flag if distance is 1-2 for short names, 1-3 for longer names
    const threshold = popular.length <= 5 ? 1 : 2;

    if (distance <= threshold && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = popular;
      bestPatterns = detectPattern(normalizedName, pl);
    }
  }

  if (bestMatch) {
    const severity = bestDistance === 1 ? 'high' : 'medium';
    const score = bestDistance === 1 ? 75 : 55;

    return {
      type: 'typosquat',
      severity,
      score: score + (bestPatterns.length > 0 ? 10 : 0),
      details: {
        suspectedTyposquatOf: bestMatch,
        editDistance: bestDistance,
        patterns: bestPatterns.length > 0 ? bestPatterns : ['general-similarity'],
        recommendation: `Verify this is the intended package. Did you mean "${bestMatch}"?`,
      },
    };
  }

  return null;
}
