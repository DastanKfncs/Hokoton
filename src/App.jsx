import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaChartLine, FaRobot, FaTasks, FaClock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const todayLabel = new Date().toLocaleDateString("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return "";
    const data = safeJsonParse(stored, null);
    if (data && typeof data === "object") {
      return data.name || "";
    }
    return stored;
  });
  const [menu, setMenu] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard");

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem("user");
      let data = {};
      if (stored) {
        try {
          data = JSON.parse(stored);
        } catch {
          data = { password: "", email: "" };
        }
      }
      localStorage.setItem("user", JSON.stringify({ ...data, name: user }));
    }
  }, [user]);

  if (!user) return <Auth setUser={setUser} />;

  const renderSection = () => {
    switch (activeSection) {
      case "Dashboard":
        return <Dashboard />;
      case "Analyzer":
        return <Analyzer />;
      case "Tasks":
        return <Tasks />;
      case "Timer":
        return <Timer />;
      case "Motivation":
        return <Motivation />;
      case "Settings":
        return <Settings />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div style={ui.page}>
      <div style={ui.app}>
        <Header user={user} openMenu={() => setMenu(true)} />
        <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
        <div style={ui.topCards}>
          <Card small icon={<FaChartLine />} title="Продуктивность" value="+24%" />
          <Card small icon={<FaTasks />} title="Задачи" value="8 шт" />
          <Card small icon={<FaRobot />} title="AI" value="Готов" />
          <Card small icon={<FaClock />} title="Таймер" value="25 мин" />
        </div>

        <Menu open={menu} close={() => setMenu(false)} setUser={setUser} openProfile={() => setProfileModal(true)} />
        <ProfileModal open={profileModal} close={() => setProfileModal(false)} user={user} setUser={setUser} />
        {renderSection()}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function Header({ user, openMenu }) {
  return (
    <div style={ui.header}>
      <button style={ui.menuButton} onClick={openMenu}>
        <FaBars />
      </button>
      <div>
        <div style={ui.greeting}>Привет, {user}</div>
        <div style={ui.subtle}>{todayLabel}</div>
      </div>
      <div style={ui.logo}>Future AI</div>
    </div>
  );
}

function Navigation({ activeSection, setActiveSection }) {
  const sections = [
    { key: "Dashboard", label: "Главная", icon: <FaChartLine /> },
    { key: "Analyzer", label: "Анализ", icon: <FaRobot /> },
    { key: "Tasks", label: "Задачи", icon: <FaTasks /> },
    { key: "Timer", label: "Таймер", icon: <FaClock /> },
    { key: "Motivation", label: "Мотивация", icon: "💪" },
    { key: "Settings", label: "Настройки", icon: "⚙️" },
  ];

  return (
    <div style={ui.navigation}>
      {sections.map((section) => (
        <button
          key={section.key}
          style={{
            ...ui.navButton,
            ...(activeSection === section.key ? ui.navButtonActive : {}),
          }}
          onClick={() => setActiveSection(section.key)}
        >
          {section.icon} {section.label}
        </button>
      ))}
    </div>
  );
}

function Card({ title, value, icon }) {
  return (
    <div style={ui.miniCard}>
      <div style={ui.cardIcon}>{icon}</div>
      <div>
        <div style={ui.cardTitle}>{title}</div>
        <div style={ui.cardValue}>{value}</div>
      </div>
    </div>
  );
}

function Menu({ open, close, setUser, openProfile }) {
  const ref = useRef();

  useEffect(() => {
    const clickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close();
    };

    const esc = (e) => {
      if (e.key === "Escape") close();
    };

    if (open) {
      document.addEventListener("mousedown", clickOutside);
      document.addEventListener("keydown", esc);
    }

    return () => {
      document.removeEventListener("mousedown", clickOutside);
      document.removeEventListener("keydown", esc);
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            style={ui.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={ref}
            style={ui.menu}
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
          >
            <button style={ui.close} onClick={close}>✖</button>
            <h3>Меню</h3>
            <p style={ui.menuText}>Настройки, синхронизация и выход.</p>
            <button style={ui.profileButton} onClick={openProfile}>
              Настройки профиля
            </button>
            <button
              style={ui.logout}
              onClick={() => {
                localStorage.clear();
                setUser("");
              }}
            >
              Выйти из аккаунта
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ProfileModal({ open, close, user, setUser }) {
  const [newName, setNewName] = useState(user);

  const save = () => {
    if (!newName.trim()) {
      toast.error("Имя не может быть пустым");
      return;
    }

    const stored = localStorage.getItem("user");
    let data = {};
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch {
        data = { password: "", email: "" };
      }
    }

    const updated = { ...data, name: newName.trim() };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(newName.trim());
    toast.success("Профиль обновлён");
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            style={ui.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            style={ui.modal}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <button style={ui.close} onClick={close}>✖</button>
            <h3>Настройки профиля</h3>
            <input
              style={ui.input}
              placeholder="Новое имя"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button style={ui.btn} onClick={save}>Сохранить</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Dashboard() {
  return (
    <div style={ui.sections}>
      <div style={ui.section}>
        <h2 style={ui.sectionTitle}>Продуктивность</h2>
        <div style={ui.grid}>
          <Analyzer />
          <Timer />
        </div>
      </div>

      <div style={ui.section}>
        <h2 style={ui.sectionTitle}>Управление</h2>
        <div style={ui.grid}>
          <Tasks />
          <Motivation />
        </div>
      </div>

      <div style={ui.section}>
        <h2 style={ui.sectionTitle}>AI-помощник</h2>
        <div style={ui.grid}>
          <AI />
        </div>
      </div>
    </div>
  );
}

function Motivation() {
  const quotes = [
    "Каждый шаг приближает вас к цели.",
    "Сегодня — лучший день начать новую задачу.",
    "Продуктивность начинается с правильного настроя.",
  ];

  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  return (
    <motion.div style={ui.card} whileHover={{ y: -6 }}>
      <div style={ui.sectionHead}>
        <h3>Мотивация</h3>
        <span style={ui.tag}>Вдохновение</span>
      </div>
      <p style={ui.quoteText}>{quote}</p>
    </motion.div>
  );
}

function Analyzer() {
  const [study, setStudy] = useState(0);
  const [games, setGames] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Введите показатели и нажмите Анализировать");
  const [aiAdvice, setAiAdvice] = useState("");

  const chartData = useMemo(
    () => ({
      labels: ["Учёба", "Игры", "Сон"],
      datasets: [
        {
          label: "Часы",
          data: [study, games, sleep],
          backgroundColor: ["#60a5fa", "#7dd3fc", "#bae6fd"],
          hoverBackgroundColor: ["#3b82f6", "#38bdf8", "#7dd3fc"],
          borderRadius: 12,
        },
      ],
    }),
    [study, games, sleep]
  );

  const scoreLabel = useMemo(() => {
    if (score === null) return "—";
    if (score < 0) return "Плохо";
    if (score < 3) return "Ниже нормы";
    if (score < 8) return "Хорошо";
    return "Отлично";
  }, [score]);

  const analyze = async () => {
    if (study < 0 || games < 0 || sleep < 0) {
      toast.error("Значения не могут быть отрицательными");
      return;
    }
    if (study + games + sleep > 24) {
      toast.error("Сумма часов не может превышать 24");
      return;
    }
    setLoading(true);
    setNotice("Идёт анализ...");

    try {
      const res = await axios.post("http://127.0.0.1:5000/analyze", {
        study,
        games,
        sleep,
      });
      setScore(res.data.score);
      setNotice("Анализ завершён");
    } catch {
      setNotice("Сервер не отвечает");
      toast.error("Сервер не запущен");
    } finally {
      setLoading(false);
    }
  };

  const getAiAdvice = async () => {
    if (score === null) {
      toast.error("Сначала проанализируйте данные");
      return;
    }
    setLoading(true);
    try {
      const msg = `У меня учёба: ${study}ч, игры: ${games}ч, сон: ${sleep}ч. Баллы: ${score}. Дай персональный совет по улучшению продуктивности.`;
      const res = await axios.post("http://127.0.0.1:5000/ai", { msg });
      setAiAdvice(res.data.reply);
    } catch {
      toast.error("AI не работает");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div style={ui.card} whileHover={{ y: -6 }}>
      <div style={ui.sectionHead}>
        <h3>Анализ дня</h3>
        <span style={ui.tag}>AI-помощник</span>
      </div>

      <div style={ui.row}>
        <div style={ui.inputsColumn}>
          <input
            style={ui.input}
            type="number"
            placeholder="Учёба, ч"
            min={0}
            value={study}
            onChange={(e) => setStudy(+e.target.value || 0)}
          />
          <input
            style={ui.input}
            type="number"
            placeholder="Игры, ч"
            min={0}
            value={games}
            onChange={(e) => setGames(+e.target.value || 0)}
          />
          <input
            style={ui.input}
            type="number"
            placeholder="Сон, ч"
            min={0}
            value={sleep}
            onChange={(e) => setSleep(+e.target.value || 0)}
          />

          <motion.button
            style={ui.btn}
            whileHover={{ y: -2 }}
            onClick={analyze}
            disabled={loading}
          >
            {loading ? "Анализ..." : "Анализировать"}
          </motion.button>

          {score !== null && (
            <motion.button
              style={ui.btn}
              whileHover={{ y: -2 }}
              onClick={getAiAdvice}
              disabled={loading}
            >
              {loading ? "Получение совета..." : "Получить совет от AI"}
            </motion.button>
          )}

          <div style={ui.analysisFooter}>
            <div>
              <div style={ui.smallText}>Баллы</div>
              <div style={ui.largeText}>{score !== null ? score : "—"}</div>
            </div>
            <div>
              <div style={ui.smallText}>Результат</div>
              <div style={ui.largeText}>{scoreLabel}</div>
            </div>
          </div>
          <div style={ui.notice}>{notice}</div>

          {aiAdvice && (
            <div style={ui.aiAdvice}>
              <h4>Совет от AI:</h4>
              <p>{aiAdvice}</p>
            </div>
          )}
        </div>

        <div style={ui.chartCard}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  titleColor: 'white',
                  bodyColor: 'white',
                  cornerRadius: 8,
                  displayColors: false,
                },
              },
              scales: {
                y: { beginAtZero: true, ticks: { color: "#475569" } },
                x: { ticks: { color: "#475569" } },
              },
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Tasks() {
  const [tasks, setTasks] = useState(() => safeJsonParse(localStorage.getItem("tasks"), []));
  const [taskModal, setTaskModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    setTaskModal(true);
  };

  const removeTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div style={ui.card} whileHover={{ y: -6 }}>
      <div style={ui.sectionHead}>
        <h3>Задачи</h3>
        <button style={ui.smallButton} onClick={addTask}>Добавить</button>
      </div>

      <TaskModal open={taskModal} close={() => setTaskModal(false)} addTask={(task) => setTasks((prev) => [...prev, task])} />

      {tasks.length === 0 ? (
        <div style={ui.emptyState}>Добавьте первую задачу</div>
      ) : (
        tasks.map((task, index) => (
          <div key={`${task.text}-${index}`} style={ui.taskRow}>
            <div>
              <div style={ui.taskText}>{task.text}</div>
              <div style={ui.taskType}>{task.type}</div>
            </div>
            <button style={ui.removeTask} onClick={() => removeTask(index)}>×</button>
          </div>
        ))
      )}
    </motion.div>
  );
}
function TaskModal({ open, close, addTask }) {
  const [text, setText] = useState("");
  const [type, setType] = useState("Учёба");

  const save = () => {
    if (!text.trim()) {
      toast.error("Введите задачу");
      return;
    }
    addTask({ text: text.trim(), type });
    setText("");
    setType("Учёба");
    toast.success("Задача добавлена");
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            style={ui.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            style={ui.modal}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <button style={ui.close} onClick={close}>✖</button>
            <h3>Новая задача</h3>
            <input
              style={ui.input}
              placeholder="Текст задачи"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <select style={ui.input} value={type} onChange={(e) => setType(e.target.value)}>
              <option disabled value="">Выберите тип</option>
              <option>Учёба</option>
              <option>Отдых</option>
              <option>Спорт</option>
              <option>Работа</option>
              <option>Другое</option>
            </select>
            <button style={ui.btn} onClick={save}>Добавить</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState("General");

  const tabs = [
    { key: "General", label: "Общие" },
    { key: "Appearance", label: "Внешний вид" },
    { key: "Notifications", label: "Уведомления" },
    { key: "Profile", label: "Профиль" },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "General":
        return <GeneralSettings />;
      case "Appearance":
        return <AppearanceSettings />;
      case "Notifications":
        return <NotificationSettings />;
      case "Profile":
        return <ProfileSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <motion.div style={ui.card} whileHover={{ y: -6 }}>
      <div style={ui.sectionHead}>
        <h3>Настройки</h3>
        <span style={ui.tag}>Персонализация</span>
      </div>

      <div style={ui.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={{
              ...ui.tabButton,
              ...(activeTab === tab.key ? ui.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={ui.tabContent}>
        {renderTab()}
      </div>
    </motion.div>
  );
}

function GeneralSettings() {
  return (
    <div>
      <h4>Общие настройки</h4>
      <p>Здесь будут общие настройки приложения.</p>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div>
      <h4>Внешний вид</h4>
      <p>Настройки темы и интерфейса.</p>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div>
      <h4>Уведомления</h4>
      <p>Настройки уведомлений.</p>
    </div>
  );
}

function ProfileSettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    const stored = localStorage.getItem("user");
    if (!stored) {
      toast.error("Пользователь не найден");
      return;
    }
    const data = safeJsonParse(stored, null);
    if (!data || data.password !== oldPassword) {
      toast.error("Неверный старый пароль");
      return;
    }

    data.password = newPassword;
    localStorage.setItem("user", JSON.stringify(data));
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Пароль изменён");
  };

  return (
    <div>
      <h4>Настройки профиля</h4>
      <p>Измените пароль и другие данные профиля.</p>

      <div style={ui.passwordContainer}>
        <input
          style={ui.input}
          type={showOldPassword ? "text" : "password"}
          placeholder="Старый пароль"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <button
          type="button"
          style={ui.eyeButton}
          onClick={() => setShowOldPassword(!showOldPassword)}
        >
          {showOldPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <div style={ui.passwordContainer}>
        <input
          style={ui.input}
          type={showNewPassword ? "text" : "password"}
          placeholder="Новый пароль"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button
          type="button"
          style={ui.eyeButton}
          onClick={() => setShowNewPassword(!showNewPassword)}
        >
          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <div style={ui.passwordContainer}>
        <input
          style={ui.input}
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Подтвердите новый пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          type="button"
          style={ui.eyeButton}
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <button style={ui.btn} onClick={handleChangePassword}>
        Изменить пароль
      </button>
    </div>
  );
}

function AI() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState(() => safeJsonParse(localStorage.getItem("chat"), []));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("chat", JSON.stringify(chat));
  }, [chat]);

  const send = async () => {
    if (!msg.trim()) return;

    const newChat = [...chat, { sender: "user", text: msg }];
    setChat(newChat);
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:5000/ai", { msg });
      setChat((prev) => [...prev, { sender: "ai", text: res.data.reply }]);
      setMsg("");
    } catch {
      toast.error("AI не работает");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div style={ui.card} whileHover={{ y: -6 }}>
      <div style={ui.sectionHead}>
        <h3>AI-помощник</h3>
        <span style={ui.tag}>Быстрые ответы</span>
      </div>

      <div style={ui.chatBox}>
        {chat.length === 0 ? (
          <div style={ui.emptyState}>Задайте вопрос AI, чтобы получить советы.</div>
        ) : (
          chat.map((item, index) => (
            <div
              key={`${item.text}-${index}`}
              style={item.sender === "user" ? ui.bubbleUser : ui.bubbleAi}
            >
              <span style={ui.bubbleLabel}>{item.sender === "user" ? "Вы" : "AI"}</span>
              <div>{item.text}</div>
            </div>
          ))
        )}
      </div>

      <div style={ui.chatControls}>
        <input
          style={ui.input}
          placeholder="Напишите сообщение"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button style={ui.btn} onClick={send} disabled={loading}>
          {loading ? "Отправка..." : "Отправить"}
        </button>
      </div>
    </motion.div>
  );
}

function Timer() {
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("work"); // work or break
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }

    clearInterval(intervalRef.current);
    return undefined;
  }, [isActive, time]);

  useEffect(() => {
    if (time !== 0 || !isActive) return;

    const nextMode = mode === "work" ? "break" : "work";
    const nextTime = nextMode === "work" ? 25 * 60 : 5 * 60;

    const timeout = setTimeout(() => {
      setIsActive(false);
      toast.success(mode === "work" ? "Время отдыха!" : "Время работать!");
      setMode(nextMode);
      setTime(nextTime);
    }, 0);

    return () => clearTimeout(timeout);
  }, [time, isActive, mode]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setIsActive(false);
    setTime(mode === "work" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div style={ui.card} whileHover={{ y: -6 }}>
      <div style={ui.sectionHead}>
        <h3>Таймер Pomodoro</h3>
        <span style={ui.tag}>{mode === "work" ? "Работа" : "Отдых"}</span>
      </div>

      <div style={ui.timerDisplay}>
        <div style={ui.timerCircle}>
          <div style={ui.timerText}>{formatTime(time)}</div>
        </div>
      </div>

      <div style={ui.timerControls}>
        <button style={ui.btn} onClick={toggle}>
          {isActive ? "Пауза" : "Старт"}
        </button>
        <button style={ui.smallButton} onClick={reset}>
          Сброс
        </button>
      </div>

      <div style={ui.timerInfo}>
        <p>Техника Pomodoro: 25 минут работы, 5 минут отдыха.</p>
      </div>
    </motion.div>
  );
}

function Auth({ setUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Введите корректный email");
      return;
    }

    const stored = localStorage.getItem("user");
    if (isLogin) {
      if (!stored) {
        toast.error("Пользователь не найден. Зарегистрируйтесь");
        return;
      }
      const data = safeJsonParse(stored, null);
      if (!data || data.name !== name.trim() || data.email !== email.trim() || data.password !== password) {
        toast.error("Неверные данные");
        return;
      }
      setUser(name.trim());
    } else {
      if (stored) {
        toast.error("Пользователь уже существует");
        return;
      }
      localStorage.setItem("user", JSON.stringify({ name: name.trim(), email: email.trim(), password }));
      setUser(name.trim());
      toast.success("Регистрация успешна");
    }
  };

  return (
    <div style={ui.auth}>
      <motion.div style={ui.authCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={ui.authTitle}>Future AI</h1>
        <p style={ui.authText}>Стильный помощник для учёбы и продуктивности.</p>
        <input
          style={ui.input}
          placeholder="Имя пользователя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={ui.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div style={ui.passwordContainer}>
          <input
            style={ui.input}
            type={showPassword ? "text" : "password"}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            style={ui.eyeButton}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <button
          style={ui.btn}
          onClick={handleSubmit}
        >
          {isLogin ? "Войти" : "Зарегистрироваться"}
        </button>
        <button
          style={ui.linkButton}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </motion.div>
    </div>
  );
}

const ui = {
  page: {
    minHeight: "100vh",
    padding: 32,
    background: "linear-gradient(180deg, #e8f0ff 0%, #f8fbff 100%)",
    color: "#0f172a",
  },

  app: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },

  sections: {
    display: "flex",
    flexDirection: "column",
    gap: 48,
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    padding: 20,
    borderRadius: 24,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(59,130,246,0.15)",
  },

  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    border: "none",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(59, 130, 246, 0.12)",
  },

  greeting: {
    fontSize: 20,
    fontWeight: 700,
  },

  subtle: {
    marginTop: 4,
    color: "#475569",
    fontSize: 14,
  },

  logo: {
    color: "#1d4ed8",
    fontWeight: 700,
    letterSpacing: 0.5,
  },

  topCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
  },

  miniCard: {
    borderRadius: 20,
    background: "rgba(255,255,255,0.95)",
    padding: 18,
    display: "flex",
    gap: 16,
    alignItems: "center",
    border: "1px solid rgba(59,130,246,0.16)",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.06)",
  },

  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 18,
  },

  cardTitle: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 6,
  },

  cardValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
  },

  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    gap: 10,
  },

  tag: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 700,
  },

  card: {
    padding: 24,
    borderRadius: 24,
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 30px 60px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(59,130,246,0.12)",
    minHeight: 260,
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    marginBottom: 14,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.3)",
    background: "#f8fbff",
    outline: "none",
    color: "#0f172a",
    fontSize: 15,
    "::placeholder": {
      color: "#64748b",
      opacity: 1,
    },
  },

  btn: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 16px 30px rgba(59,130,246,0.18)",
  },

  overlay: {
    position: "fixed",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    background: "rgba(15, 23, 42, 0.3)",
    zIndex: 20,
  },

  menu: {
    position: "fixed",
    left: 0,
    top: 0,
    width: 280,
    height: "100%",
    background: "#ffffff",
    padding: 24,
    zIndex: 30,
    boxShadow: "20px 0 60px rgba(15, 23, 42, 0.16)",
  },

  close: {
    border: "none",
    background: "transparent",
    color: "#475569",
    fontSize: 18,
    cursor: "pointer",
    position: "absolute",
    right: 16,
    top: 16,
  },

  logout: {
    marginTop: 20,
    width: "100%",
    padding: "12px 18px",
    border: "none",
    borderRadius: 16,
    background: "#ef4444",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  menuText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.7,
    marginTop: 6,
  },

  profileButton: {
    width: "100%",
    padding: "12px 18px",
    border: "none",
    borderRadius: 16,
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 12,
  },

  modal: {
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflow: "auto",
    background: "white",
    padding: 24,
    borderRadius: 24,
    zIndex: 40,
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.16)",
  },

  taskRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    background: "#f8fbff",
    border: "1px solid rgba(59,130,246,0.14)",
    marginBottom: 12,
  },

  taskText: {
    color: "#0f172a",
    fontSize: 15,
  },

  taskType: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },

  removeTask: {
    border: "none",
    width: 36,
    height: 36,
    borderRadius: 12,
    background: "#dbeafe",
    color: "#1d4ed8",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 700,
  },

  emptyState: {
    padding: 24,
    borderRadius: 20,
    background: "#eff6ff",
    color: "#475569",
    textAlign: "center",
    fontSize: 15,
  },

  auth: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "linear-gradient(180deg, #eef8ff 0%, #f8fbff 100%)",
  },

  authCard: {
    width: "100%",
    maxWidth: 420,
    padding: 32,
    borderRadius: 28,
    background: "rgba(255,255,255,0.98)",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(59,130,246,0.15)",
  },

  authTitle: {
    margin: 0,
    fontSize: 42,
    letterSpacing: -1,
    color: "#0f172a",
  },

  authText: {
    margin: "12px 0 24px",
    color: "#475569",
    fontSize: 16,
    lineHeight: 1.6,
  },

  linkButton: {
    marginTop: 12,
    background: "transparent",
    border: "none",
    color: "#3b82f6",
    cursor: "pointer",
    fontSize: 14,
    textDecoration: "underline",
  },

  passwordContainer: {
    position: "relative",
  },

  eyeButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: 16,
  },

  navigation: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 24,
  },

  navButton: {
    padding: "10px 16px",
    borderRadius: 16,
    border: "1px solid rgba(59,130,246,0.2)",
    background: "#f8fbff",
    color: "#475569",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  navButtonActive: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderColor: "#3b82f6",
  },

  tabs: {
    display: "flex",
    gap: 4,
    marginBottom: 20,
  },

  tabButton: {
    padding: "8px 16px",
    borderRadius: 12,
    border: "none",
    background: "#f1f5f9",
    color: "#475569",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },

  tabButtonActive: {
    background: "#3b82f6",
    color: "white",
  },

  tabContent: {
    padding: 20,
    background: "#f8fbff",
    borderRadius: 16,
    border: "1px solid rgba(59,130,246,0.12)",
  },

  row: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    alignItems: "stretch",
  },

  inputsColumn: {
    display: "flex",
    flexDirection: "column",
  },

  analysisFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 12,
  },

  smallText: {
    fontSize: 13,
    color: "#475569",
  },

  largeText: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: 700,
  },

  notice: {
    marginTop: 18,
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.6,
  },

  aiAdvice: {
    marginTop: 20,
    padding: 16,
    background: "#eff6ff",
    borderRadius: 16,
    border: "1px solid rgba(59,130,246,0.2)",
  },

  chartCard: {
    padding: 20,
    background: "#f8fbff",
    borderRadius: 22,
    border: "1px solid rgba(59,130,246,0.12)",
    minHeight: 400,
  },

  chatBox: {
    minHeight: 240,
    maxHeight: 420,
    overflowY: "auto",
    padding: 16,
    borderRadius: 20,
    background: "#f8fbff",
    border: "1px solid rgba(59,130,246,0.12)",
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  bubbleUser: {
    alignSelf: "flex-end",
    maxWidth: "90%",
    padding: 14,
    borderRadius: 18,
    background: "#dbeafe",
    color: "#0f172a",
    boxShadow: "0 20px 40px rgba(59,130,246,0.08)",
  },

  bubbleAi: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    padding: 14,
    borderRadius: 18,
    background: "#eff6ff",
    color: "#0f172a",
    boxShadow: "0 20px 40px rgba(59,130,246,0.06)",
  },

  bubbleLabel: {
    display: "block",
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 700,
    color: "#2563eb",
  },

  chatControls: {
    display: "grid",
    gap: 12,
  },

  smallButton: {
    padding: "10px 16px",
    borderRadius: 14,
    border: "none",
    background: "#dbeafe",
    color: "#1e40af",
    fontWeight: 700,
    cursor: "pointer",
  },

  timerDisplay: {
    display: "flex",
    justifyContent: "center",
    margin: "20px 0",
  },

  timerCircle: {
    width: 150,
    height: 150,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 20px 40px rgba(59,130,246,0.2)",
  },

  timerText: {
    fontSize: 32,
    fontWeight: 700,
    color: "white",
  },

  timerControls: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
  },

  timerInfo: {
    marginTop: 16,
    textAlign: "center",
    color: "#475569",
    fontSize: 14,
  },

  quoteBox: {
    textAlign: "center",
    padding: 20,
  },

  quoteText: {
    fontSize: 18,
    fontStyle: "italic",
    color: "#0f172a",
    marginBottom: 16,
    lineHeight: 1.6,
  },
};
