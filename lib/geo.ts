// lib/geo.ts
/**
 * Detect user's country from IP address using IP range heuristics
 */
export async function detectCountry(ip: string): Promise<'IN' | 'US'> {
  try {
    if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::')) {
      return 'US';
    }

    const ipParts = ip.split('.');
    if (ipParts.length === 4) {
      const firstOctet = parseInt(ipParts[0]);

      // Common Indian ISP IP ranges: BSNL, Airtel, Jio, Vodafone, MTNL etc.
      const indianRanges = [
        14, 27, 49, 59, 103, 106, 110, 112, 115, 117,
        121, 122, 125, 150, 157, 163, 171, 175, 180,
        182, 183, 202, 203, 210, 220,
      ];

      if (indianRanges.includes(firstOctet)) {
        return 'IN';
      }
    }

    return 'US';
  } catch {
    return 'US';
  }
}