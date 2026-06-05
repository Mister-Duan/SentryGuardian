import * as Sentry from '@sentry-guardian/browser';

const dsn = import.meta.env.VITE_DSN || 'http://localhost:3001/api/sentry/cmpzkjt2d0004hyyc79uh0x89';
if (dsn) {
  Sentry.init({ dsn });
}

document.getElementById('throw')?.addEventListener('click', () => {
  throw new Error('Vanilla example error');
});
