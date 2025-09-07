# 📑 Gerador de Holerite 

Um gerador de holerites moderno, responsivo e funcional, desenvolvido em **HTML, CSS e JavaScript**.  
Permite gerar holerites **mensais, de férias e 13º salário**, incluindo cálculos automáticos de **INSS, IRRF, VT, VR** e outros descontos, com **exportação em PDF** e segunda via.

---

## 🖼️ Demonstração Visual

O holerite gerado possui:

- ✅ Layout moderno e organizado  
- ✅ Destaque para **Líquido a Receber**  
- ✅ Espaço para **assinaturas**  
- ✅ Tabelas de **Proventos** e **Descontos**

Exemplo de saída no sistema:

| Proventos           | Valor (R$) |
|--------------------|------------|
| Salário Base        | 3.500,00   |
| Horas Extras        | 200,00     |
| Salário Família     | 112,94     |
| **Total Proventos** | **3.812,94** |

| Descontos                  | Valor (R$) |
|----------------------------|------------|
| INSS                       | 385,42     |
| IRRF                       | 150,00     |
| Vale Transporte (VT)       | 210,00     |
| Vale Refeição (VR)         | 100,00     |
| **Total Descontos**        | **845,42** |

**💰 Líquido a Receber:** `R$ 2.967,52`

---

## ⚙️ Funcionalidades

- 🧾 **Tipos de Holerite**
  - Mensal
  - Férias
  - 13º Salário
- ➕ **Cálculos Automáticos**
  - INSS (tabela atualizada)
  - IRRF (com dedução por dependentes)
  - Vale Transporte (VT)
  - Vale Refeição (VR)
  - Adiantamentos, Plano de Saúde, Seguro de Vida, Contribuição Negocial
- 📄 **Exportação para PDF** com segunda via
- 🎨 **Layout moderno e responsivo**
- 🖥️ Interface amigável em **desktop e mobile**

---

## 📂 Estrutura do Projeto

```bash
.
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos do formulário e holerite
├── js/
│   └── app.js          # Lógica de cálculo e PDF
└── README.md           # Documentação
💻 Como Usar Localmente
Clone o repositório:

bash
Copiar código
git clone https://github.com/awaldige/Gerador-de-Holerite.git
Abra o arquivo index.html no navegador.

Preencha os dados do formulário e clique em Gerar Holerite.

Clique em Exportar PDF para salvar ou imprimir.

🛠️ Tecnologias Utilizadas
HTML5

CSS3

JavaScript (Vanilla)

html2canvas — captura da tela

jsPDF — geração de PDFs

👨‍💻 Autor
Desenvolvido por André Waldige 🚀
🔗 GitHub https://github.com/awaldige
