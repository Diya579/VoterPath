process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'mock-key';
process.env.GROQ_API_KEY = 'mock-key';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173,https://voterpath-776684989084.us-central1.run.app';
process.env.ALLOW_TEST_TOKENS = 'false'; // Explicitly disable bypass in test env
