export interface SyncStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  progress: number;
  message?: string;
  errors?: string[];
}

export interface IdleSyncStatus {
  status: 'idle';
  message: string;
}
