import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollIntoView which is missing in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Polyfill for DOMMatrix which is not implemented in JSDOM
window.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
  }
  translate() { return new DOMMatrix(); }
  scale() { return new DOMMatrix(); }
  multiply() { return new DOMMatrix(); }
};
