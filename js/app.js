document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");

  // Troca de tabs
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      contents.forEach(c => c.classList.remove("active"));
      document.getElementById("form" + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)).classList.add("active");
    });
  });

  // Habilitar/Desabilitar inputs
  function toggleInput(checkboxId, inputId) {
    const checkbox = document.getElementById(checkboxId);
    const input = document.getElementById(inputId);
    checkbox.addEventListener("change", () => {
      input.disabled = !checkbox.checked;
      if (!checkbox.checked) input.value = "";
    });
  }
  toggleInput("vrMensal", "vrValorMensal");
  toggleInput("vtMensal", "vtValorMensal");

  // Função principal de gerar holerite
  function gerarHolerite(e, tipo) {
    e.preventDefault();
    const prefix = tipo === "mensal" ? "Mensal" : tipo === "ferias" ? "Ferias" : "Decimo";

    // Captura inputs
    const nome = document.getElementById("nome" + prefix).value;
    const cargo = document.getElementById("cargo" + prefix).value;
    const empresa = document.getElementById("empresa" + prefix).value;
    const mes = document.getElementById("mes" + prefix)?.value || "";
    const ano = document.getElementById("ano" + prefix).value;
    const salario = parseFloat(document.getElementById("salario" + prefix).value) || 0;
    const horasExtras = parseFloat(document.getElementById("horasExtrasMensal")?.value) || 0;
    const adiantamentoCheck = document.getElementById("adiantamentoMensal")?.checked;
    const adiantamentoManual = parseFloat(document.getElementById("adiantamentoValorMensal")?.value) || 0;
    const salarioFamiliaCheck = document.getElementById("salarioFamiliaMensal")?.checked;
    const dependentes = parseInt(document.getElementById("dependentesMensal")?.value) || 0;
    const vtCheck = document.getElementById("vtMensal")?.checked;
    const vtValor = parseFloat(document.getElementById("vtValorMensal")?.value) || 0;
    const vrCheck = document.getElementById("vrMensal")?.checked;
    const vrValor = parseFloat(document.getElementById("vrValorMensal")?.value) || 0;
    const planoSaude = parseFloat(document.getElementById("planoSaudeMensal")?.value) || 0;
    const seguroVida = parseFloat(document.getElementById("seguroVidaMensal")?.value) || 0;
    const contribuicao = parseFloat(document.getElementById("contribuicaoMensal")?.value) || 0;

    let proventos = [];
    let descontos = [];

    // Cálculos
    if (tipo === "mensal") {
      let salarioTotal = salario + horasExtras;
      proventos.push({ nome: "Salário Base", valor: salario });
      if (horasExtras) proventos.push({ nome: "Horas Extras", valor: horasExtras });

      if (salarioFamiliaCheck && dependentes > 0) {
        const valorSF = dependentes * 56.47;
        proventos.push({ nome: "Salário Família", valor: valorSF });
        salarioTotal += valorSF;
      }

      let adiantamento = adiantamentoCheck ? salario * 0.4 : adiantamentoManual;
      if (adiantamento > 0) descontos.push({ nome: "Adiantamento", valor: adiantamento });

      if (vtCheck && vtValor > 0) {
        const vtDesconto = Math.min(vtValor, salario * 0.06);
        descontos.push({ nome: "Vale Transporte", valor: vtDesconto });
      }

      if (vrCheck && vrValor > 0) {
        const vrDesconto = Math.min(vrValor, vrValor * 0.2);
        descontos.push({ nome: "Vale Refeição", valor: vrDesconto });
      }

      let inss = 0;
      if (salario <= 1751.81) inss = salario * 0.08;
      else if (salario <= 2919.72) inss = salario * 0.09;
      else if (salario <= 5839.45) inss = salario * 0.11;
      else inss = 5839.45 * 0.11;
      descontos.push({ nome: "INSS", valor: inss });

      let irBase = salario - inss - (dependentes * 189.59);
      let ir = 0;
      if (irBase <= 1903.98) ir = 0;
      else if (irBase <= 2826.65) ir = irBase * 0.075 - 142.80;
      else if (irBase <= 3751.05) ir = irBase * 0.15 - 354.80;
      else if (irBase <= 4664.68) ir = irBase * 0.225 - 636.13;
      else ir = irBase * 0.275 - 869.36;
      if(ir>0) descontos.push({ nome: "IRRF", valor: ir });

      if (planoSaude > 0) descontos.push({ nome: "Plano de Saúde", valor: planoSaude });
      if (seguroVida > 0) descontos.push({ nome: "Seguro de Vida", valor: seguroVida });
      if (contribuicao > 0) descontos.push({ nome: "Contribuição Negocial", valor: contribuicao });
    } else if (tipo === "ferias") {
      const umTerco = salario / 3;
      proventos.push({ nome: "Salário Base", valor: salario });
      proventos.push({ nome: "1/3 Constitucional", valor: umTerco });
      let inss = salario * 0.11;
      descontos.push({ nome: "INSS", valor: inss });
      let ir = (salario - inss) * 0.075;
      descontos.push({ nome: "IRRF", valor: ir });
    } else if (tipo === "decimo") {
      proventos.push({ nome: "Salário Base", valor: salario });
      let inss = salario * 0.11;
      descontos.push({ nome: "INSS", valor: inss });
      let ir = (salario - inss) * 0.075;
      descontos.push({ nome: "IRRF", valor: ir });
    }

    const totalProventos = proventos.reduce((a, b) => a + b.valor, 0);
    const totalDescontos = descontos.reduce((a, b) => a + b.valor, 0);
    const liquido = totalProventos - totalDescontos;

    // HTML Holerite
    const output = document.getElementById("holeriteOutput");
    output.innerHTML = `
      <div class="holerite-via">
        ${[1,2].map(() => `
          <div style="page-break-after: always;">
            <img src="aw-tecnologia.png" style="display:block;margin:0 auto 15px;max-width:120px;">
            <h2 style="text-align:center;color:#0d6efd;">Holerite - ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h2>
            <div style="background:#e7f0ff;padding:10px;border-radius:5px;margin-bottom:15px;">
              <p><strong>Nome:</strong> ${nome}</p>
              <p><strong>Cargo:</strong> ${cargo}</p>
              <p><strong>Empresa:</strong> ${empresa}</p>
              ${mes ? `<p><strong>Mês:</strong> ${mes}</p>` : ""}
              <p><strong>Ano:</strong> ${ano}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
              <thead>
                <tr style="background:#28a745;color:#fff;">
                  <th>Proventos</th><th>Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                ${proventos.map(p => `<tr><td>${p.nome}</td><td style="text-align:right;">${p.valor.toFixed(2)}</td></tr>`).join("")}
              </tbody>
            </table>
            <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
              <thead>
                <tr style="background:#dc3545;color:#fff;">
                  <th>Descontos</th><th>Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                ${descontos.map(d => `<tr><td>${d.nome}</td><td style="text-align:right;">${d.valor.toFixed(2)}</td></tr>`).join("")}
              </tbody>
            </table>
            <div style="background:#cfe0ff;padding:10px;border-radius:5px;text-align:center;font-weight:700;">
              Líquido a Receber: R$ ${liquido.toFixed(2)}
            </div>            
            <div style="display:flex;justify-content:space-between;font-size:12px;">
              <div style="width:45%;text-align:center;border-top:1px solid #333;padding-top:5px;">Assinatura Funcionário</div>
              <div style="width:45%;text-align:center;border-top:1px solid #333;padding-top:5px;">Assinatura RH</div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    output.classList.remove("hidden");
    document.getElementById("btnExportarPDF").classList.remove("hidden");

    // Exportar PDF otimizado para mobile e desktop
    document.getElementById("btnExportarPDF").onclick = async () => {
      const pdf = new jspdf.jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // margem 10mm
      const vias = output.querySelectorAll(".holerite-via > div");

      for(let i = 0; i < vias.length; i++){
        const canvas = await html2canvas(vias[i], { scale: 3, useCORS: true, scrollY: 0, width: 900 });
        const imgData = canvas.toDataURL("image/png");
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        let remainingHeight = pdfHeight;
        let posY = 10;

        while(remainingHeight > 0){
          if(i > 0 || posY > 10) pdf.addPage();
          const h = Math.min(remainingHeight, pdf.internal.pageSize.getHeight() - 20);
          pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, h, undefined, "FAST");
          remainingHeight -= h;
          posY += h;
        }
      }

      pdf.save(`holerite-${tipo}.pdf`);
    };
  }

  // Submissão dos formulários
  document.getElementById("formMensal").addEventListener("submit", (e) => gerarHolerite(e, "mensal"));
  document.getElementById("formFerias").addEventListener("submit", (e) => gerarHolerite(e, "ferias"));
  document.getElementById("formDecimo").addEventListener("submit", (e) => gerarHolerite(e, "decimo"));
});

