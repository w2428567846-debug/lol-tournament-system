import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGameName, parseGameId } from '../lib/game-id.ts';

test('accepts a Chinese game name and numeric tag', () => {
  assert.deepEqual(parseGameId('峡谷玩家#12345'), {
    gameName: '峡谷玩家',
    gameTag: '12345',
    gameId: '峡谷玩家#12345',
    normalizedGameName: '峡谷玩家',
    normalizedGameTag: '12345',
  });
});

test('normalizes width, case and whitespace for duplicate checks', () => {
  const parsed = parseGameId('  ＡＢＣ 玩家  #ＣＮ01 ');
  assert.equal(parsed?.gameId, 'ABC 玩家#CN01');
  assert.equal(parsed?.normalizedGameName, 'abc 玩家');
  assert.equal(parsed?.normalizedGameTag, 'cn01');
  assert.equal(normalizeGameName('ABC   玩家'), parsed?.normalizedGameName);
});

test('rejects missing tags and region-style punctuation', () => {
  assert.equal(parseGameId('峡谷玩家'), null);
  assert.equal(parseGameId('峡谷玩家#'), null);
  assert.equal(parseGameId('峡谷玩家#12-34'), null);
});
