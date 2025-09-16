document.addEventListener("DOMContentLoaded", () => {
  // === TABS ===
  const tabs = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      contents.forEach(c => c.classList.remove("active"));
      document.getElementById("form" + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)).classList.add("active");
    });
  });

  // === HABILITAR/DESABILITAR INPUTS ===
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

  const output = document.getElementById("holeriteOutput");
  const btnPDF = document.getElementById("btnExportarPDF");

  // === FUNÇÃO DE GERAR HOLERITE ===
  function gerarHolerite(e, tipo) {
    e.preventDefault();

    const prefix = tipo === "mensal" ? "Mensal" : tipo === "ferias" ? "Ferias" : "Decimo";

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

    // --- CÁLCULOS ---
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

    // === HTML HOLERITE COM CSS INTEGRADO ===
    let html = `
      <style>
        .holerite-via { display:flex; flex-wrap:wrap; gap:20px; justify-content:space-between; font-family:Arial,sans-serif; }
        .holerite-via > div { flex:1 1 48%; min-width:250px; padding:20px; border:2px solid #0d6efd; border-radius:10px; background:#f9f9f9; box-sizing:border-box; box-shadow:0 5px 15px rgba(0,0,0,0.08);}
        .holerite-via img { display:block; margin:0 auto 15px; max-width:120px; }
        .holerite-via h2 { text-align:center; color:#0d6efd; font-size:22px; font-weight:700; margin-bottom:20px; letter-spacing:1px; }
        .holerite-via .info-funcionario { display:flex; justify-content:space-between; flex-wrap:wrap; background:#e7f0ff; padding:10px; border-radius:5px; margin-bottom:15px; }
        .holerite-via .info-funcionario p { margin:5px 0; font-size:12px; }
        .holerite-via table { width:100%; border-collapse:collapse; margin-bottom:10px; font-size:12px; }
        .holerite-via th, .holerite-via td { padding:8px; border-bottom:1px solid #e0e0e0; }
        .holerite-via th { font-weight:600; text-align:center; }
        .holerite-via td:last-child { text-align:right; }
        .holerite-via table:first-of-type th { background:#28a745; color:#fff; }
        .holerite-via table:last-of-type th { background:#dc3545; color:#fff; }
        .holerite-via .liquido { font-size:16px; text-align:center; font-weight:700; color:#0d6efd; padding:10px 0; margin-top:10px; background:#cfe0ff; border-radius:5px; }
        .holerite-via hr { border:none; border-top:2px dashed #0d6efd; margin:20px 0; }
        .holerite-via .assinatura { display:flex; justify-content:space-between; font-size:12px; margin-top:15px; }
        .holerite-via .assinatura div { width:45%; text-align:center; border-top:1px solid #333; padding-top:5px; font-weight:600; }
      </style>
      <div class="holerite-via">
        ${[1,2].map(via => `
          <div>
            <img src="aw-tecnologia.png">
            <h2>Holerite - ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h2>
            <div class="info-funcionario">
              <p><strong>Nome:</strong> ${nome}</p>
              <p><strong>Cargo:</strong> ${cargo}</p>
              <p><strong>Empresa:</strong> ${empresa}</p>
              ${mes ? `<p><strong>Mês:</strong> ${mes}</p>` : ""}
              <p><strong>Ano:</strong> ${ano}</p>
            </div>
            <table>
              <thead><tr><th>Proventos</th><th>R$</th></tr></thead>
              <tbody>${proventos.map(p => `<tr><td>${p.nome}</td><td>${p.valor.toFixed(2)}</td></tr>`).join("")}</tbody>
            </table>
            <table>
              <thead><tr><th>Descontos</th><th>R$</th></tr></thead>
              <tbody>${descontos.map(d => `<tr><td>${d.nome}</td><td>${d.valor.toFixed(2)}</td></tr>`).join("")}</tbody>
            </table>
            <div class="liquido">Líquido a Receber: R$ ${liquido.toFixed(2)}</div>
            <hr>
            <div class="assinatura">
              <div>Assinatura Funcionário</div>
              <div>Assinatura RH</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    output.innerHTML = html;
    output.classList.remove("hidden");
    btnPDF.classList.remove("hidden");
  }

  // === EVENTOS DE SUBMIT ===
  document.getElementById("formMensal").addEventListener("submit", (e) => gerarHolerite(e, "mensal"));
  document.getElementById("formFerias").addEventListener("submit", (e) => gerarHolerite(e, "ferias"));
  document.getElementById("formDecimo").addEventListener("submit", (e) => gerarHolerite(e, "decimo"));

  // === EXPORTAR PDF ===
  btnPDF.addEventListener("click", () => {
    if (output.innerHTML.trim() === "") {
      alert("Gere o holerite primeiro!");
      return;
    }
    html2pdf().set({
      margin: 10,
      filename: `holerite.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(output).save();
  });
});
