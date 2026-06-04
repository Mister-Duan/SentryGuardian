import { describe, expect, it } from 'vitest';
import { App } from './App.js';

describe('App smoke', () => {
  it('exports root App component', () => {
    expect(App).toBeTypeOf('function');
  });
});
