import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, generate, levelDifficulty } from '../src/engine/generator';
import { grade, nextHint } from '../src/engine/grader';
import { fromString, toString } from '../src/engine/grid';
import { rngFrom } from '../src/engine/rng';
import { countSolutions, isConsistent, randomSolution, solve } from '../src/engine/solver';

describe('solver', () => {
  const puzzle = fromString('530070000600195000098000060800060003400803001700020006060000280000419005000080079');
  const answer = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

  it('solves a known puzzle', () => {
    expect(toString(solve(puzzle)!)).toBe(answer);
  });
  it('detects unique and multiple solutions', () => {
    expect(countSolutions(puzzle)).toBe(1);
    expect(countSolutions(new Array(81).fill(0))).toBe(2);
    const loose = puzzle.slice();
    for (let i = 0; i < 81; i += 2) loose[i] = 0;
    expect(countSolutions(loose)).toBe(2);
  });
  it('makes valid full grids', () => {
    const g = randomSolution(rngFrom('x'));
    expect(g.every((v) => v >= 1 && v <= 9)).toBe(true);
    expect(isConsistent(g)).toBe(true);
  });
});

describe('generator', () => {
  it('is deterministic', () => {
    expect(generate('level:7', 'easy')).toEqual(generate('level:7', 'easy'));
    expect(toString(generate('level:7', 'easy').givens)).not.toBe(toString(generate('level:8', 'easy').givens));
  });

  for (const d of DIFFICULTIES) {
    it(`${d}: unique, solvable by logic, in its band`, () => {
      for (let k = 0; k < 4; k++) {
        const p = generate(`t:${d}:${k}`, d);
        expect(countSolutions(p.givens)).toBe(1);
        expect(toString(solve(p.givens)!)).toBe(toString(p.solution));
        const g = grade(p.givens);
        expect(g.solved).toBe(true);
        if (d === 'gentle' || d === 'easy') expect(g.maxTier).toBe(1);
        if (d === 'gentle') expect(p.clues).toBeGreaterThanOrEqual(38);
        if (d === 'easy') expect(p.clues).toBeLessThan(36);
        if (d === 'hard') expect(g.maxTier).toBeGreaterThanOrEqual(2);
      }
    });
  }

  it('gets harder along the level path', () => {
    expect(levelDifficulty(1)).toBe('gentle');
    expect(levelDifficulty(10)).toBe('easy');
    expect(levelDifficulty(11)).toBe('easy');
    expect(levelDifficulty(45)).toBe('medium');
    expect(levelDifficulty(60)).toBe('hard');
    expect(levelDifficulty(99)).toBe('hard');
    expect(levelDifficulty(250)).toBe('expert');
  });
});

describe('hints', () => {
  it('always gives a correct move until the board is full', () => {
    const p = generate('hint-test', 'hard');
    const board = p.givens.slice();
    for (let n = 0; n < 81; n++) {
      const h = nextHint(board, p.solution);
      if (!h) break;
      expect(board[h.cell]).toBe(0);
      expect(h.digit).toBe(p.solution[h.cell]);
      expect(h.text.length).toBeGreaterThan(10);
      board[h.cell] = h.digit;
    }
    expect(toString(board)).toBe(toString(p.solution));
  });
});
