/**
 * Carrier name normalization utility.
 * Maps various carrier name variations to internal canonical keys.
 */

const CARRIER_LOOKUP: Record<string, string> = {
  // MSC
  'msc': 'MSC',
  'mediterranean shipping': 'MSC',
  'mediterranean shipping company': 'MSC',
  'med shipping': 'MSC',

  // Maersk
  'maersk': 'MAERSK',
  'maersk line': 'MAERSK',
  'maersk sealand': 'MAERSK',
  'sealand': 'MAERSK',
  'sealand maersk': 'MAERSK',

  // CMA CGM
  'cma cgm': 'CMA_CGM',
  'cma-cgm': 'CMA_CGM',
  'cmacgm': 'CMA_CGM',
  'cma': 'CMA_CGM',

  // Hapag-Lloyd
  'hapag': 'HAPAG_LLOYD',
  'hapag lloyd': 'HAPAG_LLOYD',
  'hapag-lloyd': 'HAPAG_LLOYD',
  'hlag': 'HAPAG_LLOYD',

  // Evergreen
  'evergreen': 'EVERGREEN',
  'evergreen marine': 'EVERGREEN',
  'evergreen line': 'EVERGREEN',

  // COSCO
  'cosco': 'COSCO',
  'cosco shipping': 'COSCO',
  'cosco shipping lines': 'COSCO',

  // ONE
  'one': 'ONE',
  'ocean network express': 'ONE',

  // Yang Ming
  'yang ming': 'YANG_MING',
  'yangming': 'YANG_MING',
  'yang ming marine': 'YANG_MING',
  'yml': 'YANG_MING',

  // HMM
  'hmm': 'HMM',
  'hyundai merchant marine': 'HMM',
  'hyundai': 'HMM',

  // ZIM
  'zim': 'ZIM',
  'zim integrated shipping': 'ZIM',
  'zim line': 'ZIM',

  // PIL
  'pil': 'PIL',
  'pacific international lines': 'PIL',

  // Wan Hai
  'wan hai': 'WAN_HAI',
  'wanhai': 'WAN_HAI',
  'wan hai lines': 'WAN_HAI',
};

/**
 * Normalize a carrier name string to an internal canonical key.
 * Returns null if the carrier cannot be identified.
 */
export function normalizeCarrier(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const cleaned = input.trim().toLowerCase().replace(/\s+/g, ' ');

  // Direct lookup
  if (CARRIER_LOOKUP[cleaned]) {
    return CARRIER_LOOKUP[cleaned];
  }

  // Partial match: check if any lookup key is contained in the input
  for (const [pattern, key] of Object.entries(CARRIER_LOOKUP)) {
    if (cleaned.includes(pattern)) {
      return key;
    }
  }

  // Check if the input (uppercased) is already a valid canonical key
  const uppercased = cleaned.toUpperCase().replace(/[\s-]+/g, '_');
  const validKeys = new Set(Object.values(CARRIER_LOOKUP));
  if (validKeys.has(uppercased)) {
    return uppercased;
  }

  return null;
}

/**
 * Get all known canonical carrier keys.
 */
export function getKnownCarriers(): string[] {
  return [...new Set(Object.values(CARRIER_LOOKUP))].sort();
}
