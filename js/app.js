document.addEventListener("DOMContentLoaded", () => {
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

  async function gerarHolerite(e, tipo) {
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

      let inss = salario <= 1751.81 ? salario*0.08 : salario<=2919.72? salario*0.09 : salario<=5839.45? salario*0.11 : 5839.45*0.11;
      descontos.push({ nome: "INSS", valor: inss });

      let irBase = salario - inss - (dependentes * 189.59);
      let ir = irBase<=1903.98?0:irBase<=2826.65?irBase*0.075-142.8:irBase<=3751.05?irBase*0.15-354.8:irBase<=4664.68?irBase*0.225-636.13:irBase*0.275-869.36;
      if(ir>0) descontos.push({ nome:"IRRF", valor:ir });

      if(planoSaude>0) descontos.push({ nome:"Plano de Saúde", valor:planoSaude });
      if(seguroVida>0) descontos.push({ nome:"Seguro de Vida", valor:seguroVida });
      if(contribuicao>0) descontos.push({ nome:"Contribuição Negocial", valor:contribuicao });
    } else if(tipo==="ferias"){
      proventos.push({ nome:"Salário Base", valor:salario });
      proventos.push({ nome:"1/3 Constitucional", valor:salario/3 });
      descontos.push({ nome:"INSS", valor:salario*0.11 });
      descontos.push({ nome:"IRRF", valor:(salario - salario*0.11)*0.075 });
    } else if(tipo==="decimo"){
      proventos.push({ nome:"Salário Base", valor:salario });
      descontos.push({ nome:"INSS", valor:salario*0.11 });
      descontos.push({ nome:"IRRF", valor:(salario - salario*0.11)*0.075 });
    }

    const totalProventos = proventos.reduce((a,b)=>a+b.valor,0);
    const totalDescontos = descontos.reduce((a,b)=>a+b.valor,0);
    const liquido = totalProventos - totalDescontos;

    const output = document.getElementById("holeriteOutput");
    output.innerHTML = "";
    for(let i=1;i<=2;i++){ // 2 vias
      const div = document.createElement("div");
      div.classList.add("holerite-via");
      div.innerHTML = `
        <img src="aw-tecnologia.png" class="logo-pdf">
        <h2>Holerite - ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h2>
        <div class="info-funcionario">
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Cargo:</strong> ${cargo}</p>
          <p><strong>Empresa:</strong> ${empresa}</p>
          ${mes ? `<p><strong>Mês:</strong> ${mes}</p>` : ""}
          <p><strong>Ano:</strong> ${ano}</p>
        </div>
        <table>
          <thead><tr><th>Proventos</th><th>Valor (R$)</th></tr></thead>
          <tbody>${proventos.map(p=>`<tr><td>${p.nome}</td><td style="text-align:right;">${p.valor.toFixed(2)}</td></tr>`).join("")}</tbody>
        </table>
        <table>
          <thead><tr><th>Descontos</th><th>Valor (R$)</th></tr></thead>
          <tbody>${descontos.map(d=>`<tr><td>${d.nome}</td><td style="text-align:right;">${d.valor.toFixed(2)}</td></tr>`).join("")}</tbody>
        </table>
        <div class="liquido">Líquido a Receber: R$ ${liquido.toFixed(2)}</div>
        <hr class="hr-tracejada">
        <div class="assinatura">
          <div>Assinatura Funcionário</div>
          <div>Assinatura RH</div>
        </div>
      `;
      output.appendChild(div);
    }

    output.classList.remove("hidden");
    document.getElementById("btnExportarPDF").classList.remove("hidden");

    // Exportar PDF com múltiplas páginas automáticas
    document.getElementById("btnExportarPDF").onclick = async () => {
      const pdf = new jspdf.jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      let first = true;

      for(const via of output.querySelectorAll(".holerite-via")){
        const canvas = await html2canvas(via, { scale: 3, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        let pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        let remainingHeight = pdfHeight;
        let position = 0;

        while(remainingHeight > 0){
          if(!first) pdf.addPage();
          const h = Math.min(remainingHeight, pdf.internal.pageSize.getHeight() - 20);
          pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, h, undefined, 'FAST');
          remainingHeight -= h;
          position += h;
          first = false;
        }
      }
      pdf.save(`holerite-${tipo}.pdf`);
    };
  }

  document.getElementById("formMensal").addEventListener("submit", (e)=>gerarHolerite(e,"mensal"));
  document.getElementById("formFerias").addEventListener("submit", (e)=>gerarHolerite(e,"ferias"));
  document.getElementById("formDecimo").addEventListener("submit", (e)=>gerarHolerite(e,"decimo"));
});
