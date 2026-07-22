export const SITE_COPY = {
  navigation: {
    home: "Home",
    work: "Work",
    games: "Games",
    proposal: "Your Proposal",
    commission: "Commission",
  },
  footer: {
    location: "JetSetPlay · San Francisco",
    tagline: "Custom-branded games. Made to be kept.",
  },
  home: {
    eyebrow: "JETSETPLAY · SAN FRANCISCO",
    h1: "A gift is communication you can hold.",
    sub: "We design heritage games in your brand's language. Built to be kept. Made to be played for decades.",
    ctaPrimary: "Commission a game",
    ctaSecondary: "See your proposal live",
    thesis: {
      h2: "Presence is the last luxury.",
      paragraph1:
        "Most gifts are consumed and forgotten by Friday. A game returns. Every time your client sets the board, your brand is back on the table, in their home, between people they love. We call this recognition frequency. It is why a board outlasts a dinner, a basket, and every bottle you have ever sent.",
      paragraph2:
        "Merch gets stored. Games get replayed. So we measure differently. Not impressions, interactions. Not distribution, connection. Not cost per gift, value per relationship. Count the conversations started, the memories that now include you, and the number of times the board comes back out.",
    },
    house: {
      h2: "One studio. Five ways to be remembered.",
      backgammon:
        "Backgammon. The flagship. Your brand, translated into a board built to outlive the deal that inspired it.",
      talisman:
        "TALISMAN. Dominoes as objects of meaning. Twenty-eight small reasons to think of you.",
      clack:
        "CLACK. Mahjong, taught by the tiles themselves. The first set anyone can learn from the corner up.",
      dossier:
        "Dossier. A parlor mystery written for your table only. An evening no one else can buy.",
      minis:
        "MINIS. Charms that live on chips, keys, and collars. The smallest possible unit of presence.",
    },
    proof: {
      h2: "On the tables of",
      clients:
        "Coral Casino. Fischer Travel. Montecito Club. Godmothers. Distributed Global. Makaira. Film Roman.",
    },
    soul: {
      h2: "Play It Back · Edition 01 · Beirut",
      body: "Two hundred fifty boards. Seventy-two percent to the Unite Lebanon Youth Project. Because a game teaches the same thing everywhere: your move matters.",
      cta: "The Beirut edition",
    },
    closing: "Your brand is in play.",
  },
  work: {
    h1: "Work that stayed on the table.",
    coralCasino:
      "Coral Casino: A board for a hundred-year clubhouse. It looks like it was always there.",
    fischerTravel:
      "Fischer Travel: For clients who have everything, the one thing they did not.",
    montecitoClub:
      "Montecito Club: Course green, bunker sand, brass. The nineteenth hole, boxed.",
    godmothers:
      "Godmothers: A literary house deserves a literate game.",
    distributedGlobal:
      "Distributed Global: The long game, for people who invest in it.",
    filmRoman:
      "Film Roman: Where the characters got their own seat at the table.",
    closing: "Yours belongs here.",
    cta: "Commission a game",
  },
  games: {
    h1: "Designed to be gifted. Built to be played.",
    backgammon:
      "Backgammon: Five thousand years old and still the fastest way to know someone. We build yours to Board Standard v2: your marks, your materials, your colors, correct to the millimeter.",
    talisman:
      "TALISMAN dominoes: Every tile a token. Line them up and read your brand like a sentence.",
    clack:
      "CLACK mahjong: The corner index changed everything. The set that teaches while it plays, so the table grows instead of gatekeeping.",
    dossier:
      "Dossier: A mystery written for your people, your places, your inside jokes. Solved once, retold forever.",
    minis:
      "MINIS: Presence at charm scale. On the chip, on the keyring, on the dog.",
    cta: "Commission yours",
  },
  proposal: {
    h1: "Your brand. On the board. In ninety seconds.",
    sub: "Tell us who the gift is for. The studio engine drafts a concept in your brand's own language: colors, marks, materials, and the note that goes in the box.",
    thoughtfulness:
      "Every set can carry each recipient's own detail. Our Thoughtfulness Layer maps who they are so the gift lands like you knew them.",
    fields: {
      brand: "Your brand",
      recipient: "Who receives it",
      occasion: "The occasion",
    },
    button: "Draft my proposal",
    catalogue: "Get the custom catalogue.",
    email: "Email",
    loading: "Setting the board",
    empty: "Every board starts with a name. Give us yours.",
    error: "The board did not set. Check your entries and try again.",
    footer: "Proposed by JetSetPlay.",
    oneSheet: "One-sheet",
    postProposalCta: "Make it real",
    tldr: "TL;DR",
  },
  commission: {
    h1: "Four moves to a gift they keep.",
    signal:
      "Signal. We study who you are and who this is for. The gift begins as listening.",
    design:
      "Design. Designed from your brand. Never decorated with it. Proofed to the millimeter.",
    craft: "Craft. Materials chosen to age well. Built by hands, checked twice.",
    dispatch:
      "Dispatch. Boxed, noted, delivered. The unboxing is part of the design.",
    contactH2: "Start with a conversation.",
    contact: "San Francisco · ciao@jetsetplay.co",
    button: "Book a call",
  },
} as const;

export type SiteRoute = keyof typeof SITE_COPY.navigation;
