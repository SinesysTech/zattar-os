export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      acervo: {
        Row: {
          advogado_id: number
          classe_judicial: string
          classe_judicial_id: number | null
          codigo_status_processo: string
          created_at: string
          dados_anteriores: Json | null
          data_arquivamento: string | null
          data_autuacao: string
          data_proxima_audiencia: string | null
          descricao_orgao_julgador: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id: number
          id_pje: number
          juizo_digital: boolean
          nome_parte_autora: string
          nome_parte_re: string
          numero: number
          numero_processo: string
          origem: string
          prioridade_processual: number
          qtde_parte_autora: number
          qtde_parte_re: number
          responsavel_id: number | null
          segredo_justica: boolean
          tem_associacao: boolean
          timeline_jsonb: Json | null
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at: string
        }
        Insert: {
          advogado_id: number
          classe_judicial: string
          classe_judicial_id?: number | null
          codigo_status_processo: string
          created_at?: string
          dados_anteriores?: Json | null
          data_arquivamento?: string | null
          data_autuacao: string
          data_proxima_audiencia?: string | null
          descricao_orgao_julgador: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pje: number
          juizo_digital?: boolean
          nome_parte_autora: string
          nome_parte_re: string
          numero: number
          numero_processo: string
          origem: string
          prioridade_processual?: number
          qtde_parte_autora?: number
          qtde_parte_re?: number
          responsavel_id?: number | null
          segredo_justica?: boolean
          tem_associacao?: boolean
          timeline_jsonb?: Json | null
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Update: {
          advogado_id?: number
          classe_judicial?: string
          classe_judicial_id?: number | null
          codigo_status_processo?: string
          created_at?: string
          dados_anteriores?: Json | null
          data_arquivamento?: string | null
          data_autuacao?: string
          data_proxima_audiencia?: string | null
          descricao_orgao_julgador?: string
          grau?: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pje?: number
          juizo_digital?: boolean
          nome_parte_autora?: string
          nome_parte_re?: string
          numero?: number
          numero_processo?: string
          origem?: string
          prioridade_processual?: number
          qtde_parte_autora?: number
          qtde_parte_re?: number
          responsavel_id?: number | null
          segredo_justica?: boolean
          tem_associacao?: boolean
          timeline_jsonb?: Json | null
          trt?: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acervo_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acervo_classe_judicial_id_fkey"
            columns: ["classe_judicial_id"]
            isOneToOne: false
            referencedRelation: "classe_judicial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acervo_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      acordos_condenacoes: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_vencimento_primeira_parcela: string
          direcao: string
          forma_distribuicao: string | null
          honorarios_sucumbenciais_total: number | null
          id: number
          numero_parcelas: number
          percentual_cliente: number | null
          percentual_escritorio: number | null
          processo_id: number
          status: string
          tipo: string
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_vencimento_primeira_parcela: string
          direcao: string
          forma_distribuicao?: string | null
          honorarios_sucumbenciais_total?: number | null
          id?: never
          numero_parcelas?: number
          percentual_cliente?: number | null
          percentual_escritorio?: number | null
          processo_id: number
          status?: string
          tipo: string
          updated_at?: string | null
          valor_total: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_vencimento_primeira_parcela?: string
          direcao?: string
          forma_distribuicao?: string | null
          honorarios_sucumbenciais_total?: number | null
          id?: never
          numero_parcelas?: number
          percentual_cliente?: number | null
          percentual_escritorio?: number | null
          processo_id?: number
          status?: string
          tipo?: string
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "acordos_condenacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_condenacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_condenacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
        ]
      }
      advogados: {
        Row: {
          cpf: string
          created_at: string
          id: number
          nome_completo: string
          oab: string
          uf_oab: string
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          id?: never
          nome_completo: string
          oab: string
          uf_oab: string
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          id?: never
          nome_completo?: string
          oab?: string
          uf_oab?: string
          updated_at?: string
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          advogado_id: number | null
          ativo: boolean | null
          created_at: string | null
          credencial_ids: number[]
          dias_intervalo: number | null
          horario: string
          id: number
          parametros_extras: Json | null
          periodicidade: string
          proxima_execucao: string
          tipo_captura: Database["public"]["Enums"]["tipo_captura"]
          ultima_execucao: string | null
          updated_at: string | null
        }
        Insert: {
          advogado_id?: number | null
          ativo?: boolean | null
          created_at?: string | null
          credencial_ids: number[]
          dias_intervalo?: number | null
          horario: string
          id?: never
          parametros_extras?: Json | null
          periodicidade: string
          proxima_execucao: string
          tipo_captura: Database["public"]["Enums"]["tipo_captura"]
          ultima_execucao?: string | null
          updated_at?: string | null
        }
        Update: {
          advogado_id?: number | null
          ativo?: boolean | null
          created_at?: string | null
          credencial_ids?: number[]
          dias_intervalo?: number | null
          horario?: string
          id?: never
          parametros_extras?: Json | null
          periodicidade?: string
          proxima_execucao?: string
          tipo_captura?: Database["public"]["Enums"]["tipo_captura"]
          ultima_execucao?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
        ]
      }
      arquivos: {
        Row: {
          b2_key: string
          b2_url: string
          created_at: string | null
          criado_por: number
          deleted_at: string | null
          id: number
          nome: string
          pasta_id: number | null
          tamanho_bytes: number
          tipo_media: string
          tipo_mime: string
          updated_at: string | null
        }
        Insert: {
          b2_key: string
          b2_url: string
          created_at?: string | null
          criado_por: number
          deleted_at?: string | null
          id?: number
          nome: string
          pasta_id?: number | null
          tamanho_bytes: number
          tipo_media: string
          tipo_mime: string
          updated_at?: string | null
        }
        Update: {
          b2_key?: string
          b2_url?: string
          created_at?: string | null
          criado_por?: number
          deleted_at?: string | null
          id?: number
          nome?: string
          pasta_id?: number | null
          tamanho_bytes?: number
          tipo_media?: string
          tipo_mime?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arquivos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arquivos_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      assinatura_digital_assinaturas: {
        Row: {
          acao_id: number
          assinatura_url: string
          cliente_id: number
          created_at: string | null
          data_assinatura: string
          data_envio_externo: string | null
          dispositivo_fingerprint_raw: Json | null
          enviado_sistema_externo: boolean | null
          formulario_id: number
          foto_url: string | null
          geolocation_accuracy: number | null
          geolocation_timestamp: string | null
          hash_final_sha256: string | null
          hash_original_sha256: string
          id: number
          ip_address: string | null
          latitude: number | null
          longitude: number | null
          pdf_url: string
          processo_id: number | null
          protocolo: string
          segmento_id: number
          sessao_uuid: string
          status: string | null
          template_uuid: string
          termos_aceite_data: string
          termos_aceite_versao: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          acao_id: number
          assinatura_url: string
          cliente_id: number
          created_at?: string | null
          data_assinatura: string
          data_envio_externo?: string | null
          dispositivo_fingerprint_raw?: Json | null
          enviado_sistema_externo?: boolean | null
          formulario_id: number
          foto_url?: string | null
          geolocation_accuracy?: number | null
          geolocation_timestamp?: string | null
          hash_final_sha256?: string | null
          hash_original_sha256: string
          id?: never
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          pdf_url: string
          processo_id?: number | null
          protocolo: string
          segmento_id: number
          sessao_uuid: string
          status?: string | null
          template_uuid: string
          termos_aceite_data: string
          termos_aceite_versao: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          acao_id?: number
          assinatura_url?: string
          cliente_id?: number
          created_at?: string | null
          data_assinatura?: string
          data_envio_externo?: string | null
          dispositivo_fingerprint_raw?: Json | null
          enviado_sistema_externo?: boolean | null
          formulario_id?: number
          foto_url?: string | null
          geolocation_accuracy?: number | null
          geolocation_timestamp?: string | null
          hash_final_sha256?: string | null
          hash_original_sha256?: string
          id?: never
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          pdf_url?: string
          processo_id?: number | null
          protocolo?: string
          segmento_id?: number
          sessao_uuid?: string
          status?: string | null
          template_uuid?: string
          termos_aceite_data?: string
          termos_aceite_versao?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinatura_digital_assinaturas_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "assinatura_digital_formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinatura_digital_assinaturas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinatura_digital_assinaturas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinatura_digital_assinaturas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
          {
            foreignKeyName: "assinatura_digital_assinaturas_segmento_id_fkey"
            columns: ["segmento_id"]
            isOneToOne: false
            referencedRelation: "segmentos"
            referencedColumns: ["id"]
          },
        ]
      }
      assinatura_digital_formularios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          criado_por: string | null
          descricao: string | null
          form_schema: Json | null
          formulario_uuid: string
          foto_necessaria: boolean | null
          geolocation_necessaria: boolean | null
          id: number
          metadados_seguranca: string | null
          nome: string
          ordem: number | null
          schema_version: string | null
          segmento_id: number
          slug: string
          template_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          form_schema?: Json | null
          formulario_uuid?: string
          foto_necessaria?: boolean | null
          geolocation_necessaria?: boolean | null
          id?: never
          metadados_seguranca?: string | null
          nome: string
          ordem?: number | null
          schema_version?: string | null
          segmento_id: number
          slug: string
          template_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          form_schema?: Json | null
          formulario_uuid?: string
          foto_necessaria?: boolean | null
          geolocation_necessaria?: boolean | null
          id?: never
          metadados_seguranca?: string | null
          nome?: string
          ordem?: number | null
          schema_version?: string | null
          segmento_id?: number
          slug?: string
          template_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinatura_digital_formularios_segmento_id_fkey"
            columns: ["segmento_id"]
            isOneToOne: false
            referencedRelation: "segmentos"
            referencedColumns: ["id"]
          },
        ]
      }
      assinatura_digital_sessoes_assinatura: {
        Row: {
          acao_id: number | null
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          geolocation: Json | null
          id: number
          ip_address: string | null
          sessao_uuid: string
          status: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          acao_id?: number | null
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          geolocation?: Json | null
          id?: never
          ip_address?: string | null
          sessao_uuid?: string
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          acao_id?: number | null
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          geolocation?: Json | null
          id?: never
          ip_address?: string | null
          sessao_uuid?: string
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      assinatura_digital_templates: {
        Row: {
          arquivo_nome: string
          arquivo_original: string
          arquivo_tamanho: number
          ativo: boolean | null
          campos: string | null
          conteudo_markdown: string | null
          created_at: string | null
          criado_por: string | null
          descricao: string | null
          id: number
          nome: string
          processo_id: number | null
          status: string | null
          template_uuid: string
          updated_at: string | null
          versao: number | null
        }
        Insert: {
          arquivo_nome: string
          arquivo_original: string
          arquivo_tamanho: number
          ativo?: boolean | null
          campos?: string | null
          conteudo_markdown?: string | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: never
          nome: string
          processo_id?: number | null
          status?: string | null
          template_uuid?: string
          updated_at?: string | null
          versao?: number | null
        }
        Update: {
          arquivo_nome?: string
          arquivo_original?: string
          arquivo_tamanho?: number
          ativo?: boolean | null
          campos?: string | null
          conteudo_markdown?: string | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: never
          nome?: string
          processo_id?: number | null
          status?: string | null
          template_uuid?: string
          updated_at?: string | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assinatura_digital_templates_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinatura_digital_templates_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinatura_digital_templates_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
        ]
      }
      assistentes: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: number
          descricao: string | null
          id: number
          iframe_code: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por: number
          descricao?: string | null
          id?: never
          iframe_code: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: number
          descricao?: string | null
          id?: never
          iframe_code?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistentes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      audiencias: {
        Row: {
          advogado_id: number
          ata_audiencia_id: number | null
          classe_judicial_id: number | null
          created_at: string
          dados_anteriores: Json | null
          data_fim: string
          data_inicio: string
          designada: boolean
          documento_ativo: boolean
          em_andamento: boolean
          endereco_presencial: Json | null
          grau: Database["public"]["Enums"]["grau_tribunal"]
          hora_fim: string | null
          hora_inicio: string | null
          id: number
          id_pje: number
          juizo_digital: boolean
          modalidade: Database["public"]["Enums"]["modalidade_audiencia"] | null
          numero_processo: string
          observacoes: string | null
          orgao_julgador_id: number | null
          polo_ativo_nome: string | null
          polo_ativo_representa_varios: boolean
          polo_passivo_nome: string | null
          polo_passivo_representa_varios: boolean
          presenca_hibrida: string | null
          processo_id: number
          responsavel_id: number | null
          sala_audiencia_id: number | null
          sala_audiencia_nome: string | null
          segredo_justica: boolean
          status: string
          status_descricao: string | null
          tipo_audiencia_id: number | null
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at: string
          url_ata_audiencia: string | null
          url_audiencia_virtual: string | null
        }
        Insert: {
          advogado_id: number
          ata_audiencia_id?: number | null
          classe_judicial_id?: number | null
          created_at?: string
          dados_anteriores?: Json | null
          data_fim: string
          data_inicio: string
          designada?: boolean
          documento_ativo?: boolean
          em_andamento?: boolean
          endereco_presencial?: Json | null
          grau: Database["public"]["Enums"]["grau_tribunal"]
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: never
          id_pje: number
          juizo_digital?: boolean
          modalidade?:
            | Database["public"]["Enums"]["modalidade_audiencia"]
            | null
          numero_processo: string
          observacoes?: string | null
          orgao_julgador_id?: number | null
          polo_ativo_nome?: string | null
          polo_ativo_representa_varios?: boolean
          polo_passivo_nome?: string | null
          polo_passivo_representa_varios?: boolean
          presenca_hibrida?: string | null
          processo_id: number
          responsavel_id?: number | null
          sala_audiencia_id?: number | null
          sala_audiencia_nome?: string | null
          segredo_justica?: boolean
          status: string
          status_descricao?: string | null
          tipo_audiencia_id?: number | null
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
          url_ata_audiencia?: string | null
          url_audiencia_virtual?: string | null
        }
        Update: {
          advogado_id?: number
          ata_audiencia_id?: number | null
          classe_judicial_id?: number | null
          created_at?: string
          dados_anteriores?: Json | null
          data_fim?: string
          data_inicio?: string
          designada?: boolean
          documento_ativo?: boolean
          em_andamento?: boolean
          endereco_presencial?: Json | null
          grau?: Database["public"]["Enums"]["grau_tribunal"]
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: never
          id_pje?: number
          juizo_digital?: boolean
          modalidade?:
            | Database["public"]["Enums"]["modalidade_audiencia"]
            | null
          numero_processo?: string
          observacoes?: string | null
          orgao_julgador_id?: number | null
          polo_ativo_nome?: string | null
          polo_ativo_representa_varios?: boolean
          polo_passivo_nome?: string | null
          polo_passivo_representa_varios?: boolean
          presenca_hibrida?: string | null
          processo_id?: number
          responsavel_id?: number | null
          sala_audiencia_id?: number | null
          sala_audiencia_nome?: string | null
          segredo_justica?: boolean
          status?: string
          status_descricao?: string | null
          tipo_audiencia_id?: number | null
          trt?: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
          url_ata_audiencia?: string | null
          url_audiencia_virtual?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_classe_judicial_id_fkey"
            columns: ["classe_judicial_id"]
            isOneToOne: false
            referencedRelation: "classe_judicial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_orgao_julgador_id_fkey"
            columns: ["orgao_julgador_id"]
            isOneToOne: false
            referencedRelation: "orgao_julgador"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
          {
            foreignKeyName: "audiencias_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_sala_audiencia_id_fkey"
            columns: ["sala_audiencia_id"]
            isOneToOne: false
            referencedRelation: "sala_audiencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_tipo_audiencia_id_fkey"
            columns: ["tipo_audiencia_id"]
            isOneToOne: false
            referencedRelation: "tipo_audiencia"
            referencedColumns: ["id"]
          },
        ]
      }
      cadastros_pje: {
        Row: {
          created_at: string
          dados_cadastro_pje: Json | null
          entidade_id: number
          grau: string | null
          id: number
          id_pessoa_pje: number
          sistema: string
          tipo_entidade: string
          tribunal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dados_cadastro_pje?: Json | null
          entidade_id: number
          grau?: string | null
          id?: never
          id_pessoa_pje: number
          sistema?: string
          tipo_entidade: string
          tribunal: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dados_cadastro_pje?: Json | null
          entidade_id?: number
          grau?: string | null
          id?: never
          id_pessoa_pje?: number
          sistema?: string
          tipo_entidade?: string
          tribunal?: string
          updated_at?: string
        }
        Relationships: []
      }
      capturas_log: {
        Row: {
          advogado_id: number | null
          concluido_em: string | null
          created_at: string
          credencial_ids: number[]
          erro: string | null
          id: number
          iniciado_em: string
          resultado: Json | null
          status: Database["public"]["Enums"]["status_captura"]
          tipo_captura: Database["public"]["Enums"]["tipo_captura"]
        }
        Insert: {
          advogado_id?: number | null
          concluido_em?: string | null
          created_at?: string
          credencial_ids?: number[]
          erro?: string | null
          id?: never
          iniciado_em?: string
          resultado?: Json | null
          status?: Database["public"]["Enums"]["status_captura"]
          tipo_captura: Database["public"]["Enums"]["tipo_captura"]
        }
        Update: {
          advogado_id?: number | null
          concluido_em?: string | null
          created_at?: string
          credencial_ids?: number[]
          erro?: string | null
          id?: never
          iniciado_em?: string
          resultado?: Json | null
          status?: Database["public"]["Enums"]["status_captura"]
          tipo_captura?: Database["public"]["Enums"]["tipo_captura"]
        }
        Relationships: [
          {
            foreignKeyName: "capturas_log_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: number | null
          descricao: string | null
          id: number
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: number | null
          descricao?: string | null
          id?: never
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: number | null
          descricao?: string | null
          id?: never
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cargos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          ativo: boolean
          centro_pai_id: number | null
          codigo: string
          created_at: string
          created_by: number | null
          descricao: string | null
          id: number
          nome: string
          responsavel_id: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          centro_pai_id?: number | null
          codigo: string
          created_at?: string
          created_by?: number | null
          descricao?: string | null
          id?: never
          nome: string
          responsavel_id?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          centro_pai_id?: number | null
          codigo?: string
          created_at?: string
          created_by?: number | null
          descricao?: string | null
          id?: never
          nome?: string
          responsavel_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centros_custo_centro_pai_id_fkey"
            columns: ["centro_pai_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centros_custo_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centros_custo_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      chamadas: {
        Row: {
          created_at: string
          duracao_segundos: number | null
          finalizada_em: string | null
          gravacao_url: string | null
          id: number
          iniciada_em: string
          iniciado_por: number
          meeting_id: string
          resumo: string | null
          sala_id: number
          status: string
          tipo: string
          transcricao: string | null
        }
        Insert: {
          created_at?: string
          duracao_segundos?: number | null
          finalizada_em?: string | null
          gravacao_url?: string | null
          id?: never
          iniciada_em?: string
          iniciado_por: number
          meeting_id: string
          resumo?: string | null
          sala_id: number
          status: string
          tipo: string
          transcricao?: string | null
        }
        Update: {
          created_at?: string
          duracao_segundos?: number | null
          finalizada_em?: string | null
          gravacao_url?: string | null
          id?: never
          iniciada_em?: string
          iniciado_por?: number
          meeting_id?: string
          resumo?: string | null
          sala_id?: number
          status?: string
          tipo?: string
          transcricao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamadas_iniciado_por_fkey"
            columns: ["iniciado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas_chat"
            referencedColumns: ["id"]
          },
        ]
      }
      chamadas_participantes: {
        Row: {
          aceitou: boolean | null
          chamada_id: number
          created_at: string
          duracao_segundos: number | null
          entrou_em: string | null
          id: number
          respondeu_em: string | null
          saiu_em: string | null
          usuario_id: number
        }
        Insert: {
          aceitou?: boolean | null
          chamada_id: number
          created_at?: string
          duracao_segundos?: number | null
          entrou_em?: string | null
          id?: never
          respondeu_em?: string | null
          saiu_em?: string | null
          usuario_id: number
        }
        Update: {
          aceitou?: boolean | null
          chamada_id?: number
          created_at?: string
          duracao_segundos?: number | null
          entrou_em?: string | null
          id?: never
          respondeu_em?: string | null
          saiu_em?: string | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chamadas_participantes_chamada_id_fkey"
            columns: ["chamada_id"]
            isOneToOne: false
            referencedRelation: "chamadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_participantes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      classe_judicial: {
        Row: {
          ativo: boolean
          codigo: string
          controla_valor_causa: boolean
          created_at: string
          descricao: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id: number
          id_classe_judicial_pai: number | null
          id_pje: number
          piso_valor_causa: number | null
          pode_incluir_autoridade: boolean
          possui_filhos: boolean
          requer_processo_referencia_codigo: string | null
          sigla: string | null
          teto_valor_causa: number | null
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          controla_valor_causa?: boolean
          created_at?: string
          descricao: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_classe_judicial_pai?: number | null
          id_pje: number
          piso_valor_causa?: number | null
          pode_incluir_autoridade?: boolean
          possui_filhos?: boolean
          requer_processo_referencia_codigo?: string | null
          sigla?: string | null
          teto_valor_causa?: number | null
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          controla_valor_causa?: boolean
          created_at?: string
          descricao?: string
          grau?: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_classe_judicial_pai?: number | null
          id_pje?: number
          piso_valor_causa?: number | null
          pode_incluir_autoridade?: boolean
          possui_filhos?: boolean
          requer_processo_referencia_codigo?: string | null
          sigla?: string | null
          teto_valor_causa?: number | null
          trt?: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ativo: boolean
          autoridade: boolean | null
          cnpj: string | null
          cpf: string | null
          cpf_responsavel: string | null
          created_at: string
          created_by: number | null
          dados_anteriores: Json | null
          data_abertura: string | null
          data_fim_atividade: string | null
          data_nascimento: string | null
          ddd_celular: string | null
          ddd_comercial: string | null
          ddd_residencial: string | null
          ds_prazo_expediente_automatico: string | null
          ds_tipo_pessoa: string | null
          emails: Json | null
          endereco_id: number | null
          escolaridade_codigo: number | null
          estado_civil: Database["public"]["Enums"]["estado_civil"] | null
          genero: Database["public"]["Enums"]["genero_usuario"] | null
          id: number
          inscricao_estadual: string | null
          login_pje: string | null
          nacionalidade: string | null
          naturalidade_estado_id_pje: number | null
          naturalidade_estado_sigla: string | null
          naturalidade_id_pje: number | null
          naturalidade_municipio: string | null
          nome: string
          nome_genitora: string | null
          nome_social_fantasia: string | null
          numero_celular: string | null
          numero_comercial: string | null
          numero_residencial: string | null
          observacoes: string | null
          oficial: boolean | null
          orgao_publico: boolean | null
          pais_nascimento_codigo: string | null
          pais_nascimento_descricao: string | null
          pais_nascimento_id_pje: number | null
          pode_usar_celular_mensagem: boolean | null
          porte_codigo: number | null
          porte_descricao: string | null
          ramo_atividade: string | null
          rg: string | null
          sexo: string | null
          situacao_cnpj_receita_descricao: string | null
          situacao_cnpj_receita_id: number | null
          situacao_cpf_receita_descricao: string | null
          situacao_cpf_receita_id: number | null
          situacao_pje: string | null
          status_pje: string | null
          tipo_documento: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pessoa_codigo_pje: string | null
          tipo_pessoa_label_pje: string | null
          tipo_pessoa_validacao_receita: string | null
          uf_nascimento_descricao: string | null
          uf_nascimento_id_pje: number | null
          uf_nascimento_sigla: string | null
          ultima_atualizacao_pje: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          autoridade?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          created_by?: number | null
          dados_anteriores?: Json | null
          data_abertura?: string | null
          data_fim_atividade?: string | null
          data_nascimento?: string | null
          ddd_celular?: string | null
          ddd_comercial?: string | null
          ddd_residencial?: string | null
          ds_prazo_expediente_automatico?: string | null
          ds_tipo_pessoa?: string | null
          emails?: Json | null
          endereco_id?: number | null
          escolaridade_codigo?: number | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id?: never
          inscricao_estadual?: string | null
          login_pje?: string | null
          nacionalidade?: string | null
          naturalidade_estado_id_pje?: number | null
          naturalidade_estado_sigla?: string | null
          naturalidade_id_pje?: number | null
          naturalidade_municipio?: string | null
          nome: string
          nome_genitora?: string | null
          nome_social_fantasia?: string | null
          numero_celular?: string | null
          numero_comercial?: string | null
          numero_residencial?: string | null
          observacoes?: string | null
          oficial?: boolean | null
          orgao_publico?: boolean | null
          pais_nascimento_codigo?: string | null
          pais_nascimento_descricao?: string | null
          pais_nascimento_id_pje?: number | null
          pode_usar_celular_mensagem?: boolean | null
          porte_codigo?: number | null
          porte_descricao?: string | null
          ramo_atividade?: string | null
          rg?: string | null
          sexo?: string | null
          situacao_cnpj_receita_descricao?: string | null
          situacao_cnpj_receita_id?: number | null
          situacao_cpf_receita_descricao?: string | null
          situacao_cpf_receita_id?: number | null
          situacao_pje?: string | null
          status_pje?: string | null
          tipo_documento?: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pessoa_codigo_pje?: string | null
          tipo_pessoa_label_pje?: string | null
          tipo_pessoa_validacao_receita?: string | null
          uf_nascimento_descricao?: string | null
          uf_nascimento_id_pje?: number | null
          uf_nascimento_sigla?: string | null
          ultima_atualizacao_pje?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          autoridade?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          created_by?: number | null
          dados_anteriores?: Json | null
          data_abertura?: string | null
          data_fim_atividade?: string | null
          data_nascimento?: string | null
          ddd_celular?: string | null
          ddd_comercial?: string | null
          ddd_residencial?: string | null
          ds_prazo_expediente_automatico?: string | null
          ds_tipo_pessoa?: string | null
          emails?: Json | null
          endereco_id?: number | null
          escolaridade_codigo?: number | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id?: never
          inscricao_estadual?: string | null
          login_pje?: string | null
          nacionalidade?: string | null
          naturalidade_estado_id_pje?: number | null
          naturalidade_estado_sigla?: string | null
          naturalidade_id_pje?: number | null
          naturalidade_municipio?: string | null
          nome?: string
          nome_genitora?: string | null
          nome_social_fantasia?: string | null
          numero_celular?: string | null
          numero_comercial?: string | null
          numero_residencial?: string | null
          observacoes?: string | null
          oficial?: boolean | null
          orgao_publico?: boolean | null
          pais_nascimento_codigo?: string | null
          pais_nascimento_descricao?: string | null
          pais_nascimento_id_pje?: number | null
          pode_usar_celular_mensagem?: boolean | null
          porte_codigo?: number | null
          porte_descricao?: string | null
          ramo_atividade?: string | null
          rg?: string | null
          sexo?: string | null
          situacao_cnpj_receita_descricao?: string | null
          situacao_cnpj_receita_id?: number | null
          situacao_cpf_receita_descricao?: string | null
          situacao_cpf_receita_id?: number | null
          situacao_pje?: string | null
          status_pje?: string | null
          tipo_documento?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pessoa_codigo_pje?: string | null
          tipo_pessoa_label_pje?: string | null
          tipo_pessoa_validacao_receita?: string | null
          uf_nascimento_descricao?: string | null
          uf_nascimento_id_pje?: number | null
          uf_nascimento_sigla?: string | null
          ultima_atualizacao_pje?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "enderecos"
            referencedColumns: ["id"]
          },
        ]
      }
      comunica_cnj: {
        Row: {
          advogado_id: number | null
          ativo: boolean | null
          codigo_classe: string | null
          created_at: string | null
          data_cancelamento: string | null
          data_disponibilizacao: string
          destinatarios: Json | null
          destinatarios_advogados: Json | null
          expediente_id: number | null
          hash: string
          id: number
          id_cnj: number
          link: string | null
          meio: Database["public"]["Enums"]["meio_comunicacao"]
          meio_completo: string | null
          metadados: Json | null
          motivo_cancelamento: string | null
          nome_classe: string | null
          nome_orgao: string | null
          numero_comunicacao: number | null
          numero_processo: string
          numero_processo_mascara: string | null
          orgao_id: number | null
          sigla_tribunal: string
          status: string | null
          texto: string | null
          tipo_comunicacao: string | null
          tipo_documento: string | null
          updated_at: string | null
        }
        Insert: {
          advogado_id?: number | null
          ativo?: boolean | null
          codigo_classe?: string | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_disponibilizacao: string
          destinatarios?: Json | null
          destinatarios_advogados?: Json | null
          expediente_id?: number | null
          hash: string
          id?: never
          id_cnj: number
          link?: string | null
          meio: Database["public"]["Enums"]["meio_comunicacao"]
          meio_completo?: string | null
          metadados?: Json | null
          motivo_cancelamento?: string | null
          nome_classe?: string | null
          nome_orgao?: string | null
          numero_comunicacao?: number | null
          numero_processo: string
          numero_processo_mascara?: string | null
          orgao_id?: number | null
          sigla_tribunal: string
          status?: string | null
          texto?: string | null
          tipo_comunicacao?: string | null
          tipo_documento?: string | null
          updated_at?: string | null
        }
        Update: {
          advogado_id?: number | null
          ativo?: boolean | null
          codigo_classe?: string | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_disponibilizacao?: string
          destinatarios?: Json | null
          destinatarios_advogados?: Json | null
          expediente_id?: number | null
          hash?: string
          id?: never
          id_cnj?: number
          link?: string | null
          meio?: Database["public"]["Enums"]["meio_comunicacao"]
          meio_completo?: string | null
          metadados?: Json | null
          motivo_cancelamento?: string | null
          nome_classe?: string | null
          nome_orgao?: string | null
          numero_comunicacao?: number | null
          numero_processo?: string
          numero_processo_mascara?: string | null
          orgao_id?: number | null
          sigla_tribunal?: string
          status?: string | null
          texto?: string | null
          tipo_comunicacao?: string | null
          tipo_documento?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunica_cnj_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunica_cnj_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: true
            referencedRelation: "expedientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunica_cnj_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: true
            referencedRelation: "expedientes_com_origem"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacao_bancaria: {
        Row: {
          created_at: string
          data_conciliacao: string
          diferenca_valor: number | null
          id: number
          lancamento_financeiro_id: number | null
          observacoes: string | null
          status: string
          transacao_importada_id: number
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data_conciliacao?: string
          diferenca_valor?: number | null
          id?: number
          lancamento_financeiro_id?: number | null
          observacoes?: string | null
          status: string
          transacao_importada_id: number
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          data_conciliacao?: string
          diferenca_valor?: number | null
          id?: number
          lancamento_financeiro_id?: number | null
          observacoes?: string | null
          status?: string
          transacao_importada_id?: number
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conciliacao_bancaria_lancamento_financeiro_id_fkey"
            columns: ["lancamento_financeiro_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacao_bancaria_transacao_importada_id_fkey"
            columns: ["transacao_importada_id"]
            isOneToOne: true
            referencedRelation: "transacoes_importadas"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacoes_bancarias: {
        Row: {
          conciliado_por: number | null
          created_at: string
          dados_adicionais: Json | null
          data_conciliacao: string | null
          id: number
          lancamento_financeiro_id: number | null
          observacoes: string | null
          score_similaridade: number | null
          status: Database["public"]["Enums"]["status_conciliacao"]
          tipo_conciliacao: string | null
          transacao_importada_id: number
          updated_at: string
        }
        Insert: {
          conciliado_por?: number | null
          created_at?: string
          dados_adicionais?: Json | null
          data_conciliacao?: string | null
          id?: never
          lancamento_financeiro_id?: number | null
          observacoes?: string | null
          score_similaridade?: number | null
          status?: Database["public"]["Enums"]["status_conciliacao"]
          tipo_conciliacao?: string | null
          transacao_importada_id: number
          updated_at?: string
        }
        Update: {
          conciliado_por?: number | null
          created_at?: string
          dados_adicionais?: Json | null
          data_conciliacao?: string | null
          id?: never
          lancamento_financeiro_id?: number | null
          observacoes?: string | null
          score_similaridade?: number | null
          status?: Database["public"]["Enums"]["status_conciliacao"]
          tipo_conciliacao?: string | null
          transacao_importada_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conciliacoes_bancarias_conciliado_por_fkey"
            columns: ["conciliado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_bancarias_lancamento_financeiro_id_fkey"
            columns: ["lancamento_financeiro_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_bancarias_transacao_importada_id_fkey"
            columns: ["transacao_importada_id"]
            isOneToOne: true
            referencedRelation: "transacoes_bancarias_importadas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string | null
          conta: string | null
          created_at: string
          created_by: number | null
          id: number
          nome: string
          saldo_atual: number
          saldo_inicial: number
          tipo: string | null
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          conta?: string | null
          created_at?: string
          created_by?: number | null
          id?: never
          nome: string
          saldo_atual?: number
          saldo_inicial?: number
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          conta?: string | null
          created_at?: string
          created_by?: number | null
          id?: never
          nome?: string
          saldo_atual?: number
          saldo_inicial?: number
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_partes: {
        Row: {
          contrato_id: number
          cpf_cnpj_snapshot: string | null
          created_at: string
          entidade_id: number
          id: number
          nome_snapshot: string | null
          ordem: number
          papel_contratual: Database["public"]["Enums"]["papel_contratual"]
          tipo_entidade: string
        }
        Insert: {
          contrato_id: number
          cpf_cnpj_snapshot?: string | null
          created_at?: string
          entidade_id: number
          id?: never
          nome_snapshot?: string | null
          ordem?: number
          papel_contratual: Database["public"]["Enums"]["papel_contratual"]
          tipo_entidade: string
        }
        Update: {
          contrato_id?: number
          cpf_cnpj_snapshot?: string | null
          created_at?: string
          entidade_id?: number
          id?: never
          nome_snapshot?: string | null
          ordem?: number
          papel_contratual?: Database["public"]["Enums"]["papel_contratual"]
          tipo_entidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_partes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_processos: {
        Row: {
          contrato_id: number
          created_at: string
          id: number
          processo_id: number
        }
        Insert: {
          contrato_id: number
          created_at?: string
          id?: never
          processo_id: number
        }
        Update: {
          contrato_id?: number
          created_at?: string
          id?: never
          processo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "contrato_processos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_processos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_processos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_processos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
        ]
      }
      contrato_status_historico: {
        Row: {
          changed_at: string
          changed_by: number | null
          contrato_id: number
          created_at: string
          from_status: Database["public"]["Enums"]["status_contrato"] | null
          id: number
          metadata: Json | null
          reason: string | null
          to_status: Database["public"]["Enums"]["status_contrato"]
        }
        Insert: {
          changed_at?: string
          changed_by?: number | null
          contrato_id: number
          created_at?: string
          from_status?: Database["public"]["Enums"]["status_contrato"] | null
          id?: never
          metadata?: Json | null
          reason?: string | null
          to_status: Database["public"]["Enums"]["status_contrato"]
        }
        Update: {
          changed_at?: string
          changed_by?: number | null
          contrato_id?: number
          created_at?: string
          from_status?: Database["public"]["Enums"]["status_contrato"] | null
          id?: never
          metadata?: Json | null
          reason?: string | null
          to_status?: Database["public"]["Enums"]["status_contrato"]
        }
        Relationships: [
          {
            foreignKeyName: "contrato_status_historico_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_status_historico_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_tags: {
        Row: {
          contrato_id: number
          created_at: string
          id: number
          tag_id: number
        }
        Insert: {
          contrato_id: number
          created_at?: string
          id?: never
          tag_id: number
        }
        Update: {
          contrato_id?: number
          created_at?: string
          id?: never
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "contrato_tags_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          cadastrado_em: string
          cliente_id: number
          created_at: string
          created_by: number | null
          dados_anteriores: Json | null
          id: number
          observacoes: string | null
          papel_cliente_no_contrato: Database["public"]["Enums"]["papel_contratual"]
          responsavel_id: number | null
          segmento_id: number | null
          status: Database["public"]["Enums"]["status_contrato"]
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"]
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          updated_at: string
        }
        Insert: {
          cadastrado_em?: string
          cliente_id: number
          created_at?: string
          created_by?: number | null
          dados_anteriores?: Json | null
          id?: never
          observacoes?: string | null
          papel_cliente_no_contrato: Database["public"]["Enums"]["papel_contratual"]
          responsavel_id?: number | null
          segmento_id?: number | null
          status?: Database["public"]["Enums"]["status_contrato"]
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"]
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string
        }
        Update: {
          cadastrado_em?: string
          cliente_id?: number
          created_at?: string
          created_by?: number | null
          dados_anteriores?: Json | null
          id?: never
          observacoes?: string | null
          papel_cliente_no_contrato?: Database["public"]["Enums"]["papel_contratual"]
          responsavel_id?: number | null
          segmento_id?: number | null
          status?: Database["public"]["Enums"]["status_contrato"]
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "contratos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_segmento_id_fkey"
            columns: ["segmento_id"]
            isOneToOne: false
            referencedRelation: "segmentos"
            referencedColumns: ["id"]
          },
        ]
      }
      credenciais: {
        Row: {
          active: boolean
          advogado_id: number
          created_at: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id: number
          senha: string
          tribunal: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          advogado_id: number
          created_at?: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          senha: string
          tribunal: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          advogado_id?: number
          created_at?: string
          grau?: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          senha?: string
          tribunal?: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credenciais_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          conteudo: Json
          created_at: string
          criado_por: number
          deleted_at: string | null
          descricao: string | null
          editado_em: string | null
          editado_por: number | null
          id: number
          pasta_id: number | null
          tags: string[] | null
          titulo: string
          updated_at: string
          versao: number
        }
        Insert: {
          conteudo?: Json
          created_at?: string
          criado_por: number
          deleted_at?: string | null
          descricao?: string | null
          editado_em?: string | null
          editado_por?: number | null
          id?: never
          pasta_id?: number | null
          tags?: string[] | null
          titulo: string
          updated_at?: string
          versao?: number
        }
        Update: {
          conteudo?: Json
          created_at?: string
          criado_por?: number
          deleted_at?: string | null
          descricao?: string | null
          editado_em?: string | null
          editado_por?: number | null
          id?: never
          pasta_id?: number | null
          tags?: string[] | null
          titulo?: string
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_editado_por_fkey"
            columns: ["editado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_compartilhados: {
        Row: {
          compartilhado_por: number
          created_at: string
          documento_id: number
          id: number
          permissao: string
          pode_deletar: boolean
          usuario_id: number
        }
        Insert: {
          compartilhado_por: number
          created_at?: string
          documento_id: number
          id?: never
          permissao: string
          pode_deletar?: boolean
          usuario_id: number
        }
        Update: {
          compartilhado_por?: number
          created_at?: string
          documento_id?: number
          id?: never
          permissao?: string
          pode_deletar?: boolean
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_compartilhados_compartilhado_por_fkey"
            columns: ["compartilhado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_compartilhados_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_compartilhados_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_uploads: {
        Row: {
          b2_key: string
          b2_url: string
          created_at: string
          criado_por: number
          documento_id: number
          id: number
          nome_arquivo: string
          tamanho_bytes: number
          tipo_media: string
          tipo_mime: string
        }
        Insert: {
          b2_key: string
          b2_url: string
          created_at?: string
          criado_por: number
          documento_id: number
          id?: never
          nome_arquivo: string
          tamanho_bytes: number
          tipo_media: string
          tipo_mime: string
        }
        Update: {
          b2_key?: string
          b2_url?: string
          created_at?: string
          criado_por?: number
          documento_id?: number
          id?: never
          nome_arquivo?: string
          tamanho_bytes?: number
          tipo_media?: string
          tipo_mime?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_uploads_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_uploads_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_versoes: {
        Row: {
          conteudo: Json
          created_at: string
          criado_por: number
          documento_id: number
          id: number
          titulo: string
          versao: number
        }
        Insert: {
          conteudo: Json
          created_at?: string
          criado_por: number
          documento_id: number
          id?: never
          titulo: string
          versao: number
        }
        Update: {
          conteudo?: Json
          created_at?: string
          criado_por?: number
          documento_id?: number
          id?: never
          titulo?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_versoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_versoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          entity_id: number
          entity_type: string
          id: number
          indexed_by: number | null
          metadata: Json | null
          parent_id: number | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          entity_id: number
          entity_type: string
          id?: never
          indexed_by?: number | null
          metadata?: Json | null
          parent_id?: number | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          entity_id?: number
          entity_type?: string
          id?: never
          indexed_by?: number | null
          metadata?: Json | null
          parent_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_indexed_by_fkey"
            columns: ["indexed_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      enderecos: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          cep: string | null
          classificacoes_endereco: Json | null
          complemento: string | null
          correspondencia: boolean | null
          created_at: string | null
          dados_pje_completo: Json | null
          data_alteracao_pje: string | null
          entidade_id: number
          entidade_tipo: string
          estado: string | null
          estado_descricao: string | null
          estado_id_pje: number | null
          estado_sigla: string | null
          grau: string | null
          id: number
          id_municipio_pje: number | null
          id_pje: number | null
          id_usuario_cadastrador_pje: number | null
          logradouro: string | null
          municipio: string | null
          municipio_ibge: string | null
          numero: string | null
          numero_processo: string | null
          pais: string | null
          pais_codigo: string | null
          pais_descricao: string | null
          pais_id_pje: number | null
          situacao: string | null
          trt: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          classificacoes_endereco?: Json | null
          complemento?: string | null
          correspondencia?: boolean | null
          created_at?: string | null
          dados_pje_completo?: Json | null
          data_alteracao_pje?: string | null
          entidade_id: number
          entidade_tipo: string
          estado?: string | null
          estado_descricao?: string | null
          estado_id_pje?: number | null
          estado_sigla?: string | null
          grau?: string | null
          id?: never
          id_municipio_pje?: number | null
          id_pje?: number | null
          id_usuario_cadastrador_pje?: number | null
          logradouro?: string | null
          municipio?: string | null
          municipio_ibge?: string | null
          numero?: string | null
          numero_processo?: string | null
          pais?: string | null
          pais_codigo?: string | null
          pais_descricao?: string | null
          pais_id_pje?: number | null
          situacao?: string | null
          trt?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          classificacoes_endereco?: Json | null
          complemento?: string | null
          correspondencia?: boolean | null
          created_at?: string | null
          dados_pje_completo?: Json | null
          data_alteracao_pje?: string | null
          entidade_id?: number
          entidade_tipo?: string
          estado?: string | null
          estado_descricao?: string | null
          estado_id_pje?: number | null
          estado_sigla?: string | null
          grau?: string | null
          id?: never
          id_municipio_pje?: number | null
          id_pje?: number | null
          id_usuario_cadastrador_pje?: number | null
          logradouro?: string | null
          municipio?: string | null
          municipio_ibge?: string | null
          numero?: string | null
          numero_processo?: string | null
          pais?: string | null
          pais_codigo?: string | null
          pais_descricao?: string | null
          pais_id_pje?: number | null
          situacao?: string | null
          trt?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expedientes: {
        Row: {
          advogado_id: number | null
          arquivo_bucket: string | null
          arquivo_key: string | null
          arquivo_nome: string | null
          arquivo_url: string | null
          baixado_em: string | null
          classe_judicial: string
          codigo_status_processo: string
          created_at: string
          dados_anteriores: Json | null
          data_arquivamento: string | null
          data_autuacao: string | null
          data_ciencia_parte: string | null
          data_criacao_expediente: string | null
          data_prazo_legal_parte: string | null
          descricao_arquivos: string | null
          descricao_orgao_julgador: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id: number
          id_documento: number | null
          id_pje: number
          juizo_digital: boolean
          justificativa_baixa: string | null
          nome_parte_autora: string
          nome_parte_re: string
          numero: number
          numero_processo: string
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_expediente"]
          prazo_vencido: boolean
          prioridade_processual: number
          processo_id: number | null
          protocolo_id: string | null
          qtde_parte_autora: number
          qtde_parte_re: number
          responsavel_id: number | null
          segredo_justica: boolean
          sigla_orgao_julgador: string | null
          tipo_expediente_id: number | null
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at: string
        }
        Insert: {
          advogado_id?: number | null
          arquivo_bucket?: string | null
          arquivo_key?: string | null
          arquivo_nome?: string | null
          arquivo_url?: string | null
          baixado_em?: string | null
          classe_judicial: string
          codigo_status_processo: string
          created_at?: string
          dados_anteriores?: Json | null
          data_arquivamento?: string | null
          data_autuacao?: string | null
          data_ciencia_parte?: string | null
          data_criacao_expediente?: string | null
          data_prazo_legal_parte?: string | null
          descricao_arquivos?: string | null
          descricao_orgao_julgador: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_documento?: number | null
          id_pje: number
          juizo_digital?: boolean
          justificativa_baixa?: string | null
          nome_parte_autora: string
          nome_parte_re: string
          numero: number
          numero_processo: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_expediente"]
          prazo_vencido?: boolean
          prioridade_processual?: number
          processo_id?: number | null
          protocolo_id?: string | null
          qtde_parte_autora?: number
          qtde_parte_re?: number
          responsavel_id?: number | null
          segredo_justica?: boolean
          sigla_orgao_julgador?: string | null
          tipo_expediente_id?: number | null
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Update: {
          advogado_id?: number | null
          arquivo_bucket?: string | null
          arquivo_key?: string | null
          arquivo_nome?: string | null
          arquivo_url?: string | null
          baixado_em?: string | null
          classe_judicial?: string
          codigo_status_processo?: string
          created_at?: string
          dados_anteriores?: Json | null
          data_arquivamento?: string | null
          data_autuacao?: string | null
          data_ciencia_parte?: string | null
          data_criacao_expediente?: string | null
          data_prazo_legal_parte?: string | null
          descricao_arquivos?: string | null
          descricao_orgao_julgador?: string
          grau?: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_documento?: number | null
          id_pje?: number
          juizo_digital?: boolean
          justificativa_baixa?: string | null
          nome_parte_autora?: string
          nome_parte_re?: string
          numero?: number
          numero_processo?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_expediente"]
          prazo_vencido?: boolean
          prioridade_processual?: number
          processo_id?: number | null
          protocolo_id?: string | null
          qtde_parte_autora?: number
          qtde_parte_re?: number
          responsavel_id?: number | null
          segredo_justica?: boolean
          sigla_orgao_julgador?: string | null
          tipo_expediente_id?: number | null
          trt?: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
          {
            foreignKeyName: "expedientes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_tipo_expediente_id_fkey"
            columns: ["tipo_expediente_id"]
            isOneToOne: false
            referencedRelation: "tipos_expedientes"
            referencedColumns: ["id"]
          },
        ]
      }
      folhas_pagamento: {
        Row: {
          ano_referencia: number
          created_at: string
          created_by: number | null
          data_geracao: string
          data_pagamento: string | null
          id: number
          mes_referencia: number
          observacoes: string | null
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          ano_referencia: number
          created_at?: string
          created_by?: number | null
          data_geracao?: string
          data_pagamento?: string | null
          id?: never
          mes_referencia: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          ano_referencia?: number
          created_at?: string
          created_by?: number | null
          data_geracao?: string
          data_pagamento?: string | null
          id?: never
          mes_referencia?: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "folhas_pagamento_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_folha_pagamento: {
        Row: {
          created_at: string
          folha_pagamento_id: number
          id: number
          lancamento_financeiro_id: number | null
          observacoes: string | null
          salario_id: number
          updated_at: string
          usuario_id: number
          valor_bruto: number
        }
        Insert: {
          created_at?: string
          folha_pagamento_id: number
          id?: never
          lancamento_financeiro_id?: number | null
          observacoes?: string | null
          salario_id: number
          updated_at?: string
          usuario_id: number
          valor_bruto: number
        }
        Update: {
          created_at?: string
          folha_pagamento_id?: number
          id?: never
          lancamento_financeiro_id?: number | null
          observacoes?: string | null
          salario_id?: number
          updated_at?: string
          usuario_id?: number
          valor_bruto?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_folha_pagamento_folha_pagamento_id_fkey"
            columns: ["folha_pagamento_id"]
            isOneToOne: false
            referencedRelation: "folhas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_folha_pagamento_lancamento_financeiro_id_fkey"
            columns: ["lancamento_financeiro_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_folha_pagamento_salario_id_fkey"
            columns: ["salario_id"]
            isOneToOne: false
            referencedRelation: "salarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_folha_pagamento_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          acordo_condenacao_id: number | null
          anexos: Json | null
          categoria: string | null
          centro_custo_id: number | null
          cliente_id: number | null
          conta_bancaria_id: number | null
          conta_contabil_id: number
          contrato_id: number | null
          created_at: string
          created_by: number | null
          dados_adicionais: Json | null
          data_competencia: string
          data_efetivacao: string | null
          data_lancamento: string
          data_vencimento: string | null
          descricao: string
          documento: string | null
          forma_pagamento: string | null
          frequencia_recorrencia: string | null
          id: number
          lancamento_origem_id: number | null
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_lancamento"]
          parcela_id: number | null
          recorrente: boolean
          status: Database["public"]["Enums"]["status_lancamento"]
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at: string
          usuario_id: number | null
          valor: number
        }
        Insert: {
          acordo_condenacao_id?: number | null
          anexos?: Json | null
          categoria?: string | null
          centro_custo_id?: number | null
          cliente_id?: number | null
          conta_bancaria_id?: number | null
          conta_contabil_id: number
          contrato_id?: number | null
          created_at?: string
          created_by?: number | null
          dados_adicionais?: Json | null
          data_competencia: string
          data_efetivacao?: string | null
          data_lancamento?: string
          data_vencimento?: string | null
          descricao: string
          documento?: string | null
          forma_pagamento?: string | null
          frequencia_recorrencia?: string | null
          id?: never
          lancamento_origem_id?: number | null
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_lancamento"]
          parcela_id?: number | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["status_lancamento"]
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at?: string
          usuario_id?: number | null
          valor: number
        }
        Update: {
          acordo_condenacao_id?: number | null
          anexos?: Json | null
          categoria?: string | null
          centro_custo_id?: number | null
          cliente_id?: number | null
          conta_bancaria_id?: number | null
          conta_contabil_id?: number
          contrato_id?: number | null
          created_at?: string
          created_by?: number | null
          dados_adicionais?: Json | null
          data_competencia?: string
          data_efetivacao?: string | null
          data_lancamento?: string
          data_vencimento?: string | null
          descricao?: string
          documento?: string | null
          forma_pagamento?: string | null
          frequencia_recorrencia?: string | null
          id?: never
          lancamento_origem_id?: number | null
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_lancamento"]
          parcela_id?: number | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["status_lancamento"]
          tipo?: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at?: string
          usuario_id?: number | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_acordo_condenacao_id_fkey"
            columns: ["acordo_condenacao_id"]
            isOneToOne: false
            referencedRelation: "acordos_condenacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_conta_contabil_id_fkey"
            columns: ["conta_contabil_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_lancamento_origem_id_fkey"
            columns: ["lancamento_origem_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "repasses_pendentes"
            referencedColumns: ["parcela_id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      layouts_painel: {
        Row: {
          configuracao_layout: Json
          created_at: string
          id: number
          updated_at: string
          usuario_id: number | null
        }
        Insert: {
          configuracao_layout?: Json
          created_at?: string
          id?: never
          updated_at?: string
          usuario_id?: number | null
        }
        Update: {
          configuracao_layout?: Json
          created_at?: string
          id?: never
          updated_at?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "layouts_painel_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      links_personalizados: {
        Row: {
          created_at: string
          icone: string | null
          id: number
          ordem: number | null
          titulo: string
          url: string
          usuario_id: number | null
        }
        Insert: {
          created_at?: string
          icone?: string | null
          id?: never
          ordem?: number | null
          titulo: string
          url: string
          usuario_id?: number | null
        }
        Update: {
          created_at?: string
          icone?: string | null
          id?: never
          ordem?: number | null
          titulo?: string
          url?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "links_personalizados_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      locks: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          lock_id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          key: string
          lock_id: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          lock_id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      logs_alteracao: {
        Row: {
          created_at: string
          dados_evento: Json | null
          entidade_id: number
          id: number
          responsavel_anterior_id: number | null
          responsavel_novo_id: number | null
          tipo_entidade: string
          tipo_evento: string
          usuario_que_executou_id: number
        }
        Insert: {
          created_at?: string
          dados_evento?: Json | null
          entidade_id: number
          id?: never
          responsavel_anterior_id?: number | null
          responsavel_novo_id?: number | null
          tipo_entidade: string
          tipo_evento: string
          usuario_que_executou_id: number
        }
        Update: {
          created_at?: string
          dados_evento?: Json | null
          entidade_id?: number
          id?: never
          responsavel_anterior_id?: number | null
          responsavel_novo_id?: number | null
          tipo_entidade?: string
          tipo_evento?: string
          usuario_que_executou_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "logs_alteracao_responsavel_anterior_id_fkey"
            columns: ["responsavel_anterior_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_alteracao_responsavel_novo_id_fkey"
            columns: ["responsavel_novo_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_alteracao_usuario_que_executou_id_fkey"
            columns: ["usuario_que_executou_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_audit_log: {
        Row: {
          arguments: Json | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: number
          ip_address: string | null
          result: Json | null
          success: boolean
          tool_name: string
          user_agent: string | null
          usuario_id: number | null
        }
        Insert: {
          arguments?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          ip_address?: string | null
          result?: Json | null
          success?: boolean
          tool_name: string
          user_agent?: string | null
          usuario_id?: number | null
        }
        Update: {
          arguments?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          ip_address?: string | null
          result?: Json | null
          success?: boolean
          tool_name?: string
          user_agent?: string | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mcp_audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_quotas: {
        Row: {
          calls_month: number
          calls_today: number
          created_at: string
          id: number
          last_call_at: string | null
          quota_reset_at: string | null
          tier: string
          updated_at: string
          usuario_id: number | null
        }
        Insert: {
          calls_month?: number
          calls_today?: number
          created_at?: string
          id?: number
          last_call_at?: string | null
          quota_reset_at?: string | null
          tier?: string
          updated_at?: string
          usuario_id?: number | null
        }
        Update: {
          calls_month?: number
          calls_today?: number
          created_at?: string
          id?: number
          last_call_at?: string | null
          quota_reset_at?: string | null
          tier?: string
          updated_at?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mcp_quotas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      membros_sala_chat: {
        Row: {
          deleted_at: string | null
          id: number
          is_active: boolean
          is_muted: boolean
          joined_at: string
          sala_id: number
          usuario_id: number
        }
        Insert: {
          deleted_at?: string | null
          id?: number
          is_active?: boolean
          is_muted?: boolean
          joined_at?: string
          sala_id: number
          usuario_id: number
        }
        Update: {
          deleted_at?: string | null
          id?: number
          is_active?: boolean
          is_muted?: boolean
          joined_at?: string
          sala_id?: number
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "membros_sala_chat_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas_chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_sala_chat_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_chat: {
        Row: {
          conteudo: string
          created_at: string
          data: Json | null
          deleted_at: string | null
          id: number
          sala_id: number
          status: string | null
          tipo: string
          updated_at: string
          usuario_id: number
        }
        Insert: {
          conteudo: string
          created_at?: string
          data?: Json | null
          deleted_at?: string | null
          id?: never
          sala_id: number
          status?: string | null
          tipo: string
          updated_at?: string
          usuario_id: number
        }
        Update: {
          conteudo?: string
          created_at?: string
          data?: Json | null
          deleted_at?: string | null
          id?: never
          sala_id?: number
          status?: string | null
          tipo?: string
          updated_at?: string
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas_chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notas: {
        Row: {
          conteudo: string | null
          created_at: string
          etiquetas: Json | null
          id: number
          titulo: string
          updated_at: string
          usuario_id: number | null
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          etiquetas?: Json | null
          id?: never
          titulo: string
          updated_at?: string
          usuario_id?: number | null
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          etiquetas?: Json | null
          id?: never
          titulo?: string
          updated_at?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          centro_custo_id: number | null
          conta_contabil_id: number
          created_at: string
          id: number
          mes: number | null
          observacoes: string | null
          orcamento_id: number
          updated_at: string
          valor_orcado: number
        }
        Insert: {
          centro_custo_id?: number | null
          conta_contabil_id: number
          created_at?: string
          id?: never
          mes?: number | null
          observacoes?: string | null
          orcamento_id: number
          updated_at?: string
          valor_orcado: number
        }
        Update: {
          centro_custo_id?: number | null
          conta_contabil_id?: number
          created_at?: string
          id?: never
          mes?: number | null
          observacoes?: string | null
          orcamento_id?: number
          updated_at?: string
          valor_orcado?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_conta_contabil_id_fkey"
            columns: ["conta_contabil_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "v_orcamento_vs_realizado"
            referencedColumns: ["orcamento_id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          ano: number
          aprovado_em: string | null
          aprovado_por: number | null
          created_at: string
          created_by: number | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          encerrado_em: string | null
          encerrado_por: number | null
          id: number
          iniciado_em: string | null
          iniciado_por: number | null
          nome: string
          observacoes: string | null
          periodo: Database["public"]["Enums"]["periodo_orcamento"]
          status: Database["public"]["Enums"]["status_orcamento"]
          updated_at: string
        }
        Insert: {
          ano: number
          aprovado_em?: string | null
          aprovado_por?: number | null
          created_at?: string
          created_by?: number | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          encerrado_em?: string | null
          encerrado_por?: number | null
          id?: never
          iniciado_em?: string | null
          iniciado_por?: number | null
          nome: string
          observacoes?: string | null
          periodo: Database["public"]["Enums"]["periodo_orcamento"]
          status?: Database["public"]["Enums"]["status_orcamento"]
          updated_at?: string
        }
        Update: {
          ano?: number
          aprovado_em?: string | null
          aprovado_por?: number | null
          created_at?: string
          created_by?: number | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          encerrado_em?: string | null
          encerrado_por?: number | null
          id?: never
          iniciado_em?: string | null
          iniciado_por?: number | null
          nome?: string
          observacoes?: string | null
          periodo?: Database["public"]["Enums"]["periodo_orcamento"]
          status?: Database["public"]["Enums"]["status_orcamento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_encerrado_por_fkey"
            columns: ["encerrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_iniciado_por_fkey"
            columns: ["iniciado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          is_landlord: boolean
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_landlord?: boolean
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_landlord?: boolean
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      orgao_julgador: {
        Row: {
          ativo: boolean
          cejusc: boolean
          codigo_serventia_cnj: number
          created_at: string
          descricao: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id: number
          id_pje: number
          novo_orgao_julgador: boolean
          posto_avancado: boolean
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cejusc?: boolean
          codigo_serventia_cnj?: number
          created_at?: string
          descricao: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pje: number
          novo_orgao_julgador?: boolean
          posto_avancado?: boolean
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cejusc?: boolean
          codigo_serventia_cnj?: number
          created_at?: string
          descricao?: string
          grau?: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pje?: number
          novo_orgao_julgador?: boolean
          posto_avancado?: boolean
          trt?: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Relationships: []
      }
      orgaos_tribunais: {
        Row: {
          ativo: boolean
          createdAt: string
          id: string
          metadados: Json | null
          nome: string
          orgaoIdCNJ: number
          tipo: string | null
          tribunalId: string
          updatedAt: string
        }
        Insert: {
          ativo?: boolean
          createdAt?: string
          id: string
          metadados?: Json | null
          nome: string
          orgaoIdCNJ: number
          tipo?: string | null
          tribunalId: string
          updatedAt?: string
        }
        Update: {
          ativo?: boolean
          createdAt?: string
          id?: string
          metadados?: Json | null
          nome?: string
          orgaoIdCNJ?: number
          tipo?: string | null
          tribunalId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "TribunalOrgao_tribunalId_fkey"
            columns: ["tribunalId"]
            isOneToOne: false
            referencedRelation: "tribunais"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas: {
        Row: {
          acordo_condenacao_id: number
          arquivo_comprovante_repasse: string | null
          arquivo_declaracao_prestacao_contas: string | null
          created_at: string | null
          dados_pagamento: Json | null
          data_declaracao_anexada: string | null
          data_efetivacao: string | null
          data_repasse: string | null
          data_vencimento: string
          editado_manualmente: boolean | null
          forma_pagamento: string
          honorarios_contratuais: number | null
          honorarios_sucumbenciais: number | null
          id: number
          numero_parcela: number
          status: string
          status_repasse: string | null
          updated_at: string | null
          usuario_repasse_id: number | null
          valor_bruto_credito_principal: number
          valor_repasse_cliente: number | null
        }
        Insert: {
          acordo_condenacao_id: number
          arquivo_comprovante_repasse?: string | null
          arquivo_declaracao_prestacao_contas?: string | null
          created_at?: string | null
          dados_pagamento?: Json | null
          data_declaracao_anexada?: string | null
          data_efetivacao?: string | null
          data_repasse?: string | null
          data_vencimento: string
          editado_manualmente?: boolean | null
          forma_pagamento: string
          honorarios_contratuais?: number | null
          honorarios_sucumbenciais?: number | null
          id?: never
          numero_parcela: number
          status?: string
          status_repasse?: string | null
          updated_at?: string | null
          usuario_repasse_id?: number | null
          valor_bruto_credito_principal: number
          valor_repasse_cliente?: number | null
        }
        Update: {
          acordo_condenacao_id?: number
          arquivo_comprovante_repasse?: string | null
          arquivo_declaracao_prestacao_contas?: string | null
          created_at?: string | null
          dados_pagamento?: Json | null
          data_declaracao_anexada?: string | null
          data_efetivacao?: string | null
          data_repasse?: string | null
          data_vencimento?: string
          editado_manualmente?: boolean | null
          forma_pagamento?: string
          honorarios_contratuais?: number | null
          honorarios_sucumbenciais?: number | null
          id?: never
          numero_parcela?: number
          status?: string
          status_repasse?: string | null
          updated_at?: string | null
          usuario_repasse_id?: number | null
          valor_bruto_credito_principal?: number
          valor_repasse_cliente?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_acordo_condenacao_id_fkey"
            columns: ["acordo_condenacao_id"]
            isOneToOne: false
            referencedRelation: "acordos_condenacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcelas_usuario_repasse_id_fkey"
            columns: ["usuario_repasse_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      partes_contrarias: {
        Row: {
          ativo: boolean
          autoridade: boolean | null
          cnpj: string | null
          cpf: string | null
          cpf_responsavel: string | null
          created_at: string
          created_by: number | null
          dados_anteriores: Json | null
          data_abertura: string | null
          data_fim_atividade: string | null
          data_nascimento: string | null
          ddd_celular: string | null
          ddd_comercial: string | null
          ddd_residencial: string | null
          ds_prazo_expediente_automatico: string | null
          ds_tipo_pessoa: string | null
          emails: Json | null
          endereco_id: number | null
          escolaridade_codigo: number | null
          estado_civil: Database["public"]["Enums"]["estado_civil"] | null
          genero: Database["public"]["Enums"]["genero_usuario"] | null
          id: number
          inscricao_estadual: string | null
          login_pje: string | null
          nacionalidade: string | null
          naturalidade_estado_id_pje: number | null
          naturalidade_estado_sigla: string | null
          naturalidade_id_pje: number | null
          naturalidade_municipio: string | null
          nome: string
          nome_genitora: string | null
          nome_social_fantasia: string | null
          numero_celular: string | null
          numero_comercial: string | null
          numero_residencial: string | null
          observacoes: string | null
          oficial: boolean | null
          orgao_publico: boolean | null
          pais_nascimento_codigo: string | null
          pais_nascimento_descricao: string | null
          pais_nascimento_id_pje: number | null
          pode_usar_celular_mensagem: boolean | null
          porte_codigo: number | null
          porte_descricao: string | null
          ramo_atividade: string | null
          rg: string | null
          sexo: string | null
          situacao_cnpj_receita_descricao: string | null
          situacao_cnpj_receita_id: number | null
          situacao_cpf_receita_descricao: string | null
          situacao_cpf_receita_id: number | null
          situacao_pje: string | null
          status_pje: string | null
          tipo_documento: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pessoa_codigo_pje: string | null
          tipo_pessoa_label_pje: string | null
          tipo_pessoa_validacao_receita: string | null
          uf_nascimento_descricao: string | null
          uf_nascimento_id_pje: number | null
          uf_nascimento_sigla: string | null
          ultima_atualizacao_pje: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          autoridade?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          created_by?: number | null
          dados_anteriores?: Json | null
          data_abertura?: string | null
          data_fim_atividade?: string | null
          data_nascimento?: string | null
          ddd_celular?: string | null
          ddd_comercial?: string | null
          ddd_residencial?: string | null
          ds_prazo_expediente_automatico?: string | null
          ds_tipo_pessoa?: string | null
          emails?: Json | null
          endereco_id?: number | null
          escolaridade_codigo?: number | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id?: never
          inscricao_estadual?: string | null
          login_pje?: string | null
          nacionalidade?: string | null
          naturalidade_estado_id_pje?: number | null
          naturalidade_estado_sigla?: string | null
          naturalidade_id_pje?: number | null
          naturalidade_municipio?: string | null
          nome: string
          nome_genitora?: string | null
          nome_social_fantasia?: string | null
          numero_celular?: string | null
          numero_comercial?: string | null
          numero_residencial?: string | null
          observacoes?: string | null
          oficial?: boolean | null
          orgao_publico?: boolean | null
          pais_nascimento_codigo?: string | null
          pais_nascimento_descricao?: string | null
          pais_nascimento_id_pje?: number | null
          pode_usar_celular_mensagem?: boolean | null
          porte_codigo?: number | null
          porte_descricao?: string | null
          ramo_atividade?: string | null
          rg?: string | null
          sexo?: string | null
          situacao_cnpj_receita_descricao?: string | null
          situacao_cnpj_receita_id?: number | null
          situacao_cpf_receita_descricao?: string | null
          situacao_cpf_receita_id?: number | null
          situacao_pje?: string | null
          status_pje?: string | null
          tipo_documento?: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pessoa_codigo_pje?: string | null
          tipo_pessoa_label_pje?: string | null
          tipo_pessoa_validacao_receita?: string | null
          uf_nascimento_descricao?: string | null
          uf_nascimento_id_pje?: number | null
          uf_nascimento_sigla?: string | null
          ultima_atualizacao_pje?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          autoridade?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          created_by?: number | null
          dados_anteriores?: Json | null
          data_abertura?: string | null
          data_fim_atividade?: string | null
          data_nascimento?: string | null
          ddd_celular?: string | null
          ddd_comercial?: string | null
          ddd_residencial?: string | null
          ds_prazo_expediente_automatico?: string | null
          ds_tipo_pessoa?: string | null
          emails?: Json | null
          endereco_id?: number | null
          escolaridade_codigo?: number | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id?: never
          inscricao_estadual?: string | null
          login_pje?: string | null
          nacionalidade?: string | null
          naturalidade_estado_id_pje?: number | null
          naturalidade_estado_sigla?: string | null
          naturalidade_id_pje?: number | null
          naturalidade_municipio?: string | null
          nome?: string
          nome_genitora?: string | null
          nome_social_fantasia?: string | null
          numero_celular?: string | null
          numero_comercial?: string | null
          numero_residencial?: string | null
          observacoes?: string | null
          oficial?: boolean | null
          orgao_publico?: boolean | null
          pais_nascimento_codigo?: string | null
          pais_nascimento_descricao?: string | null
          pais_nascimento_id_pje?: number | null
          pode_usar_celular_mensagem?: boolean | null
          porte_codigo?: number | null
          porte_descricao?: string | null
          ramo_atividade?: string | null
          rg?: string | null
          sexo?: string | null
          situacao_cnpj_receita_descricao?: string | null
          situacao_cnpj_receita_id?: number | null
          situacao_cpf_receita_descricao?: string | null
          situacao_cpf_receita_id?: number | null
          situacao_pje?: string | null
          status_pje?: string | null
          tipo_documento?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pessoa_codigo_pje?: string | null
          tipo_pessoa_label_pje?: string | null
          tipo_pessoa_validacao_receita?: string | null
          uf_nascimento_descricao?: string | null
          uf_nascimento_id_pje?: number | null
          uf_nascimento_sigla?: string | null
          ultima_atualizacao_pje?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partes_contrarias_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partes_contrarias_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "enderecos"
            referencedColumns: ["id"]
          },
        ]
      }
      pastas: {
        Row: {
          cor: string | null
          created_at: string
          criado_por: number
          deleted_at: string | null
          descricao: string | null
          icone: string | null
          id: number
          nome: string
          pasta_pai_id: number | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          criado_por: number
          deleted_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: never
          nome: string
          pasta_pai_id?: number | null
          tipo: string
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          criado_por?: number
          deleted_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: never
          nome?: string
          pasta_pai_id?: number | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pastas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastas_pasta_pai_id_fkey"
            columns: ["pasta_pai_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes: {
        Row: {
          created_at: string | null
          id: number
          operacao: string
          permitido: boolean | null
          recurso: string
          updated_at: string | null
          usuario_id: number
        }
        Insert: {
          created_at?: string | null
          id?: never
          operacao: string
          permitido?: boolean | null
          recurso: string
          updated_at?: string | null
          usuario_id: number
        }
        Update: {
          created_at?: string | null
          id?: never
          operacao?: string
          permitido?: boolean | null
          recurso?: string
          updated_at?: string | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas: {
        Row: {
          aceita_lancamento: boolean
          ativo: boolean
          codigo: string
          conta_pai_id: number | null
          created_at: string
          created_by: number | null
          descricao: string | null
          id: number
          natureza: Database["public"]["Enums"]["natureza_conta"]
          nivel: number
          nome: string
          ordem_exibicao: number | null
          tipo_conta: Database["public"]["Enums"]["tipo_conta_contabil"]
          updated_at: string
        }
        Insert: {
          aceita_lancamento?: boolean
          ativo?: boolean
          codigo: string
          conta_pai_id?: number | null
          created_at?: string
          created_by?: number | null
          descricao?: string | null
          id?: never
          natureza: Database["public"]["Enums"]["natureza_conta"]
          nivel?: number
          nome: string
          ordem_exibicao?: number | null
          tipo_conta: Database["public"]["Enums"]["tipo_conta_contabil"]
          updated_at?: string
        }
        Update: {
          aceita_lancamento?: boolean
          ativo?: boolean
          codigo?: string
          conta_pai_id?: number | null
          created_at?: string
          created_by?: number | null
          descricao?: string | null
          id?: never
          natureza?: Database["public"]["Enums"]["natureza_conta"]
          nivel?: number
          nome?: string
          ordem_exibicao?: number | null
          tipo_conta?: Database["public"]["Enums"]["tipo_conta_contabil"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_conta_pai_id_fkey"
            columns: ["conta_pai_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_contas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      processo_partes: {
        Row: {
          autoridade: boolean | null
          created_at: string | null
          dados_pje_completo: Json | null
          endereco_desconhecido: boolean | null
          entidade_id: number
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id: number
          id_pessoa_pje: number | null
          id_pje: number
          id_tipo_parte: number | null
          numero_processo: string | null
          ordem: number | null
          polo: string
          principal: boolean | null
          processo_id: number
          situacao_pje: string | null
          status_pje: string | null
          tipo_entidade: string
          tipo_parte: string
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          ultima_atualizacao_pje: string | null
          updated_at: string | null
        }
        Insert: {
          autoridade?: boolean | null
          created_at?: string | null
          dados_pje_completo?: Json | null
          endereco_desconhecido?: boolean | null
          entidade_id: number
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pessoa_pje?: number | null
          id_pje: number
          id_tipo_parte?: number | null
          numero_processo?: string | null
          ordem?: number | null
          polo: string
          principal?: boolean | null
          processo_id: number
          situacao_pje?: string | null
          status_pje?: string | null
          tipo_entidade: string
          tipo_parte: string
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          ultima_atualizacao_pje?: string | null
          updated_at?: string | null
        }
        Update: {
          autoridade?: boolean | null
          created_at?: string | null
          dados_pje_completo?: Json | null
          endereco_desconhecido?: boolean | null
          entidade_id?: number
          grau?: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pessoa_pje?: number | null
          id_pje?: number
          id_tipo_parte?: number | null
          numero_processo?: string | null
          ordem?: number | null
          polo?: string
          principal?: boolean | null
          processo_id?: number
          situacao_pje?: string | null
          status_pje?: string | null
          tipo_entidade?: string
          tipo_parte?: string
          trt?: Database["public"]["Enums"]["codigo_tribunal"]
          ultima_atualizacao_pje?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processo_partes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_partes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_partes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
        ]
      }
      processo_tags: {
        Row: {
          created_at: string
          id: number
          processo_id: number
          tag_id: number
        }
        Insert: {
          created_at?: string
          id?: never
          processo_id: number
          tag_id: number
        }
        Update: {
          created_at?: string
          id?: never
          processo_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "processo_tags_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_tags_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_tags_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
          {
            foreignKeyName: "processo_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_super_admin: boolean
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      representantes: {
        Row: {
          cpf: string
          created_at: string | null
          dados_anteriores: Json | null
          ddd_celular: string | null
          ddd_comercial: string | null
          ddd_residencial: string | null
          email: string | null
          emails: Json | null
          endereco_id: number | null
          id: number
          nome: string
          numero_celular: string | null
          numero_comercial: string | null
          numero_residencial: string | null
          oabs: Json | null
          sexo: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          cpf: string
          created_at?: string | null
          dados_anteriores?: Json | null
          ddd_celular?: string | null
          ddd_comercial?: string | null
          ddd_residencial?: string | null
          email?: string | null
          emails?: Json | null
          endereco_id?: number | null
          id?: never
          nome: string
          numero_celular?: string | null
          numero_comercial?: string | null
          numero_residencial?: string | null
          oabs?: Json | null
          sexo?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          ddd_celular?: string | null
          ddd_comercial?: string | null
          ddd_residencial?: string | null
          email?: string | null
          emails?: Json | null
          endereco_id?: number | null
          id?: never
          nome?: string
          numero_celular?: string | null
          numero_comercial?: string | null
          numero_residencial?: string | null
          oabs?: Json | null
          sexo?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representantes_new_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "enderecos"
            referencedColumns: ["id"]
          },
        ]
      }
      representantes_id_mapping: {
        Row: {
          cpf: string
          new_id: number
          old_id: number
        }
        Insert: {
          cpf: string
          new_id: number
          old_id: number
        }
        Update: {
          cpf?: string
          new_id?: number
          old_id?: number
        }
        Relationships: []
      }
      sala_audiencia: {
        Row: {
          created_at: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id: number
          id_pje: number | null
          nome: string
          orgao_julgador_id: number
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pje?: number | null
          nome: string
          orgao_julgador_id: number
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          grau?: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pje?: number | null
          nome?: string
          orgao_julgador_id?: number
          trt?: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sala_audiencia_orgao_julgador_id_fkey"
            columns: ["orgao_julgador_id"]
            isOneToOne: false
            referencedRelation: "orgao_julgador"
            referencedColumns: ["id"]
          },
        ]
      }
      salarios: {
        Row: {
          ativo: boolean
          cargo_id: number | null
          created_at: string
          created_by: number | null
          data_fim_vigencia: string | null
          data_inicio_vigencia: string
          id: number
          observacoes: string | null
          salario_bruto: number
          updated_at: string
          usuario_id: number
        }
        Insert: {
          ativo?: boolean
          cargo_id?: number | null
          created_at?: string
          created_by?: number | null
          data_fim_vigencia?: string | null
          data_inicio_vigencia: string
          id?: never
          observacoes?: string | null
          salario_bruto: number
          updated_at?: string
          usuario_id: number
        }
        Update: {
          ativo?: boolean
          cargo_id?: number | null
          created_at?: string
          created_by?: number | null
          data_fim_vigencia?: string | null
          data_inicio_vigencia?: string
          id?: never
          observacoes?: string | null
          salario_bruto?: number
          updated_at?: string
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "salarios_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      salas_chat: {
        Row: {
          created_at: string
          criado_por: number
          documento_id: number | null
          id: number
          is_archive: boolean
          nome: string
          participante_id: number | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: number
          documento_id?: number | null
          id?: never
          is_archive?: boolean
          nome: string
          participante_id?: number | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: number
          documento_id?: number | null
          id?: never
          is_archive?: boolean
          nome?: string
          participante_id?: number | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salas_chat_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salas_chat_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salas_chat_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      segmentos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: number
          nome: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: never
          nome: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: never
          nome?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          cor: string | null
          created_at: string
          id: number
          nome: string
          slug: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: never
          nome: string
          slug: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: never
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          created_at: string
          id: string
          label: string
          priority: string
          status: string
          title: string
          updated_at: string
          usuario_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          usuario_id: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          categoria: string | null
          conteudo: Json
          created_at: string
          criado_por: number
          descricao: string | null
          id: number
          thumbnail_url: string | null
          titulo: string
          updated_at: string
          uso_count: number
          visibilidade: string
        }
        Insert: {
          categoria?: string | null
          conteudo?: Json
          created_at?: string
          criado_por: number
          descricao?: string | null
          id?: never
          thumbnail_url?: string | null
          titulo: string
          updated_at?: string
          uso_count?: number
          visibilidade: string
        }
        Update: {
          categoria?: string | null
          conteudo?: Json
          created_at?: string
          criado_por?: number
          descricao?: string | null
          id?: never
          thumbnail_url?: string | null
          titulo?: string
          updated_at?: string
          uso_count?: number
          visibilidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      terceiros: {
        Row: {
          ativo: boolean | null
          autoridade: boolean | null
          cnpj: string | null
          cpf: string | null
          cpf_responsavel: string | null
          created_at: string | null
          dados_anteriores: Json | null
          data_abertura: string | null
          data_fim_atividade: string | null
          data_nascimento: string | null
          ddd_celular: string | null
          ddd_comercial: string | null
          ddd_residencial: string | null
          ds_prazo_expediente_automatico: string | null
          ds_tipo_pessoa: string | null
          emails: Json | null
          endereco_desconhecido: boolean | null
          endereco_id: number | null
          escolaridade_codigo: number | null
          estado_civil: Database["public"]["Enums"]["estado_civil"] | null
          genero: Database["public"]["Enums"]["genero_usuario"] | null
          id: number
          id_tipo_parte: number | null
          inscricao_estadual: string | null
          login_pje: string | null
          nacionalidade: string | null
          naturalidade_estado_id_pje: number | null
          naturalidade_estado_sigla: string | null
          naturalidade_id_pje: number | null
          naturalidade_municipio: string | null
          nome: string
          nome_fantasia: string | null
          nome_genitora: string | null
          numero_celular: string | null
          numero_comercial: string | null
          numero_residencial: string | null
          observacoes: string | null
          oficial: boolean | null
          ordem: number | null
          orgao_publico: boolean | null
          pais_nascimento_codigo: string | null
          pais_nascimento_descricao: string | null
          pais_nascimento_id_pje: number | null
          pode_usar_celular_mensagem: boolean | null
          polo: string
          porte_codigo: number | null
          porte_descricao: string | null
          principal: boolean | null
          ramo_atividade: string | null
          rg: string | null
          sexo: string | null
          situacao_cnpj_receita_descricao: string | null
          situacao_cnpj_receita_id: number | null
          situacao_cpf_receita_descricao: string | null
          situacao_cpf_receita_id: number | null
          situacao_pje: string | null
          status_pje: string | null
          tipo_documento: string | null
          tipo_parte: string
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pessoa_codigo_pje: string | null
          tipo_pessoa_label_pje: string | null
          tipo_pessoa_validacao_receita: string | null
          uf_nascimento_descricao: string | null
          uf_nascimento_id_pje: number | null
          uf_nascimento_sigla: string | null
          ultima_atualizacao_pje: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          autoridade?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string | null
          dados_anteriores?: Json | null
          data_abertura?: string | null
          data_fim_atividade?: string | null
          data_nascimento?: string | null
          ddd_celular?: string | null
          ddd_comercial?: string | null
          ddd_residencial?: string | null
          ds_prazo_expediente_automatico?: string | null
          ds_tipo_pessoa?: string | null
          emails?: Json | null
          endereco_desconhecido?: boolean | null
          endereco_id?: number | null
          escolaridade_codigo?: number | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id?: never
          id_tipo_parte?: number | null
          inscricao_estadual?: string | null
          login_pje?: string | null
          nacionalidade?: string | null
          naturalidade_estado_id_pje?: number | null
          naturalidade_estado_sigla?: string | null
          naturalidade_id_pje?: number | null
          naturalidade_municipio?: string | null
          nome: string
          nome_fantasia?: string | null
          nome_genitora?: string | null
          numero_celular?: string | null
          numero_comercial?: string | null
          numero_residencial?: string | null
          observacoes?: string | null
          oficial?: boolean | null
          ordem?: number | null
          orgao_publico?: boolean | null
          pais_nascimento_codigo?: string | null
          pais_nascimento_descricao?: string | null
          pais_nascimento_id_pje?: number | null
          pode_usar_celular_mensagem?: boolean | null
          polo: string
          porte_codigo?: number | null
          porte_descricao?: string | null
          principal?: boolean | null
          ramo_atividade?: string | null
          rg?: string | null
          sexo?: string | null
          situacao_cnpj_receita_descricao?: string | null
          situacao_cnpj_receita_id?: number | null
          situacao_cpf_receita_descricao?: string | null
          situacao_cpf_receita_id?: number | null
          situacao_pje?: string | null
          status_pje?: string | null
          tipo_documento?: string | null
          tipo_parte: string
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pessoa_codigo_pje?: string | null
          tipo_pessoa_label_pje?: string | null
          tipo_pessoa_validacao_receita?: string | null
          uf_nascimento_descricao?: string | null
          uf_nascimento_id_pje?: number | null
          uf_nascimento_sigla?: string | null
          ultima_atualizacao_pje?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          autoridade?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string | null
          dados_anteriores?: Json | null
          data_abertura?: string | null
          data_fim_atividade?: string | null
          data_nascimento?: string | null
          ddd_celular?: string | null
          ddd_comercial?: string | null
          ddd_residencial?: string | null
          ds_prazo_expediente_automatico?: string | null
          ds_tipo_pessoa?: string | null
          emails?: Json | null
          endereco_desconhecido?: boolean | null
          endereco_id?: number | null
          escolaridade_codigo?: number | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id?: never
          id_tipo_parte?: number | null
          inscricao_estadual?: string | null
          login_pje?: string | null
          nacionalidade?: string | null
          naturalidade_estado_id_pje?: number | null
          naturalidade_estado_sigla?: string | null
          naturalidade_id_pje?: number | null
          naturalidade_municipio?: string | null
          nome?: string
          nome_fantasia?: string | null
          nome_genitora?: string | null
          numero_celular?: string | null
          numero_comercial?: string | null
          numero_residencial?: string | null
          observacoes?: string | null
          oficial?: boolean | null
          ordem?: number | null
          orgao_publico?: boolean | null
          pais_nascimento_codigo?: string | null
          pais_nascimento_descricao?: string | null
          pais_nascimento_id_pje?: number | null
          pode_usar_celular_mensagem?: boolean | null
          polo?: string
          porte_codigo?: number | null
          porte_descricao?: string | null
          principal?: boolean | null
          ramo_atividade?: string | null
          rg?: string | null
          sexo?: string | null
          situacao_cnpj_receita_descricao?: string | null
          situacao_cnpj_receita_id?: number | null
          situacao_cpf_receita_descricao?: string | null
          situacao_cpf_receita_id?: number | null
          situacao_pje?: string | null
          status_pje?: string | null
          tipo_documento?: string | null
          tipo_parte?: string
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          tipo_pessoa_codigo_pje?: string | null
          tipo_pessoa_label_pje?: string | null
          tipo_pessoa_validacao_receita?: string | null
          uf_nascimento_descricao?: string | null
          uf_nascimento_id_pje?: number | null
          uf_nascimento_sigla?: string | null
          ultima_atualizacao_pje?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terceiros_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "enderecos"
            referencedColumns: ["id"]
          },
        ]
      }
      tipo_audiencia: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id: number
          id_pje: number
          is_virtual: boolean
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          grau: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pje: number
          is_virtual?: boolean
          trt: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          grau?: Database["public"]["Enums"]["grau_tribunal"]
          id?: never
          id_pje?: number
          is_virtual?: boolean
          trt?: Database["public"]["Enums"]["codigo_tribunal"]
          updated_at?: string
        }
        Relationships: []
      }
      tipos_expedientes: {
        Row: {
          created_at: string
          created_by: number
          id: number
          tipo_expediente: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: number
          id?: never
          tipo_expediente: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: number
          id?: never
          tipo_expediente?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_expedientes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_bancarias_importadas: {
        Row: {
          arquivo_importacao: string | null
          conta_bancaria_id: number
          created_at: string
          created_by: number | null
          dados_originais: Json
          data_importacao: string
          data_transacao: string
          descricao: string
          documento: string | null
          hash_transacao: string | null
          id: number
          saldo_extrato: number | null
          tipo_transacao: string | null
          valor: number
        }
        Insert: {
          arquivo_importacao?: string | null
          conta_bancaria_id: number
          created_at?: string
          created_by?: number | null
          dados_originais: Json
          data_importacao?: string
          data_transacao: string
          descricao: string
          documento?: string | null
          hash_transacao?: string | null
          id?: never
          saldo_extrato?: number | null
          tipo_transacao?: string | null
          valor: number
        }
        Update: {
          arquivo_importacao?: string | null
          conta_bancaria_id?: number
          created_at?: string
          created_by?: number | null
          dados_originais?: Json
          data_importacao?: string
          data_transacao?: string
          descricao?: string
          documento?: string | null
          hash_transacao?: string | null
          id?: never
          saldo_extrato?: number | null
          tipo_transacao?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_bancarias_importadas_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_bancarias_importadas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_importadas: {
        Row: {
          banco_original: string | null
          categoria_original: string | null
          conta_bancaria_id: number
          created_at: string
          data_transacao: string
          descricao: string
          documento: string | null
          hash_info: string
          id: number
          tipo_transacao: string
          updated_at: string
          valor: number
        }
        Insert: {
          banco_original?: string | null
          categoria_original?: string | null
          conta_bancaria_id: number
          created_at?: string
          data_transacao: string
          descricao: string
          documento?: string | null
          hash_info: string
          id?: number
          tipo_transacao: string
          updated_at?: string
          valor: number
        }
        Update: {
          banco_original?: string | null
          categoria_original?: string | null
          conta_bancaria_id?: number
          created_at?: string
          data_transacao?: string
          descricao?: string
          documento?: string | null
          hash_info?: string
          id?: number
          tipo_transacao?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_importadas_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      tribunais: {
        Row: {
          ativo: boolean
          cidadeSede: string
          codigo: string
          createdAt: string
          id: string
          nome: string
          regiao: string
          uf: string
          updatedAt: string
        }
        Insert: {
          ativo?: boolean
          cidadeSede: string
          codigo: string
          createdAt?: string
          id: string
          nome: string
          regiao: string
          uf: string
          updatedAt: string
        }
        Update: {
          ativo?: boolean
          cidadeSede?: string
          codigo?: string
          createdAt?: string
          id?: string
          nome?: string
          regiao?: string
          uf?: string
          updatedAt?: string
        }
        Relationships: []
      }
      tribunais_config: {
        Row: {
          created_at: string
          custom_timeouts: Json | null
          id: string
          sistema: string
          tipo_acesso: Database["public"]["Enums"]["tipo_acesso_tribunal"]
          tribunal_id: string
          updated_at: string
          url_api: string | null
          url_base: string
          url_login_seam: string
        }
        Insert: {
          created_at?: string
          custom_timeouts?: Json | null
          id: string
          sistema?: string
          tipo_acesso: Database["public"]["Enums"]["tipo_acesso_tribunal"]
          tribunal_id: string
          updated_at: string
          url_api?: string | null
          url_base: string
          url_login_seam: string
        }
        Update: {
          created_at?: string
          custom_timeouts?: Json | null
          id?: string
          sistema?: string
          tipo_acesso?: Database["public"]["Enums"]["tipo_acesso_tribunal"]
          tribunal_id?: string
          updated_at?: string
          url_api?: string | null
          url_base?: string
          url_login_seam?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribunais_config_tribunal_id_fkey"
            columns: ["tribunal_id"]
            isOneToOne: false
            referencedRelation: "tribunais"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          auth_user_id: string | null
          avatar_url: string | null
          cargo_id: number | null
          cover_url: string | null
          cpf: string
          created_at: string
          data_nascimento: string | null
          email_corporativo: string
          email_pessoal: string | null
          endereco: Json | null
          genero: Database["public"]["Enums"]["genero_usuario"] | null
          id: number
          is_super_admin: boolean | null
          last_seen: string | null
          nome_completo: string
          nome_exibicao: string
          oab: string | null
          online_status: string | null
          ramal: string | null
          rg: string | null
          telefone: string | null
          uf_oab: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          auth_user_id?: string | null
          avatar_url?: string | null
          cargo_id?: number | null
          cover_url?: string | null
          cpf: string
          created_at?: string
          data_nascimento?: string | null
          email_corporativo: string
          email_pessoal?: string | null
          endereco?: Json | null
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id?: never
          is_super_admin?: boolean | null
          last_seen?: string | null
          nome_completo: string
          nome_exibicao: string
          oab?: string | null
          online_status?: string | null
          ramal?: string | null
          rg?: string | null
          telefone?: string | null
          uf_oab?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string | null
          avatar_url?: string | null
          cargo_id?: number | null
          cover_url?: string | null
          cpf?: string
          created_at?: string
          data_nascimento?: string | null
          email_corporativo?: string
          email_pessoal?: string | null
          endereco?: Json | null
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id?: never
          is_super_admin?: boolean | null
          last_seen?: string | null
          nome_completo?: string
          nome_exibicao?: string
          oab?: string | null
          online_status?: string | null
          ramal?: string | null
          rg?: string | null
          telefone?: string | null
          uf_oab?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      acervo_unificado: {
        Row: {
          advogado_id: number | null
          classe_judicial: string | null
          codigo_status_processo: string | null
          created_at: string | null
          data_arquivamento: string | null
          data_autuacao: string | null
          data_autuacao_origem: string | null
          data_proxima_audiencia: string | null
          descricao_orgao_julgador: string | null
          grau_atual: Database["public"]["Enums"]["grau_tribunal"] | null
          grau_origem: Database["public"]["Enums"]["grau_tribunal"] | null
          graus_ativos: Database["public"]["Enums"]["grau_tribunal"][] | null
          id: number | null
          id_pje: number | null
          instances: Json | null
          juizo_digital: boolean | null
          nome_parte_autora: string | null
          nome_parte_autora_origem: string | null
          nome_parte_re: string | null
          nome_parte_re_origem: string | null
          numero: number | null
          numero_processo: string | null
          orgao_julgador_origem: string | null
          origem: string | null
          prioridade_processual: number | null
          qtde_parte_autora: number | null
          qtde_parte_re: number | null
          responsavel_id: number | null
          segredo_justica: boolean | null
          tem_associacao: boolean | null
          trt: Database["public"]["Enums"]["codigo_tribunal"] | null
          trt_origem: Database["public"]["Enums"]["codigo_tribunal"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acervo_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acervo_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      audiencias_com_origem: {
        Row: {
          advogado_id: number | null
          ata_audiencia_id: number | null
          classe_judicial_id: number | null
          created_at: string | null
          dados_anteriores: Json | null
          data_fim: string | null
          data_inicio: string | null
          designada: boolean | null
          documento_ativo: boolean | null
          em_andamento: boolean | null
          endereco_presencial: Json | null
          grau: Database["public"]["Enums"]["grau_tribunal"] | null
          hora_fim: string | null
          hora_inicio: string | null
          id: number | null
          id_pje: number | null
          juizo_digital: boolean | null
          modalidade: Database["public"]["Enums"]["modalidade_audiencia"] | null
          numero_processo: string | null
          observacoes: string | null
          orgao_julgador_id: number | null
          orgao_julgador_origem: string | null
          polo_ativo_nome: string | null
          polo_ativo_origem: string | null
          polo_ativo_representa_varios: boolean | null
          polo_passivo_nome: string | null
          polo_passivo_origem: string | null
          polo_passivo_representa_varios: boolean | null
          presenca_hibrida: string | null
          processo_id: number | null
          responsavel_id: number | null
          sala_audiencia_id: number | null
          sala_audiencia_nome: string | null
          segredo_justica: boolean | null
          status: string | null
          status_descricao: string | null
          tipo_audiencia_id: number | null
          trt: Database["public"]["Enums"]["codigo_tribunal"] | null
          trt_origem: Database["public"]["Enums"]["codigo_tribunal"] | null
          updated_at: string | null
          url_ata_audiencia: string | null
          url_audiencia_virtual: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_classe_judicial_id_fkey"
            columns: ["classe_judicial_id"]
            isOneToOne: false
            referencedRelation: "classe_judicial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_orgao_julgador_id_fkey"
            columns: ["orgao_julgador_id"]
            isOneToOne: false
            referencedRelation: "orgao_julgador"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
          {
            foreignKeyName: "audiencias_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_sala_audiencia_id_fkey"
            columns: ["sala_audiencia_id"]
            isOneToOne: false
            referencedRelation: "sala_audiencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_tipo_audiencia_id_fkey"
            columns: ["tipo_audiencia_id"]
            isOneToOne: false
            referencedRelation: "tipo_audiencia"
            referencedColumns: ["id"]
          },
        ]
      }
      expedientes_com_origem: {
        Row: {
          advogado_id: number | null
          arquivo_bucket: string | null
          arquivo_key: string | null
          arquivo_nome: string | null
          arquivo_url: string | null
          baixado_em: string | null
          classe_judicial: string | null
          codigo_status_processo: string | null
          created_at: string | null
          dados_anteriores: Json | null
          data_arquivamento: string | null
          data_autuacao: string | null
          data_ciencia_parte: string | null
          data_criacao_expediente: string | null
          data_prazo_legal_parte: string | null
          descricao_arquivos: string | null
          descricao_orgao_julgador: string | null
          grau: Database["public"]["Enums"]["grau_tribunal"] | null
          id: number | null
          id_documento: number | null
          id_pje: number | null
          juizo_digital: boolean | null
          justificativa_baixa: string | null
          nome_parte_autora: string | null
          nome_parte_autora_origem: string | null
          nome_parte_re: string | null
          nome_parte_re_origem: string | null
          numero: number | null
          numero_processo: string | null
          observacoes: string | null
          orgao_julgador_origem: string | null
          origem: Database["public"]["Enums"]["origem_expediente"] | null
          prazo_vencido: boolean | null
          prioridade_processual: number | null
          processo_id: number | null
          protocolo_id: string | null
          qtde_parte_autora: number | null
          qtde_parte_re: number | null
          responsavel_id: number | null
          segredo_justica: boolean | null
          sigla_orgao_julgador: string | null
          tipo_expediente_id: number | null
          trt: Database["public"]["Enums"]["codigo_tribunal"] | null
          trt_origem: Database["public"]["Enums"]["codigo_tribunal"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
          {
            foreignKeyName: "expedientes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_tipo_expediente_id_fkey"
            columns: ["tipo_expediente_id"]
            isOneToOne: false
            referencedRelation: "tipos_expedientes"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_cliente_por_cpf: {
        Row: {
          advogado_id: number | null
          classe_judicial: string | null
          cliente_id: number | null
          cliente_nome: string | null
          codigo_status_processo: string | null
          cpf: string | null
          data_arquivamento: string | null
          data_autuacao: string | null
          data_proxima_audiencia: string | null
          descricao_orgao_julgador: string | null
          grau: Database["public"]["Enums"]["grau_tribunal"] | null
          id_pje: number | null
          nome_parte_autora: string | null
          nome_parte_re: string | null
          numero_processo: string | null
          origem: string | null
          parte_principal: boolean | null
          polo: string | null
          processo_id: number | null
          segredo_justica: boolean | null
          timeline_jsonb: Json | null
          tipo_parte: string | null
          trt: Database["public"]["Enums"]["codigo_tribunal"] | null
        }
        Relationships: [
          {
            foreignKeyName: "acervo_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
        ]
      }
      repasses_pendentes: {
        Row: {
          acordo_condenacao_id: number | null
          acordo_numero_parcelas: number | null
          acordo_valor_total: number | null
          arquivo_declaracao_prestacao_contas: string | null
          data_declaracao_anexada: string | null
          data_efetivacao: string | null
          numero_parcela: number | null
          parcela_id: number | null
          percentual_cliente: number | null
          processo_id: number | null
          status_repasse: string | null
          tipo: string | null
          valor_bruto_credito_principal: number | null
          valor_repasse_cliente: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acordos_condenacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_condenacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "acervo_unificado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_condenacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_cliente_por_cpf"
            referencedColumns: ["processo_id"]
          },
          {
            foreignKeyName: "parcelas_acordo_condenacao_id_fkey"
            columns: ["acordo_condenacao_id"]
            isOneToOne: false
            referencedRelation: "acordos_condenacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_orcamento_vs_realizado: {
        Row: {
          ano: number | null
          centro_codigo: string | null
          centro_custo_id: number | null
          centro_nome: string | null
          conta_codigo: string | null
          conta_contabil_id: number | null
          conta_nome: string | null
          data_fim: string | null
          data_inicio: string | null
          item_id: number | null
          mes: number | null
          orcamento_id: number | null
          orcamento_nome: string | null
          orcamento_status:
            | Database["public"]["Enums"]["status_orcamento"]
            | null
          percentual_realizado: number | null
          periodo: Database["public"]["Enums"]["periodo_orcamento"] | null
          tipo_conta: Database["public"]["Enums"]["tipo_conta_contabil"] | null
          valor_orcado: number | null
          valor_realizado: number | null
          variacao: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_conta_contabil_id_fkey"
            columns: ["conta_contabil_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      atribuir_responsavel_acervo: {
        Args: {
          processo_id: number
          responsavel_id_param: number
          usuario_executou_id: number
        }
        Returns: Json
      }
      atribuir_responsavel_audiencia: {
        Args: {
          audiencia_id: number
          responsavel_id_param: number
          usuario_executou_id: number
        }
        Returns: Json
      }
      atribuir_responsavel_pendente: {
        Args: {
          pendente_id: number
          responsavel_id_param: number
          usuario_executou_id: number
        }
        Returns: Json
      }
      atualizar_tipo_descricao_expediente: {
        Args: {
          p_descricao_arquivos?: string
          p_expediente_id: number
          p_tipo_expediente_id?: number
          p_usuario_executou_id: number
        }
        Returns: Json
      }
      cleanup_expired_locks: { Args: never; Returns: number }
      cleanup_old_mcp_audit_logs: { Args: never; Returns: number }
      count_processos_unicos: {
        Args: {
          p_data_fim?: string
          p_data_inicio?: string
          p_origem?: string
          p_responsavel_id?: number
        }
        Returns: number
      }
      desatribuir_todas_audiencias_usuario: {
        Args: { p_usuario_id: number }
        Returns: undefined
      }
      desatribuir_todos_contratos_usuario: {
        Args: { p_usuario_id: number }
        Returns: undefined
      }
      desatribuir_todos_expedientes_usuario: {
        Args: { p_usuario_id: number }
        Returns: undefined
      }
      desatribuir_todos_pendentes_usuario: {
        Args: { p_usuario_id: number }
        Returns: undefined
      }
      desatribuir_todos_processos_usuario: {
        Args: { p_usuario_id: number }
        Returns: undefined
      }
      exec_sql_with_context: {
        Args: { sql_text: string; user_id: number }
        Returns: undefined
      }
      generate_unique_chat_filename:
        | { Args: { original_name: string }; Returns: string }
        | { Args: { original_name: string; user_id: number }; Returns: string }
      get_accessible_documento_ids: {
        Args: { p_usuario_id: number }
        Returns: {
          documento_id: number
        }[]
      }
      get_current_user_id: { Args: never; Returns: number }
      get_landlord_org_id: { Args: never; Returns: string }
      get_my_admin_org_ids: { Args: never; Returns: string[] }
      get_my_org_ids: { Args: never; Returns: string[] }
      get_usuario_id_from_auth: { Args: never; Returns: number }
      is_current_user_in_landlord: { Args: never; Returns: boolean }
      is_landlord_org: { Args: { org_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      list_auth_users_nao_sincronizados: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          raw_user_meta_data: Json
        }[]
      }
      marcar_parcelas_atrasadas: { Args: never; Returns: number }
      match_embeddings: {
        Args: {
          filter_entity_type?: string
          filter_metadata?: Json
          filter_parent_id?: number
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          entity_id: number
          entity_type: string
          id: number
          metadata: Json
          parent_id: number
          similarity: number
        }[]
      }
      refresh_acervo_unificado: {
        Args: { use_concurrent?: boolean }
        Returns: undefined
      }
      refresh_orcamento_vs_realizado: { Args: never; Returns: undefined }
      refresh_processos_cliente_por_cpf: { Args: never; Returns: undefined }
      registrar_baixa_expediente: {
        Args: {
          p_expediente_id: number
          p_justificativa?: string
          p_protocolo_id?: string
          p_usuario_id: number
        }
        Returns: undefined
      }
      registrar_reversao_baixa_expediente: {
        Args: {
          p_expediente_id: number
          p_justificativa_anterior?: string
          p_protocolo_id_anterior?: string
          p_usuario_id: number
        }
        Returns: undefined
      }
      user_can_access_chat_room: {
        Args: { p_sala_id: number; p_usuario_id: number }
        Returns: boolean
      }
      user_can_view_chamada: {
        Args: { p_chamada_id: number; p_current_user_id: number }
        Returns: boolean
      }
      user_can_view_participant: {
        Args: {
          p_chamada_id: number
          p_current_user_id: number
          p_participante_usuario_id: number
        }
        Returns: boolean
      }
      user_has_document_access: {
        Args: { p_documento_id: number; p_usuario_id: number }
        Returns: boolean
      }
      user_initiated_chamada: {
        Args: { p_chamada_id: number; p_usuario_id: number }
        Returns: boolean
      }
      user_is_chamada_participant: {
        Args: { p_chamada_id: number; p_usuario_id: number }
        Returns: boolean
      }
      user_is_sala_member: {
        Args: { p_sala_id: number; p_usuario_id: number }
        Returns: boolean
      }
    }
    Enums: {
      codigo_tribunal:
        | "TRT1"
        | "TRT2"
        | "TRT3"
        | "TRT4"
        | "TRT5"
        | "TRT6"
        | "TRT7"
        | "TRT8"
        | "TRT9"
        | "TRT10"
        | "TRT11"
        | "TRT12"
        | "TRT13"
        | "TRT14"
        | "TRT15"
        | "TRT16"
        | "TRT17"
        | "TRT18"
        | "TRT19"
        | "TRT20"
        | "TRT21"
        | "TRT22"
        | "TRT23"
        | "TRT24"
        | "TST"
      estado_civil:
        | "solteiro"
        | "casado"
        | "divorciado"
        | "viuvo"
        | "uniao_estavel"
        | "outro"
      forma_pagamento_financeiro:
        | "dinheiro"
        | "transferencia_bancaria"
        | "ted"
        | "pix"
        | "boleto"
        | "cartao_credito"
        | "cartao_debito"
        | "cheque"
        | "deposito_judicial"
      genero_usuario:
        | "masculino"
        | "feminino"
        | "outro"
        | "prefiro_nao_informar"
      grau_tribunal: "primeiro_grau" | "segundo_grau" | "tribunal_superior"
      Instancia: "PRIMEIRO_GRAU" | "SEGUNDO_GRAU" | "TRIBUNAL_SUPERIOR"
      meio_comunicacao: "E" | "D"
      modalidade_audiencia: "virtual" | "presencial" | "hibrida"
      natureza_conta: "devedora" | "credora"
      nivel_conta: "sintetica" | "analitica"
      NotificationSeverity: "LOW" | "MEDIUM" | "HIGH"
      NotificationType:
        | "SYNC_FAILED"
        | "SYNC_EXHAUSTED"
        | "SCRAPE_EXECUTION_FAILED"
        | "TRIBUNAL_SCRAPE_FAILED"
        | "STORAGE_FULL"
        | "CLEANUP_ERROR"
        | "EXTERNAL_STORAGE_DOWN"
      origem_expediente: "captura" | "manual" | "comunica_cnj"
      origem_lancamento:
        | "manual"
        | "acordo_judicial"
        | "contrato"
        | "folha_pagamento"
        | "importacao_bancaria"
        | "recorrente"
      papel_contratual: "autora" | "re"
      periodo_orcamento: "mensal" | "trimestral" | "semestral" | "anual"
      polo_processual: "autor" | "re"
      status_audiencia: "C" | "M" | "F"
      status_captura: "pending" | "in_progress" | "completed" | "failed"
      status_conciliacao: "pendente" | "conciliado" | "divergente" | "ignorado"
      status_conta_bancaria: "ativa" | "inativa" | "encerrada"
      status_contrato:
        | "em_contratacao"
        | "contratado"
        | "distribuido"
        | "desistencia"
      status_lancamento: "pendente" | "confirmado" | "cancelado" | "estornado"
      status_orcamento: "rascunho" | "aprovado" | "em_execucao" | "encerrado"
      StatusArquivamento: "ATIVO" | "ARQUIVADO" | "BAIXADO"
      StatusExpediente: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO"
      SyncStatus:
        | "PENDING"
        | "SYNCING"
        | "SYNCED"
        | "PARTIAL"
        | "FAILED"
        | "DELETED"
      tipo_acesso_tribunal:
        | "primeiro_grau"
        | "segundo_grau"
        | "unificado"
        | "unico"
      tipo_captura:
        | "acervo_geral"
        | "arquivados"
        | "audiencias"
        | "pendentes"
        | "partes"
        | "comunica_cnj"
        | "combinada"
      tipo_cobranca: "pro_exito" | "pro_labore"
      tipo_conta_bancaria: "corrente" | "poupanca" | "investimento" | "caixa"
      tipo_conta_contabil:
        | "ativo"
        | "passivo"
        | "receita"
        | "despesa"
        | "patrimonio_liquido"
      tipo_contrato:
        | "ajuizamento"
        | "defesa"
        | "ato_processual"
        | "assessoria"
        | "consultoria"
        | "extrajudicial"
        | "parecer"
      tipo_lancamento: "receita" | "despesa"
      tipo_pessoa: "pf" | "pj"
      TipoAcaoHistorico:
        | "ATRIBUIDO"
        | "TRANSFERIDO"
        | "BAIXADO"
        | "REVERSAO_BAIXA"
        | "PROTOCOLO_ADICIONADO"
        | "OBSERVACAO_ADICIONADA"
      TipoExpedienteEnum:
        | "IMPUGNACAO_A_CONTESTACAO"
        | "RAZOES_FINAIS"
        | "RECURSO_ORDINARIO"
        | "MANIFESTACAO"
        | "RECURSO_DE_REVISTA"
        | "AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO"
        | "CONTRARRAZOES_AOS_EMBARGOS_DE_DECLARACAO"
        | "CONTRARRAZOES_AO_RECURSO_ORDINARIO"
        | "EMENDA_A_INICIAL"
        | "AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA"
        | "CONTRARRAZOES_AO_RECURSO_DE_REVISTA"
        | "AGRAVO_INTERNO"
        | "ADITAMENTO_A_INICIAL"
        | "IMPUGNACAO_AO_CUMPRIMENTO_DE_SENTENCA"
        | "IMPUGNACAO_AO_LAUDO_PERICIAL"
        | "IMPUGNACAO_AO_CALCULO_PERICIAL"
        | "APRESENTACAO_DE_CALCULOS"
        | "IMPUGNACAO_AOS_EMBARGOS_DE_EXECUCAO"
        | "APRESENTACAO_DE_QUESITOS"
        | "AUDIENCIA"
        | "CONTRARRAZOES_AO_RECURSO_ORDINARIO_ADESIVO"
        | "CONTRAMINUTA_AO_AGRAVO_DE_PETICAO"
        | "CONTRAMINUTA_AO_AGRAVO_INTERNO"
        | "PERICIA"
        | "CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA"
        | "CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO"
        | "SESSAO_DE_JULGAMENTO"
        | "CEJUSC"
        | "VERIFICAR"
      TipoTribunal: "TRT" | "TJ" | "TRF" | "TST" | "STF" | "STJ"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      codigo_tribunal: [
        "TRT1",
        "TRT2",
        "TRT3",
        "TRT4",
        "TRT5",
        "TRT6",
        "TRT7",
        "TRT8",
        "TRT9",
        "TRT10",
        "TRT11",
        "TRT12",
        "TRT13",
        "TRT14",
        "TRT15",
        "TRT16",
        "TRT17",
        "TRT18",
        "TRT19",
        "TRT20",
        "TRT21",
        "TRT22",
        "TRT23",
        "TRT24",
        "TST",
      ],
      estado_civil: [
        "solteiro",
        "casado",
        "divorciado",
        "viuvo",
        "uniao_estavel",
        "outro",
      ],
      forma_pagamento_financeiro: [
        "dinheiro",
        "transferencia_bancaria",
        "ted",
        "pix",
        "boleto",
        "cartao_credito",
        "cartao_debito",
        "cheque",
        "deposito_judicial",
      ],
      genero_usuario: [
        "masculino",
        "feminino",
        "outro",
        "prefiro_nao_informar",
      ],
      grau_tribunal: ["primeiro_grau", "segundo_grau", "tribunal_superior"],
      Instancia: ["PRIMEIRO_GRAU", "SEGUNDO_GRAU", "TRIBUNAL_SUPERIOR"],
      meio_comunicacao: ["E", "D"],
      modalidade_audiencia: ["virtual", "presencial", "hibrida"],
      natureza_conta: ["devedora", "credora"],
      nivel_conta: ["sintetica", "analitica"],
      NotificationSeverity: ["LOW", "MEDIUM", "HIGH"],
      NotificationType: [
        "SYNC_FAILED",
        "SYNC_EXHAUSTED",
        "SCRAPE_EXECUTION_FAILED",
        "TRIBUNAL_SCRAPE_FAILED",
        "STORAGE_FULL",
        "CLEANUP_ERROR",
        "EXTERNAL_STORAGE_DOWN",
      ],
      origem_expediente: ["captura", "manual", "comunica_cnj"],
      origem_lancamento: [
        "manual",
        "acordo_judicial",
        "contrato",
        "folha_pagamento",
        "importacao_bancaria",
        "recorrente",
      ],
      papel_contratual: ["autora", "re"],
      periodo_orcamento: ["mensal", "trimestral", "semestral", "anual"],
      polo_processual: ["autor", "re"],
      status_audiencia: ["C", "M", "F"],
      status_captura: ["pending", "in_progress", "completed", "failed"],
      status_conciliacao: ["pendente", "conciliado", "divergente", "ignorado"],
      status_conta_bancaria: ["ativa", "inativa", "encerrada"],
      status_contrato: [
        "em_contratacao",
        "contratado",
        "distribuido",
        "desistencia",
      ],
      status_lancamento: ["pendente", "confirmado", "cancelado", "estornado"],
      status_orcamento: ["rascunho", "aprovado", "em_execucao", "encerrado"],
      StatusArquivamento: ["ATIVO", "ARQUIVADO", "BAIXADO"],
      StatusExpediente: ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"],
      SyncStatus: [
        "PENDING",
        "SYNCING",
        "SYNCED",
        "PARTIAL",
        "FAILED",
        "DELETED",
      ],
      tipo_acesso_tribunal: [
        "primeiro_grau",
        "segundo_grau",
        "unificado",
        "unico",
      ],
      tipo_captura: [
        "acervo_geral",
        "arquivados",
        "audiencias",
        "pendentes",
        "partes",
        "comunica_cnj",
        "combinada",
      ],
      tipo_cobranca: ["pro_exito", "pro_labore"],
      tipo_conta_bancaria: ["corrente", "poupanca", "investimento", "caixa"],
      tipo_conta_contabil: [
        "ativo",
        "passivo",
        "receita",
        "despesa",
        "patrimonio_liquido",
      ],
      tipo_contrato: [
        "ajuizamento",
        "defesa",
        "ato_processual",
        "assessoria",
        "consultoria",
        "extrajudicial",
        "parecer",
      ],
      tipo_lancamento: ["receita", "despesa"],
      tipo_pessoa: ["pf", "pj"],
      TipoAcaoHistorico: [
        "ATRIBUIDO",
        "TRANSFERIDO",
        "BAIXADO",
        "REVERSAO_BAIXA",
        "PROTOCOLO_ADICIONADO",
        "OBSERVACAO_ADICIONADA",
      ],
      TipoExpedienteEnum: [
        "IMPUGNACAO_A_CONTESTACAO",
        "RAZOES_FINAIS",
        "RECURSO_ORDINARIO",
        "MANIFESTACAO",
        "RECURSO_DE_REVISTA",
        "AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO",
        "CONTRARRAZOES_AOS_EMBARGOS_DE_DECLARACAO",
        "CONTRARRAZOES_AO_RECURSO_ORDINARIO",
        "EMENDA_A_INICIAL",
        "AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA",
        "CONTRARRAZOES_AO_RECURSO_DE_REVISTA",
        "AGRAVO_INTERNO",
        "ADITAMENTO_A_INICIAL",
        "IMPUGNACAO_AO_CUMPRIMENTO_DE_SENTENCA",
        "IMPUGNACAO_AO_LAUDO_PERICIAL",
        "IMPUGNACAO_AO_CALCULO_PERICIAL",
        "APRESENTACAO_DE_CALCULOS",
        "IMPUGNACAO_AOS_EMBARGOS_DE_EXECUCAO",
        "APRESENTACAO_DE_QUESITOS",
        "AUDIENCIA",
        "CONTRARRAZOES_AO_RECURSO_ORDINARIO_ADESIVO",
        "CONTRAMINUTA_AO_AGRAVO_DE_PETICAO",
        "CONTRAMINUTA_AO_AGRAVO_INTERNO",
        "PERICIA",
        "CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA",
        "CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO",
        "SESSAO_DE_JULGAMENTO",
        "CEJUSC",
        "VERIFICAR",
      ],
      TipoTribunal: ["TRT", "TJ", "TRF", "TST", "STF", "STJ"],
    },
  },
} as const
