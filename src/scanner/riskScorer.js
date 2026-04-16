/**
 * DepShield — Unified Risk Scorer
 * Combines findings from all detection engines into a unified risk score
 */

import { checkTyposquatting } from './typosquat.js';
import { checkDependencyConfusion } from './confusion.js';
import { checkAbandonment } from './abandonment.js';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

/**
 * Scan all dependencies and produce a complete security report
 * @param {Array<{name: string, version: string, section: string}>} dependencies
 * @param {string} ecosystem - 'npm', 'pip', or 'gem'
 * @param {function} onProgress - Progress callback (percent, status)
 * @returns {Promise<object>} Complete scan report
 */
export async function scanDependencies(dependencies, ecosystem, onProgress = () => {}) {
  const startTime = performance.now();
  const findings = [];
  const safeDeps = [];

  for (let i = 0; i < dependencies.length; i++) {
    const dep = dependencies[i];
    const progress = Math.round(((i + 1) / dependencies.length) * 100);
    onProgress(progress, `Analyzing ${dep.name}...`);

    // Small delay for visual effect during scanning animation
    await sleep(30 + Math.random() * 50);

    const depFindings = [];

    // Run all detectors
    const typosquatResult = checkTyposquatting(dep.name, ecosystem);
    if (typosquatResult) depFindings.push({ ...typosquatResult, package: dep });

    const confusionResult = checkDependencyConfusion(dep.name, ecosystem);
    if (confusionResult) depFindings.push({ ...confusionResult, package: dep });

    const abandonResult = checkAbandonment(dep, ecosystem);
    if (abandonResult) depFindings.push({ ...abandonResult, package: dep });

    if (depFindings.length > 0) {
      findings.push(...depFindings);
    } else {
      safeDeps.push(dep);
    }
  }

  // Sort findings by severity, then score
  findings.sort((a, b) => {
    const sevDiff = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    if (sevDiff !== 0) return sevDiff;
    return b.score - a.score;
  });

  // Calculate overall risk score
  const overallScore = calculateOverallScore(findings, dependencies.length);

  // Compute severity counts
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
  }

  // Compute category counts
  const categoryCounts = { typosquat: 0, confusion: 0, abandoned: 0, malicious: 0 };
  for (const f of findings) {
    categoryCounts[f.type] = (categoryCounts[f.type] || 0) + 1;
  }

  const elapsedMs = Math.round(performance.now() - startTime);

  return {
    ecosystem,
    totalDependencies: dependencies.length,
    totalFindings: findings.length,
    overallScore,
    overallSeverity: getOverallSeverity(overallScore),
    severityCounts,
    categoryCounts,
    findings,
    safeDependencies: safeDeps,
    scanDuration: elapsedMs,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate an overall risk score (0–100) from individual findings
 */
function calculateOverallScore(findings, totalDeps) {
  if (findings.length === 0) return 0;

  // Weighted contribution of each finding
  const weights = { critical: 1.0, high: 0.7, medium: 0.4, low: 0.15, info: 0.05 };
  let weightedSum = 0;

  for (const f of findings) {
    weightedSum += f.score * (weights[f.severity] || 0.1);
  }

  // Normalize by total dependencies
  const densityFactor = Math.min(findings.length / totalDeps, 1);
  const rawScore = weightedSum / totalDeps;

  // Cap at 100
  return Math.min(Math.round(rawScore * densityFactor * 2 + densityFactor * 30), 100);
}

/**
 * Map score to severity label
 */
function getOverallSeverity(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  if (score >= 10) return 'low';
  return 'safe';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
