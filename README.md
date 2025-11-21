````markdown
# 🏢 Credvix Admin

Sistema administrativo completo para gestão de vendas, contratos, requisições, financeiro e recursos humanos desenvolvido com Nuxt 3 e Supabase.

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Desenvolvimento](#-desenvolvimento)
- [Produção](#-produção)
- [Documentação](#-documentação)
- [Módulos do Sistema](#-módulos-do-sistema)
- [Segurança](#-segurança)
- [Versionamento](#-versionamento)

---

## 📖 Sobre o Projeto

O **Credvix Admin** é um sistema ERP completo desenvolvido para gerenciar operações comerciais, administrativas e financeiras. O sistema oferece controle granular de permissões por perfil de usuário (Master, Backoffice, RH, Coordenador, Supervisor, Consultor) com Row Level Security (RLS) implementado no Supabase.

### 🎯 Objetivos

- Centralizar gestão de vendas, contratos e clientes
- Automatizar processos de aprovação e requisições
- Controlar finanças com contas a pagar/receber
- Gerenciar recursos humanos (vagas, candidatos, funcionários)
- Fornecer relatórios analíticos e dashboards em tempo real
- Garantir segurança com autenticação robusta e auditoria

---

## ✨ Funcionalidades Principais

### 📊 Dashboard e Relatórios
- Dashboard Master com visão geral de vendas e metas
- Relatórios de desempenho de consultores por período
- Gráficos interativos (Chart.js) de vendas por loja, produto e status
- Exportação de relatórios em PDF e Excel

### 💼 Gestão Comercial
- **Clientes**: Cadastro completo com CPF, endereço, contatos
- **Contratos**: Gestão de contratos digitados e pagos com histórico de status
- **Propostas**: Fluxo de criação e aprovação de propostas comerciais
- **Vendas Externas**: Registro de vendas fora do sistema principal

### 📝 Sistema de Requisições
- Criação de requisições por tipo (suprimentos, marketing, TI, etc.)
- Fluxo de aprovação multi-nível
- Histórico completo de movimentações
- Notificações em tempo real via Supabase Realtime
- Auditoria de todas as ações

### 💰 Financeiro
- **Contas a Pagar**: Controle de fornecedores, vencimentos, pagamentos
- **Contas a Receber**: Gestão de recebimentos
- Dashboard financeiro com indicadores
- Categorização de despesas/receitas
- Integração com contratos e vendas

### 👥 Recursos Humanos
- **Funcionários**: Cadastro, perfis, lojas, regionais
- **Vagas**: Publicação e gestão de vagas de emprego
- **Candidatos**: Processo seletivo completo
- Controle de acesso e permissões por perfil

### 🔐 Segurança e Auditoria
- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco de dados
- Controle de sessão com timeout de inatividade
- Logout forçado em caso de múltiplas falhas
- Histórico de logins e auditoria de ações
- Rate limiting de tentativas de login

### 🔔 Notificações
- Sistema de comunicados internos com modal popup
- Notificações em tempo real (Realtime Supabase)
- Notificações por email (Resend)
- Alertas de atualização de versão do sistema

### 📦 Importações e Integrações
- Importação de seguros via Excel/CSV
- Importação de vendas externas
- Sincronização de dados de sistemas terceiros

---

## 🛠️ Tecnologias

### Frontend
- **Nuxt 3.12.2** - Framework Vue.js para SSR/SPA
- **Vue 3.4** - Framework JavaScript reativo
- **Nuxt UI** - Biblioteca de componentes baseada em Tailwind CSS
- **Chart.js + vue-chartjs** - Gráficos interativos
- **Flatpickr** - Date picker avançado
- **jsPDF + jspdf-autotable** - Geração de PDFs
- **XLSX** - Manipulação de planilhas Excel

### Backend e Banco de Dados
- **Supabase** - Backend-as-a-Service (BaaS)
  - PostgreSQL com RLS (Row Level Security)
  - Supabase Auth para autenticação
  - Realtime para notificações em tempo real
  - Storage para arquivos
  - Edge Functions
- **RPC Functions** - Funções SQL customizadas para lógica de negócio

### Ferramentas de Build
- **Vite 7.2** - Build tool extremamente rápido
- **esbuild** - Bundler JavaScript

### Qualidade e Segurança
- **TypeScript** - Tipagem estática
- **ESLint** - Linting de código
- **Git** - Controle de versão

---

## 📁 Estrutura do Projeto

```
credvix-admin/
├── app/                          # Configurações do app
├── assets/                       # CSS, imagens, fontes
│   └── css/
│       └── main.css             # Estilos globais + Tailwind
├── banco/                        # Scripts SQL do banco de dados
│   ├── 00_types.sql             # Tipos e enums
│   ├── 01_Tabelas.sql           # Criação de tabelas
│   ├── 02_Relacoes.sql          # Foreign keys
│   ├── 05_rls_policies.sql      # Políticas de segurança RLS
│   ├── 06_triggers.sql          # Triggers
│   ├── 82_create_historico_status_contratos.sql
│   └── ...                      # Outros scripts de migração
├── components/                   # Componentes Vue reutilizáveis
│   ├── DashboardMaster.vue      # Dashboard principal
│   ├── UpdateNotification.vue   # Notificação de atualização
│   ├── ComunicadoModal.vue      # Modal de comunicados
│   └── financeiro/              # Componentes do módulo financeiro
├── composables/                  # Composables Vue (lógica reutilizável)
│   ├── useProfile.ts            # Gerenciamento de perfil do usuário
│   ├── useVersionCheck.ts       # Verificação de versão do sistema
│   ├── useComunicados.ts        # Sistema de comunicados
│   └── useNotificacoes.ts       # Sistema de notificações
├── layouts/                      # Layouts do app
│   └── default.vue              # Layout padrão com sidebar
├── middleware/                   # Middlewares de rota
│   └── auth.ts                  # Middleware de autenticação
├── pages/                        # Páginas do sistema (rotas)
│   ├── index.vue                # Dashboard principal
│   ├── login.vue                # Página de login
│   ├── admin/                   # Módulo administrativo
│   ├── backoffice/              # Módulo de vendas
│   │   ├── clientes/
│   │   ├── Contratos/
│   │   └── propostas/
│   ├── cadastros/               # Cadastros auxiliares
│   ├── financeiro/              # Módulo financeiro
│   │   ├── contas-a-pagar/
│   │   └── contas-a-receber/
│   ├── relatorios/              # Relatórios
│   ├── requisicoes/             # Sistema de requisições
│   ├── rh/                      # Recursos Humanos
│   │   ├── vagas/
│   │   └── candidatos/
│   └── notificacoes/            # Centro de notificações
├── plugins/                      # Plugins Vue/Nuxt
│   ├── auth-error-handler.client.ts
│   ├── inactivity-timeout.client.ts
│   ├── logout-tracker.client.ts
│   └── profile-init.client.ts
├── public/                       # Arquivos públicos estáticos
├── server/                       # Server routes (API)
│   └── api/                     # Endpoints da API
│       ├── contratos/
│       ├── dashboard/
│       ├── financeiro/
│       ├── funcionarios/
│       ├── requisicoes/
│       └── system/
│           └── version.get.ts   # Endpoint de versão
├── types/                        # Definições TypeScript
│   ├── comunicados.ts
│   ├── requisicoes.ts
│   └── supabase-database.d.ts   # Tipos do banco Supabase
├── .env                          # Variáveis de ambiente (não commitado)
├── app.config.ts                 # Configuração do app
├── nuxt.config.ts               # Configuração do Nuxt
├── package.json                  # Dependências do projeto
├── tsconfig.json                 # Configuração TypeScript
└── README.md                     # Este arquivo
```

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** >= 18.x
- **npm** ou **pnpm** ou **yarn**
- **Conta Supabase** (gratuita ou paga)
- **Git**

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/Operacionalcredvix/credvix-admin.git
cd credvix-admin
```

2. **Instale as dependências**
```bash
npm install
# ou
pnpm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-key
SUPABASE_SERVICE_KEY=sua-service-role-key

# Opcional: Email (Resend)
RESEND_API_KEY=sua-chave-resend
```

4. **Execute as migrações do banco de dados**

No painel do Supabase SQL Editor, execute os scripts na pasta `banco/` na ordem numérica:
- `00_types.sql`
- `01_Tabelas.sql`
- `02_Relacoes.sql`
- `03_Seed.sql`
- E assim por diante...

---

## 💻 Desenvolvimento

### Iniciar servidor de desenvolvimento

```bash
npm run dev
# Servidor disponível em http://localhost:3000

# Para Windows (com mais memória alocada):
npm run dev:win
```

### Build para produção

```bash
npm run build
```

### Preview da build de produção

```bash
npm run preview
```

### Gerar site estático (SSG)

```bash
npm run generate
```

---

## 🌐 Produção

### Deploy

O sistema está otimizado para deploy em plataformas como:
- **Vercel** (recomendado para Nuxt)
- **Netlify**
- **AWS Amplify**
- **Cloudflare Pages**

Consulte a [documentação oficial do Nuxt](https://nuxt.com/docs/getting-started/deployment) para instruções específicas.

### Variáveis de Ambiente em Produção

Certifique-se de configurar todas as variáveis de ambiente na plataforma de hospedagem:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `RESEND_API_KEY` (se usar notificações por email)

---

## 📚 Documentação

Documentação técnica detalhada disponível em:

- [📧 Sistema de Notificações por Email](./docs/EMAIL_NOTIFICATIONS.md)
- [🔄 Versionamento do Sistema](./docs/VERSIONING.md)
- [📝 Sistema de Requisições](./docs/REQUISICOES.md) *(a criar)*
- [💰 Módulo Financeiro](./docs/FINANCEIRO.md) *(a criar)*
- [🔐 Segurança e RLS](./docs/SECURITY.md) *(a criar)*

---

## 🧩 Módulos do Sistema

### 1. **Dashboard**
- Visão geral de vendas, metas e desempenho
- Gráficos interativos por loja, produto e consultor
- Filtros por período (mês vigente por padrão)

### 2. **Backoffice (Vendas)**
- **Clientes**: CRUD completo, busca avançada, histórico
- **Contratos**: Gestão com filtro por data de digitação/pagamento, histórico de status
- **Propostas**: Workflow de criação e aprovação

### 3. **Financeiro**
- **Contas a Pagar**: Fornecedores, categorias, vencimentos, pagamentos
- **Contas a Receber**: Controle de recebimentos
- Dashboard financeiro com indicadores

### 4. **Requisições**
- Tipos: Suprimentos, Marketing, TI, RH, Administrativo
- Fluxo de aprovação multi-nível
- Histórico e auditoria completos
- Notificações em tempo real

### 5. **Recursos Humanos**
- **Funcionários**: Cadastro, perfis, hierarquia (Regional → Loja)
- **Vagas**: Publicação e gestão
- **Candidatos**: Processo seletivo

### 6. **Relatórios**
- Desempenho de consultores
- Vendas por período, loja, produto
- Exportação em PDF e Excel

### 7. **Administração**
- Importações (seguros, vendas externas)
- Gerenciamento de lojas e regionais
- Auditoria de ações do sistema

### 8. **Notificações**
- Centro de notificações centralizado
- Comunicados internos com modal
- Email notifications (Resend)
- Sistema de atualização de versão automático

---

## 🔐 Segurança

### Autenticação
- **Supabase Auth** com JWT
- Sessão persistente com refresh token
- Logout automático por inatividade (configurável)
- Rate limiting de tentativas de login

### Autorização (RBAC)
Perfis de usuário com permissões específicas:

| Perfil | Permissões |
|--------|-----------|
| **Master** | Acesso total ao sistema |
| **Backoffice** | Gestão de clientes, contratos, propostas |
| **RH** | Gestão de funcionários, vagas, candidatos |
| **Coordenador** | Acesso a dados da regional |
| **Supervisor** | Acesso a dados da loja |
| **Consultor** | Acesso apenas aos próprios dados |

### Row Level Security (RLS)
- Políticas RLS implementadas em **todas as tabelas**
- Usuários veem apenas dados autorizados pelo perfil
- Validação tanto no frontend quanto no banco de dados

### Auditoria
- Histórico de logins
- Registro de alterações em contratos e requisições
- Triggers de auditoria automáticos
- Sistema de alertas de segurança

---

## 🔄 Versionamento

### Sistema de Versão Automática

O sistema possui um mecanismo automático de notificação de atualização:

1. **Verificação automática** a cada 2 minutos
2. **Popup de notificação** quando nova versão é detectada
3. **Histórico de versões** visível no rodapé do sistema
4. **One-click update** com limpeza de cache

### Atualizar Versão do Sistema

Para lançar uma nova versão, insira no banco de dados:

```sql
INSERT INTO system_version (version, major, minor, patch, description)
VALUES ('0.3.0', 0, 3, 0, 'Descrição das melhorias desta versão');
```

Todos os usuários conectados receberão a notificação automaticamente após 2 minutos.

### Estrutura de Versionamento
- **Major**: Mudanças incompatíveis (breaking changes)
- **Minor**: Novas funcionalidades compatíveis
- **Patch**: Correções de bugs

---

## 👨‍💻 Desenvolvimento

### Padrões de Código

- **Composition API** (Vue 3)
- **TypeScript** para type safety
- **Composables** para lógica reutilizável
- **Server routes** para API endpoints
- **Convenção de nomenclatura**: kebab-case para arquivos, PascalCase para componentes

### Estrutura de Componentes

```vue
<template>
  <!-- Template -->
</template>

<script setup>
// Imports
// Composables
// Refs/Reactive
// Computed
// Methods
// Lifecycle hooks
</script>

<style scoped>
/* Estilos do componente */
</style>
```

### Boas Práticas

1. **Sempre use composables** para lógica compartilhada
2. **Implemente RLS** para todas as novas tabelas
3. **Adicione auditoria** para operações críticas
4. **Teste permissões** com diferentes perfis
5. **Documente** novas funcionalidades

---

## 🤝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
2. Commit suas mudanças: `git commit -m 'feat: adicionar nova funcionalidade'`
3. Push para a branch: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

### Convenção de Commits

Utilize [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados © Credvix 2025.

---

## 📞 Suporte

Para dúvidas ou problemas:
- **Email**: suporte@credvix.com.br
- **Documentação Técnica**: `/docs`
- **Issues**: GitHub Issues

---

## 🙏 Agradecimentos

Desenvolvido com ❤️ pela equipe Credvix usando tecnologias open-source incríveis.

**Stack principal:**
- [Nuxt 3](https://nuxt.com/)
- [Vue 3](https://vuejs.org/)
- [Supabase](https://supabase.com/)
- [Nuxt UI](https://ui.nuxt.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Versão atual do sistema**: v0.2.0 | **Última atualização**: Novembro 2025
