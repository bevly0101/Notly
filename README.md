# 🚀 NOTLY — Sua Produtividade, Sua Soberania.

<p align="center">
  <img src="https://i.pinimg.com/736x/e2/f1/1e/e2f11ecc97c41214c8cc0814cb82307f.jpg" alt="NOTLY Logo" width="120" />
</p>

<p align="center">
  <a align="center" href="https://notly-rho.vercel.app">VISITAR APP BETA </a>
</p>
<p align="center">
  <strong>Uma alternativa "local-first" ao Notion, focada em privacidade, performance e liberdade total.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Development-orange" alt="Status" />
  <img src="https://img.shields.io/badge/Architecture-Local--First-blue" alt="Architecture" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 🌟 O que é o NOTLY?

O **NOTLY** é uma aplicação de gestão de conhecimento e produtividade pessoal concebida sob o paradigma **Local-First**. Inspirado no Notion, o NOTLY oferece uma experiência de edição baseada em blocos, bases de dados relacionais e ferramentas de IA avançadas, mas com uma diferença fundamental: **você é o dono dos seus dados.**

Diga adeus aos limites de armazenamento, paywalls de IA e dependência de conexão constante. Com o NOTLY, a privacidade e a soberania digital vêm em primeiro lugar.

---

## 🔥 Principais Diferenciais

### 🏠 Arquitetura Local-First
*   **Latência Zero:** Todas as operações de leitura e escrita ocorrem instantaneamente no seu dispositivo.
*   **Offline Total:** Trabalhe em qualquer lugar, com ou sem internet. Seus dados estão sempre acessíveis.
*   **Sincronização Inteligente:** Sincronização assíncrona com a nuvem (Supabase) assim que a conexão é restabelecida.

### 🤖 Inteligência Artificial (BYOK)
*   **Bring Your Own Key:** Integre suas próprias chaves de API (OpenAI, Gemini, Anthropic).
*   **Sem Assinaturas Mensais:** Pague apenas pelo que consumir diretamente dos provedores de IA.
*   **Assistente Integrado:** Resuma, expanda e reescreva textos diretamente no editor.

### 📊 Dados e Visualização
*   **Gráficos Nativos:** Transforme suas tabelas e bases de dados em gráficos visuais interativos sem ferramentas externas.
*   **Bancos de Dados Relacionais:** Suporte completo para relações, rollups e fórmulas avançadas.
*   **Automações Sem Limites:** Crie fluxos de trabalho automatizados sem restrições de planos pagos.

### 📁 Armazenamento Sem Amarras
*   **Uploads Ilimitados:** Sem limite de 5MB por arquivo. O limite é o seu próprio armazenamento (S3, Supabase, Google Drive).
*   **Histórico de Versões Local:** Controle total sobre as alterações dos seus documentos.

---

## 🛠️ Tech Stack

O NOTLY é construído com as tecnologias mais modernas e performáticas do mercado:

*   **Frontend:** [Next.js 14+](https://nextjs.org/) (App Router) & [React](https://reactjs.org/)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
*   **Editor Engine:** [TipTap](https://tiptap.dev/) (ProseMirror)
*   **Banco de Dados Local:** [RxDB](https://rxdb.info/) (IndexedDB)
*   **Backend & Sincronização:** [Supabase](https://supabase.com/)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
*   **Visualização:** [Recharts](https://recharts.org/) / [Tremor](https://www.tremor.so/)

---

## 🚀 Como Iniciar (Desenvolvimento)

*Nota: O projeto está em fase ativa de desenvolvimento.*

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/notly.git
    cd notly
    ```

2.  **Instalar dependências:**
    ```bash
    pnpm install
    ```

3.  **Configurar variáveis de ambiente:**
    Crie um arquivo `.env.local` na raiz do projeto e adicione suas credenciais do Supabase e outras chaves necessárias.

4.  **Iniciar o servidor de desenvolvimento:**
    ```bash
    pnpm dev
    ```

Acesse `http://localhost:3000` para ver o NOTLY em ação.

---

## 🗺️ Roadmap

- [ ] Estruturação inicial e configuração do RxDB.
- [ ] Implementação do editor de blocos básico com TipTap.
- [ ] Desenvolvimento da árvore de páginas e navegação lateral.
- [ ] Integração do módulo de IA (BYOK).
- [ ] Implementação do mecanismo de sincronização com Supabase.
- [ ] Blocos de gráficos nativos e visualização de dados.
- [ ] Automações de banco de dados avançadas.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

<p align="center">
  Feito com ❤️ por Richards França
</p>
