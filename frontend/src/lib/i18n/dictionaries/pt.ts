export const pt = {
  common: {
    login: "Entrar",
    logout: "Sair",
    loggingOut: "Saindo…",
    pricing: "Preços",
    developers: "Developers",
    features: "Recursos",
    language: "Idioma",
    loading: "Carregando…",
    copy: "Copiar",
    copied: "Copiado!",
    viewCard: "Ver cartão",
    viewPortfolio: "Ver portfólio",
    startFree: "Criar meu cartão grátis",
    seePlans: "Ver planos",
  },
  landing: {
    badge: "Cartão de presença digital",
    heroTitle: "Seu passaporte digital.",
    heroSub:
      "Um link com sua foto, contatos, portfólio e QR. Atualize uma vez — vale em todo lugar que você compartilhou.",
    heroNote: "Grátis para sempre no plano Free. Sem cartão de crédito.",
    worksEverywhere: "Funciona onde você já está",
    channels: ["WhatsApp", "E-mail", "QR Code", "Bio do Instagram", "NFC", "Assinatura"],
    updateOnceTitle: "Atualize uma vez, valha em todo lugar",
    updateOnceText:
      "Mudou de telefone, cargo ou empresa? Edite seu cartão e todos os links, QRs e tags NFC que você já espalhou continuam certos — sem reimprimir nada.",
    profileTitle: "Seu perfil, do seu jeito",
    profileText:
      "Temas, cor da marca e botões personalizados. Quem recebe toca em “Salvar contato” e você entra na agenda com nome e empresa corretos.",
    portfolioTitle: "Seu portfólio é uma página sua",
    portfolioText:
      "Projetos, serviços e preços em uma página pública pronta para compartilhar — no mesmo link do seu cartão.",
    portfolioCta: "Criar minha página",
    stepsTitle: "Como funciona",
    steps: [
      {
        title: "Crie seu cartão",
        text: "Foto, nome, contatos e tema em poucos minutos. Sem design, sem código.",
      },
      {
        title: "Compartilhe em segundos",
        text: "Um link, um QR ou o Presence Mode em tela cheia — direto do celular.",
      },
      {
        title: "Vire contato salvo",
        text: "Um toque em “Salvar contato” e você entra na agenda de quem importa.",
      },
    ],
    devTitle: "Para desenvolvedores",
    devText:
      "Avatar público por e-mail, estilo Gravatar — grátis, sem chave de API.",
    devCta: "Ver documentação",
    faqTitle: "Perguntas frequentes",
    faq: [
      {
        q: "O MyCartao é grátis?",
        a: "Sim. O plano Free inclui cartão com QR, Presence Mode, portfólio com 3 itens e a API de avatar. O Pro (R$ 19,90/mês) adiciona slug personalizado, Smart Card, analytics de 90 dias e remove o branding.",
      },
      {
        q: "Preciso instalar algum aplicativo?",
        a: "Não. Tudo funciona no navegador — o seu e o de quem recebe o cartão. O QR abre direto na câmera do celular.",
      },
      {
        q: "Como a pessoa salva meu contato?",
        a: "Ela abre seu link e toca em “Salvar contato”. O vCard baixa com seu nome, empresa, telefones e links — direto para a agenda do iPhone ou Android.",
      },
      {
        q: "O que é o Smart Card?",
        a: "Um único link que decide o destino por regras: em horário comercial vai para o WhatsApp, fora dele para o portfólio. Disponível no Pro.",
      },
      {
        q: "Posso cancelar quando quiser?",
        a: "Sim. A assinatura Pro é mensal via Stripe e pode ser cancelada a qualquer momento — seu cartão continua no plano Free.",
      },
    ],
    finalCta: "Seu próximo contato começa com um link.",
  },
  pricing: {
    title: "Preços simples",
    lead: "Comece grátis. Evolua para o Pro quando precisar de slug, analytics longos e Smart Card.",
    perMonth: "/mês",
    freeCta: "Criar conta grátis",
    proCta: "Assinar Pro",
    free: [
      "1 cartão digital",
      "Link comum do cartão e portfólio (por ID)",
      "QR + Presence Mode",
      "API de avatar (estilo Gravatar)",
      "Portfólio com até 3 itens",
      "Analytics 7 dias",
      "Print PDF com watermark",
    ],
    pro: [
      "Cartões ilimitados",
      "Link personalizado (slug) no cartão e portfólio",
      "Links personalizados (botões) no cartão",
      "Smart Card com regras",
      "Sem watermark + Print Kit",
      "Portfólio ilimitado",
      "Analytics 90 dias + export",
      "Sem branding MyCartao",
    ],
  },
  login: {
    title: "Entrar com magic link",
    lead: "Sem senha. Enviamos um link único para o seu e-mail.",
    email: "E-mail",
    submit: "Enviar link",
    sending: "Enviando…",
    sent: "Link enviado. Abra o e-mail e clique para entrar na sua conta.",
    sendError: "Não foi possível enviar o link. Tente de novo.",
    networkError:
      "Não foi possível falar com o servidor. Atualize a página e tente de novo.",
  },
  appNav: {
    cards: "Cartões",
    portfolio: "Portfólio",
    avatarApi: "API Avatar",
    smart: "Smart",
    analytics: "Analytics",
    billing: "Cobrança",
    settings: "Configurações",
    admin: "Admin",
  },
  publicPortfolio: {
    title: "Portfólio",
    lead: "Projetos e serviços públicos.",
    empty: "Nenhum item publicado ainda.",
    notFound: "Portfólio não encontrado.",
    loadError: "Falha ao carregar o portfólio.",
    service: "Serviço",
    project: "Projeto",
    copyLink: "Copiar link da página",
  },
};

export type Dictionary = typeof pt;
