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
} from './domain';

// PJE Documento Types
export type {
    DocumentoMetadata,
    DocumentoConteudo,
    FetchDocumentoParams,
    FetchDocumentoResult,
    ArquivoInfo,
} from './types/documento-types';

// TRT Types (exportados de types.ts que re-exporta de trt-types.ts)
export type {
    CodigoTRT,
    GrauTRT,
    FiltroPrazoPendentes,
} from './domain';

// TRT Types diretos (incluindo ConfigTRT que não está em types.ts)
export type {
    TipoRotaTRT,
    TipoAcessoTribunal,
    BaseCapturaTRTParams,
    CredenciaisTRT,
    CustomTimeouts,
    TribunalConfigDb,
    ConfigTRT,
} from './types/trt-types';

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

// PJE-TRT API (exportações principais)
export { obterPartesProcesso, obterRepresentantesPartePorID } from './pje-trt/partes';
export { obterTimeline } from './pje-trt/timeline';
export { fetchPJEAPI } from './pje-trt/shared/fetch';
export type { TimelineResponse, ObterTimelineOptions } from './pje-trt/timeline';

// TRT Services (autenticação e configuração)
export { autenticarPJE, type AuthResult } from './services/trt/trt-auth.service';
export { getTribunalConfig } from './services/trt/config';

// Timeline Service
export { capturarTimeline, type CapturaTimelineParams, type CapturaTimelineResult } from './services/timeline/timeline-capture.service';

// Partes Service
export { capturarPartesProcesso, type ProcessoParaCaptura } from './services/partes/partes-capture.service';

// Hooks
export { useCapturaLog } from './hooks/use-capturas-log';

// Components (re-export principais)
export { CapturaList } from './components/captura-list';
export { CapturaDialog } from './components/captura-dialog';

// Comunica CNJ
export * from './comunica-cnj/domain';
export * from './comunica-cnj/cnj-client';
export * from './comunica-cnj/repository';
export * from './comunica-cnj/service';

// Actions
export * from './actions/comunica-cnj-actions';

// Comunica CNJ Components
export * from './components/comunica-cnj';
