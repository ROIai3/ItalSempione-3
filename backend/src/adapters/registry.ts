import { CarrierAdapter } from './base';
import { MscAdapter } from './msc';
import { MaerskAdapter } from './maersk';
import logger from '../utils/logger';

/**
 * Adapter registry: maps carrier keys to adapter instances.
 * Add new adapters here as they are implemented.
 */
class AdapterRegistry {
  private adapters = new Map<string, CarrierAdapter>();

  constructor() {
    this.register(new MscAdapter());
    this.register(new MaerskAdapter());
    // TODO: Register additional carrier adapters as they are built
    // this.register(new CmaCgmAdapter());
    // this.register(new HapagLloydAdapter());
  }

  /**
   * Register a carrier adapter.
   */
  register(adapter: CarrierAdapter): void {
    this.adapters.set(adapter.carrierKey, adapter);
    logger.debug({ carrier: adapter.carrierKey }, 'Carrier adapter registered');
  }

  /**
   * Get an adapter by carrier key.
   * Returns undefined if no adapter is registered for the key.
   */
  get(carrierKey: string): CarrierAdapter | undefined {
    return this.adapters.get(carrierKey);
  }

  /**
   * Check if an adapter exists for the given carrier key.
   */
  has(carrierKey: string): boolean {
    return this.adapters.has(carrierKey);
  }

  /**
   * Get all registered carrier keys.
   */
  getRegisteredCarriers(): string[] {
    return Array.from(this.adapters.keys());
  }
}

export const adapterRegistry = new AdapterRegistry();
