// i18n: string lookup by key + active language. Add languages by extending
// LANGUAGES and the dictionaries. Missing keys fall back to English, then to
// the raw key only as a last resort (never a blank string).

export type LangCode = "en" | "fr" | "pt"

export const LANGUAGES: { code: LangCode; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "GB" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "pt", label: "Português", flag: "PT" },
]

type Dict = Record<string, string>

const en: Dict = {
  "app.name": "Tropy Games",
  "app.tagline": "Data-driven football tips & match analytics",

  "nav.free": "Free Tips",
  "nav.vip": "VIP Tips",
  "nav.plans": "VIP Plans",
  "nav.history": "History",
  "nav.ai": "Ask AI",
  "nav.search": "Search",
  "nav.language": "Language",
  "nav.theme": "Theme",

  "section.free.eyebrow": "STANDARD FREE TIPS",
  "section.vip.eyebrow": "PREMIUM VIP TIPS",
  "section.history.eyebrow": "RESOLVED TIP HISTORY",
  "section.matches": "{n} Matches",
  "section.today": "TODAY",

  "card.track": "TRACK",
  "card.tracked": "TRACKED",
  "card.vs": "VS",
  "card.tip": "Tip",
  "card.basedOn": "Based on",
  "card.noStats": "Stats unavailable for this fixture",
  "card.rawData": "View raw data",

  "status.pending": "Pending",
  "status.won": "Won",
  "status.lost": "Lost",
  "status.void": "Void",

  "vip.locked.title": "VIP tip locked",
  "vip.locked.subtitle": "Unlock premium tips with higher accuracy",
  "vip.unlock": "UNLOCK VIP",

  "plans.title": "Choose your VIP plan",
  "plans.subtitle": "Higher-accuracy tips, priority support, and more.",
  "plans.choose": "Choose Plan",
  "plans.weekly": "Weekly",
  "plans.monthly": "Monthly",
  "plans.season": "Season",
  "plans.perWeek": "/week",
  "plans.perMonth": "/month",
  "plans.perSeason": "/season",
  "plans.feature.allVip": "All VIP tips unlocked",
  "plans.feature.accuracy": "Higher odds accuracy tier",
  "plans.feature.priority": "Priority support",
  "plans.feature.history": "Full tip history access",
  "plans.feature.earlyAccess": "Early access to daily tips",
  "plans.popular": "MOST POPULAR",

  "history.hitRate": "{rate}% hit rate — last 30 days",
  "history.summary": "{won}W / {lost}L across {total} resolved tips",

  "search.placeholder": "Search team or competition…",
  "search.clear": "Clear search",

  "empty.title": "No tips available",
  "empty.subtitle": "There are no tips for this day. Try another date.",
  "empty.noResults": "No tips match your search.",

  "error.title": "Couldn't load tips",
  "error.retry": "Retry",

  "loading": "Loading tips…",

  "footer.responsible":
    "Tips are statistical estimates, not guarantees. Wager only what you can afford to lose. Gambling can be addictive — support is available. 18+.",
  "footer.rights": "For entertainment and informational purposes only.",
}

const fr: Dict = {
  "app.tagline": "Pronostics football & analyses de matchs basés sur les données",

  "nav.free": "Pronos Gratuits",
  "nav.vip": "Pronos VIP",
  "nav.plans": "Offres VIP",
  "nav.history": "Historique",
  "nav.ai": "Demander à l'IA",
  "nav.search": "Rechercher",
  "nav.language": "Langue",
  "nav.theme": "Thème",

  "section.free.eyebrow": "PRONOSTICS GRATUITS STANDARD",
  "section.vip.eyebrow": "PRONOSTICS VIP PREMIUM",
  "section.history.eyebrow": "HISTORIQUE DES PRONOSTICS",
  "section.matches": "{n} Matchs",
  "section.today": "AUJOURD'HUI",

  "card.track": "SUIVRE",
  "card.tracked": "SUIVI",
  "card.vs": "VS",
  "card.tip": "Prono",
  "card.basedOn": "Basé sur",
  "card.noStats": "Statistiques indisponibles pour ce match",
  "card.rawData": "Voir les données brutes",

  "status.pending": "En attente",
  "status.won": "Gagné",
  "status.lost": "Perdu",
  "status.void": "Annulé",

  "vip.locked.title": "Prono VIP verrouillé",
  "vip.locked.subtitle": "Débloquez les pronos premium plus précis",
  "vip.unlock": "DÉBLOQUER VIP",

  "plans.title": "Choisissez votre offre VIP",
  "plans.subtitle": "Pronos plus précis, support prioritaire et plus.",
  "plans.choose": "Choisir",
  "plans.weekly": "Hebdomadaire",
  "plans.monthly": "Mensuel",
  "plans.season": "Saison",
  "plans.perWeek": "/semaine",
  "plans.perMonth": "/mois",
  "plans.perSeason": "/saison",
  "plans.feature.allVip": "Tous les pronos VIP débloqués",
  "plans.feature.accuracy": "Niveau de précision supérieur",
  "plans.feature.priority": "Support prioritaire",
  "plans.feature.history": "Accès complet à l'historique",
  "plans.feature.earlyAccess": "Accès anticipé aux pronos du jour",
  "plans.popular": "LE PLUS POPULAIRE",

  "history.hitRate": "{rate}% de réussite — 30 derniers jours",
  "history.summary": "{won}G / {lost}P sur {total} pronos résolus",

  "search.placeholder": "Rechercher une équipe ou compétition…",
  "search.clear": "Effacer",

  "empty.title": "Aucun prono disponible",
  "empty.subtitle": "Aucun prono pour ce jour. Essayez une autre date.",
  "empty.noResults": "Aucun prono ne correspond à votre recherche.",

  "error.title": "Échec du chargement",
  "error.retry": "Réessayer",

  "loading": "Chargement des pronos…",

  "footer.responsible":
    "Les pronos sont des estimations statistiques, pas des garanties. Ne misez que ce que vous pouvez perdre. Le jeu peut créer une dépendance — de l'aide est disponible. 18+.",
  "footer.rights": "À des fins de divertissement et d'information uniquement.",
}

const pt: Dict = {
  "app.tagline": "Dicas de futebol e análises de jogos baseadas em dados",

  "nav.free": "Dicas Grátis",
  "nav.vip": "Dicas VIP",
  "nav.plans": "Planos VIP",
  "nav.history": "Histórico",
  "nav.ai": "IA",
  "nav.search": "Pesquisar",
  "nav.language": "Idioma",
  "nav.theme": "Tema",

  "section.free.eyebrow": "DICAS GRÁTIS PADRÃO",
  "section.vip.eyebrow": "DICAS VIP PREMIUM",
  "section.history.eyebrow": "HISTÓRICO DE DICAS",
  "section.matches": "{n} Jogos",
  "section.today": "HOJE",

  "card.track": "SEGUIR",
  "card.tracked": "SEGUINDO",
  "card.vs": "VS",
  "card.tip": "Dica",
  "card.basedOn": "Baseado em",
  "card.noStats": "Estatísticas indisponíveis para este jogo",
  "card.rawData": "Ver dados brutos",

  "status.pending": "Pendente",
  "status.won": "Ganhou",
  "status.lost": "Perdeu",
  "status.void": "Anulado",

  "vip.locked.title": "Dica VIP bloqueada",
  "vip.locked.subtitle": "Desbloqueie dicas premium mais precisas",
  "vip.unlock": "DESBLOQUEAR VIP",

  "plans.title": "Escolha o seu plano VIP",
  "plans.subtitle": "Dicas mais precisas, suporte prioritário e mais.",
  "plans.choose": "Escolher Plano",
  "plans.weekly": "Semanal",
  "plans.monthly": "Mensal",
  "plans.season": "Temporada",
  "plans.perWeek": "/semana",
  "plans.perMonth": "/mês",
  "plans.perSeason": "/temporada",
  "plans.feature.allVip": "Todas as dicas VIP desbloqueadas",
  "plans.feature.accuracy": "Nível de precisão superior",
  "plans.feature.priority": "Suporte prioritário",
  "plans.feature.history": "Acesso completo ao histórico",
  "plans.feature.earlyAccess": "Acesso antecipado às dicas diárias",
  "plans.popular": "MAIS POPULAR",

  "history.hitRate": "{rate}% de acerto — últimos 30 dias",
  "history.summary": "{won}V / {lost}D em {total} dicas resolvidas",

  "search.placeholder": "Pesquisar equipa ou competição…",
  "search.clear": "Limpar",

  "empty.title": "Nenhuma dica disponível",
  "empty.subtitle": "Não há dicas para este dia. Tente outra data.",
  "empty.noResults": "Nenhuma dica corresponde à pesquisa.",

  "error.title": "Falha ao carregar dicas",
  "error.retry": "Tentar novamente",

  "loading": "A carregar dicas…",

  "footer.responsible":
    "As dicas são estimativas estatísticas, não garantias. Aposte apenas o que puder perder. O jogo pode ser viciante — há apoio disponível. 18+.",
  "footer.rights": "Apenas para fins de entretenimento e informação.",
}

const DICTS: Record<LangCode, Dict> = { en, fr, pt }

/** Translate a key with optional {placeholder} interpolation. */
export function translate(
  lang: LangCode,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const raw = DICTS[lang]?.[key] ?? en[key] ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  )
}
