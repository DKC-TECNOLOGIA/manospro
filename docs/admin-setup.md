# Painel administrativo ManosPro

## Segurança e migrations

O painel usa a sessão do Supabase validada no servidor e a associação persistida em `public.admin_memberships`. O papel não é lido de `user_metadata` nem pode ser alterado pelo cadastro público. As operações passam por RPCs que verificam essa associação no banco.

As migrations adicionadas/aplicadas são:

- `003_admin_moderation_audit.sql`: fila de denúncias, auditoria e RPCs administrativas existentes.
- `20261031000000_admin_rbac.sql`: tabela de associação, helper interno, métricas reais, listagem paginada e grants restritos.
- `20261031001000_admin_provisioning_audit.sql`: permissão para o script seguro registrar o provisionamento.
- `20261031002000_harden_admin_and_auth_rpcs.sql`: nega acesso direto à tabela de permissões, indexa as filas e limita funções internas de Auth e mensagens.
- `20261031003000_harden_updated_at_function.sql`: fixa o `search_path` da função de atualização de timestamps.
- `20261101020619_admin_membership_management.sql`: habilita a gestão auditada de acessos administrativos por owners.

As duas migrations antigas `001` e `002` já correspondem à estrutura base deste projeto. Não reaplique essas migrations sobre um banco com dados existentes.

## Provisionar o primeiro administrador

O script cria um convite por e-mail (sem senha embutida no código) e registra o papel `owner`. Ele deve ser executado somente por alguém com acesso administrativo ao projeto Supabase.

1. Confirme que o provedor de e-mail do Supabase está configurado e que a URL `NEXT_PUBLIC_APP_URL/redefinir-senha` consta na lista de redirecionamentos permitidos de Auth.
2. Copie `.env.example` para `.env.local` se necessário. Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_SECRET_KEY` (preferida) ou `SUPABASE_SERVICE_ROLE_KEY` legado, `ADMIN_EMAIL` e `ADMIN_FULL_NAME`. A chave privilegiada fica somente no arquivo local ignorado pelo Git.
3. Execute `npm run admin:provision`.
4. Abra o convite recebido, defina a senha e entre pelo formulário existente. A sessão autenticada será redirecionada para `/admin`.

O script não aceita nem armazena uma senha. O convite é enviado pelo Supabase. Se a conta já existir, o script associa essa conta ao papel `owner` e registra a operação. Revise o e-mail antes de executar.

## Funcionalidades ligadas a dados existentes

- Indicadores de usuários, clientes, profissionais, suspensões, cadastros recentes, conversas e orçamentos.
- Busca paginada por nome/e-mail, detalhes de perfil e suspensão/reativação auditada.
- Fila de verificações profissionais com decisão documentada.
- Fila de denúncias com resolução/arquivamento auditados.
- Ativação/desativação das categorias existentes sem apagar vínculos.
- Trilha de auditoria administrativa.
- Reconhecimento automático de administradores no login e redirecionamento para `/admin`.
- Gestão de administradores: o owner pode conceder acesso a contas já cadastradas e revogar o acesso sem apagar a conta.
- Logout, recuperação de senha e tela para definir uma nova senha.

Para adicionar uma pessoa como administradora, ela precisa criar primeiro uma conta normal no ManosPro. Depois, o owner informa o e-mail dessa conta em **Administração > Administradores**. Somente owners podem conceder ou revogar esses acessos; owners não podem ser removidos por essa tela. Cada operação é registrada em `admin_audit_logs`.

Não há tabelas nem integração de cobrança para planos, assinaturas, receita ou usuários premium. Esses números aparecem como indisponíveis, sem estimativas. Também não existe ainda uma tela persistente de configurações globais da plataforma; a manutenção/feature flags dependem de definir como essas opções devem afetar as rotas e o cadastro antes de ativá-las.

## Variáveis

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública para operações do app protegidas por Auth e RLS.
- `NEXT_PUBLIC_APP_URL`: origem usada pelo convite e recuperação de senha.
- `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`: chave privilegiada, necessária somente durante o provisionamento inicial e nunca enviada ao navegador.
- `ADMIN_EMAIL` e `ADMIN_FULL_NAME`: conta que receberá o convite de `owner`.
