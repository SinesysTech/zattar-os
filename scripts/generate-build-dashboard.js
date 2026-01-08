#!/usr/bin/env node
/**
 * Build Performance Dashboard Generator
 *
 * Generates an interactive HTML dashboard from build performance history.
 * Uses Chart.js for visualizations and displays trends over time.
 *
 * Usage:
 *   node scripts/generate-build-dashboard.js
 */

const fs = require("fs");
const path = require("path");

// Directories
const rootDir = process.cwd();
const resultsDir = path.join(rootDir, "scripts", "results", "build-performance");
const historyDir = path.join(resultsDir, "history");
const dashboardPath = path.join(resultsDir, "dashboard.html");

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

// Load all historical build reports
function loadBuildHistory() {
  const reports = [];

  // Load from history directory
  if (fs.existsSync(historyDir)) {
    const files = fs.readdirSync(historyDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(historyDir, file), "utf8");
        const report = JSON.parse(content);
        reports.push(report);
      } catch (e) {
        log(`Warning: Could not parse ${file}`, colors.yellow);
      }
    }
  }

  // Load latest if exists
  const latestPath = path.join(resultsDir, "latest.json");
  if (fs.existsSync(latestPath)) {
    try {
      const content = fs.readFileSync(latestPath, "utf8");
      const report = JSON.parse(content);
      // Avoid duplicates
      if (!reports.find((r) => r.timestamp === report.timestamp)) {
        reports.push(report);
      }
    } catch (e) {
      log(`Warning: Could not parse latest.json`, colors.yellow);
    }
  }

  // Sort by timestamp
  reports.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return reports;
}

// Format bytes for display
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// Format duration for display
function formatDuration(ms) {
  if (!ms || ms === 0) return "0s";
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

// Generate HTML dashboard
function generateDashboard(reports) {
  // Prepare data for charts
  const timestamps = reports.map((r) =>
    new Date(r.timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const buildTimes = reports.map((r) => (r.total?.duration || 0) / 1000); // Convert to seconds
  const bundleSizes = reports.map((r) =>
    ((r.bundle?.totalSize || 0) / 1024 / 1024).toFixed(2)
  ); // Convert to MB
  const mainChunkSizes = reports.map((r) =>
    ((r.bundle?.mainChunk || 0) / 1024).toFixed(2)
  ); // Convert to KB
  const chunkCounts = reports.map((r) => r.bundle?.chunkCount || 0);
  const cacheHitRates = reports.map((r) =>
    ((r.cache?.hitRate || 0) * 100).toFixed(1)
  );

  // Calculate statistics
  const latestReport = reports[reports.length - 1] || {};
  const avgBuildTime =
    buildTimes.length > 0
      ? buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length
      : 0;
  const avgBundleSize =
    bundleSizes.length > 0
      ? bundleSizes.reduce((a, b) => a + parseFloat(b), 0) / bundleSizes.length
      : 0;

  // Get largest chunks from latest report
  const largestChunks = latestReport.bundle?.largestChunks || [];

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Build Performance Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #e4e4e7;
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 2rem;
    }
    header h1 {
      font-size: 2.5rem;
      background: linear-gradient(90deg, #06b6d4, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    header p {
      color: #a1a1aa;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    .stat-card .label {
      color: #a1a1aa;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .stat-card .value {
      font-size: 2rem;
      font-weight: 700;
      color: #06b6d4;
    }
    .stat-card .subtext {
      color: #71717a;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .chart-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .chart-card h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: #e4e4e7;
    }
    .chart-container {
      position: relative;
      height: 300px;
    }
    .table-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .table-card h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: #e4e4e7;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    th {
      color: #a1a1aa;
      font-weight: 500;
      font-size: 0.875rem;
      text-transform: uppercase;
    }
    td {
      color: #e4e4e7;
    }
    .size-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .size-bar-fill {
      height: 8px;
      background: linear-gradient(90deg, #06b6d4, #8b5cf6);
      border-radius: 4px;
    }
    footer {
      text-align: center;
      color: #71717a;
      font-size: 0.875rem;
      margin-top: 2rem;
    }
    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Build Performance Dashboard</h1>
      <p>Monitoramento de performance do build Next.js</p>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Ultimo Build</div>
        <div class="value">${formatDuration(latestReport.total?.duration || 0)}</div>
        <div class="subtext">Media: ${avgBuildTime.toFixed(1)}s</div>
      </div>
      <div class="stat-card">
        <div class="label">Tamanho Total</div>
        <div class="value">${formatBytes(latestReport.bundle?.totalSize || 0)}</div>
        <div class="subtext">Media: ${avgBundleSize.toFixed(2)} MB</div>
      </div>
      <div class="stat-card">
        <div class="label">Main Chunk</div>
        <div class="value">${formatBytes(latestReport.bundle?.mainChunk || 0)}</div>
        <div class="subtext">Threshold: 500KB</div>
      </div>
      <div class="stat-card">
        <div class="label">Chunks</div>
        <div class="value">${latestReport.bundle?.chunkCount || 0}</div>
        <div class="subtext">Threshold: 50</div>
      </div>
      <div class="stat-card">
        <div class="label">Cache Hit Rate</div>
        <div class="value">${((latestReport.cache?.hitRate || 0) * 100).toFixed(0)}%</div>
        <div class="subtext">Entradas: ${latestReport.cache?.entries || 0}</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h2>Tempo de Build ao Longo do Tempo</h2>
        <div class="chart-container">
          <canvas id="buildTimeChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h2>Tamanho do Bundle ao Longo do Tempo</h2>
        <div class="chart-container">
          <canvas id="bundleSizeChart"></canvas>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h2>Distribuicao de Metricas</h2>
        <div class="chart-container">
          <canvas id="metricsChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h2>Cache Hit Rate</h2>
        <div class="chart-container">
          <canvas id="cacheChart"></canvas>
        </div>
      </div>
    </div>

    <div class="table-card">
      <h2>Top 10 Maiores Chunks</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Chunk</th>
            <th>Tamanho</th>
            <th>Visualizacao</th>
          </tr>
        </thead>
        <tbody>
          ${largestChunks
            .slice(0, 10)
            .map((chunk, i) => {
              const maxSize = largestChunks[0]?.size || 1;
              const percentage = ((chunk.size / maxSize) * 100).toFixed(0);
              return `
            <tr>
              <td>${i + 1}</td>
              <td style="font-family: monospace; font-size: 0.875rem;">${chunk.name}</td>
              <td>${chunk.sizeFormatted || formatBytes(chunk.size)}</td>
              <td>
                <div class="size-bar">
                  <div class="size-bar-fill" style="width: ${percentage}%;"></div>
                </div>
              </td>
            </tr>
          `;
            })
            .join("")}
        </tbody>
      </table>
    </div>

    <footer>
      <p>Gerado em ${new Date().toLocaleString("pt-BR")} | ${reports.length} builds no historico</p>
    </footer>
  </div>

  <script>
    const chartColors = {
      primary: 'rgb(6, 182, 212)',
      primaryAlpha: 'rgba(6, 182, 212, 0.2)',
      secondary: 'rgb(139, 92, 246)',
      secondaryAlpha: 'rgba(139, 92, 246, 0.2)',
      success: 'rgb(34, 197, 94)',
      successAlpha: 'rgba(34, 197, 94, 0.2)',
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#a1a1aa'
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#71717a'
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#71717a'
          }
        }
      }
    };

    // Build Time Chart
    new Chart(document.getElementById('buildTimeChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(timestamps)},
        datasets: [{
          label: 'Tempo de Build (s)',
          data: ${JSON.stringify(buildTimes)},
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primaryAlpha,
          tension: 0.4,
          fill: true
        }]
      },
      options: chartOptions
    });

    // Bundle Size Chart
    new Chart(document.getElementById('bundleSizeChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(timestamps)},
        datasets: [{
          label: 'Tamanho Total (MB)',
          data: ${JSON.stringify(bundleSizes)},
          borderColor: chartColors.secondary,
          backgroundColor: chartColors.secondaryAlpha,
          tension: 0.4,
          fill: true
        }, {
          label: 'Main Chunk (KB)',
          data: ${JSON.stringify(mainChunkSizes)},
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primaryAlpha,
          tension: 0.4,
          fill: false,
          yAxisID: 'y1'
        }]
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y1: {
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              color: '#71717a'
            }
          }
        }
      }
    });

    // Metrics Distribution Chart
    new Chart(document.getElementById('metricsChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(timestamps)},
        datasets: [{
          label: 'Numero de Chunks',
          data: ${JSON.stringify(chunkCounts)},
          backgroundColor: chartColors.primary,
          borderRadius: 4
        }]
      },
      options: chartOptions
    });

    // Cache Hit Rate Chart
    new Chart(document.getElementById('cacheChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(timestamps)},
        datasets: [{
          label: 'Cache Hit Rate (%)',
          data: ${JSON.stringify(cacheHitRates)},
          borderColor: chartColors.success,
          backgroundColor: chartColors.successAlpha,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y: {
            ...chartOptions.scales.y,
            min: 0,
            max: 100
          }
        }
      }
    });
  </script>
</body>
</html>`;

  return html;
}

// Main execution
function main() {
  log("\n=== Build Performance Dashboard Generator ===\n", colors.blue);

  // Ensure results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Load build history
  log("Loading build history...", colors.blue);
  const reports = loadBuildHistory();

  if (reports.length === 0) {
    log(
      "No build reports found. Run 'npm run analyze:build-performance' first.",
      colors.yellow
    );
    process.exit(0);
  }

  log(`Found ${reports.length} build reports`, colors.green);

  // Generate dashboard
  log("Generating dashboard...", colors.blue);
  const html = generateDashboard(reports);

  // Write dashboard file
  fs.writeFileSync(dashboardPath, html);
  log(`Dashboard saved to ${dashboardPath}`, colors.green);

  log("\nDone! Open the dashboard in a browser to view.", colors.green);
}

main();
