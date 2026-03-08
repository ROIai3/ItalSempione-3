import { CarrierAdapter, TrackingResult } from './base';
import logger from '../utils/logger';

/**
 * Maersk carrier tracking adapter.
 * TODO: Integrate with real Maersk tracking API.
 * Currently returns mock data for development and testing.
 */
export class MaerskAdapter implements CarrierAdapter {
  public readonly carrierKey = 'MAERSK';

  async track(mbl: string): Promise<TrackingResult> {
    logger.info({ carrier: this.carrierKey, mbl }, 'Tracking shipment (mock)');

    // TODO: Replace with real Maersk API integration
    // Maersk API: https://developer.maersk.com/
    // - Tracking API v2 endpoint
    // - Requires API key registration
    // - Supports tracking by Bill of Lading number

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const mockEta = new Date();
    mockEta.setDate(mockEta.getDate() + Math.floor(Math.random() * 14) + 3);

    return {
      shipmentStatus: 'in_transit',
      eta: mockEta,
      lastUpdate: new Date(),
      rawResponse: {
        mock: true,
        carrier: 'MAERSK',
        mbl,
        message: 'Mock response - replace with real API integration',
      },
    };
  }
}
