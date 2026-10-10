import { defineModule } from '../../core';
import { providers, registerStrategies } from './providers';
import { router } from './routes';

export default defineModule({
  name: 'social-auth',
  basePath: 'oauth',
  router,
  setup({ hooks, logger }) {
    registerStrategies();
    if (providers.size === 0) {
      logger.warn('No OAuth providers configured — set GOOGLE_* or GITHUB_* env vars to enable social login');
    }
    hooks.addFeatures(() => ({ oauthProviders: [...providers.keys()] }));
  },
});
