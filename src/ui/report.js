/**
 * DepShield — Report Export Module
 * Export scan results as JSON and HTML reports
 */

/**
 * Export scan results as a downloadable JSON file
 * @param {object} report - Full scan report
 */
export function exportJSON(report) {
  const json = JSON.stringify(report, null, 2);
  downloadFile(json, `depshield-report-${timestamp()}.json`, 'application/json');
}

/**
 * Export scan results as a downloadable HTML report
 * @param {object} report - Full scan report
 */
export function exportHTML(report) {
  const html = generateHTMLReport(report);
  downloadFile(html, `depshield-report-${timestamp()}.html`, 'text/html');
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function severityColor(severity) {
  const colors = {
    critical: '#f43f5e',
    high: '#f97316',
    medium: '#fbbf24',
    low: '#06b6d4',
    info: '#6366f1',
    safe: '#34d399',
  };
  return colors[severity] || '#888';
}

function generateHTMLReport(report) {
  const findingsHTML = report.findings.map(f => `
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:4px solid ${severityColor(f.severity)};border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-family:monospace;font-weight:700;font-size:15px;color:#e8e8f0;">${f.package.name}</span>
        <span style="background:${severityColor(f.severity)}22;color:${severityColor(f.severity)};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;">${f.severity}</span>
      </div>
      <div style="font-size:13px;color:#9898b0;margin-bottom:6px;">
        <strong>Type:</strong> ${f.type} &nbsp;|&nbsp; <strong>Risk Score:</strong> ${f.score}/100
      </div>
      ${f.details.recommendation ? `<div style="font-size:13px;color:#06b6d4;margin-top:8px;">💡 ${f.details.recommendation}</div>` : ''}
    </div>
  `).join('');

  const safeHTML = report.safeDependencies.map(d =>
    `<span style="display:inline-block;background:rgba(52,211,153,0.1);color:#34d399;padding:4px 12px;border-radius:20px;font-size:12px;margin:3px;font-family:monospace;">✓ ${d.name}</span>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DepShield Security Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0f; color: #e8e8f0; padding: 40px; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .subtitle { color: #9898b0; margin-bottom: 32px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 900; }
    .stat-label { font-size: 12px; color: #5e5e78; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    h2 { font-size: 20px; margin: 32px 0 16px; }
    .safe-section { margin-top: 32px; padding: 20px; background: rgba(52,211,153,0.05); border: 1px solid rgba(52,211,153,0.15); border-radius: 12px; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 12px; color: #5e5e78; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛡️ DepShield Security Report</h1>
    <p class="subtitle">Generated on ${new Date().toLocaleString()} • Ecosystem: ${report.ecosystem.toUpperCase()} • Scan time: ${report.scanDuration}ms</p>

    <div class="stats">
      <div class="stat">
        <div class="stat-value" style="color:${severityColor(report.overallSeverity)}">${report.overallScore}</div>
        <div class="stat-label">Risk Score</div>
      </div>
      <div class="stat">
        <div class="stat-value">${report.totalDependencies}</div>
        <div class="stat-label">Dependencies</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color:#f43f5e">${report.totalFindings}</div>
        <div class="stat-label">Findings</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color:#34d399">${report.safeDependencies.length}</div>
        <div class="stat-label">Safe</div>
      </div>
    </div>

    <h2>Findings (${report.totalFindings})</h2>
    ${findingsHTML || '<p style="color:#5e5e78;">No security issues found. All dependencies appear safe.</p>'}

    <div class="safe-section">
      <h2 style="margin-top:0;color:#34d399;">✓ Safe Dependencies (${report.safeDependencies.length})</h2>
      <div style="margin-top:12px;">${safeHTML || '<p style="color:#5e5e78;">—</p>'}</div>
    </div>

    <div class="footer">
      <p>Generated by DepShield — Open-source supply chain security scanner</p>
    </div>
  </div>
</body>
</html>`;
}
