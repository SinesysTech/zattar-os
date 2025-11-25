ENDPOINT DE AUDIENCIAS COM FILTRO REALIZADA

curl ^"https://pje.trt3.jus.br/pje-comum-api/api/pauta-usuarios-externos?dataFim=2025-11-25^&dataInicio=2024-11-25^&ataAssinada=true^&codigoSituacao=F^&numeroPagina=1^&tamanhoPagina=15^&ordenacao=asc^" ^
  -H ^"accept: application/json, text/plain, */*^" ^
  -H ^"accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7^" ^
  -H ^"content-type: application/json^" ^
  -b ^"_ga=GA1.1.974651562.1753293362; _ga_89WP9Y8PMY=GS2.1.s1764091419^$o98^$g1^$t1764091434^$j45^$l0^$h0; ASSINADOR_PJE=PJEOFFICE; MO=PJEOFFICE; sso_refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI4ZmViYjJiOS0zYmIzLTQzZmItYTMxMS0xMjJmMmNlODIwNGUifQ.eyJleHAiOjE3NjQxMjA0MjYsImlhdCI6MTc2NDA5MTYyNiwianRpIjoiNjFhNmJjMzktMjUwOC00YzhlLWI4ZmMtZjkwZmE0NmQ4ZTgxIiwiaXNzIjoiaHR0cHM6Ly9zc28uY2xvdWQucGplLmp1cy5ici9hdXRoL3JlYWxtcy9wamUiLCJhdWQiOiJodHRwczovL3Nzby5jbG91ZC5wamUuanVzLmJyL2F1dGgvcmVhbG1zL3BqZSIsInN1YiI6ImIyOTc5ZWI2LTliZWItNGUzZC1iYmZiLTY1ODc2OTMxMWFkYSIsInR5cCI6IlJlZnJlc2giLCJhenAiOiJwamUtdHJ0My0yZyIsInNlc3Npb25fc3RhdGUiOiJlOGUxMTAwNy0zYTFjLTRjOWMtYjAxNC01ZWE3NTFhMzM1ODYiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic2lkIjoiZThlMTEwMDctM2ExYy00YzljLWIwMTQtNWVhNzUxYTMzNTg2In0.llG62KE7LM4OwuQWTvi5ggUkaOFKtftt4l9owihsU80; access_token=eyJraWQiOiJhNnZ5SVcydGhPTzJDMFBsZ0JaX0FWUmlweGJUazZkYlJvMUtaV3dfUlBNIiwiYWxnIjoiRVMyNTYifQ.eyJqdGkiOiIzODA0YjJiYy1lNTM1LTRlOWEtODZhMi0wODhjNjg2MDI2OTciLCJpc3MiOiJodHRwczovL3BqZS50cnQzLmp1cy5ici9wamUtc2VndXJhbmNhLyIsImlhdCI6MTc2NDA5MTYyNiwic3ViIjoiNDM1MDYwYmMtNDhiZC00ZTJmLTlmZGYtN2I0YzUwZGJiYjNlLnBqZSIsImV4cCI6MTc2NDA5NTIyNiwic2lnbGFTaXN0ZW1hIjoiUEpFIiwiaW5zdGFuY2lhIjoyLCJ0aXBvIjoiVVNVQVJJTyIsImlkIjoxMTI1NCwibG9naW4iOiIwNzUyOTI5NDYxMCIsIm5vbWUiOiJQRURSTyBaQVRUQVIgRVVHRU5JTyIsInBlcmZpbCI6NjQwNywicGFwZWwiOnsiaWQiOjEwMDUsIm5vbWUiOiJBZHZvZ2FkbyIsImlkZW50aWZpY2Fkb3IiOiJBRFZPR0FETyJ9LCJwYXBlbEt6Ijp7ImlkIjoxMCwibm9tZSI6IkFkdm9nYWRvIiwiaWRlbnRpZmljYWRvciI6IkFEVk9HQURPIn0sImxvY2FsaXphY2FvIjp7ImlkIjozOTEzLCJkZXNjcmljYW8iOiJQRURSTyBaQVRUQVIgRVVHRU5JTyAoMDc1LjI5Mi45NDYtMTApIn0sIm1ldG9kb0F1dGVudGljYWNhbyI6IkNFUlRJRklDQURPIiwic2lkIjoiZDc2NGVjMzctMzM1ZS00NWQxLWIxMTgtN2M5MGU5NDU0MjFjIiwib3JpZ2VtIjoiVFJUMyIsInVzdWFyaW9VbmlmaWNhZG8iOnRydWUsIm90cFBlcnNpc3RpZG8iOmZhbHNlfQ; access_token_footer=iBHN9JVYiHAXkpnt8TlOrOGKVrpcUlR-SCt9Ej_QWagD0CU8dRWPiLDUD_F6LX9IIMr5MTubjjj16N3xQK-hNw; refresh_token=eyJraWQiOiJhNnZ5SVcydGhPTzJDMFBsZ0JaX0FWUmlweGJUazZkYlJvMUtaV3dfUlBNIiwiYWxnIjoiRVMyNTYifQ.eyJqdGkiOiI5OTVlNGRkOC0zYjMwLTQwMmUtYWE2NC03NjQ3ZjVkZTVlMDIiLCJpc3MiOiJodHRwczovL3BqZS50cnQzLmp1cy5ici9wamUtc2VndXJhbmNhLyIsImlhdCI6MTc2NDA5MTYyNiwic3ViIjoiNDM1MDYwYmMtNDhiZC00ZTJmLTlmZGYtN2I0YzUwZGJiYjNlLnBqZSIsImV4cCI6MTc2NDEzNDgyNiwic2lnbGFTaXN0ZW1hIjoiUEpFIiwiaW5zdGFuY2lhIjoyLCJ0aXBvIjoiUkVGUkVTSF9UT0tFTiIsImxvZ2luIjoiMDc1MjkyOTQ2MTAiLCJwZXJmaWwiOjY0MDcsInNpZCI6ImQ3NjRlYzM3LTMzNWUtNDVkMS1iMTE4LTdjOTBlOTQ1NDIxYyIsIm1ldG9kb0F1dGVudGljYWNhbyI6IkNFUlRJRklDQURPIiwidXN1YXJpb1VuaWZpY2FkbyI6dHJ1ZSwib3JpZ2VtIjoiVFJUMyJ9.ko1SSvDkb1A-EwB-4bdPT_RzZPoGlcwhDMs4g153dSMuV1wirz08Ba1OtU8wb2JrJlw9GBxi7P5K9u4p7qufIA; Xsrf-Token=2E078F4DF276BAA91587017871398C8FF3AC25F112D133E649D728B6C9DC363D66E911FA78655F1C3156ACCBB4D361B79C0D^" ^
  -H ^"priority: u=1, i^" ^
  -H ^"referer: https://pje.trt3.jus.br/pjekz/pauta-usuarios-externos^" ^
  -H ^"sec-ch-ua: ^\^"Chromium^\^";v=^\^"142^\^", ^\^"Google Chrome^\^";v=^\^"142^\^", ^\^"Not_A Brand^\^";v=^\^"99^\^"^" ^
  -H ^"sec-ch-ua-mobile: ?0^" ^
  -H ^"sec-ch-ua-platform: ^\^"Windows^\^"^" ^
  -H ^"sec-fetch-dest: empty^" ^
  -H ^"sec-fetch-mode: cors^" ^
  -H ^"sec-fetch-site: same-origin^" ^
  -H ^"user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36^" ^
  -H ^"x-xsrf-token: 2E078F4DF276BAA91587017871398C8FF3AC25F112D133E649D728B6C9DC363D66E911FA78655F1C3156ACCBB4D361B79C0D^"


  ---

  EXEMPLO DE RESPOSTA ENDPOINT DE AUDIENCIAS COM FILTRO REALIZADA 
 
{
    "pagina": 1,
    "tamanhoPagina": 15,
    "qtdPaginas": 35,
    "totalRegistros": 527,
    "resultado": [
        {
            "id": 27777,
            "dataInicio": "2024-11-25T08:50:00",
            "dataFim": "2024-11-25T09:25:00",
            "salaAudiencia": {
                "nome": "SALA 2"
            },
            "status": "F",
            "processo": {
                "id": 707878,
                "numero": "0010816-81.2023.5.03.0016",
                "classeJudicial": {
                    "id": 553,
                    "codigo": "1009",
                    "descricao": "Recurso Ordinário Trabalhista",
                    "sigla": "ROT",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala2cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "CAIO MELO LANA ALVES",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "1 CLICK TELECOM LTDA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27777,
                "horaInicial": "08:50:00",
                "horaFinal": "09:25:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120742838,
                "idUnicoDocumento": "befead1",
                "identificadorUnico": "665f6a63-33de-488c-88a8-80faebefead1",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "ALEXA MOREIRA DOS SANTOS GODINHO",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 7534,
                "criadoEm": "2024-11-25T09:35:44.335721",
                "juntadoEm": "2024-11-25T09:38:06.891445",
                "idProcesso": 707878,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120742838.pdf",
                "idBin": 120752516,
                "md5": "a90ab5a51c86b173ab880fc980e666fd",
                "dataInclusaoBin": "2024-11-25T09:35:44.332912",
                "tamanho": 76615,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 707878,
            "nrProcesso": "0010816-81.2023.5.03.0016"
        },
        {
            "id": 27802,
            "dataInicio": "2024-11-25T08:50:00",
            "dataFim": "2024-11-25T09:25:00",
            "salaAudiencia": {
                "nome": "SALA 3"
            },
            "status": "F",
            "processo": {
                "id": 692049,
                "numero": "0011251-10.2023.5.03.0031",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala3cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "FCD HAMBURGUERES COMERCIO DE ALIMENTOS LTDA",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "CAROLINA RODRIGUES MEDEIROS",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27802,
                "horaInicial": "08:50:00",
                "horaFinal": "09:25:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120745804,
                "idUnicoDocumento": "ddbe350",
                "identificadorUnico": "265d3b6c-c114-43b1-9a28-413bcddbe350",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "FLAVIA MARIA DA SILVA COSTA",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 332008,
                "criadoEm": "2024-11-25T10:11:33.765074",
                "juntadoEm": "2024-11-25T10:12:10.675545",
                "idProcesso": 692049,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120745804.pdf",
                "idBin": 120755482,
                "md5": "380d043a32b802b996d19a6a62db2a58",
                "dataInclusaoBin": "2024-11-25T10:11:33.761081",
                "tamanho": 73611,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 692049,
            "nrProcesso": "0011251-10.2023.5.03.0031"
        },
        {
            "id": 27779,
            "dataInicio": "2024-11-25T10:00:00",
            "dataFim": "2024-11-25T10:35:00",
            "salaAudiencia": {
                "nome": "SALA 2"
            },
            "status": "F",
            "processo": {
                "id": 708364,
                "numero": "0011382-74.2023.5.03.0163",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala2cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "DAVIDSON MIRANDA ANDRADE",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "METALSIDER LTDA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27779,
                "horaInicial": "10:00:00",
                "horaFinal": "10:35:00"
            },
            "prioridades": "Acidente de Trabalho",
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120755008,
                "idUnicoDocumento": "ff14fbc",
                "identificadorUnico": "dc5f30b8-67bb-46e1-b156-bb248ff14fbc",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "ALEXA MOREIRA DOS SANTOS GODINHO",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 7534,
                "criadoEm": "2024-11-25T12:08:37.875952",
                "juntadoEm": "2024-11-25T12:11:47.112773",
                "idProcesso": 708364,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120755008.pdf",
                "idBin": 120764687,
                "md5": "de87bf561daff25e9aa25adf5726149c",
                "dataInclusaoBin": "2024-11-25T12:08:37.868373",
                "tamanho": 73224,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 708364,
            "nrProcesso": "0011382-74.2023.5.03.0163"
        },
        {
            "id": 27780,
            "dataInicio": "2024-11-25T10:35:00",
            "dataFim": "2024-11-25T11:10:00",
            "salaAudiencia": {
                "nome": "SALA 2"
            },
            "status": "F",
            "processo": {
                "id": 708588,
                "numero": "0010385-88.2024.5.03.0185",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala2cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "TAIS SILVA DOS SANTOS",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "DMA DISTRIBUIDORA S/A",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": true
            },
            "pautaAudienciaHorario": {
                "id": 27780,
                "horaInicial": "10:35:00",
                "horaFinal": "11:10:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120754998,
                "idUnicoDocumento": "14be303",
                "identificadorUnico": "6ebf1024-6506-485f-8f10-d615c14be303",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "ALEXA MOREIRA DOS SANTOS GODINHO",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 7534,
                "criadoEm": "2024-11-25T12:08:18.680943",
                "juntadoEm": "2024-11-25T12:11:47.112769",
                "idProcesso": 708588,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120754998.pdf",
                "idBin": 120764677,
                "md5": "ae9a8bafed286851d982d46b31eacd1b",
                "dataInclusaoBin": "2024-11-25T12:08:18.678886",
                "tamanho": 73481,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 708588,
            "nrProcesso": "0010385-88.2024.5.03.0185"
        },
        {
            "id": 27853,
            "dataInicio": "2024-11-26T08:50:00",
            "dataFim": "2024-11-26T09:25:00",
            "salaAudiencia": {
                "nome": "SALA 5"
            },
            "status": "F",
            "processo": {
                "id": 680542,
                "numero": "0010026-87.2024.5.03.0105",
                "classeJudicial": {
                    "id": 553,
                    "codigo": "1009",
                    "descricao": "Recurso Ordinário Trabalhista",
                    "sigla": "ROT",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala5cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "JOICEANE CAMPOS SERAFIM",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "BORALE - LIVRARIA E PAPELARIA LTDA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27853,
                "horaInicial": "08:50:00",
                "horaFinal": "09:25:00"
            },
            "prioridades": "Acidente de Trabalho",
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120828774,
                "idUnicoDocumento": "34bcb1e",
                "identificadorUnico": "9eca8d7f-b105-4b38-be8b-e8ac534bcb1e",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "MARCIA CARVALHO MASCARENHAS",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 313028,
                "criadoEm": "2024-11-26T12:15:51.304361",
                "juntadoEm": "2024-11-26T12:28:33.235339",
                "idProcesso": 680542,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120828774.pdf",
                "idBin": 120838483,
                "md5": "a4a07504cfc2d7aa6b02cb3e888e90f2",
                "dataInclusaoBin": "2024-11-26T12:15:51.302069",
                "tamanho": 86771,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 680542,
            "nrProcesso": "0010026-87.2024.5.03.0105"
        },
        {
            "id": 27854,
            "dataInicio": "2024-11-26T09:25:00",
            "dataFim": "2024-11-26T10:00:00",
            "salaAudiencia": {
                "nome": "SALA 5"
            },
            "status": "F",
            "processo": {
                "id": 684428,
                "numero": "0010902-71.2022.5.03.0021",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala5cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "ALEX SOARES LOPES",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "MHC ENTREGAS RAPIDAS LTDA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": true
            },
            "pautaAudienciaHorario": {
                "id": 27854,
                "horaInicial": "09:25:00",
                "horaFinal": "10:00:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120828771,
                "idUnicoDocumento": "aa7df02",
                "identificadorUnico": "0de99d8a-c1e6-4b6a-bf61-aa6feaa7df02",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "MARCIA CARVALHO MASCARENHAS",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 313028,
                "criadoEm": "2024-11-26T12:15:25.079856",
                "juntadoEm": "2024-11-26T12:28:33.235338",
                "idProcesso": 684428,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120828771.pdf",
                "idBin": 120838480,
                "md5": "42c743ed4bc467ffc0ad4ce6345f4dd1",
                "dataInclusaoBin": "2024-11-26T12:15:25.077587",
                "tamanho": 89126,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 684428,
            "nrProcesso": "0010902-71.2022.5.03.0021"
        },
        {
            "id": 27871,
            "dataInicio": "2024-11-26T14:00:00",
            "dataFim": "2024-11-26T14:01:00",
            "salaAudiencia": {
                "nome": "SALA 2"
            },
            "status": "F",
            "processo": {
                "id": 700263,
                "numero": "0011059-86.2023.5.03.0028",
                "classeJudicial": {
                    "id": 547,
                    "codigo": "1003",
                    "descricao": "Agravo de Instrumento em Recurso Ordinário",
                    "sigla": "AIRO",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 252,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala2cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "DANILO HENRIQUE DE OLIVEIRA",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "BRASNORTE DISTRIBUIDORA DE BEBIDAS LTDA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27871,
                "horaInicial": "14:00:00",
                "horaFinal": "14:01:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120835634,
                "idUnicoDocumento": "e33ecd2",
                "identificadorUnico": "278b1a26-7206-4e12-829e-c1108e33ecd2",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "ALEXA MOREIRA DOS SANTOS GODINHO",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 7534,
                "criadoEm": "2024-11-26T14:10:11.35681",
                "juntadoEm": "2024-11-26T14:14:17.418439",
                "idProcesso": 700263,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120835634.pdf",
                "idBin": 120845343,
                "md5": "75af26029b44ae579f92368aaa326f4f",
                "dataInclusaoBin": "2024-11-26T14:10:11.330241",
                "tamanho": 73347,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 700263,
            "nrProcesso": "0011059-86.2023.5.03.0028"
        },
        {
            "id": 27867,
            "dataInicio": "2024-11-26T14:30:00",
            "dataFim": "2024-11-26T14:31:00",
            "salaAudiencia": {
                "nome": "SALA 5"
            },
            "status": "F",
            "processo": {
                "id": 716524,
                "numero": "0010989-34.2024.5.03.0093",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala5cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "NAGYSLA RODRIGUES SILVA",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "GUADALUPE SERVICOS ODONTOLOGICOS LTDA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27867,
                "horaInicial": "14:30:00",
                "horaFinal": "14:31:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120850506,
                "idUnicoDocumento": "117c7f7",
                "identificadorUnico": "13f0d80a-0aa5-43a8-9ee4-004c8117c7f7",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "MARCIA CARVALHO MASCARENHAS",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 313028,
                "criadoEm": "2024-11-26T16:57:15.676186",
                "juntadoEm": "2024-11-26T17:05:33.586815",
                "idProcesso": 716524,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120850506.pdf",
                "idBin": 120860220,
                "md5": "3e7449190c73f5867795f4ee7891dc2a",
                "dataInclusaoBin": "2024-11-26T16:57:15.670882",
                "tamanho": 73985,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 716524,
            "nrProcesso": "0010989-34.2024.5.03.0093"
        },
        {
            "id": 27878,
            "dataInicio": "2024-11-27T08:30:00",
            "dataFim": "2024-11-27T08:31:00",
            "salaAudiencia": {
                "nome": "SALA 5"
            },
            "status": "F",
            "processo": {
                "id": 722826,
                "numero": "0010889-25.2024.5.03.0111",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala5cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "PAULO CESAR CLAUDIO FILHO",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "UBER DO BRASIL TECNOLOGIA LTDA.",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27878,
                "horaInicial": "08:30:00",
                "horaFinal": "08:31:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120898431,
                "idUnicoDocumento": "a87fa03",
                "identificadorUnico": "816b065d-a398-4d40-8570-36084a87fa03",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "MARCIA CARVALHO MASCARENHAS",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 313028,
                "criadoEm": "2024-11-27T12:27:22.400733",
                "juntadoEm": "2024-11-27T12:32:07.04819",
                "idProcesso": 722826,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120898431.pdf",
                "idBin": 120908147,
                "md5": "bac94913ed8a100e891391deca711931",
                "dataInclusaoBin": "2024-11-27T12:27:22.398113",
                "tamanho": 88271,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 722826,
            "nrProcesso": "0010889-25.2024.5.03.0111"
        },
        {
            "id": 27879,
            "dataInicio": "2024-11-27T08:45:00",
            "dataFim": "2024-11-27T08:46:00",
            "salaAudiencia": {
                "nome": "SALA 5"
            },
            "status": "F",
            "processo": {
                "id": 723726,
                "numero": "0010836-19.2024.5.03.0184",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala5cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "MATHEUS FELIPE DA COSTA BEZERRA",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": true
            },
            "poloPassivo": {
                "nome": "MATHEUS FELIPE DA COSTA BEZERRA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": true
            },
            "pautaAudienciaHorario": {
                "id": 27879,
                "horaInicial": "08:45:00",
                "horaFinal": "08:46:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120898424,
                "idUnicoDocumento": "4d705cb",
                "identificadorUnico": "366046ea-2958-4d1e-b53d-db2704d705cb",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "MARCIA CARVALHO MASCARENHAS",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 313028,
                "criadoEm": "2024-11-27T12:27:15.537561",
                "juntadoEm": "2024-11-27T12:32:07.048189",
                "idProcesso": 723726,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120898424.pdf",
                "idBin": 120908140,
                "md5": "a871250549b9a8e4fcd307d6c3e5a9d5",
                "dataInclusaoBin": "2024-11-27T12:27:15.535619",
                "tamanho": 73426,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 723726,
            "nrProcesso": "0010836-19.2024.5.03.0184"
        },
        {
            "id": 27880,
            "dataInicio": "2024-11-27T09:00:00",
            "dataFim": "2024-11-27T09:01:00",
            "salaAudiencia": {
                "nome": "SALA 5"
            },
            "status": "F",
            "processo": {
                "id": 648382,
                "numero": "0011426-07.2023.5.03.0030",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala5cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "UBER DO BRASIL TECNOLOGIA LTDA.",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "JOSE HOMERO DE SOUZA JUNIOR",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27880,
                "horaInicial": "09:00:00",
                "horaFinal": "09:01:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120898423,
                "idUnicoDocumento": "aa68877",
                "identificadorUnico": "ccf9a34c-d70d-4de1-b7bb-24101aa68877",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "MARCIA CARVALHO MASCARENHAS",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 313028,
                "criadoEm": "2024-11-27T12:27:07.33576",
                "juntadoEm": "2024-11-27T12:32:07.048188",
                "idProcesso": 648382,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120898423.pdf",
                "idBin": 120908139,
                "md5": "16dfedd820f8843928b6ccf73a53dc8a",
                "dataInclusaoBin": "2024-11-27T12:27:07.332913",
                "tamanho": 74192,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 648382,
            "nrProcesso": "0011426-07.2023.5.03.0030"
        },
        {
            "id": 27881,
            "dataInicio": "2024-11-27T09:15:00",
            "dataFim": "2024-11-27T09:16:00",
            "salaAudiencia": {
                "nome": "SALA 5"
            },
            "status": "F",
            "processo": {
                "id": 680540,
                "numero": "0010306-64.2024.5.03.0006",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala5cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "UBER DO BRASIL TECNOLOGIA LTDA.",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "RICHARD ROBERT FRANCISCO GONCALVES",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27881,
                "horaInicial": "09:15:00",
                "horaFinal": "09:16:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120898420,
                "idUnicoDocumento": "32eea2f",
                "identificadorUnico": "32ec1438-6b93-42f6-89b2-5c8fb32eea2f",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "MARCIA CARVALHO MASCARENHAS",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 313028,
                "criadoEm": "2024-11-27T12:27:00.103097",
                "juntadoEm": "2024-11-27T12:32:07.048186",
                "idProcesso": 680540,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120898420.pdf",
                "idBin": 120908136,
                "md5": "804d2977843aa7e8a915babc8d33aed2",
                "dataInclusaoBin": "2024-11-27T12:27:00.099906",
                "tamanho": 74015,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 680540,
            "nrProcesso": "0010306-64.2024.5.03.0006"
        },
        {
            "id": 27902,
            "dataInicio": "2024-11-27T09:25:00",
            "dataFim": "2024-11-27T10:00:00",
            "salaAudiencia": {
                "nome": "SALA 3"
            },
            "status": "F",
            "processo": {
                "id": 691124,
                "numero": "0010913-06.2022.5.03.0020",
                "classeJudicial": {
                    "id": 254,
                    "codigo": "1004",
                    "descricao": "Agravo de Petição",
                    "sigla": "AP",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 252,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 43,
                "descricao": "Conciliação em Execução por videoconferência",
                "codigo": "7693",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala3cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "CHRISTIAN ALVES SOUZA",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "SITRAN SINALIZACAO DE TRANSITO INDUSTRIAL LTDA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": true
            },
            "pautaAudienciaHorario": {
                "id": 27902,
                "horaInicial": "09:25:00",
                "horaFinal": "10:00:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120885087,
                "idUnicoDocumento": "7ba5e4f",
                "identificadorUnico": "514babef-bbfd-46d3-9860-ca2927ba5e4f",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "FLAVIA MARIA DA SILVA COSTA",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 332008,
                "criadoEm": "2024-11-27T10:01:58.835794",
                "juntadoEm": "2024-11-27T10:16:36.679439",
                "idProcesso": 691124,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120885087.pdf",
                "idBin": 120894801,
                "md5": "e7876d636b686b0def8246ce8ff5d208",
                "dataInclusaoBin": "2024-11-27T10:01:58.807048",
                "tamanho": 73543,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 691124,
            "nrProcesso": "0010913-06.2022.5.03.0020"
        },
        {
            "id": 27884,
            "dataInicio": "2024-11-27T09:30:00",
            "dataFim": "2024-11-27T09:31:00",
            "salaAudiencia": {
                "nome": "SALA 5"
            },
            "status": "F",
            "processo": {
                "id": 680733,
                "numero": "0010360-06.2024.5.03.0111",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala5cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "UBER DO BRASIL TECNOLOGIA LTDA.",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "RONAN HUMBERTO DE ARAUJO NATALE",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27884,
                "horaInicial": "09:30:00",
                "horaFinal": "09:31:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120898345,
                "idUnicoDocumento": "c2314a7",
                "identificadorUnico": "35885fdc-69d7-4118-9928-83097c2314a7",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "MARCIA CARVALHO MASCARENHAS",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 313028,
                "criadoEm": "2024-11-27T12:26:52.540717",
                "juntadoEm": "2024-11-27T12:32:07.048184",
                "idProcesso": 680733,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120898345.pdf",
                "idBin": 120908061,
                "md5": "64f9bd5a8444868ca6edf1816f0c5626",
                "dataInclusaoBin": "2024-11-27T12:26:52.537956",
                "tamanho": 73940,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 680733,
            "nrProcesso": "0010360-06.2024.5.03.0111"
        },
        {
            "id": 27882,
            "dataInicio": "2024-11-27T09:45:00",
            "dataFim": "2024-11-27T09:46:00",
            "salaAudiencia": {
                "nome": "SALA 5"
            },
            "status": "F",
            "processo": {
                "id": 672207,
                "numero": "0010103-60.2024.5.03.0020",
                "classeJudicial": {
                    "id": 886,
                    "codigo": "11886",
                    "descricao": "Recurso Ordinário - Rito Sumaríssimo",
                    "sigla": "RORSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 251,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 151,
                    "descricao": "CEJUSC-JT 2º grau",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 42,
                "descricao": "Conciliação em Conhecimento por videoconferência",
                "codigo": "7692",
                "isVirtual": false
            },
            "designada": false,
            "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/sala5cejusc2",
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "UBER DO BRASIL TECNOLOGIA LTDA.",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "WAGNER ALVES DA SILVA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 27882,
                "horaInicial": "09:45:00",
                "horaFinal": "09:46:00"
            },
            "statusDescricao": "Realizada",
            "ataDocumento": {
                "id": 120898344,
                "idUnicoDocumento": "1d08402",
                "identificadorUnico": "97ecd1ba-e420-4ec3-bce2-7e2ec1d08402",
                "idTipoDocumento": 93,
                "titulo": "Ata da Audiência",
                "tipo": "Ata da Audiência",
                "idTipo": 93,
                "codigoTipoDocumento": "7298",
                "criador": "MARCIA CARVALHO MASCARENHAS",
                "signatario": "ANDREA RODRIGUES DE MORAIS",
                "idPessoaInclusao": 313028,
                "criadoEm": "2024-11-27T12:26:46.472855",
                "juntadoEm": "2024-11-27T12:32:07.048183",
                "idProcesso": 672207,
                "processoEmSegredo": false,
                "assinado": true,
                "apreciado": false,
                "sigiloso": false,
                "tipoArquivo": "PDF",
                "documentoApreciavel": false,
                "ativo": true,
                "numeroOrdem": 0,
                "nomeArquivo": "2º Grau-120898344.pdf",
                "idBin": 120908060,
                "md5": "80f0298bdc4cc4a587e374a8506b1648",
                "dataInclusaoBin": "2024-11-27T12:26:46.471059",
                "tamanho": 74254,
                "version": 2,
                "responder": false,
                "binario": true
            },
            "idProcesso": 672207,
            "nrProcesso": "0010103-60.2024.5.03.0020"
        }
    ]
}

---

ENDPOINT DO DOCUMENTO DE ATA DE AUDIENCIA REALIZADA

curl ^"https://pje.trt3.jus.br/pje-comum-api/api/processos/id/707878/documentos/id/120742838?incluirAssinatura=true^&incluirAnexos=false^" ^
  -H ^"accept: application/json, text/plain, */*^" ^
  -H ^"accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7^" ^
  -b ^"_ga=GA1.1.974651562.1753293362; _ga_89WP9Y8PMY=GS2.1.s1764091419^$o98^$g1^$t1764091434^$j45^$l0^$h0; ASSINADOR_PJE=PJEOFFICE; MO=PJEOFFICE; sso_refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI4ZmViYjJiOS0zYmIzLTQzZmItYTMxMS0xMjJmMmNlODIwNGUifQ.eyJleHAiOjE3NjQxMjA0MjYsImlhdCI6MTc2NDA5MTYyNiwianRpIjoiNjFhNmJjMzktMjUwOC00YzhlLWI4ZmMtZjkwZmE0NmQ4ZTgxIiwiaXNzIjoiaHR0cHM6Ly9zc28uY2xvdWQucGplLmp1cy5ici9hdXRoL3JlYWxtcy9wamUiLCJhdWQiOiJodHRwczovL3Nzby5jbG91ZC5wamUuanVzLmJyL2F1dGgvcmVhbG1zL3BqZSIsInN1YiI6ImIyOTc5ZWI2LTliZWItNGUzZC1iYmZiLTY1ODc2OTMxMWFkYSIsInR5cCI6IlJlZnJlc2giLCJhenAiOiJwamUtdHJ0My0yZyIsInNlc3Npb25fc3RhdGUiOiJlOGUxMTAwNy0zYTFjLTRjOWMtYjAxNC01ZWE3NTFhMzM1ODYiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic2lkIjoiZThlMTEwMDctM2ExYy00YzljLWIwMTQtNWVhNzUxYTMzNTg2In0.llG62KE7LM4OwuQWTvi5ggUkaOFKtftt4l9owihsU80; access_token=eyJraWQiOiJhNnZ5SVcydGhPTzJDMFBsZ0JaX0FWUmlweGJUazZkYlJvMUtaV3dfUlBNIiwiYWxnIjoiRVMyNTYifQ.eyJqdGkiOiIzODA0YjJiYy1lNTM1LTRlOWEtODZhMi0wODhjNjg2MDI2OTciLCJpc3MiOiJodHRwczovL3BqZS50cnQzLmp1cy5ici9wamUtc2VndXJhbmNhLyIsImlhdCI6MTc2NDA5MTYyNiwic3ViIjoiNDM1MDYwYmMtNDhiZC00ZTJmLTlmZGYtN2I0YzUwZGJiYjNlLnBqZSIsImV4cCI6MTc2NDA5NTIyNiwic2lnbGFTaXN0ZW1hIjoiUEpFIiwiaW5zdGFuY2lhIjoyLCJ0aXBvIjoiVVNVQVJJTyIsImlkIjoxMTI1NCwibG9naW4iOiIwNzUyOTI5NDYxMCIsIm5vbWUiOiJQRURSTyBaQVRUQVIgRVVHRU5JTyIsInBlcmZpbCI6NjQwNywicGFwZWwiOnsiaWQiOjEwMDUsIm5vbWUiOiJBZHZvZ2FkbyIsImlkZW50aWZpY2Fkb3IiOiJBRFZPR0FETyJ9LCJwYXBlbEt6Ijp7ImlkIjoxMCwibm9tZSI6IkFkdm9nYWRvIiwiaWRlbnRpZmljYWRvciI6IkFEVk9HQURPIn0sImxvY2FsaXphY2FvIjp7ImlkIjozOTEzLCJkZXNjcmljYW8iOiJQRURSTyBaQVRUQVIgRVVHRU5JTyAoMDc1LjI5Mi45NDYtMTApIn0sIm1ldG9kb0F1dGVudGljYWNhbyI6IkNFUlRJRklDQURPIiwic2lkIjoiZDc2NGVjMzctMzM1ZS00NWQxLWIxMTgtN2M5MGU5NDU0MjFjIiwib3JpZ2VtIjoiVFJUMyIsInVzdWFyaW9VbmlmaWNhZG8iOnRydWUsIm90cFBlcnNpc3RpZG8iOmZhbHNlfQ; access_token_footer=iBHN9JVYiHAXkpnt8TlOrOGKVrpcUlR-SCt9Ej_QWagD0CU8dRWPiLDUD_F6LX9IIMr5MTubjjj16N3xQK-hNw; refresh_token=eyJraWQiOiJhNnZ5SVcydGhPTzJDMFBsZ0JaX0FWUmlweGJUazZkYlJvMUtaV3dfUlBNIiwiYWxnIjoiRVMyNTYifQ.eyJqdGkiOiI5OTVlNGRkOC0zYjMwLTQwMmUtYWE2NC03NjQ3ZjVkZTVlMDIiLCJpc3MiOiJodHRwczovL3BqZS50cnQzLmp1cy5ici9wamUtc2VndXJhbmNhLyIsImlhdCI6MTc2NDA5MTYyNiwic3ViIjoiNDM1MDYwYmMtNDhiZC00ZTJmLTlmZGYtN2I0YzUwZGJiYjNlLnBqZSIsImV4cCI6MTc2NDEzNDgyNiwic2lnbGFTaXN0ZW1hIjoiUEpFIiwiaW5zdGFuY2lhIjoyLCJ0aXBvIjoiUkVGUkVTSF9UT0tFTiIsImxvZ2luIjoiMDc1MjkyOTQ2MTAiLCJwZXJmaWwiOjY0MDcsInNpZCI6ImQ3NjRlYzM3LTMzNWUtNDVkMS1iMTE4LTdjOTBlOTQ1NDIxYyIsIm1ldG9kb0F1dGVudGljYWNhbyI6IkNFUlRJRklDQURPIiwidXN1YXJpb1VuaWZpY2FkbyI6dHJ1ZSwib3JpZ2VtIjoiVFJUMyJ9.ko1SSvDkb1A-EwB-4bdPT_RzZPoGlcwhDMs4g153dSMuV1wirz08Ba1OtU8wb2JrJlw9GBxi7P5K9u4p7qufIA; Xsrf-Token=2E078F4DF276BAA91587017871398C8FF3AC25F112D133E649D728B6C9DC363D66E911FA78655F1C3156ACCBB4D361B79C0D^" ^
  -H ^"priority: u=1, i^" ^
  -H ^"referer: https://pje.trt3.jus.br/pjekz/pauta-usuarios-externos^" ^
  -H ^"sec-ch-ua: ^\^"Chromium^\^";v=^\^"142^\^", ^\^"Google Chrome^\^";v=^\^"142^\^", ^\^"Not_A Brand^\^";v=^\^"99^\^"^" ^
  -H ^"sec-ch-ua-mobile: ?0^" ^
  -H ^"sec-ch-ua-platform: ^\^"Windows^\^"^" ^
  -H ^"sec-fetch-dest: empty^" ^
  -H ^"sec-fetch-mode: cors^" ^
  -H ^"sec-fetch-site: same-origin^" ^
  -H ^"user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36^" ^
  -H ^"x-xsrf-token: 2E078F4DF276BAA91587017871398C8FF3AC25F112D133E649D728B6C9DC363D66E911FA78655F1C3156ACCBB4D361B79C0D^"

  ---

  RESPOSTA DO ENDPOINT DO DOCUMENTO DE ATA DE AUDIENCIA REALIZADA

  {
    "id": 120742838,
    "idUnicoDocumento": "befead1",
    "identificadorUnico": "665f6a63-33de-488c-88a8-80faebefead1",
    "idTipoDocumento": 93,
    "titulo": "Ata da Audiência",
    "tipo": "Ata da Audiência",
    "idTipo": 93,
    "codigoTipoDocumento": "7298",
    "criador": "ALEXA MOREIRA DOS SANTOS GODINHO",
    "signatario": "ANDREA RODRIGUES DE MORAIS",
    "idPessoaInclusao": 7534,
    "criadoEm": "2024-11-25T09:35:44.335721",
    "juntadoEm": "2024-11-25T09:38:06.891445",
    "idProcesso": 707878,
    "processoEmSegredo": false,
    "assinado": true,
    "apreciado": true,
    "sigiloso": false,
    "tipoArquivo": "PDF",
    "dadosAssinatura": {
        "signatario": "ANDREA RODRIGUES DE MORAIS",
        "responsavelCertificado": "ANDREA RODRIGUES DE MORAIS:30835799",
        "commonName": "CN=ANDREA RODRIGUES DE MORAIS:30835799,OU=MAGISTRADO,OU=PODER JUDICIARIO,OU=Cert-JUS Magistrado - A3,OU=Certificado Digital,OU=Renovacao Eletronica,OU=Autoridade Certificadora da Justica - AC-JUS,O=ICP-Brasil,C=BR",
        "emissor": "CN=AC SOLUTI-JUS v5,OU=SMIME,OU=Autoridade Certificadora da Justica v5,O=ICP-Brasil,C=BR",
        "data": "2024-11-25T09:38:06.891",
        "tipoAssinador": "SHODO",
        "assinatura": "bJhO0rqmepxD8hMvjC16oEfrGVQi0aHKWdVzgqSN0DSVu9kTwkD38WWRmG6/8wHoJHd78j3P4ssAHAqp4uTH6XDUlLM7Ka+e1kJM9KfBnS1w5ulP0ehx3bLV6/ag0fgv5yydgqxDR4mjU/lygiXPQw5i6MOen6Uo4Zj7NRKX0/25JCoCv9jclBGl0n17dzLIzBUL76ajjXVq4V2DrIcNNiIZzimqhevWC8zZahrb/2UyEylv2B130OBOTTkfWn7k9sOaKurpKo9sZPUhBDJn3aGczjFl/L4oTOD5UFk0y94UNC1jiKJ9faYEnmbfyvAfrgiMayfrjSMmT2SR+nu9BA==",
        "algoritmoDigest": "SHA256withRSA",
        "certChain": "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",
        "tipoAssinaturaDocumento": "ADRB_PADES_11",
        "algoritmoAssinatura": "MD5withRSA"
    },
    "documentoApreciavel": false,
    "ativo": true,
    "numeroOrdem": 0,
    "nomeArquivo": "2º Grau-120742838.pdf",
    "idBin": 120752516,
    "md5": "a90ab5a51c86b173ab880fc980e666fd",
    "dataInclusaoBin": "2024-11-25T09:35:44.332912",
    "tamanho": 76615,
    "version": 2,
    "responder": false,
    "numComentariosNaoLidos": 0,
    "pendenteAnaliseMagistrado": false,
    "apreciadoPor": "ISABELA CRUZ MARQUES em 15/04/2025 13:49",
    "binario": true
}

---

ENDPOINT PARA VALIDAÇÃO DA ATA DE AUDIENCIA REALIZADA

curl ^"https://pje.trt3.jus.br/pje-comum-api/api/assinaturas2/urlvalidacao?codigoDocumento=24112509354433200000120752516^" ^
  -H ^"accept: application/json, text/plain, */*^" ^
  -H ^"accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7^" ^
  -b ^"_ga=GA1.1.974651562.1753293362; _ga_89WP9Y8PMY=GS2.1.s1764091419^$o98^$g1^$t1764091434^$j45^$l0^$h0; ASSINADOR_PJE=PJEOFFICE; MO=PJEOFFICE; sso_refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI4ZmViYjJiOS0zYmIzLTQzZmItYTMxMS0xMjJmMmNlODIwNGUifQ.eyJleHAiOjE3NjQxMjA0MjYsImlhdCI6MTc2NDA5MTYyNiwianRpIjoiNjFhNmJjMzktMjUwOC00YzhlLWI4ZmMtZjkwZmE0NmQ4ZTgxIiwiaXNzIjoiaHR0cHM6Ly9zc28uY2xvdWQucGplLmp1cy5ici9hdXRoL3JlYWxtcy9wamUiLCJhdWQiOiJodHRwczovL3Nzby5jbG91ZC5wamUuanVzLmJyL2F1dGgvcmVhbG1zL3BqZSIsInN1YiI6ImIyOTc5ZWI2LTliZWItNGUzZC1iYmZiLTY1ODc2OTMxMWFkYSIsInR5cCI6IlJlZnJlc2giLCJhenAiOiJwamUtdHJ0My0yZyIsInNlc3Npb25fc3RhdGUiOiJlOGUxMTAwNy0zYTFjLTRjOWMtYjAxNC01ZWE3NTFhMzM1ODYiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic2lkIjoiZThlMTEwMDctM2ExYy00YzljLWIwMTQtNWVhNzUxYTMzNTg2In0.llG62KE7LM4OwuQWTvi5ggUkaOFKtftt4l9owihsU80; access_token=eyJraWQiOiJhNnZ5SVcydGhPTzJDMFBsZ0JaX0FWUmlweGJUazZkYlJvMUtaV3dfUlBNIiwiYWxnIjoiRVMyNTYifQ.eyJqdGkiOiIzODA0YjJiYy1lNTM1LTRlOWEtODZhMi0wODhjNjg2MDI2OTciLCJpc3MiOiJodHRwczovL3BqZS50cnQzLmp1cy5ici9wamUtc2VndXJhbmNhLyIsImlhdCI6MTc2NDA5MTYyNiwic3ViIjoiNDM1MDYwYmMtNDhiZC00ZTJmLTlmZGYtN2I0YzUwZGJiYjNlLnBqZSIsImV4cCI6MTc2NDA5NTIyNiwic2lnbGFTaXN0ZW1hIjoiUEpFIiwiaW5zdGFuY2lhIjoyLCJ0aXBvIjoiVVNVQVJJTyIsImlkIjoxMTI1NCwibG9naW4iOiIwNzUyOTI5NDYxMCIsIm5vbWUiOiJQRURSTyBaQVRUQVIgRVVHRU5JTyIsInBlcmZpbCI6NjQwNywicGFwZWwiOnsiaWQiOjEwMDUsIm5vbWUiOiJBZHZvZ2FkbyIsImlkZW50aWZpY2Fkb3IiOiJBRFZPR0FETyJ9LCJwYXBlbEt6Ijp7ImlkIjoxMCwibm9tZSI6IkFkdm9nYWRvIiwiaWRlbnRpZmljYWRvciI6IkFEVk9HQURPIn0sImxvY2FsaXphY2FvIjp7ImlkIjozOTEzLCJkZXNjcmljYW8iOiJQRURSTyBaQVRUQVIgRVVHRU5JTyAoMDc1LjI5Mi45NDYtMTApIn0sIm1ldG9kb0F1dGVudGljYWNhbyI6IkNFUlRJRklDQURPIiwic2lkIjoiZDc2NGVjMzctMzM1ZS00NWQxLWIxMTgtN2M5MGU5NDU0MjFjIiwib3JpZ2VtIjoiVFJUMyIsInVzdWFyaW9VbmlmaWNhZG8iOnRydWUsIm90cFBlcnNpc3RpZG8iOmZhbHNlfQ; access_token_footer=iBHN9JVYiHAXkpnt8TlOrOGKVrpcUlR-SCt9Ej_QWagD0CU8dRWPiLDUD_F6LX9IIMr5MTubjjj16N3xQK-hNw; refresh_token=eyJraWQiOiJhNnZ5SVcydGhPTzJDMFBsZ0JaX0FWUmlweGJUazZkYlJvMUtaV3dfUlBNIiwiYWxnIjoiRVMyNTYifQ.eyJqdGkiOiI5OTVlNGRkOC0zYjMwLTQwMmUtYWE2NC03NjQ3ZjVkZTVlMDIiLCJpc3MiOiJodHRwczovL3BqZS50cnQzLmp1cy5ici9wamUtc2VndXJhbmNhLyIsImlhdCI6MTc2NDA5MTYyNiwic3ViIjoiNDM1MDYwYmMtNDhiZC00ZTJmLTlmZGYtN2I0YzUwZGJiYjNlLnBqZSIsImV4cCI6MTc2NDEzNDgyNiwic2lnbGFTaXN0ZW1hIjoiUEpFIiwiaW5zdGFuY2lhIjoyLCJ0aXBvIjoiUkVGUkVTSF9UT0tFTiIsImxvZ2luIjoiMDc1MjkyOTQ2MTAiLCJwZXJmaWwiOjY0MDcsInNpZCI6ImQ3NjRlYzM3LTMzNWUtNDVkMS1iMTE4LTdjOTBlOTQ1NDIxYyIsIm1ldG9kb0F1dGVudGljYWNhbyI6IkNFUlRJRklDQURPIiwidXN1YXJpb1VuaWZpY2FkbyI6dHJ1ZSwib3JpZ2VtIjoiVFJUMyJ9.ko1SSvDkb1A-EwB-4bdPT_RzZPoGlcwhDMs4g153dSMuV1wirz08Ba1OtU8wb2JrJlw9GBxi7P5K9u4p7qufIA; Xsrf-Token=2E078F4DF276BAA91587017871398C8FF3AC25F112D133E649D728B6C9DC363D66E911FA78655F1C3156ACCBB4D361B79C0D^" ^
  -H ^"priority: u=1, i^" ^
  -H ^"referer: https://pje.trt3.jus.br/pjekz/pauta-usuarios-externos^" ^
  -H ^"sec-ch-ua: ^\^"Chromium^\^";v=^\^"142^\^", ^\^"Google Chrome^\^";v=^\^"142^\^", ^\^"Not_A Brand^\^";v=^\^"99^\^"^" ^
  -H ^"sec-ch-ua-mobile: ?0^" ^
  -H ^"sec-ch-ua-platform: ^\^"Windows^\^"^" ^
  -H ^"sec-fetch-dest: empty^" ^
  -H ^"sec-fetch-mode: cors^" ^
  -H ^"sec-fetch-site: same-origin^" ^
  -H ^"user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36^" ^
  -H ^"x-xsrf-token: 2E078F4DF276BAA91587017871398C8FF3AC25F112D133E649D728B6C9DC363D66E911FA78655F1C3156ACCBB4D361B79C0D^"

  ---

  RETORNO DO ENDOPOINT PARA VALIDAÇÃO DA ATA DE AUDIENCIA REALIZADA

https: //pje.trt3.jus.br/pjekz/validacao/24112509354433200000120752516?instancia=2

---

ENDPOINT PARA O RETORNO DO CONTEÚDO DO DOCUMENTO

curl ^"https://pje.trt3.jus.br/pje-comum-api/api/processos/id/707878/documentos/id/120742838/conteudo?incluirCapa=false^&incluirAssinatura=true^" ^
  -H ^"accept: application/pdf^" ^
  -H ^"accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7^" ^
  -b ^"_ga=GA1.1.974651562.1753293362; _ga_89WP9Y8PMY=GS2.1.s1764091419^$o98^$g1^$t1764091434^$j45^$l0^$h0; ASSINADOR_PJE=PJEOFFICE; MO=PJEOFFICE; sso_refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI4ZmViYjJiOS0zYmIzLTQzZmItYTMxMS0xMjJmMmNlODIwNGUifQ.eyJleHAiOjE3NjQxMjA0MjYsImlhdCI6MTc2NDA5MTYyNiwianRpIjoiNjFhNmJjMzktMjUwOC00YzhlLWI4ZmMtZjkwZmE0NmQ4ZTgxIiwiaXNzIjoiaHR0cHM6Ly9zc28uY2xvdWQucGplLmp1cy5ici9hdXRoL3JlYWxtcy9wamUiLCJhdWQiOiJodHRwczovL3Nzby5jbG91ZC5wamUuanVzLmJyL2F1dGgvcmVhbG1zL3BqZSIsInN1YiI6ImIyOTc5ZWI2LTliZWItNGUzZC1iYmZiLTY1ODc2OTMxMWFkYSIsInR5cCI6IlJlZnJlc2giLCJhenAiOiJwamUtdHJ0My0yZyIsInNlc3Npb25fc3RhdGUiOiJlOGUxMTAwNy0zYTFjLTRjOWMtYjAxNC01ZWE3NTFhMzM1ODYiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic2lkIjoiZThlMTEwMDctM2ExYy00YzljLWIwMTQtNWVhNzUxYTMzNTg2In0.llG62KE7LM4OwuQWTvi5ggUkaOFKtftt4l9owihsU80; access_token=eyJraWQiOiJhNnZ5SVcydGhPTzJDMFBsZ0JaX0FWUmlweGJUazZkYlJvMUtaV3dfUlBNIiwiYWxnIjoiRVMyNTYifQ.eyJqdGkiOiIzODA0YjJiYy1lNTM1LTRlOWEtODZhMi0wODhjNjg2MDI2OTciLCJpc3MiOiJodHRwczovL3BqZS50cnQzLmp1cy5ici9wamUtc2VndXJhbmNhLyIsImlhdCI6MTc2NDA5MTYyNiwic3ViIjoiNDM1MDYwYmMtNDhiZC00ZTJmLTlmZGYtN2I0YzUwZGJiYjNlLnBqZSIsImV4cCI6MTc2NDA5NTIyNiwic2lnbGFTaXN0ZW1hIjoiUEpFIiwiaW5zdGFuY2lhIjoyLCJ0aXBvIjoiVVNVQVJJTyIsImlkIjoxMTI1NCwibG9naW4iOiIwNzUyOTI5NDYxMCIsIm5vbWUiOiJQRURSTyBaQVRUQVIgRVVHRU5JTyIsInBlcmZpbCI6NjQwNywicGFwZWwiOnsiaWQiOjEwMDUsIm5vbWUiOiJBZHZvZ2FkbyIsImlkZW50aWZpY2Fkb3IiOiJBRFZPR0FETyJ9LCJwYXBlbEt6Ijp7ImlkIjoxMCwibm9tZSI6IkFkdm9nYWRvIiwiaWRlbnRpZmljYWRvciI6IkFEVk9HQURPIn0sImxvY2FsaXphY2FvIjp7ImlkIjozOTEzLCJkZXNjcmljYW8iOiJQRURSTyBaQVRUQVIgRVVHRU5JTyAoMDc1LjI5Mi45NDYtMTApIn0sIm1ldG9kb0F1dGVudGljYWNhbyI6IkNFUlRJRklDQURPIiwic2lkIjoiZDc2NGVjMzctMzM1ZS00NWQxLWIxMTgtN2M5MGU5NDU0MjFjIiwib3JpZ2VtIjoiVFJUMyIsInVzdWFyaW9VbmlmaWNhZG8iOnRydWUsIm90cFBlcnNpc3RpZG8iOmZhbHNlfQ; access_token_footer=iBHN9JVYiHAXkpnt8TlOrOGKVrpcUlR-SCt9Ej_QWagD0CU8dRWPiLDUD_F6LX9IIMr5MTubjjj16N3xQK-hNw; refresh_token=eyJraWQiOiJhNnZ5SVcydGhPTzJDMFBsZ0JaX0FWUmlweGJUazZkYlJvMUtaV3dfUlBNIiwiYWxnIjoiRVMyNTYifQ.eyJqdGkiOiI5OTVlNGRkOC0zYjMwLTQwMmUtYWE2NC03NjQ3ZjVkZTVlMDIiLCJpc3MiOiJodHRwczovL3BqZS50cnQzLmp1cy5ici9wamUtc2VndXJhbmNhLyIsImlhdCI6MTc2NDA5MTYyNiwic3ViIjoiNDM1MDYwYmMtNDhiZC00ZTJmLTlmZGYtN2I0YzUwZGJiYjNlLnBqZSIsImV4cCI6MTc2NDEzNDgyNiwic2lnbGFTaXN0ZW1hIjoiUEpFIiwiaW5zdGFuY2lhIjoyLCJ0aXBvIjoiUkVGUkVTSF9UT0tFTiIsImxvZ2luIjoiMDc1MjkyOTQ2MTAiLCJwZXJmaWwiOjY0MDcsInNpZCI6ImQ3NjRlYzM3LTMzNWUtNDVkMS1iMTE4LTdjOTBlOTQ1NDIxYyIsIm1ldG9kb0F1dGVudGljYWNhbyI6IkNFUlRJRklDQURPIiwidXN1YXJpb1VuaWZpY2FkbyI6dHJ1ZSwib3JpZ2VtIjoiVFJUMyJ9.ko1SSvDkb1A-EwB-4bdPT_RzZPoGlcwhDMs4g153dSMuV1wirz08Ba1OtU8wb2JrJlw9GBxi7P5K9u4p7qufIA; Xsrf-Token=2E078F4DF276BAA91587017871398C8FF3AC25F112D133E649D728B6C9DC363D66E911FA78655F1C3156ACCBB4D361B79C0D^" ^
  -H ^"priority: u=1, i^" ^
  -H ^"referer: https://pje.trt3.jus.br/pjekz/pauta-usuarios-externos^" ^
  -H ^"sec-ch-ua: ^\^"Chromium^\^";v=^\^"142^\^", ^\^"Google Chrome^\^";v=^\^"142^\^", ^\^"Not_A Brand^\^";v=^\^"99^\^"^" ^
  -H ^"sec-ch-ua-mobile: ?0^" ^
  -H ^"sec-ch-ua-platform: ^\^"Windows^\^"^" ^
  -H ^"sec-fetch-dest: empty^" ^
  -H ^"sec-fetch-mode: cors^" ^
  -H ^"sec-fetch-site: same-origin^" ^
  -H ^"user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36^" ^
  -H ^"x-xsrf-token: 2E078F4DF276BAA91587017871398C8FF3AC25F112D133E649D728B6C9DC363D66E911FA78655F1C3156ACCBB4D361B79C0D^"
