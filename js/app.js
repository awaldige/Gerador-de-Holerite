document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab-button");
    const contents = document.querySelectorAll(".tab-content");

    // 1. Troca de tabs
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            contents.forEach(c => c.classList.remove("active"));
            const targetId = "form" + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
            document.getElementById(targetId).classList.add("active");
        });
    });

    // 2. Habilitar/Desabilitar inputs
    function toggleInput(checkboxId, inputId) {
        const checkbox = document.getElementById(checkboxId);
        const input = document.getElementById(inputId);
        if (!checkbox || !input) return;
        checkbox.addEventListener("change", () => {
            input.disabled = !checkbox.checked;
            if (!checkbox.checked) input.value = "";
        });
    }
    toggleInput("vrMensal", "vrValorMensal");
    toggleInput("vtMensal", "vtValorMensal");
    toggleInput("adiantamentoMensal", "adiantamentoValorMensal");

    // 3. Funções Auxiliares de Cálculo e Formatação
    const parseMoeda = (valor) => {
        if (!valor) return 0;
        // Remove pontos de milhar e troca vírgula por ponto para o JS entender
        let limpo = valor.toString().replace(/\./g, '').replace(',', '.');
        return parseFloat(limpo) || 0;
    };

    const formatarBRL = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    function calcularINSS(salario) {
        let inss = 0;
        // Tabelas 2024/2025 aproximadas (Progressivo)
        const faixas = [
            { limite: 1412.00, aliq: 0.075 },
            { limite: 2666.68, aliq: 0.09 },
            { limite: 4000.03, aliq: 0.12 },
            { limite: 7786.02, aliq: 0.14 }
        ];
        let baseAnterior = 0;
        for (let f of faixas) {
            if (salario > f.limite) {
                inss += (f.limite - baseAnterior) * f.aliq;
                baseAnterior = f.limite;
            } else {
                inss += (salario - baseAnterior) * f.aliq;
                return inss;
            }
        }
        return 908.85; // Teto aproximado
    }

    function calcularIRRF(base, dependentes) {
        const deducaoDependente = dependentes * 189.59;
        const baseCalculo = base - deducaoDependente;
        if (baseCalculo <= 2259.20) return 0;
        if (baseCalculo <= 2826.65) return (baseCalculo * 0.075) - 169.44;
        if (baseCalculo <= 3751.05) return (baseCalculo * 0.15) - 381.44;
        if (baseCalculo <= 4664.68) return (baseCalculo * 0.225) - 662.77;
        return (baseCalculo * 0.275) - 896.00;
    }

    // 4. Função principal de gerar holerite
    async function gerarHolerite(e, tipo) {
        e.preventDefault();
        const prefix = tipo.charAt(0).toUpperCase() + tipo.slice(1);

        const dados = {
            nome: document.getElementById("nome" + prefix).value,
            cargo: document.getElementById("cargo" + prefix).value,
            empresa: document.getElementById("empresa" + prefix).value,
            mes: document.getElementById("mes" + prefix)?.value || "",
            ano: document.getElementById("ano" + prefix).value,
            salario: parseMoeda(document.getElementById("salario" + prefix).value),
            horasExtras: parseMoeda(document.getElementById("horasExtrasMensal")?.value),
            dependentes: parseInt(document.getElementById("dependentesMensal")?.value) || 0
        };

        let proventos = [];
        let descontos = [];

        // Lógica Mensal
        if (tipo === "mensal") {
            proventos.push({ nome: "Salário Base", valor: dados.salario });
            if (dados.horasExtras > 0) proventos.push({ nome: "Horas Extras", valor: dados.horasExtras });

            // Salário Família (Regra simplificada)
            if (document.getElementById("salarioFamiliaMensal")?.checked && dados.salario <= 1819.26) {
                proventos.push({ nome: "Salário Família", valor: dados.dependentes * 62.04 });
            }

            // Descontos Benefícios
            if (document.getElementById("vtMensal")?.checked) {
                const vtValor = parseMoeda(document.getElementById("vtValorMensal").value);
                descontos.push({ nome: "Vale Transporte (6%)", valor: Math.min(vtValor, dados.salario * 0.06) });
            }

            if (document.getElementById("vrMensal")?.checked) {
                const vrValor = parseMoeda(document.getElementById("vrValorMensal").value);
                descontos.push({ nome: "Vale Refeição (PAT)", valor: vrValor * 0.20 });
            }

            // Impostos
            const inss = calcularINSS(dados.salario + dados.horasExtras);
            descontos.push({ nome: "INSS", valor: inss });

            const irrf = calcularIRRF(dados.salario + dados.horasExtras - inss, dados.dependentes);
            if (irrf > 0) descontos.push({ nome: "IRRF", valor: irrf });

            // Outros
            const adiantamento = parseMoeda(document.getElementById("adiantamentoValorMensal")?.value);
            if (adiantamento > 0) descontos.push({ nome: "Adiantamento", valor: adiantamento });
        } 
        
        // Lógica Férias e Décimo (Simplificada)
        else {
            const valorBase = tipo === "ferias" ? dados.salario * 1.3333 : dados.salario;
            proventos.push({ nome: tipo === "ferias" ? "Férias + 1/3" : "13º Salário", valor: valorBase });
            const inss = calcularINSS(valorBase);
            descontos.push({ nome: "INSS", valor: inss });
        }

        const totalProventos = proventos.reduce((a, b) => a + b.valor, 0);
        const totalDescontos = descontos.reduce((a, b) => a + b.valor, 0);
        const liquido = totalProventos - totalDescontos;

        // Renderização HTML
        const output = document.getElementById("holeriteOutput");
        output.innerHTML = `
            <div class="holerite-container-vias">
                ${[1, 2].map(via => `
                    <div class="via-print" style="padding: 20px; border: 1px dashed #ccc; margin-bottom: 20px; background: #fff;">
                        <div style="text-align:center; font-weight: bold;">${via}ª VIA - ${dados.empresa}</div>
                        <h2 style="text-align:center; color:#0d6efd; margin: 10px 0;">Recibo de Pagamento (${tipo.toUpperCase()})</h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 14px;">
                            <div><strong>Funcionário:</strong> ${dados.nome}</div>
                            <div><strong>Cargo:</strong> ${dados.cargo}</div>
                            <div><strong>Referência:</strong> ${dados.mes}/${dados.ano}</div>
                        </div>
                        <table style="width:100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background:#f0f0f0; border-bottom: 2px solid #ddd;">
                                    <th style="text-align:left; padding: 5px;">Descrição</th>
                                    <th style="text-align:right; padding: 5px;">Proventos</th>
                                    <th style="text-align:right; padding: 5px;">Descontos</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${proventos.map(p => `<tr><td style="padding:5px; border-bottom:1px solid #eee;">${p.nome}</td><td style="text-align:right;">${formatarBRL(p.valor)}</td><td></td></tr>`).join("")}
                                ${descontos.map(d => `<tr><td style="padding:5px; border-bottom:1px solid #eee;">${d.nome}</td><td></td><td style="text-align:right;">${formatarBRL(d.valor)}</td></tr>`).join("")}
                            </tbody>
                            <tfoot>
                                <tr style="font-weight:bold; background:#e7f0ff;">
                                    <td style="padding:10px;">LÍQUIDO A RECEBER</td>
                                    <td colspan="2" style="text-align:right; padding:10px; font-size: 16px;">${formatarBRL(liquido)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                            <div style="width: 45%; border-top: 1px solid #000; text-align: center; font-size: 12px;">Assinatura do Funcionário</div>
                            <div style="width: 45%; border-top: 1px solid #000; text-align: center; font-size: 12px;">Data: ____/____/_______</div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

        output.classList.remove("hidden");
        const btnExport = document.getElementById("btnExportarPDF");
        btnExport.classList.remove("hidden");

        // 5. Gerar PDF
        btnExport.onclick = async () => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("p", "mm", "a4");
            const elemento = document.querySelector(".holerite-container-vias");
            
            // Usando html2canvas para capturar a div completa
            const canvas = await html2canvas(elemento, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
            pdf.save(`Holerite_${dados.nome.replace(/\s+/g, '_')}.pdf`);
        };
    }

    document.getElementById("formMensal").addEventListener("submit", (e) => gerarHolerite(e, "mensal"));
    document.getElementById("formFerias").addEventListener("submit", (e) => gerarHolerite(e, "ferias"));
    document.getElementById("formDecimo").addEventListener("submit", (e) => gerarHolerite(e, "decimo"));
});
