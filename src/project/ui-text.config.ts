import { uiText as altUiText } from "../../fixtures/fixture-alt/project/ui-text.config";
import { isAltFixture } from "./data.config";
import { site } from "./site.config";

const primaryUiText = {
  form: {
    nameLabel: "Имя",
    phoneLabel: "Телефон",
    consentLabel: "Согласен на обработку",
    consentLinkLabel: "ПДн",
    submitLabel: "Отправить",
    sendingLabel: "Отправка…",
    requiredMessage: "Заполните имя, телефон и согласие.",
    retryMessage: "Не удалось отправить. Повторите.",
    transportDisabledMessage:
      "Приём заявок временно недоступен. Позвоните по телефону на сайте.",
  },
  analytics: {
    acceptLabel: "Разрешить",
    declineLabel: "Отклонить",
    prompt: "Сбор статистики только после согласия.",
  },
  notFoundFallback: "Страница не найдена",
  appShell: {
    errorTitle: "Что-то пошло не так",
    errorLead:
      "Произошла ошибка при загрузке страницы. Попробуйте обновить или вернитесь на главную.",
    retryLabel: "Повторить",
    homeLinkLabel: "На главную",
  },
  catalog: {
    gateFailTitle: "Раздел на проверке",
    gateFailMessage:
      "Каталог временно недоступен для индексации. Данные обновляются.",
    emptyDevelopmentsTitle: "Пока нет новостроек",
    emptyDevelopmentsMessage:
      "Новые объекты появятся после обновления каталога.",
    emptyListingsTitle: "Пока нет предложений",
    emptyListingsMessage: "Объекты появятся после обновления каталога.",
  },
  utility: {
    searchLabel: "Поиск",
    searchPlaceholder: "Скоро будет доступен в каталоге",
    favoritesEmpty: "Список избранного пуст.",
  },
  innLabel: "ИНН",
  chrome: {
    menuLabel: "Открыть меню",
  },
  home: {
    catalogAllLabel: "Весь каталог",
    dealSupportCaption: "Сопровождение сделки с недвижимостью",
  },
  entity: {
    minPriceLabel: "Минимальная цена",
  },
} as const;

export const uiText = isAltFixture() ? altUiText : primaryUiText;

export function legalLine(): string {
  return `${site.legalName}, ${uiText.innLabel} ${site.inn}, ${site.address}, ${site.phoneDisplay}, ${site.email}, ${site.hoursDisplay}`;
}

export function copyrightLine(year: number): string {
  return `© ${year} ${site.brand}`;
}
