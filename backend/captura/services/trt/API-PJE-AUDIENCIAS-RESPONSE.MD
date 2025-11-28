ENDPOINT:

pje-comum-api/api/pauta-usuarios-externos?dataFim=2025-12-30&dataInicio=2025-11-28&codigoSituacao=M&numeroPagina=1&tamanhoPagina=2&ordenacao=asc

RESPONSE EXAMPLE:

{
    "pagina": 1,
    "tamanhoPagina": 2,
    "qtdPaginas": 1,
    "totalRegistros": 2,
    "resultado": [
        {
            "id": 684034,
            "dataInicio": "2025-12-04T10:00:00",
            "dataFim": "2025-12-04T10:10:00",
            "salaAudiencia": {
                "nome": "JUIZ  TITULAR (ACERVO PAR)"
            },
            "status": "M",
            "processo": {
                "id": 429078,
                "numero": "0001254-59.2025.5.13.0029",
                "classeJudicial": {
                    "id": 888,
                    "codigo": "12134",
                    "descricao": "Tutela Cautelar Antecedente",
                    "sigla": "TutCautAnt",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": false,
                    "podeIncluirAutoridade": false,
                    "ativo": true,
                    "idClasseJudicialPai": 891,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": false,
                "orgaoJulgador": {
                    "id": 69,
                    "descricao": "10ª Vara do Trabalho de João Pessoa",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 21,
                "descricao": "Una por videoconferência",
                "codigo": "7702",
                "isVirtual": false
            },
            "designada": false,
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "ADRIANO JOSE DA SILVA ARAUJO",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": true
            },
            "poloPassivo": {
                "nome": "99 TECNOLOGIA LTDA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": false
            },
            "pautaAudienciaHorario": {
                "id": 684034,
                "horaInicial": "10:00:00",
                "horaFinal": "10:10:00"
            },
            "prioridades": "Discriminação",
            "statusDescricao": "Designada",
            "nrProcesso": "0001254-59.2025.5.13.0029",
            "idProcesso": 429078
        },
        {
            "id": 691590,
            "dataInicio": "2025-12-09T15:40:00",
            "dataFim": "2025-12-09T15:50:00",
            "salaAudiencia": {
                "nome": "JUIZ SUBSTITUTO FIXO (ACERVO ÍMPAR)"
            },
            "status": "M",
            "processo": {
                "id": 436278,
                "numero": "0001527-38.2025.5.13.0029",
                "classeJudicial": {
                    "id": 608,
                    "codigo": "1125",
                    "descricao": "Ação Trabalhista - Rito Sumaríssimo",
                    "sigla": "ATSum",
                    "requerProcessoReferenciaCodigo": "NE",
                    "controlaValorCausa": true,
                    "podeIncluirAutoridade": false,
                    "pisoValorCausa": 3036.01,
                    "tetoValorCausa": 60720.0,
                    "ativo": true,
                    "idClasseJudicialPai": 593,
                    "possuiFilhos": false
                },
                "segredoDeJustica": false,
                "juizoDigital": true,
                "orgaoJulgador": {
                    "id": 69,
                    "descricao": "10ª Vara do Trabalho de João Pessoa",
                    "cejusc": false,
                    "ativo": false,
                    "postoAvancado": false,
                    "novoOrgaoJulgador": false,
                    "codigoServentiaCnj": 0
                }
            },
            "tipo": {
                "id": 27,
                "descricao": "Inicial por videoconferência (rito sumaríssimo)",
                "codigo": "7700",
                "isVirtual": false
            },
            "designada": false,
            "emAndamento": false,
            "documentoAtivo": false,
            "poloAtivo": {
                "nome": "TAMIRES CARDOSO DA SILVA",
                "polo": "ativo",
                "poloEnum": "ATIVO",
                "representaVarios": false
            },
            "poloPassivo": {
                "nome": "MAX ROCHA EMPREENDIMENTOS LTDA",
                "polo": "passivo",
                "poloEnum": "PASSIVO",
                "representaVarios": true
            },
            "pautaAudienciaHorario": {
                "id": 691590,
                "horaInicial": "15:40:00",
                "horaFinal": "15:50:00"
            },
            "statusDescricao": "Designada",
            "nrProcesso": "0001527-38.2025.5.13.0029",
            "idProcesso": 436278
        }
    ]
}