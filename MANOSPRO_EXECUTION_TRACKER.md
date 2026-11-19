# ManosPro — Execution Tracker

**Data da auditoria:** 2026-11-17  
**Estado:** Correções candidatas A/B/C validadas em stack Supabase local sintética; rollout remoto continua bloqueado até paridade confirmada, revisão independente disponível e autorização específica.  
**Escopo:** Lote 1 implementado localmente; nenhuma migration foi aplicada em banco. Nenhum dado, permissão ou deploy de produção foi alterado.

## Lote 2 — preparação de staging e validação

- Ambiente local: Windows sem Docker CLI/serviço, PostgreSQL/`psql`, distribuição WSL ou `supabase/config.toml`. `npx supabase@latest test db` (CLI 3.2.0) tentou `127.0.0.1:54322` e retornou `ECONNREFUSED`; sem daemon Docker, não pode iniciar os containers do Supabase.
- Correção necessária para usar stack local: instalar/iniciar Docker Desktop (ou daemon Docker compatível), gerar `supabase/config.toml` via `supabase init` após revisar o template, iniciar uma stack nova com `supabase start` e executar migrations/testes somente nesse banco sintético. Sem `db reset` para contornar divergência.
- Opção Supabase Branch: isolamento sem dados de produção, adequada para validar A/B/correção sobre o schema-base real. Cotação: **US$ 0,01344/hora** (~US$ 9,81 por 730 horas), sem contar eventual uso adicional. Usuário autorizou criar e excluir após validação; tentativa recusada com `Branching is supported only on the Pro plan or above`. Nenhuma branch foi criada e nenhum custo horário de branch começou.
- Testes locais sem banco: `node --test supabase/tests/frontend_migration_contract_test.mjs supabase/tests/concurrent_conversation_starts.mjs` — **5 passaram, 0 falharam, 1 skipped**. O skip é a corrida concorrente ponta a ponta, que requer credenciais de staging.
- Teste de concorrência ponta a ponta: `supabase/tests/concurrent_conversation_starts.mjs` foi executado sem credenciais de staging e ficou **skipped**, conforme proteção explícita; bloqueia o ref de produção e requer URL/chaves/ref de staging.
- Testes pgTAP: `supabase/tests/secure_profile_and_conversation_flows_test.sql` contém **34 asserções** (mais que as 21 originalmente solicitadas), com fixtures sintéticas. `npx supabase test db supabase/tests/secure_profile_and_conversation_flows_test.sql` falhou ao conectar a `127.0.0.1:54322` (`ECONNREFUSED`). O CLI orienta iniciar Docker e `supabase start`, mas Docker CLI/daemon, Postgres/psql, WSL e `supabase/config.toml` não estão disponíveis. Portanto, **nenhuma asserção pgTAP foi executada ou aprovada**. A concorrência ponta a ponta também permanece pendente.
- A migration local de correção valida, além dos casos do Lote 1, as preferências `accepts_direct_contact` e `accepts_quote_requests`. Nenhuma migration foi aplicada a qualquer banco e nenhum recurso externo foi criado. A tentativa de criar branch após autorização foi recusada pelo plano atual; não há branch para excluir.

## Execução do Lote 1

- Migration B foi reforçada com REVOKE explícito de grants de coluna em `profiles.phone` e `professional_profiles.matricula_note`, além da revogação de SELECT por tabela.
- Nova migration de correção recria o trigger ausente de `profiles`, endurece os triggers e restringe o início de conversas. A migration A/B e a correção continuam pendentes de staging.
- Alterações locais preexistentes preservadas. Sem commit.
## Estado inicial

- Projeto Supabase `manospro-prod`: `ACTIVE_HEALTHY`; única branch listada: `main`; não há staging dedicado listado.
- CLI Supabase v3.2.0 foi executado via `npx`; não foi encontrado `supabase/config.toml` na raiz.
- Head local: `ed589f6` (`fix: localize header brand tagline`). Há alterações locais em 6 arquivos rastreados, mais arquivos não rastreados em `apps/`, `packages/`, `docs/architecture/` e migrations; preservar tudo.
- Migrações locais de privacidade: `20261104193000_secure_personal_profile_fields.sql` e `20261104193100_restrict_profile_select_columns.sql`. Ambas ainda não aparecem no histórico remoto; as três RPCs novas não existem no banco remoto.
- O estado local do front-end já chama `get_own_phone()` na conta e `admin_list_pending_verifications()` no admin. Publicar esse código antes da migration A quebra esses fluxos.
- Grants remotos confirmados: `anon` e `authenticated` podem selecionar `profiles.phone` e `professional_profiles.matricula_note`. Dois perfis não suspensos têm telefone; os valores não foram lidos. Não há ficha publicada com nota de verificação atualmente.
- As políticas remotas de `profiles` permitem SELECT público para perfis não suspensos. A política UPDATE própria verifica somente `auth.uid() = id`; não há trigger remoto `protect_profile_sensitive_fields` entre os triggers encontrados.
- A política remota de INSERT de `professional_profiles` aceita status `draft` ou `published` e verificação `unverified`, então publicação não está bloqueada até verificação.
- A migration comercial local existe, mas `service_requests`, `service_quotes`, `bookings` e `payments` não existem no banco remoto consultado. Não existem entidades remotas para `companies` ou `company_members`.
- O advisor de segurança reporta funções `SECURITY DEFINER` executáveis por `authenticated` e proteção de senha comprometida desativada. Os avisos não foram tratados como prova automática de exploração; checagens parciais mostram guards de admin/membro em algumas RPCs.
- O app Mobile tem React/Vite/Capacitor e Auth; busca, perfis públicos, mensagens e painéis ainda são placeholders. Gemini fez revisão somente leitura; não editou arquivos.

## Plano por fases

| Fase | Tarefa | Responsável | Dependências | Estado | Commits/Testes | Riscos/Pendências |
|---|---|---|---|---|---|---|
| 0 — Aprovação | Aprovar plano e limites dos lotes | Usuário + Codex | Esta revisão | Concluída | Aprovação do usuário | Nenhuma alteração de produção autorizada |
| 1 — Contenção/correção local | Revisar A/B, compatibilidade, PII, triggers e RPC de conversa; criar correção e testes locais | Codex | Aprovação do Lote 1 | Implementada localmente; aguarda pgTAP em staging/local | Migration nova + 34 assertions planejadas; sem commit; stack local indisponível | PII segue exposta remotamente até rollout autorizado; frontend atual depende de A |
| 2 — Reconciliação | Comparar SQL remoto/local, objetos, permissões e dependências | Codex | Acesso read-only | Concluída; duplicidade comprovada idêntica | 7 registros comparados a 6 scripts candidatos | Baseline sem registro remoto continua sem origem histórica |
| 3 — Validação em staging | Aplicar A, front compatível, B e correção; executar pgTAP e fluxos | Codex | Plano Supabase Pro ou Docker local configurado | Bloqueada | 5 testes passaram; 1 skipped; pgTAP 34 não executado | Plano atual não permite branches; stack local requer Docker + config; nenhuma alteração em produção |
| 4 — Rollout seguro | Validar sequência A → frontend → B → correção antes de qualquer produção | Codex | Evidência de staging + autorização específica | Não iniciada | Sem mudanças em produção | Não reabrir grants de PII como rollback |
| 5 — Modelo marketplace | Projetar empresas, membros/permissões, verificação e aprovação da primeira publicação; mapear solicitações, cotações, contratação e avaliações | Codex; Gemini pode revisar UI | Produto e segurança aprovados | Não iniciada | Nenhum | Não criar fluxo de recrutamento/candidaturas de emprego |
| 6 — Mobile MVP | Busca visual, diretório integrado, perfil público/portfólio e depois mensagens/solicitações | Gemini (UI, se canal de edição existir); Codex (dados/integração) | Fases 3–5 e contratos RLS | Não iniciada | Nenhum | Room atual permite Gemini somente leitura |
| 7 — Release readiness | Lint, typecheck, builds, testes automatizados/integrados, permissões, fluxos Web/Mobile e validação em dispositivos/staging | Codex | Funcionalidades implementadas e ambientes autorizados | Não iniciada | Nenhum | Não declarar pronto com base apenas em UI ou build |

## Tabela de correspondência do histórico de migrations

As declarações SQL armazenadas em `supabase_migrations.schema_migrations.statements` foram lidas e comparadas às migrations candidatas locais. Para cada arquivo abaixo, o diff encontrou somente uma linha em branco final adicional no remoto (sem mudança SQL). Os dois registros de `harden_admin_and_auth_rpcs` têm conteúdo/digest idênticos; a duplicidade é uma reaplicação do mesmo script e não há arquivo local perdido.

| Versão remota | Nome remoto | Arquivo local candidato | Comparação |
|---|---|---|---|
| `20261101010147` | `admin_moderation_audit` | `003_admin_moderation_audit.sql` | Igual; newline final extra no remoto |
| `20261101010157` | `admin_rbac` | `20261031000000_admin_rbac.sql` | Igual; newline final extra no remoto |
| `20261101010530` | `admin_provisioning_audit` | `20261031001000_admin_provisioning_audit.sql` | Igual; newline final extra no remoto |
| `20261101011313` | `harden_admin_and_auth_rpcs` | `20261031002000_harden_admin_and_auth_rpcs.sql` | Igual; newline final extra no remoto |
| `20261101011349` | `harden_admin_and_auth_rpcs` | Mesmo arquivo candidato acima | Digest e SQL idênticos ao registro anterior |
| `20261101011633` | `harden_updated_at_function` | `20261031003000_harden_updated_at_function.sql` | Igual; newline final extra no remoto |
| `20261101020851` | `admin_membership_management` | `20261101020619_admin_membership_management.sql` | Igual; newline final extra no remoto |

As linhas remotas registram uma declaração em `statements` cada; o campo `rollback` está nulo em todas as sete. A tabela de histórico remota não contém o baseline das migrations locais `001_initial_schema.sql`, `002_chat_storage_notifications.sql`, `002_fix_rls_and_triggers.sql`, `004_seed_diverse_professionals.sql`, nem `20261101033757_marketplace_commercial_foundation.sql` e migrations de privacidade. O schema remoto contém objetos do baseline, mas a origem/aplicação deles não aparece nas sete linhas. `004_seed_diverse_professionals.sql` está aposentada e contém somente `select 1`.
## Estratégia de rollout e rollback

1. Criar ambiente isolado sem cópia de dados pessoais de produção e registrar seu próprio histórico de migration. Confirmar o custo/impacto antes de provisionar branch persistente.
2. Em staging, validar a migration A: owner `postgres`, funções internas `SECURITY DEFINER` no schema privado, `search_path = ''`, referências qualificadas, autorização por `auth.uid()`/`private.is_admin()` e EXECUTE apenas necessário.
3. Implantar o front-end de staging que chama as RPCs. Testar conta, fila admin e todas as queries/join usados por Web e Mobile.
4. Aplicar B em staging e provar que anon/authenticated não conseguem ler telefone/notas diretamente, enquanto as RPCs autorizadas continuam funcionando. Testar também as permissões de insert/update e as policies.
5. Validar a correção local em staging depois de A, front compatível e B; executar pgTAP e fluxos web/mobile afetados.
6. Produção: somente após resultado aprovado em staging, confirmar plano de janela, backup/recuperação e autorização específica. Aguardar autorização para qualquer migration ou deploy crítico.
7. Rollback da correção local de proteção/conversa: preferir forward-fix. Não remover triggers nem restaurar a RPC antiga sem validação; relaxar somente a regra comprovadamente incompatível em migration corretiva. Em produção, exige aprovação específica.
8. Rollback de A: retirar o front-end dependente antes de remover wrappers/helpers; A é aditiva. Rollback de B: **não** restaurar SELECT de `phone`/`matricula_note`; corrigir por avanço com grants mínimos. Se o front anterior precisar voltar, aceitar falha controlada nos campos protegidos ou manter RPCs compatíveis; não reabrir PII para recuperar UI.

## Revisão inicial das RPCs de privacidade

- `get_own_phone()` / `get_own_verification_note()`: helper interno `private` com `SECURITY DEFINER`, owner `postgres`, `search_path = ''`, leitura filtrada por `(select auth.uid())`; wrapper público `SECURITY INVOKER`, `search_path = ''`. EXECUTE interno e público concedido a `authenticated`, removido de `public`/`anon`.
- `admin_list_pending_verifications()`: helper interno `SECURITY DEFINER` verifica `private.is_admin()` e retorna no máximo 30 pendentes; wrapper público `SECURITY INVOKER`. A branch local de migrations já concede USAGE no schema privado via migration de RBAC, e produção confirma USAGE a authenticated; deve validar-se em staging.
- O front atual não chama `get_own_verification_note()` fora de futura integração; o admin usa a fila RPC e a conta usa `get_own_phone()`.
- `SECURITY DEFINER` do banco remoto: várias funções pertencem a `postgres` e são EXECUTE por `authenticated`, com guardas de admin/membro em parte das funções. A revisão integral ainda é necessária. Algumas usam `search_path=public`; endurecer para vazio com nomes qualificados é recomendação de hardening, não evidência isolada de exploit.
- `start_or_get_conversation()` não valida no corpo remoto se o alvo é profissional publicado, verificado, ativo/não suspenso, nem valida todos os estados iniciais; revisar antes de ampliar o fluxo.

## Tarefas paralelizáveis

- Codex: reconciliação do schema/histórico/migrations e revisão de segurança/RPCs.
- Gemini (quando houver canal de edição): componentes visuais estáticos da busca — barra, categorias horizontais e `ProfessionalCard`; não integrar ao banco nesta tarefa.
- Codex: especificação do domínio de empresa e contratos de catálogo/solicitações, sem migrations, enquanto Gemini prepara UI independente.
- Codex: matriz de permissões e casos de teste pode ser escrita em paralelo à especificação visual; execução em staging depende de ambiente autorizado.

## Resultado do Gemini

Revisão somente leitura concluída. Recomenda como primeiro componente a busca estática (barra, categorias roláveis e cards compactos com alvos de toque adequados); apontou falta de histórico/voltar Android, placeholder de mensagens com texto incorreto para usuário autenticado e explicação insuficiente para cadastro bloqueado por falta de URLs legais. Nenhuma alteração de código foi feita pelo Gemini.





## Lote 2B — diagnóstico do ambiente local (2026-11-17)

- Windows 10 Pro, build 19045. Node.js v26.13.0, npm 11.20.0, Next 16.4.2. Supabase CLI v3.2.0 executada com npx; CLI global e dependência local no package.json ausentes.
- Docker CLI/Desktop, serviço Docker e psql não encontrados. O launcher wsl.exe existe, mas status/list não retornaram uma distro utilizável. A consulta das features WSL/VirtualMachinePlatform exige elevação e não foi possível verificar seu estado.
- supabase/config.toml ausente. Nenhuma ferramenta foi instalada/atualizada nem configuração criada nesta etapa.
- Documentação Supabase atual: o runtime nativo experimental da CLI não suporta Windows; é necessário Docker Desktop/Podman. Supabase start aplica automaticamente migrations e seed da pasta do projeto.
- Não iniciar Supabase no diretório atual sem isolamento: coexistem migrations legadas com prefixo 002, baseline ausente do histórico remoto, migration marketplace comercial não representada no schema remoto, seed aposentada e duplicidade remota idêntica de harden_admin_and_auth_rpcs. Usar diretório de validação temporário e lista de migrations revisada; aplicar o hardening duplicado uma vez no banco sintético. Nunca mascarar divergência nem usar dados pessoais.
- Ordem candidata: baseline local revisado → A (20261104193000) → frontend compatível → B (20261104193100) → correção (20261117182340) → 34 asserts pgTAP. Nenhuma etapa de banco executada; sequência ainda não validada.
- Gemini foi consultada somente para leitura e também recomendou não aplicar todo o diretório de migrations. Nenhum arquivo foi editado por ela.
- Bloqueio: ambiente Windows requer Docker Desktop/Engine funcional e WSL2; não foi instalado nada. A stack não está pronta para executar pgTAP.

## Tentativa de instalação Docker Desktop (2026-11-17)

- Verificações adicionais: Windows x64 19045; 11,8 GB RAM; 87,5 GB livres; SLAT e virtualização de firmware ativos. `HypervisorPresent=false`; o shell não está elevado. Docker Desktop 4.99.0 é elegível para o build do Windows, e o manifesto WinGet aponta SHA-256 `a5e299131c9c53d60f3f752b162078945eb5faf6eedcf0be20a214c6e6cea444`.
- WinGet escolheu instalador de escopo Machine e recusou `--scope user`. Baixei somente do domínio oficial Docker; assinatura Authenticode válida e hash conferido. A instalação per-user retornou código 0, mas o log `%LOCALAPPDATA%\Docker\install-log.txt` registra falha de pré-requisito: `VirtualMachinePlatform` não está habilitado. `winget list` confirma que Docker Desktop não foi instalado.
- Bloqueio restante: habilitar `VirtualMachinePlatform`/WSL2 em PowerShell elevado, possivelmente reiniciar, então reinstalar. Não executei operação elevada nem reinicialização. A licença Docker não foi aceita automaticamente. O arquivo instalador temporário será removido; nenhum arquivo do repositório foi apagado.
- Gemini confirmou o caminho recomendado: WSL2 + Docker Desktop e projeto Supabase sintético isolado; não usar o diretório inteiro de migrations sem curadoria.

## Lote 2B — execução local após reinicialização (2026-11-17)

- Docker Desktop 4.99.0 instalado no escopo do usuário; WSL 3.0.1 / kernel 6.1.40.1; Docker Engine e CLI 29.9.3 funcionais; Supabase CLI 3.2.0 via `npx`; Postgres local 17.12. A instalação foi validada por assinatura Authenticode/hash do instalador oficial. O PATH de usuário agora contém o CLI Docker. Nenhuma distro Linux foi necessária.
- Nenhum projeto/branch Supabase remoto foi criado. Custo Supabase: US$ 0. A validação usa Docker local, imagens oficiais baixadas e dados exclusivamente sintéticos; não usa credenciais remotas nem dados pessoais.
- Configuração criada fora do repositório em `%TEMP%\manospro-supabase-validation-final-20261117\supabase\config.toml`; seed desativado. Não criar `supabase/config.toml` na raiz nem aplicar `supabase start` no diretório do projeto. Endpoints locais: API `http://127.0.0.1:54321`, Postgres `127.0.0.1:54322`, Studio `http://127.0.0.1:54323`.
- Manifesto e cópias de migrations mantidos no diretório temporário. Baseline reconstruído com `001`, os dois `002` renomeados somente nas cópias temporárias, mais `003` e as cinco migrations históricas; a migration A entrou na inicialização. A duplicidade remota de `harden_admin_and_auth_rpcs` foi executada uma vez. B e a correção foram aplicadas depois, separadamente, com `supabase migration up` local. A migration comercial `20261101033757` foi excluída da simulação pois não aparece no histórico remoto confirmado nem no schema remoto consultado.
- Limite de reconciliação: a origem do baseline `001/002` não aparece nas sete linhas do histórico remoto. Portanto, o resultado prova que a sequência é aplicável sobre uma reconstrução local sintética, mas não prova paridade com o schema remoto completo. Não houve contato com produção durante este lote.
- Testes frontend: `node --test supabase/tests/frontend_migration_contract_test.mjs` — 5 passaram, 0 falharam. Testes automatizados combinados com Supabase local: `node --test supabase/tests/*.mjs` — 6 passaram, 0 falharam, 0 skipped; inclui a concorrência ponta a ponta para criação de conversa.
- pgTAP: `npx supabase test db supabase/tests/secure_profile_and_conversation_flows_test.sql --workdir <sandbox>` — **34 passaram, 0 falharam** após correções locais. Uma tentativa inicial apontou que `like()` não é função pgTAP; o assert foi corrigido para `ok(expr LIKE pattern, ...)`. A execução seguinte detectou que o identificador PL/pgSQL `current_role` colidia com o valor especial PostgreSQL `CURRENT_ROLE`, impedindo chamadas de orçamento autenticadas como cliente. A migration local de correção agora usa `v_caller_role` tanto na verificação de ausência de perfil quanto na regra de orçamento. A suíte final passou integralmente.
- Evidência pós-migration via catálogo PostgreSQL: `has_column_privilege` retornou `false` para anon e authenticated em `profiles.phone` e `professional_profiles.matricula_note`; RPCs privadas `SECURITY DEFINER` têm owner `postgres`, `search_path=""`, EXECUTE apenas para authenticated; wrappers públicas são `SECURITY INVOKER`, owner `postgres`, `search_path=""`; anon não tem EXECUTE. A RPC de conversa também está `SECURITY DEFINER` com owner `postgres`, `search_path=""`, e EXECUTE somente para authenticated.
- A primeira stack, que validou a versão defeituosa, foi parada sem apagar o volume (`supabase stop`, backup preservado). A stack final de validação está ativa. Não houve `db reset`, `db push`, `migration repair`, commit, deploy, alteração de produção ou exposição de chaves locais no tracker.
- Pendências: validar contra baseline de staging isolado quando houver branch disponível; manter a decisão de rollout em aprovação. O trigger atual bloqueia promoção direta para `admin` e mudanças de suspensão, mas a política permite alterar entre `client` e `professional`; definir se essa transição é intencional e rever em conjunto com as regras de verificação/publicação antes do lançamento. Esta suíte não afirma que o conjunto marketplace esteja pronto.
- Gemini havia revisado a estratégia de stack/curadoria anteriormente e não editou arquivos. O canal de consulta Gemini não está disponível nesta execução; a falha de `current_role` foi identificada por teste local e corrigida pelo Codex, ainda sem segunda revisão independente nesta rodada.

## Lote 3 — auditoria final de segurança (snapshot anterior à regra aprovada; superado abaixo)

- Escopo remoto: inspeção somente leitura do projeto `manospro-prod`; nenhuma migration, permissão, linha de dado, branch ou deploy remoto foi alterado. Não foram consultados valores de telefone, notas de verificação nem outros dados pessoais.
- Paridade: o banco remoto tem 14 tabelas públicas (todas com RLS; `FORCE ROW LEVEL SECURITY` não está habilitado) e o sandbox sintético reconstruído tem o mesmo conjunto base. O remoto não tem `companies`, `company_members`, `service_requests`, `service_quotes`, `bookings` ou `payments`; a migration comercial local `20261101033757_marketplace_commercial_foundation.sql` não foi aplicada no sandbox candidato e não aparece nos sete registros remotos. A igualdade da lista de tabelas não prova paridade completa de colunas, índices, políticas e dados de referência.
- Histórico remoto permanece em sete linhas: `admin_moderation_audit`, `admin_rbac`, `admin_provisioning_audit`, duas entradas idênticas de `harden_admin_and_auth_rpcs`, `harden_updated_at_function` e `admin_membership_management`. Correspondem a cinco arquivos históricos únicos já mapeados acima; o baseline local `001/002` segue sem origem demonstrada no histórico. A duplicidade foi verificada como reaplicação idêntica, não removida nem reparada.
- Matriz de segurança observada:

| Objeto/controle | Remoto | Sandbox local após A/B/C | Diferença/risco |
|---|---|---|---|
| `profiles.phone`, `professional_profiles.matricula_note` — SELECT | `anon` e `authenticated` têm SELECT | SELECT direto revogado para ambos; RPCs correspondentes disponíveis | Exposição de PII permanece em produção até rollout aprovado |
| UPDATE de `phone`/`matricula_note` | Continua concedido, sujeito a RLS | Continua concedido; C não protege `matricula_note` | Telefone próprio é editável pelo fluxo de conta; nota de verificação pode ser alterada diretamente pelo próprio profissional e deve ser limitada ao RPC/fluxo autorizado |
| Tabelas/RLS | 14 tabelas públicas, RLS ligado; políticas de UPDATE próprio em `profiles` e `professional_profiles` | Mesmo conjunto base; mesmas policies de origem | RLS não impede por si só alteração de colunas que o trigger não guarda |
| `profiles` trigger | Não existe `trg_protect_profile_sensitive_fields` remoto | C cria trigger; bloqueia autoelevação para `admin` e mudança própria de suspensão | A alteração `client` ↔ `professional` continua permitida diretamente nos dois estados |
| `professional_profiles` trigger | Existe proteção contra mudança direta de verificação; função atual usa `SECURITY DEFINER`, owner `postgres`, `search_path=public` | C recria como `SECURITY DEFINER`, owner `postgres`, `search_path=""` | O guard bloqueia também a solicitação legítima `unverified` → `pending` via `request_professional_verification`; falha 35 reproduzida localmente |
| Publicação | Policy de INSERT permite `draft` ou `published` com `unverified`; UPDATE próprio não exige `verified` | C não altera essa regra e não exige `verified`; perfil suspenso em `draft` ainda pode ser publicado | Falhas 37–38: publicar como `pending`/não verificado e publicar após suspensão não é barrado pelo banco |
| RPC de conversa | `SECURITY DEFINER`, owner `postgres`, `search_path=public`, EXECUTE de `authenticated`; valida autenticação básica, mas não valida destinatário profissional publicado/ativo nem conta suspensa | C: `SECURITY DEFINER`, owner `postgres`, `search_path=""`, EXECUTE apenas de `authenticated`; valida papéis, publicação, suspensão e preferências; advisory lock por par | C melhora validação e concorrência; ainda permite destino publicado `unverified`, pois falta `verification_status='verified'`/invariante de publicação |
| RPCs de verificação | `request_professional_verification` e `admin_decide_professional_verification` são `SECURITY DEFINER`, owner `postgres`, `search_path=public`, EXECUTE apenas autenticado; solicitação não funciona com o trigger atual | A adiciona 3 wrappers públicos `SECURITY INVOKER` e helpers privados `SECURITY DEFINER`, owner `postgres`, `search_path=""`; wrappers autorizados apenas a authenticated | `private` tem USAGE para anon/authenticated e CREATE negado; admin queue verifica `private.is_admin()`. No sandbox, helpers de A não são executáveis por anon. Aprovação administrativa passou em teste. |

- A/B/C: A é aditiva e idempotente na criação/recriação das funções/grants; pressupõe o schema `private` e `private.is_admin()` do RBAC remoto, ambos existentes. Os helpers de A são `SECURITY DEFINER`, usam owner `postgres`, `search_path=""` e qualificam objetos; os wrappers são `SECURITY INVOKER`, também com caminho vazio. B revoga SELECT por tabela e coluna de `phone`/`matricula_note` e concede apenas colunas públicas necessárias; não revoga UPDATE nem corrige a escrita direta da nota. C usa triggers `DROP/CREATE`, possui `SECURITY DEFINER` com caminho vazio e grants fechados, e protege nova RPC de conversa; não deve ser aprovado sem correções de verificação/publicação/suspensão e a decisão de papel. Rollback recomendado é forward-fix; nunca restaurar SELECT amplo de PII.
- Compatibilidade frontend: código local exige as RPCs de A na tela de conta/admin e as colunas concedidas por B; `saveOwnProfessionalProfile()` ainda faz `upsert` direto de `profiles.role='professional'` antes de gravar a ficha. Portanto, bloquear UPDATE direto de papel sem migrar esse serviço para uma RPC transacional quebra o onboarding profissional. A busca filtra publicação/suspensão, mas não filtra `profiles.role`; rebaixar um profissional publicado pode deixar card visível cujo contato é recusado pela RPC C.
- Testes: pgTAP ampliado de 34 para 42 asserções, preservando as 34 existentes. Resultado local real: **36 passaram, 6 falharam**. As 34 originais passaram; falhas novas 35–40 confirmam solicitação de verificação bloqueada, alteração direta da nota aceita, publicação pendente aceita, publicação de suspenso aceita, promoção própria client→professional aceita e troca de papel por suspenso aceita. Asserções 41–42 (aprovação admin e estado persistido) passaram. Nenhuma asserção foi omitida.
- Testes frontend/integração: `node --test supabase/tests/*.mjs` com chaves efêmeras somente do sandbox local — **6 passaram, 0 falharam, 0 skipped**, incluindo corrida concorrente ponta a ponta. Não houve uso de chave remota.
- A primeira chamada CLI de pgTAP apontou network ID padrão incorreto; foi corrigida usando `--workdir` na raiz temporária do projeto, sem recriar containers nem resetar banco. Após reboot, o PATH da sessão não continha Docker; foi usado o executável instalado no escopo do usuário. A stack permanece isolada e os fixtures pgTAP são sintéticos/transacionais.
- Rollout não aprovado: versão/commit do frontend efetivamente publicado não está acessível neste repositório e permanece **não confirmada**; o único commit local observado é `ed589f6`. Antes de agendar rollout, obter hash de deployment no provedor e provar que a revisão frontend consome as RPCs A. Sequência candidata continua A → frontend compatível → B → C corrigida, condicionada a corrigir os seis testes e à confirmação da política de papéis. Monitorar RPC errors e falhas de leitura/grant após cada fase; rollback via forward-fix sem reabrir SELECT.
- Gemini: a consulta independente iniciada nesta rodada falhou por desconexão da API. A revisão anterior da Gemini no room havia destacado justamente a incompatibilidade do trigger com o RPC de solicitação, a nota ainda gravável e a ausência de gates de verificação/publicação/suspensão; as falhas pgTAP reproduzem esses pontos. Nenhum arquivo foi editado por Gemini.
- Arquivos alterados nesta etapa: `supabase/tests/secure_profile_and_conversation_flows_test.sql` (8 novas asserções; plan 42) e este tracker. Não alterei migrations. Sem commit; `git status` continua contendo os arquivos locais preexistentes listados anteriormente.

## Lote 3 — fechamento após aprovação da regra de papéis (2026-11-17)

- Regra aprovada pelo usuário e aplicada localmente: promoção client→professional só via RPC atômico com dados mínimos completos, sempre começa como rascunho e não exige verificação para criar o perfil; publicação exige conta ativa, perfil verificado e aprovação administrativa; professional→client exige conta ativa e ausência de cotações/serviços ativos, despublica e preserva histórico; suspensão bloqueia alteração de papel.
- A RPC de salvamento preserva estado e nota de verificação durante `INSERT ... ON CONFLICT`. O trigger reconhece o ticket transacional de `profile_save`, sem aceitar uma publicação direta. A checagem de downgrade considera conversas ativas e, se presentes, `service_quotes` (`sent`/`accepted`) e `bookings` (`pending_payment`/`confirmed`/`in_progress`). Os checks de marketplace usam SQL dinâmico e não quebram em bancos que ainda não tenham essas tabelas.
- Matriz de paridade confirmada até o limite de evidência: os 7 registros remotos correspondem aos 6 scripts candidatos únicos de RBAC/admin/hardening; as duas linhas `harden_admin_and_auth_rpcs` são duplicatas idênticas. O histórico remoto não registra o baseline `001/002`, migração comercial ou A/B/C. Tabelas base coincidem em quantidade (14), com RLS ligado; isso não comprova paridade de schema completo, funções, índices, policies e grants. A produção lida continua com SELECT de `profiles.phone` e `professional_profiles.matricula_note` para `anon` e `authenticated`; nenhuma mudança remota foi executada.
- Ordem anterior proposta precisa ser alterada: o frontend agora depende de `save_own_professional_profile`, criada na migration C, então A → frontend → B → C deixaria o RPC ausente; aplicar a C atual antes do frontend também quebra a versão antiga, pois C revoga os upserts diretos. Recomendada uma divisão local antes do rollout: A → C0 (introduzir RPC em modo compatível, sem bloquear writes antigos) → frontend atualizado → B → C1 (triggers, revogações, publicação/verificação e conversas). A janela, hash do frontend publicado e essa sequência ainda precisam ser validados em staging que reproduza o schema real. A/B/C não foram aplicadas remotamente; rollback segue por forward-fix, sem restaurar SELECT amplo de PII.
- Stack usada: Supabase local via Docker, somente fixtures sintéticas e banco descartável, sem conexão a produção e sem custo externo. Para testar dependências, a migration comercial local foi aplicada manualmente ao sandbox porque sua presença não consta no histórico remoto; no conjunto de teste local, A/B/C e marketplace foram avaliadas, mas essa reconstrução não prova paridade com produção.
- Após os testes, a stack/volumes do projeto `manospro-lote3-final-validation-20261117` foram parados e removidos com `supabase stop --no-backup`. A pasta temporária de configuração em `%TEMP%` permanece porque a política de execução recusou sua remoção; nenhum outro projeto Docker foi parado.
- pgTAP: **53/53 passaram**. As 34 asserções originais foram mantidas; novas cobrem grants/RPCs, autoelevação, suspensão, publicação, verificação, cotações e bookings ativos. Teste frontend/integração: `node --test supabase/tests/*.mjs` — **7 passaram, 0 falharam, 0 skipped**, incluindo concorrência da RPC de conversa e contrato do frontend.
- Qualidade web: `npm run lint` passou; `npm run typecheck` passou. `npm run build` compilou, tipou e gerou rotas, mas terminou com `SecurityFatalError`: Next.js `16.4.2` está afetado por vulnerabilidade conhecida e o próprio build recomendou upgrade. Portanto, build não aprovado para release até atualizar e repetir.
- Gemini: a revisão independente pedida nesta rodada encerrou sem resposta final. A avaliação não é considerada concluída; nenhuma alteração foi atribuída ao Gemini. Revisões anteriores da Gemini apontaram riscos coincidentes (verificação, nota e publicação) e os testes locais agora cobrem esses fluxos.
- Estado Git: sem commits; não descartei nem limpei trabalho pré-existente. Arquivos desta rodada incluem migration C, `src/services/supabase/professionals.ts`, os testes pgTAP e Node e este tracker. Permanecem no working tree alterações preexistentes em UI/config e diretórios não rastreados (`apps/`, `packages/`, `docs/architecture/`, `AGENTS.md` e o restante de `supabase/tests/`); revisar o diff completo antes de qualquer commit.
- Riscos de release ainda abertos: confirmar a origem/estrutura do baseline sem registro no histórico remoto; comparação de columns/policies/functions/triggers/grants/indexes entre produção e o sandbox; obter hash do frontend publicado; atualização obrigatória do Next.js; validação independente do Gemini; não há staging remoto aprovado. Nenhum deploy, migration ou permissão foi alterado em produção.


## Fase 1 e Fase 2 — Staging local real + fatiamento C0/C1 (2026-11-19)

- **Upgrade Next.js integrado na `main`:** commit `63eb493` (`next@16.4.6` e `eslint-config-next@16.4.6`), `npm audit --omit=dev` = 0 vulnerabilidades, `lint`, `typecheck`, `next build --webpack` e contratos aprovados.
- **Dump estrutural real de produção (`--schema-only`):** `C:\Users\douglas\AppData\Local\Temp\manospro-prod-schema-only.sql` (`69.071 bytes`, `1.882` linhas, SHA-256 `95714E2D0FCCDFF4FB2B62544F0758DC42B970CE924610EEE56E49FC79B145D6` preservado intacto). Auditoria confirmou 15 `INSERT`s apenas internos a funções/triggers, 0 `COPY`, 0 dados/PII/credenciais.
- **Consulta agregada em produção (zero PII):** `0` fichas em `public.professional_profiles` (`0` publicadas, `0` publicadas sem verificação).
- **Staging local real:** restaurada apenas cópia (`restore-copy.sql`, `RESTORE_EXIT=0`) em `%TEMP%\manospro-staging-real` (`127.0.0.1:55322`, container `supabase_db_manospro-staging-real`), sem apagar containers/volumes existentes. Trigger local `on_auth_user_created` em `auth.users` e extensão `pgtap` ativados apenas no staging local para execução dos testes.
- **Diferença de `DEFAULT PRIVILEGES` documentada:** no staging local, o template Supabase aplica `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON FUNCTIONS TO anon` antes do restore; como `pg_dump` emite apenas `REVOKE ... FROM PUBLIC`, funções legadas herdaram `anon_exec=true` localmente (enquanto em produção `request_professional_verification` nega `anon` com HTTP `401 42501`). Todas as funções de `A`, `C0` e `C1` emitem `REVOKE ALL ... FROM public, anon` explicitamente e foram comprovadas com `anon_exec=false` via pgTAP.
- **Fatiamento de C em C0 e C1:**
  - `C0`: `supabase/migrations/20261104193030_add_profile_workflow_rpcs_compat.sql` (aditiva e retrocompatível com o frontend antigo; cria `private.profile_transition_authorizations`, `private.has_profile_transition_authorization`, `public.save_own_professional_profile` e `public.switch_own_account_to_client` sem revogar writes diretos nem instalar triggers bloqueadores).
  - `C1`: `supabase/migrations/20261117182340_secure_profile_and_conversation_flows.sql` (endurecimento pós-frontend e pós-B; instala `trg_protect_profile_sensitive_fields`, `trg_protect_pro_profile_sensitive_fields`, `REVOKE INSERT, UPDATE, DELETE ON public.professional_profiles` e endurece `request_professional_verification`, `admin_decide_professional_verification` e `start_or_get_conversation`).
- **Sequência validada no staging local real (`127.0.0.1:55322`):**
  1. `A (20261104193000)` → OK.
  2. `C0 (20261104193030)` → OK.
  3. Teste dual (em transação revertida após `A + C0`, antes de `B` e `C1`): frontend antigo (`SELECT phone`, `UPDATE profiles.role`, `INSERT professional_profiles`) **e** frontend novo (`get_own_phone`, `save_own_professional_profile`, `switch_own_account_to_client`) ambos passaram.
  4. `B (20261104193100)` → OK (`has_column_privilege` = `false` para `anon`/`authenticated` em `profiles.phone` e `professional_profiles.matricula_note`).
  5. `C1 (20261117182340)` → OK.
- **Resultados das suítes após `A → C0 → B → C1`:**
  - pgTAP (`supabase/tests/secure_profile_and_conversation_flows_test.sql`): **58/58** (`56` ok, `2` skip explícitos para `service_quotes`/`bookings` ausentes no baseline real de produção, `0` falhas).
  - Contratos Node (`supabase/tests/frontend_migration_contract_test.mjs`): **6/6** passaram (`0` falhas).
  - Concorrência ponta a ponta (`concurrent_conversation_starts.mjs`): pendente de stack HTTP/Auth ativa no staging real (`auth`/`rest` não inicializados neste container DB-only para preservar o volume sem reiniciar).
- **Produção:** intacta (`cvphriyjmrfijmcfblmz`), sem migrations aplicadas, sem alteração de permissões, sem deploy, sem commit/push.


## Fase 3 — Fechamento da homologação funcional (2026-11-19)

- **UI `/profissional` concluída:**
  - [src/services/supabase/professionals.ts](src/services/supabase/professionals.ts): adicionados `fetchOwnVerificationNote()` (`rpc("get_own_verification_note")`), `requestOwnProfessionalVerification()` (`rpc("request_professional_verification")`), `switchOwnAccountToClient()` (`rpc("switch_own_account_to_client")`) e `mapProfessionalRpcError()` (tradução sanitizada `es-AR`/`pt-BR` sem expor detalhes internos do banco).
  - [src/app/profissional/page.tsx](src/app/profissional/page.tsx): adicionados estados visuais claros (`Não verificado`, `Pendente`, `Aprovado`, `Bloqueado`), bloqueio de `<option value="published">` enquanto não aprovado/suspenso, formulário de solicitação de verificação profissional e fluxo de transição de profissional para cliente com confirmação inline em dois passos.
- **Auditoria completa de chamadas Supabase (Web + Mobile):** zero `SELECT` direto em `profiles.phone` ou `professional_profiles.matricula_note` em `src/` e `apps/mobile/src/`. Todas as telas consomem as RPCs corretas (`get_own_phone`, `get_own_verification_note`, `admin_list_pending_verifications`, `save_own_professional_profile`, `request_professional_verification`, `switch_own_account_to_client`, `start_or_get_conversation`).
- **Serviços HTTP (`auth`/`rest`) habilitados no staging local real (`127.0.0.1:55321`) sem parar ou remover containers/volumes existentes:**
  - `supabase_auth_manospro-staging-real` (`gotrue:v2.198.0`) e `supabase_rest_manospro-staging-real` (`postgrest:v16.5`) conectados à rede `supabase_network_manospro-staging-real`.
- **Resultados das suítes após A → C0 → B → C1 + UI final:**
  - Testes Node (`frontend_migration_contract_test.mjs` + `concurrent_conversation_starts.mjs` contra `http://127.0.0.1:55321`): **8/8 passaram, 0 falharam, 0 skipped** (ausência de conversas duplicadas sob concorrência confirmada ponta a ponta).
  - pgTAP (`secure_profile_and_conversation_flows_test.sql`): **58/58 (`56 ok`, `2 SKIP` para tabelas comerciais ausentes na produção real, `0 falhas`)**.
- **Vercel (inspeção somente leitura, sem deploy):**
  - Deployment ativo em produção (`https://manospro.vercel.app`): `dpl_Fty5pJQTEfQoucKZBhoo7REXj5eG` (`READY`, criado em `2026-11-01 01:20:43 -0300`).
  - **Commit publicado em produção:** `ed589f67851fc8515c20c13bbdc2b7409c91e499` (`ed589f6` — `fix: localize header brand tagline`, branch `main`, Next.js `16.4.2`).
  - **Runtime Node.js na Vercel:** `26.x` (compatível com Next.js `16.4.6`).
- **Integridade:** produção (`cvphriyjmrfijmcfblmz`), dump original (`SHA-256 95714E2D0FCCDFF4FB2B62544F0758DC42B970CE924610EEE56E49FC79B145D6`), containers/volumes e alterações locais permanecem intactos; sem commits, push ou deploy.
