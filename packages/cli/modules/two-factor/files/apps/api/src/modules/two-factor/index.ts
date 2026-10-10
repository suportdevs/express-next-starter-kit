import { defineModule } from '../../core';
import { CHALLENGE, router } from './routes';
import { isEnabled } from './service';

export default defineModule({
  name: 'two-factor',
  router,
  setup({ hooks }) {
    // Any sign-in (password, social, …) for a user with 2FA requires a code.
    hooks.addLoginGuard(async ({ user }) => ((await isEnabled(user.id)) ? CHALLENGE : null));
    hooks.addUserSerializer(async (user) => ({ twoFactorEnabled: await isEnabled(user.id) }));
  },
});
