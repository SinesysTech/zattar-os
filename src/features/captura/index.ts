// Domain (tipos e interfaces)
export type {
    Credencial,
    ConfigTribunal,
    ProcessoCapturado,
    AudienciaCapturada,
    MovimentacaoCapturada,
    ResultadoCaptura,
    TipoCaptura,
    PeriodoAudiencias,
    BuscarProcessosParams,
    SistemaJudicialSuportado,
} from './domain';

export {
    mapearTipoAcessoParaGrau,
    mapearTipoCapturaParaOrigem,
} from './domain';

// Types (tipos específicos de API/UI)
export type {
    CapturaLog,
    StatusCaptura,
    CredencialDisponivel,
    AcervoGeralResult,
    ArquivadosResult,
    AudienciasResult,
    PendentesResult,
    CapturaPartesResult,
    TimelineResult,
} from './types';

// Constants
export { TRT_CODIGOS, GRAUS, FILTROS_PRAZO, STATUS_AUDIENCIA_OPTIONS } from './constants';

// Service (orquestrador)
export { executarCaptura, type ExecutarCapturaParams } from './service';

// Repository (acesso a dados)
export { buscarCredencial, buscarConfigTribunal, salvarLogCaptura } from './repository';

// Drivers
export { getDriver } from './drivers/factory';
export type { JudicialDriver, SessaoAutenticada } from './drivers/judicial-driver.interface';

// API Client (para uso em componentes)
export * from './services/api-client';

// Hooks
export { useCapturaLog } from './hooks/use-capturas-log';

// Components (re-export principais)
export { CapturaList } from './components/captura-list';
export { CapturaDialog } from './components/captura-dialog';
