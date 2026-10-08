/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Activity, 
  Clock, 
  RotateCcw, 
  PlusCircle, 
  TrendingUp, 
  Server, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Globe2
} from 'lucide-react';

export interface LatencyCheck {
  id: string;
  checkNumber: number;
  timeString: string;
  responseTimeMs: number;
  endpoint: string;
  nodeLocation: string;
  httpStatus: number;
  statusText: string;
  isSimulatedSample: boolean;
}

// 3 made-up example entries specific to Malaysia, ready on first open
const INITIAL_MALAYSIA_CHECKS: LatencyCheck[] = [
  {
    id: 'sample-my-1',
    checkNumber: 1,
    timeString: '21:14:15',
    responseTimeMs: 128,
    endpoint: 'staging-auth.kedairuncit.my/v1/token',
    nodeLocation: 'Cyberjaya Cloud DC · Selangor, MY',
    httpStatus: 200,
    statusText: 'OK',
    isSimulatedSample: true,
  },
  {
    id: 'sample-my-2',
    checkNumber: 2,
    timeString: '21:14:48',
    responseTimeMs: 84,
    endpoint: 'staging.paygate.com.my/v2/health',
    nodeLocation: 'Kuala Lumpur Gateway Node · KL, MY',
    httpStatus: 200,
    statusText: 'OK',
    isSimulatedSample: true,
  },
  {
    id: 'sample-my-3',
    checkNumber: 3,
    timeString: '21:15:22',
    responseTimeMs: 215,
    endpoint: 'staging-cdn.pasarminggu.my/catalog/items',
    nodeLocation: 'Johor Bahru Edge Point · Johor, MY',
    httpStatus: 200,
    statusText: 'OK',
    isSimulatedSample: true,
  },
];

// Pool of simulated Malaysian staging endpoints
const MALAYSIAN_STAGING_ENDPOINTS = [
  { endpoint: 'staging-api.my-retail.my/v1/cart', nodeLocation: 'Cyberjaya Cloud DC · Selangor, MY', baseMs: 110, variance: 40 },
  { endpoint: 'staging.paygate.com.my/v2/payment/ping', nodeLocation: 'Kuala Lumpur Gateway Node · KL, MY', baseMs: 78, variance: 30 },
  { endpoint: 'staging-checkout.pasaraya.my/order/calc', nodeLocation: 'Petaling Jaya Staging Pod · Selangor, MY', baseMs: 165, variance: 55 },
  { endpoint: 'staging-cdn.pasarminggu.my/catalog/items', nodeLocation: 'Johor Bahru Edge Point · Johor, MY', baseMs: 195, variance: 60 },
  { endpoint: 'staging-api.penang-logistics.my/routes', nodeLocation: 'Penang Bayan Lepas Node · Penang, MY', baseMs: 135, variance: 45 },
  { endpoint: 'staging-app.borneo-fresh.com.my/sync', nodeLocation: 'Kuching Regional Hub · Sarawak, MY', baseMs: 240, variance: 70 },
  { endpoint: 'staging-auth.kedairuncit.my/v1/verify', nodeLocation: 'Cyberjaya Cloud DC · Selangor, MY', baseMs: 95, variance: 35 },
  { endpoint: 'staging-inventory.ipoh-mart.my/stock', nodeLocation: 'Ipoh Staging Server · Perak, MY', baseMs: 150, variance: 50 },
];

export default function App() {
  // Ordered chronologically (oldest to newest) for chart, but displayed newest-first in the list
  const [checks, setChecks] = useState<LatencyCheck[]>(INITIAL_MALAYSIA_CHECKS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [intervalMs, setIntervalMs] = useState<number>(2000);
  const [selectedPoint, setSelectedPoint] = useState<LatencyCheck | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('21:15:22');

  const checkCountRef = useRef<number>(3);
  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;

  // Format current local time HH:MM:SS
  const getCurrentTimeString = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  // Generate a new sample check
  const produceNewCheck = (): LatencyCheck => {
    checkCountRef.current += 1;
    const currentNum = checkCountRef.current;
    const poolIndex = (currentNum - 1) % MALAYSIAN_STAGING_ENDPOINTS.length;
    const target = MALAYSIAN_STAGING_ENDPOINTS[poolIndex];
    
    // Add realistic jitter
    const jitter = Math.floor((Math.random() - 0.45) * target.variance);
    const calculatedLatency = Math.max(45, target.baseMs + jitter);
    const timeStr = getCurrentTimeString();

    return {
      id: `check-${Date.now()}-${currentNum}`,
      checkNumber: currentNum,
      timeString: timeStr,
      responseTimeMs: calculatedLatency,
      endpoint: target.endpoint,
      nodeLocation: target.nodeLocation,
      httpStatus: 200,
      statusText: 'OK',
      isSimulatedSample: true,
    };
  };

  // Feature 1: Start and stop live checks
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      const newCheck = produceNewCheck();
      setLastCheckTime(newCheck.timeString);
      setChecks((prev) => [...prev, newCheck]);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, intervalMs]);

  // Handle single check on-demand
  const handleRunSingleCheck = () => {
    const newCheck = produceNewCheck();
    setLastCheckTime(newCheck.timeString);
    setChecks((prev) => [...prev, newCheck]);
  };

  // Reset to initial 3 Malaysia checks
  const handleReset = () => {
    setIsRunning(false);
    checkCountRef.current = 3;
    setChecks(INITIAL_MALAYSIA_CHECKS);
    setSelectedPoint(null);
    setLastCheckTime('21:15:22');
  };

  // Computed summary stats
  const stats = useMemo(() => {
    if (checks.length === 0) {
      return { avg: 0, min: 0, max: 0, latest: 0 };
    }
    const latencies = checks.map((c) => c.responseTimeMs);
    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / latencies.length);
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const latest = checks[checks.length - 1].responseTimeMs;
    return { avg, min, max, latest };
  }, [checks]);

  // Section 3 view: latest checks first (reversed chronological)
  const latestChecksList = useMemo(() => {
    return [...checks].reverse();
  }, [checks]);

  // Chart coordinate calculations
  const chartData = useMemo(() => {
    // Keep up to 30 recent data points for clear chart readability
    const points = checks.slice(-30);
    const maxVal = Math.max(300, Math.ceil((Math.max(...points.map((p) => p.responseTimeMs)) + 30) / 50) * 50);
    const minVal = 0;

    // Moving average trend line calculation (window of 3)
    const trendValues = points.map((p, idx, arr) => {
      const windowStart = Math.max(0, idx - 2);
      const sub = arr.slice(windowStart, idx + 1);
      const subAvg = sub.reduce((acc, curr) => acc + curr.responseTimeMs, 0) / sub.length;
      return Math.round(subAvg);
    });

    return {
      points,
      trendValues,
      maxVal,
      minVal,
    };
  }, [checks]);

  // Color helper based on response time thresholds
  const getLatencyBadgeColor = (ms: number) => {
    if (ms < 110) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
    if (ms < 220) return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80';
    return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
  };

  const getLatencyPointFill = (ms: number) => {
    if (ms < 110) return '#10b981'; // emerald
    if (ms < 220) return '#06b6d4'; // cyan
    return '#f59e0b'; // amber
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-[#0a0f18]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              Staging Response Time Dashboard
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Malaysia Staging Node Cluster</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Controlled Staging Verification</span>
            </p>
          </div>
        </div>

        {/* Global Action Shortcut & Malaysian Cluster Marker */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>MY-STG-NODE-01</span>
            <span className="text-slate-600">|</span>
            <span>{checks.length} Checks</span>
          </div>

          <button
            onClick={handleReset}
            title="Reset to 3 Malaysia example checks"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </header>

      {/* Main Single-Page Container (Stacked down ONE screen) */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6 flex-1">
        
        {/* Sample Data Disclosure Banner */}
        <div className="text-xs font-mono text-slate-400 bg-slate-900/70 border border-slate-800/80 rounded-lg px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-slate-300 font-semibold">Sample Staging Environment:</strong> All response times and checks are generated sample testing data simulated across Malaysian staging copies.
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-3 text-slate-500 shrink-0">
            <span>Cyberjaya</span>
            <span>·</span>
            <span>Kuala Lumpur</span>
            <span>·</span>
            <span>Johor Bahru</span>
          </div>
        </div>

        {/* =========================================================================
            SECTION 1: TEST STATUS
            Purpose: Show whether the test is running or paused
            Shows: A large status label, a small summary line, and a start/stop control
            Main action: Start or pause the test
            ========================================================================= */}
        <section 
          aria-labelledby="section-status-title"
          className="bg-[#0e1422] border border-slate-800 rounded-xl p-5 sm:p-6 relative overflow-hidden shadow-xl"
        >
          {/* Subtle status glow highlight */}
          <div 
            className={`absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
              isRunning ? 'bg-emerald-500/15 opacity-100' : 'bg-amber-500/10 opacity-70'
            }`} 
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Status Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xs uppercase tracking-wider font-mono text-slate-400 font-semibold">
                  Section 1 · Test Status
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">
                  Cadence: {(intervalMs / 1000).toFixed(1)}s interval
                </span>
              </div>

              {/* Large Status Label */}
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <span 
                      className={`w-4 h-4 rounded-full ${
                        isRunning ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    {isRunning && (
                      <span className="absolute w-6 h-6 rounded-full bg-emerald-400/40 animate-ping" />
                    )}
                  </div>
                  <h2 
                    id="section-status-title"
                    className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono"
                  >
                    {isRunning ? 'TEST RUNNING' : 'TEST PAUSED'}
                  </h2>
                </div>

                <span 
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${
                    isRunning 
                      ? 'text-emerald-400 border-emerald-800/80 bg-emerald-950/40' 
                      : 'text-amber-300 border-amber-800/80 bg-amber-950/40'
                  }`}
                >
                  {isRunning ? 'LIVE POLLING ACTIVE' : 'STANDBY MODE'}
                </span>
              </div>

              {/* Small Summary Line */}
              <p className="text-sm text-slate-400 pt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                {isRunning ? (
                  <>
                    <span>Continuous automated checks active across Malaysian staging endpoints.</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-emerald-400 font-mono">Last check at {lastCheckTime}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-mono">{checks.length} checks recorded</span>
                  </>
                ) : (
                  <>
                    <span>Controlled staging run paused.</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-mono">{checks.length} sample checks available</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 font-mono">Avg Latency: {stats.avg} ms</span>
                  </>
                )}
              </p>
            </div>

            {/* Start/Stop Control & Cadence Selector */}
            <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
              {/* Cadence Selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                <span className="text-slate-400 px-2 py-1 font-mono">Rate:</span>
                {[
                  { label: '1.5s', ms: 1500 },
                  { label: '2.0s', ms: 2000 },
                  { label: '4.0s', ms: 4000 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setIntervalMs(item.ms)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      intervalMs === item.ms
                        ? 'bg-slate-700 text-white font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Main Action: Start or Pause the Test */}
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all shadow-lg active:scale-95 ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Test</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Test</span>
                  </>
                )}
              </button>

              {/* Instant Manual Single Check Button */}
              <button
                onClick={handleRunSingleCheck}
                title="Immediately run one additional sample check"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors hover:border-slate-600 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Run Single Check</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/70">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Latest Latency</span>
              <div className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                {stats.latest} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Average Latency</span>
              <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                {stats.avg} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Fastest (Min)</span>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                {stats.min} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Peak (Max)</span>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                {stats.max} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: RESPONSE TIME CHART
            Purpose: Visualize response time changes over time
            Shows: A simple chart with sample response time points and a clear trend line
            Main action: View how response time changes
            ========================================================================= */}
        <section 
          aria-labelledby="section-chart-title"
          className="bg-[#0e1422] border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-mono text-slate-400 font-semibold">
                  Section 2 · Latency Telemetry
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">Chronological Progression</span>
              </div>
              <h2 id="section-chart-title" className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
                <span>Response Time Chart</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualizing staging response time changes over time with real-time updates and moving average trend line.
              </p>
            </div>

            {/* Legend & Trend indicator */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-slate-900/90 border border-slate-800/90 px-3.5 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="text-slate-300">Sample Point</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-0.5 bg-emerald-400 border-t border-dashed border-emerald-400"></span>
                <span className="text-slate-300">Trend Line (Avg)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-0.5 bg-slate-700"></span>
                <span className="text-slate-400">Threshold (200ms)</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart Canvas (SVG based for sharp high-contrast rendering) */}
          <div className="relative bg-[#090d16] border border-slate-800/80 rounded-lg p-4 sm:p-6 overflow-hidden">
            {/* Chart SVG Canvas */}
            <div className="w-full h-64 sm:h-72">
              <svg 
                viewBox="0 0 800 240" 
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Gradient fill beneath latency line */}
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Gradient fill for trendline */}
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines & Reference Values */}
                {[0, 100, 200, 300].map((gridVal) => {
                  const y = 220 - (gridVal / chartData.maxVal) * 200;
                  return (
                    <g key={gridVal}>
                      <line
                        x1="45"
                        y1={y}
                        x2="795"
                        y2={y}
                        stroke="#1e293b"
                        strokeWidth={gridVal === 200 ? '1.5' : '1'}
                        strokeDasharray={gridVal === 200 ? '4 4' : '2 2'}
                      />
                      <text
                        x="38"
                        y={y + 3}
                        textAnchor="end"
                        className="text-[10px] font-mono fill-slate-400 tabular-nums"
                      >
                        {gridVal}ms
                      </text>
                    </g>
                  );
                })}

                {/* 200ms target line highlight label */}
                {(() => {
                  const y200 = 220 - (200 / chartData.maxVal) * 200;
                  return (
                    <text
                      x="790"
                      y={y200 - 5}
                      textAnchor="end"
                      className="text-[9px] font-mono fill-slate-400 uppercase tracking-wider"
                    >
                      Target Limit: 200ms
                    </text>
                  );
                })()}

                {/* Coordinates Calculation */}
                {(() => {
                  const n = chartData.points.length;
                  if (n === 0) return null;

                  const getX = (idx: number) => {
                    if (n === 1) return 420;
                    return 55 + (idx / (n - 1)) * 735;
                  };

                  const getY = (ms: number) => {
                    const clamped = Math.min(chartData.maxVal, Math.max(0, ms));
                    return 220 - (clamped / chartData.maxVal) * 200;
                  };

                  // Area Path under response line
                  const firstX = getX(0);
                  const lastX = getX(n - 1);
                  let areaPath = `M ${firstX} 220 L ${firstX} ${getY(chartData.points[0].responseTimeMs)}`;
                  for (let i = 1; i < n; i++) {
                    areaPath += ` L ${getX(i)} ${getY(chartData.points[i].responseTimeMs)}`;
                  }
                  areaPath += ` L ${lastX} 220 Z`;

                  // Line Path for actual response times
                  let responseLinePath = `M ${firstX} ${getY(chartData.points[0].responseTimeMs)}`;
                  for (let i = 1; i < n; i++) {
                    responseLinePath += ` L ${getX(i)} ${getY(chartData.points[i].responseTimeMs)}`;
                  }

                  // Trend Line Path (Moving Average)
                  let trendLinePath = `M ${firstX} ${getY(chartData.trendValues[0])}`;
                  for (let i = 1; i < n; i++) {
                    trendLinePath += ` L ${getX(i)} ${getY(chartData.trendValues[i])}`;
                  }

                  return (
                    <>
                      {/* Shaded Area under response points */}
                      <path d={areaPath} fill="url(#latencyGradient)" />

                      {/* Moving Average Trend Line */}
                      <path
                        d={trendLinePath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray="5 3"
                        opacity="0.9"
                      />

                      {/* Main Response Time Connecting Line */}
                      <path
                        d={responseLinePath}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Interactive Sample Response Points */}
                      {chartData.points.map((pt, idx) => {
                        const px = getX(idx);
                        const py = getY(pt.responseTimeMs);
                        const isHovered = selectedPoint?.id === pt.id;
                        const isLatest = idx === n - 1;

                        return (
                          <g 
                            key={pt.id} 
                            className="cursor-pointer"
                            onMouseEnter={() => setSelectedPoint(pt)}
                            onClick={() => setSelectedPoint(pt)}
                          >
                            {/* Hover halo or latest pulsing ring */}
                            {isLatest && (
                              <circle
                                cx={px}
                                cy={py}
                                r="9"
                                fill="none"
                                stroke="#06b6d4"
                                strokeWidth="1.5"
                                opacity="0.6"
                                className="animate-ping"
                              />
                            )}

                            {isHovered && (
                              <circle
                                cx={px}
                                cy={py}
                                r="10"
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="2"
                                opacity="0.8"
                              />
                            )}

                            {/* Point Core Circle */}
                            <circle
                              cx={px}
                              cy={py}
                              r={isHovered ? '6' : isLatest ? '5' : '4'}
                              fill={getLatencyPointFill(pt.responseTimeMs)}
                              stroke="#090d16"
                              strokeWidth="2"
                              className="transition-all"
                            />

                            {/* Response value label above node if fewer than 15 points */}
                            {n <= 15 && (
                              <text
                                x={px}
                                y={py - 10}
                                textAnchor="middle"
                                className="text-[10px] font-mono fill-slate-300 font-semibold"
                              >
                                {pt.responseTimeMs}ms
                              </text>
                            )}

                            {/* X-axis Check Number Indicator */}
                            {(idx % Math.ceil(n / 8) === 0 || idx === n - 1) && (
                              <text
                                x={px}
                                y="235"
                                textAnchor="middle"
                                className="text-[9px] font-mono fill-slate-400"
                              >
                                #{pt.checkNumber}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Selected Point Inspection Tooltip Overlay */}
            {selectedPoint && (
              <div className="mt-3 p-3 bg-slate-900/90 border border-slate-700 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLatencyPointFill(selectedPoint.responseTimeMs) }} />
                  <div>
                    <span className="font-mono font-bold text-white">Check #{selectedPoint.checkNumber}</span>
                    <span className="text-slate-400 ml-2">recorded at {selectedPoint.timeString}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <span className="text-slate-400">{selectedPoint.endpoint}</span>
                  <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {selectedPoint.responseTimeMs} ms
                  </span>
                  <button 
                    onClick={() => setSelectedPoint(null)} 
                    className="text-slate-400 hover:text-white underline ml-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chart Analysis Footer Line */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-mono pt-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>
                Trend Analysis: Moving average is currently at <strong className="text-emerald-400 font-bold">{stats.avg} ms</strong> across {checks.length} sample points.
              </span>
            </div>
            <div className="text-slate-400">
              Hover over points to inspect specific checks
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: LATEST CHECKS
            Purpose: Show the newest test results first
            Shows: A short list of recent check entries with time and response time
            Main action: Review the latest results
            ========================================================================= */}
        <section 
          aria-labelledby="section-checks-title"
          className="bg-[#0e1422] border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-mono text-slate-400 font-semibold">
                  Section 3 · Execution History
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">Newest checks first</span>
              </div>
              <h2 id="section-checks-title" className="text-xl font-bold text-white tracking-tight mt-0.5">
                Latest Checks
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reviewing newest test results first. New checks appear immediately at the top upon completion.
              </p>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Showing {latestChecksList.length} total checks</span>
            </div>
          </div>

          {/* Table / List of Recent Check Entries */}
          <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#090d16]">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium tracking-wider">
                  <th className="py-3 px-4 w-20">Seq</th>
                  <th className="py-3 px-4 w-28">Time</th>
                  <th className="py-3 px-4">Staging Endpoint & Node</th>
                  <th className="py-3 px-4 w-32 text-right">Response Time</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-28 text-right">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {latestChecksList.map((check, index) => {
                  const isVeryFirstInList = index === 0;

                  return (
                    <tr 
                      key={check.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isVeryFirstInList ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Check Order / Seq */}
                      <td className="py-3 px-4 font-bold text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>#{check.checkNumber}</span>
                          {isVeryFirstInList && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-normal">
                              LATEST
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 text-slate-300 tabular-nums whitespace-nowrap">
                        {check.timeString}
                      </td>

                      {/* Staging Endpoint & Malaysia Region */}
                      <td className="py-3 px-4 text-slate-200">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <Server className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{check.endpoint}</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {check.nodeLocation}
                          </span>
                        </div>
                      </td>

                      {/* Response Time */}
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                        <span 
                          className={`inline-block px-2 py-0.5 rounded font-bold border ${getLatencyBadgeColor(
                            check.responseTimeMs
                          )}`}
                        >
                          {check.responseTimeMs} ms
                        </span>
                      </td>

                      {/* HTTP Status Code */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{check.httpStatus} {check.statusText}</span>
                        </span>
                      </td>

                      {/* Sample verification tag */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="text-[11px] text-slate-400">
                          {check.isSimulatedSample ? 'Sample Check' : 'Live Check'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer review prompt */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
            <span>
              All {latestChecksList.length} results generated for controlled Malaysia staging verification.
            </span>
            <span className="text-slate-400">
              Sorted newest to oldest
            </span>
          </div>
        </section>

      </main>

      {/* Technical Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] px-4 sm:px-8 py-4 text-center text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>Staging Response Time Dashboard</span>
          <span className="text-slate-600">·</span>
          <span>Malaysia Edge & DC Staging Simulation</span>
        </div>
        <div className="text-slate-400">
          Controlled testing environment · No persistent storage
        </div>
      </footer>
    </div>
  );
}
