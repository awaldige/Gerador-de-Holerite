
/* =========================================================
   AW TECHNOLOGY — GERADOR DE HOLERITE
   Simulador demonstrativo | Referência: 2026
   ========================================================= */

"use strict";

/* =========================
   CONFIGURAÇÕES
========================= */

const CONFIG = {
    anoReferencia: 2026,

    inss: [
        { limite: 1621.00, aliquota: 0.075 },
        { limite: 2902.84, aliquota: 0.09 },
        { limite: 4354.27, aliquota: 0.12 },
        { limite: 8475.55, aliquota: 0.14 }
    ],

    tetoINSS: 8475.55,

    irrf: [
        { limite: 2428.80, aliquota: 0, deducao: 0 },
        { limite: 2826.65, aliquota: 0.075, deducao: 182.16 },
        { limite: 3751.05, aliquota: 0.15, deducao: 394.16 },
        { limite: 4664.68, aliquota: 0.225, deducao: 675.49 },
        { limite: Infinity, aliquota: 0.275, deducao: 908.73 }
    ],

    deducaoDependente: 189.59,
    descontoSimplificado: 607.20,

    limiteSalarioFamilia: 1980.38,
    valorSalarioFamilia: 67.54
};

/* =========================
   FUNÇÕES BÁSICAS
========================= */

const porId = id => document.getElementById(id);

function valorCampo(id) {
    const campo = porId(id);

    if (!campo) return 0;

    const valor = String(campo.value || "").trim();

    if (!valor) return 0;

    let numero;

    if (valor.includes(",")) {
        numero = Number(
            valor.replace(/\./g, "").replace(",", ".")
        );
    } else {
        numero = Number(valor);
    }

    return Number.isFinite(numero)
        ? Math.max(0, numero)
        : 0;
}

function textoCampo(id, padrao = "") {
    const campo = porId(id);

    return campo
        ? campo.value.trim() || padrao
        : padrao;
}

function marcado(id) {
    const campo = porId(id);
    return campo ? campo.checked : false;
}

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function arredondar(valor) {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entidades[caractere];
    });
}

function dataAtual() {
    return new Date().toLocaleDateString("pt-BR");
}

function nomeMes(numero) {
    const meses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];

    return meses[numero - 1] || "";
}

/* =========================
   CÁLCULO DO INSS
========================= */

function calcularINSS(remuneracao) {
    const base = Math.min(
        Math.max(0, remuneracao),
        CONFIG.tetoINSS
    );

    let anterior = 0;
    let total = 0;

    for (const faixa of CONFIG.inss) {
        if (base <= anterior) break;

        const parcela = Math.min(base, faixa.limite) - anterior;

        if (parcela > 0) {
            total += parcela * faixa.aliquota;
        }

        anterior = faixa.limite;
    }

    return arredondar(total);
}

/* =========================
   CÁLCULO DO IRRF
========================= */

function impostoPelaTabela(base) {
    const faixa = CONFIG.irrf.find(
        item => base <= item.limite
    );

    if (!faixa || faixa.aliquota === 0) {
        return 0;
    }

    return Math.max(
        0,
        base * faixa.aliquota - faixa.deducao
    );
}

function calcularIRRF({
    rendimentoTributavel,
    inss,
    dependentes = 0,
    permitirSimplificado = true
}) {
    const deducoesLegais =
        inss + dependentes * CONFIG.deducaoDependente;

    const deducaoAplicada = permitirSimplificado
        ? Math.max(
            deducoesLegais,
            CONFIG.descontoSimplificado
        )
        : deducoesLegais;

    const baseIRRF = Math.max(
        0,
        rendimentoTributavel - deducaoAplicada
    );

    let imposto = impostoPelaTabela(baseIRRF);
    let reducao = 0;

    // Redução configurada para fins de simulação.
    if (rendimentoTributavel <= 5000) {
        reducao = Math.min(imposto, 312.89);

    } else if (rendimentoTributavel <= 7350) {
        reducao = Math.min(
            imposto,
            Math.max(
                0,
                978.62 - 0.133145 * rendimentoTributavel
            )
        );
    }

    imposto = Math.max(0, imposto - reducao);

    return {
        base: arredondar(baseIRRF),
        deducoes: arredondar(deducaoAplicada),
        imposto: arredondar(imposto),
        reducao: arredondar(reducao)
    };
}

/* =========================
   MODELO DO HOLERITE
========================= */

function linhaHolerite(
    descricao,
    valor,
    tipo = "provento"
) {
    const classe = tipo === "desconto"
        ? "valor-desconto"
        : "valor-provento";

    return `
        <tr>
            <td>${escaparHTML(descricao)}</td>
            <td class="${classe}">
                ${dinheiro(valor)}
            </td>
        </tr>
    `;
}

function montarHolerite(dados) {
    const proventos = dados.proventos || [];
    const descontos = dados.descontos || [];

    const totalProventos = arredondar(
        proventos.reduce(
            (soma, item) => soma + item.valor,
            0
        )
    );

    const totalDescontos = arredondar(
        descontos.reduce(
            (soma, item) => soma + item.valor,
            0
        )
    );

    const liquido = arredondar(
        totalProventos - totalDescontos
    );

    const mesAno = dados.mes
        ? `${dados.mes}/${dados.ano}`
        : dados.ano;

    const tabelaProventos = proventos
        .map(item =>
            linhaHolerite(item.descricao, item.valor)
        )
        .join("");

    const tabelaDescontos = descontos
        .map(item =>
            linhaHolerite(
                item.descricao,
                item.valor,
                "desconto"
            )
        )
        .join("");

    return `
        <section class="via-print holerite-via">

            <div class="holerite-cabecalho">

                <div class="holerite-marca">
                    <strong>AW TECHNOLOGY</strong>
                    <span>
                        Simulador de Demonstrativo de Pagamento
                    </span>
                </div>

                <div class="holerite-titulo">
                    <h2>DEMONSTRATIVO DE PAGAMENTO</h2>
                    <span>
                        Competência: ${escaparHTML(mesAno)}
                    </span>
                </div>

            </div>

            <div class="holerite-identificacao">

                <div>
                    <strong>Empresa</strong>
                    <span>${escaparHTML(dados.empresa)}</span>
                </div>

                <div>
                    <strong>Colaborador</strong>
                    <span>${escaparHTML(dados.nome)}</span>
                </div>

                <div>
                    <strong>Cargo</strong>
                    <span>${escaparHTML(dados.cargo)}</span>
                </div>

                <div>
                    <strong>Tipo de demonstrativo</strong>
                    <span>${escaparHTML(dados.tipo)}</span>
                </div>

            </div>

            <div class="holerite-tabelas">

                <div class="holerite-coluna">

                    <h3>PROVENTOS</h3>

                    <table>
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Valor</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${
                                tabelaProventos ||
                                "<tr><td colspan='2'>Sem proventos</td></tr>"
                            }
                        </tbody>
                    </table>

                </div>

                <div class="holerite-coluna">

                    <h3>DESCONTOS</h3>

                    <table>
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Valor</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${
                                tabelaDescontos ||
                                "<tr><td colspan='2'>Sem descontos</td></tr>"
                            }
                        </tbody>
                    </table>

                </div>

            </div>

            <div class="holerite-resumo">

                <div>
                    <span>Total de proventos</span>
                    <strong>${dinheiro(totalProventos)}</strong>
                </div>

                <div>
                    <span>Total de descontos</span>
                    <strong>${dinheiro(totalDescontos)}</strong>
                </div>

                <div class="holerite-liquido">
                    <span>VALOR LÍQUIDO</span>
                    <strong>${dinheiro(liquido)}</strong>
                </div>

            </div>

            <div class="holerite-assinatura">

                <div class="assinatura-linha">
                    <span>Assinatura do colaborador</span>
                </div>

                <div class="assinatura-data">
                    <span>
                        Data do recebimento: ____/____/________
                    </span>
                </div>

            </div>

            <div class="holerite-observacao">
                <p>
                    Demonstrativo gerado para fins de simulação.
                    Não substitui folha oficial de pagamento.
                </p>

                <span>
                    Emitido em ${dataAtual()} — AW TECHNOLOGY
                </span>
            </div>

        </section>
    `;
}

/* =========================
   EXIBIÇÃO DO RESULTADO
========================= */

function exibirResultado(dados) {
    const saida = porId("holeriteOutput");
    const botaoPDF = porId("btnExportarPDF");

    if (!saida) {
        alert(
            "Não foi possível localizar a área de resultado."
        );
        return;
    }

    const holerite = montarHolerite(dados);

    // Gera duas vias idênticas do demonstrativo.
    saida.innerHTML = `
        <div class="holerite-container-vias">
            ${holerite}
            ${holerite}
        </div>
    `;

    saida.classList.remove("hidden");

    if (botaoPDF) {
        botaoPDF.classList.remove("hidden");
        botaoPDF.disabled = false;
        botaoPDF.textContent = "Exportar PDF";
    }

    saida.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* =========================
   LIMPAR RESULTADO
========================= */

function limparResultado() {
    const saida = porId("holeriteOutput");
    const botaoPDF = porId("btnExportarPDF");

    if (saida) {
        saida.innerHTML = "";
        saida.classList.add("hidden");
    }

    if (botaoPDF) {
        botaoPDF.classList.add("hidden");
        botaoPDF.disabled = false;
        botaoPDF.textContent = "Exportar PDF";
    }
}

/* =========================
   VALIDAÇÃO DOS FORMULÁRIOS
========================= */

function validarDados(nome, empresa, salario) {
    if (!nome.trim()) {
        alert("Informe o nome do colaborador.");
        return false;
    }

    if (!empresa.trim()) {
        alert("Informe o nome da empresa.");
        return false;
    }

    if (salario <= 0) {
        alert("Informe um salário maior que zero.");
        return false;
    }

    return true;
}

/* =========================
   HOLERITE MENSAL
========================= */

function gerarHoleriteMensal() {
    const nome = textoCampo("nomeMensal");

    const cargo = textoCampo(
        "cargoMensal",
        "Não informado"
    );

    const empresa = textoCampo("empresaMensal");

    const mesNumero = Number(
        textoCampo("mesMensal")
    );

    const ano = textoCampo(
        "anoMensal",
        String(CONFIG.anoReferencia)
    );

    const salario = valorCampo("salarioMensal");
    const horasExtras = valorCampo("horasExtrasMensal");

    if (!validarDados(nome, empresa, salario)) return;

    const remuneracao = arredondar(
        salario + horasExtras
    );

    const dependentes = Math.floor(
        valorCampo("dependentesMensal")
    );

    const inss = calcularINSS(remuneracao);

    const irrf = calcularIRRF({
        rendimentoTributavel: remuneracao,
        inss,
        dependentes,
        permitirSimplificado: true
    });

    const proventos = [
        {
            descricao: "Salário mensal",
            valor: salario
        }
    ];

    if (horasExtras > 0) {
        proventos.push({
            descricao: "Horas extras / adicionais informados",
            valor: horasExtras
        });
    }

    // Salário-família estimado.
    if (
        marcado("salarioFamiliaMensal") &&
        remuneracao <= CONFIG.limiteSalarioFamilia &&
        dependentes > 0
    ) {
        const salarioFamilia = arredondar(
            dependentes * CONFIG.valorSalarioFamilia
        );

        proventos.push({
            descricao: "Salário-família estimado",
            valor: salarioFamilia
        });
    }

    const descontos = [];

    if (inss > 0) {
        descontos.push({
            descricao: "INSS",
            valor: inss
        });
    }

    if (irrf.imposto > 0) {
        descontos.push({
            descricao: "IRRF",
            valor: irrf.imposto
        });
    }

    // Vale-transporte.
    if (marcado("vtMensal")) {
        const custoVT = valorCampo("vtValorMensal");

        const descontoVT = Math.min(
            custoVT,
            salario * 0.06
        );

        if (descontoVT > 0) {
            descontos.push({
                descricao: "Vale-transporte",
                valor: arredondar(descontoVT)
            });
        }
    }

    // Vale-refeição.
    if (marcado("vrMensal")) {
        const descontoVR = valorCampo("vrValorMensal");

        if (descontoVR > 0) {
            descontos.push({
                descricao: "Vale-refeição",
                valor: descontoVR
            });
        }
    }

    // Adiantamento salarial.
    if (marcado("adiantamentoMensal")) {
        const valorManual = valorCampo(
            "adiantamentoValorMensal"
        );

        const adiantamento = valorManual > 0
            ? valorManual
            : salario * 0.40;

        if (adiantamento > 0) {
            descontos.push({
                descricao: valorManual > 0
                    ? "Adiantamento salarial informado"
                    : "Adiantamento salarial estimado (40%)",
                valor: arredondar(adiantamento)
            });
        }
    }

    // Outros descontos informados.
    const outrosDescontos = [
        ["planoSaudeMensal", "Plano de saúde"],
        ["seguroVidaMensal", "Seguro de vida"],
        [
            "contribuicaoMensal",
            "Contribuição / outros descontos"
        ]
    ];

    outrosDescontos.forEach(([id, descricao]) => {
        const valor = valorCampo(id);

        if (valor > 0) {
            descontos.push({
                descricao,
                valor
            });
        }
    });

    exibirResultado({
        tipo: "Pagamento mensal",
        nome,
        cargo,
        empresa,
        mes: nomeMes(mesNumero) ||
            textoCampo("mesMensal"),
        ano,
        proventos,
        descontos
    });
}

/* =========================
   HOLERITE DE FÉRIAS
========================= */

function gerarHoleriteFerias() {
    const nome = textoCampo("nomeFerias");

    const cargo = textoCampo(
        "cargoFerias",
        "Não informado"
    );

    const empresa = textoCampo("empresaFerias");

    const mesNumero = Number(
        textoCampo("mesFerias")
    );

    const ano = textoCampo(
        "anoFerias",
        String(CONFIG.anoReferencia)
    );

    const salario = valorCampo("salarioFerias");

    const dias = Math.min(
        30,
        Math.max(
            1,
            Math.floor(
                valorCampo("diasFerias") || 30
            )
        )
    );

    if (!validarDados(nome, empresa, salario)) return;

    const valorFerias = arredondar(
        (salario / 30) * dias
    );

    const terco = arredondar(
        valorFerias / 3
    );

    const totalBruto = arredondar(
        valorFerias + terco
    );

    const inss = calcularINSS(totalBruto);

    const irrf = calcularIRRF({
        rendimentoTributavel: totalBruto,
        inss,
        permitirSimplificado: true
    });

    const proventos = [
        {
            descricao: `Férias (${dias} dias)`,
            valor: valorFerias
        },
        {
            descricao: "Adicional constitucional de 1/3",
            valor: terco
        }
    ];

    const descontos = [];

    if (inss > 0) {
        descontos.push({
            descricao: "INSS sobre férias",
            valor: inss
        });
    }

    if (irrf.imposto > 0) {
        descontos.push({
            descricao: "IRRF sobre férias (estimado)",
            valor: irrf.imposto
        });
    }

    exibirResultado({
        tipo: "Pagamento de férias",
        nome,
        cargo,
        empresa,
        mes: nomeMes(mesNumero) ||
            textoCampo("mesFerias"),
        ano,
        proventos,
        descontos
    });
}

/* =========================
   HOLERITE DO 13º SALÁRIO
========================= */

function gerarHoleriteDecimo() {
    const nome = textoCampo("nomeDecimo");

    const cargo = textoCampo(
        "cargoDecimo",
        "Não informado"
    );

    const empresa = textoCampo("empresaDecimo");

    const ano = textoCampo(
        "anoDecimo",
        String(CONFIG.anoReferencia)
    );

    const salario = valorCampo("salarioDecimo");

    const meses = Math.min(
        12,
        Math.max(
            1,
            Math.floor(
                valorCampo("mesesDecimo") || 12
            )
        )
    );

    const parcela = textoCampo(
        "parcelaDecimo",
        "integral"
    );

    if (!validarDados(nome, empresa, salario)) return;

    const decimoBruto = arredondar(
        (salario * meses) / 12
    );

    const primeiraParcela = arredondar(
        decimoBruto / 2
    );

    const proventos = [];
    const descontos = [];

    if (parcela === "primeira") {

        proventos.push({
            descricao: `1ª parcela do 13º salário (${meses}/12)`,
            valor: primeiraParcela
        });

    } else {

        const inss = calcularINSS(decimoBruto);

        const irrf = calcularIRRF({
            rendimentoTributavel: decimoBruto,
            inss,
            permitirSimplificado: false
        });

        if (parcela === "segunda") {

            proventos.push({
                descricao: `13º salário integral (${meses}/12)`,
                valor: decimoBruto
            });

            descontos.push({
                descricao: "Adiantamento da 1ª parcela",
                valor: primeiraParcela
            });

        } else {

            proventos.push({
                descricao: `13º salário integral (${meses}/12)`,
                valor: decimoBruto
            });
        }

        if (inss > 0) {
            descontos.push({
                descricao: "INSS sobre 13º salário",
                valor: inss
            });
        }

        if (irrf.imposto > 0) {
            descontos.push({
                descricao: "IRRF sobre 13º salário (estimado)",
                valor: irrf.imposto
            });
        }
    }

    exibirResultado({
        tipo: parcela === "primeira"
            ? "1ª parcela do 13º salário"
            : parcela === "segunda"
                ? "2ª parcela do 13º salário"
                : "13º salário integral",

        nome,
        cargo,
        empresa,
        mes: "",
        ano,
        proventos,
        descontos
    });
}

/* =========================
   ABAS DE NAVEGAÇÃO
========================= */

function configurarAbas() {
    const botoes = document.querySelectorAll(
        ".tab-button"
    );

    const conteudos = document.querySelectorAll(
        ".tab-content"
    );

    if (!botoes.length) return;

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {

            const destino =
                botao.dataset.target ||
                botao.dataset.tab ||
                botao.getAttribute("aria-controls") ||
                botao.id.replace("tab", "form");

            botoes.forEach(item => {
                item.classList.remove("active");
            });

            conteudos.forEach(item => {
                item.classList.remove("active");
            });

            botao.classList.add("active");

            let painel = porId(destino);

            if (!painel && destino) {
                painel = porId(
                    destino.startsWith("form")
                        ? destino
                        : `form${destino.charAt(0).toUpperCase()}${destino.slice(1)}`
                );
            }

            if (painel) {
                painel.classList.add("active");
            }
        });
    });
}

/* =========================
   CAMPOS CONDICIONAIS
========================= */

function atualizarCamposCondicionais() {
    const relacoes = [
        ["vtMensal", "vtValorMensal"],
        ["vrMensal", "vrValorMensal"],
        [
            "adiantamentoMensal",
            "adiantamentoValorMensal"
        ]
    ];

    relacoes.forEach(([idCheckbox, idCampo]) => {
        const checkbox = porId(idCheckbox);
        const campo = porId(idCampo);

        if (!checkbox || !campo) return;

        campo.disabled = !checkbox.checked;

        if (!checkbox.checked) {
            campo.value = "";
        }
    });
}

function configurarCamposCondicionais() {
    const relacoes = [
        "vtMensal",
        "vrMensal",
        "adiantamentoMensal"
    ];

    relacoes.forEach(id => {
        const checkbox = porId(id);

        if (!checkbox) return;

        checkbox.addEventListener(
            "change",
            atualizarCamposCondicionais
        );
    });

    atualizarCamposCondicionais();
}

/* =========================
   LIMPEZA DOS FORMULÁRIOS
========================= */

function configurarLimpezaFormularios() {
    const formularios = [
        "formMensal",
        "formFerias",
        "formDecimo"
    ];

    formularios.forEach(id => {
        const formulario = porId(id);

        if (!formulario) return;

        formulario.addEventListener("reset", () => {

            /*
             * O evento reset acontece antes de o navegador
             * restaurar os valores originais dos campos.
             *
             * O setTimeout permite executar a limpeza depois
             * da restauração nativa do formulário.
             */

            setTimeout(() => {

                // Esconde o holerite anterior e o PDF.
                limparResultado();

                // Atualiza os campos condicionais.
                atualizarCamposCondicionais();

            }, 0);
        });
    });
}

/* =========================
   GERAÇÃO DOS FORMULÁRIOS
========================= */

function configurarFormularios() {
    const formularios = [
        {
            id: "formMensal",
            gerar: gerarHoleriteMensal
        },
        {
            id: "formFerias",
            gerar: gerarHoleriteFerias
        },
        {
            id: "formDecimo",
            gerar: gerarHoleriteDecimo
        }
    ];

    formularios.forEach(({ id, gerar }) => {
        const formulario = porId(id);

        if (!formulario) return;

        formulario.addEventListener(
            "submit",
            evento => {
                evento.preventDefault();
                gerar();
            }
        );
    });
}

/* =========================
   EXPORTAÇÃO EM PDF
========================= */

async function exportarPDF() {
    const conteudo = porId("holeriteOutput");

    if (
        !conteudo ||
        !conteudo.innerHTML.trim() ||
        conteudo.classList.contains("hidden")
    ) {
        alert(
            "Gere um holerite antes de exportar o PDF."
        );
        return;
    }

    const botao = porId("btnExportarPDF");

    if (botao) {
        botao.disabled = true;
        botao.textContent = "Gerando PDF...";
    }

    try {
        if (typeof html2pdf === "undefined") {
            throw new Error(
                "A biblioteca html2pdf não foi carregada."
            );
        }

        const opcoes = {
            margin: [8, 8, 8, 8],

            filename: "holerite-aw-technology.pdf",

            image: {
                type: "jpeg",
                quality: 0.98
            },

            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                scrollY: 0
            },

            jsPDF: {
                unit: "mm",
                format: "a4",
                orientation: "portrait"
            },

            pagebreak: {
                mode: ["css", "legacy"],
                avoid: [".via-print"]
            }
        };

        await html2pdf()
            .set(opcoes)
            .from(conteudo)
            .save();

    } catch (erro) {
        console.error(
            "Erro ao exportar PDF:",
            erro
        );

        alert(
            "Não foi possível gerar o PDF. " +
            "Verifique sua conexão e tente novamente."
        );

    } finally {
        if (botao) {
            botao.disabled = false;
            botao.textContent = "Exportar PDF";
        }
    }
}

/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarAbas();

        configurarCamposCondicionais();

        configurarLimpezaFormularios();

        configurarFormularios();

        const botaoPDF = porId(
            "btnExportarPDF"
        );

        if (botaoPDF) {
            botaoPDF.addEventListener(
                "click",
                exportarPDF
            );
        }

        console.info(
            `AW TECHNOLOGY — Gerador de Holerite iniciado. Referência: ${CONFIG.anoReferencia}.`
        );
    }
);
