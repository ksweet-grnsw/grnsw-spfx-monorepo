/**
 * Convert wind direction in degrees to cardinal direction
 * Based on API developer specification:
 * N (0, 11.25] and (348.75, 360]
 * NNE (11.25, 33.75]
 * NE (33.75, 56.25]
 * ENE (56.25, 78.75]
 * E (78.75, 101.25]
 * ESE (101.25, 123.75]
 * SE (123.75, 146.25]
 * SSE (146.25, 168.75]
 * S (168.75, 191.25]
 * SSW (191.25, 213.75]
 * SW (213.75, 236.25]
 * WSW (236.25, 258.75]
 * W (258.75, 281.25]
 * WNW (281.25, 303.75]
 * NW (303.75, 326.25]
 * NNW (326.25, 348.75]
 */
export function degreesToCardinal(degrees: number): string {
  // Normalize degrees to 0-360 range
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  
  if (normalizedDegrees <= 11.25 || normalizedDegrees > 348.75) {
    return 'N';
  } else if (normalizedDegrees <= 33.75) {
    return 'NNE';
  } else if (normalizedDegrees <= 56.25) {
    return 'NE';
  } else if (normalizedDegrees <= 78.75) {
    return 'ENE';
  } else if (normalizedDegrees <= 101.25) {
    return 'E';
  } else if (normalizedDegrees <= 123.75) {
    return 'ESE';
  } else if (normalizedDegrees <= 146.25) {
    return 'SE';
  } else if (normalizedDegrees <= 168.75) {
    return 'SSE';
  } else if (normalizedDegrees <= 191.25) {
    return 'S';
  } else if (normalizedDegrees <= 213.75) {
    return 'SSW';
  } else if (normalizedDegrees <= 236.25) {
    return 'SW';
  } else if (normalizedDegrees <= 258.75) {
    return 'WSW';
  } else if (normalizedDegrees <= 281.25) {
    return 'W';
  } else if (normalizedDegrees <= 303.75) {
    return 'WNW';
  } else if (normalizedDegrees <= 326.25) {
    return 'NW';
  } else if (normalizedDegrees <= 348.75) {
    return 'NNW';
  }
  
  // Fallback (should not reach here)
  return 'N';
}

/**
 * Get a descriptive wind direction with both cardinal and degrees
 * @param degrees Wind direction in degrees
 * @returns Formatted string like "NE (45°)"
 */
export function formatWindDirection(degrees: number): string {
  const cardinal = degreesToCardinal(degrees);
  return `${cardinal} (${Math.round(degrees)}°)`;
}