import '@testing-library/jest-dom';

// Mock para variáveis de ambiente
process.env.VITE_GEMINI_API_KEY = 'test-key';

// Suprimir logs de console em testes
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
};
