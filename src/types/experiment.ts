import { ChannelId, FilterParams } from './signal';

export interface Experiment {
  id: string; // e.g. EXP-2026-001
  name: string;
  description: string;
  date: string;
  investigator: string;
  datasetId: string;
  datasetName: string;
  datasetSource: 'synthetic' | 'uploaded';
  targetChannel: ChannelId;
  filterParams?: FilterParams;
  snrImprovementDb?: number;
  anomaliesDetected?: number;
  anomalyMethod?: string;
  notes?: string;
  status: 'completed' | 'draft' | 'archived';
  keyFindings: string[];
}
