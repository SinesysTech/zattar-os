// Validador de telefone brasileiro
export const validateTelefone = (telefone: string): boolean => {
  // Remove formatação
  const cleaned = telefone.replace(/\D/g, '');
  
  // Verifica se tem 10 ou 11 dígitos
  if (cleaned.length !== 10 && cleaned.length !== 11) return false;
  
  // Extrai DDD
  const ddd = parseInt(cleaned.substring(0, 2));
  
  // DDDs válidos no Brasil (11 a 99)
  if (ddd < 11 || ddd > 99) return false;
  
  // Para celular (11 dígitos), deve começar com 9 após o DDD
  if (cleaned.length === 11) {
    const firstDigit = parseInt(cleaned.charAt(2));
    if (firstDigit !== 9) return false;
  }
  
  return true;
};