export type ParsedGameId = {
  gameName: string;
  gameTag: string;
  gameId: string;
  normalizedGameName: string;
  normalizedGameTag: string;
};

export function normalizeGameName(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('zh-CN');
}

export function normalizeGameTag(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/gu, '').toLocaleLowerCase('en-US');
}

export function parseGameId(value: string): ParsedGameId | null {
  const normalizedInput = value.normalize('NFKC').trim();
  const separator = normalizedInput.lastIndexOf('#');
  if (separator <= 0 || separator === normalizedInput.length - 1) return null;

  const gameName = normalizedInput.slice(0, separator).trim();
  const gameTag = normalizedInput.slice(separator + 1).trim();
  if (gameName.length < 1 || gameName.length > 32 || !/^[A-Za-z0-9]{1,16}$/.test(gameTag)) return null;

  return {
    gameName,
    gameTag,
    gameId: `${gameName}#${gameTag}`,
    normalizedGameName: normalizeGameName(gameName),
    normalizedGameTag: normalizeGameTag(gameTag),
  };
}
