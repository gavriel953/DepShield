/**
 * DepShield — Charts Module
 * Custom canvas-based risk visualization charts
 */

/**
 * Draw a semicircular risk gauge
 * @param {HTMLCanvasElement} canvas
 * @param {number} score - Risk score 0–100
 * @param {string} severity - 'safe', 'low', 'medium', 'high', 'critical'
 */
export function drawRiskGauge(canvas, score, severity) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width;
  const h = canvas.height;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h - 10;
  const radius = Math.min(w, h) - 30;
  const lineWidth = 14;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, radius / 2, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Gradient arc segments
  const segments = [
    { end: 0.2, color: '#34d399' },
    { end: 0.4, color: '#06b6d4' },
    { end: 0.6, color: '#fbbf24' },
    { end: 0.8, color: '#f97316' },
    { end: 1.0, color: '#f43f5e' },
  ];

  // Draw colored segment up to score
  const scorePercent = Math.min(score / 100, 1);
  const scoreAngle = startAngle + scorePercent * Math.PI;

  for (let i = 0; i < segments.length; i++) {
    const segStart = startAngle + (i > 0 ? segments[i - 1].end : 0) * Math.PI;
    const segEnd = startAngle + segments[i].end * Math.PI;

    if (segStart >= scoreAngle) break;

    ctx.beginPath();
    ctx.arc(cx, cy, radius / 2, segStart, Math.min(segEnd, scoreAngle));
    ctx.strokeStyle = segments[i].color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Glow effect at current position
  if (score > 0) {
    const glowAngle = scoreAngle;
    const gx = cx + Math.cos(glowAngle) * (radius / 2);
    const gy = cy + Math.sin(glowAngle) * (radius / 2);

    const glowGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 20);
    const glowColor = getScoreColor(score);
    glowGrad.addColorStop(0, glowColor + '80');
    glowGrad.addColorStop(1, glowColor + '00');
    ctx.beginPath();
    ctx.arc(gx, gy, 20, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Dot at current position
    ctx.beginPath();
    ctx.arc(gx, gy, 5, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();
  }

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const angle = startAngle + (i / 10) * Math.PI;
    const innerR = radius / 2 - lineWidth / 2 - 6;
    const outerR = radius / 2 - lineWidth / 2 - 2;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = i % 5 === 0 ? 2 : 1;
    ctx.stroke();
  }
}

/**
 * Draw a donut chart showing category distribution
 * @param {HTMLCanvasElement} canvas
 * @param {object} categoryCounts - { typosquat, confusion, abandoned, malicious }
 */
export function drawCategoryChart(canvas, categoryCounts) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width;
  const h = canvas.height;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;
  const outerR = Math.min(w, h) / 2 - 30;
  const innerR = outerR * 0.6;

  const categories = [
    { key: 'typosquat', label: 'Typosquatting', color: '#a855f7' },
    { key: 'confusion', label: 'Dep. Confusion', color: '#f97316' },
    { key: 'abandoned', label: 'Abandoned', color: '#fbbf24' },
    { key: 'malicious', label: 'Malicious', color: '#f43f5e' },
  ];

  const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    // Empty state
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No issues found', cx, cy + 4);
    return;
  }

  let startAngle = -Math.PI / 2;
  const gap = 0.04;

  for (const cat of categories) {
    const count = categoryCounts[cat.key] || 0;
    if (count === 0) continue;

    const sweep = (count / total) * Math.PI * 2 - gap;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);
    ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = cat.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Label
    const midAngle = startAngle + sweep / 2;
    const labelR = outerR + 16;
    const lx = cx + Math.cos(midAngle) * (innerR + (outerR - innerR) / 2);
    const ly = cy + Math.sin(midAngle) * (innerR + (outerR - innerR) / 2);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count.toString(), lx, ly);

    startAngle += sweep + gap;
  }

  // Center text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '11px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${total} issues`, cx, cy);

  // Legend
  const legendY = h - 10;
  const legendSpacing = w / (categories.filter(c => categoryCounts[c.key] > 0).length + 1);
  let legendX = legendSpacing;

  for (const cat of categories) {
    if (!categoryCounts[cat.key]) continue;

    ctx.fillStyle = cat.color;
    ctx.beginPath();
    ctx.arc(legendX - 20, legendY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(cat.label, legendX - 14, legendY + 3);

    legendX += legendSpacing;
  }
}

/**
 * Animate a score counting up for the gauge label
 */
export function animateScore(element, targetScore, duration = 1200) {
  const start = performance.now();
  const startVal = 0;

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(startVal + (targetScore - startVal) * eased);
    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function getScoreColor(score) {
  if (score >= 80) return '#f43f5e';
  if (score >= 60) return '#f97316';
  if (score >= 35) return '#fbbf24';
  if (score >= 10) return '#06b6d4';
  return '#34d399';
}
