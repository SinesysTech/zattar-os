Request URL
https://pangeabnp.pdpj.jus.br/api/v1/precedentes
Request Method
POST
Status Code
200 OK
Remote Address
54.233.142.219:443
Referrer Policy
strict-origin-when-cross-origin
access-control-allow-origin
https://pangeabnp.pdpj.jus.br
content-length
18446
content-type
application/json
date
Fri, 02 Jan 2026 16:10:31 GMT
server
gunicorn
vary
Origin
:authority
pangeabnp.pdpj.jus.br
:method
POST
:path
/api/v1/precedentes
:scheme
https
accept
application/json, text/plain, */*
accept-encoding
gzip, deflate, br, zstd
accept-language
pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7
content-length
791
content-type
application/json
origin
https://pangeabnp.pdpj.jus.br
priority
u=1, i
referer
https://pangeabnp.pdpj.jus.br/pesquisa
sec-ch-ua
"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"Windows"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-origin
user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36


---

{"filtro":{"buscaGeral":"vínculo de emprego","todasPalavras":"","quaisquerPalavras":"","semPalavras":"","trechoExato":"","atualizacaoDesde":"","atualizacaoAte":"","cancelados":false,"ordenacao":"Text","nr":"","pagina":1,"tamanhoPagina":10,"orgaos":["STF","STJ","TST","STM","TNU","TRF01","TRF02","TRF03","TRF04","TRF05","TRF06","TJAC","TJAL","TJAP","TJAM","TJBA","TJCE","TJDF","TJES","TJGO","TJMA","TJMT","TJMS","TJMG","TJPA","TJPB","TJPR","TJPE","TJPI","TJRJ","TJRN","TJRS","TJRO","TJRR","TJSC","TJSP","TJSE","TJTO","TRT01","TRT02","TRT03","TRT04","TRT05","TRT06","TRT07","TRT08","TRT09","TRT10","TRT11","TRT12","TRT13","TRT14","TRT15","TRT16","TRT17","TRT18","TRT19","TRT20","TRT21","TRT22","TRT23","TRT24"],"tipos":["SUM","SV","RG","IAC","SIRDR","RR","CT","IRDR","IRR","PUIL","NT","OJ"]}}

---

{
    "aggsEspecies": [
        {
            "tipo": "IRDR",
            "total": 207
        },
        {
            "tipo": "IRR",
            "total": 134
        },
        {
            "tipo": "SUM",
            "total": 122
        },
        {
            "tipo": "RG",
            "total": 115
        },
        {
            "tipo": "RR",
            "total": 95
        },
        {
            "tipo": "NT",
            "total": 73
        },
        {
            "tipo": "IAC",
            "total": 51
        },
        {
            "tipo": "PUIL",
            "total": 33
        },
        {
            "tipo": "CT",
            "total": 14
        },
        {
            "tipo": "SV",
            "total": 4
        },
        {
            "tipo": "OJ",
            "total": 9
        }
    ],
    "aggsOrgaos": [
        {
            "tipo": "STF",
            "total": 150
        },
        {
            "tipo": "TST",
            "total": 137
        },
        {
            "tipo": "STJ",
            "total": 130
        },
        {
            "tipo": "TRT04",
            "total": 65
        },
        {
            "tipo": "TNU",
            "total": 33
        },
        {
            "tipo": "TRT24",
            "total": 29
        },
        {
            "tipo": "TRT13",
            "total": 25
        },
        {
            "tipo": "TRT18",
            "total": 19
        },
        {
            "tipo": "TJSP",
            "total": 16
        },
        {
            "tipo": "TRT01",
            "total": 15
        },
        {
            "tipo": "TRT08",
            "total": 15
        },
        {
            "tipo": "TRT15",
            "total": 14
        },
        {
            "tipo": "TRT09",
            "total": 13
        },
        {
            "tipo": "TJPR",
            "total": 12
        },
        {
            "tipo": "TJPE",
            "total": 11
        },
        {
            "tipo": "TRT03",
            "total": 11
        },
        {
            "tipo": "TRT05",
            "total": 9
        },
        {
            "tipo": "TRT07",
            "total": 9
        },
        {
            "tipo": "TRT11",
            "total": 9
        },
        {
            "tipo": "TRT12",
            "total": 9
        },
        {
            "tipo": "TRT22",
            "total": 9
        },
        {
            "tipo": "TRT06",
            "total": 8
        },
        {
            "tipo": "TRT17",
            "total": 8
        },
        {
            "tipo": "TJGO",
            "total": 6
        },
        {
            "tipo": "TJMG",
            "total": 6
        },
        {
            "tipo": "TJSC",
            "total": 6
        },
        {
            "tipo": "TRF04",
            "total": 6
        },
        {
            "tipo": "TRT21",
            "total": 6
        },
        {
            "tipo": "TJBA",
            "total": 5
        },
        {
            "tipo": "TRF01",
            "total": 5
        },
        {
            "tipo": "TRT02",
            "total": 5
        },
        {
            "tipo": "TJAM",
            "total": 4
        },
        {
            "tipo": "TJPA",
            "total": 4
        },
        {
            "tipo": "TJRR",
            "total": 4
        },
        {
            "tipo": "TRF03",
            "total": 4
        },
        {
            "tipo": "TRT10",
            "total": 4
        },
        {
            "tipo": "TJDF",
            "total": 3
        },
        {
            "tipo": "TJES",
            "total": 3
        },
        {
            "tipo": "TJRS",
            "total": 3
        },
        {
            "tipo": "TRT14",
            "total": 3
        },
        {
            "tipo": "TRT16",
            "total": 3
        },
        {
            "tipo": "TRT20",
            "total": 3
        },
        {
            "tipo": "TRT23",
            "total": 3
        },
        {
            "tipo": "TJAC",
            "total": 2
        },
        {
            "tipo": "TJMS",
            "total": 2
        },
        {
            "tipo": "TJPB",
            "total": 2
        },
        {
            "tipo": "TJPI",
            "total": 2
        },
        {
            "tipo": "TRF06",
            "total": 2
        },
        {
            "tipo": "TJCE",
            "total": 1
        },
        {
            "tipo": "TJMT",
            "total": 1
        },
        {
            "tipo": "TJRJ",
            "total": 1
        },
        {
            "tipo": "TJRN",
            "total": 1
        },
        {
            "tipo": "TJTO",
            "total": 1
        }
    ],
    "posicao_final": 10,
    "posicao_inicial": 1,
    "resultados": [
        {
            "highlight": {
                "questao": "Pejotiza\u00e7\u00e3o. <mark>V\u00ednculo</mark> de <mark>emprego</mark>. Contrata\u00e7\u00e3o de artista como pessoa jur\u00eddica."
            },
            "id": "trt01-irdr-9",
            "nr": 9,
            "orgao": "TRT01",
            "possuiDecisoes": true,
            "processosParadigma": [
                {
                    "link": "https://pje.trt1.jus.br/consultaprocessual/detalhe-processo/0101129-06.2017.5.01.0000/2#de579ca",
                    "numero": "01011290620175010000"
                }
            ],
            "questao": "Pejotiza\u00e7\u00e3o. V\u00ednculo de emprego. Contrata\u00e7\u00e3o de artista como pessoa jur\u00eddica.",
            "situacao": "Transitado em julgado",
            "tipo": "IRDR",
            "ultimaAtualizacao": "22/03/2025"
        },
        {
            "highlight": {
                "questao": "CONTRIBUI\u00c7\u00c3O PREVIDENCI\u00c1RIA. ACORDO HOMOLOGADO EM JU\u00cdZO SEM RECONHECIMENTO DE <mark>V\u00cdNCULO</mark> DE <mark>EMPREGO</mark>.",
                "tese": "Nos acordos homologados em ju\u00edzo em que n\u00e3o haja o reconhecimento de <mark>v\u00ednculo</mark> empregat\u00edcio, \u00e9 devido o recolhimento da contribui\u00e7\u00e3o previdenci\u00e1ria, mediante a al\u00edquota de 20% a cargo do tomador de servi\u00e7os e de 11% por parte do prestador de servi\u00e7os, na qualidade de contribuinte individual, sobre o valor total do acordo, respeitado o teto de contribui\u00e7\u00e3o. Intelig\u00eancia do \u00a7 4\u00ba do art. 30 e do inciso III do art. 22, todos da Lei n.\u00ba 8.212, de 24.07.1991. Nem mesmo a previs\u00e3o de que o valor ajustado refere-se a indeniza\u00e7\u00e3o civil afasta a incid\u00eancia das contribui\u00e7\u00f5es devidas \u00e0 Previd\u00eancia Social. (Reafirma\u00e7\u00e3o da OJ n\u00ba 398 da SBDI-1 do TST)"
            },
            "id": "tst-irr-310",
            "nr": 310,
            "orgao": "TST",
            "possuiDecisoes": true,
            "processosParadigma": [
                {
                    "link": "https://pje.tst.jus.br/consultaprocessual/detalhe-processo/00205635120225040731",
                    "numero": "00205635120225040731"
                }
            ],
            "questao": "CONTRIBUI\u00c7\u00c3O PREVIDENCI\u00c1RIA. ACORDO HOMOLOGADO EM JU\u00cdZO SEM RECONHECIMENTO DE V\u00cdNCULO DE EMPREGO.",
            "situacao": "Ac\u00f3rd\u00e3o Publicado",
            "tese": "Nos acordos homologados em ju\u00edzo em que n\u00e3o haja o reconhecimento de v\u00ednculo empregat\u00edcio, \u00e9 devido o recolhimento da contribui\u00e7\u00e3o previdenci\u00e1ria, mediante a al\u00edquota de 20% a cargo do tomador de servi\u00e7os e de 11% por parte do prestador de servi\u00e7os, na qualidade de contribuinte individual, sobre o valor total do acordo, respeitado o teto de contribui\u00e7\u00e3o. Intelig\u00eancia do \u00a7 4\u00ba do art. 30 e do inciso III do art. 22, todos da Lei n.\u00ba 8.212, de 24.07.1991. Nem mesmo a previs\u00e3o de que o valor ajustado refere-se a indeniza\u00e7\u00e3o civil afasta a incid\u00eancia das contribui\u00e7\u00f5es devidas \u00e0 Previd\u00eancia Social. (Reafirma\u00e7\u00e3o da OJ n\u00ba 398 da SBDI-1 do TST)",
            "tipo": "IRR",
            "ultimaAtualizacao": "22/09/2025"
        },
        {
            "highlight": {
                "questao": "Deve ser aplicada a multa do artigo 467 da CLT quando impugnado em contesta\u00e7\u00e3o o <mark>v\u00ednculo</mark> empregat\u00edcio, se posteriormente reconhecida sua exist\u00eancia em ju\u00edzo?",
                "tese": "\u00c9 indevida a multa do art. 467 da CLT no caso de reconhecimento em ju\u00edzo de <mark>v\u00ednculo</mark> de <mark>emprego</mark>, quando impugnada em defesa a natureza da rela\u00e7\u00e3o jur\u00eddica."
            },
            "id": "tst-irr-120",
            "nr": 120,
            "orgao": "TST",
            "possuiDecisoes": true,
            "processosParadigma": [
                {
                    "link": "https://pje.tst.jus.br/consultaprocessual/detalhe-processo/0000427-62.2022.5.05.0195/3#e4356b6",
                    "numero": "00004276220225020195"
                }
            ],
            "questao": "Deve ser aplicada a multa do artigo 467 da CLT quando impugnado em contesta\u00e7\u00e3o o v\u00ednculo empregat\u00edcio, se posteriormente reconhecida sua exist\u00eancia em ju\u00edzo?",
            "situacao": "Ac\u00f3rd\u00e3o Publicado",
            "tese": "\u00c9 indevida a multa do art. 467 da CLT no caso de reconhecimento em ju\u00edzo de v\u00ednculo de emprego, quando impugnada em defesa a natureza da rela\u00e7\u00e3o jur\u00eddica.",
            "tipo": "IRR",
            "ultimaAtualizacao": "03/06/2025"
        },
        {
            "highlight": {
                "questao": "IRDR-0012476-44.2023.5.18.0000 - \"MULTA PRESCRITA NO ART. 477, \u00a7 8\u00ba, DA CLT. <mark>V\u00cdNCULO</mark> DE <mark>EMPREGO</mark> OU RESCIS\u00c3O INDIRETA DO PACTO LABORAL RECONHECIDOS EM JU\u00cdZO.\"",
                "tese": "o Pleno deste e. Regional fixou a seguinte tese jur\u00eddica:<br>\"MULTA PRESCRITA NO ART. 477, \u00a7 8\u00ba, DA CLT. <mark>V\u00cdNCULO</mark> DE <mark>EMPREGO</mark> DECLARADO EM JU\u00cdZO. N\u00e3o afasta a incid\u00eancia da multa prescrita no artigo 477, \u00a7 8\u00ba da CLT o fato de o <mark>v\u00ednculo</mark> empregat\u00edcio ter sido declarado em Ju\u00edzo.\""
            },
            "id": "trt18-irdr-40",
            "nr": 40,
            "orgao": "TRT18",
            "possuiDecisoes": true,
            "processosParadigma": [
                {
                    "link": "https://pje.trt18.jus.br/consultaprocessual/detalhe-processo/0012476-44.2023.5.18.0000/2#1a6c3a1",
                    "numero": "00124764420235180000"
                }
            ],
            "questao": "IRDR-0012476-44.2023.5.18.0000 - \"MULTA PRESCRITA NO ART. 477, \u00a7 8\u00ba, DA CLT. V\u00cdNCULO DE EMPREGO OU RESCIS\u00c3O INDIRETA DO PACTO LABORAL RECONHECIDOS EM JU\u00cdZO.\"",
            "situacao": "Transitado em julgado",
            "tese": "o Pleno deste e. Regional fixou a seguinte tese jur\u00eddica:<br>\"MULTA PRESCRITA NO ART. 477, \u00a7 8\u00ba, DA CLT. V\u00cdNCULO DE EMPREGO DECLARADO EM JU\u00cdZO. N\u00e3o afasta a incid\u00eancia da multa prescrita no artigo 477, \u00a7 8\u00ba da CLT o fato de o v\u00ednculo empregat\u00edcio ter sido declarado em Ju\u00edzo.\"",
            "tipo": "IRDR",
            "ultimaAtualizacao": "20/05/2025"
        },
        {
            "highlight": {
                "questao": "O reconhecimento do <mark>v\u00ednculo</mark> de <mark>emprego</mark> em ju\u00edzo n\u00e3o obsta a aplica\u00e7\u00e3o da multa prevista no art. 477, \u00a7 8\u00ba, da CLT, salvo quando o <mark>empregado</mark> comprovadamente der causa \u00e0 mora.",
                "tese": "O reconhecimento do <mark>v\u00ednculo</mark> de <mark>emprego</mark> em ju\u00edzo n\u00e3o obsta a aplica\u00e7\u00e3o da multa prevista no art. 477, \u00a7 8\u00ba, da CLT, salvo quando o <mark>empregado</mark> comprovadamente der causa \u00e0 mora."
            },
            "id": "tst-irr-168",
            "nr": 168,
            "orgao": "TST",
            "possuiDecisoes": true,
            "processosParadigma": [
                {
                    "link": "https://pje.tst.jus.br/consultaprocessual/detalhe-processo/0001341-76.2023.5.12.0008/3#8980175",
                    "numero": "00013417620235120008"
                }
            ],
            "questao": "O reconhecimento do v\u00ednculo de emprego em ju\u00edzo n\u00e3o obsta a aplica\u00e7\u00e3o da multa prevista no art. 477, \u00a7 8\u00ba, da CLT, salvo quando o empregado comprovadamente der causa \u00e0 mora.",
            "situacao": "Ac\u00f3rd\u00e3o Publicado",
            "tese": "O reconhecimento do v\u00ednculo de emprego em ju\u00edzo n\u00e3o obsta a aplica\u00e7\u00e3o da multa prevista no art. 477, \u00a7 8\u00ba, da CLT, salvo quando o empregado comprovadamente der causa \u00e0 mora.",
            "tipo": "IRR",
            "ultimaAtualizacao": "22/09/2025"
        },
        {
            "highlight": {
                "tese": "CONTRIBUI\u00c7\u00d5ES PREVIDENCI\u00c1RIAS. ACORDO SEM <mark>V\u00cdNCULO</mark> DE <mark>EMPREGO</mark>. Incide contribui\u00e7\u00e3o previdenci\u00e1ria, observada a al\u00edquota pr\u00f3pria, quando firmado acordo sem reconhecimento de <mark>v\u00ednculo</mark> empregat\u00edcio, mas com presta\u00e7\u00e3o de trabalho e o tomador for empresa ou a ela equiparada na condi\u00e7\u00e3o de contribuinte individual na forma do par\u00e1grafo \u00fanico do artigo 15 da lei 8.212/91."
            },
            "id": "trt04-sum-41",
            "nr": 41,
            "orgao": "TRT04",
            "processosParadigma": [
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus2/bqi0sxjLm5xHSLxOZexxtg",
                    "numero": "01058008619985040701"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus2/F8yVrsZPTV9PEJLaYZBkkA",
                    "numero": "00516002720015040701"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus2/bxUXftVe7PZjnwPK-nBA0Q",
                    "numero": "00769003519945040701"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/2inZ8n76Z3sK2h4ibm8LPw",
                    "numero": "00986007920035040304"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/FOlyao5ia04yR-aoknkhqw",
                    "numero": "00447008620015040811"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/I1hrLOuW7Hm4X4AvNBdaCA",
                    "numero": "00375004720025040761"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/kIaXhD0Ivb9BpbsqiUsMOA",
                    "numero": "00518008420035040403"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/22nX4cdCd9R01LqPpvKxrA",
                    "numero": "00297004920025040831"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/5-eOke5r9Oa2XqpAOPKHRw",
                    "numero": "01074004120025040851"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/6KdEdwIzTABQ3ozwMefhqQ",
                    "numero": "80102005520035040561"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/K79YNBTywL3nMJu9n6nlRg",
                    "numero": "00574002320025040015"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/6y38u6ZN1Ag7kz69oSpjSg",
                    "numero": "01819009320035040382"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/9ifO_ZSif0t63Kp6QVVPsg",
                    "numero": "01245002420035040382"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/X1gzNSGQ2o4Qlm8II-JTQg",
                    "numero": "00006004120035040402"
                },
                {
                    "link": "https://pesquisatextual.trt4.jus.br/pesquisas/rest/cache/acordao/ejus1/LrBMHreIZnwsFBiqcUmJUw",
                    "numero": "01316003320035040381"
                }
            ],
            "situacao": "Vigente",
            "tese": "CONTRIBUI\u00c7\u00d5ES PREVIDENCI\u00c1RIAS. ACORDO SEM V\u00cdNCULO DE EMPREGO. Incide contribui\u00e7\u00e3o previdenci\u00e1ria, observada a al\u00edquota pr\u00f3pria, quando firmado acordo sem reconhecimento de v\u00ednculo empregat\u00edcio, mas com presta\u00e7\u00e3o de trabalho e o tomador for empresa ou a ela equiparada na condi\u00e7\u00e3o de contribuinte individual na forma do par\u00e1grafo \u00fanico do artigo 15 da lei 8.212/91.",
            "tipo": "SUM",
            "ultimaAtualizacao": "13/09/2023"
        },
        {
            "highlight": {
                "questao": "N\u00e3o compete \u00e0 Justi\u00e7a do Trabalho determinar, ao Instituto Nacional do Seguro Social (INSS), que proceda altera\u00e7\u00e3o, junto ao cadastro do CNIS, de registro de <mark>v\u00ednculo</mark> empregat\u00edcio?",
                "tese": "A Justi\u00e7a do Trabalho \u00e9 competente para determinar a atualiza\u00e7\u00e3o ou retifica\u00e7\u00e3o dos dados do trabalhador no Cadastro Nacional de Informa\u00e7\u00f5es Sociais (CNIS), quando decorrentes do reconhecimento de <mark>v\u00ednculo</mark> de <mark>emprego</mark>."
            },
            "id": "trt22-irdr-23",
            "nr": 23,
            "orgao": "TRT22",
            "possuiDecisoes": true,
            "questao": "N\u00e3o compete \u00e0 Justi\u00e7a do Trabalho determinar, ao Instituto Nacional do Seguro Social (INSS), que proceda altera\u00e7\u00e3o, junto ao cadastro do CNIS, de registro de v\u00ednculo empregat\u00edcio?",
            "situacao": "M\u00e9rito julgado",
            "suspensoes": [
                {
                    "ativa": true,
                    "dataSuspensao": "03/06/2025",
                    "descricao": "Abrang\u00eancia espec\u00edfica",
                    "linkDecisao": "https://pje.trt22.jus.br/consultaprocessual/detalhe-processo/0081058-17.2025.5.22.0000/2#f853ddb"
                }
            ],
            "tese": "A Justi\u00e7a do Trabalho \u00e9 competente para determinar a atualiza\u00e7\u00e3o ou retifica\u00e7\u00e3o dos dados do trabalhador no Cadastro Nacional de Informa\u00e7\u00f5es Sociais (CNIS), quando decorrentes do reconhecimento de v\u00ednculo de emprego.",
            "tipo": "IRDR",
            "ultimaAtualizacao": "31/07/2025"
        },
        {
            "highlight": {
                "tese": "[Decis\u00e3o]: TESE FIRMADA<br>[Teor da decis\u00e3o]: MUNIC\u00cdPIO DE PONTA GROSSA. EDITAL 003/2014. CONCURSO PARA GUARDA MUNICIPAL. <mark>V\u00cdNCULO</mark> DE <mark>EMPREGO</mark> RECONHECIDO DESDE O CURSO DE FORMA\u00c7\u00c3O. Em que pese constar do Edital o \"curso de forma\u00e7\u00e3o\" como 6\u00aa fase do certame, h\u00e1 que se interpretar o lapso temporal a ele destinado \u00e0 luz do princ\u00edpio da primazia da realidade, das previs\u00f5es dos artigos 2\u00ba e 3\u00ba da CLT, bem como das dic\u00e7\u00f5es das pr\u00f3prias Leis Municipais e da Lei Federal 13.022/2014 - que disp\u00f5e sobre o Estatuto Geral das Guardas Municipais -, a fim de reconhecer a exist\u00eancia de <mark>v\u00ednculo</mark> de <mark>emprego</mark> j\u00e1 a partir do ingresso no \"curso de forma\u00e7\u00e3o\".",
                "tese_snippet": "(...) [Decis\u00e3o]: TESE FIRMADA [Teor da decis\u00e3o]: MUNIC\u00cdPIO DE PONTA GROSSA. EDITAL 003/2014. CONCURSO PARA GUARDA MUNICIPAL. <mark>V\u00cdNCULO</mark> DE <mark>EMPREGO</mark> RECONHECIDO DESDE O CURSO DE FORMA\u00c7\u00c3O. Em que pese constar do Edital o \"curso de forma\u00e7\u00e3o\" como 6\u00aa (...) 13.022/2014 - que disp\u00f5e sobre o Estatuto Geral das Guardas Municipais -, a fim de reconhecer a exist\u00eancia de <mark>v\u00ednculo</mark> de <mark>emprego</mark> j\u00e1 a partir do ingresso no \"curso de forma\u00e7\u00e3o\". (...)"
            },
            "id": "trt09-irdr-15",
            "nr": 15,
            "orgao": "TRT09",
            "possuiDecisoes": true,
            "processosParadigma": [
                {
                    "link": "https://pje.trt9.jus.br/consultaprocessual/detalhe-processo/0001582-92.2022.5.09.0000/2#e8c7bc6",
                    "numero": "00015829220225090000"
                }
            ],
            "questao": "Natureza da rela\u00e7\u00e3o contratual durante o curso de forma\u00e7\u00e3o para guarda civil do Munic\u00edpio de Ponta Grossa \u00e0 luz do Edital n\u00ba 003/2014.",
            "situacao": "Transitado em julgado",
            "suspensoes": [
                {
                    "ativa": true,
                    "dataSuspensao": "05/05/2023",
                    "descricao": "Abrang\u00eancia espec\u00edfica",
                    "linkDecisao": "https://pje.trt9.jus.br/consultaprocessual/detalhe-processo/0001582-92.2022.5.09.0000/2#5c9d93d"
                }
            ],
            "tese": "[Decis\u00e3o]: TESE FIRMADA<br>[Teor da decis\u00e3o]: MUNIC\u00cdPIO DE PONTA GROSSA. EDITAL 003/2014. CONCURSO PARA GUARDA MUNICIPAL. V\u00cdNCULO DE EMPREGO RECONHECIDO DESDE O CURSO DE FORMA\u00c7\u00c3O. Em que pese constar do Edital o \"curso de forma\u00e7\u00e3o\" como 6\u00aa fase do certame, h\u00e1 que se interpretar o lapso temporal a ele destinado \u00e0 luz do princ\u00edpio da primazia da realidade, das previs\u00f5es dos artigos 2\u00ba e 3\u00ba da CLT, bem como das dic\u00e7\u00f5es das pr\u00f3prias Leis Municipais e da Lei Federal 13.022/2014 - que disp\u00f5e sobre o Estatuto Geral das Guardas Municipais -, a fim de reconhecer a exist\u00eancia de v\u00ednculo de emprego j\u00e1 a partir do ingresso no \"curso de forma\u00e7\u00e3o\".",
            "tipo": "IRDR",
            "ultimaAtualizacao": "14/07/2025"
        },
        {
            "highlight": {
                "questao": "A aus\u00eancia de anota\u00e7\u00e3o da Carteira de Trabalho do <mark>empregado</mark>, por si s\u00f3, \u00e9 suficiente para configura\u00e7\u00e3o de dano moral?",
                "tese": "A aus\u00eancia de anota\u00e7\u00e3o do <mark>v\u00ednculo</mark> de <mark>emprego</mark> na Carteira de Trabalho n\u00e3o caracteriza dano moral in re ipsa, sendo necess\u00e1ria a comprova\u00e7\u00e3o de constrangimento ou preju\u00edzo sofrido pelo trabalhador em seu patrim\u00f4nio imaterial para ensejar a repara\u00e7\u00e3o civil, nos termos dos arts. 186 e 927 do C\u00f3digo Civil."
            },
            "id": "tst-irr-60",
            "nr": 60,
            "orgao": "TST",
            "possuiDecisoes": true,
            "processosParadigma": [
                {
                    "link": "https://pje.tst.jus.br/consultaprocessual/detalhe-processo/0020084-82.2022.5.04.0141/3#ecd0296",
                    "numero": "00200848220225040141"
                }
            ],
            "questao": "A aus\u00eancia de anota\u00e7\u00e3o da Carteira de Trabalho do empregado, por si s\u00f3, \u00e9 suficiente para configura\u00e7\u00e3o de dano moral?",
            "situacao": "Ac\u00f3rd\u00e3o Publicado",
            "tese": "A aus\u00eancia de anota\u00e7\u00e3o do v\u00ednculo de emprego na Carteira de Trabalho n\u00e3o caracteriza dano moral in re ipsa, sendo necess\u00e1ria a comprova\u00e7\u00e3o de constrangimento ou preju\u00edzo sofrido pelo trabalhador em seu patrim\u00f4nio imaterial para ensejar a repara\u00e7\u00e3o civil, nos termos dos arts. 186 e 927 do C\u00f3digo Civil.",
            "tipo": "IRR",
            "ultimaAtualizacao": "03/06/2025"
        },
        {
            "alertaSituacao": "n\u00e3o admitido",
            "highlight": {
                "questao": "Impossibilidade de pagamento de aviso pr\u00e9vio e 40% do FGTS, quando o fim do <mark>v\u00ednculo</mark> empregat\u00edcio se d\u00e1 em virtude da aposentadoria especial do trabalhador, situa\u00e7\u00e3o em que se considera a rela\u00e7\u00e3o de <mark>emprego</mark> extinta por iniciativa do <mark>empregado</mark>"
            },
            "id": "trt21-irdr-2",
            "nr": 2,
            "orgao": "TRT21",
            "processosParadigma": [
                {
                    "link": "https://pje.trt21.jus.br/consultaprocessual/detalhe-processo/0000598-13.2020.5.21.0011/2#09a1af3",
                    "numero": "00005981320205210011"
                }
            ],
            "questao": "Impossibilidade de pagamento de aviso pr\u00e9vio e 40% do FGTS, quando o fim do v\u00ednculo empregat\u00edcio se d\u00e1 em virtude da aposentadoria especial do trabalhador, situa\u00e7\u00e3o em que se considera a rela\u00e7\u00e3o de emprego extinta por iniciativa do empregado",
            "situacao": "N\u00e3o admitido",
            "tipo": "IRDR",
            "ultimaAtualizacao": "01/04/2025"
        }
    ],
    "total": 857
}

---

Logo do Pangea/BNP
Pesquisar precedentes
 Pesquisa avançada
Todas as Palavras
Usar esse campo para pesquisar documentos que contenham TODAS as palavras informadas.
Quaisquer das Palavras
Usar esse campo para pesquisar documentos que contenham PELO MENOS uma das palavras informadas.
Sem as Palavras
Usar esse campo para pesquisar documentos que NÃO contenham as palavras informadas.
Trecho(s) Exato(s)
Usar esse campo para pesquisar documentos que contenham uma frase ou expressão específica. Utilize aspas ou ponto e vírgula para pesquisar mais de uma expressão.
Exibir precedentes cancelados


---

a lista de tribunais é a maesma que ja consta no nosso banco de dados, apenas não mostrar tre, tse e tjms.

---

especies:

Filtrar por Espécies
Selecione uma ou mais espécies para filtrar sua busca

Todas

Súmula - SUM(122)

Súmula Vinculante - SV(4)

Tema de Repercussão Geral - Rep. Geral(115)

Incidente de Assunção de Competência - IAC(51)

Suspensão Nacional em Incidente de Resolução de Demandas Repetitivas - SIRDR(0)

Recurso Especial Repetitivo - REsp. Rep.(95)

Controvérsia - CT(14)

Incidente de Resolução de Demandas Repetitivas - IRDR(207)

Incidente de Recurso Repetitivo - IRR(134)

Pedido de Uniformização de Interpretação de Lei - PUIL(33)

Nota Técnica - NT(73)

Orientação Jurisprudencial - OJ(9)

desconsidere para implementação o numero entre ()

---

Ordenação
Selecione o modo de ordenação dos resultados
Textual
Cronológica Ascendente
Cronológica Descendente
Numérica Ascendente
Numérica Descendente

---

data range picker tambem para filtro com label data de atualização. 


