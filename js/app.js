document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");
  const output = document.getElementById("holeriteOutput");
  const btnPDF = document.getElementById("btnExportarPDF");

  // === TABS ===
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      contents.forEach(c => c.classList.remove("active"));
      const id = "form" + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
      document.getElementById(id).classList.add("active");
    });
  });

  // === HABILITAR/DESABILITAR INPUTS ===
  function toggleInput(checkboxId, inputId) {
    const checkbox = document.getElementById(checkboxId);
    const input = document.getElementById(inputId);
    input.disabled = !checkbox.checked;
    checkbox.addEventListener("change", () => {
      input.disabled = !checkbox.checked;
      if (!checkbox.checked) input.value = "";
    });
  }

  toggleInput("vrMensal", "vrValorMensal");
  toggleInput("vtMensal", "vtValorMensal");
  toggleInput("adiantamentoMensal", "adiantamentoValorMensal");

  // === GERAR HOLERITE ===
  function gerarHolerite(e, tipo) {
    e.preventDefault();
    const prefix = tipo === "mensal" ? "Mensal" : tipo === "ferias" ? "Ferias" : "Decimo";

    // Pegando dados do formulário
    const nome = document.getElementById("nome" + prefix).value;
    const cargo = document.getElementById("cargo" + prefix).value;
    const empresa = document.getElementById("empresa" + prefix).value;
    const mes = document.getElementById("mes" + prefix)?.value || "";
    const ano = document.getElementById("ano" + prefix).value;
    const salario = parseFloat(document.getElementById("salario" + prefix).value) || 0;

    let horasExtras = parseFloat(document.getElementById("horasExtrasMensal")?.value) || 0;
    let adiantamentoCheck = document.getElementById("adiantamentoMensal")?.checked;
    let adiantamentoManual = parseFloat(document.getElementById("adiantamentoValorMensal")?.value) || 0;
    let salarioFamiliaCheck = document.getElementById("salarioFamiliaMensal")?.checked;
    let dependentes = parseInt(document.getElementById("dependentesMensal")?.value) || 0;
    let vtCheck = document.getElementById("vtMensal")?.checked;
    let vtValor = parseFloat(document.getElementById("vtValorMensal")?.value) || 0;
    let vrCheck = document.getElementById("vrMensal")?.checked;
    let vrValor = parseFloat(document.getElementById("vrValorMensal")?.value) || 0;
    let planoSaude = parseFloat(document.getElementById("planoSaudeMensal")?.value) || 0;
    let seguroVida = parseFloat(document.getElementById("seguroVidaMensal")?.value) || 0;
    let contribuicao = parseFloat(document.getElementById("contribuicaoMensal")?.value) || 0;

    // Arrays de proventos e descontos
    let proventos = [];
    let descontos = [];

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

      if (vtCheck && vtValor > 0) descontos.push({ nome: "Vale Transporte", valor: Math.min(vtValor, salario * 0.06) });
      if (vrCheck && vrValor > 0) descontos.push({ nome: "Vale Refeição", valor: Math.min(vrValor, vrValor * 0.2) });

      let inss = salario <= 1751.81 ? salario*0.08 : salario <= 2919.72 ? salario*0.09 : salario <= 5839.45 ? salario*0.11 : 5839.45*0.11;
      descontos.push({ nome: "INSS", valor: inss });

      let irBase = salario - inss - (dependentes * 189.59);
      let ir = 0;
      if (irBase > 1903.98 && irBase <= 2826.65) ir = irBase*0.075 - 142.8;
      else if (irBase <= 3751.05) ir = irBase*0.15 - 354.8;
      else if (irBase <= 4664.68) ir = irBase*0.225 - 636.13;
      else if (irBase > 4664.68) ir = irBase*0.275 - 869.36;
      if(ir>0) descontos.push({ nome: "IRRF", valor: ir });

      if (planoSaude>0) descontos.push({ nome: "Plano de Saúde", valor: planoSaude });
      if (seguroVida>0) descontos.push({ nome: "Seguro de Vida", valor: seguroVida });
      if (contribuicao>0) descontos.push({ nome: "Contribuição Negocial", valor: contribuicao });
    } else if (tipo === "ferias") {
      proventos.push({ nome: "Salário Base", valor: salario });
      proventos.push({ nome: "1/3 Constitucional", valor: salario/3 });
      descontos.push({ nome: "INSS", valor: salario*0.11 });
      descontos.push({ nome: "IRRF", valor: (salario*0.89)*0.075 });
    } else if (tipo === "decimo") {
      proventos.push({ nome: "Salário Base", valor: salario });
      descontos.push({ nome: "INSS", valor: salario*0.11 });
      descontos.push({ nome: "IRRF", valor: (salario*0.89)*0.075 });
    }

    const totalProventos = proventos.reduce((a,b)=>a+b.valor,0);
    const totalDescontos = descontos.reduce((a,b)=>a+b.valor,0);
    const liquido = totalProventos - totalDescontos;

    // HTML do Holerite com CSS inline
    let html = `
      <style>
        .holerite-via { font-family: Arial, sans-serif; color:#333; }
        .holerite-via img { max-width:120px; display:block; margin:0 auto 15px; }
        .holerite-via h2 { text-align:center; color:#0d6efd; margin-bottom:15px; }
        .info-funcionario { background:#e7f0ff; padding:10px; border-radius:5px; margin-bottom:15px; }
        .info-funcionario p { margin:3px 0; }
        table { width:100%; border-collapse:collapse; margin-bottom:15px; }
        th { background:#0d6efd; color:#fff; padding:8px; text-align:center; }
        td { padding:8px; border-bottom:1px solid #ccc; }
        .descontos th { background:#dc3545; }
        .liquido { background:#cfe0ff; padding:10px; font-weight:700; text-align:center; border-radius:5px; }
        hr { border:none; border-top:2px dashed #0d6efd; margin:15px 0; }
        .assinatura { display:flex; justify-content:space-between; font-size:12px; }
        .assinatura div { width:45%; text-align:center; border-top:1px solid #333; padding-top:5px; font-weight:600; }
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
              <thead>
                <tr><th>Proventos</th><th>Valor (R$)</th></tr>
              </thead>
              <tbody>
                ${proventos.map(p=>`<tr><td>${p.nome}</td><td style="text-align:right;">${p.valor.toFixed(2)}</td></tr>`).join("")}
              </tbody>
            </table>
            <table class="descontos">
              <thead>
                <tr><th>Descontos</th><th>Valor (R$)</th></tr>
              </thead>
              <tbody>
                ${descontos.map(d=>`<tr><td>${d.nome}</td><td style="text-align:right;">${d.valor.toFixed(2)}</td></tr>`).join("")}
              </tbody>
            </table>
            <div class="liquido">Líquido a Receber: R$ ${liquido.toFixed(2)}</div>
            <hr>
            <div class="assinatura">
              <div>Assinatura Funcionário</div>
              <div>Assinatura RH</div>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    output.innerHTML = html;
    output.classList.remove("hidden");
    btnPDF.classList.remove("hidden");

    // === BOTÃO PDF ===
    btnPDF.onclick = () => {
      // garante que todas as imagens carreguem
      const imgs = output.querySelectorAll("img");
      const promises = Array.from(imgs).map(img => {
        if (!img.complete) return new Promise(resolve=>{img.onload=img.onerror=resolve;});
        return Promise.resolve();
      });

      Promise.all(promises).then(() => {
        html2pdf().set({
          margin: 10,
          filename: `holerite-${tipo}.pdf`,
          image: { type:'jpeg', quality:0.98 },
          html2canvas: { scale:2, useCORS:true },
          jsPDF: { unit:'mm', format:'a4', orientation:'portrait' }
        }).from(output).save();
      });
    };
  }

  // === EVENTOS SUBMIT ===
  document.getElementById("formMensal").addEventListener("submit", e => gerarHolerite(e,"mensal"));
  document.getElementById("formFerias").addEventListener("submit", e => gerarHolerite(e,"ferias"));
  document.getElementById("formDecimo").addEventListener("submit", e => gerarHolerite(e,"decimo"));
});
