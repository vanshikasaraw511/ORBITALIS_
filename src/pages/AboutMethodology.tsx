import React from 'react';
import {
  BookOpen,
  Waves,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Layers,
  Terminal,
  Code2,
  ExternalLink,
} from 'lucide-react';
import { CHANNEL_CONFIGS } from '../types/signal';

export const AboutMethodology: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-6">
        <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
          Theoretical Foundation & Scientific Context
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
          About ORBITALIS & Scientific Methodology
        </h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Inspired by SpaceLith’s Project CEREBRO-ORBIT technical whitepaper, ORBITALIS explores the software data pipeline required for non-invasive, multi-spectral optical neuro-hemodynamic monitoring in microgravity environments.
        </p>
      </div>

      {/* Scope and Boundary Banner */}
      <div className="p-5 bg-slate-900/90 border border-cyan-800/40 rounded-lg text-xs space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold font-mono text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Research Prototype Boundary Statement</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-xs">
          ORBITALIS is an engineering prototype designed for computational exploration using synthetic telemetry and research datasets. It is <strong>NOT</strong> a certified medical device, clinical diagnostic tool, validated intracranial measurement system, or flight-qualified aerospace hardware. All numerical values represent simulation units.
        </p>
      </div>

      {/* 01. Research Context: Spaceflight Physiology */}
      <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">
            01. Spaceflight Physiological Context
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm">
              Spaceflight-Associated Neuro-Ocular Syndrome (SANS)
            </h3>
            <p className="text-slate-400 leading-relaxed">
              In microgravity, the absence of hydrostatic gravitational gradients causes approximately 1.5 to 2 liters of fluid to redistribute from the lower limbs toward the head (cephalad fluid shift). This chronic elevation in venous pressure can induce optic disc edema, globe flattening, choroidal folds, and hyperopic shifts in long-duration astronaut crews.
            </p>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm">
              Internal Jugular Vein (IJV) Stasis
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Long-duration spaceflight studies (such as Marshall-Goebel et al., 2019) documented stagnant or retrograde blood flow in the internal jugular veins of crewmembers, highlighting potential thrombosis risks. Multi-spectral optical sensing aims to detect non-invasive signatures of venous congestion.
            </p>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm">
              Cerebral Autoregulation
            </h3>
            <p className="text-slate-400 leading-relaxed">
              The brain’s intrinsic mechanism to maintain constant cerebral perfusion pressure despite fluctuating systemic arterial pressure. In microgravity, altered baroreflex sensitivity and cardiac remodeling challenge normal autoregulation dynamics.
            </p>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm">
              Hypercapnia & Habitats
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Enclosed spacecraft environments frequently experience localized elevations in carbon dioxide (PCO2). Elevated ambient CO2 is a potent cerebral vasodilator, increasing intracranial blood volume and complicating SANS risk factors.
            </p>
          </div>
        </div>
      </div>

      {/* 02. Optical Sensing: The Four Wavelengths */}
      <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Waves className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">
            02. Optical Sensing: The Four Wavelengths
          </h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Standard functional near-infrared spectroscopy (fNIRS) traditionally utilizes only two wavelengths (~760nm and ~850nm) to calculate oxyhemoglobin and deoxyhemoglobin via the Modified Beer-Lambert Law. Project CEREBRO-ORBIT proposes four wavelengths for comprehensive neuro-vascular monitoring:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(CHANNEL_CONFIGS).map((ch) => (
            <div
              key={ch.id}
              className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold" style={{ color: ch.color }}>
                  {ch.wavelength} nm
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-500">
                  Channel
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200">
                {ch.targetChromophore}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {ch.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 03. Signal Processing & Motion Decoupling */}
      <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">
            03. Digital Signal Processing & Motion Decoupling
          </h2>
        </div>

        <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
          <p>
            Raw optical signals in microgravity are contaminated by three distinct noise sources:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300 font-mono text-[11px]">
            <li>High-frequency shot noise and silicon detector thermal fluctuations.</li>
            <li>Low-frequency baseline drifts from astronaut postural repositioning and sensor heating.</li>
            <li>High-amplitude motion transients from head movements, exercise on ergometers, and optical probe slippage.</li>
          </ul>
          <p>
            ORBITALIS implements zero-phase forward-backward Butterworth IIR filtering (<code className="text-cyan-400 font-mono">filtfilt</code>) to completely eliminate phase distortion, ensuring that systolic pulse peaks and respiratory envelopes align exactly in time with original physiological triggers.
          </p>
          <p>
            For motion decoupling, an adaptive reference subtraction technique models the disturbance component from a synchronized motion reference sensor (such as a 3-axis accelerometer norm or short-distance optode) and projects it out via least-squares estimation:
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono text-center text-xs">
            s_corrected(t) = s_observed(t) - [ ⟨s, m⟩ / ⟨m, m⟩ ] · m_reference(t)
          </div>
        </div>
      </div>

      {/* 04. Anomaly Detection Methodology */}
      <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <AlertTriangle className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">
            04. Unsupervised Anomaly Detection Methodology
          </h2>
        </div>

        <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
          <p>
            Because medical anomalies in microgravity are rare and ill-defined, supervised training with labeled diagnostic classes is impractical. ORBITALIS utilizes unsupervised methods:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
              <h4 className="text-slate-200 font-semibold font-mono text-xs">
                Isolation Forest (Multi-Feature)
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Isolates unusual signal points by building an ensemble of random decision trees over feature vectors (amplitude, 1st derivative, rolling variance, local deviation). Outliers require fewer splits to isolate, resulting in high anomaly scores without parametric assumptions.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
              <h4 className="text-slate-200 font-semibold font-mono text-xs">
                Robust MAD Z-Score
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Uses the Median and Median Absolute Deviation (MAD), which are impervious to extreme spikes that would otherwise distort the sample mean and variance. Flags deviations exceeding configurable threshold σ (default 3.0σ).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 05. Python Backend Architecture & Local Setup Guide */}
      <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">
            05. Complete Python Backend Architecture & Setup Guide
          </h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          For your computer science course submission and local demonstration, ORBITALIS includes complete Python source code in the <code className="text-cyan-400 font-mono">/backend</code> folder using FastAPI, NumPy, SciPy, and Scikit-learn.
        </p>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
          <div className="text-xs font-mono font-semibold text-slate-300">
            Quick 3-Step Local Execution Instructions:
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-400">
            <div>
              <span className="text-cyan-400 font-bold">1. Navigate to backend directory & install dependencies:</span>
              <pre className="bg-slate-900 p-2.5 rounded mt-1 text-slate-200 text-[11px] overflow-x-auto">
                cd backend{'\n'}pip install -r requirements.txt
              </pre>
            </div>

            <div>
              <span className="text-cyan-400 font-bold">2. Launch FastAPI REST API server:</span>
              <pre className="bg-slate-900 p-2.5 rounded mt-1 text-slate-200 text-[11px] overflow-x-auto">
                uvicorn app.main:app --reload --port 8000
              </pre>
            </div>

            <div>
              <span className="text-cyan-400 font-bold">3. Access interactive Swagger API documentation:</span>
              <pre className="bg-slate-900 p-2.5 rounded mt-1 text-slate-200 text-[11px] overflow-x-auto">
                http://localhost:8000/docs
              </pre>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-mono text-slate-300 font-semibold mb-2">
            Implemented Backend Endpoints:
          </h4>
          <ul className="text-xs font-mono text-slate-400 space-y-1.5">
            <li><span className="text-emerald-400">GET</span> /health — Health check and service metadata</li>
            <li><span className="text-cyan-400">GET</span> /sample-data — Synthetic 4-channel dataset generator with Mulberry32 RNG</li>
            <li><span className="text-violet-400">POST</span> /validate-data — Column schema and statistical integrity validation</li>
            <li><span className="text-violet-400">POST</span> /process-signal — SciPy Butterworth filtering and SNR calculation</li>
            <li><span className="text-violet-400">POST</span> /simulate-motion — Motion disturbance injection & reference subtraction</li>
            <li><span className="text-violet-400">POST</span> /detect-anomalies — Scikit-learn IsolationForest & MAD outlier isolation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
