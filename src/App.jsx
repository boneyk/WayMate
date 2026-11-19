import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CompassOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  HeartFilled,
  HeartOutlined,
  HomeOutlined,
  InboxOutlined,
  PlusOutlined,
  CloudOutlined,
  RollbackOutlined,
  SettingOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Tooltip,
  message,
} from "antd";
import { useTripStore } from "./store/TripStore.jsx";
import waymateLogo from "./assets/WayMate_logo.png";

const rubles = (amount) => `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
const tripStartTimestamp = Date.UTC(2027, 1, 22);
const tripDate = (day, includeYear = false) => {
  const date = new Date(tripStartTimestamp + (Number(day) - 1) * 24 * 60 * 60 * 1000);
  const dayMonth = `${String(date.getUTCDate()).padStart(2, "0")}.${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  return includeYear ? `${dayMonth}.${date.getUTCFullYear()}` : dayMonth;
};
const tripDateRange = (dayCount) => `${tripDate(1, true)}–${tripDate(dayCount, true)}`;
const plural = (count, one, few, many) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};
const formatCalendarDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
};
const formatDatePeriod = (period) => {
  if (period?.startDay != null && period?.endDay != null) {
    const startDay = String(period.startDay).padStart(2, "0");
    const endDay = String(period.endDay).padStart(2, "0");
    return startDay === endDay ? `День ${startDay}` : `Дни ${startDay}–${endDay}`;
  }
  if (!period?.start || !period?.end) return "";
  const start = formatCalendarDate(period.start);
  const end = formatCalendarDate(period.end);
  return start === end ? start : `${start} — ${end}`;
};
const navItems = [
  {
    to: "/plan",
    label: "План поездки",
    icon: <CalendarOutlined />,
    count: (store) => store.itinerary.length,
  },
  {
    to: "/approval",
    label: "Согласование",
    icon: <CheckCircleOutlined />,
    count: (store) => store.proposals.length,
  },
  { to: "/budget", label: "Бюджет поездки", icon: <WalletOutlined /> },
  { to: "/catalog", label: "Каталог", icon: <AppstoreOutlined /> },
];

function Sidebar({ store }) {
  return (
    <aside className="sidebar">
      <Link className="brand" to="/plan" aria-label="Waymate, на главную">
        <span className="brand-mark">
          <img src={waymateLogo} alt="" />
        </span>
        <span className="brand-name">
          Way<span>mate</span>
        </span>
      </Link>
      <div className="trip-selector">
        <span className="trip-selector-icon">
          <CloudOutlined />
        </span>
        <span className="trip-selector-copy">
          <small>МОЯ ПОЕЗДКА</small>
          <strong>Сахалин зимой</strong>
        </span>
      </div>
      <div className="side-label">ПРОСТРАНСТВО</div>
      <nav className="side-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.count && (
              <span className="nav-count">{item.count(store) || ""}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note-art">
          <span />
          <span />
          <span />
        </div>
        <div className="sidebar-note">
          <span className="side-label">ВАШИ ДАТЫ</span>
          <strong>Февраль 2027</strong>
          <span className="date-muted">{tripDateRange(store.dayCount)}</span>
        </div>
      </div>
    </aside>
  );
}

function PageHeading({ eyebrow, title, subtitle, action, className = "" }) {
  return (
    <div className={`page-heading ${className}`}>
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function MountainArt() {
  return (
    <svg
      className="hero-art"
      viewBox="0 0 700 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#173c42" />
          <stop offset="1" stopColor="#305d56" />
        </linearGradient>
        <linearGradient id="mountain" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#d9ded1" />
          <stop offset="1" stopColor="#8fa89b" />
        </linearGradient>
        <linearGradient id="hill" x1="0" x2="1">
          <stop stopColor="#284c45" />
          <stop offset="1" stopColor="#172f32" />
        </linearGradient>
      </defs>
      <rect width="700" height="300" fill="url(#sky)" />
      <circle cx="535" cy="58" r="29" fill="#ead9a8" opacity=".88" />
      <path
        d="M0 216 140 76l62 69L315 35l176 186L582 108l118 112v80H0Z"
        fill="url(#mountain)"
        opacity=".94"
      />
      <path
        d="m272 79 43-44 55 58-38-18-20 11-16-13-20 6ZM112 104l28-28 43 47-31-16-13 10-13-12Z"
        fill="#f4f2e9"
        opacity=".95"
      />
      <path d="M0 227q111-61 233-5t234 0 233-7v85H0Z" fill="url(#hill)" />
      <path
        d="M0 255q128-39 260 0t246-3 194-1v49H0Z"
        fill="#142b30"
        opacity=".72"
      />
      <path
        d="m443 225 22-45 21 45Zm33 4 29-58 28 58Zm-366 12 18-39 18 39Zm31 5 24-47 24 47Z"
        fill="#e4eadf"
        opacity=".82"
      />
      <g fill="#203c36">
        <path d="m65 242 15-45 14 45Zm-10 4 25-5 24 7Z" />
        <path d="m605 231 17-54 18 54Zm-12 5 29-7 22 10Z" />
        <path d="m650 249 13-42 13 42Z" />
      </g>
      <g fill="#f3e5bd" opacity=".55">
        <circle cx="110" cy="43" r="2" />
        <circle cx="160" cy="61" r="1.5" />
        <circle cx="403" cy="47" r="2" />
        <circle cx="591" cy="96" r="1.7" />
        <circle cx="640" cy="44" r="1.5" />
      </g>
    </svg>
  );
}

function TripHero({ store }) {
  return (
    <section className="trip-hero">
      <MountainArt />
      <div className="hero-grain" />
      <div className="hero-content">
        <div className="hero-topline">
          <span>
            <CloudOutlined /> ЗИМНЕЕ ПУТЕШЕСТВИЕ
          </span>
          <span className="draft-badge">
            <i /> ЧЕРНОВИК
          </span>
        </div>
        <h2>
          Сахалин,
          <br />
          <em>будет красиво.</em>
        </h2>
        <div className="hero-meta">
          <span>
            <CalendarOutlined /> Даты уточняются
          </span>
          <span>
            <TeamOutlined /> {store.travelers}{" "}
            {plural(store.travelers, "человек", "человека", "человек")}
          </span>
        </div>
      </div>
      <div className="hero-index">
        <span>НАШ МАРШРУТ</span>
        <strong>
          {String(store.itinerary.length).padStart(2, "0")}
          <small> / {String(store.dayCount).padStart(2, "0")}</small>
        </strong>
      </div>
      <span className="hero-caption">ОСТРОВ НА КРАЮ СВЕТА · 2027</span>
    </section>
  );
}

function StatCard({ icon, label, value, note, variant = "" }) {
  return (
    <div className={`stat-card ${variant}`}>
      <span className="stat-icon">{icon}</span>
      <div>
        <span className="stat-label">{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}

function AddToPlanModal({ item, open, onClose, initialDay = 1 }) {
  const store = useTripStore();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const maxStartDay = store.dayCount;
  const choosePeriod = Form.useWatch("choosePeriod", form) ?? false;
  const periodStartDay = Form.useWatch("periodStartDay", form);
  const periodEndDay = Form.useWatch("periodEndDay", form);
  const selectedDayField = Form.useWatch("day", form);
  const selectedDay = choosePeriod
    ? periodStartDay ?? Math.min(initialDay, maxStartDay)
    : selectedDayField ?? Math.min(initialDay, maxStartDay);
  const plannedStayDays = item.kind === "stay"
    ? Math.min(item.durationDays || 1, store.dayCount - selectedDay + 1)
    : 0;
  const handleAdd = async () => {
    try {
      const {
        choosePeriod: usePeriod,
        periodStartDay: selectedPeriodStart,
        periodEndDay: selectedPeriodEnd,
      } = form.getFieldsValue();
      if (
        usePeriod &&
        (selectedPeriodStart == null || selectedPeriodEnd == null || selectedPeriodEnd < selectedPeriodStart)
      ) {
        messageApi.error("Укажите начало и конец периода дней");
        return;
      }
      const { approvedBy } = await form.validateFields();
      const day = usePeriod ? Number(selectedPeriodStart) : form.getFieldValue("day");
      const period = usePeriod
        ? { startDay: Number(selectedPeriodStart), endDay: Number(selectedPeriodEnd) }
        : null;
      const result = store.proposeItem(item.id, day, approvedBy, period);
      messageApi.success(
        result === "approved"
          ? "Все участники согласны — добавлено в план"
          : "Идея отправлена на согласование",
      );
      form.resetFields();
      onClose();
    } catch {
      /* Keep the dialog open when validation fails. */
    }
  };
  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={450}
        className="trip-modal"
        destroyOnClose
      >
        <div className="modal-kicker">
          <CheckOutlined /> СОВМЕСТНЫЙ ВЫБОР
        </div>
        <h2>Добавить в план?</h2>
        <p className="modal-copy">
          Отметьте тех, кто уже согласен. Если проголосуют все, идея сразу попадёт в план; иначе её можно будет согласовать во вкладке «Согласование».
        </p>
        {item.kind === "stay" && (
          <p className="stay-duration-hint">
            Проживание займёт {plannedStayDays}{" "}
            {plural(plannedStayDays, "день", "дня", "дней")} в плане.
          </p>
        )}
        <Form
          form={form}
          layout="vertical"
          initialValues={{ day: Math.min(initialDay, maxStartDay), choosePeriod: false }}
        >
          <Form.Item name="choosePeriod" valuePropName="checked" className="period-toggle">
            <Checkbox>Выбрать период</Checkbox>
          </Form.Item>
          {choosePeriod ? (
            <div className="form-two">
              <Form.Item name="periodStartDay" label="С какого дня?" preserve={false}>
                <Select
                  options={Array.from({ length: store.dayCount }, (_, index) => ({
                    value: index + 1,
                    label: `День ${String(index + 1).padStart(2, "0")}`,
                  }))}
                  onChange={(startDay) => {
                    if (periodEndDay != null && periodEndDay < startDay) {
                      form.setFieldValue("periodEndDay", undefined);
                    }
                  }}
                />
              </Form.Item>
              <Form.Item name="periodEndDay" label="По какой день?" preserve={false}>
                <Select
                  options={Array.from({ length: store.dayCount }, (_, index) => ({
                    value: index + 1,
                    label: `День ${String(index + 1).padStart(2, "0")}`,
                    disabled: periodStartDay != null && index + 1 < periodStartDay,
                  }))}
                />
              </Form.Item>
            </div>
          ) : (
            <Form.Item
              name="day"
              label="В какой день?"
              preserve={false}
              rules={[{ required: true }]}
            >
              <Select
                options={Array.from({ length: maxStartDay }, (_, index) => ({
                  value: index + 1,
                  label: `День ${String(index + 1).padStart(2, "0")}`,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item
            name="approvedBy"
            label="Кто уже согласен?"
            rules={[
              { required: true, message: "Отметьте хотя бы одного участника" },
            ]}
          >
            <Checkbox.Group
              className="approval-checkbox-group"
              options={store.participants.map((participant) => ({
                label: participant.name,
                value: participant.id,
              }))}
            />
          </Form.Item>
          <div className="modal-actions">
            <Button onClick={onClose}>Пока оставить</Button>
            <Button type="primary" icon={<CheckOutlined />} onClick={handleAdd}>
              Подтвердить выбор
            </Button>
          </div>
        </Form>
        <div className="modal-assurance">
          <HeartOutlined /> В любой момент можно изменить план
        </div>
      </Modal>
    </>
  );
}

function PlannedEntry({ entry, store }) {
  const item = entry.item;
  const cost = store.getPlannedCost(item, entry.durationDays);
  const hasPeriod =
    entry.period?.startDay != null &&
    entry.period?.endDay != null &&
    Number.isInteger(Number(entry.period?.startDay)) &&
    Number.isInteger(Number(entry.period?.endDay)) &&
    Number(entry.period.startDay) >= 1 &&
    Number(entry.period.endDay) >= Number(entry.period.startDay);
  const isPeriodContinuation =
    hasPeriod && entry.displayDay > Number(entry.period.startDay);
  const costLabel =
    item.kind === "stay" && item.dailyRate != null
      ? `${rubles(item.dailyRate * (item.perPerson ? store.travelers : 1))} / день`
      : (item.kind === "stay" && entry.dayOffset > 0) || isPeriodContinuation
        ? "Включено"
        : cost == null
          ? "уточнить"
          : rubles(cost);
  return (
    <div className="planned-entry">
      <span className={`entry-type ${item.kind}`}>
        {item.kind === "stay" ? (
          <HomeOutlined />
        ) : item.kind === "activity" ? (
          <CloudOutlined />
        ) : (
          <CompassOutlined />
        )}
      </span>
      <span className="entry-copy">
        <strong>{item.title}</strong>
        <small>
          {item.kind === "stay"
            ? `${item.place} · день ${(hasPeriod ? entry.periodOffset : entry.dayOffset) + 1} из ${entry.durationDays}`
            : hasPeriod
              ? `${item.place} · день ${entry.periodOffset + 1} из ${Number(entry.period.endDay) - Number(entry.period.startDay) + 1}`
              : item.place}
        </small>
      </span>
      <span className="entry-cost">
        {costLabel === "уточнить" ? <em>{costLabel}</em> : costLabel}
      </span>
      <Popconfirm
        title="Вы действительно хотите удалить?"
        okText="Да"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
        onConfirm={() => store.removeFromPlan(entry.id)}
      >
        <Button
          type="text"
          className="remove-entry"
          icon={<DeleteOutlined />}
          aria-label={`Убрать ${item.title}`}
        />
      </Popconfirm>
    </div>
  );
}

function PlanPage() {
  const store = useTripStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const quickIdeas = ["dog-sleds", "snowmobiles", "ski-rental"]
    .map((id) => store.catalogItems.find((item) => item.id === id))
    .filter(Boolean);
  return (
    <>
      <PageHeading
        eyebrow="ВАША ПОЕЗДКА · ФЕВРАЛЬ 2027"
        title="План поездки"
        subtitle="Собирайте маршрут по дням — только из того, о чём договорились вместе."
        action={
          <div className="heading-actions">
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsOpen(true)}
            >
              Настроить поездку
            </Button>
            <Link to="/catalog">
              <Button className="heading-action" icon={<PlusOutlined />}>
                Найти впечатление
              </Button>
            </Link>
          </div>
        }
      />
      <TripHero store={store} />
      <div className="stats-grid">
        <StatCard
          icon={<CalendarOutlined />}
          label="В маршруте"
          value={`${store.itinerary.length} ${plural(store.itinerary.length, "пункт", "пункта", "пунктов")}`}
          note="Выбранных вами вместе"
        />
        <StatCard
          icon={<WalletOutlined />}
          label="Бюджет выбора"
          value={rubles(store.totalBudget)}
          note="Только то, что уже добавили"
          variant="stat-green"
        />
        <StatCard
          icon={<TeamOutlined />}
          label="Путешественники"
          value={`${store.travelers} ${plural(store.travelers, "человек", "человека", "человек")}`}
          note="Учитывается в общем бюджете"
        />
      </div>
      <div className="plan-columns">
        <section className="day-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">ПО ПОРЯДКУ</span>
              <h2>Наши дни</h2>
            </div>
            <span className="day-count">
              {store.dayCount} {plural(store.dayCount, "день", "дня", "дней")} ·
              {tripDate(1)}–{tripDate(store.dayCount)}
            </span>
          </div>
          <div className="day-list">
            {store.groupedByDay.map(({ day, entries }) => (
              <article
                className={`day-row ${entries.length ? "has-items" : ""}`}
                key={day}
              >
                <div className="day-stamp">
                  <span>ДЕНЬ</span>
                  <strong>{String(day).padStart(2, "0")}</strong>
                  <small>{tripDate(day)}</small>
                </div>
                <div className="day-card">
                  {entries.length ? (
                    <div className="day-entries">
                      {entries.map((entry) => (
                        <PlannedEntry
                          key={entry.id}
                          entry={entry}
                          store={store}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="day-empty">
                      <span className="empty-sparkle">✳</span>
                      <span>
                        <strong>Этот день пока свободен</strong>
                        <small>Добавьте то, что выбрали вместе</small>
                      </span>
                      <Link to="/catalog" state={{ day }} className="empty-add">
                        Добавить <ArrowRightOutlined />
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="plan-aside">
          <div className="aside-card invite-card">
            <span className="aside-icon">
              <HeartOutlined />
            </span>
            <span className="section-kicker">СНАЧАЛА ВДВОЁМ</span>
            <h3>Выбираем, потом планируем</h3>
            <p>
              Добавляйте активности в маршрут, только когда оба скажете «да».
            </p>
            <Link to="/catalog" className="text-link">
              Открыть каталог <ArrowRightOutlined />
            </Link>
          </div>
          <div className="aside-card ideas-card">
            <div className="ideas-header">
              <div>
                <span className="section-kicker">ИДЕИ ИЗ ЗАМЕТОК</span>
                <h3>Чем заняться</h3>
              </div>
              <Link to="/catalog">
                Все <ExportOutlined />
              </Link>
            </div>
            {quickIdeas.map((item, index) => (
              <div className="idea-row" key={item.id}>
                <span className={`idea-illustration idea-${index}`}>
                  <span>{index === 0 ? "🐕" : index === 1 ? "🏔" : "🎿"}</span>
                </span>
                <span className="idea-copy">
                  <strong>{item.title}</strong>
                  <small>{item.priceLabel}</small>
                </span>
                <ArrowRightOutlined className="idea-arrow" />
              </div>
            ))}
            <Link className="all-ideas" to="/catalog">
              В каталог впечатлений <ArrowRightOutlined />
            </Link>
          </div>
          <div className="mini-note">
            <span className="note-pip" />
            <span>
              <strong>Хороший план начинается с пауз</strong>
              <small>Не нужно заполнять каждый день</small>
            </span>
          </div>
        </aside>
      </div>
      {settingsOpen && (
        <TripSettingsModal open onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}

function TripSettingsModal({ open, onClose }) {
  const store = useTripStore();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const participantCount = Form.useWatch("travelers", form) ?? store.travelers;
  const initialValues = {
    dayCount: store.dayCount,
    travelers: store.travelers,
    participantNames: store.participants.map((participant) => participant.name),
  };
  const handleTravelerCountChange = (count) => {
    if (!count) return;
    const currentNames = form.getFieldValue("participantNames") || [];
    form.setFieldsValue({
      participantNames: Array.from(
        { length: count },
        (_, index) =>
          currentNames[index] ??
          store.participants[index]?.name ??
          `Участник ${index + 1}`,
      ),
    });
  };
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const names = values.participantNames.map((name) => name.trim());
      if (
        new Set(names.map((name) => name.toLocaleLowerCase("ru"))).size !==
        names.length
      ) {
        messageApi.error("Имена участников должны отличаться");
        return;
      }
      store.setTripSettings(values.dayCount, values.travelers, names);
      messageApi.success("Параметры поездки сохранены");
      onClose();
    } catch {
      /* Keep the dialog open when validation fails. */
    }
  };
  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={460}
        className="trip-modal"
        destroyOnClose
      >
        <div className="modal-kicker">
          <SettingOutlined /> ПАРАМЕТРЫ ПОЕЗДКИ
        </div>
        <h2>Настроить поездку</h2>
        <p className="modal-copy">
          Укажите длительность и сколько человек поедет. Расходы на человека
          пересчитаются автоматически.
        </p>
        <Form form={form} layout="vertical" initialValues={initialValues}>
          <Form.Item
            label="Длительность поездки, дней"
            name="dayCount"
            rules={[{ required: true, message: "Укажите количество дней" }]}
          >
            <InputNumber
              min={1}
              max={30}
              precision={0}
              className="full-control"
            />
          </Form.Item>
          <Form.Item
            label="Путешественников"
            name="travelers"
            rules={[
              {
                required: true,
                message: "Укажите количество путешественников",
              },
            ]}
          >
            <InputNumber
              min={1}
              max={20}
              precision={0}
              className="full-control"
              onChange={handleTravelerCountChange}
            />
          </Form.Item>
          {Array.from({ length: participantCount }, (_, index) => (
            <Form.Item
              key={index}
              label={`Имя участника ${index + 1}`}
              name={["participantNames", index]}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Укажите имя участника",
                },
              ]}
            >
              <Input maxLength={35} placeholder={`Участник ${index + 1}`} />
            </Form.Item>
          ))}
          <div className="modal-actions">
            <Button onClick={onClose}>Отмена</Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSave}
            >
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

function BudgetPage() {
  const store = useTripStore();
  const [modalOpen, setModalOpen] = useState(false);
  const entries = store.getEntryItems();
  const grouped = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      const { item } = entry;
      const key = item.category;
      if (!map.has(key))
        map.set(key, { name: key, total: 0, count: 0, unknown: 0 });
      const section = map.get(key);
      const cost = store.getPlannedCost(item, entry.durationDays);
      section.count += 1;
      if (cost == null) section.unknown += 1;
      else section.total += cost;
    });
    return [...map.values()];
  }, [entries, store]);
  return (
    <>
      <PageHeading
        eyebrow="ПЛАНИРУЕМ БЕЗ СЮРПРИЗОВ"
        title="Бюджет поездки"
        subtitle="Расходы выбранных активностей плюс ваши дополнительные заметки."
        action={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Добавить расход
          </Button>
        }
      />
      <section className="budget-hero">
        <div className="budget-hero-copy">
          <span className="section-kicker">
            ОБЩИЙ ОРИЕНТИР · НА {store.travelers}{" "}
            {plural(store.travelers, "человека", "человека", "человек")}
          </span>
          <div className="budget-total">{rubles(store.totalBudget)}</div>
          <p>Сумма выбранного маршрута и добавленных расходов</p>
        </div>
        <div className="budget-hero-stamp">
          <span>
            <WalletOutlined />
          </span>
          <small>
            ФЕВРАЛЬ
            <br />
            2027
          </small>
        </div>
        <div className="budget-bubbles">
          <i />
          <i />
          <i />
        </div>
      </section>
      <div className="stats-grid budget-stats">
        <StatCard
          icon={<CheckOutlined />}
          label="С ценой"
          value={rubles(
            store.plannedTotal +
              store.customCosts.reduce((sum, item) => sum + item.amount, 0),
          )}
          note="Добавлено в поездку"
        />
        <StatCard
          icon={<ClockCircleOutlined />}
          label="Нужно уточнить"
          value={`${store.knownExpenseCount} ${plural(store.knownExpenseCount, "позиция", "позиции", "позиций")}`}
          note="Пока без стоимости в заметках"
          variant="stat-amber"
        />
        <StatCard
          icon={<TeamOutlined />}
          label="На одного"
          value={rubles(store.totalBudget / store.travelers)}
          note="Среднее на путешественника"
          variant="stat-green"
        />
      </div>
      <div className="budget-layout">
        <section className="budget-card">
          <div className="section-heading">
            <div>
              <span className="section-kicker">СОГЛАСОВАННЫЙ МАРШРУТ</span>
              <h2>Расходы поездки</h2>
            </div>
            <span className="day-count">
              {entries.length + store.customCosts.length}{" "}
              {plural(
                entries.length + store.customCosts.length,
                "позиция",
                "позиции",
                "позиций",
              )}
            </span>
          </div>
          {!entries.length && !store.customCosts.length ? (
            <div className="budget-empty">
              <span className="empty-ring">
                <WalletOutlined />
              </span>
              <h3>Пока нечего считать</h3>
              <p>
                Добавьте в план совместно выбранные активности — их стоимость
                появится здесь.
              </p>
              <Link to="/catalog">
                <Button type="primary" icon={<ArrowRightOutlined />}>
                  Перейти в каталог
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="budget-table-head">
                <span>РАСХОД</span>
                <span>ДЕНЬ / ТИП</span>
                <span>СУММА</span>
                <span />
              </div>
              {entries.map((entry) => (
                <div className="budget-line" key={entry.id}>
                  <span className="budget-line-icon">
                    <EnvironmentOutlined />
                  </span>
                  <strong>
                    {entry.item.title}
                    <small>{entry.item.place}</small>
                  </strong>
                  <span className="budget-line-tag">
                    {entry.item.kind === "stay"
                      ? `Дни ${String(entry.day).padStart(2, "0")}–${String(entry.day + entry.durationDays - 1).padStart(2, "0")}`
                      : `День ${String(entry.day).padStart(2, "0")}`}
                  </span>
                  <span className="budget-line-amount">
                    {store.getPlannedCost(entry.item, entry.durationDays) ==
                    null ? (
                      <em>уточнить</em>
                    ) : (
                      rubles(
                        store.getPlannedCost(entry.item, entry.durationDays),
                      )
                    )}
                  </span>
                  <Popconfirm
                    title="Вы действительно хотите удалить?"
                    okText="Да"
                    cancelText="Отмена"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => store.removeFromPlan(entry.id)}
                  >
                    <Button type="text" icon={<DeleteOutlined />} aria-label="Убрать из плана" />
                  </Popconfirm>{" "}
                </div>
              ))}
              {store.customCosts.map((cost) => (
                <div className="budget-line" key={cost.id}>
                  <span className="budget-line-icon custom">
                    <WalletOutlined />
                  </span>
                  <strong>
                    {cost.title}
                    <small>{cost.category}</small>
                  </strong>
                  <span className="budget-line-tag">Доп. расход</span>
                  <span className="budget-line-amount">
                    {rubles(cost.amount)}
                  </span>
                  <Popconfirm
                    title="Вы действительно хотите удалить?"
                    okText="Да"
                    cancelText="Отмена"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => store.removeCustomCost(cost.id)}
                  >
                    <Button type="text" icon={<DeleteOutlined />} aria-label="Удалить расход" />
                  </Popconfirm>{" "}
                </div>
              ))}
              <div className="budget-subtotal">
                <span>Итого с известной стоимостью</span>
                <strong>{rubles(store.totalBudget)}</strong>
              </div>
            </>
          )}
        </section>
        <aside className="budget-aside">
          <section className="budget-card breakdown-card">
            <span className="section-kicker">ПО КАТЕГОРИЯМ</span>
            <h3>На что уходит</h3>
            {grouped.length ? (
              grouped.map((section) => (
                <div className="breakdown-row" key={section.name}>
                  <span className="breakdown-dot" />
                  <span>
                    {section.name}
                    {section.unknown > 0 && <small> · цена уточняется</small>}
                  </span>
                  <strong>{rubles(section.total)}</strong>
                </div>
              ))
            ) : (
              <div className="breakdown-empty">
                Категории появятся, когда заполнится план.
              </div>
            )}
            {store.customCosts.length > 0 && (
              <div className="breakdown-row">
                <span className="breakdown-dot custom-dot" />
                <span>Дополнительные расходы</span>
                <strong>
                  {rubles(
                    store.customCosts.reduce(
                      (sum, item) => sum + item.amount,
                      0,
                    ),
                  )}
                </strong>
              </div>
            )}
          </section>
          <section className="budget-card reminder-card">
            <span className="reminder-mark">i</span>
            <div>
              <strong>Цены — ориентиры</strong>
              <p>
                Это суммы из ваших заметок. Проверьте стоимость и условия у
                организаторов перед бронированием.
              </p>
            </div>
          </section>
          <section className="budget-card note-costs">
            <span className="section-kicker">ЕЩЁ НЕ В ПЛАНЕ</span>
            <h3>Ориентиры из каталога</h3>
            <p>
              Эти суммы станут частью бюджета только после вашего общего выбора.
            </p>
            <Link to="/catalog">
              Посмотреть варианты <ArrowRightOutlined />
            </Link>
          </section>
        </aside>
      </div>
      <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

function AddExpenseModal({ open, onClose }) {
  const store = useTripStore();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      store.addCustomCost(
        values.title,
        values.amount,
        values.category || "Другое",
      );
      messageApi.success("Расход добавлен");
      form.resetFields();
      onClose();
    } catch {
      /* Keep the dialog open when validation fails. */
    }
  };
  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={460}
        className="trip-modal"
        destroyOnClose
      >
        <div className="modal-kicker">
          <WalletOutlined /> В БЮДЖЕТ ПОЕЗДКИ
        </div>
        <h2>Новый расход</h2>
        <p className="modal-copy">
          Добавьте стоимость билетов, дороги или любого другого расхода.
        </p>
        <Form form={form} layout="vertical">
          <Form.Item
            label="На что расход?"
            name="title"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input placeholder="Например, билеты на самолёт" maxLength={60} />
          </Form.Item>
          <div className="form-two">
            <Form.Item
              label="Общая сумма на поездку"
              name="amount"
              rules={[{ required: true, message: "Укажите сумму" }]}
            >
              <InputNumber
                min={0}
                precision={0}
                addonAfter="₽"
                placeholder="0"
                className="full-control"
              />
            </Form.Item>
            <Form.Item label="Категория" name="category" initialValue="Другое">
              <Select
                options={[
                  "Дорога",
                  "Размещение",
                  "Еда",
                  "Активности",
                  "Другое",
                ].map((name) => ({ value: name, label: name }))}
              />
            </Form.Item>
          </div>
          <div className="modal-actions">
            <Button onClick={onClose}>Отмена</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleSave}>
              Добавить расход
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

function ApprovalPage() {
  const store = useTripStore();
  const proposals = store.getProposalItems();
  return (
    <>
      <PageHeading
        eyebrow="ОБЩИЙ ВЫБОР УЧАСТНИКОВ"
        title="Согласование"
        subtitle="Здесь собраны идеи, которым ещё нужны голоса. Каждый вариант и выбранный для него день согласуются отдельно."
        action={
          <Link to="/catalog">
            <Button type="primary" icon={<PlusOutlined />}>
              Предложить идею
            </Button>
          </Link>
        }
      />
      <section className="approval-summary">
        <span className="approval-summary-icon">
          <CheckCircleOutlined />
        </span>
        <div>
          <strong>
            {proposals.length}{" "}
            {plural(proposals.length, "идея ждёт", "идеи ждут", "идей ждут")}
          </strong>
          <small>
            Когда все участники проголосуют «за», карточка появится в плане.
          </small>
        </div>
      </section>
      {proposals.length ? (
        <div className="approval-list">
          {proposals.map((proposal) => (
            <ApprovalCard key={proposal.id} proposal={proposal} store={store} />
          ))}
        </div>
      ) : (
        <section className="approval-empty">
          <span className="approval-empty-icon">
            <CheckCircleOutlined />
          </span>
          <h2>Пока всё согласовано</h2>
          <p>
            Предложите идею из каталога и отметьте, кто уже за неё проголосовал.
          </p>
          <Link to="/catalog">
            <Button type="primary" icon={<ArrowRightOutlined />}>
              Открыть каталог
            </Button>
          </Link>
        </section>
      )}
    </>
  );
}

function ApprovalCard({ proposal, store }) {
  const { item } = proposal;
  const durationDays = store.getEntryDuration({
    item,
    day: proposal.day,
    period: proposal.period,
  });
  const yesCount = store.participants.filter(
    (participant) => proposal.votes[participant.id],
  ).length;
  const lastDay = proposal.day + durationDays - 1;
  const cost = store.getPlannedCost(item, durationDays);
  return (
    <article className="approval-card">
      <div className="approval-card-top">
        <span className="approval-category">{item.category}</span>
        <div className="approval-schedule">
          <span className="approval-day">
            {proposal.period
              ? formatDatePeriod(proposal.period)
              : item.kind === "stay"
              ? `Дни ${String(proposal.day).padStart(2, "0")}–${String(lastDay).padStart(2, "0")}`
              : `День ${String(proposal.day).padStart(2, "0")}`}
          </span>
        </div>
        <Popconfirm
          title="Вы действительно хотите удалить?"
          okText="Да"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
          onConfirm={() => store.removeProposal(proposal.id)}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Удалить предложение «${item.title}»`}
            title="Удалить из согласования"
            className="approval-delete"
          />
        </Popconfirm>
      </div>
      <div className="approval-item-place">
        <EnvironmentOutlined /> {item.place}
      </div>
      <h2>{item.title}</h2>
      <p className="approval-description">{item.description}</p>
      <div className="approval-vote-header">
        <strong>Голоса участников</strong>
        <span>
          {yesCount} из {store.participants.length} «за»
        </span>
      </div>
      <div className="approval-voters">
        {store.participants.map((participant) => (
          <Checkbox
            key={participant.id}
            checked={Boolean(proposal.votes[participant.id])}
            onChange={(event) =>
              store.setProposalVote(
                proposal.id,
                participant.id,
                event.target.checked,
              )
            }
          >
            {participant.name}
          </Checkbox>
        ))}
      </div>
      <div className="approval-card-footer">
        <span>
          {item.dailyRate != null
            ? `${rubles(item.dailyRate)} / день${item.perPerson ? " с человека" : ""} · всего ${rubles(cost ?? 0)}`
            : cost == null
              ? "Стоимость уточняется"
              : rubles(cost)}
        </span>
        <span>
          {yesCount === store.participants.length
            ? "Все голоса собраны"
            : "Ожидаем согласия"}
        </span>
      </div>
    </article>
  );
}

function CatalogPage() {
  const store = useTripStore();
  const location = useLocation();
  const reservedFilters = ["все", "сохраненное", "архив"];
  const categories = [
    "Всё",
    ...store.catalogCategories.filter(
      (category) => !reservedFilters.includes(category.toLocaleLowerCase("ru").replace(/ё/g, "е")),
    ),
    "Сохранённое",
    "Архив",
  ];
  const [activeCategory, setActiveCategory] = useState("Всё");
  const [search, setSearch] = useState("");
  const [modalItem, setModalItem] = useState(null);
  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const items = store.catalogItems.filter((item) => {
    const isArchived = store.archivedItemIds.includes(item.id);
    const matchesCategory =
      activeCategory === "Архив"
        ? isArchived
        : !isArchived &&
          (activeCategory === "Всё" ||
            (activeCategory === "Сохранённое"
              ? store.savedItems.includes(item.id)
              : item.category === activeCategory));
    return (
      matchesCategory &&
      `${item.title} ${item.place} ${item.description}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  const plannedCounts = store.itinerary.reduce(
    (counts, entry) => ({
      ...counts,
      [entry.itemId]: (counts[entry.itemId] || 0) + 1,
    }),
    {},
  );
  const savedIds = store.savedItems;
  const preferredDay = location.state?.day;
  const handleArchive = (item) => {
    if (!store.archiveCatalogItem(item.id)) return;
    setSearch("");
    setActiveCategory("Архив");
    messageApi.success(`«${item.title}» перемещена в архив`);
  };
  const handleRemoveCategory = (category) => {
    const categoryItemCount = store.catalogItems.filter((item) => item.category === category).length;
    if (!store.removeCatalogCategory(category)) {
      messageApi.error("Не удалось удалить категорию");
      return;
    }
    if (activeCategory === category) setActiveCategory("Всё");
    messageApi.success(categoryItemCount
      ? `Категория удалена, ${categoryItemCount} ${plural(categoryItemCount, "карточка отправлена", "карточки отправлены", "карточек отправлено")} в архив`
      : "Категория удалена");
  };
  return (
    <>
      {contextHolder}
      <PageHeading
        className="catalog-page-heading"
        eyebrow="СОХРАНИТЕ ИДЕЮ ИЛИ ВЫБЕРИТЕ ВДВОЁМ"
        title="Каталог"
        subtitle={
          activeCategory === "Архив"
            ? "Идеи, скрытые из каталога. При необходимости их можно вернуть."
            : "Экскурсии, проживание и занятия, которые пока не вошли в маршрут."
        }
        action={
          <div className="heading-actions catalog-heading-actions">
            <Input
              allowClear
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              prefix={<span className="search-icon">⌕</span>}
              placeholder="Найти в заметках"
              className="catalog-search"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIdeaModalOpen(true)}
            >
              Добавить идею
            </Button>
          </div>
        }
      />
      <div className="catalog-banner">
        <div>
          <span className="section-kicker">
            {activeCategory === "Архив" ? "АРХИВ ИДЕЙ" : "ВАШ СПИСОК ИДЕЙ"}
          </span>
          <h2>
            От любопытства
            <br />
            до общего «да».
          </h2>
          <p>
            {activeCategory === "Архив"
              ? "Перемещённые идеи сохраняются здесь; при необходимости верните их в каталог."
              : "Сохраните понравившееся или добавьте в план то, что выбрали вместе."}
          </p>
        </div>
        <div className="catalog-art" aria-hidden="true">
          <span className="catalog-sun" />
          <span className="catalog-mountain catalog-mountain-a" />
          <span className="catalog-mountain catalog-mountain-b" />
          <span className="catalog-pine">♠</span>
          <span className="catalog-snow">✳　✳　✳</span>
        </div>
        <div className="catalog-banner-count">
          <strong>{items.length.toString().padStart(2, "0")}</strong>
          <span>
            {activeCategory === "Архив" ? "идей в архиве" : "идей для поездки"}
          </span>
        </div>
      </div>
      <div className="catalog-toolbar">
        <div className="catalog-filters">
          {categories.map((category) => {
            const categoryKey = category.toLocaleLowerCase("ru").replace(/ё/g, "е");
            const canDelete = !reservedFilters.includes(categoryKey);
            return (
              <div
                key={category}
                className={`filter-pill${activeCategory === category ? " selected" : ""}`}
              >
                <button
                  type="button"
                  className="filter-pill-select"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                  {category === "Всё" && (
                    <span className="filter-pill-count">
                      {store.catalogItems.filter((item) => !store.archivedItemIds.includes(item.id)).length}
                    </span>
                  )}
                  {category === "Архив" && (
                    <span className="filter-pill-count">
                      {store.catalogItems.filter((item) => store.archivedItemIds.includes(item.id)).length}
                    </span>
                  )}
                </button>
                {canDelete && (
                  <Tooltip title="Вы действительно хотите удалить?">
                    <span className="filter-pill-remove-tooltip">
                  <Popconfirm
                    title="Вы действительно хотите удалить?"
                    okText="Да"
                    cancelText="Отмена"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleRemoveCategory(category)}
                  >
                    <button
                      type="button"
                      className="filter-pill-remove"
                      aria-label={`Удалить категорию «${category}»`}
                    >
                      <CloseOutlined />
                    </button>
                  </Popconfirm>
                    </span>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
        <Button
          icon={<AppstoreOutlined />}
          className="catalog-category-button"
          onClick={() => setCategoryModalOpen(true)}
        >
          Новая категория
        </Button>
      </div>
      {items.length ? (
        <div className="catalog-grid">
          {items.map((item, index) => (
            <CatalogCard
              key={item.id}
              item={item}
              index={index}
              count={plannedCounts[item.id] || 0}
              saved={savedIds.includes(item.id)}
              travelers={store.travelers}
              archived={store.archivedItemIds.includes(item.id)}
              onAdd={() => setModalItem(item)}
              onSave={() =>
                savedIds.includes(item.id)
                  ? store.unsaveItem(item.id)
                  : store.saveItem(item.id)
              }
              onEdit={() => setEditingItem(item)}
              onArchive={() => handleArchive(item)}
              onRestore={() => store.restoreCatalogItem(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="catalog-no-results">
          <span>✳</span>
          <h3>
            {activeCategory === "Архив" && !search
              ? "Архив пока пуст"
              : "Ничего не нашлось"}
          </h3>
          <p>
            {activeCategory === "Архив" && !search
              ? "Перемещённые сюда идеи можно будет вернуть в каталог."
              : "Попробуйте изменить запрос или категорию."}
          </p>
        </div>
      )}
      {modalItem && (
        <AddToPlanModal
          key={`${modalItem.id}-${preferredDay ?? 1}`}
          item={modalItem}
          open
          onClose={() => setModalItem(null)}
          initialDay={preferredDay ?? 1}
        />
      )}
      {ideaModalOpen && (
        <CatalogItemModal
          open
          item={null}
          onCreated={(category) => {
            setActiveCategory(category);
            setSearch("");
          }}
          onClose={() => setIdeaModalOpen(false)}
        />
      )}
      {editingItem && (
        <CatalogItemModal
          open
          item={editingItem}
          onCreated={(category) => {
            setActiveCategory(category);
            setSearch("");
          }}
          onClose={() => setEditingItem(null)}
        />
      )}
      {categoryModalOpen && (
        <CategoryModal
          open
          onCreated={(category) => {
            setActiveCategory(category);
            setSearch("");
          }}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}
    </>
  );
}

function CatalogItemModal({ open, item, onClose, onCreated }) {
  const store = useTripStore();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const initialValues = {
    title: item?.title ?? "",
    category: item && store.catalogCategories.includes(item.category)
      ? item.category
      : store.catalogCategories[0] ?? "Экскурсии",
    place: item?.place ?? "",
    description: item?.description ?? "",
    price: item?.price ?? undefined,
    priceMode: item?.priceMode ?? "fixed",
    perPerson: item
      ? Boolean(item.perPerson || item.priceMode === "perPerson" || item.priceMode === "perPersonDay")
      : false,
    dailyRate: item?.dailyRate ?? undefined,
    durationDays: item?.durationDays ?? 1,
    url: item?.url ?? "",
  };
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (item) {
        store.updateCatalogItem(item.id, values);
        messageApi.success("Карточка обновлена");
      } else {
        store.addCustomIdea(values);
        messageApi.success("Идея добавлена в каталог");
      }
      onCreated?.(values.category);
      form.resetFields();
      onClose();
    } catch {
      /* Keep the dialog open when validation fails. */
    }
  };
  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={520}
        className="trip-modal"
        destroyOnClose
      >
        <div className="modal-kicker">
          <AppstoreOutlined /> КАТАЛОГ ПОЕЗДКИ
        </div>
        <h2>{item ? "Редактировать карточку" : "Добавить идею"}</h2>
        <Form form={form} layout="vertical" initialValues={initialValues}>
          <Form.Item
            label="Название"
            name="title"
            rules={[
              { required: true, whitespace: true, message: "Введите название" },
            ]}
          >
            <Input placeholder="Например, дом у моря" maxLength={70} />
          </Form.Item>
          <div className="form-two">
            <Form.Item
              label="Категория"
              name="category"
              rules={[{ required: true }]}
            >
              <Select
                options={store.catalogCategories.map((name) => ({
                  value: name,
                  label: name,
                }))}
              />
            </Form.Item>
            <Form.Item label="Место" name="place">
              <Input placeholder="Город или район" maxLength={50} />
            </Form.Item>
          </div>
          <Form.Item label="Описание" name="description">
            <Input.TextArea
              placeholder="Короткая заметка об этой идее"
              rows={2}
              maxLength={180}
            />
          </Form.Item>
          <Form.Item name="priceMode" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(previous, current) =>
              previous.category !== current.category
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("category") === "Размещение" ? (
                <>
                  <div className="form-two">
                    <Form.Item
                      label="Стоимость в день, ₽"
                      name="dailyRate"
                      preserve={false}
                    >
                      <InputNumber
                        min={0}
                        precision={0}
                        placeholder="Не указана"
                        className="full-control"
                      />
                    </Form.Item>
                    <Form.Item
                      label="Количество дней"
                      name="durationDays"
                      preserve={false}
                      rules={[
                        { required: true, message: "Укажите число дней" },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={30}
                        precision={0}
                        className="full-control"
                      />
                    </Form.Item>
                  </div>
                  <Form.Item label="Общая стоимость проживания, ₽" name="price">
                    <InputNumber
                      min={0}
                      precision={0}
                      placeholder="Если цена уже указана за всё проживание"
                      className="full-control"
                    />
                  </Form.Item>
                  <div className="form-hint">
                    Если указана стоимость в день, в бюджет попадёт ставка ×
                    количество дней. Общую сумму заполните, если дневной ставки
                    нет.
                  </div>
                </>
              ) : (
                <Form.Item label="Стоимость, ₽" name="price">
                  <InputNumber
                    min={0}
                    precision={0}
                    placeholder="Не указана"
                    className="full-control"
                  />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item name="perPerson" valuePropName="checked">
            <Checkbox>С человека</Checkbox>
          </Form.Item>
          <div className="form-hint">
            Сумма будет умножена на число участников при добавлении в план.
          </div>
          <Form.Item label="Ссылка" name="url">
            <Input placeholder="https://…" maxLength={300} />
          </Form.Item>
          <div className="modal-actions">
            <Button onClick={onClose}>Отмена</Button>
            <Button
              type="primary"
              icon={item ? <CheckOutlined /> : <PlusOutlined />}
              onClick={handleSave}
            >
              {item ? "Сохранить изменения" : "Сохранить идею"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

function CategoryModal({ open, onClose, onCreated }) {
  const store = useTripStore();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const handleSave = async () => {
    try {
      const { name } = await form.validateFields();
      if (!store.addCategory(name)) {
        messageApi.error("Такая категория уже существует");
        return;
      }
      messageApi.success("Категория создана");
      onCreated?.(name.trim());
      onClose();
    } catch {
      /* Keep the dialog open when validation fails. */
    }
  };
  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={420}
        className="trip-modal"
        destroyOnClose
      >
        <div className="modal-kicker">
          <AppstoreOutlined /> КАТЕГОРИИ
        </div>
        <h2>Новая категория</h2>
        <p className="modal-copy">
          Категория появится в фильтрах и в карточках каталога. Чтобы удалить её, нажмите × рядом с названием категории.
        </p>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Название категории"
            name="name"
            rules={[
              { required: true, whitespace: true, message: "Введите название" },
            ]}
          >
            <Input placeholder="Например, Еда" maxLength={32} />
          </Form.Item>
          <div className="modal-actions">
            <Button onClick={onClose}>Отмена</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleSave}>
              Создать категорию
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

function AddIdeaModal({ open, onClose, onCreated }) {
  const store = useTripStore();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      store.addCustomIdea(values);
      onCreated?.(values.category);
      messageApi.success("Идея добавлена в каталог");
      form.resetFields();
      onClose();
    } catch {
      /* Keep the dialog open when validation fails. */
    }
  };
  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={500}
        className="trip-modal"
        destroyOnClose
      >
        <div className="modal-kicker">
          <AppstoreOutlined /> ВАША ИДЕЯ
        </div>
        <h2>Добавить в каталог</h2>
        <p className="modal-copy">
          Сохраните интересное место или занятие. Оно появится среди вариантов и
          пока не попадёт в план поездки.
        </p>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ category: store.catalogCategories[0] ?? "Экскурсии" }}
        >
          <Form.Item
            label="Название идеи"
            name="title"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Введите название идеи",
              },
            ]}
          >
            <Input placeholder="Например, маяк Анива" maxLength={70} />
          </Form.Item>
          <div className="form-two">
            <Form.Item
              label="Категория"
              name="category"
              rules={[{ required: true }]}
            >
              <Select options={store.catalogCategories.map((name) => ({ value: name, label: name }))} />
            </Form.Item>
            <Form.Item label="Место" name="place">
              <Input placeholder="Город или район" maxLength={50} />
            </Form.Item>
          </div>
          <Form.Item label="Описание" name="description">
            <Input.TextArea
              placeholder="Что хочется запомнить об этой идее"
              rows={2}
              maxLength={180}
            />
          </Form.Item>
          <div className="form-two">
            <Form.Item label="Цена за позицию, ₽" name="price">
              <InputNumber
                min={0}
                precision={0}
                placeholder="Не указана"
                className="full-control"
              />
            </Form.Item>
            <Form.Item label="Ссылка" name="url">
              <Input placeholder="https://…" maxLength={300} />
            </Form.Item>
          </div>
          <div className="modal-actions">
            <Button onClick={onClose}>Отмена</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleSave}>
              Сохранить идею
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

function CatalogCard({
  item,
  index,
  count,
  saved,
  travelers = 1,
  archived = false,
  onAdd,
  onSave,
  onEdit,
  onArchive,
  onRestore,
}) {
  const theme =
    item.kind === "stay"
      ? "stay"
      : item.category === "Горы"
        ? "mountain"
        : index % 2 === 0
          ? "tour-a"
          : "tour-b";
  return (
    <article className="catalog-card">
      <div className={`catalog-card-art ${theme}`}>
        <div className="card-art-top">
          <span className="category-label">
            {item.category === "Размещение"
              ? "РАЗМЕЩЕНИЕ"
              : item.category.toUpperCase()}
          </span>
          {!archived && (
            <div className="card-art-actions">
              <button
                type="button"
                className={`save-button${saved ? " saved" : ""}`}
                onClick={onSave}
                aria-label={saved ? "Удалить из сохранённого" : "Сохранить идею"}
                title={saved ? "Удалить из сохранённого" : "Сохранить идею"}
              >
                {saved ? <HeartFilled /> : <HeartOutlined />}
              </button>
              <button
                type="button"
                className="card-action-button"
                onClick={onEdit}
                aria-label="Редактировать карточку"
                title="Редактировать"
              >
                <EditOutlined />
              </button>
              <Popconfirm
                title="Вы действительно хотите архивировать?"
                okText="Да"
                cancelText="Отмена"
                onConfirm={onArchive}
              >
                <button
                  type="button"
                  className="card-action-button archive"
                  aria-label="Переместить в архив"
                  title="В архив"
                >
                  <InboxOutlined />
                </button>
              </Popconfirm>
            </div>
          )}
        </div>
        <div className="card-art-figure">
          {item.kind === "stay" ? (
            <HomeOutlined />
          ) : item.id === "dog-sleds" ? (
            <span>🐕</span>
          ) : item.id === "snowmobiles" ? (
            <span>❄</span>
          ) : item.id === "icefalls" ? (
            <span>✳</span>
          ) : item.id === "ski-pass" ||
            item.id === "ski-rental" ||
            item.id === "ski-suit" ? (
            <span>⌁</span>
          ) : (
            <HomeOutlined />
          )}
        </div>
        {count > 0 && (
          <span className="planned-pill">
            <CheckOutlined /> В плане · {count}
          </span>
        )}
        <span className="card-art-index">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="catalog-card-body">
        <div className="catalog-place">
          <EnvironmentOutlined /> {item.place}
        </div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="catalog-card-bottom">
          <div className="card-price">
            <strong>
              {item.dailyRate != null
                ? `${rubles(item.dailyRate)} / день${item.perPerson ? " с человека" : ""}`
                : item.price == null
                  ? "Цена уточняется"
                  : item.priceLabel}
            </strong>
            <small>
              {item.kind === "stay" && item.dailyRate != null
                ? `${item.durationDays} ${plural(item.durationDays, "день", "дня", "дней")} · итого ${rubles(item.dailyRate * item.durationDays * (item.perPerson ? travelers : 1))}`
                : item.kind === "stay"
                  ? `${item.durationDays} ${plural(item.durationDays, "день", "дня", "дней")} · стоимость за всё проживание`
                  : item.kind === "activity"
                    ? "ориентир из ваших заметок"
                    : "цена из ваших заметок"}
            </small>
          </div>
          {archived ? (
            <Button className="catalog-add catalog-restore" icon={<RollbackOutlined />} onClick={onRestore}>
              Вернуть в каталог
            </Button>
          ) : (
            <Button
              className="catalog-add"
              type={count ? "default" : "primary"}
              icon={<PlusOutlined />}
              onClick={onAdd}
            >
              {count ? "Ещё раз" : "В план"}
            </Button>
          )}
        </div>
        {item.url ? (
          <a
            className="source-link"
            href={item.url}
            target="_blank"
            rel="noreferrer"
          >
            Открыть источник <ExportOutlined />
          </a>
        ) : (
          <span className="source-unavailable">Ссылка не указана</span>
        )}
      </div>
    </article>
  );
}

const ObservedSidebar = observer(Sidebar);
const ObservedPlanPage = observer(PlanPage);
const ObservedApprovalPage = observer(ApprovalPage);
const ObservedBudgetPage = observer(BudgetPage);
const ObservedCatalogPage = observer(CatalogPage);

const App = observer(function App() {
  const store = useTripStore();
  const location = useLocation();
  const pageTitles = {
    "/plan": "План поездки",
    "/approval": "Согласование",
    "/budget": "Бюджет поездки",
    "/catalog": "Каталог",
  };
  const title = pageTitles[location.pathname] || pageTitles["/plan"];
  return (
    <div className="app-shell">
      <ObservedSidebar store={store} />
      <main className="main-area">
        <div className="mobile-brand">
          <span className="brand-mark">
            <img src={waymateLogo} alt="" />
          </span>
          <span className="brand-name">
            Way<span>mate</span>
          </span>
          <span className="mobile-trip">Сахалин · февраль 2027</span>
        </div>
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span>МОИ ПОЕЗДКИ</span>
            <ArrowRightOutlined />
            <strong>Сахалин зимой</strong>
            <span className="breadcrumb-divider">/</span>
            <span>{title}</span>
          </div>
          <div className="topbar-actions">
            <span className="topbar-status">
              <i /> Планируем вместе
            </span>
            <span className="topbar-avatar">А</span>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Разделы поездки">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mobile-nav-link${isActive ? " active" : ""}`
              }
            >
              <span>{item.icon}</span>
              {item.label}
              {item.count?.(store) > 0 && (
                <small className="mobile-nav-count">{item.count(store)}</small>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/plan" replace />} />
            <Route path="/plan" element={<ObservedPlanPage />} />
            <Route path="/approval" element={<ObservedApprovalPage />} />
            <Route path="/budget" element={<ObservedBudgetPage />} />
            <Route path="/catalog" element={<ObservedCatalogPage />} />
            <Route path="*" element={<Navigate to="/plan" replace />} />
          </Routes>
          <footer className="site-footer">
            <span>
              Сделано для большой зимней поездки{" "}
              <span className="footer-heart">♥</span>
            </span>
            <span>САХАЛИН · 2027</span>
          </footer>
        </div>
      </main>
    </div>
  );
});

export default App;
