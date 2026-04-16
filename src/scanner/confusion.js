/**
 * DepShield — Dependency Confusion Risk Analyzer
 * Detects packages at risk of namespace confusion attacks
 */

import { INTERNAL_PATTERNS } from '../data/popularPackages.js';

/**
 * Check if a package name looks like it could be internal/private
 * and is therefore at risk of dependency confusion
 * @param {string} name - Package name
 * @param {string} ecosystem - 'npm', 'pip', or 'gem'
 * @returns {null | { type: string, severity: string, score: number, details: object }}
 */
export function checkDependencyConfusion(name, ecosystem) {
  const findings = [];
  let riskScore = 0;

  // 1. Check if npm package is unscoped but looks internal
  if (ecosystem === 'npm') {
    // Scoped packages (@org/pkg) have lower confusion risk
    if (name.startsWith('@')) {
      // Still check if scope looks internal
      const scope = name.split('/')[0].replace('@', '');
      if (isInternalLookingName(scope)) {
        findings.push({
          check: 'internal-scope',
          message: `Scoped package with internal-looking scope "${scope}". Verify this scope is registered on the public npm registry.`,
        });
        riskScore += 30;
      }
      // Scoped packages are generally safer
    } else {
      // Unscoped packages — check naming
      if (isInternalLookingName(name)) {
        findings.push({
          check: 'unscoped-internal-name',
          message: `Unscoped package "${name}" has a naming pattern that suggests an internal/private package. An attacker could register this name on the public npm registry to hijack installations.`,
        });
        riskScore += 65;
      }
    }
  }

  // 2. Check pip packages for internal patterns
  if (ecosystem === 'pip') {
    if (isInternalLookingName(name)) {
      findings.push({
        check: 'internal-pypi-name',
        message: `Package "${name}" has a naming pattern suggesting it may be an internal package. PyPI does not have scopes/namespaces, making it vulnerable to dependency confusion attacks.`,
      });
      riskScore += 70; // pip is more vulnerable due to lack of scopes
    }

    // Extra Python index risk
    if (name.includes('_') && !name.includes('-')) {
      // Python packages often use underscores but PyPI normalizes to hyphens
      const hyphenated = name.replace(/_/g, '-');
      if (hyphenated !== name) {
        findings.push({
          check: 'name-normalization',
          message: `Package uses underscores in name. PyPI normalizes "${name}" to "${hyphenated}". Both names could potentially be registered by different parties.`,
        });
        riskScore += 15;
      }
    }
  }

  // 3. Check gem packages
  if (ecosystem === 'gem') {
    if (isInternalLookingName(name)) {
      findings.push({
        check: 'internal-gem-name',
        message: `Gem "${name}" has a naming pattern suggesting it may be an internal package. RubyGems does not have namespaces, making it vulnerable to dependency confusion.`,
      });
      riskScore += 65;
    }
  }

  // 4. Check for version pinning (helps mitigate confusion)
  // This will be checked at the dependency level in main scanner

  // 5. Generic suspicious patterns
  if (name.includes('proxy') && name.includes('internal')) {
    findings.push({
      check: 'proxy-internal-name',
      message: `Package name contains both "proxy" and "internal" — high-risk pattern for dependency confusion.`,
    });
    riskScore += 20;
  }

  if (riskScore === 0) return null;

  const severity = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

  return {
    type: 'confusion',
    severity,
    score: Math.min(riskScore, 100),
    details: {
      findings,
      recommendation: ecosystem === 'npm'
        ? 'Use scoped packages (@org/pkg) for internal packages and configure .npmrc to use your private registry for your scope.'
        : ecosystem === 'pip'
          ? 'Use --index-url and --extra-index-url carefully. Consider using PEP 708 index authentication or a proxy registry.'
          : 'Use a private gem server and configure Bundler source blocks to isolate private gems.',
    },
  };
}

/**
 * Check if a name matches internal/private naming patterns
 */
function isInternalLookingName(name) {
  const lower = name.toLowerCase();
  return INTERNAL_PATTERNS.some(pattern => pattern.test(lower));
}
