import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Table as TableIcon,
  Sliders,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { Dataset, DataPoint, ChannelId, CHANNEL_CONFIGS } from '../types/signal';
import {
  generateSyntheticDataset,
  calculateDatasetStatistics,
} from '../services/syntheticGenerator';

interface DataExplorerProps {
  currentDataset: Dataset;
  onDatasetLoaded: (dataset: Dataset) => void;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({
  currentDataset,
  onDatasetLoaded,
}) => {
  // Generator parameter state
  const [duration, setDuration] = useState(30);
  const [samplingRate, setSamplingRate] = useState(25);
  const [heartRate, setHeartRate] = useState(72);
  const [motionIntensity, setMotionIntensity] = useState(0.4);
  const [seed, setSeed] = useState(42);
  const [includeAnomalies, setIncludeAnomalies] = useState(true);

  // Upload & validation state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const rowsPerPage = 12;

  // Handle Synthetic Dataset Generation
  const handleGenerate = () => {
    const newDs = generateSyntheticDataset(
      `Synthetic Run (Seed ${seed}, fs=${samplingRate}Hz)`,
      {
        durationSeconds: duration,
        samplingRate,
        heartRateBpm: heartRate,
        motionIntensity,
        seed,
        includeAnomalies,
      }
    );
    onDatasetLoaded(newDs);
    setUploadSuccess(`Generated new synthetic dataset with ${newDs.sampleCount} samples.`);
    setUploadError(null);
    setPageIndex(0);
  };

  // Handle CSV File Upload via PapaParse
  const processCsvFile = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setUploadError('The uploaded CSV file is empty or could not be parsed.');
          return;
        }

        const rawRows = results.data;
        const columns = Object.keys(rawRows[0] || {});

        // Validation: Look for timestamp column
        const timeCol = columns.find((c) =>
          /time|timestamp|sec|t$/i.test(c.trim())
        );
        const ch680Col = columns.find((c) =>
          /680|ch1|channel_1|hhb/i.test(c.trim())
        );
        const ch780Col = columns.find((c) =>
          /780|ch2|channel_2|iso/i.test(c.trim())
        );
        const ch850Col = columns.find((c) =>
          /850|ch3|channel_3|hbo/i.test(c.trim())
        );
        const ch1064Col = columns.find((c) =>
          /1064|ch4|channel_4|h2o|water/i.test(c.trim())
        );
        const motionCol = columns.find((c) =>
          /motion|accel|ref|gyro/i.test(c.trim())
        );

        if (!ch680Col || !ch780Col || !ch850Col || !ch1064Col) {
          setUploadError(
            `Missing required optical wavelength channels. Detected columns: [${columns.join(
              ', '
            )}]. Expected columns like: timestamp, channel_680, channel_780, channel_850, channel_1064 (and optional motion_reference).`
          );
          return;
        }

        const validData: DataPoint[] = [];
        let invalidRows = 0;

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          const t = timeCol ? Number(row[timeCol]) : i * 0.04;
          const v680 = Number(row[ch680Col]);
          const v780 = Number(row[ch780Col]);
          const v850 = Number(row[ch850Col]);
          const v1064 = Number(row[ch1064Col]);
          const vMotion = motionCol ? Number(row[motionCol]) : 0;

          if (
            isNaN(v680) ||
            isNaN(v780) ||
            isNaN(v850) ||
            isNaN(v1064)
          ) {
            invalidRows++;
            continue;
          }

          validData.push({
            timestamp: Number(t.toFixed(3)),
            channel_680: v680,
            channel_780: v780,
            channel_850: v850,
            channel_1064: v1064,
            motion_reference: vMotion,
          });
        }

        if (validData.length === 0) {
          setUploadError('All rows in the CSV contained invalid numeric data.');
          return;
        }

        const durationSec =
          validData[validData.length - 1].timestamp - validData[0].timestamp ||
          validData.length * 0.04;
        const estFs = Math.round(validData.length / durationSec) || 25;
        const statistics = calculateDatasetStatistics(validData);

        const loadedDataset: Dataset = {
          id: `DS-UP-${Date.now().toString().slice(-6)}`,
          name: file.name.replace(/\.csv$/i, ''),
          description: `User-uploaded optical dataset with ${validData.length} valid rows (${invalidRows} invalid rows omitted).`,
          source: 'uploaded',
          createdAt: new Date().toISOString(),
          sampleCount: validData.length,
          samplingRate: estFs,
          durationSeconds: Number(durationSec.toFixed(1)),
          data: validData,
          columnNames: [
            'timestamp',
            'channel_680',
            'channel_780',
            'channel_850',
            'channel_1064',
            'motion_reference',
          ],
          hasMotionReference: Boolean(motionCol),
          statistics,
        };

        onDatasetLoaded(loadedDataset);
        setUploadSuccess(
          `Successfully loaded "${file.name}": ${validData.length} valid records ingested.`
        );
        setPageIndex(0);
      },
      error: (err) => {
        setUploadError(`Failed to parse CSV file: ${err.message}`);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCsvFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processCsvFile(file);
  };

  // Download Current Dataset as CSV
  const handleDownloadCsv = () => {
    const csvContent = Papa.unparse(currentDataset.data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentDataset.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table slice
  const paginatedRows = currentDataset.data.slice(
    pageIndex * rowsPerPage,
    (pageIndex + 1) * rowsPerPage
  );
  const totalPages = Math.ceil(currentDataset.data.length / rowsPerPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Telemetry Input & Dataset Calibration
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Data Explorer & CSV Ingestion
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Generate calibrated synthetic 4-channel hemodynamics or upload research CSV records. Validates column schema, sampling frequency, and optical density statistics.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Split Section: Synthetic Generator Controls (Left) & CSV Upload Box (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Synthetic Generator (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Synthetic Multi-Spectral Generator
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Reproducible Mulberry32 Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Duration: <span className="text-cyan-300 font-semibold">{duration}s</span>
              </label>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="text-[10px] text-slate-500 font-mono">Total points: {duration * samplingRate}</span>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Sampling Rate: <span className="text-cyan-300 font-semibold">{samplingRate} Hz</span>
              </label>
              <select
                value={samplingRate}
                onChange={(e) => setSamplingRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value={10}>10 Hz (Low Power Mode)</option>
                <option value={25}>25 Hz (Standard NIRS Telemetry)</option>
                <option value={50}>50 Hz (High Resolution)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Heart Rate: <span className="text-rose-400 font-semibold">{heartRate} BPM</span>
              </label>
              <input
                type="range"
                min="50"
                max="120"
                step="2"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full accent-rose-400"
              />
              <span className="text-[10px] text-slate-500 font-mono">Fundamental cardiac: {(heartRate / 60).toFixed(2)} Hz</span>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Motion Intensity: <span className="text-amber-400 font-semibold">{(motionIntensity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={motionIntensity}
                onChange={(e) => setMotionIntensity(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
              <span className="text-[10px] text-slate-500 font-mono">Head rotation & slippage amplitude</span>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Random Seed: <span className="text-cyan-300 font-semibold">{seed}</span>
              </label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300 mb-2">
                <input
                  type="checkbox"
                  checked={includeAnomalies}
                  onChange={(e) => setIncludeAnomalies(e.target.checked)}
                  className="rounded border-slate-700 accent-cyan-400"
                />
                <span>Inject Stasis Anomaly (t=15s)</span>
              </label>

              <button
                onClick={handleGenerate}
                className="w-full px-3.5 py-2 text-xs font-medium text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors flex items-center justify-center gap-1.5 font-sans"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Dataset</span>
              </button>
            </div>
          </div>
        </div>

        {/* CSV Upload & Validation Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0c101a] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Upload CSV Research File
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Schema Ingestion</span>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-medium text-slate-200">
                Click to browse or drop CSV here
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Expected: timestamp, channel_680, channel_780, channel_850, channel_1064
              </div>
            </div>

            {/* Status alerts */}
            {uploadError && (
              <div className="mt-3 p-3 bg-rose-950/30 border border-rose-800/50 rounded text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Format Error</div>
                  <div className="mt-0.5 text-rose-400/90 text-[11px] leading-relaxed">
                    {uploadError}
                  </div>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-800/50 rounded text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] font-mono leading-relaxed">{uploadSuccess}</div>
              </div>
            )}
          </div>

          {/* Validation Specifications summary */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Required Optical Channels:</span>
              <span className="text-cyan-400">4 Wavelengths</span>
            </div>
            <div className="flex justify-between">
              <span>Reference Motion Channel:</span>
              <span className="text-slate-300">Supported (Optional)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Statistics Matrix */}
      <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Dataset Calibration & Descriptive Statistics
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Source: <span className="text-cyan-400 font-mono">{currentDataset.source.toUpperCase()}</span> ({currentDataset.name}) · {currentDataset.sampleCount} records over {currentDataset.durationSeconds}s
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Channel Identifier</th>
                <th className="py-2.5 px-3">Target Chromophore</th>
                <th className="py-2.5 px-3 text-right">Min (a.u.)</th>
                <th className="py-2.5 px-3 text-right">Max (a.u.)</th>
                <th className="py-2.5 px-3 text-right">Mean</th>
                <th className="py-2.5 px-3 text-right">Std Dev (σ)</th>
                <th className="py-2.5 px-3 text-right">Est. SNR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {Object.values(CHANNEL_CONFIGS).map((ch) => {
                const s = currentDataset.statistics[ch.id];
                return (
                  <tr key={ch.id} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                      <span style={{ color: ch.color }}>{ch.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{ch.targetChromophore}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{s ? s.min.toFixed(4) : '—'}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{s ? s.max.toFixed(4) : '—'}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{s ? s.mean.toFixed(4) : '—'}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{s ? s.std.toFixed(4) : '—'}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-cyan-400 font-semibold">
                      {s ? `${s.snrEst} dB` : '—'}
                    </td>
                  </tr>
                );
              })}
              {currentDataset.hasMotionReference && currentDataset.statistics.motion_reference && (
                <tr className="hover:bg-slate-900/30 text-slate-400">
                  <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Motion Reference</span>
                  </td>
                  <td className="py-2.5 px-3">Inertial / Short-channel baseline</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {currentDataset.statistics.motion_reference.min.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {currentDataset.statistics.motion_reference.max.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {currentDataset.statistics.motion_reference.mean.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {currentDataset.statistics.motion_reference.std.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Data Table Preview */}
      <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Tabular Sample Records Preview
            </h3>
            <span className="text-xs font-mono text-slate-500">
              (Page {pageIndex + 1} of {totalPages})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              className="px-2.5 py-1 text-xs font-mono rounded border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900"
            >
              Previous
            </button>
            <button
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
              className="px-2.5 py-1 text-xs font-mono rounded border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2 px-3">Index</th>
                <th className="py-2 px-3">Timestamp (s)</th>
                <th className="py-2 px-3 text-cyan-400">ch_680 (HHb)</th>
                <th className="py-2 px-3 text-violet-400">ch_780 (Iso)</th>
                <th className="py-2 px-3 text-rose-400">ch_850 (HbO2)</th>
                <th className="py-2 px-3 text-emerald-400">ch_1064 (H2O)</th>
                <th className="py-2 px-3 text-slate-400">motion_ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {paginatedRows.map((row, idx) => {
                const globalIndex = pageIndex * rowsPerPage + idx;
                return (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-1.5 px-3 text-slate-500">{globalIndex + 1}</td>
                    <td className="py-1.5 px-3 tabular-nums font-semibold text-white">
                      {row.timestamp.toFixed(3)}
                    </td>
                    <td className="py-1.5 px-3 tabular-nums">{row.channel_680.toFixed(4)}</td>
                    <td className="py-1.5 px-3 tabular-nums">{row.channel_780.toFixed(4)}</td>
                    <td className="py-1.5 px-3 tabular-nums">{row.channel_850.toFixed(4)}</td>
                    <td className="py-1.5 px-3 tabular-nums">{row.channel_1064.toFixed(4)}</td>
                    <td className="py-1.5 px-3 tabular-nums text-slate-400">
                      {row.motion_reference !== undefined ? row.motion_reference.toFixed(4) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
