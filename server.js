const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'polls.json');
const VOTE_COOKIE = 'votedPollId';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const defaultPolls = [
  {
    id: '1',
    title: 'Куда поедем на выходных?',
    description: 'Выберите вариант, который вам больше нравится.',
    options: [
      { id: 'a', label: 'На пикник', votes: 0 },
      { id: 'b', label: 'В кино', votes: 0 },
      { id: 'c', label: 'В кафе', votes: 0 },
      { id: 'd', label: 'В парк', votes: 0 }
    ]
  }
];


async function loadPolls() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    await savePolls(defaultPolls);
    return defaultPolls;
  }
}

async function savePolls(polls) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(polls, null, 2), 'utf8');
}

let polls = [];
loadPolls().then((loaded) => {
  polls = loaded;
}).catch((error) => {
  console.error('Не удалось загрузить данные опросов:', error);
  polls = defaultPolls;
});

app.get('/api/polls', (req, res) => {
  res.json(polls);
});

app.post('/api/vote', async (req, res) => {
  const { pollId, optionId } = req.body;

  if (!pollId || !optionId) {
    return res.status(400).json({ error: 'pollId и optionId обязательны.' });
  }

  if (req.cookies[VOTE_COOKIE] === pollId) {
    return res.status(403).json({ error: 'Вы уже проголосовали в этом опросе.' });
  }

  const poll = polls.find((item) => item.id === pollId);
  if (!poll) {
    return res.status(404).json({ error: 'Опрос не найден.' });
  }

  const option = poll.options.find((item) => item.id === optionId);
  if (!option) {
    return res.status(404).json({ error: 'Вариант не найден.' });
  }

  option.votes += 1;

  try {
    await savePolls(polls);
    res.cookie(VOTE_COOKIE, pollId, {
      maxAge: 1000 * 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: 'lax'
    });
    res.json({ poll });
  } catch (error) {
    console.error('Ошибка при сохранении голосов:', error);
    res.status(500).json({ error: 'Не удалось сохранить голос.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сайт голосований запущен: http://localhost:${PORT}`);
});
