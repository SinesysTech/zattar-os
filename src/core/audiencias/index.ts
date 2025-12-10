export * from './domain';
import { AudienciasRepository } from './repository';
import { AudienciasService } from './service';

// This is a simple dependency injection setup.
// In a larger application, a more sophisticated container might be used.
const audienciasRepository = new AudienciasRepository();
export const audienciasService = new AudienciasService(audienciasRepository);
