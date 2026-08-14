import type { LensDefinition } from '@cohortlens/shared';

/**
 * In-memory registry of Lenses (prototype: no persistence across restarts).
 * Built-in Lenses are registered at startup; API-registered Lenses live here
 * for the lifetime of the process.
 */
export class LensRegistry {
  private readonly lenses = new Map<string, LensDefinition>();

  register(lens: LensDefinition): void {
    if (this.lenses.has(lens.id)) {
      throw new Error(`lens already registered: ${lens.id}`);
    }
    this.lenses.set(lens.id, lens);
  }

  get(id: string): LensDefinition | undefined {
    return this.lenses.get(id);
  }

  list(): LensDefinition[] {
    return [...this.lenses.values()];
  }

  setActive(id: string, active: boolean): LensDefinition | undefined {
    const lens = this.lenses.get(id);
    if (!lens) return undefined;
    this.lenses.set(id, { ...lens, active });
    return this.lenses.get(id);
  }
}
