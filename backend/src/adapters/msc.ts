import { CarrierAdapter, TrackingResult } from './base';
import logger from '../utils/logger';

/**
 * MSC carrier tracking adapter.
 * TODO: Integrate with real MSC tracking API.
 * Currently returns mock data for development and testing.
 */
export class MscAdapter implements CarrierAdapter {
  public readonly carrierKey = 'MSC';

  async track(mbl: string): Promise<TrackingResult> {
    logger.info({ carrier: this.carrierKey, mbl }, 'Tracking shipment (mock)');

    // TODO: Replace with real MSC API integration
    // MSC API documentation: https://www.msc.com/track-a-shipment
    // Potential approaches:
    // 1. MSC official API (if available with API key)
    // 2. Web scraping as fallback
    // 3. Third-party aggregator API (e.g., MarineTraffic, Portcast)

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
        carrier: 'MSC',
        mbl,
        message: 'Mock response - replace with real API integration',
      },
    };
  }
}
