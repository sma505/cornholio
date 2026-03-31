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

/**
 * Calculate the result of a single frame from bag counts.
 *
 * @param {{ team1Holes: number, team1Boards: number, team2Holes: number, team2Boards: number }} frame
 * @returns {{ team1Raw: number, team2Raw: number, net: number, scoringTeam: 1|2|0 }}
 */
export function calculateFrameResult(frame) {
  const team1Raw = frame.team1Holes * 3 + frame.team1Boards;
  const team2Raw = frame.team2Holes * 3 + frame.team2Boards;
  const net = Math.abs(team1Raw - team2Raw);
  const scoringTeam = team1Raw > team2Raw ? 1 : team2Raw > team1Raw ? 2 : 0;
  return { team1Raw, team2Raw, net, scoringTeam };
}

/**
 * Calculate running totals from an array of frames using cancellation scoring.
 *
 * @param {{ team1Holes: number, team1Boards: number, team2Holes: number, team2Boards: number }[]} frames
 * @returns {{ score1: number, score2: number }}
 */
export function calculateRunningTotal(frames) {
  let score1 = 0;
  let score2 = 0;
  for (const frame of frames) {
    const { net, scoringTeam } = calculateFrameResult(frame);
    if (scoringTeam === 1) score1 += net;
    else if (scoringTeam === 2) score2 += net;
  }
  return { score1, score2 };
}

/**
 * Check if a game is complete based on its frames.
 *
 * @param {{ team1Holes: number, team1Boards: number, team2Holes: number, team2Boards: number }[]} frames
 * @param {object} settings
 * @returns {boolean}
 */
export function isGameComplete(frames, settings = {}) {
  const { pointsToWin = 21, skunkRule = false, skunkDiff = 13 } = settings;
  const { score1, score2 } = calculateRunningTotal(frames);
  if (score1 >= pointsToWin || score2 >= pointsToWin) return true;
  if (skunkRule && Math.abs(score1 - score2) >= skunkDiff) return true;
  return false;
}

/**
 * Validate a frame's bag counts.
 *
 * @param {{ team1Holes: number, team1Boards: number, team2Holes: number, team2Boards: number }} frame
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFrame(frame) {
  const errors = [];
  for (const [label, h, b] of [
    ['Team 1', frame.team1Holes, frame.team1Boards],
    ['Team 2', frame.team2Holes, frame.team2Boards],
  ]) {
    if (!Number.isInteger(h) || h < 0 || h > 4) errors.push(`${label} holes must be 0-4`);
    if (!Number.isInteger(b) || b < 0 || b > 4) errors.push(`${label} boards must be 0-4`);
    if (Number.isInteger(h) && Number.isInteger(b) && h + b > 4) {
      errors.push(`${label} can throw at most 4 bags (${h} holes + ${b} boards = ${h + b})`);
    }
  }
  return { valid: errors.length === 0, errors };
}
