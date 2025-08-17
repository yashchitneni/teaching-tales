export type ProgressUpdate = {
  percent: number;
  message: string;
  step: string;
  done?: boolean;
  error?: string;
  stimulusId?: string;
};

class InMemoryProgressStore {
  private store = new Map<string, ProgressUpdate>();
  private listeners = new Map<string, Set<(u: ProgressUpdate) => void>>();

  create(jobId: string, initial?: ProgressUpdate) {
    this.store.set(jobId, initial || { percent: 0, message: 'Starting…', step: 'init' });
  }

  update(jobId: string, update: ProgressUpdate) {
    this.store.set(jobId, update);
    const set = this.listeners.get(jobId);
    if (set) for (const fn of set) fn(update);
  }

  get(jobId: string) {
    return this.store.get(jobId);
  }

  on(jobId: string, cb: (u: ProgressUpdate) => void) {
    let set = this.listeners.get(jobId);
    if (!set) {
      set = new Set();
      this.listeners.set(jobId, set);
    }
    set.add(cb);
    return () => set!.delete(cb);
  }
}

export const ProgressStore = new InMemoryProgressStore();

