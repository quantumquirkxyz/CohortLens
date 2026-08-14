import type { LensResult } from '@cohortlens/shared';

/** Keeps the latest execution result per Lens id (prototype, in-memory). */
export class ExecutionStore {
  private readonly results = new Map<string, LensResult>();

  save(result: LensResult): void {
    this.results.set(result.lensId, result);
  }

  latest(id: string): LensResult | undefined {
    return this.results.get(id);
  }
}
