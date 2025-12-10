// Form Schema Types
export * from './form-schema.types';

// Segmento Types
export {
  type Segmento,
  type SegmentoForm,
  type SegmentoSchemaType,
  segmentoSchema,
  generateSlugFromNome as generateSegmentoSlugFromNome,
  mapSegmentoFormToSegmento,
} from './segmento.types';

// Formulario Entity Types
export {
  type FormularioEntity,
  type FormularioForm,
  type FormularioComSegmentos,
  type FormularioEntitySchemaType,
  type FormularioEntityCreateSchemaType,
  formularioEntitySchema,
  formularioEntityCreateSchema,
  generateSlugFromNome as generateFormularioSlugFromNome,
  mapFormularioFormToFormulario,
} from './formulario-entity.types';

// Template Types
export * from './template.types';

// PDF Preview Types
export * from './pdf-preview.types';

// Adapter Types
export * from './cliente-adapter.types';
export * from './acao-adapter.types';

// Formulario Types (support types for multi-step form flow)
export * from './formulario.types';