export function canUseDevelopmentFallback(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === 'development';
}
