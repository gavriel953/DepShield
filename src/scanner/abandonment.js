/**
 * DepShield — Abandoned Package Detector
 * Heuristic analysis for packages showing signs of abandonment or hijack risk
 */

/**
 * Check if a package shows signs of being abandoned or at risk of hijacking
 * @param {{ name: string, version: string }} dep - Dependency info
 * @param {string} ecosystem - 'npm', 'pip', or 'gem'
 * @returns {null | { type: string, severity: string, score: number, details: object }}
 */
export function checkAbandonment(dep, ecosystem) {
  const findings = [];
  let riskScore = 0;

  const version = dep.version || '*';

  // 1. Very old or pre-1.0 version pinned
  const versionAnalysis = analyzeVersion(version);
  if (versionAnalysis.isPreRelease) {
    findings.push({
      check: 'pre-release-version',
      message: `Version "${version}" is a pre-release/alpha/beta. These versions may be abandoned experiments.`,
    });
    riskScore += 20;
  }

  if (versionAnalysis.isPre1_0) {
    findings.push({
      check: 'pre-1.0-version',
      message: `Version constraint suggests a pre-1.0 package. Early-stage packages have higher abandonment rates.`,
    });
    riskScore += 15;
  }

  if (versionAnalysis.isExactPin && versionAnalysis.majorVersion === 0 && versionAnalysis.minorVersion === 0) {
    findings.push({
      check: 'initial-version-pinned',
      message: `Package is pinned to an initial version (0.0.x). This may indicate a placeholder or abandoned package.`,
    });
    riskScore += 35;
  }

  // 2. Check for wildcard/no version constraint (risky practice)
  if (version === '*' || version === '' || version === 'latest') {
    findings.push({
      check: 'no-version-constraint',
      message: `No version constraint specified. This allows any version to be installed, increasing supply chain risk.`,
    });
    riskScore += 25;
  }

  // 3. Check for very wide version ranges
  if (version.startsWith('>=') && !version.includes(',') && !version.includes('<')) {
    findings.push({
      check: 'wide-version-range',
      message: `Very wide version range "${version}" — allows future untested versions, increasing risk of supply chain attacks.`,
    });
    riskScore += 20;
  }

  // 4. Single-character or very short package names (sometimes squatted)
  if (dep.name.length <= 2) {
    findings.push({
      check: 'very-short-name',
      message: `Package name "${dep.name}" is very short (${dep.name.length} chars). Very short names are often squatted or repurposed.`,
    });
    riskScore += 25;
  }

  // 5. Suspicious version numbers
  if (versionAnalysis.majorVersion >= 100) {
    findings.push({
      check: 'unusual-version-number',
      message: `Unusually high major version (${versionAnalysis.majorVersion}). This is atypical and may indicate a hijacked or malicious package.`,
    });
    riskScore += 40;
  }

  // 6. Check for git/URL dependencies (can be hijacked)
  if (version.includes('github.com') || version.includes('git+') || version.includes('http')) {
    findings.push({
      check: 'url-dependency',
      message: `Package is installed from a URL/git source. If the repository is transferred or compromised, your builds are at risk.`,
    });
    riskScore += 30;
  }

  // 7. Deprecated-looking names
  const deprecatedPatterns = ['-deprecated', '-old', '-legacy', '-archived', '-unmaintained', '-abandoned'];
  if (deprecatedPatterns.some(p => dep.name.toLowerCase().includes(p))) {
    findings.push({
      check: 'deprecated-name-pattern',
      message: `Package name contains a deprecation indicator. This package may be abandoned.`,
    });
    riskScore += 40;
  }

  if (riskScore === 0) return null;

  const severity = riskScore >= 50 ? 'medium' : 'low';

  return {
    type: 'abandoned',
    severity,
    score: Math.min(riskScore, 100),
    details: {
      findings,
      versionAnalysis,
      recommendation: 'Review this package\'s repository and npm/pypi/rubygems page. Check last publish date, open issues, and maintainer activity. Consider finding an actively maintained alternative.',
    },
  };
}

/**
 * Analyze a version string for risk signals
 */
function analyzeVersion(version) {
  const cleaned = version.replace(/^[\^~>=<! ]+/, '').trim();
  const parts = cleaned.split('.');
  const major = parseInt(parts[0]) || 0;
  const minor = parseInt(parts[1]) || 0;
  const patch = parseInt(parts[2]) || 0;

  return {
    raw: version,
    majorVersion: major,
    minorVersion: minor,
    patchVersion: patch,
    isPre1_0: major === 0 && !isNaN(parseInt(parts[0])),
    isPreRelease: /alpha|beta|rc|dev|pre|snapshot|canary|nightly/i.test(version),
    isExactPin: !version.includes('^') && !version.includes('~') && !version.includes('>') && !version.includes('<') && !version.includes('*'),
    isWildcard: version === '*' || version === 'latest' || version === '',
  };
}
