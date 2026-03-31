export const skinTypes = ["Сухая", "Жирная", "Комби", "Чувствительная"];

export const initialProducts = [
  {
    id: 1,
    name: "Мягкое очищение",
    schedule: "Ежедневно, Утро/Вечер",
    icon: "drop",
    color: "blue",
  },
  {
    id: 2,
    name: "Сыворотка BHA 2%",
    schedule: "Ежедневно, Вечер",
    icon: "tube",
    color: "rose",
  },
  {
    id: 3,
    name: "Базовый крем с керамидами",
    schedule: "Ежедневно, После очищения",
    icon: "spark",
    color: "emerald",
  },
];

export const symptomsCatalog = [
  { id: "redness", label: "Покраснение", tone: "rose" },
  { id: "acne", label: "Акне", tone: "neutral" },
  { id: "dryness", label: "Сухость", tone: "amber" },
  { id: "flaking", label: "Шелушение", tone: "neutral" },
  { id: "tightness", label: "Стянутость", tone: "blue" },
];

export const historyItems = [
  {
    id: 1,
    date: "29 марта",
    risk: "Средний",
    note: "Снижена частота кислот, кожа стала спокойнее.",
  },
  {
    id: 2,
    date: "24 марта",
    risk: "Высокий",
    note: "Подозрение на перегрузку активами и ослабление барьера.",
  },
];

export const recoveryDays = [
  { day: "Пн", level: 30, state: "rose" },
  { day: "Вт", level: 40, state: "rose" },
  { day: "Ср", level: 60, state: "amber" },
  { day: "Чт", level: 75, state: "emerald", current: true },
  { day: "Пт", level: 20, state: "future" },
  { day: "Сб", level: 20, state: "future" },
  { day: "Вс", level: 20, state: "future" },
];
