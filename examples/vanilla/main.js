import * as Sentry from '@sentry-guardian/browser';

const dsn = import.meta.env.VITE_DSN;
if (dsn) {
  Sentry.init({ dsn });
}

document.getElementById('throw')?.addEventListener('click', () => {
  throw new Error('Vanilla example error');
});
