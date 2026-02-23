import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
