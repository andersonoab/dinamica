const STORAGE_KEY = "operacao_fechamento_dp_v2";
const HISTORY_KEY = "operacao_fechamento_dp_historico_v2";

const state = {
    currentStep: 0,
    totalSteps: 5,
    remainingSeconds: 45 * 60,
    timerStarted: false,
    timerInterval: null,
    attemptSaved: false,
    answers: {
        triage: {},
        triageJustification: "",
        excel: {},
        folha: {},
        pressure: {}
    },
    scores: {
        triage: 0,
        excel: 0,
        folha: 0,
        pressure: 0
    }
};

const triageDemands = [
    {
        id: "d1",
        title: "Rescisão com data de saída hoje sem cálculo conferido",
        description: "Há risco direto de prazo legal, pagamento incorreto e impacto jurídico.",
        correctPriority: 1,
        expected: "Tratar primeiro. Entre as opções, esta é a demanda com maior risco legal imediato.",
        feedback: "Em rotina real de DP, rescisão com prazo vencendo costuma vir antes de demandas gerenciais ou operacionais sem efeito jurídico imediato."
    },
    {
        id: "d2",
        title: "Planilha de VT com 3 CPFs divergentes antes do fechamento",
        description: "Pode gerar desconto incorreto, falha de carga e retrabalho próximo ao processamento.",
        correctPriority: 2,
        expected: "Tratar em segundo lugar. Há risco financeiro e de processamento no fechamento.",
        feedback: "A divergência de CPF pode travar importação, gerar benefício errado ou desconto indevido no colaborador."
    },
    {
        id: "d3",
        title: "Relatório de ponto com inconsistência de horas extras",
        description: "Pode causar pagamento indevido ou necessidade de reprocessamento da folha.",
        correctPriority: 3,
        expected: "Tratar em terceiro lugar. Tem impacto relevante em folha, mas abaixo de rescisão urgente e divergência que pode travar carga.",
        feedback: "Horas extras precisam de evidência e conferência. A prioridade é alta, mas ainda abaixo de prazo legal de rescisão."
    },
    {
        id: "d4",
        title: "Novo admitido amanhã com documento pendente",
        description: "Demanda importante para continuidade da admissão, mas ainda existe uma janela curta de ajuste.",
        correctPriority: 4,
        expected: "Tratar em quarto lugar. É importante, porém entre estas opções não supera riscos imediatos de fechamento.",
        feedback: "Admissão pendente exige ação rápida, mas o impacto imediato costuma ser menor do que um erro em rescisão ou folha já em processamento."
    },
    {
        id: "d5",
        title: "Gestor pedindo atualização de headcount para agora",
        description: "Solicitação gerencial relevante, porém sem risco legal ou financeiro imediato.",
        correctPriority: 5,
        expected: "Tratar por último entre estas opções. É importante, mas não deve passar à frente de riscos legais e de folha.",
        feedback: "Em ambiente de alta demanda, pedidos executivos precisam de retorno claro, mas não devem interromper prioridades críticas do fechamento."
    }
];

const excelDataset = [
    { matricula: "1001", nome: "Ana Ribeiro", salario: 3200, admissao: "05/01/2026", beneficio: "Ativo", vt: 220, faltas: 0, he: 4, cc: "101", sindicato: "Comércio", conferencia: "OK" },
    { matricula: "1002", nome: "Bruno Alves", salario: 4100, admissao: "12/02/2026", beneficio: "Pendente", vt: 180, faltas: 1, he: 0, cc: "102", sindicato: "Metalúrgico", conferencia: "Pendente" },
    { matricula: "1003", nome: "Camila Souza", salario: 3700, admissao: "22/02/2026", beneficio: "Ativo", vt: 240, faltas: 0, he: 2, cc: "101", sindicato: "Comércio", conferencia: "OK" },
    { matricula: "1002", nome: "Diego Lima", salario: 4100, admissao: "12/02/2026", beneficio: "Pendente", vt: 180, faltas: 0, he: 1, cc: "102", sindicato: "Metalúrgico", conferencia: "Pendente" },
    { matricula: "1005", nome: "Erika Prado", salario: 2950, admissao: "01/03/2026", beneficio: "Pendente", vt: 200, faltas: 2, he: 0, cc: "103", sindicato: "Serviços", conferencia: "Pendente" },
    { matricula: "1006", nome: "Felipe Costa", salario: 5200, admissao: "14/12/2025", beneficio: "Ativo", vt: 0, faltas: 0, he: 5, cc: "101", sindicato: "Comércio", conferencia: "OK" }
];

const excelQuestions = [
    {
        id: "excel_q1",
        title: "Ao conferir a base, qual problema fica visível logo na primeira leitura?",
        options: [
            "Duplicidade de matrícula",
            "Salário negativo",
            "Centro de custo inválido",
            "Data futura impossível"
        ],
        correct: 0,
        expected: "Duplicidade de matrícula",
        feedback: "Matrícula duplicada é um alerta crítico porque pode distorcer benefícios, lançamentos, integrações e relatórios."
    },
    {
        id: "excel_q2",
        title: "Para buscar o sindicato correto de uma base auxiliar pela matrícula no Excel 365, qual fórmula é a mais adequada?",
        options: [
            "SOMA",
            "CONT.SE",
            "PROCX",
            "SE"
        ],
        correct: 2,
        expected: "PROCX",
        feedback: "PROCX é a opção mais robusta para localizar informações em bases auxiliares, reduzindo risco de erro manual."
    },
    {
        id: "excel_q3",
        title: "Qual filtro melhor ajuda a mostrar quem exige ação imediata na rotina de conferência?",
        options: [
            "Somente salário acima de 5.000",
            "Somente centro de custo 101",
            "Benefício = Pendente ou Conferência = Pendente",
            "Horas extras maior que zero"
        ],
        correct: 2,
        expected: "Benefício = Pendente ou Conferência = Pendente",
        feedback: "Filtro operacional bom é o que aproxima a pessoa da pendência real, não apenas de um dado periférico."
    },
    {
        id: "excel_q4",
        title: "Qual é o total de VT do centro de custo 101 na base apresentada?",
        options: [
            "220",
            "460",
            "240",
            "440"
        ],
        correct: 1,
        expected: "460",
        feedback: "Somando os valores de VT do centro 101: 220 + 240 + 0 = 460. Isso mede leitura da base e conferência simples."
    },
    {
        id: "excel_q5",
        title: "Qual coluna é a melhor candidata para criar uma regra de alerta operacional visual?",
        options: [
            "Nome",
            "Status de benefício e conferência",
            "Matrícula apenas",
            "Salário apenas"
        ],
        correct: 1,
        expected: "Status de benefício e conferência",
        feedback: "A lógica de alerta visual precisa apontar pendência operacional concreta, e não apenas um dado cadastral."
    }
];

const folhaCases = [
    {
        id: "folha_q1",
        title: "Caso 1",
        description: "Colaborador faltou 2 dias sem justificativa. Antes do fechamento, qual linha de ação é a mais correta?",
        options: [
            "Lançar desconto direto sem validar nada mais",
            "Conferir ponto, validar ausência, verificar reflexos e alinhar a evidência antes do fechamento",
            "Ignorar neste mês e ajustar depois",
            "Pagar normalmente para evitar conflito"
        ],
        correct: 1,
        expected: "Conferir ponto, validar ausência, verificar reflexos e alinhar a evidência antes do fechamento",
        feedback: "Folha madura não se apoia em suposição. Primeiro se valida evidência, reflexos e rastreabilidade do lançamento."
    },
    {
        id: "folha_q2",
        title: "Caso 2",
        description: "Admitido entrou no meio do mês e o benefício ainda não foi ativado. Qual o melhor caminho?",
        options: [
            "Esperar o próximo mês sem qualquer retorno",
            "Validar elegibilidade, regra interna, janela do fornecedor e possibilidade de ajuste manual",
            "Excluir o benefício da base definitivamente",
            "Lançar qualquer valor médio sem comprovação"
        ],
        correct: 1,
        expected: "Validar elegibilidade, regra interna, janela do fornecedor e possibilidade de ajuste manual",
        feedback: "A melhor resposta combina regra, fornecedor, impacto no colaborador e alternativa segura de correção."
    },
    {
        id: "folha_q3",
        title: "Caso 3",
        description: "Gestor pede pagamento de hora extra, mas o ponto ainda não está fechado. Qual é o principal risco?",
        options: [
            "Nenhum, porque o gestor pediu",
            "Pagamento indevido, retrabalho e perda de rastreabilidade",
            "Somente atraso no e-mail",
            "Apenas impacto em férias futuras"
        ],
        correct: 1,
        expected: "Pagamento indevido, retrabalho e perda de rastreabilidade",
        feedback: "Sem ponto validado, o lançamento perde sustentação e aumenta o risco de erro financeiro."
    },
    {
        id: "folha_q4",
        title: "Caso 4",
        description: "Rescisão precisa sair hoje, mas há divergência no saldo de férias. Como conduzir?",
        options: [
            "Pagar qualquer valor aproximado e corrigir depois",
            "Validar período aquisitivo, histórico, afastamentos e evidências antes de concluir o cálculo",
            "Cancelar a rescisão",
            "Solicitar ao colaborador que escolha um valor"
        ],
        correct: 1,
        expected: "Validar período aquisitivo, histórico, afastamentos e evidências antes de concluir o cálculo",
        feedback: "Mesmo sob pressão, rescisão exige segurança técnica. O correto é validar premissas antes de fechar o cálculo."
    },
    {
        id: "folha_q5",
        title: "Caso 5",
        description: "Há diferença entre o valor esperado e o valor calculado na folha. Qual trilha de conferência é a mais madura?",
        options: [
            "Evento, base, incidência, período, cadastro, ponto e comparação com mês anterior",
            "Somente salário base",
            "Somente centro de custo",
            "Somente benefícios"
        ],
        correct: 0,
        expected: "Evento, base, incidência, período, cadastro, ponto e comparação com mês anterior",
        feedback: "A conferência madura olha o fluxo completo e não apenas um campo isolado."
    }
];

const pressureScenario = {
    incidents: [
        {
            id: "p1",
            title: "Rescisão vencendo prazo legal",
            description: "Há documentação pronta, mas o cálculo ainda precisa da última validação."
        },
        {
            id: "p2",
            title: "Fornecedor de benefício cobrando arquivo ainda hoje",
            description: "Sem o envio, haverá risco de atraso no processamento."
        },
        {
            id: "p3",
            title: "Gestor cobrando relatório de headcount com urgência",
            description: "Demanda executiva importante, mas sem risco legal imediato."
        }
    ],
    correctOrder: {
        p1: 1,
        p2: 2,
        p3: 3
    },
    firstActionCorrect: "Comunicar a sequência de prioridade, atuar primeiro no risco legal e organizar os demais envios com previsão clara",
    orderFeedback: {
        p1: "Rescisão com prazo legal é a primeira prioridade por risco jurídico e financeiro imediato.",
        p2: "Fornecedor de benefício vem em seguida, pois impacta processamento e experiência do colaborador.",
        p3: "Headcount é importante, mas deve receber retorno claro sem ultrapassar itens críticos do fechamento."
    },
    actionFeedback: "O esperado é demonstrar liderança operacional: definir ordem, comunicar previsão e proteger o fechamento."
};

const pageTitle = document.getElementById("pageTitle");
const content = document.getElementById("content");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnReset = document.getElementById("btnReset");
const scoreDisplay = document.getElementById("scoreDisplay");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const timerEl = document.getElementById("timer");

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStep: state.currentStep,
        remainingSeconds: state.remainingSeconds,
        answers: state.answers,
        scores: state.scores,
        timerStarted: state.timerStarted,
        attemptSaved: state.attemptSaved
    }));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        state.currentStep = parsed.currentStep ?? 0;
        state.remainingSeconds = parsed.remainingSeconds ?? 45 * 60;
        state.answers = parsed.answers ?? state.answers;
        state.scores = parsed.scores ?? state.scores;
        state.timerStarted = parsed.timerStarted ?? false;
        state.attemptSaved = parsed.attemptSaved ?? false;
    } catch (error) {
        console.error("Erro ao carregar estado salvo:", error);
    }
}

function resetState() {
    localStorage.removeItem(STORAGE_KEY);
    state.currentStep = 0;
    state.remainingSeconds = 45 * 60;
    state.timerStarted = false;
    state.attemptSaved = false;
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.answers = {
        triage: {},
        triageJustification: "",
        excel: {},
        folha: {},
        pressure: {}
    };
    state.scores = {
        triage: 0,
        excel: 0,
        folha: 0,
        pressure: 0
    };
    updateTimerDisplay();
    render();
}

function getHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        return [];
    }
}

function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    render();
}

function getTimestamp() {
    return new Date().toLocaleString("pt-BR");
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function updateTimerDisplay() {
    timerEl.textContent = formatTime(state.remainingSeconds);
    timerEl.classList.remove("warning-timer", "danger-timer");

    if (state.remainingSeconds <= 300) {
        timerEl.classList.add("danger-timer");
    } else if (state.remainingSeconds <= 900) {
        timerEl.classList.add("warning-timer");
    }
}

function startTimer() {
    if (state.timerInterval) return;

    state.timerInterval = setInterval(() => {
        if (state.remainingSeconds > 0) {
            state.remainingSeconds -= 1;
            updateTimerDisplay();
            saveState();
        } else {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
            alert("O tempo da dinâmica terminou.");
        }
    }, 1000);
}

function getTotalScore() {
    return state.scores.triage + state.scores.excel + state.scores.folha + state.scores.pressure;
}

function updateHeader() {
    const titles = [
        "Cenário da operação",
        "Missão 1: Triagem inteligente",
        "Missão 2: Excel aplicado ao DP",
        "Missão 3: Decisão de folha",
        "Missão 4: Pressão controlada"
    ];

    pageTitle.textContent = titles[state.currentStep] || "Resultado da dinâmica";
    scoreDisplay.textContent = `${getTotalScore()} / 55`;

    const progressPercent = ((Math.min(state.currentStep + 1, state.totalSteps)) / state.totalSteps) * 100;
    progressBar.style.width = `${progressPercent}%`;
    progressText.textContent = state.currentStep < state.totalSteps
        ? `Etapa ${state.currentStep + 1} de ${state.totalSteps}`
        : `Resultado final`;

    document.querySelectorAll(".step-item").forEach((item, index) => {
        item.classList.remove("active", "completed");

        if (index === state.currentStep) {
            item.classList.add("active");
        } else if (index < state.currentStep) {
            item.classList.add("completed");
        }
    });

    btnPrev.disabled = state.currentStep === 0;
    btnNext.textContent = state.currentStep === state.totalSteps ? "Finalizado" : (state.currentStep === state.totalSteps - 1 ? "Ver resultado" : "Avançar");
    btnNext.disabled = state.currentStep === state.totalSteps;
}

function render() {
    updateHeader();
    updateTimerDisplay();

    switch (state.currentStep) {
        case 0:
            renderIntro();
            break;
        case 1:
            renderTriage();
            break;
        case 2:
            renderExcel();
            break;
        case 3:
            renderFolha();
            break;
        case 4:
            renderPressure();
            break;
        case 5:
            renderResult();
            break;
        default:
            renderIntro();
            break;
    }

    saveState();
}

function renderIntro() {
    content.innerHTML = `
        <div class="hero-grid">
            <div class="card">
                <div class="badge">Contexto</div>
                <h3>Hoje é dia de fechamento</h3>
                <p>
                    Você assumiu a operação de Departamento Pessoal em um momento de alta demanda.
                    Há pendências de folha, ponto, benefícios e solicitações de gestão chegando ao mesmo tempo.
                    Seu objetivo é demonstrar organização, priorização, domínio de Excel e maturidade de decisão.
                </p>
                <p>
                    Esta dinâmica não tem pegadinhas. O foco é observar como você pensa, organiza
                    e executa diante de situações reais do ambiente de DP.
                </p>

                <div class="meta-grid">
                    <div class="meta-box">
                        <div class="meta-box-label">Etapas</div>
                        <div class="meta-box-value">5</div>
                    </div>
                    <div class="meta-box">
                        <div class="meta-box-label">Pontuação máxima</div>
                        <div class="meta-box-value">55</div>
                    </div>
                    <div class="meta-box">
                        <div class="meta-box-label">Tempo sugerido</div>
                        <div class="meta-box-value">45 min</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="badge">Critérios</div>
                <h4>O que será avaliado</h4>
                <ul>
                    <li>Priorização sob volume</li>
                    <li>Excel aplicado à rotina</li>
                    <li>Noção prática de folha</li>
                    <li>Leitura de risco operacional</li>
                    <li>Atuação em ambiente de pressão</li>
                </ul>

                <div class="highlight" style="margin-top:16px;">
                    Ao avançar pela primeira vez, o cronômetro será iniciado e o progresso ficará salvo localmente no navegador.
                </div>
            </div>
        </div>
    `;
}

function renderTriage() {
    const cardsHtml = triageDemands.map(demand => `
        <div class="demand-card">
            <div class="badge">Demanda operacional</div>
            <h4>${demand.title}</h4>
            <p>${demand.description}</p>
            <label class="label" for="priority_${demand.id}">Escolha a ordem de tratamento</label>
            <select class="select triage-select" id="priority_${demand.id}" data-id="${demand.id}">
                <option value="">Selecione</option>
                <option value="1" ${state.answers.triage[demand.id] == 1 ? "selected" : ""}>1 - Eu trataria primeiro</option>
                <option value="2" ${state.answers.triage[demand.id] == 2 ? "selected" : ""}>2 - Eu trataria em segundo</option>
                <option value="3" ${state.answers.triage[demand.id] == 3 ? "selected" : ""}>3 - Eu trataria em terceiro</option>
                <option value="4" ${state.answers.triage[demand.id] == 4 ? "selected" : ""}>4 - Eu trataria em quarto</option>
                <option value="5" ${state.answers.triage[demand.id] == 5 ? "selected" : ""}>5 - Eu trataria por último</option>
            </select>
        </div>
    `).join("");

    content.innerHTML = `
        <h3 class="section-title">Missão 1: Triagem inteligente</h3>
        <p class="section-subtitle">
            Leia as 5 demandas abaixo e monte uma fila única de priorização.
            Você deve usar cada número apenas uma vez.
            O número 1 significa a primeira ação que você faria.
            O número 5 significa a última ação entre estas 5 opções.
        </p>

        <div class="info-box">
            <strong>Pergunta da etapa:</strong><br>
            Se estas 5 demandas chegassem ao mesmo tempo na sua mesa, em qual ordem exata você trataria cada uma?
        </div>

        <div class="expectation-box">
            <strong>O que se espera nesta etapa:</strong><br>
            A ordem esperada deve considerar principalmente:
            prazo legal, risco financeiro na folha, possibilidade de erro de processamento,
            impacto direto no colaborador e continuidade do fechamento.
            Não é uma etapa para priorizar quem cobra mais alto, e sim o que mais protege a operação.
        </div>

        <div class="cards-grid">
            ${cardsHtml}
        </div>

        <div class="card" style="margin-top:18px;">
            <label class="label" for="triageJustification">Explique brevemente por que você definiu essa ordem</label>
            <textarea class="textarea" id="triageJustification" placeholder="Exemplo: priorizei primeiro risco legal, depois impacto direto em folha e depois demandas gerenciais...">${state.answers.triageJustification || ""}</textarea>
            <div class="small-muted" style="margin-top:8px;">
                Esta justificativa não altera a pontuação automática, mas ajuda muito na discussão da entrevista.
            </div>
        </div>
    `;

    document.querySelectorAll(".triage-select").forEach(select => {
        select.addEventListener("change", (event) => {
            const id = event.target.dataset.id;
            state.answers.triage[id] = Number(event.target.value);
            calculateTriageScore();
            saveState();
            updateHeader();
        });
    });

    document.getElementById("triageJustification").addEventListener("input", (event) => {
        state.answers.triageJustification = event.target.value;
        saveState();
    });
}

function calculateTriageScore() {
    let score = 0;

    triageDemands.forEach(demand => {
        if (Number(state.answers.triage[demand.id]) === demand.correctPriority) {
            score += 2;
        }
    });

    state.scores.triage = Math.min(score, 10);
}

function renderExcel() {
    const tableRows = excelDataset.map(row => `
        <tr>
            <td>${row.matricula}</td>
            <td>${row.nome}</td>
            <td>R$ ${row.salario.toLocaleString("pt-BR")}</td>
            <td>${row.admissao}</td>
            <td>${row.beneficio}</td>
            <td>R$ ${row.vt.toLocaleString("pt-BR")}</td>
            <td>${row.faltas}</td>
            <td>${row.he}</td>
            <td>${row.cc}</td>
            <td>${row.sindicato}</td>
            <td>${row.conferencia}</td>
        </tr>
    `).join("");

    const questionsHtml = excelQuestions.map((question, qIndex) => `
        <div class="question-card">
            <div class="badge">Questão ${qIndex + 1}</div>
            <div class="question-block">
                <strong>${question.title}</strong>
                <div class="option-list">
                    ${question.options.map((option, index) => `
                        <div class="option-item">
                            <input
                                type="radio"
                                id="${question.id}_${index}"
                                name="${question.id}"
                                value="${index}"
                                ${Number(state.answers.excel[question.id]) === index ? "checked" : ""}
                            />
                            <label for="${question.id}_${index}">${option}</label>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `).join("");

    content.innerHTML = `
        <h3 class="section-title">Missão 2: Excel aplicado ao DP</h3>
        <p class="section-subtitle">
            Leia a base abaixo como se fosse uma prévia operacional de fechamento.
            O foco é identificar alertas, ler a base com critério e escolher a melhor ação de Excel para a rotina.
        </p>

        <div class="kpi-row">
            <div class="kpi-card">
                <div class="kpi-title">Linhas na base</div>
                <div class="kpi-value">${excelDataset.length}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Benefícios pendentes</div>
                <div class="kpi-value">${excelDataset.filter(item => item.beneficio === "Pendente").length}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Conferências pendentes</div>
                <div class="kpi-value">${excelDataset.filter(item => item.conferencia === "Pendente").length}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Duplicidades visíveis</div>
                <div class="kpi-value">1</div>
            </div>
        </div>

        <div class="table-wrapper">
            <table class="table">
                <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>Nome</th>
                        <th>Salário</th>
                        <th>Admissão</th>
                        <th>Benefício</th>
                        <th>VT</th>
                        <th>Faltas</th>
                        <th>Horas Extras</th>
                        <th>Centro de Custo</th>
                        <th>Sindicato</th>
                        <th>Conferência</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>

        <div class="case-grid" style="margin-top:18px;">
            ${questionsHtml}
        </div>
    `;

    excelQuestions.forEach(question => {
        question.options.forEach((_, index) => {
            const radio = document.getElementById(`${question.id}_${index}`);
            radio.addEventListener("change", () => {
                state.answers.excel[question.id] = Number(radio.value);
                calculateExcelScore();
                saveState();
                updateHeader();
            });
        });
    });
}

function calculateExcelScore() {
    let score = 0;

    excelQuestions.forEach(question => {
        if (Number(state.answers.excel[question.id]) === question.correct) {
            score += 3;
        }
    });

    state.scores.excel = Math.min(score, 15);
}

function renderFolha() {
    const casesHtml = folhaCases.map((item) => `
        <div class="case-card">
            <div class="badge">${item.title}</div>
            <p><strong>${item.description}</strong></p>

            <div class="option-list">
                ${item.options.map((option, index) => `
                    <div class="option-item">
                        <input
                            type="radio"
                            id="${item.id}_${index}"
                            name="${item.id}"
                            value="${index}"
                            ${Number(state.answers.folha[item.id]) === index ? "checked" : ""}
                        />
                        <label for="${item.id}_${index}">${option}</label>
                    </div>
                `).join("")}
            </div>
        </div>
    `).join("");

    content.innerHTML = `
        <h3 class="section-title">Missão 3: Decisão de folha</h3>
        <p class="section-subtitle">
            Agora o foco é técnico-operacional. Você precisa mostrar leitura de impacto,
            segurança de processo e capacidade de decidir sem improvisar.
        </p>

        <div class="highlight">
            Nesta etapa, a melhor resposta é a que protege a operação, sustenta o lançamento
            e reduz risco de erro ou retrabalho.
        </div>

        <div class="case-grid">
            ${casesHtml}
        </div>
    `;

    folhaCases.forEach(item => {
        item.options.forEach((_, index) => {
            const radio = document.getElementById(`${item.id}_${index}`);
            radio.addEventListener("change", () => {
                state.answers.folha[item.id] = Number(radio.value);
                calculateFolhaScore();
                saveState();
                updateHeader();
            });
        });
    });
}

function calculateFolhaScore() {
    let score = 0;

    folhaCases.forEach(item => {
        if (Number(state.answers.folha[item.id]) === item.correct) {
            score += 4;
        }
    });

    state.scores.folha = Math.min(score, 20);
}

function renderPressure() {
    const cardsHtml = pressureScenario.incidents.map(incident => `
        <div class="pressure-card">
            <div class="badge">Interrupção simultânea</div>
            <h4>${incident.title}</h4>
            <p>${incident.description}</p>
            <label class="label" for="pressure_${incident.id}">Escolha a ordem de tratamento</label>
            <select class="select pressure-select" id="pressure_${incident.id}" data-id="${incident.id}">
                <option value="">Selecione</option>
                <option value="1" ${state.answers.pressure[incident.id] == 1 ? "selected" : ""}>1 - Primeiro</option>
                <option value="2" ${state.answers.pressure[incident.id] == 2 ? "selected" : ""}>2 - Segundo</option>
                <option value="3" ${state.answers.pressure[incident.id] == 3 ? "selected" : ""}>3 - Terceiro</option>
            </select>
        </div>
    `).join("");

    const actions = [
        "Responder todos ao mesmo tempo sem ordem definida",
        "Atender primeiro quem cobrou mais alto",
        "Comunicar a sequência de prioridade, atuar primeiro no risco legal e organizar os demais envios com previsão clara",
        "Parar tudo e aguardar nova orientação"
    ];

    content.innerHTML = `
        <h3 class="section-title">Missão 4: Pressão controlada</h3>
        <p class="section-subtitle">
            Você está nos minutos finais do fechamento. Três demandas urgentes chegam ao mesmo tempo.
            Organize a resposta sem perder o controle operacional.
        </p>

        <div class="expectation-box">
            <strong>O que se espera nesta etapa:</strong><br>
            Primeiro vem o risco legal, depois o que pode comprometer processamento ou pagamento,
            e por último demandas gerenciais sem risco imediato.
            Além disso, espera-se comunicação objetiva com previsão de retorno.
        </div>

        <div class="cards-grid">
            ${cardsHtml}
        </div>

        <div class="card" style="margin-top:18px;">
            <label class="label">Qual a melhor primeira postura diante desse cenário?</label>
            <div class="option-list">
                ${actions.map((action, index) => `
                    <div class="option-item">
                        <input
                            type="radio"
                            id="pressureAction_${index}"
                            name="pressureAction"
                            value="${action}"
                            ${state.answers.pressure.firstAction === action ? "checked" : ""}
                        />
                        <label for="pressureAction_${index}">${action}</label>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    document.querySelectorAll(".pressure-select").forEach(select => {
        select.addEventListener("change", (event) => {
            const id = event.target.dataset.id;
            state.answers.pressure[id] = Number(event.target.value);
            calculatePressureScore();
            saveState();
            updateHeader();
        });
    });

    actions.forEach((action, index) => {
        const radio = document.getElementById(`pressureAction_${index}`);
        radio.addEventListener("change", () => {
            state.answers.pressure.firstAction = radio.value;
            calculatePressureScore();
            saveState();
            updateHeader();
        });
    });
}

function calculatePressureScore() {
    let score = 0;

    pressureScenario.incidents.forEach(incident => {
        if (Number(state.answers.pressure[incident.id]) === pressureScenario.correctOrder[incident.id]) {
            score += 2;
        }
    });

    if (state.answers.pressure.firstAction === pressureScenario.firstActionCorrect) {
        score += 4;
    }

    state.scores.pressure = Math.min(score, 10);
}

function getLevel(score) {
    if (score >= 46) return "Muito boa aderência";
    if (score >= 36) return "Boa aderência";
    if (score >= 26) return "Aderência parcial";
    return "Necessita desenvolvimento";
}

function getNarrative(score) {
    if (score >= 46) {
        return "A candidata demonstrou boa leitura de prioridade, segurança operacional e maturidade para atuar em rotina intensa de DP com menor necessidade de supervisão.";
    }
    if (score >= 36) {
        return "A candidata mostrou base consistente para a rotina operacional, com pontos de desenvolvimento pontuais em leitura de risco ou profundidade técnica.";
    }
    if (score >= 26) {
        return "A candidata apresenta potencial para operação assistida, mas ainda precisa evoluir em priorização, conferência ou tomada de decisão sob pressão.";
    }
    return "A candidata ainda não demonstrou consistência suficiente para uma rotina de alta demanda sem acompanhamento próximo.";
}

function saveAttemptIfNeeded() {
    if (state.attemptSaved) return;

    const history = getHistory();
    const total = getTotalScore();
    const newAttempt = {
        id: Date.now(),
        date: getTimestamp(),
        total,
        level: getLevel(total),
        scores: {
            triage: state.scores.triage,
            excel: state.scores.excel,
            folha: state.scores.folha,
            pressure: state.scores.pressure
        }
    };

    history.unshift(newAttempt);
    saveHistory(history.slice(0, 50));
    state.attemptSaved = true;
    saveState();
}

function renderStatusPill(correct) {
    if (correct) {
        return `<span class="status-pill correct">Correto</span>`;
    }
    return `<span class="status-pill wrong">Ponto de atenção</span>`;
}

function getSelectedOption(options, value) {
    if (typeof value === "undefined" || value === null || value === "") return "Não respondido";
    return options[value] ?? "Não respondido";
}

function renderTriageReview() {
    const items = triageDemands.map(item => {
        const selected = Number(state.answers.triage[item.id]);
        const correct = selected === item.correctPriority;

        return `
            <div class="review-item ${correct ? "correct" : "wrong"}">
                <div class="review-title">
                    <h4>${item.title}</h4>
                    ${renderStatusPill(correct)}
                </div>
                <div class="review-line"><span class="review-label">Sua ordem:</span> ${selected || "Não respondido"}</div>
                <div class="review-line"><span class="review-label">Ordem esperada:</span> ${item.correctPriority}</div>
                <div class="review-line"><span class="review-label">O que se esperava:</span> ${item.expected}</div>
                <div class="review-line"><span class="review-label">Feedback para discussão:</span> ${item.feedback}</div>
            </div>
        `;
    }).join("");

    return `
        <div class="review-section">
            <h3 class="section-divider">Devolutiva da priorização</h3>
            <div class="small-muted" style="margin-bottom:12px;">
                Justificativa registrada: ${state.answers.triageJustification ? state.answers.triageJustification : "Não informada"}
            </div>
            <div class="review-grid">
                ${items}
            </div>
        </div>
    `;
}

function renderMCQReview(title, questions, answerBag) {
    const items = questions.map(question => {
        const selected = Number(answerBag[question.id]);
        const correct = selected === question.correct;

        return `
            <div class="review-item ${correct ? "correct" : "wrong"}">
                <div class="review-title">
                    <h4>${question.title}</h4>
                    ${renderStatusPill(correct)}
                </div>
                <div class="review-line"><span class="review-label">Sua resposta:</span> ${getSelectedOption(question.options, selected)}</div>
                <div class="review-line"><span class="review-label">Resposta esperada:</span> ${question.expected}</div>
                <div class="review-line"><span class="review-label">Feedback para discussão:</span> ${question.feedback}</div>
            </div>
        `;
    }).join("");

    return `
        <div class="review-section">
            <h3 class="section-divider">${title}</h3>
            <div class="review-grid">
                ${items}
            </div>
        </div>
    `;
}

function renderPressureReview() {
    const orderItems = pressureScenario.incidents.map(item => {
        const selected = Number(state.answers.pressure[item.id]);
        const correct = selected === pressureScenario.correctOrder[item.id];

        return `
            <div class="review-item ${correct ? "correct" : "wrong"}">
                <div class="review-title">
                    <h4>${item.title}</h4>
                    ${renderStatusPill(correct)}
                </div>
                <div class="review-line"><span class="review-label">Sua ordem:</span> ${selected || "Não respondido"}</div>
                <div class="review-line"><span class="review-label">Ordem esperada:</span> ${pressureScenario.correctOrder[item.id]}</div>
                <div class="review-line"><span class="review-label">Feedback para discussão:</span> ${pressureScenario.orderFeedback[item.id]}</div>
            </div>
        `;
    }).join("");

    const actionCorrect = state.answers.pressure.firstAction === pressureScenario.firstActionCorrect;

    const actionItem = `
        <div class="review-item ${actionCorrect ? "correct" : "wrong"}">
            <div class="review-title">
                <h4>Postura inicial diante da pressão</h4>
                ${renderStatusPill(actionCorrect)}
            </div>
            <div class="review-line"><span class="review-label">Sua resposta:</span> ${state.answers.pressure.firstAction || "Não respondido"}</div>
            <div class="review-line"><span class="review-label">Resposta esperada:</span> ${pressureScenario.firstActionCorrect}</div>
            <div class="review-line"><span class="review-label">Feedback para discussão:</span> ${pressureScenario.actionFeedback}</div>
        </div>
    `;

    return `
        <div class="review-section">
            <h3 class="section-divider">Devolutiva da pressão controlada</h3>
            <div class="review-grid">
                ${orderItems}
                ${actionItem}
            </div>
        </div>
    `;
}

function renderHistorySection() {
    const history = getHistory();

    if (!history.length) {
        return `
            <div class="review-section">
                <h3 class="section-divider">Histórico de tentativas</h3>
                <div class="empty-history">Ainda não há histórico registrado.</div>
            </div>
        `;
    }

    const rows = history.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.date}</td>
            <td>${item.total} / 55</td>
            <td>${item.level}</td>
            <td>${item.scores.triage}</td>
            <td>${item.scores.excel}</td>
            <td>${item.scores.folha}</td>
            <td>${item.scores.pressure}</td>
        </tr>
    `).join("");

    return `
        <div class="review-section">
            <h3 class="section-divider">Histórico de tentativas</h3>
            <div class="count-box">Total de vezes realizadas: ${history.length}</div>
            <div class="table-wrapper" style="margin-top:12px;">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Nº</th>
                            <th>Data</th>
                            <th>Total</th>
                            <th>Nível</th>
                            <th>Triagem</th>
                            <th>Excel</th>
                            <th>Folha</th>
                            <th>Pressão</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderResult() {
    saveAttemptIfNeeded();

    const total = getTotalScore();
    const level = getLevel(total);
    const narrative = getNarrative(total);

    content.innerHTML = `
        <h3 class="section-title">Resultado da dinâmica</h3>
        <p class="section-subtitle">
            Abaixo está a consolidação automática da simulação, com resultado, devolutiva por questão,
            expectativa de resposta e histórico da avaliação.
        </p>

        <div class="result-layout">
            <div class="result-score-box">
                <h3>Pontuação final</h3>
                <div class="result-big-score">${total}</div>
                <div>de 55 pontos possíveis</div>
                <div class="result-level" style="margin-top:16px;">${level}</div>
            </div>

            <div class="result-list">
                <div class="result-item">
                    <div class="result-item-title">Triagem</div>
                    <div class="result-item-value">${state.scores.triage} / 10</div>
                </div>
                <div class="result-item">
                    <div class="result-item-title">Excel</div>
                    <div class="result-item-value">${state.scores.excel} / 15</div>
                </div>
                <div class="result-item">
                    <div class="result-item-title">Folha e DP</div>
                    <div class="result-item-value">${state.scores.folha} / 20</div>
                </div>
                <div class="result-item">
                    <div class="result-item-title">Pressão e priorização final</div>
                    <div class="result-item-value">${state.scores.pressure} / 10</div>
                </div>
            </div>
        </div>

        <div class="notice">
            <strong>Leitura sugerida:</strong> ${narrative}
        </div>

        <div class="card" style="margin-top:18px;">
            <h4>Observação do avaliador</h4>
            <p class="small-muted">
                A lógica desta dinâmica é medir aderência operacional e raciocínio prático.
                A tela abaixo mostra onde houve acerto, onde houve desvio e qual resposta era esperada,
                ajudando a conduzir a conversa da entrevista com base em evidências.
            </p>

            <div class="export-actions">
                <button id="btnExportTxt" class="btn btn-secondary" type="button">Exportar TXT</button>
                <button id="btnExportPdf" class="btn btn-primary" type="button">Gerar PDF</button>
                <button id="btnRestartFlow" class="btn btn-secondary" type="button">Refazer dinâmica</button>
                <button id="btnClearHistory" class="btn btn-danger" type="button">Limpar histórico</button>
            </div>
        </div>

        ${renderTriageReview()}
        ${renderMCQReview("Devolutiva do Excel aplicado", excelQuestions, state.answers.excel)}
        ${renderMCQReview("Devolutiva da decisão de folha", folhaCases, state.answers.folha)}
        ${renderPressureReview()}
        ${renderHistorySection()}
    `;

    document.getElementById("btnExportTxt").addEventListener("click", exportResultTxt);
    document.getElementById("btnExportPdf").addEventListener("click", exportResultPdf);
    document.getElementById("btnRestartFlow").addEventListener("click", resetState);
    document.getElementById("btnClearHistory").addEventListener("click", () => {
        const confirmed = confirm("Deseja apagar todo o histórico de tentativas?");
        if (confirmed) clearHistory();
    });
}

function exportResultTxt() {
    const total = getTotalScore();
    const level = getLevel(total);
    const narrative = getNarrative(total);
    const history = getHistory();

    const lines = [
        "OPERACAO FECHAMENTO DP",
        "RESULTADO DA DINAMICA",
        "",
        `Data da tentativa: ${getTimestamp()}`,
        `Pontuacao final: ${total} / 55`,
        `Nivel: ${level}`,
        "",
        `Triagem: ${state.scores.triage} / 10`,
        `Excel: ${state.scores.excel} / 15`,
        `Folha e DP: ${state.scores.folha} / 20`,
        `Pressao final: ${state.scores.pressure} / 10`,
        "",
        "Leitura sugerida:",
        narrative,
        "",
        "JUSTIFICATIVA DA TRIAGEM:",
        state.answers.triageJustification || "Nao informada",
        "",
        "DEVOLUTIVA TRIAGEM:"
    ];

    triageDemands.forEach(item => {
        lines.push(`- ${item.title}`);
        lines.push(`  Sua ordem: ${state.answers.triage[item.id] || "Nao respondido"}`);
        lines.push(`  Ordem esperada: ${item.correctPriority}`);
        lines.push(`  O que se esperava: ${item.expected}`);
        lines.push(`  Feedback: ${item.feedback}`);
        lines.push("");
    });

    lines.push("DEVOLUTIVA EXCEL:");
    excelQuestions.forEach(item => {
        lines.push(`- ${item.title}`);
        lines.push(`  Sua resposta: ${getSelectedOption(item.options, state.answers.excel[item.id])}`);
        lines.push(`  Resposta esperada: ${item.expected}`);
        lines.push(`  Feedback: ${item.feedback}`);
        lines.push("");
    });

    lines.push("DEVOLUTIVA FOLHA:");
    folhaCases.forEach(item => {
        lines.push(`- ${item.title}`);
        lines.push(`  Sua resposta: ${getSelectedOption(item.options, state.answers.folha[item.id])}`);
        lines.push(`  Resposta esperada: ${item.expected}`);
        lines.push(`  Feedback: ${item.feedback}`);
        lines.push("");
    });

    lines.push("DEVOLUTIVA PRESSAO:");
    pressureScenario.incidents.forEach(item => {
        lines.push(`- ${item.title}`);
        lines.push(`  Sua ordem: ${state.answers.pressure[item.id] || "Nao respondido"}`);
        lines.push(`  Ordem esperada: ${pressureScenario.correctOrder[item.id]}`);
        lines.push(`  Feedback: ${pressureScenario.orderFeedback[item.id]}`);
        lines.push("");
    });

    lines.push("- Postura inicial");
    lines.push(`  Sua resposta: ${state.answers.pressure.firstAction || "Nao respondido"}`);
    lines.push(`  Resposta esperada: ${pressureScenario.firstActionCorrect}`);
    lines.push(`  Feedback: ${pressureScenario.actionFeedback}`);
    lines.push("");

    lines.push("HISTORICO DE TENTATIVAS:");
    history.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.date} | ${item.total}/55 | ${item.level}`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "resultado_operacao_fechamento_dp.txt";
    link.click();

    URL.revokeObjectURL(url);
}

function wrapTextForPdf(doc, text, maxWidth) {
    return doc.splitTextToSize(String(text), maxWidth);
}

function addPdfBlock(doc, lines, y, margin, pageWidth, pageHeight, options = {}) {
    const fontSize = options.fontSize || 10;
    const isBold = options.bold || false;
    const gap = options.gap || 14;

    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(fontSize);

    lines.forEach(line => {
        const wrapped = wrapTextForPdf(doc, line, pageWidth - (margin * 2));
        wrapped.forEach(innerLine => {
            if (y > pageHeight - 40) {
                doc.addPage();
                y = 40;
                doc.setFont("helvetica", isBold ? "bold" : "normal");
                doc.setFontSize(fontSize);
            }
            doc.text(innerLine, margin, y);
            y += gap;
        });
    });

    return y;
}

function exportResultPdf() {
    const total = getTotalScore();
    const level = getLevel(total);
    const narrative = getNarrative(total);
    const history = getHistory();

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Biblioteca de PDF não carregada. Verifique sua conexão ou use a exportação TXT.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 40;

    y = addPdfBlock(doc, ["Operação Fechamento DP"], y, margin, pageWidth, pageHeight, { fontSize: 18, bold: true, gap: 20 });
    y = addPdfBlock(doc, [
        `Data da tentativa: ${getTimestamp()}`,
        `Pontuação final: ${total} / 55`,
        `Nível: ${level}`,
        `Triagem: ${state.scores.triage} / 10`,
        `Excel: ${state.scores.excel} / 15`,
        `Folha e DP: ${state.scores.folha} / 20`,
        `Pressão final: ${state.scores.pressure} / 10`
    ], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });

    y += 8;
    y = addPdfBlock(doc, ["Leitura sugerida"], y, margin, pageWidth, pageHeight, { fontSize: 12, bold: true, gap: 16 });
    y = addPdfBlock(doc, [narrative], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });

    y += 8;
    y = addPdfBlock(doc, ["Justificativa da triagem"], y, margin, pageWidth, pageHeight, { fontSize: 12, bold: true, gap: 16 });
    y = addPdfBlock(doc, [state.answers.triageJustification || "Não informada"], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });

    y += 8;
    y = addPdfBlock(doc, ["Devolutiva da priorização"], y, margin, pageWidth, pageHeight, { fontSize: 12, bold: true, gap: 16 });
    triageDemands.forEach(item => {
        y = addPdfBlock(doc, [
            item.title,
            `Sua ordem: ${state.answers.triage[item.id] || "Não respondido"}`,
            `Ordem esperada: ${item.correctPriority}`,
            `O que se esperava: ${item.expected}`,
            `Feedback: ${item.feedback}`
        ], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });
        y += 6;
    });

    y += 8;
    y = addPdfBlock(doc, ["Devolutiva do Excel"], y, margin, pageWidth, pageHeight, { fontSize: 12, bold: true, gap: 16 });
    excelQuestions.forEach(item => {
        y = addPdfBlock(doc, [
            item.title,
            `Sua resposta: ${getSelectedOption(item.options, state.answers.excel[item.id])}`,
            `Resposta esperada: ${item.expected}`,
            `Feedback: ${item.feedback}`
        ], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });
        y += 6;
    });

    y += 8;
    y = addPdfBlock(doc, ["Devolutiva da folha"], y, margin, pageWidth, pageHeight, { fontSize: 12, bold: true, gap: 16 });
    folhaCases.forEach(item => {
        y = addPdfBlock(doc, [
            item.title,
            item.description,
            `Sua resposta: ${getSelectedOption(item.options, state.answers.folha[item.id])}`,
            `Resposta esperada: ${item.expected}`,
            `Feedback: ${item.feedback}`
        ], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });
        y += 6;
    });

    y += 8;
    y = addPdfBlock(doc, ["Devolutiva da pressão"], y, margin, pageWidth, pageHeight, { fontSize: 12, bold: true, gap: 16 });
    pressureScenario.incidents.forEach(item => {
        y = addPdfBlock(doc, [
            item.title,
            `Sua ordem: ${state.answers.pressure[item.id] || "Não respondido"}`,
            `Ordem esperada: ${pressureScenario.correctOrder[item.id]}`,
            `Feedback: ${pressureScenario.orderFeedback[item.id]}`
        ], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });
        y += 6;
    });

    y = addPdfBlock(doc, [
        "Postura inicial diante da pressão",
        `Sua resposta: ${state.answers.pressure.firstAction || "Não respondido"}`,
        `Resposta esperada: ${pressureScenario.firstActionCorrect}`,
        `Feedback: ${pressureScenario.actionFeedback}`
    ], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });

    y += 8;
    y = addPdfBlock(doc, ["Histórico de tentativas"], y, margin, pageWidth, pageHeight, { fontSize: 12, bold: true, gap: 16 });
    if (history.length) {
        history.forEach((item, index) => {
            y = addPdfBlock(doc, [
                `${index + 1}. ${item.date} | ${item.total}/55 | ${item.level} | Triagem ${item.scores.triage} | Excel ${item.scores.excel} | Folha ${item.scores.folha} | Pressão ${item.scores.pressure}`
            ], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });
        });
    } else {
        y = addPdfBlock(doc, ["Sem histórico registrado."], y, margin, pageWidth, pageHeight, { fontSize: 10, bold: false, gap: 14 });
    }

    doc.save("resultado_operacao_fechamento_dp.pdf");
}

function validateCurrentStep() {
    if (state.currentStep === 1) {
        const filled = triageDemands.every(item => state.answers.triage[item.id]);
        if (!filled) {
            alert("Preencha a ordem de tratamento para todas as 5 demandas antes de avançar.");
            return false;
        }

        const used = Object.values(state.answers.triage);
        const unique = new Set(used);
        if (unique.size !== triageDemands.length) {
            alert("Na priorização, cada número deve ser usado apenas uma vez. Monte uma fila única de 1 a 5.");
            return false;
        }

        calculateTriageScore();
    }

    if (state.currentStep === 2) {
        const answered = excelQuestions.every(item => typeof state.answers.excel[item.id] !== "undefined");
        if (!answered) {
            alert("Responda todas as questões de Excel antes de avançar.");
            return false;
        }
        calculateExcelScore();
    }

    if (state.currentStep === 3) {
        const answered = folhaCases.every(item => typeof state.answers.folha[item.id] !== "undefined");
        if (!answered) {
            alert("Responda todos os casos de folha antes de avançar.");
            return false;
        }
        calculateFolhaScore();
    }

    if (state.currentStep === 4) {
        const filledOrder = pressureScenario.incidents.every(item => state.answers.pressure[item.id]);
        const hasAction = !!state.answers.pressure.firstAction;

        if (!filledOrder || !hasAction) {
            alert("Preencha a ordem das demandas e a postura inicial antes de ver o resultado.");
            return false;
        }

        const used = pressureScenario.incidents.map(item => state.answers.pressure[item.id]);
        const unique = new Set(used);
        if (unique.size !== pressureScenario.incidents.length) {
            alert("Na etapa de pressão, cada posição deve ser usada apenas uma vez.");
            return false;
        }

        calculatePressureScore();
    }

    return true;
}

btnPrev.addEventListener("click", () => {
    if (state.currentStep > 0) {
        state.currentStep -= 1;
        render();
    }
});

btnNext.addEventListener("click", () => {
    if (state.currentStep === 0 && !state.timerStarted) {
        state.timerStarted = true;
        startTimer();
    }

    if (state.currentStep < state.totalSteps) {
        if (state.currentStep > 0 && !validateCurrentStep()) {
            return;
        }

        if (state.currentStep === state.totalSteps - 1) {
            calculatePressureScore();
        }

        state.currentStep += 1;
        render();
    }
});

btnReset.addEventListener("click", () => {
    const confirmed = confirm("Deseja reiniciar toda a dinâmica?");
    if (confirmed) {
        resetState();
    }
});

loadState();
updateTimerDisplay();

if (state.timerStarted) {
    startTimer();
}

render();