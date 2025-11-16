// Configuração mockada completa para testes
// Unifica todas as configurações necessárias para scripts de teste
// Não depende de variáveis de ambiente

import type { TwoFAuthConfig } from '@/backend/api/twofauth.service';
import type { CodigoTRT, GrauTRT } from '@/backend/captura/services/trt/types';

/**
 * Dados do advogado para desenvolvimento
 */
export const MOCK_ADVOGADO = {
  id: 1,
  nome_completo: 'Pedro Zattar Eugenio',
  cpf: '07529294610',
  oab: '128404',
  uf_oab: 'MG',
};

/**
 * Senha da credencial (usada para todos os TRTs e graus)
 */
const SENHA_CREDENCIAL = '12345678A@';

/**
 * Lista de todos os códigos de TRT
 */
const TODOS_TRTS: CodigoTRT[] = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8',
  'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16',
  'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24',
];

/**
 * Lista de todos os graus
 */
const TODOS_GRAUS: GrauTRT[] = ['primeiro_grau', 'segundo_grau'];

/**
 * Gera credenciais mockadas para todos os TRTs e graus
 */
function gerarCredenciaisMockadas() {
  const credenciais = [];
  let id = 1;

  for (const trt of TODOS_TRTS) {
    for (const grau of TODOS_GRAUS) {
      credenciais.push({
        id: id++,
        advogado_id: MOCK_ADVOGADO.id,
        cpf: MOCK_ADVOGADO.cpf,
        senha: SENHA_CREDENCIAL,
        tribunal: trt,
        grau: grau,
        active: true,
      });
    }
  }

  return credenciais;
}

/**
 * Credenciais mockadas para todos os TRTs e graus
 * Total: 24 TRTs × 2 graus = 48 credenciais
 */
export const MOCK_CREDENCIAIS = gerarCredenciaisMockadas();

/**
 * Busca uma credencial mockada por ID
 */
export function getMockCredentialById(id: number) {
  return MOCK_CREDENCIAIS.find((c) => c.id === id);
}

/**
 * Busca credenciais mockadas por TRT e grau
 */
export function getMockCredentialByTribunalAndGrau(
  tribunal: CodigoTRT,
  grau: GrauTRT
) {
  return MOCK_CREDENCIAIS.find(
    (c) => c.tribunal === tribunal && c.grau === grau
  );
}

/**
 * Configuração mockada do 2FAuth para testes
 * Valores hardcoded - não usa variáveis de ambiente
 */
export const MOCK_TWOFAUTH_CONFIG: TwoFAuthConfig = {
  apiUrl: 'https://authenticator.service.sinesys.app/api/v1',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiOWQ1ZGVkNmQ2NzI0YTQxY2M2NGM0YWU1NDAxOWUxNTdhYTJlZDE5YWM1MWU4NTQyOGRmNjlhMGYyZjFiODgyYTIyMDhmODQzZjhkNWMyNGYiLCJpYXQiOjE3NjMzMDkwNTguNjUxNjY5LCJuYmYiOjE3NjMzMDkwNTguNjUxNjczLCJleHAiOjE3OTQ4NDUwNTguNjQ0NzU1LCJzdWIiOiIyIiwic2NvcGVzIjpbXX0.gcS8F-UfI4WjriM5RSv-FWczIAt8Nr9oXemPwyr7tCBm72Ad85vfuIqBc-ZbfogiiehGY_R8glsdrC_5YPD72E_l2M61td8yh6SH5zssIcMXqNExUpCvdHojHKVhlwKDG9euTTM0RTClUfRq9mVCocikcHTIZS8cbuhOqPIfruVBTHj6kxslgpw04wMM2JbnopoGEbr9RgRKc1jsxcMrxATKS4JvdrNLzPVJQZyi2-ePWWhArBLviedx5erM9l6Maazbu-t_knCNoVfDOtyvE_oqsJJLxd4FLGZPE_RDCwy16MtaVbYX0jL-sO8USxtDrBlZF9DoB5JMRO8Ap6sXvdi3K_Hy18UIt-E4fTqt_S7w0SLc6BWwgIFJ3AHKd_UaTOltnKe5rg1p4xW9evntcajMJGWWTrrOL0j8_X-mO3Vw4EikzclUB4TRFvGRX1RIM11sSXyG35Qcyc_FCFlxkt8JJW1_j5ixj1WyGy2GtjJhOnAjEsIW1dfGfiTFBMHmp8SnnMc6RZn3eivqcoCnJoouhQfg03uiy6OJjANpbidUjD1pb8ECydZxvjRLJQNzUNyJZofWFrZn0G4sJ39tmm3rt-T0BKJqNeafCk_D5J2m7iDKY3S1KLXG8pICIDP0zndJNLn56F11dDl9MIRMJZTgl0KhA3HuRD1slexdYwU',
  accountId: '3',
};

/**
 * Configuração mockada do Supabase para testes
 * Valores hardcoded - não usa variáveis de ambiente
 * 
 * IMPORTANTE: Estes valores devem ser substituídos pelos valores reais do seu projeto Supabase
 * quando necessário para testes que realmente salvem dados no banco.
 * 
 * Para scripts de teste, use as variáveis de ambiente se disponíveis, caso contrário use valores mockados.
 */
export const MOCK_SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  secretKey: process.env.SUPABASE_SECRET_KEY || 'your-secret-key-here',
};

/**
 * Obtém configuração do 2FAuth para testes
 */
export function getMockTwoFAuthConfig(): TwoFAuthConfig {
  return MOCK_TWOFAUTH_CONFIG;
}

/**
 * Obtém configuração do Supabase para testes
 * Retorna valores mockados ou das variáveis de ambiente se disponíveis
 */
export function getMockSupabaseConfig() {
  return MOCK_SUPABASE_CONFIG;
}

/**
 * Exporta todas as configurações mockadas em um único objeto
 */
export const MOCK_CONFIG = {
  twoFAuth: MOCK_TWOFAUTH_CONFIG,
  supabase: MOCK_SUPABASE_CONFIG,
  advogado: MOCK_ADVOGADO,
  getCredential: getMockCredentialByTribunalAndGrau,
  getCredentialById: getMockCredentialById,
};

