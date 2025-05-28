export const config = {
  port: process.env.PORT || 3000,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  convexUrl: process.env.CONVEX_URL,
  convexDeployKey: process.env.CONVEX_DEPLOY_KEY,
  convexAdminToken: process.env.CONVEX_ADMIN_TOKEN,
  turnDomain: process.env.TURN_DOMAIN
};
