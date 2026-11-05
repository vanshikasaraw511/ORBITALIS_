# ORBITALIS — Space Biomedical Intelligence & Signal Analysis Platform

> **Research Software Prototype**  
> *Signal Intelligence for the Next Frontier*  
> Inspired by SpaceLith’s **Project CEREBRO-ORBIT** technical whitepaper.

---

## 1. Project Background & Context

ORBITALIS is a space biomedical research software prototype developed to demonstrate the computational signal-processing and anomaly-detection pipeline required for multi-spectral, non-invasive neuro-hemodynamic monitoring during long-duration spaceflight.

### Physiological Focus Areas:
- **Spaceflight-Associated Neuro-Ocular Syndrome (SANS)**: Cephalad fluid shift leading to optic disc edema and globe flattening.
- **Internal Jugular Vein (IJV) Stasis**: Venous flow stagnation and thrombosis risk under microgravity.
- **Cerebral Autoregulation**: Maintenance of constant cerebral perfusion despite microgravity blood volume shifts.
- **Hypercapnia**: Cerebral vasodilation caused by localized elevated CO2 in closed spacecraft cabins.

### Four-Wavelength Optical Sensing Architecture:
1. **680 nm**: Deoxyhemoglobin (HHb) sensitivity — venous blood pooling and IJV stasis monitoring.
2. **780 nm**: Near-isosbestic reference point — total blood volume baseline and spatial normalization.
3. **850 nm**: Oxyhemoglobin (HbO2) sensitivity — pulsatile arterial waveforms and oxygenation kinetics.
4. **1064 nm**: Tissue hydration (H2O) — interstitial brain water shifts and intracranial fluid index.

> **Demonstration Environment Disclaimer**:  
> ORBITALIS is a software research prototype. It operates on synthetic telemetry and uploaded CSV datasets. It is **NOT** a certified medical device, clinical diagnostic instrument, or flight-qualified life support system.

---

## 2. Architecture & Pipeline

```
+---------------------------------------------------------------------------------+
|                                 ORBITALIS CORE                                  |
+---------------------------------------------------------------------------------+
                                      |
         +----------------------------+---------------------------+
         |                                                        |
         v                                                        v
+-----------------------------+                           +-----------------------+
|  React 19 + TypeScript SPA  |                           | Python FastAPI Server |
|  - Zero-Phase Butterworth   | <--- REST API / Health -- | (scipy, sklearn,      |
|  - Moving Average / Median  |                           |  numpy, pandas)       |
|  - Adaptive Motion Decouple |                           |                       |
|  - Isolation Forest & MAD   |                           |                       |
|  - Recharts & jsPDF Reports |                           |                       |
+-----------------------------+                           +-----------------------+
```

### Signal Processing Pipeline:
1. **Baseline Ingestion**: 4 optical wavelengths (680, 780, 850, 1064 nm) + optional motion reference.
2. **Filtering**: Zero-phase Butterworth IIR (forward-backward `filtfilt`), eliminating group delay to preserve systolic timing.
3. **Motion Decoupling**: Adaptive least-squares reference subtraction projecting out correlated inertial motion components:
   $$\mathbf{s}_{\text{clean}}(t) = \mathbf{s}_{\text{observed}}(t) - \frac{\langle\mathbf{s}, \mathbf{m}\rangle}{\langle\mathbf{m}, \mathbf{m}\rangle} \mathbf{m}_{\text{reference}}(t)$$
4. **Unsupervised Anomaly Detection**:
   - **Isolation Forest**: Multi-feature tree isolation (amplitude, first derivative, local variance).
   - **Robust MAD Z-Score**: Outlier flagging using Median Absolute Deviation ($1.4826 \times \text{MAD}$).
5. **Audit Logging & Export**: LocalStorage persistence, JSON export, and vector PDF reports via jsPDF.

---

## 3. Quickstart & Local Setup

### Frontend (React + Vite)
```bash
# 1. Install frontend dependencies
npm install

# 2. Start Vite development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend (Python FastAPI)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
API Documentation (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 4. Completed Features
- [x] **Overview Dashboard**: Multi-channel chart, KPIs, recent runs, persistent demonstration notice.
- [x] **Data Explorer**: Mulberry32 synthetic generator, PapaParse CSV upload, validation checklist, paginated tabular preview, CSV export.
- [x] **DSP Laboratory**: Zero-phase Butterworth lowpass/bandpass/highpass, moving average, median filter, SNR gain metrics, FFT power spectral density.
- [x] **Motion Artifact Decoupling**: Simulated crew movement spikes, synchronized reference channel, adaptive least-squares artifact reduction.
- [x] **Anomaly Detection**: Isolation Forest & Robust MAD Z-Score, sensitivity tuning, highlighted interval charts, explanatory diagnostic table.
- [x] **Experiment Manager**: Save/inspect/delete experiments, localStorage persistence, JSON archive export.
- [x] **Research Reports**: Formal aerospace biomedical report view, jsPDF vector download, and print support.
- [x] **About & Methodology**: Full physiological and optical sensing documentation.
- [x] **Python Backend**: Complete FastAPI routes, SciPy filters, and Scikit-learn IsolationForest services.

---

## 5. Scope & Limitations
- All telemetry is synthetic or user-uploaded.
- Does not claim to execute real-time Monte Carlo photon migration or validated intracranial pressure reconstructions.
- Intended for educational and software prototype demonstration.
