import { describe, it, expect } from 'vitest';
import {
  validateScore,
  getMatchResult,
  calculateFrameResult,
  calculateRunningTotal,
  calculateRawTotal,
  isGameComplete,
  validateFrame,
  isSkunk,
} from '../src/lib/utils/scoring.js';

// ---------------------------------------------------------------------------
// validateScore
// ---------------------------------------------------------------------------
describe('validateScore', () => {
  describe('standard mode', () => {
    it('accepts a valid score where one team reaches 21', () => {
      const result = validateScore(21, 15);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts a valid score of 21-0', () => {
      const result = validateScore(21, 0);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects when neither team reaches 21', () => {
      const result = validateScore(15, 10);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects when both scores are >= 21', () => {
      const result = validateScore(25, 22);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Both scores'))).toBe(true);
    });
  });

  describe('quick mode', () => {
    it('accepts any valid scores', () => {
      const result = validateScore(8, 3, { gameMode: 'quick' });
      expect(result.valid).toBe(true);
    });

    it('allows draws in non-bracket play', () => {
      const result = validateScore(5, 5, { gameMode: 'quick' });
      expect(result.valid).toBe(true);
    });

    it('rejects draws in bracket play', () => {
      const result = validateScore(5, 5, { gameMode: 'quick', isBracket: true });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Draws'))).toBe(true);
    });
  });

  describe('skunk rule', () => {
    it('accepts a skunk score even if no one reached 21', () => {
      const result = validateScore(13, 0, { skunkRule: true, skunkDiff: 13 });
      expect(result.valid).toBe(true);
    });

    it('rejects when neither 21 reached nor skunk differential met', () => {
      const result = validateScore(12, 0);
      expect(result.valid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('rejects negative numbers', () => {
      const result = validateScore(-1, 21);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('non-negative'))).toBe(true);
    });

    it('rejects non-integer scores', () => {
      const result = validateScore(21.5, 10);
      expect(result.valid).toBe(false);
    });

    it('reports errors for both scores when both are invalid', () => {
      const result = validateScore(-1, -2);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// getMatchResult
// ---------------------------------------------------------------------------
describe('getMatchResult', () => {
  it('returns team1 as winner when score1 > score2', () => {
    const result = getMatchResult({ team1Id: 'A', team2Id: 'B', score1: 21, score2: 15 });
    expect(result.winnerId).toBe('A');
    expect(result.loserId).toBe('B');
    expect(result.isDraw).toBe(false);
    expect(result.differential).toBe(6);
  });

  it('returns team2 as winner when score2 > score1', () => {
    const result = getMatchResult({ team1Id: 'A', team2Id: 'B', score1: 10, score2: 21 });
    expect(result.winnerId).toBe('B');
    expect(result.loserId).toBe('A');
    expect(result.isDraw).toBe(false);
    expect(result.differential).toBe(11);
  });

  it('returns a draw when scores are equal', () => {
    const result = getMatchResult({ team1Id: 'A', team2Id: 'B', score1: 5, score2: 5 });
    expect(result.winnerId).toBeNull();
    expect(result.loserId).toBeNull();
    expect(result.isDraw).toBe(true);
    expect(result.differential).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateFrameResult
// ---------------------------------------------------------------------------
describe('calculateFrameResult', () => {
  it('returns net and scoring team for team 1 lead', () => {
    const result = calculateFrameResult({ team1Pts: 9, team2Pts: 3 });
    expect(result.net).toBe(6);
    expect(result.scoringTeam).toBe(1);
  });

  it('returns net and scoring team for team 2 lead', () => {
    const result = calculateFrameResult({ team1Pts: 2, team2Pts: 8 });
    expect(result.net).toBe(6);
    expect(result.scoringTeam).toBe(2);
  });

  it('returns a wash when points are equal', () => {
    const result = calculateFrameResult({ team1Pts: 5, team2Pts: 5 });
    expect(result.net).toBe(0);
    expect(result.scoringTeam).toBe(0);
  });

  it('handles a zero frame', () => {
    const result = calculateFrameResult({ team1Pts: 0, team2Pts: 0 });
    expect(result.net).toBe(0);
    expect(result.scoringTeam).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateRunningTotal
// ---------------------------------------------------------------------------
describe('calculateRunningTotal', () => {
  it('returns 0-0 for empty frames', () => {
    const result = calculateRunningTotal([]);
    expect(result.score1).toBe(0);
    expect(result.score2).toBe(0);
  });

  it('calculates correctly for a single frame', () => {
    const result = calculateRunningTotal([{ team1Pts: 7, team2Pts: 3 }]);
    expect(result.score1).toBe(4);
    expect(result.score2).toBe(0);
  });

  it('accumulates across multiple frames', () => {
    const frames = [
      { team1Pts: 9, team2Pts: 3 }, // net 6 -> team 1
      { team1Pts: 1, team2Pts: 8 }, // net 7 -> team 2
      { team1Pts: 4, team2Pts: 4 }, // wash
      { team1Pts: 5, team2Pts: 0 }, // net 5 -> team 1
    ];
    const result = calculateRunningTotal(frames);
    expect(result.score1).toBe(11); // 6 + 5
    expect(result.score2).toBe(7);
  });

  it('stays 0-0 when all frames are washes', () => {
    const frames = [
      { team1Pts: 3, team2Pts: 3 },
      { team1Pts: 6, team2Pts: 6 },
      { team1Pts: 0, team2Pts: 0 },
    ];
    const result = calculateRunningTotal(frames);
    expect(result.score1).toBe(0);
    expect(result.score2).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateRawTotal
// ---------------------------------------------------------------------------
describe('calculateRawTotal', () => {
  it('sums raw points for both teams', () => {
    const frames = [
      { team1Pts: 9, team2Pts: 3 },
      { team1Pts: 1, team2Pts: 8 },
      { team1Pts: 5, team2Pts: 0 },
    ];
    const result = calculateRawTotal(frames);
    expect(result.raw1).toBe(15);
    expect(result.raw2).toBe(11);
  });

  it('returns 0-0 for empty frames', () => {
    const result = calculateRawTotal([]);
    expect(result.raw1).toBe(0);
    expect(result.raw2).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isGameComplete
// ---------------------------------------------------------------------------
describe('isGameComplete', () => {
  describe('standard mode', () => {
    it('returns true when a team reaches the target', () => {
      // Team 1 scores net 12 each frame -> 12 + 12 = 24 after 2 frames
      const frames = [
        { team1Pts: 12, team2Pts: 0 },
        { team1Pts: 12, team2Pts: 0 },
      ];
      expect(isGameComplete(frames)).toBe(true);
    });

    it('returns false when no team has reached the target', () => {
      const frames = [
        { team1Pts: 5, team2Pts: 0 },
        { team1Pts: 3, team2Pts: 0 },
      ];
      expect(isGameComplete(frames)).toBe(false);
    });

    it('returns true when skunk rule triggers completion', () => {
      // Net: 12 + 3 = 15 for team 1 (>= skunkDiff 13)
      const frames = [
        { team1Pts: 12, team2Pts: 0 },
        { team1Pts: 3, team2Pts: 0 },
      ];
      expect(isGameComplete(frames, { skunkRule: true, skunkDiff: 13 })).toBe(true);
    });
  });

  describe('quick mode', () => {
    it('returns true when enough frames have been played', () => {
      const frames = Array.from({ length: 7 }, () => ({ team1Pts: 3, team2Pts: 0 }));
      expect(isGameComplete(frames, { gameMode: 'quick', numFrames: 7 })).toBe(true);
    });

    it('returns false when not enough frames have been played', () => {
      const frames = Array.from({ length: 4 }, () => ({ team1Pts: 3, team2Pts: 0 }));
      expect(isGameComplete(frames, { gameMode: 'quick', numFrames: 7 })).toBe(false);
    });

    it('returns false when tied in bracket (sudden death)', () => {
      const frames = Array.from({ length: 7 }, () => ({ team1Pts: 5, team2Pts: 5 }));
      expect(
        isGameComplete(frames, { gameMode: 'quick', numFrames: 7, isBracket: true })
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// validateFrame
// ---------------------------------------------------------------------------
describe('validateFrame', () => {
  it('accepts a valid frame', () => {
    const result = validateFrame({ team1Pts: 6, team2Pts: 3 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects negative points', () => {
    const result = validateFrame({ team1Pts: -1, team2Pts: 3 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Team 1'))).toBe(true);
  });

  it('rejects points greater than 12', () => {
    const result = validateFrame({ team1Pts: 6, team2Pts: 13 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Team 2'))).toBe(true);
  });

  it('rejects non-integer points', () => {
    const result = validateFrame({ team1Pts: 3.5, team2Pts: 2 });
    expect(result.valid).toBe(false);
  });

  it('reports errors for both teams when both are invalid', () => {
    const result = validateFrame({ team1Pts: -1, team2Pts: 15 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// isSkunk
// ---------------------------------------------------------------------------
describe('isSkunk', () => {
  it('returns true when differential equals the skunk threshold', () => {
    expect(isSkunk(13, 0, 13)).toBe(true);
  });

  it('returns true when differential exceeds the skunk threshold', () => {
    expect(isSkunk(20, 5, 13)).toBe(true);
  });

  it('returns false when differential is below the skunk threshold', () => {
    expect(isSkunk(12, 0, 13)).toBe(false);
  });

  it('works regardless of score order', () => {
    expect(isSkunk(0, 13, 13)).toBe(true);
  });
});
