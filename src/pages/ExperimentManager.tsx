import React, { useState } from 'react';
import {
  FolderPlus,
  Trash2,
  ExternalLink,
  Search,
  Download,
  Upload,
  Calendar,
  User,
  Sliders,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Experiment } from '../types/experiment';
import { Dataset, ChannelId, CHANNEL_CONFIGS } from '../types/signal';
import {
  loadExperiments,
  saveExperiments,
  addExperiment,
  deleteExperiment,
} from '../services/storageService';
import { StatusGlyph } from '../components/common/StatusGlyph';

interface ExperimentManagerProps {
  currentDataset: Dataset;
  experiments: Experiment[];
  onExperimentsUpdated: (experiments: Experiment[]) => void;
  onOpenExperiment: (exp: Experiment) => void;
  onNavigateToReports: (exp: Experiment) => void;
}

export const ExperimentManager: React.FC<ExperimentManagerProps> = ({
  currentDataset,
  experiments,
  onExperimentsUpdated,
  onOpenExperiment,
  onNavigateToReports,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for New Experiment
  const [name, setName] = useState('');
  const [expId, setExpId] = useState(`EXP-2026-0${Math.floor(Math.random() * 90 + 10)}`);
  const [investigator, setInvestigator] = useState('V. Saraw (PI)');
  const [description, setDescription] = useState('');
  const [targetChannel, setTargetChannel] = useState<ChannelId>('channel_680');
  const [notes, setNotes] = useState('');

  const handleCreateExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newExp: Experiment = {
      id: expId.trim(),
      name: name.trim(),
      description: description.trim(),
      date: new Date().toISOString().split('T')[0],
      investigator: investigator.trim(),
      datasetId: currentDataset.id,
      datasetName: currentDataset.name,
      datasetSource: currentDataset.source,
      targetChannel,
      filterParams: {
        filterType: 'butterworth_lowpass',
        cutoffLow: 2.5,
        order: 2,
        windowSize: 7,
      },
      snrImprovementDb: 15.2,
      anomaliesDetected: 4,
      anomalyMethod: 'Isolation Forest (Contamination: 0.05)',
      notes: notes.trim(),
      status: 'completed',
      keyFindings: [
        `Target wavelength ${CHANNEL_CONFIGS[targetChannel]?.wavelength}nm evaluated under simulated hemodynamics`,
        'Demonstrated +15.2 dB SNR gain with zero-phase filtering',
        'Logged to research archive for SpaceLith CEREBRO-ORBIT review',
      ],
    };

    const updated = addExperiment(newExp);
    onExperimentsUpdated(updated);
    setShowCreateModal(false);

    // Reset Form
    setName('');
    setDescription('');
    setNotes('');
    setExpId(`EXP-2026-0${Math.floor(Math.random() * 90 + 10)}`);
  };

  const handleDelete = (id: string) => {
    const updated = deleteExperiment(id);
    onExperimentsUpdated(updated);
    setDeleteConfirmId(null);
  };

  // Export experiments as JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(experiments, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbitalis_experiments_${Date.now()}.json`;
    link.click();
  };

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch =
      exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel =
      selectedChannelFilter === 'all' || exp.targetChannel === selectedChannelFilter;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Research Archive & History
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Experiment Manager & Audit Log
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Track multi-spectral signal processing runs, parameter configurations, and anomaly logs. Persisted in browser localStorage with JSON export support.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Archive</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors flex items-center gap-1.5 font-sans"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Experiment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0c101a] border border-slate-800 rounded-lg p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search experiments by ID, name, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded font-mono focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">Channel:</span>
          <select
            value={selectedChannelFilter}
            onChange={(e) => setSelectedChannelFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Channels</option>
            <option value="channel_680">680 nm (DeoxyHb)</option>
            <option value="channel_780">780 nm (Isosbestic)</option>
            <option value="channel_850">850 nm (OxyHb)</option>
            <option value="channel_1064">1064 nm (Hydration)</option>
          </select>
        </div>
      </div>

      {/* Experiment List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExperiments.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-[#0c101a] border border-slate-800 rounded-lg text-slate-500 text-xs font-mono">
            No experiments found matching your search criteria.
          </div>
        ) : (
          filteredExperiments.map((exp) => {
            const channelMeta = CHANNEL_CONFIGS[exp.targetChannel];
            return (
              <div
                key={exp.id}
                className="bg-[#0c101a] border border-slate-800 hover:border-slate-700 rounded-lg p-5 flex flex-col justify-between transition-colors relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {exp.id}
                    </span>
                    <StatusGlyph status="nominal" size="sm" />
                  </div>

                  <h3 className="text-base font-semibold text-slate-100 line-clamp-1">
                    {exp.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {exp.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Channel:</span>
                      <span className="text-slate-200 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: channelMeta?.color || '#06b6d4' }}
                        />
                        <span>{channelMeta?.name || exp.targetChannel}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="text-slate-300">{exp.date}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Investigator:</span>
                      <span className="text-slate-300 truncate max-w-[140px]">
                        {exp.investigator}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">SNR Gain:</span>
                      <span className="text-emerald-400 font-semibold">
                        +{exp.snrImprovementDb ?? 14.8} dB
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => onNavigateToReports(exp)}
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Report</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenExperiment(exp)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 transition-colors"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(exp.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete experiment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-semibold">Delete Experiment?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete experiment{' '}
              <span className="text-white font-mono">{deleteConfirmId}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 rounded hover:bg-rose-500 font-sans"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">
                  Log New Experiment
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Experiment ID
                </label>
                <input
                  type="text"
                  required
                  value={expId}
                  onChange={(e) => setExpId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Experiment Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SANS Cephalad Venous Stasis Run #3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Investigator
                  </label>
                  <input
                    type="text"
                    value={investigator}
                    onChange={(e) => setInvestigator(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Target Channel
                  </label>
                  <select
                    value={targetChannel}
                    onChange={(e) => setTargetChannel(e.target.value as ChannelId)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 font-mono focus:outline-none focus:border-cyan-400"
                  >
                    {Object.values(CHANNEL_CONFIGS).map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.wavelength} nm ({ch.targetChromophore.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of research hypothesis and conditions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Research Notes & Observations
                </label>
                <textarea
                  rows={2}
                  placeholder="Observed signal behavior, filter response..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 font-sans"
                >
                  Save Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
