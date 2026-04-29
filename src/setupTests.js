import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollIntoView which is missing in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock DOMMatrix which is missing in JSDOM
global.DOMMatrix = class DOMMatrix {
  constructor() {}
  translate() { return new DOMMatrix(); }
  scale() { return new DOMMatrix(); }
  multiply() { return new DOMMatrix(); }
};
