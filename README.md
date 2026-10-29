# ManosPro — Fase 1: Fundação do Projeto e Design System

> **Slogan:** *"Profesionales cerca de vos"* / *"Profissionais perto de você"*

Plataforma web responsiva para conectar clientes a profissionais autônomos na **Argentina (`es-AR`, `ARS`)** e no **Brasil (`pt-BR`, `BRL`)**, com arquitetura preparada para evolução ao backend **Supabase** e futuro aplicativo móvel com **React Native + Expo**.

## 1. Identidade Visual e Design System

- **Grafite Principal (`#24272B`)** e **Grafite Profundo (`#1B1E22`)** para cabeçalhos, contrastes fortes e superfícies institucionais.
- **Laranja ManosPro (`#F28C28`)** para ações primárias, ícones de destaque e pontos focais.
- **Creme Aquecido (`#F7F4EE`)** e **Areia Suave (`#EFEAE1`)** como plano de fundo acolhedor, combinado a cartões brancos (`#FFFFFF`) com bordas discretas (`#DFD8CC`).
- **Logotipo Original (`ManosProLogo`)**: Isotipo vetorial que une o arco de ferramentas/casa em `#F28C28`, a letra **"M"** de *Manos* formada por dois pilares conectados em `#F7F4EE` e a base octogonal em `#24272B`.

## 2. Rotas Implementadas (Fase 1)

- `/` — Página inicial completa (Hero com busca, filtro de cidade e categoria, 8 categorias oficiais, profissionais em destaque, como funciona, modelos de contratação, showcase do logotipo e CTA para profissionais).
- `/profissionais` — Diretório público com filtros combinados (busca textual, categoria, país, cidade e ordenação) e controles de verificação para estados de **carregamento**, **erro** e **vazio**.
- `/profissionais/[slug]` — Perfil público detalhado (apresentação, serviços com preços de referência em ARS/BRL, galeria de fotos, avaliações de exemplo e simulação validada de orçamento/mensagem).
- `/categorias/[slug]` — Diretório filtrado por categoria e subcategorias.
- `/entrar` — Tela de login com validação em cliente via Zod e aviso arquitetural da Fase 1.
- `/cadastro` — Escolha de perfil (`Cliente` ou `Profissional`) e formulário adaptado ao país/moeda selecionado.
- `/cliente`, `/profissional` e `/admin` — Estruturas navegáveis das áreas privadas planejadas para a Fase 2.

## 3. Como Executar Localmente

```bash
cd manospro
npm install
npm run dev
```

Acesse `http://localhost:3000` no navegador.

## 4. Scripts de Qualidade

```bash
npm run typecheck   # Verificação estrita do TypeScript (tsc --noEmit)
npm run lint        # Verificação do ESLint
npm run build       # Build de produção do Next.js
```
