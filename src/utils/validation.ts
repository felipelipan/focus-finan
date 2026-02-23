export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
