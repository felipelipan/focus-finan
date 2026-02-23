import {
  validateTransaction,
  validateAmount,
  validateEmail,
  isValidDate,
  sanitizeString
} from '../utils/validation';

describe('Validation Utils', () => {
  describe('validateTransaction', () => {
    it('deve aceitar transação válida', () => {
      const transaction = {
        desc: 'Teste',
        value: 100,
        date: '20/02/26',
        cat: 'Alimentação'
      };
      const result = validateTransaction(transaction);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar descrição vazia', () => {
      const transaction = {
        desc: '',
        value: 100,
        date: '20/02/26',
        cat: 'Alimentação'
      };
      const result = validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar valor zero', () => {
      const transaction = {
        desc: 'Teste',
        value: 0,
        date: '20/02/26',
        cat: 'Alimentação'
      };
      const result = validateTransaction(transaction);
      expect(result.valid).toBe(false);
    });

    it('deve rejeitar data inválida', () => {
      const transaction = {
        desc: 'Teste',
        value: 100,
        date: '2026-02-20',
        cat: 'Alimentação'
      };
      const result = validateTransaction(transaction);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('deve aceitar números válidos', () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(-50)).toBe(true);
    });

    it('deve rejeitar zero', () => {
      expect(validateAmount(0)).toBe(false);
    });

    it('deve rejeitar NaN', () => {
      expect(validateAmount(NaN)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('deve aceitar datas válidas', () => {
      expect(isValidDate('20/02/26')).toBe(true);
      expect(isValidDate('01/01/20')).toBe(true);
    });

    it('deve rejeitar formatos inválidos', () => {
      expect(isValidDate('2026-02-20')).toBe(false);
      expect(isValidDate('20/2/26')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('deve aceitar emails válidos', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('deve rejeitar emails inválidos', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('deve remover caracteres perigosos', () => {
      expect(sanitizeString('<script>alert()</script>')).not.toContain('<');
    });

    it('deve limitar comprimento', () => {
      const long = 'a'.repeat(300);
      expect(sanitizeString(long).length).toBeLessThanOrEqual(255);
    });
  });
});
