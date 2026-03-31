/**
 * Cornhole scoring utilities.
 *
 * Cancellation scoring: each frame the lower score is subtracted from the
 * higher, so only one team accumulates points per frame.  A completed game
 * therefore has exactly one team at or above `pointsToWin` while the other
 * is strictly below it.
 */

/**
 * Validate a final game score pair.
 *
 * @param {number} score1
 * @param {number} score2
 * @param {object} [settings]
 * @param {number} [settings.pointsToWin=21]
 * @param {boolean} [settings.skunkRule=false]
 * @param {number} [settings.skunkDiff=13]
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateScore(score1, score2, settings = {}) {
  const {
    pointsToWin = 21,
    skunkRule = false,
    skunkDiff = 13,
  } = settings;

  const errors = [];

  if (!Number.isInteger(score1) || score1 < 0) {
    errors.push('score1 must be a non-negative integer');
  }
  if (!Number.isInteger(score2) || score2 < 0) {
    errors.push('score2 must be a non-negative integer');
  }

  // If basic type checks failed, return early.
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const bothAtOrAbove = score1 >= pointsToWin && score2 >= pointsToWin;
  if (bothAtOrAbove) {
    errors.push(
      `Both scores cannot be >= ${pointsToWin} (cancellation scoring)`
    );
  }

  const oneReached = score1 >= pointsToWin || score2 >= pointsToWin;
  const diff = Math.abs(score1 - score2);
  const skunkApplies = skunkRule && diff >= skunkDiff;

  if (!oneReached && !skunkApplies) {
    errors.push(
      `At least one score must reach ${pointsToWin}` +
        (skunkRule
          ? ` or the differential must be >= ${skunkDiff} (skunk rule)`
          : '')
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Derive the result of a completed match.
 *
 * @param {{ team1Id: string, team2Id: string, score1: number, score2: number }} match
 * @returns {{ winnerId: string, loserId: string, differential: number }}
 */
export function getMatchResult(match) {
  const { team1Id, team2Id, score1, score2 } = match;
  const differential = Math.abs(score1 - score2);

  if (score1 >= score2) {
    return { winnerId: team1Id, loserId: team2Id, differential };
  }
  return { winnerId: team2Id, loserId: team1Id, differential };
}

/**
 * Check whether a score line qualifies as a skunk.
 *
 * @param {number} score1
 * @param {number} score2
 * @param {number} skunkDiff
 * @returns {boolean}
 */
export function isSkunk(score1, score2, skunkDiff) {
  return Math.abs(score1 - score2) >= skunkDiff;
}
