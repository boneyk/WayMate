import { createContext, useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";

const STORAGE_KEY = "sahalin-trip-planner-v1";
const DEFAULT_CATEGORIES = ["Экскурсии", "Размещение", "Горы"];
const DEFAULT_PARTICIPANT_NAMES = ["Дима", "Настя"];
const normalizeCategoryName = (value) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е");
const RESERVED_CATEGORY_FILTERS = ["все", "сохраненное", "архив"];

export const initialItems = [
  {
    id: "icefalls",
    title: "Экскурсия по ледопадам",
    category: "Экскурсии",
    kind: "tour",
    place: "Сахалин",
    price: null,
    priceLabel: "Стоимость уточняется",
    priceMode: "unknown",
    description: "Зимняя поездка к замёрзшим водопадам острова.",
    url: "https://sakhalintours.ru/ledopady",
    tag: "На природе",
  },
  {
    id: "snowmobiles",
    title: "Экскурсия на снегоходах",
    category: "Экскурсии",
    kind: "tour",
    place: "Пять озёр",
    price: 9000,
    priceLabel: "9 000 ₽ за двоих",
    priceMode: "pair",
    description: "Снегоходная прогулка по зимнему маршруту у Анивы.",
    url: "https://anivatour.ru/5ozer",
    tag: "Приключение",
  },
  {
    id: "dog-sleds",
    title: "Собачьи упряжки",
    category: "Экскурсии",
    kind: "tour",
    place: "Юный каюр",
    price: 8000,
    priceLabel: "8 000 ₽ с человека",
    priceMode: "perPerson",
    description: "Знакомство с ездовыми собаками и катание на упряжке.",
    url: "https://amist.ru/excursions/yunyj-kayur/?ysclid=muy4lscrop888764348",
    tag: "С животными",
  },
  {
    id: "ski-rental",
    title: "Прокат горных лыж",
    category: "Горы",
    kind: "activity",
    place: "Горнолыжный комплекс",
    price: 3000,
    priceLabel: "≈ 3 000 ₽ в день",
    priceMode: "perDay",
    description: "Ориентир из заметок: прокат лыж примерно на день.",
    url: "https://lavina-prokat.ru/service/prokat-gornyh-lyzh/",
    tag: "На склонах",
  },
  {
    id: "ski-pass",
    title: "Ски-пасс",
    category: "Горы",
    kind: "activity",
    place: "Горнолыжный комплекс",
    price: 3000,
    priceLabel: "3 000 ₽ с человека",
    priceMode: "perPersonDay",
    description: "Стоимость одного дня катания по вашему ориентиру.",
    url: "",
    tag: "На склонах",
  },
  {
    id: "ski-suit",
    title: "Горнолыжный костюм",
    category: "Горы",
    kind: "activity",
    place: "На время катания",
    price: 7000,
    priceLabel: "≈ 7 000 ₽ · уточнить условия",
    priceMode: "fixed",
    description:
      "В заметках цена без указания срока проката и количества комплектов.",
    url: "",
    tag: "На склонах",
  },
  {
    id: "hostel-ovsyanka",
    title: "Хостел «Овсянка»",
    category: "Размещение",
    kind: "stay",
    durationDays: 7,
    place: "Южно-Сахалинск",
    price: 19000,
    priceLabel: "19 000 ₽ за 7 ночей",
    priceMode: "fixed",
    description:
      "Отдельная комната на двоих, общий душ. Даты в подборке: 8–14 февраля.",
    url: "https://ostrovok.ru/hotel/russia/yuzhno-sakhalinsk/mid8850630/hostel_ovsyanka/?dates=08.02.2027-14.02.2027&guests=2&room=s-514904db-9a2b-587f-b30a-98ce874f2988&search_chain_id=sr-01a11a8e-eb7f-7ee2-bc82-a5755fe3df93",
    tag: "Общий душ",
  },
  {
    id: "chekhova-studio",
    title: "Студия на Чехова, 43",
    category: "Размещение",
    kind: "stay",
    durationDays: 7,
    place: "Южно-Сахалинск",
    price: 15514,
    priceLabel: "15 514 ₽ за проживание",
    priceMode: "fixed",
    description: "Студия на двоих. Даты в подборке: 8–14 февраля.",
    url: "https://ostrovok.ru/hotel/russia/yuzhno-sakhalinsk/mid8873632/apartamenty_na_chekhova_43/?dates=08.02.2027-14.02.2027&guests=2&room=s-f58f54b1-c3ad-501a-9c7e-81da4cdde7bd&search_chain_id=sr-01a11a8e-eb70-7e95-aeba-f6ae47adb43b",
    tag: "Студия",
  },
  {
    id: "mini-studio",
    title: "Супер мини студия",
    category: "Размещение",
    kind: "stay",
    durationDays: 7,
    place: "Южно-Сахалинск",
    price: 13786,
    priceLabel: "13 786 ₽ за проживание",
    priceMode: "fixed",
    description: "Компактный вариант в центре. Даты в подборке: 8–14 февраля.",
    url: "https://ostrovok.ru/hotel/russia/yuzhno-sakhalinsk/mid10670154/v_samom_tsentre_apartments_8/?dates=08.02.2027-14.02.2027&guests=2&price=600-14700.all&room=s-61f2bfdc-71c3-583b-944c-ed34b6ac2d29&search_chain_id=sr-01a11a8e-eb70-7e7c-adba-19f555bcdf6c",
    tag: "Компактно",
  },
  {
    id: "city-apartment",
    title: "Квартира с видом на сопки",
    category: "Размещение",
    kind: "stay",
    durationDays: 5,
    place: "Южно-Сахалинск",
    price: 17811,
    priceLabel: "17 811 ₽ за проживание",
    priceMode: "fixed",
    description: "Вариант в центре города. Даты в подборке: 22–26 февраля.",
    url: "https://ostrovok.ru/hotel/russia/yuzhno-sakhalinsk/mid13679788/v_tsentre_goroda_s_vidom_na_sopki_apartments/?dates=22.02.2027-26.02.2027&guests=2&room=s-f13faf3f-844f-5d70-9c78-074ce28eff2d&search_chain_id=sr-01a1f283-df16-7c56-9b3b-92cdb5c2375a&q=3667",
    tag: "Вид на сопки",
  },
];

const readSavedState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
};

class TripStore {
  items = initialItems;
  customItems = [];
  itemOverrides = {};
  deletedItemIds = [];
  archivedItemIds = [];
  customCategories = [];
  deletedCategories = [];
  itinerary = [];
  customCosts = [];
  savedItems = [];
  dayCount = 7;
  travelers = 2;
  participants = [];
  proposals = [];
  constructor() {
    makeAutoObservable(this);
    const saved = readSavedState();
    this.customItems = (saved.customItems ?? []).map((item) =>
      item.category === "Жильё"
        ? {
            ...item,
            category: "Размещение",
            kind: "stay",
            durationDays: item.durationDays ?? 1,
          }
        : item,
    );
    this.itemOverrides = saved.itemOverrides ?? {};
    this.deletedItemIds = [];
    this.archivedItemIds = [
      ...new Set([
        ...(saved.archivedItemIds ?? []),
        ...(saved.deletedItemIds ?? []),
      ]),
    ];
    this.customCategories = saved.customCategories ?? [];
    this.deletedCategories = saved.deletedCategories ?? [];
    this.itinerary = saved.itinerary ?? [];
    this.customCosts = saved.customCosts ?? [];
    this.savedItems = saved.savedItems ?? [];
    this.dayCount = saved.dayCount ?? 7;
    this.travelers = Number(saved.travelers) || saved.participants?.length || 2;
    this.participants = Array.from({ length: this.travelers }, (_, index) => {
      const participant = saved.participants?.[index];
      return {
        id: participant?.id || `participant-${crypto.randomUUID()}`,
        name:
          participant?.name ||
          DEFAULT_PARTICIPANT_NAMES[index] ||
          `Участник ${index + 1}`,
      };
    });
    this.proposals = saved.proposals ?? [];
    this.persist();
  }
  persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        customItems: this.customItems,
        itemOverrides: this.itemOverrides,
        deletedItemIds: this.deletedItemIds,
        archivedItemIds: this.archivedItemIds,
        customCategories: this.customCategories,
        deletedCategories: this.deletedCategories,
        itinerary: this.itinerary,
        customCosts: this.customCosts,
        savedItems: this.savedItems,
        dayCount: this.dayCount,
        travelers: this.travelers,
        participants: this.participants,
        proposals: this.proposals,
      }),
    );
  }
  addToPlan(itemId, day, period = null) {
    this.itinerary.push({ id: crypto.randomUUID(), itemId, day: Number(day), period });
    this.persist();
  }
  proposeItem(itemId, day, approvedParticipantIds, period = null) {
    const startDay = Math.max(1, Math.min(Number(day) || 1, this.dayCount));
    const votes = Object.fromEntries(
      this.participants.map((participant) => [
        participant.id,
        approvedParticipantIds.includes(participant.id),
      ]),
    );
    if (this.participants.every((participant) => votes[participant.id])) {
      this.itinerary.push({ id: crypto.randomUUID(), itemId, day: startDay, period });
      this.persist();
      return "approved";
    }
    this.proposals.push({
      id: crypto.randomUUID(),
      itemId,
      day: startDay,
      period,
      votes,
    });
    this.persist();
    return "pending";
  }
  setProposalVote(proposalId, participantId, approved) {
    const proposal = this.proposals.find((item) => item.id === proposalId);
    if (
      !proposal ||
      !this.participants.some((participant) => participant.id === participantId)
    )
      return false;
    const votes = { ...proposal.votes, [participantId]: Boolean(approved) };
    if (this.participants.every((participant) => votes[participant.id])) {
      this.itinerary.push({
        id: crypto.randomUUID(),
        itemId: proposal.itemId,
        day: proposal.day,
        period: proposal.period ?? null,
      });
      this.proposals = this.proposals.filter((item) => item.id !== proposalId);
      this.persist();
      return true;
    }
    this.proposals = this.proposals.map((item) =>
      item.id === proposalId ? { ...item, votes } : item,
    );
    this.persist();
    return false;
  }
  removeProposal(proposalId) {
    this.proposals = this.proposals.filter((item) => item.id !== proposalId);
    this.persist();
  }
  removeFromPlan(entryId) {
    this.itinerary = this.itinerary.filter((entry) => entry.id !== entryId);
    this.persist();
  }
  setTripSettings(dayCount, travelers, participantNames = []) {
    const nextDayCount = Math.max(
      1,
      Math.min(30, Math.trunc(Number(dayCount) || 1)),
    );
    const nextTravelers = Math.max(
      1,
      Math.min(20, Math.trunc(Number(travelers) || 1)),
    );
    this.dayCount = nextDayCount;
    this.travelers = nextTravelers;
    const names = Array.isArray(participantNames) ? participantNames : [];
    this.participants = Array.from({ length: nextTravelers }, (_, index) => {
      const name = String(
        names[index] ??
          this.participants[index]?.name ??
          DEFAULT_PARTICIPANT_NAMES[index] ??
          `Участник ${index + 1}`,
      ).trim();
      const previous = this.participants[index];
      return {
        id:
          previous?.name === name
            ? previous.id
            : `participant-${crypto.randomUUID()}`,
        name,
      };
    });
    this.itinerary = this.itinerary.map((entry) =>
      entry.day > nextDayCount ? { ...entry, day: nextDayCount } : entry,
    );
    const participantIds = this.participants.map(
      (participant) => participant.id,
    );
    const remainingProposals = [];
    for (const proposal of this.proposals) {
      const votes = Object.fromEntries(
        participantIds.map((id) => [id, Boolean(proposal.votes?.[id])]),
      );
      if (participantIds.every((id) => votes[id])) {
        this.itinerary.push({
          id: crypto.randomUUID(),
          itemId: proposal.itemId,
          day: Math.min(proposal.day, nextDayCount),
          period: proposal.period ?? null,
        });
      } else {
        remainingProposals.push({
          ...proposal,
          day: Math.min(proposal.day, nextDayCount),
          votes,
        });
      }
    }
    this.proposals = remainingProposals;
    this.persist();
  }
  addCustomCost(title, amount, category) {
    this.customCosts.push({
      id: crypto.randomUUID(),
      title,
      amount: Number(amount),
      category,
    });
    this.persist();
  }
  makeCatalogItem(fields, id) {
    const category =
      fields.category === "Жильё"
        ? "Размещение"
        : fields.category || DEFAULT_CATEGORIES[0];
    const isStay = category === "Размещение";
    const dailyRate =
      isStay && fields.dailyRate != null ? Number(fields.dailyRate) : null;
    const price =
      dailyRate != null
        ? null
        : fields.price == null
          ? null
          : Number(fields.price);
    const perPerson =
      fields.perPerson == null
        ? fields.priceMode === "perPerson" ||
          fields.priceMode === "perPersonDay"
        : Boolean(fields.perPerson);
    const durationDays = isStay
      ? Math.max(1, Math.min(30, Math.trunc(Number(fields.durationDays) || 1)))
      : undefined;
    const money = (amount) =>
      `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
    return {
      ...fields,
      id,
      title: fields.title.trim(),
      category,
      kind: isStay ? "stay" : category === "Горы" ? "activity" : "tour",
      place: fields.place?.trim() || "Не указано",
      description: fields.description?.trim() || "Добавлено вами в каталог.",
      price,
      dailyRate,
      durationDays,
      perPerson,
      priceMode:
        dailyRate != null
          ? perPerson
            ? "perPerson"
            : "fixed"
          : price == null
            ? "unknown"
            : perPerson
              ? "perPerson"
              : ["perPerson", "perPersonDay"].includes(fields.priceMode)
                ? "fixed"
                : fields.priceMode || "fixed",
      priceLabel:
        dailyRate != null
          ? `${money(dailyRate)} в день${perPerson ? " с человека" : ""}`
          : price != null
            ? fields.priceLabel ||
              `${money(price)} ${perPerson ? "с человека" : isStay ? "за проживание" : "за позицию"}`
            : "Стоимость уточняется",
      url: fields.url?.trim() || "",
      tag: fields.tag || "Своя идея",
    };
  }
  addCustomIdea(fields) {
    const id = `custom-${crypto.randomUUID()}`;
    this.customItems.push(this.makeCatalogItem(fields, id));
    this.persist();
  }
  updateCatalogItem(id, fields) {
    const existing = this.catalogItems.find((item) => item.id === id);
    if (!existing) return;
    const nextFields = { ...existing, ...fields };
    const existingPerPerson = Boolean(
      existing.perPerson ||
      existing.priceMode === "perPerson" ||
      existing.priceMode === "perPersonDay",
    );
    if (
      fields.price !== existing.price ||
      fields.dailyRate !== existing.dailyRate ||
      (fields.perPerson != null &&
        Boolean(fields.perPerson) !== existingPerPerson)
    ) {
      nextFields.priceLabel = "";
    }
    const updated = this.makeCatalogItem(nextFields, id);
    if (this.customItems.some((item) => item.id === id)) {
      this.customItems = this.customItems.map((item) =>
        item.id === id ? updated : item,
      );
    } else {
      this.itemOverrides[id] = updated;
    }
    this.persist();
  }
  archiveCatalogItem(id) {
    if (
      !this.catalogItems.some((item) => item.id === id) ||
      this.archivedItemIds.includes(id)
    )
      return false;
    this.archivedItemIds.push(id);
    this.persist();
    return true;
  }
  restoreCatalogItem(id) {
    if (!this.archivedItemIds.includes(id)) return false;
    this.archivedItemIds = this.archivedItemIds.filter(
      (itemId) => itemId !== id,
    );
    this.persist();
    return true;
  }
  addCategory(name) {
    const normalized = name.trim();
    const normalizedKey = normalizeCategoryName(normalized);
    if (
      !normalized ||
      RESERVED_CATEGORY_FILTERS.includes(normalizedKey) ||
      normalizedKey === "жилье" ||
      this.catalogCategories.some(
        (category) => normalizeCategoryName(category) === normalizedKey,
      )
    ) {
      return false;
    }
    this.deletedCategories = this.deletedCategories.filter(
      (category) => normalizeCategoryName(category) !== normalizedKey,
    );
    this.customCategories.push(normalized);
    this.persist();
    return true;
  }
  removeCatalogCategory(name) {
    const normalizedKey = normalizeCategoryName(name);
    if (!normalizedKey || RESERVED_CATEGORY_FILTERS.includes(normalizedKey))
      return false;
    const category = this.catalogCategories.find(
      (item) => normalizeCategoryName(item) === normalizedKey,
    );
    if (!category) return false;
    const categoryItemIds = this.catalogItems
      .filter((item) => normalizeCategoryName(item.category) === normalizedKey)
      .map((item) => item.id);
    this.deletedCategories = [...this.deletedCategories, category];
    this.customCategories = this.customCategories.filter(
      (item) => normalizeCategoryName(item) !== normalizedKey,
    );
    this.archivedItemIds = [
      ...new Set([...this.archivedItemIds, ...categoryItemIds]),
    ];
    this.persist();
    return true;
  }
  removeCustomCost(id) {
    this.customCosts = this.customCosts.filter((cost) => cost.id !== id);
    this.persist();
  }
  saveItem(itemId) {
    if (!this.savedItems.includes(itemId)) this.savedItems.push(itemId);
    this.persist();
  }
  unsaveItem(itemId) {
    this.savedItems = this.savedItems.filter((id) => id !== itemId);
    this.persist();
  }
  getEntryItems() {
    return this.itinerary
      .map((entry) => ({
        ...entry,
        item: this.catalogItems.find((item) => item.id === entry.itemId),
      }))
      .filter((entry) => entry.item)
      .map((entry) => ({
        ...entry,
        durationDays: this.getEntryDuration(entry),
      }));
  }
  getProposalItems() {
    return this.proposals
      .map((proposal) => ({
        ...proposal,
        item: this.catalogItems.find((item) => item.id === proposal.itemId),
      }))
      .filter((proposal) => proposal.item);
  }
  get catalogItems() {
    return [
      ...this.items
        .filter((item) => !this.deletedItemIds.includes(item.id))
        .map((item) => ({ ...item, ...this.itemOverrides[item.id] })),
      ...this.customItems,
    ];
  }
  get catalogCategories() {
    return [...DEFAULT_CATEGORIES, ...this.customCategories].filter(
      (category) =>
        !this.deletedCategories.some(
          (deleted) =>
            normalizeCategoryName(deleted) === normalizeCategoryName(category),
        ),
    );
  }
  getEntryDuration(entry) {
    if (entry.item?.kind !== "stay") return 1;
    const periodStart = Number(entry.period?.startDay);
    const periodEnd = Number(entry.period?.endDay);
    if (
      Number.isInteger(periodStart) &&
      Number.isInteger(periodEnd) &&
      periodStart >= 1 &&
      periodEnd >= periodStart
    ) {
      return Math.max(
        1,
        Math.min(periodEnd, this.dayCount) - Math.min(periodStart, this.dayCount) + 1,
      );
    }
    const requested = Math.max(
      1,
      Math.trunc(Number(entry.item.durationDays) || 1),
    );
    return Math.max(1, Math.min(requested, this.dayCount - entry.day + 1));
  }
  getPlannedCost(item, durationDays = 1) {
    const perPerson = Boolean(
      item.perPerson ||
      item.priceMode === "perPerson" ||
      item.priceMode === "perPersonDay",
    );
    const peopleMultiplier = perPerson ? this.travelers : 1;
    if (item.dailyRate != null)
      return item.dailyRate * durationDays * peopleMultiplier;
    if (item.price == null) return null;
    return item.price * peopleMultiplier;
  }
  get plannedTotal() {
    return this.getEntryItems().reduce(
      (sum, entry) =>
        sum + (this.getPlannedCost(entry.item, entry.durationDays) ?? 0),
      0,
    );
  }
  get knownExpenseCount() {
    return this.getEntryItems().filter(
      (entry) => entry.item.price == null && entry.item.dailyRate == null,
    ).length;
  }
  get totalBudget() {
    return (
      this.plannedTotal +
      this.customCosts.reduce((sum, item) => sum + item.amount, 0)
    );
  }
  get groupedByDay() {
    const grouped = Array.from({ length: this.dayCount }, (_, index) => ({
      day: index + 1,
      entries: [],
    }));
    for (const entry of this.getEntryItems()) {
      const periodStart = Number(entry.period?.startDay);
      const periodEnd = Number(entry.period?.endDay);
      const hasPeriod =
        Number.isInteger(periodStart) &&
        Number.isInteger(periodEnd) &&
        periodStart >= 1 &&
        periodEnd >= periodStart;
      const firstDay = hasPeriod
        ? Math.min(periodStart, this.dayCount)
        : entry.day;
      const lastDay = hasPeriod
        ? Math.min(periodEnd, this.dayCount)
        : firstDay + (entry.item.kind === "stay" ? entry.durationDays : 1) - 1;
      for (let displayDay = firstDay; displayDay <= lastDay; displayDay += 1) {
        grouped[displayDay - 1]?.entries.push({
          ...entry,
          displayDay,
          dayOffset: displayDay - entry.day,
          periodOffset: displayDay - firstDay,
        });
      }
    }
    return grouped;
  }
}

const TripStoreContext = createContext(null);
const tripStore = new TripStore();
export const TripProvider = ({ children }) => (
  <TripStoreContext.Provider value={tripStore}>
    {children}
  </TripStoreContext.Provider>
);
export const useTripStore = () => useContext(TripStoreContext);
