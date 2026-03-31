/**
 * Cornhole scoring utilities.
 *
 * Supports two game modes:
 * - "standard": play until one team reaches pointsToWin (default 21)
 * - "quick": fixed number of frames, highest cancellation total wins (draws possible)
 */

/**
 * Validate a final game score pair.
 */
export function validateScore(score1, score2, settings = {}) {
  const {
    gameMode = 'standard',
    pointsToWin = 21,
    skunkRule = false,
    skunkDiff = 13,
    isBracket = false,
  } = settings;

  const errors = [];

  if (!Number.isInteger(score1) || score1 < 0) {
    errors.push('Score must be a non-negative number');
  }
  if (!Number.isInteger(score2) || score2 < 0) {
    errors.push('Score must be a non-negative number');
  }
  if (errors.length > 0) return { valid: false, errors };

  if (gameMode === 'quick') {
    // Quick mode: any scores are valid, but draws not allowed in brackets
    if (isBracket && score1 === score2) {
      errors.push('Draws are not allowed in elimination rounds');
    }
  } else {
    // Standard mode: one team must reach target
    if (score1 >= pointsToWin && score2 >= pointsToWin) {
      errors.push(`Both scores cannot be >= ${pointsToWin} (cancellation scoring)`);
    }

    const oneReached = score1 >= pointsToWin || score2 >= pointsToWin;
    const skunkApplies = skunkRule && Math.abs(score1 - score2) >= skunkDiff;

    if (!oneReached && !skunkApplies) {
      errors.push(
        `At least one score must reach ${pointsToWin}` +
          (skunkRule ? ` or differential must be >= ${skunkDiff} (skunk)` : '')
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Derive the result of a completed match. Supports draws.
 */
export function getMatchResult(match) {
  const { team1Id, team2Id, score1, score2 } = match;
  const differential = Math.abs(score1 - score2);

  if (score1 === score2) {
    return { winnerId: null, loserId: null, isDraw: true, differential: 0 };
  }
  if (score1 > score2) {
    return { winnerId: team1Id, loserId: team2Id, isDraw: false, differential };
  }
  return { winnerId: team2Id, loserId: team1Id, isDraw: false, differential };
}

/**
 * Check whether a score line qualifies as a skunk.
 */
export function isSkunk(score1, score2, skunkDiff) {
  return Math.abs(score1 - score2) >= skunkDiff;
}

/**
 * Calculate the cancellation result of a frame from raw points.
 */
export function calculateFrameResult(frame) {
  const net = Math.abs(frame.team1Pts - frame.team2Pts);
  const scoringTeam = frame.team1Pts > frame.team2Pts ? 1 : frame.team2Pts > frame.team1Pts ? 2 : 0;
  return { net, scoringTeam };
}

/**
 * Calculate running totals from frames using cancellation scoring.
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
 * Calculate raw (pre-cancellation) totals from frames.
 */
export function calculateRawTotal(frames) {
  let raw1 = 0, raw2 = 0;
  for (const f of frames) { raw1 += f.team1Pts; raw2 += f.team2Pts; }
  return { raw1, raw2 };
}

/**
 * Check if a game is complete based on its frames and game mode.
 */
export function isGameComplete(frames, settings = {}) {
  const {
    gameMode = 'standard',
    pointsToWin = 21,
    skunkRule = false,
    skunkDiff = 13,
    numFrames = 7,
    isBracket = false,
  } = settings;

  if (gameMode === 'quick') {
    if (frames.length < numFrames) return false;
    // After all frames played: complete unless it's a draw in a bracket (need extra frames)
    const { score1, score2 } = calculateRunningTotal(frames);
    if (isBracket && score1 === score2) return false; // Sudden death: keep playing
    return true;
  }

  // Standard mode
  const { score1, score2 } = calculateRunningTotal(frames);
  if (score1 >= pointsToWin || score2 >= pointsToWin) return true;
  if (skunkRule && Math.abs(score1 - score2) >= skunkDiff) return true;
  return false;
}

/**
 * Validate a frame (raw points per team, 0-12 each).
 */
export function validateFrame(frame) {
  const errors = [];
  if (!Number.isInteger(frame.team1Pts) || frame.team1Pts < 0 || frame.team1Pts > 12) {
    errors.push('Team 1 points must be 0-12');
  }
  if (!Number.isInteger(frame.team2Pts) || frame.team2Pts < 0 || frame.team2Pts > 12) {
    errors.push('Team 2 points must be 0-12');
  }
  return { valid: errors.length === 0, errors };
}
