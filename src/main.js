/**
 * DepShield — Main Application
 * Orchestrates UI interactions, scanning pipeline, and result rendering
 */

import './style.css';
import { parseDependencyFile } from './scanner/parser.js';
import { scanDependencies } from './scanner/riskScorer.js';
import { drawRiskGauge, drawCategoryChart, animateScore } from './ui/charts.js';
import { exportJSON, exportHTML } from './ui/report.js';
import { SAMPLES } from './data/samples.js';

// ── State ──────────────────────────────────────────────
let currentReport = null;

// ── DOM References ─────────────────────────────────────
const dom = {
  scannerSection: () => document.getElementById('scanner-section'),
  scanningSection: () => document.getElementById('scanning-section'),
  resultsSection: () => document.getElementById('results-section'),
  aboutSection: () => document.getElementById('about-section'),
  dropZone: () => document.getElementById('drop-zone'),
  fileInput: () => document.getElementById('file-input'),
  pasteInput: () => document.getElementById('paste-input'),
  fileTypeSelect: () => document.getElementById('file-type-select'),
  scanBtn: () => document.getElementById('scan-btn'),
  scanningStatus: () => document.getElementById('scanning-status'),
  scanningBar: () => document.getElementById('scanning-bar'),
  riskGauge: () => document.getElementById('risk-gauge'),
  riskScoreLabel: () => document.getElementById('risk-score-label'),
  riskScoreSeverity: () => document.getElementById('risk-score-severity'),
  criticalCount: () => document.getElementById('critical-count'),
  highCount: () => document.getElementById('high-count'),
  mediumCount: () => document.getElementById('medium-count'),
  lowCount: () => document.getElementById('low-count'),
  infoCount: () => document.getElementById('info-count'),
  categoriesChart: () => document.getElementById('categories-chart'),
  resultsEcosystem: () => document.getElementById('results-ecosystem'),
  resultsCount: () => document.getElementById('results-count'),
  resultsTime: () => document.getElementById('results-time'),
  findingsList: () => document.getElementById('findings-list'),
  safeToggle: () => document.getElementById('safe-toggle'),
  safeList: () => document.getElementById('safe-list'),
  safeCount: () => document.getElementById('safe-count'),
  newScanBtn: () => document.getElementById('new-scan-btn'),
  exportBtn: () => document.getElementById('export-btn'),
};

// ── Initialize ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupNavigation();
  setupDropZone();
  setupScanButton();
  setupSamples();
  setupExport();
  setupSafeToggle();
  setupNewScan();
}

// ── Navigation ─────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      showSection(section);
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function showSection(name) {
  const sections = ['scanner', 'scanning', 'results', 'about'];
  for (const s of sections) {
    const el = document.getElementById(`${s}-section`);
    if (el) el.classList.toggle('hidden', s !== name);
  }
}

// ── Drop Zone ──────────────────────────────────────────
function setupDropZone() {
  const dropZone = dom.dropZone();
  const fileInput = dom.fileInput();

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
  });
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    dom.pasteInput().value = reader.result;
    // Auto-detect type from filename
    if (file.name === 'package.json' || file.name.endsWith('.json')) {
      dom.fileTypeSelect().value = 'npm';
    } else if (file.name === 'requirements.txt' || file.name.endsWith('.txt')) {
      dom.fileTypeSelect().value = 'pip';
    } else if (file.name === 'Gemfile' || file.name.includes('Gemfile')) {
      dom.fileTypeSelect().value = 'gem';
    }
    startScan();
  };
  reader.readAsText(file);
}

// ── Scan ───────────────────────────────────────────────
function setupScanButton() {
  dom.scanBtn().addEventListener('click', startScan);

  // Allow Ctrl+Enter in textarea
  dom.pasteInput().addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      startScan();
    }
  });
}

async function startScan() {
  const content = dom.pasteInput().value.trim();
  if (!content) {
    shakeElement(dom.pasteInput());
    return;
  }

  let parsed;
  try {
    parsed = parseDependencyFile(content, dom.fileTypeSelect().value);
  } catch (err) {
    alert('Error parsing file: ' + err.message);
    return;
  }

  if (parsed.dependencies.length === 0) {
    alert('No dependencies found in the file.');
    return;
  }

  // Show scanning screen
  showSection('scanning');
  dom.scanningBar().style.width = '0%';
  dom.scanningStatus().textContent = 'Initializing scan...';

  try {
    currentReport = await scanDependencies(
      parsed.dependencies,
      parsed.ecosystem,
      (progress, status) => {
        dom.scanningBar().style.width = progress + '%';
        dom.scanningStatus().textContent = status;
      }
    );

    // Transition to results
    setTimeout(() => {
      showSection('results');
      renderResults(currentReport);
    }, 400);
  } catch (err) {
    alert('Scan error: ' + err.message);
    showSection('scanner');
  }
}

// ── Results Rendering ──────────────────────────────────
function renderResults(report) {
  // Header meta
  const eco = dom.resultsEcosystem();
  eco.textContent = report.ecosystem.toUpperCase();
  eco.className = 'results-tag ' + report.ecosystem;

  dom.resultsCount().textContent = `${report.totalDependencies} dependencies scanned`;
  dom.resultsTime().textContent = `${report.scanDuration}ms`;

  // Severity counts with animation
  animateCounter(dom.criticalCount(), report.severityCounts.critical);
  animateCounter(dom.highCount(), report.severityCounts.high);
  animateCounter(dom.mediumCount(), report.severityCounts.medium);
  animateCounter(dom.lowCount(), report.severityCounts.low);
  animateCounter(dom.infoCount(), report.severityCounts.info);

  // Risk gauge
  setTimeout(() => {
    drawRiskGauge(dom.riskGauge(), report.overallScore, report.overallSeverity);
    animateScore(dom.riskScoreLabel(), report.overallScore);

    const sevLabel = dom.riskScoreSeverity();
    sevLabel.textContent = report.overallSeverity === 'safe' ? '✓ SECURE' : report.overallSeverity.toUpperCase();
    sevLabel.style.color = getSeverityColor(report.overallSeverity);
  }, 100);

  // Category chart
  setTimeout(() => {
    drawCategoryChart(dom.categoriesChart(), report.categoryCounts);
  }, 200);

  // Findings list
  renderFindings(report.findings, 'all');
  setupFilters(report.findings);

  // Safe dependencies
  renderSafeDeps(report.safeDependencies);
}

function renderFindings(findings, filter) {
  const list = dom.findingsList();
  list.innerHTML = '';

  const filtered = filter === 'all'
    ? findings
    : findings.filter(f => f.severity === filter);

  if (filtered.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-muted);">
        <p style="font-size:16px;">No ${filter === 'all' ? '' : filter + ' '}findings</p>
      </div>
    `;
    return;
  }

  filtered.forEach((finding, i) => {
    const card = document.createElement('div');
    card.className = 'finding-card';
    card.style.animationDelay = (i * 0.05) + 's';
    card.dataset.severity = finding.severity;

    const severityIcon = getSeverityIcon(finding.severity);
    const typeLabel = getTypeLabel(finding.type);

    let detailsHTML = '';
    if (finding.type === 'typosquat' && finding.details.suspectedTyposquatOf) {
      detailsHTML = `
        <div class="finding-detail-row">
          <span class="finding-detail-label">Similar to:</span>
          <span class="finding-detail-value finding-similar-pkg">${finding.details.suspectedTyposquatOf}</span>
        </div>
        <div class="finding-detail-row">
          <span class="finding-detail-label">Edit distance:</span>
          <span class="finding-detail-value">${finding.details.editDistance}</span>
        </div>
        <div class="finding-detail-row">
          <span class="finding-detail-label">Patterns:</span>
          <span class="finding-detail-value">${finding.details.patterns.join(', ')}</span>
        </div>
      `;
    } else if (finding.type === 'malicious') {
      detailsHTML = `
        <div class="finding-detail-row">
          <span class="finding-detail-label">Status:</span>
          <span class="finding-detail-value" style="color:var(--severity-critical);">⚠ Known malicious package</span>
        </div>
      `;
    } else if (finding.type === 'confusion') {
      detailsHTML = finding.details.findings.map(f => `
        <div class="finding-detail-row">
          <span class="finding-detail-label">${f.check}:</span>
          <span class="finding-detail-value">${f.message}</span>
        </div>
      `).join('');
    } else if (finding.type === 'abandoned') {
      detailsHTML = finding.details.findings.map(f => `
        <div class="finding-detail-row">
          <span class="finding-detail-label">${f.check}:</span>
          <span class="finding-detail-value">${f.message}</span>
        </div>
      `).join('');
    }

    card.innerHTML = `
      <div class="finding-severity ${finding.severity}">${severityIcon}</div>
      <div class="finding-content">
        <div class="finding-name">${finding.package.name}${finding.package.version !== '*' ? ` <span style="color:var(--text-muted);font-weight:400;">${finding.package.version}</span>` : ''}</div>
        <div class="finding-desc">${finding.details.recommendation || ''}</div>
        <div class="finding-tags">
          <span class="finding-tag ${finding.type}">${typeLabel}</span>
        </div>
      </div>
      <div class="finding-score">${finding.score}</div>
    `;

    // Expand on click
    card.addEventListener('click', () => {
      const isExpanded = card.classList.contains('expanded');
      // Close others
      document.querySelectorAll('.finding-card.expanded').forEach(c => {
        c.classList.remove('expanded');
        const detail = c.querySelector('.finding-detail');
        if (detail) detail.remove();
      });

      if (!isExpanded && detailsHTML) {
        card.classList.add('expanded');
        const detail = document.createElement('div');
        detail.className = 'finding-detail';
        detail.innerHTML = detailsHTML;
        card.appendChild(detail);
      }
    });

    list.appendChild(card);
  });
}

function setupFilters(findings) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFindings(findings, btn.dataset.filter);
    });
  });
}

function renderSafeDeps(deps) {
  const list = dom.safeList();
  dom.safeCount().textContent = `(${deps.length})`;
  list.innerHTML = '';

  deps.forEach((dep, i) => {
    const pill = document.createElement('span');
    pill.className = 'safe-pill';
    pill.style.animationDelay = (i * 0.02) + 's';
    pill.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      ${dep.name}
    `;
    list.appendChild(pill);
  });
}

// ── Safe Toggle ────────────────────────────────────────
function setupSafeToggle() {
  dom.safeToggle().addEventListener('click', () => {
    const list = dom.safeList();
    const header = dom.safeToggle();
    list.classList.toggle('collapsed');
    header.classList.toggle('open');
  });
}

// ── Samples ────────────────────────────────────────────
function setupSamples() {
  document.querySelectorAll('.sample-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sample = btn.dataset.sample;
      dom.pasteInput().value = SAMPLES[sample];
      dom.fileTypeSelect().value = sample;

      // Scroll to textarea
      dom.pasteInput().scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Flash the scan button
      const scanBtn = dom.scanBtn();
      scanBtn.style.animation = 'none';
      scanBtn.offsetHeight; // reflow
      scanBtn.style.animation = 'pulse 0.6s ease';
    });
  });
}

// ── Export ──────────────────────────────────────────────
function setupExport() {
  dom.exportBtn().addEventListener('click', () => {
    if (!currentReport) return;

    // Show a mini menu
    const existing = document.querySelector('.export-menu');
    if (existing) { existing.remove(); return; }

    const menu = document.createElement('div');
    menu.className = 'export-menu';
    menu.style.cssText = `
      position: absolute; right: 0; top: 100%; margin-top: 8px;
      background: var(--bg-tertiary); border: 1px solid var(--glass-border);
      border-radius: 8px; overflow: hidden; z-index: 50;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    `;

    const jsonBtn = createMenuItem('📄 Export as JSON', () => { exportJSON(currentReport); menu.remove(); });
    const htmlBtn = createMenuItem('🌐 Export as HTML Report', () => { exportHTML(currentReport); menu.remove(); });

    menu.appendChild(jsonBtn);
    menu.appendChild(htmlBtn);

    const parent = dom.exportBtn().parentElement;
    parent.style.position = 'relative';
    parent.appendChild(menu);

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closer(e) {
        if (!menu.contains(e.target) && e.target !== dom.exportBtn()) {
          menu.remove();
          document.removeEventListener('click', closer);
        }
      });
    }, 0);
  });
}

function createMenuItem(text, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.cssText = `
    display: block; width: 100%; text-align: left; padding: 10px 16px;
    background: none; border: none; color: var(--text-secondary);
    font-family: inherit; font-size: 13px; cursor: pointer;
    transition: all 0.15s ease;
  `;
  btn.addEventListener('mouseover', () => {
    btn.style.background = 'rgba(255,255,255,0.05)';
    btn.style.color = 'var(--text-primary)';
  });
  btn.addEventListener('mouseout', () => {
    btn.style.background = 'none';
    btn.style.color = 'var(--text-secondary)';
  });
  btn.addEventListener('click', onClick);
  return btn;
}

// ── New Scan ───────────────────────────────────────────
function setupNewScan() {
  dom.newScanBtn().addEventListener('click', () => {
    currentReport = null;
    dom.pasteInput().value = '';
    dom.fileTypeSelect().value = 'auto';
    showSection('scanner');
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.section === 'scanner');
    });
  });
}

// ── Utilities ──────────────────────────────────────────
function getSeverityColor(severity) {
  const colors = {
    critical: '#f43f5e', high: '#f97316', medium: '#fbbf24',
    low: '#06b6d4', info: '#6366f1', safe: '#34d399',
  };
  return colors[severity] || '#888';
}

function getSeverityIcon(severity) {
  const icons = {
    critical: '!!', high: '!', medium: '▲', low: '◆', info: 'ℹ',
  };
  return icons[severity] || '?';
}

function getTypeLabel(type) {
  const labels = {
    typosquat: 'Typosquatting', confusion: 'Dep. Confusion',
    abandoned: 'Abandoned', malicious: 'Known Malicious',
  };
  return labels[type] || type;
}

function animateCounter(el, target) {
  if (target === 0) { el.textContent = '0'; return; }
  let current = 0;
  const duration = 800;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(target * eased);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
  el.style.borderColor = 'var(--severity-critical)';
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}

// Add shake keyframe dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    50% { transform: translateX(6px); }
    75% { transform: translateX(-4px); }
  }
`;
document.head.appendChild(style);
