// Chart.js avec uniquement les modules nécessaires (bundle allégé).
import {
  Chart,
  LineController,
  BarController,
  DoughnutController,
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(LineController, BarController, DoughnutController, LineElement, BarElement, ArcElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
Chart.defaults.font.size = 11.5;
Chart.defaults.color = '#7c8a84';
Chart.defaults.borderColor = '#efece4';
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.boxHeight = 10;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.tooltip.backgroundColor = '#0f3b2c';
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.animation.duration = 500;

// Lignes horizontales de seuils (stress / optimum) sur les courbes d'humidité
export const thresholdPlugin = {
  id: 'thresholds',
  afterDraw(chart, _args, opts) {
    if (!opts?.lines) return;
    const { ctx, chartArea, scales } = chart;
    ctx.save();
    for (const l of opts.lines) {
      const y = scales.y.getPixelForValue(l.value);
      if (y < chartArea.top || y > chartArea.bottom) continue;
      ctx.strokeStyle = l.color;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = l.color;
      ctx.font = '600 11px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(l.label, chartArea.right - 4, y - 5);
    }
    ctx.restore();
  },
};

export { Chart };
