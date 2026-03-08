/**
 * Base types for carrier tracking adapters.
 */

export interface TrackingResult {
  shipmentStatus: 'in_transit' | 'arrived' | 'delivered' | 'unknown';
  eta: Date | null;
  lastUpdate: Date | null;
  rawResponse: object;
}

export interface CarrierAdapter {
  carrierKey: string;
  track(mbl: string): Promise<TrackingResult>;
}
