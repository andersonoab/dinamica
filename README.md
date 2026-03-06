# Operação Fechamento DP  
Dinâmica Interativa para Avaliação de Departamento Pessoal

## Visão Geral

**Operação Fechamento DP** é uma aplicação web simples criada para simular situações reais de alta demanda no Departamento Pessoal.  
O objetivo é avaliar **priorização, domínio de Excel, raciocínio operacional de folha e atuação sob demanda**, sem pegadinhas ou perguntas teóricas descoladas da prática.

A dinâmica foi pensada para entrevistas técnicas ou processos seletivos internos, permitindo observar **como o candidato pensa e organiza o trabalho**, e não apenas o que ele memoriza.

A aplicação roda totalmente no navegador, sem necessidade de backend.

---

# Objetivo da Dinâmica

Avaliar de forma prática:

- Priorização de demandas em ambiente de fechamento
- Leitura operacional de planilhas
- Tomada de decisão em folha e DP
- Capacidade de proteger o processo de pagamento
- Organização sob pressão
- Comunicação e justificativa de decisões

---

# Estrutura da Dinâmica

A avaliação possui **5 etapas**:

1. **Cenário**
2. **Triagem de Prioridades**
3. **Excel Aplicado**
4. **Decisão de Folha**
5. **Demanda Operacional**

Tempo sugerido: **45 minutos**

Pontuação máxima: **55 pontos**

---

# Etapa 1 — Cenário

Apresenta o contexto da simulação.

Situação simulada:

> Você assumiu a operação de Departamento Pessoal em um momento de alta demanda.  
> Há pendências de folha, ponto, benefícios e solicitações de gestão chegando ao mesmo tempo.

Objetivo:

Avaliar organização mental antes da execução.

---

# Etapa 2 — Triagem Inteligente

O candidato recebe **5 demandas simultâneas** e deve criar uma **fila única de priorização**.

Exemplo de demandas:

- Rescisão com prazo legal no dia
- Divergência de CPF em VT antes do fechamento
- Inconsistência de horas extras
- Admissão com documento pendente
- Gestor pedindo relatório de headcount

O candidato deve:

- ordenar de **1 a 5**
- explicar sua lógica

Critério esperado:

1. risco legal  
2. impacto financeiro na folha  
3. risco de erro operacional  
4. continuidade da operação  
5. demandas gerenciais  

---

# Etapa 3 — Excel Aplicado ao DP

O candidato recebe uma base simulada com:

- matrícula
- salário
- benefícios
- horas extras
- centro de custo
- conferência

Exemplo de tarefas avaliadas:

- identificar duplicidade
- escolher fórmula correta (PROCX)
- identificar pendências operacionais
- leitura de base
- cálculo simples de valores

Foco da etapa:

> avaliar **Excel como ferramenta operacional**, não como prova de fórmula complexa.

---

# Etapa 4 — Decisão de Folha

São apresentados **microcasos reais de DP**.

Exemplo:

- falta sem justificativa
- benefício não ativado
- hora extra sem ponto validado
- divergência em rescisão
- diferença de cálculo em folha

O candidato deve escolher a melhor decisão operacional.

Critério:

- segurança de processo
- rastreabilidade
- validação antes do lançamento
- redução de risco de erro

---

# Etapa 5 — Pressão Controlada

Simula interrupções simultâneas durante o fechamento.

Exemplo:

- rescisão vencendo prazo
- fornecedor cobrando arquivo
- gestor pedindo relatório urgente

O candidato deve:

1. ordenar as demandas
2. definir postura inicial

Espera-se:

- priorização por risco
- comunicação clara
- proteção do fechamento

---

# Pontuação

| Etapa | Pontos |
|-----|-----|
Triagem | 10 |
Excel | 15 |
Folha | 20 |
Pressão | 10 |
Total | **55** |

---

# Interpretação da Pontuação

| Pontuação | Interpretação |
|-----|-----|
46 – 55 | Muito boa aderência |
36 – 45 | Boa aderência |
26 – 35 | Aderência parcial |
0 – 25 | Necessita desenvolvimento |

---

# Tela de Devolutiva

Após finalizar, a aplicação mostra:

- Pontuação total
- Pontuação por competência
- Resposta do candidato
- Resposta esperada
- Feedback técnico para discussão

Isso permite conduzir a entrevista baseada em evidência.

---

# Exportação de Resultados

A ferramenta permite exportar:

### TXT
Relatório completo com:

- pontuação
- respostas
- expectativa técnica
- feedback por questão

### PDF
Relatório formatado contendo:

- resultado geral
- análise de cada etapa
- comentários técnicos
- histórico de tentativas

---

# Histórico de Tentativas

A aplicação registra automaticamente:

- data da realização
- pontuação
- nível de aderência
- pontuação por competência

Os dados são armazenados no **localStorage do navegador**.

---

# Estrutura do Projeto
