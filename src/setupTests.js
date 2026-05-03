import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollIntoView which is missing in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Polyfill for DOMMatrix which is not implemented in JSDOM
// @ts-ignore
window.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
  }
  translate() { return new DOMMatrix(); }
  scale() { return new DOMMatrix(); }
  multiply() { return new DOMMatrix(); }
};

// Mock Firebase Config for CI
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-auth-domain');
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-storage-bucket');
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'test-sender-id');
vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app-id');
vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', 'test-measurement-id');
