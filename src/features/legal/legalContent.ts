import type { LocaleCode } from "@/types/domain";

export type LegalDocKey = "terms" | "privacy" | "cookies";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  callout?: {
    title: string;
    body: string;
  };
}

export interface LegalDocumentData {
  key: LegalDocKey;
  breadcrumbLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  jurisdictions: string[];
  summaryBox: {
    title: string;
    points: string[];
  };
  sections: LegalSection[];
  governanceNote: {
    title: string;
    body: string;
  };
}

const TERMS_PT_BR: LegalDocumentData = {
  key: "terms",
  breadcrumbLabel: "Termos de Uso",
  badge: "Regras da plataforma",
  title: "Termos de Uso do ManosPro",
  subtitle:
    "Condições claras para o uso da plataforma por clientes e profissionais autônomos no Brasil e na Argentina.",
  lastUpdated: "Atualizado em novembro de 2026",
  jurisdictions: ["Brasil", "Argentina"],
  summaryBox: {
    title: "Resumo prático",
    points: [
      "O ManosPro conecta clientes e profissionais autônomos; não somos empregadores nem executamos diretamente os serviços contratados.",
      "Perfis públicos passam por verificação prévia de cadastro antes de aparecer no diretório.",
      "Escopo, prazo, preço final e forma de pagamento são combinados diretamente entre cliente e profissional.",
    ],
  },
  sections: [
    {
      id: "objeto",
      title: "1. Objeto e papel do ManosPro",
      paragraphs: [
        "O ManosPro é uma plataforma digital que facilita a descoberta, o contato e a solicitação de orçamentos entre clientes e profissionais autônomos que atuam no Brasil e na Argentina.",
        "A plataforma atua exclusivamente como intermediadora tecnológica de descoberta e comunicação. O ManosPro não mantém vínculo empregatício, societário ou de subordinação com os profissionais cadastrados e não realiza a execução técnica dos serviços oferecidos.",
        "Nesta etapa da plataforma, o ManosPro não processa pagamentos nem cobra comissão sobre os serviços combinados. Os valores exibidos nos perfis são meramente referenciais em moeda local (BRL ou ARS), devendo o valor final, o escopo, o prazo e eventual garantia ser acordados diretamente entre cliente e profissional.",
      ],
    },
    {
      id: "cadastro-responsabilidades",
      title: "2. Cadastro e responsabilidades dos usuários",
      paragraphs: [
        "Para utilizar recursos privados — como iniciar conversas, pedir orçamentos, editar dados de conta ou publicar um perfil profissional — é necessário criar uma conta válida e manter as informações atualizadas.",
      ],
      bullets: [
        "Fornecer dados verdadeiros, completos e atualizados durante o cadastro e o uso da plataforma.",
        "Manter a confidencialidade de suas credenciais de acesso e responder pelas ações realizadas em sua conta.",
        "Declarar possuir capacidade legal para contratar ou prestar serviços conforme a legislação do país de atuação.",
        "Não utilizar a plataforma para fins ilícitos, fraude, assédio, spam, coleta automatizada indevida de dados ou publicação de conteúdo ofensivo ou enganoso.",
      ],
    },
    {
      id: "profissionais",
      title: "3. Responsabilidades dos profissionais",
      paragraphs: [
        "Os profissionais cadastrados são integralmente responsáveis pelas informações divulgadas em seu perfil público, pela qualidade dos serviços prestados e pelo cumprimento das obrigações legais e fiscais aplicáveis à sua atividade.",
      ],
      bullets: [
        "Descrever com precisão suas especialidades, regiões de atendimento, horários habituais, serviços e valores de referência.",
        "Publicar no portfólio apenas fotos de trabalhos próprios ou devidamente autorizadas, respeitando direitos autorais e de imagem de clientes e terceiros.",
        "Manter habilitações, registros, licenças ou matrículas profissionais válidos sempre que exigidos por lei para o ofício oferecido (por exemplo, instalações elétricas, gás ou atividades regulamentadas).",
        "Responder de forma clara e respeitosa às mensagens e solicitações de orçamento recebidas conforme as modalidades habilitadas em seu perfil.",
      ],
    },
    {
      id: "clientes",
      title: "4. Responsabilidades dos clientes",
      paragraphs: [
        "Os clientes são responsáveis por avaliar a adequação do profissional escolhido às necessidades do serviço, confirmar previamente condições comerciais e técnicas, e utilizar os canais de comunicação com boa-fé.",
      ],
      bullets: [
        "Informar detalhes suficientes sobre o trabalho desejado, localização aproximada e disponibilidade ao solicitar orçamentos.",
        "Confirmar diretamente com o profissional escopo, materiais, prazos, preço final e eventuais garantias antes da execução.",
        "Publicar avaliações verdadeiras, respeitosas e baseadas exclusivamente em experiências reais de contratação pela plataforma.",
      ],
    },
    {
      id: "verificacao-publicacao",
      title: "5. Verificação de perfis e regras de publicação",
      paragraphs: [
        "Para aumentar a confiança do diretório público, todo perfil profissional inicia em modo rascunho. A exibição pública depende do preenchimento dos dados mínimos obrigatórios e da aprovação no fluxo de verificação da plataforma.",
        "O profissional pode enviar informações para verificação pela Área Profissional e acompanhar o andamento. Perfis em rascunho, pendentes, rejeitados ou suspensos não são exibidos no diretório público nem acessíveis publicamente.",
      ],
      callout: {
        title: "Alcance da verificação",
        body: "O selo de perfil verificado indica que o cadastro passou pela conferência administrativa prevista no ManosPro. Ele reforça a transparência cadastral, mas não representa garantia técnica irrestrita sobre a execução futura de cada serviço nem substitui a conferência de escopo e referências pelo cliente.",
      },
    },
    {
      id: "comunicacao",
      title: "6. Comunicação entre clientes e profissionais",
      paragraphs: [
        "O ManosPro oferece chat privado interno e solicitações estruturadas de orçamento, respeitando rigorosamente as modalidades habilitadas por cada profissional em seu perfil (contato direto e/ou solicitação de orçamento).",
        "Para proteger a privacidade dos usuários, telefone e e-mail pessoal não são expostos no diretório público. As conversas são restritas aos participantes envolvidos, sendo proibida a prática de spam, envio de conteúdo abusivo ou tentativa de engenharia social.",
      ],
    },
    {
      id: "moderacao-suspensao",
      title: "7. Moderação, suspensão e encerramento",
      paragraphs: [
        "O ManosPro poderá suspender preventivamente ou encerrar contas e perfis que violem estes Termos, apresentem indícios de fraude, informações falsas, uso abusivo dos canais de mensagem ou conduta que coloque outros usuários em risco.",
        "O profissional pode voltar seu perfil para rascunho ou migrar sua conta para o modo cliente nas configurações, e qualquer usuário pode solicitar o encerramento de sua conta observando eventuais obrigações legais de guarda de registros.",
      ],
    },
    {
      id: "propriedade-disponibilidade",
      title: "8. Propriedade intelectual, disponibilidade e alterações",
      paragraphs: [
        "A marca ManosPro, sua identidade visual, código-fonte e organização editorial pertencem aos responsáveis pela plataforma e não podem ser reproduzidos comercialmente sem autorização.",
        "Trabalhamos para manter a plataforma disponível e segura, mas não garantimos operação ininterrupta nem nos responsabilizamos por falhas externas de conectividade ou pelo resultado comercial de contratações realizadas diretamente entre usuários.",
        "Estes Termos podem ser atualizados para refletir melhorias do produto ou mudanças regulatórias. A versão vigente estará sempre acessível no rodapé da plataforma com a data da última atualização.",
      ],
    },
    {
      id: "legislacao",
      title: "9. Legislação aplicável e transparência",
      paragraphs: [
        "Estes Termos aplicam-se aos usuários no Brasil e na Argentina, respeitando as normas imperativas de proteção ao consumidor e proteção de dados vigentes em cada jurisdição.",
      ],
    },
  ],
  governanceNote: {
    title: "Canal de suporte e identificação do controlador",
    body: "Você pode gerenciar os dados da sua conta diretamente em /conta. Caso precise de suporte ou informações sobre estes Termos, utilize os canais oficiais de atendimento da plataforma. Os dados societários completos (razão social, CNPJ/CUIT e e-mail jurídico dedicado) serão publicados nesta seção assim que concluída a formalização institucional definitiva.",
  },
};

const TERMS_ES_AR: LegalDocumentData = {
  key: "terms",
  breadcrumbLabel: "Términos de Uso",
  badge: "Reglas de la plataforma",
  title: "Términos de Uso de ManosPro",
  subtitle:
    "Condiciones claras para el uso de la plataforma por clientes y profesionales independientes en Argentina y Brasil.",
  lastUpdated: "Actualizado en noviembre de 2026",
  jurisdictions: ["Argentina", "Brasil"],
  summaryBox: {
    title: "Resumen práctico",
    points: [
      "ManosPro conecta clientes con profesionales independientes; no somos empleadores ni ejecutamos directamente los trabajos acordados.",
      "Los perfiles públicos pasan por verificación previa de registro antes de mostrarse en el directorio.",
      "El alcance, el plazo, el precio final y la forma de pago se acuerdan directamente entre cliente y profesional.",
    ],
  },
  sections: [
    {
      id: "objeto",
      title: "1. Objeto y rol de ManosPro",
      paragraphs: [
        "ManosPro es una plataforma digital que facilita la búsqueda, el contacto y la solicitud de presupuestos entre clientes y profesionales independientes en Argentina y Brasil.",
        "La plataforma actúa exclusivamente como intermediaria tecnológica de descubrimiento y comunicación. ManosPro no mantiene relación laboral, societaria ni de subordinación con los profesionales registrados y no ejecuta directamente los servicios publicados.",
        "En esta etapa, ManosPro no procesa pagos ni cobra comisiones por los trabajos acordados. Los valores publicados en los perfiles son orientativos en moneda local (ARS o BRL); el precio final, el alcance, los plazos y las garantías deben confirmarse directamente entre cliente y profesional.",
      ],
    },
    {
      id: "cadastro-responsabilidades",
      title: "2. Registro y responsabilidades de los usuarios",
      paragraphs: [
        "Para utilizar funciones privadas — como iniciar conversaciones, solicitar presupuestos, gestionar tu cuenta o publicar un perfil profesional — debés crear una cuenta válida y mantener tus datos actualizados.",
      ],
      bullets: [
        "Brindar información veraz, completa y actualizada al registrarte y utilizar la plataforma.",
        "Resguardar la confidencialidad de tus credenciales de acceso y responder por la actividad realizada desde tu cuenta.",
        "Contar con capacidad legal para contratar o prestar servicios conforme a la normativa vigente en tu país.",
        "No utilizar la plataforma para fines ilícitos, fraude, acoso, spam, extracción automatizada indebida de datos ni publicación de contenido engañoso u ofensivo.",
      ],
    },
    {
      id: "profissionais",
      title: "3. Responsabilidades de los profesionales",
      paragraphs: [
        "Los profesionales registrados son íntegramente responsables por la información publicada en su ficha, por la correcta prestación de sus servicios y por el cumplimiento de sus obligaciones legales, técnicas e impositivas.",
      ],
      bullets: [
        "Detallar con precisión sus especialidades, zonas de cobertura, disponibilidad habitual, servicios y precios de referencia.",
        "Subir al portafolio únicamente fotografías de trabajos propios o debidamente autorizadas, respetando derechos de autor e imagen de terceros.",
        "Mantener vigentes las matrículas, habilitaciones o licencias requeridas por ley para su oficio (por ejemplo, instalaciones de gas, electricidad u oficios regulados).",
        "Responder de manera respetuosa y clara a las consultas y solicitudes de presupuesto recibidas según las modalidades activadas en su perfil.",
      ],
    },
    {
      id: "clientes",
      title: "4. Responsabilidades de los clientes",
      paragraphs: [
        "Los clientes son responsables de evaluar la idoneidad del profesional elegido para su necesidad específica, confirmar condiciones comerciales y técnicas antes del inicio del trabajo y utilizar el chat de buena fe.",
      ],
      bullets: [
        "Brindar información clara sobre el trabajo requerido, barrio o zona aproximada y disponibilidad horaria.",
        "Acordar directamente con el profesional alcance, materiales, plazos, importe final y eventuales garantías.",
        "Publicar reseñas reales, respetuosas y basadas exclusivamente en servicios efectivamente contratados.",
      ],
    },
    {
      id: "verificacao-publicacao",
      title: "5. Verificación de perfiles y reglas de publicación",
      paragraphs: [
        "Para fortalecer la confianza del directorio público, cada perfil profesional se crea inicialmente en modo borrador. Su publicación visible exige completar los datos obligatorios y aprobar la revisión de verificación de la plataforma.",
        "Desde el Área Profesional podés enviar tu solicitud de verificación y consultar su estado. Los perfiles en borrador, pendientes, rechazados o suspendidos no aparecen en el directorio ni son accesibles públicamente.",
      ],
      callout: {
        title: "Alcance de la verificación",
        body: "El sello de perfil verificado acredita que el registro completó la validación administrativa prevista por ManosPro. Aporta transparencia inicial, pero no equivale a una garantía técnica ilimitada sobre cada trabajo ni reemplaza la verificación del presupuesto y alcance por parte del cliente.",
      },
    },
    {
      id: "comunicacao",
      title: "6. Comunicación entre clientes y profesionales",
      paragraphs: [
        "ManosPro ofrece mensajería privada interna y solicitudes estructuradas de presupuesto, respetando estrictamente las modalidades habilitadas por cada profesional (contacto directo y/o solicitud de presupuesto).",
        "Para resguardar la privacidad, el teléfono y el correo electrónico personal no se exponen en el directorio público. Las conversaciones son privadas entre los participantes, quedando prohibido el spam, el trato abusivo o cualquier intento de fraude.",
      ],
    },
    {
      id: "moderacao-suspensao",
      title: "7. Moderación, suspensión y baja de cuentas",
      paragraphs: [
        "ManosPro podrá suspender preventivamente o dar de baja cuentas y perfiles que incumplan estos Términos, presenten indicios de fraude, información falsa, uso abusivo del chat o conductas riesgosas para la comunidad.",
        "El profesional puede volver su perfil a borrador o cambiar su cuenta al modo cliente desde su panel, y cualquier usuario puede solicitar la baja de su cuenta sin perjuicio de los plazos legales de conservación que resulten aplicables.",
      ],
    },
    {
      id: "propriedade-disponibilidade",
      title: "8. Propiedad intelectual, disponibilidad y modificaciones",
      paragraphs: [
        "La marca ManosPro, su diseño, código fuente y contenidos editoriales pertenecen a sus titulares y no pueden reproducirse con fines comerciales sin autorización.",
        "Trabajamos para mantener el servicio disponible y seguro, sin garantizar ausencia total de interrupciones externas ni asumir responsabilidad por los acuerdos celebrados directamente entre clientes y profesionales.",
        "Estos Términos pueden actualizarse para reflejar mejoras de la plataforma o cambios normativos. La versión vigente permanecerá siempre disponible en el pie de página con su fecha de actualización.",
      ],
    },
    {
      id: "legislacao",
      title: "9. Legislación aplicable y transparencia",
      paragraphs: [
        "Estos Términos rigen para los usuarios de Argentina y Brasil, respetando en todos los casos las normas irrenunciables de defensa del consumidor y protección de datos aplicables en cada país.",
      ],
    },
  ],
  governanceNote: {
    title: "Canal de soporte e identificación del responsable",
    body: "Podés administrar los datos de tu cuenta directamente en /conta. Los datos societarios definitivos (razón social, CUIT/CNPJ y correo legal dedicado) se publicarán en esta sección una vez completada la registración institucional formal.",
  },
};

const PRIVACY_PT_BR: LegalDocumentData = {
  key: "privacy",
  breadcrumbLabel: "Privacidade e LGPD",
  badge: "Privacidade · LGPD & Ley 25.326",
  title: "Política de Privacidade e Proteção de Dados (LGPD)",
  subtitle:
    "Como o ManosPro coleta, protege e trata seus dados pessoais no Brasil (LGPD) e na Argentina (Ley 25.326), sem duplicação de regras.",
  lastUpdated: "Atualizado em novembro de 2026",
  jurisdictions: ["Brasil · LGPD (Lei nº 13.709/2018)", "Argentina · Ley 25.326"],
  summaryBox: {
    title: "Seus dados em resumo",
    points: [
      "Telefone e e-mail pessoal NÃO são exibidos no diretório público nem nos perfis públicos.",
      "Não vendemos dados pessoais e não utilizamos cookies de publicidade ou rastreamento comportamental.",
      "Você pode revisar e atualizar dados da sua conta em /conta e exercer todos os direitos previstos na LGPD e na Ley 25.326.",
    ],
  },
  sections: [
    {
      id: "escopo",
      title: "1. Compromisso e abrangência",
      paragraphs: [
        "Esta Política unifica as informações de Privacidade e Proteção de Dados do ManosPro em um único documento oficial, evitando duplicações ou contradições. Ela se aplica a visitantes, clientes e profissionais autônomos que acessam ou utilizam a plataforma no Brasil e na Argentina.",
      ],
    },
    {
      id: "dados-coletados",
      title: "2. Quais dados tratamos e o que é público ou privado",
      paragraphs: [
        "O ManosPro aplica separação rigorosa entre informações exibidas publicamente nos perfis profissionais verificados e dados pessoais mantidos sob acesso restrito.",
      ],
      bullets: [
        "Dados de conta e autenticação (privados): e-mail de cadastro, identificadores de sessão, papel da conta (cliente ou profissional) e senha armazenada exclusivamente de forma criptografada/hash pelo provedor de autenticação.",
        "Dados de contato pessoal (privados): número de telefone/WhatsApp, protegido no banco de dados com restrição de coluna e acessível somente ao próprio titular autenticado.",
        "Dados do perfil profissional publicado (públicos somente após verificação e publicação): nome público, foto de avatar opcional, país, cidade, bairro, categoria, especialidades, apresentação profissional, anos de experiência, zonas atendidas, idiomas, disponibilidade informada, serviços com valores de referência, fotos de portfólio e avaliações reais.",
        "Dados de verificação documental/cadastral (restritos): notas e registros de verificação profissional, inacessíveis ao público e restritos ao titular (via função protegida) e à moderação autorizada.",
        "Mensagens e solicitações de orçamento (privados): assunto, mensagens trocadas e status do pedido, visíveis exclusivamente ao cliente e ao profissional participantes da conversa.",
        "Preferências de navegação (armazenamento local): país/idioma/moeda selecionado no navegador (AR/BR), sem rastreamento publicitário.",
      ],
    },
    {
      id: "finalidades",
      title: "3. Finalidades do tratamento",
      paragraphs: [
        "Utilizamos os dados pessoais estritamente para viabilizar o funcionamento seguro da plataforma:",
      ],
      bullets: [
        "Criar, autenticar e proteger contas de clientes e profissionais.",
        "Exibir perfis profissionais verificados e publicados nas buscas por categoria, especialidade e localização.",
        "Conduzir o processo de verificação cadastral e prevenir fraudes, contas duplicadas ou abuso.",
        "Permitir conversas privadas e pedidos de orçamento conforme as modalidades habilitadas por cada profissional.",
        "Atender solicitações dos titulares e cumprir obrigações legais ou regulatórias.",
      ],
    },
    {
      id: "compartilhamento",
      title: "4. Compartilhamento e operadores de infraestrutura",
      paragraphs: [
        "O ManosPro não comercializa nem aluga dados pessoais a terceiros. Os dados são compartilhados apenas nos limites estritamente necessários à operação do serviço:",
      ],
      bullets: [
        "Entre cliente e profissional: quando você inicia voluntariamente um chat privado ou envia uma solicitação de orçamento na plataforma.",
        "Provedores de infraestrutura técnica (operadores): utilizamos serviços de autenticação, banco de dados PostgreSQL e armazenamento de arquivos (Supabase) com controles de acesso e criptografia em trânsito.",
        "Requisições legais: quando estritamente exigido por lei, ordem judicial ou autoridade competente.",
      ],
    },
    {
      id: "lgpd",
      title: "5. Proteção de Dados Pessoais — LGPD (Brasil) e Ley 25.326 (Argentina)",
      paragraphs: [
        "O tratamento de dados pessoais no ManosPro observa os princípios da finalidade, adequação, necessidade, transparência, segurança e prevenção previstos na Lei Geral de Proteção de Dados Pessoais do Brasil (Lei nº 13.709/2018 — LGPD) e na Lei de Proteção de Dados Pessoais da Argentina (Ley 25.326).",
        "Bases legais aplicáveis: execução de contrato ou procedimentos preliminares relacionados ao serviço solicitado pelo titular; cumprimento de obrigação legal ou regulatória; exercício regular de direitos; legítimo interesse voltado à segurança, verificação e prevenção a fraudes (com avaliação de impacto e salvaguardas); e consentimento específico quando aplicável.",
      ],
      bullets: [
        "Confirmação e acesso: confirmar a existência de tratamento e acessar os dados pessoais mantidos em sua conta.",
        "Correção e atualização: retificar dados incompletos, inexatos ou desatualizados diretamente em /conta ou pela área profissional.",
        "Anonimização, bloqueio ou eliminação: solicitar a eliminação ou bloqueio de dados desnecessários, excessivos ou tratados em desconformidade, ressalvadas hipóteses legais de retenção.",
        "Portabilidade e informação sobre compartilhamento: obter esclarecimentos claros sobre entidades públicas ou privadas com as quais os dados sejam compartilhados e exercer a portabilidade nos termos da regulamentação aplicável.",
        "Revogação de consentimento e oposição: revogar consentimentos eventualmente concedidos ou opor-se a tratamentos fora das hipóteses legais.",
      ],
      callout: {
        title: "Autoridades de proteção de dados e exercício de direitos",
        body: "Você pode editar informações do seu perfil diretamente em /conta. Caso queira solicitar exclusão de dados, acesso completo ou falar sobre privacidade, utilize o canal oficial de atendimento de privacidade do ManosPro. No Brasil, o titular também tem direito de peticionar perante a ANPD; na Argentina, perante a Agencia de Acceso a la Información Pública (AAIP).",
      },
    },
    {
      id: "seguranca",
      title: "6. Segurança técnica e controle de acesso",
      paragraphs: [
        "Adotamos medidas técnicas e arquiteturais orientadas à privacidade desde a concepção (privacy by design):",
      ],
      bullets: [
        "Políticas de Row Level Security (RLS) no banco de dados para isolar dados privados, conversas e áreas restritas por usuário autenticado.",
        "Restrição explícita de colunas sensíveis (como telefone e notas de verificação), impedindo leitura indevida em consultas públicas.",
        "Sessões autenticadas gerenciadas via cookies de sessão com renovação segura no servidor e validação de permissões.",
        "Exibição pública condicionada a perfil publicado, verificado e conta não suspensa.",
      ],
    },
    {
      id: "retencao",
      title: "7. Retenção, cookies e atualizações",
      paragraphs: [
        "Os dados pessoais são mantidos apenas pelo tempo necessário para a prestação do serviço enquanto a conta permanecer ativa, ou pelo prazo exigido para cumprimento de obrigações legais, prevenção à fraude e exercício regular de direitos.",
        "Para detalhes técnicos sobre cookies essenciais de sessão e armazenamento local no navegador, consulte nossa Política de Cookies em /politica-de-cookies.",
        "Eventuais atualizações relevantes desta Política serão divulgadas nesta página com a respectiva data de revisão.",
      ],
    },
  ],
  governanceNote: {
    title: "Encarregado pelo Tratamento de Dados (DPO)",
    body: "As configurações básicas de privacidade e perfil ficam disponíveis em /conta. O endereço de e-mail dedicado do Encarregado de Dados (DPO) e os dados societários completos do controlador serão publicados nesta seção assim que concluído o registro institucional definitivo do ManosPro.",
  },
};

const PRIVACY_ES_AR: LegalDocumentData = {
  key: "privacy",
  breadcrumbLabel: "Privacidad y Protección de Datos",
  badge: "Privacidad · Ley 25.326 & LGPD",
  title: "Política de Privacidad y Protección de Datos",
  subtitle:
    "Cómo ManosPro recopila, protege y trata tus datos personales en Argentina (Ley 25.326) y Brasil (LGPD), en un único documento claro.",
  lastUpdated: "Actualizado en noviembre de 2026",
  jurisdictions: ["Argentina · Ley 25.326", "Brasil · LGPD (Lei nº 13.709/2018)"],
  summaryBox: {
    title: "Tus datos en resumen",
    points: [
      "Tu teléfono y correo personal NO se muestran en el directorio público ni en las fichas públicas.",
      "No vendemos datos personales ni utilizamos cookies publicitarias o de rastreo entre sitios.",
      "Podés revisar y actualizar tus datos en /conta y ejercer los derechos de la Ley 25.326 y la LGPD.",
    ],
  },
  sections: [
    {
      id: "escopo",
      title: "1. Compromiso y alcance",
      paragraphs: [
        "Esta Política reúne en un único documento oficial las reglas de Privacidad y Protección de Datos de ManosPro, evitando duplicaciones o contradicciones. Se aplica a visitantes, clientes y profesionales independientes que utilizan la plataforma en Argentina y Brasil.",
      ],
    },
    {
      id: "dados-coletados",
      title: "2. Qué datos tratamos y qué es público o privado",
      paragraphs: [
        "ManosPro separa estrictamente la información pública de los perfiles profesionales verificados de los datos personales resguardados bajo acceso restringido.",
      ],
      bullets: [
        "Datos de cuenta y autenticación (privados): correo electrónico de acceso, identificadores de sesión, rol de cuenta (cliente o profesional) y contraseña gestionada exclusivamente mediante hash seguro por el proveedor de autenticación.",
        "Datos de contacto personal (privados): número de teléfono/WhatsApp, protegido a nivel de columna en base de datos y accesible únicamente para su propio titular autenticado.",
        "Datos del perfil profesional publicado (públicos solo tras verificación y publicación): nombre público, foto de avatar opcional, país, ciudad, barrio, categoría, especialidades, presentación, años de experiencia, zonas de cobertura, idiomas, disponibilidad habitual, servicios con precios de referencia, fotos del portafolio y reseñas reales.",
        "Datos de verificación (restringidos): notas y registros de validación profesional, inaccesibles al público y limitados al titular (vía función protegida) y a moderación autorizada.",
        "Mensajes y solicitudes de presupuesto (privados): asunto, mensajes intercambiados y estado de la consulta, visibles exclusivamente para el cliente y el profesional participantes.",
        "Preferencias de navegación (almacenamiento local): país/idioma/moneda elegido en el navegador (AR/BR), sin seguimiento publicitario.",
      ],
    },
    {
      id: "finalidades",
      title: "3. Finalidades del tratamiento",
      paragraphs: [
        "Tratamos los datos personales únicamente para operar la plataforma de manera segura y transparente:",
      ],
      bullets: [
        "Crear, autenticar y proteger cuentas de clientes y profesionales.",
        "Mostrar perfiles profesionales verificados y publicados en las búsquedas por rubro, oficio y zona.",
        "Ejecutar el proceso de verificación y prevenir fraude, suplantación o abuso.",
        "Habilitar el chat privado y el envío de solicitudes de presupuesto según las modalidades activas en cada perfil.",
        "Atender pedidos de los titulares y cumplir obligaciones legales aplicables.",
      ],
    },
    {
      id: "compartilhamento",
      title: "4. Compartición y proveedores de infraestructura",
      paragraphs: [
        "ManosPro no vende ni alquila datos personales. La información solo se comparte en los supuestos estrictamente necesarios para prestar el servicio:",
      ],
      bullets: [
        "Entre cliente y profesional: únicamente cuando el propio usuario inicia una conversación privada o solicita un presupuesto.",
        "Proveedores de infraestructura técnica (encargados de tratamiento): servicios de autenticación, base de datos PostgreSQL y almacenamiento de archivos (Supabase) con cifrado en tránsito y controles de acceso.",
        "Requerimientos legales: cuando sea estrictamente exigido por ley, orden judicial o autoridad competente.",
      ],
    },
    {
      id: "lgpd",
      title: "5. Protección de Datos Personales — Ley 25.326 (Argentina) y LGPD (Brasil)",
      paragraphs: [
        "El tratamiento de datos personales respeta los principios de licitud, finalidad, proporcionalidad, veracidad, transparencia y seguridad establecidos por la Ley 25.326 de Protección de Datos Personales de Argentina y por la Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD) de Brasil.",
        "Bases legales: ejecución de la relación de servicio solicitada por el titular, cumplimiento de obligaciones legales, ejercicio regular de derechos, interés legítimo en materia de seguridad y prevención de fraude (con salvaguardas adecuadas) y consentimiento cuando corresponda.",
      ],
      bullets: [
        "Acceso y confirmación: confirmar si tratamos tus datos y consultar la información registrada en tu cuenta.",
        "Rectificación y actualización: corregir o actualizar datos inexactos o incompletos directamente desde /conta o tu panel profesional.",
        "Supresión, bloqueo o anonimización: solicitar la eliminación o bloqueo de datos cuando corresponda legalmente, sin perjuicio de obligaciones legales de conservación.",
        "Información sobre cesiones, portabilidad y revocación: conocer cómo se resguardan tus datos, ejercer portabilidad conforme a la normativa aplicable y revocar consentimientos otorgados.",
      ],
      callout: {
        title: "Autoridades de control y ejercicio de derechos",
        body: "Podés actualizar los datos de tu perfil directamente en /conta. En Argentina, la Agencia de Acceso a la Información Pública (AAIP), en su carácter de Órgano de Control de la Ley 25.326, tiene la atribución de atender denuncias y reclamos por incumplimiento de normas de protección de datos; en Brasil, los titulares pueden dirigirse a la ANPD.",
      },
    },
    {
      id: "seguranca",
      title: "6. Seguridad técnica y control de acceso",
      paragraphs: [
        "Aplicamos medidas de seguridad integradas desde el diseño de la plataforma:",
      ],
      bullets: [
        "Políticas de Row Level Security (RLS) en PostgreSQL para aislar datos personales, conversaciones y paneles privados por usuario autenticado.",
        "Restricción explícita de columnas sensibles (teléfono y notas de verificación), bloqueando su lectura desde consultas públicas.",
        "Sesiones autenticadas gestionadas con cookies de sesión y validación de permisos en servidor.",
        "Publicación visible condicionada a perfil publicado, verificado y cuenta no suspendida.",
      ],
    },
    {
      id: "retencao",
      title: "7. Conservación, cookies y actualizaciones",
      paragraphs: [
        "Conservamos los datos personales únicamente durante el tiempo necesario para brindar el servicio mientras la cuenta se mantenga activa, o por el plazo legalmente requerido para prevenir fraude y atender obligaciones normativas.",
        "Para conocer el detalle técnico de las cookies esenciales de sesión y el almacenamiento local en el navegador, consultá nuestra Política de Cookies en /politica-de-cookies.",
        "Las actualizaciones relevantes de esta Política se publicarán en esta misma página indicando la fecha de última revisión.",
      ],
    },
  ],
  governanceNote: {
    title: "Responsable de Protección de Datos (DPO)",
    body: "Las opciones de gestión de cuenta están disponibles en /conta. El correo dedicado del Responsable de Protección de Datos y los datos societarios definitivos del titular de la base de datos se publicarán aquí una vez completada la formalización institucional de ManosPro.",
  },
};

const COOKIES_PT_BR: LegalDocumentData = {
  key: "cookies",
  breadcrumbLabel: "Política de Cookies",
  badge: "Cookies e armazenamento local",
  title: "Política de Cookies e Armazenamento Local",
  subtitle:
    "Transparência exata sobre os cookies essenciais e o armazenamento local utilizados hoje no ManosPro.",
  lastUpdated: "Atualizado em novembro de 2026",
  jurisdictions: ["Brasil · LGPD", "Argentina · Ley 25.326"],
  summaryBox: {
    title: "Resumo técnico real",
    points: [
      "Utilizamos apenas cookies estritamente necessários de autenticação (sessão Supabase) e armazenamento local para lembrar sua região/idioma.",
      "Não utilizamos cookies de publicidade, pixels de rastreamento ou anúncios de terceiros.",
      "Se cookies opcionais de análise forem adotados no futuro, pediremos consentimento prévio antes da ativação.",
    ],
  },
  sections: [
    {
      id: "o-que-sao",
      title: "1. O que são cookies e tecnologias equivalentes",
      paragraphs: [
        "Cookies são pequenos arquivos armazenados pelo navegador para manter funcionalidades essenciais, como reconhecer uma sessão autenticada entre páginas. Tecnologias equivalentes, como o localStorage do navegador, permitem guardar preferências simples de interface diretamente no seu dispositivo.",
      ],
    },
    {
      id: "quais-usamos",
      title: "2. O que o ManosPro utiliza atualmente",
      paragraphs: [
        "O ManosPro adota uma abordagem minimalista de armazenamento no navegador, limitada ao estritamente necessário para o funcionamento seguro da plataforma:",
      ],
      bullets: [
        "Cookies estritamente necessários de sessão (Supabase Auth / SSR): utilizados exclusivamente quando você entra na sua conta para manter a autenticação ativa, renovar tokens com segurança e validar permissões nas áreas privadas (/cliente, /profissional, /conta e /admin).",
        "Armazenamento local funcional (localStorage — chave manospro.country.v1): registra apenas o país, idioma e moeda escolhidos por você (BR · BRL ou AR · ARS) para manter a interface no formato desejado ao navegar entre páginas.",
      ],
    },
    {
      id: "nao-usamos",
      title: "3. Tecnologias que NÃO utilizamos atualmente",
      paragraphs: [
        "No momento, o ManosPro não carrega cookies de publicidade comportamental, retargeting, redes de anúncios ou rastreadores cross-site de terceiros.",
        "Caso no futuro sejam introduzidos cookies não essenciais (como métricas opcionais de uso ou ferramentas analíticas), atualizaremos esta Política e disponibilizaremos aviso e controle de consentimento antes da sua ativação.",
      ],
    },
    {
      id: "como-gerenciar",
      title: "4. Como gerenciar ou remover cookies e armazenamento local",
      paragraphs: [
        "Você pode consultar, bloquear ou apagar cookies e dados de armazenamento local a qualquer momento nas configurações de privacidade do seu navegador (Chrome, Firefox, Edge, Safari ou navegadores móveis).",
        "A desativação dos cookies estritamente necessários de sessão impedirá a manutenção do login nas áreas autenticadas; já a limpeza do localStorage apenas redefinirá a preferência inicial de país/idioma.",
      ],
    },
  ],
  governanceNote: {
    title: "Relação com a Política de Privacidade",
    body: "Esta página complementa nossa Política de Privacidade e Proteção de Dados (/politica-de-privacidade), onde detalhamos todos os direitos garantidos pela LGPD e pela Ley 25.326.",
  },
};

const COOKIES_ES_AR: LegalDocumentData = {
  key: "cookies",
  breadcrumbLabel: "Política de Cookies",
  badge: "Cookies y almacenamiento local",
  title: "Política de Cookies y Almacenamiento Local",
  subtitle:
    "Transparencia exacta sobre las cookies esenciales y el almacenamiento local que utiliza ManosPro actualmente.",
  lastUpdated: "Actualizado en noviembre de 2026",
  jurisdictions: ["Argentina · Ley 25.326", "Brasil · LGPD"],
  summaryBox: {
    title: "Resumen técnico real",
    points: [
      "Utilizamos únicamente cookies estrictamente necesarias de sesión (Supabase) y almacenamiento local para recordar tu país e idioma.",
      "No utilizamos cookies de publicidad, píxeles de seguimiento ni rastreadores comerciales de terceros.",
      "Si en el futuro incorporamos cookies opcionales de analítica, solicitaremos consentimiento previo antes de activarlas.",
    ],
  },
  sections: [
    {
      id: "o-que-sao",
      title: "1. Qué son las cookies y tecnologías equivalentes",
      paragraphs: [
        "Las cookies son pequeños archivos que el navegador guarda para sostener funciones esenciales, como mantener activa una sesión autenticada al cambiar de página. Tecnologías equivalentes, como el localStorage del navegador, permiten recordar preferencias simples de interfaz directamente en tu dispositivo.",
      ],
    },
    {
      id: "quais-usamos",
      title: "2. Qué utiliza ManosPro actualmente",
      paragraphs: [
        "ManosPro adopta un enfoque minimalista de almacenamiento en navegador, limitado a lo estrictamente necesario para operar con seguridad:",
      ],
      bullets: [
        "Cookies estrictamente necesarias de sesión (Supabase Auth / SSR): se utilizan únicamente cuando iniciás sesión para mantener tu cuenta autenticada, renovar credenciales de forma segura y validar permisos en áreas privadas (/cliente, /profissional, /conta y /admin).",
        "Almacenamiento local funcional (localStorage — clave manospro.country.v1): guarda únicamente tu preferencia de país, idioma y moneda (AR · ARS o BR · BRL) para mantener la interfaz consistente durante la navegación.",
      ],
    },
    {
      id: "nao-usamos",
      title: "3. Tecnologías que NO utilizamos actualmente",
      paragraphs: [
        "Actualmente ManosPro no utiliza cookies de publicidad comportamental, retargeting, redes publicitarias ni rastreadores entre sitios de terceros.",
        "Si en el futuro se incorporaran cookies no esenciales (por ejemplo, analítica opcional), actualizaremos esta Política y ofreceremos controles previos de consentimiento antes de su activación.",
      ],
    },
    {
      id: "como-gerenciar",
      title: "4. Cómo administrar o eliminar cookies y almacenamiento local",
      paragraphs: [
        "Podés consultar, bloquear o eliminar cookies y datos de almacenamiento local en cualquier momento desde la configuración de privacidad de tu navegador (Chrome, Firefox, Edge, Safari o navegadores móviles).",
        "Deshabilitar las cookies estrictamente necesarias de sesión impedirá mantener la sesión iniciada en áreas privadas; borrar el localStorage solo restablecerá la selección inicial de país e idioma.",
      ],
    },
  ],
  governanceNote: {
    title: "Relación con la Política de Privacidad",
    body: "Esta página complementa nuestra Política de Privacidad y Protección de Datos (/politica-de-privacidade), donde detallamos los derechos reconocidos por la Ley 25.326 y la LGPD.",
  },
};

export function getLegalDocument(
  key: LegalDocKey,
  locale: LocaleCode
): LegalDocumentData {
  const isPt = locale === "pt-BR";
  if (key === "terms") return isPt ? TERMS_PT_BR : TERMS_ES_AR;
  if (key === "privacy") return isPt ? PRIVACY_PT_BR : PRIVACY_ES_AR;
  return isPt ? COOKIES_PT_BR : COOKIES_ES_AR;
}
