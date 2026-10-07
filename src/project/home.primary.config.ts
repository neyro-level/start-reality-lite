export const homeContent = {
  hero: {
    eyebrow: "НЕДВИЖИМОСТЬ В ПРИМЕРСКЕ",
    titleLine1: "Новостройки и квартиры",
    titleLine2: "в Примерске",
    supporting:
      "Помогаем сравнить предложения рынка, выбрать подходящий объект и пройти путь сделки с понятным сопровождением.",
    ctaLabel: "Подобрать вариант",
    chips: [
      { pageKey: "catNovostroyki", label: "Новостройки" },
      { pageKey: "facetVtorichka", label: "Вторичная недвижимость" },
      { pageKey: "ipoteka", label: "Ипотека" },
    ],
  },
  quickRoutes: [
    {
      pageKey: "catNovostroyki",
      label: "Посмотреть новостройки",
      icon: "building",
    },
    { pageKey: "catKvartiry", label: "Подобрать квартиру", icon: "home" },
    { pageKey: "facetVtorichka", label: "Вторичная недвижимость", icon: "key" },
    { pageKey: "ipoteka", label: "Ипотека", icon: "percent" },
    { pageKey: "developers", label: "Застройщики", icon: "landmark" },
    { pageKey: "contacts", label: "Помощь специалиста", icon: "headphones" },
  ],
  developments: {
    title: "Новостройки Примерска",
    catalogPageKey: "catNovostroyki",
    selectionCard: {
      title: "Поможем подобрать новостройку",
      text: "Сравним подходящие варианты по вашим параметрам и поможем разобраться в условиях покупки.",
      ctaLabel: "Получить подборку",
    },
  },
  interest: {
    title: "Вас может заинтересовать",
    serviceCard: {
      title: "Не нашли подходящий вариант?",
      text: "Расскажите, какую недвижимость ищете. Подберём предложения под вашу задачу.",
      ctaLabel: "Получить подборку",
    },
  },
  service: {
    eyebrow: "СОПРОВОЖДЕНИЕ СДЕЛКИ",
    titleLine1: "Поможем разобраться",
    titleLine2: "в документах перед сделкой",
    text: "Поможем проверить доступные документы и условия объекта, объясним важные моменты и подскажем, на что обратить внимание до принятия решения.",
    primaryCta: "Разобрать ситуацию",
    secondaryCta: "Узнать об услуге",
    servicePageKey: "yurist",
  },
  trust: {
    eyebrow: "О КОМПАНИИ",
    titleLine1: "Помогаем выбрать недвижимость",
    titleLine2: "без лишней сложности",
    paragraph1:
      "Недвижимость — это не только цена и квадратные метры. Важно сравнить предложения, понять условия покупки и выбрать вариант, который подходит именно под вашу задачу.",
    paragraph2:
      "Мы помогаем пройти этот путь последовательно: от подбора объектов и сравнения условий до вопросов по ипотеке и сопровождению сделки.",
  },
  leadExpert: {
    eyebrow: "ПОМОЩЬ СПЕЦИАЛИСТА",
    titleLine1: "Нужна помощь",
    titleLine2: "с выбором недвижимости?",
    text: "Расскажите, что ищете и что для вас важно. Свяжемся с вами и поможем определить подходящие варианты.",
    submitLabel: "Подобрать вариант",
  },
  popularSearches: {
    title: "Часто ищут",
    groups: [
      {
        title: "Новостройки",
        pageKeys: ["catNovostroyki", "distLeninskiy", "distVoroshilovskiy"],
      },
      {
        title: "Квартиры",
        pageKeys: ["catKvartiry", "facetVtorichka"],
      },
      {
        title: "Застройщики",
        pageKeys: ["developers"],
      },
      {
        title: "Услуги",
        pageKeys: ["ipoteka", "yurist", "contacts"],
      },
    ],
  },
} as const;
