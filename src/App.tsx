/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, PageId } from './components/layout/Navbar';
import { SyntheticNotice } from './components/layout/SyntheticNotice';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { DataExplorer } from './pages/DataExplorer';
import { SignalProcessingLab } from './pages/SignalProcessingLab';
import { AnomalyDetectionPage } from './pages/AnomalyDetectionPage';
import { ExperimentManager } from './pages/ExperimentManager';
import { ResearchReports } from './pages/ResearchReports';
import { AboutMethodology } from './pages/AboutMethodology';

import { Dataset } from './types/signal';
import { Experiment } from './types/experiment';
import { generateSyntheticDataset } from './services/syntheticGenerator';
import {
  loadExperiments,
  saveActiveDataset,
  loadActiveDataset,
} from './services/storageService';
import { checkBackendHealth } from './services/apiService';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('overview');

  // Initialize dataset: try loading cached, otherwise generate synthetic baseline
  const [dataset, setDataset] = useState<Dataset>(() => {
    const cached = loadActiveDataset();
    if (cached && cached.data && cached.data.length > 0) return cached;
    const initial = generateSyntheticDataset('SANS Simulation Baseline Dataset', {
      durationSeconds: 30,
      samplingRate: 25,
      heartRateBpm: 72,
      motionIntensity: 0.4,
      includeAnomalies: true,
      seed: 42,
    });
    saveActiveDataset(initial);
    return initial;
  });

  // Initialize experiments from storage
  const [experiments, setExperiments] = useState<Experiment[]>(() => {
    return loadExperiments();
  });

  // Selected experiment for detail views / reports
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(() => {
    const exps = loadExperiments();
    return exps.length > 0 ? exps[0] : null;
  });

  // Backend status check
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    checkBackendHealth().then((status) => {
      setBackendOnline(status.isAvailable);
    });
  }, []);

  const handleDatasetLoaded = (newDataset: Dataset) => {
    setDataset(newDataset);
    saveActiveDataset(newDataset);
  };

  const handleSelectExperiment = (exp: Experiment) => {
    setSelectedExperiment(exp);
    setActivePage('reports');
  };

  const handleOpenExperimentInLab = (exp: Experiment) => {
    setSelectedExperiment(exp);
    setActivePage('dsp_lab');
  };

  const handleNewAnalysis = () => {
    setActivePage('explorer');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Persistent Demonstration Banner */}
      <SyntheticNotice />

      {/* Strict 3-Zone Top Bar Navbar */}
      <Navbar
        activePage={activePage}
        onNavigate={(p) => setActivePage(p)}
        onNewAnalysis={handleNewAnalysis}
        backendOnline={backendOnline}
      />

      {/* Mobile Navigation Strip (Visible on tablets and mobile) */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-2 overflow-x-auto flex items-center gap-2 text-xs">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'explorer', label: 'Explorer' },
          { id: 'dsp_lab', label: 'DSP Lab' },
          { id: 'anomalies', label: 'Anomalies' },
          { id: 'experiments', label: 'Experiments' },
          { id: 'reports', label: 'Reports' },
          { id: 'methodology', label: 'Methodology' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id as PageId)}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-mono text-[11px] ${
              activePage === item.id
                ? 'bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activePage === 'overview' && (
          <OverviewDashboard
            dataset={dataset}
            experiments={experiments}
            onNavigate={(p) => setActivePage(p)}
            onSelectExperiment={handleSelectExperiment}
            onGenerateNew={handleNewAnalysis}
          />
        )}

        {activePage === 'explorer' && (
          <DataExplorer
            currentDataset={dataset}
            onDatasetLoaded={handleDatasetLoaded}
          />
        )}

        {activePage === 'dsp_lab' && (
          <SignalProcessingLab
            dataset={dataset}
            onSaveToExperiment={() => setActivePage('experiments')}
          />
        )}

        {activePage === 'anomalies' && (
          <AnomalyDetectionPage
            dataset={dataset}
            onSaveResult={() => setActivePage('experiments')}
          />
        )}

        {activePage === 'experiments' && (
          <ExperimentManager
            currentDataset={dataset}
            experiments={experiments}
            onExperimentsUpdated={(updated) => setExperiments(updated)}
            onOpenExperiment={handleOpenExperimentInLab}
            onNavigateToReports={handleSelectExperiment}
          />
        )}

        {activePage === 'reports' && (
          <ResearchReports
            currentDataset={dataset}
            experiments={experiments}
            selectedExperiment={selectedExperiment}
          />
        )}

        {activePage === 'methodology' && <AboutMethodology />}
      </main>

      {/* Clean Scientific Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07090e] py-4 px-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">ORBITALIS</span>
            <span>·</span>
            <span>Space Biomedical Intelligence Platform</span>
            <span>·</span>
            <span className="text-cyan-400/80">Project CEREBRO-ORBIT Concept</span>
          </div>
          <div>
            <span>RESEARCH PROTOTYPE // SYNTHETIC DATA ENVIRONMENT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
