const pollsContainer = document.getElementById('polls');
const VOTE_STORAGE_KEY = 'votedPollId';

function hasVoted(pollId) {
  return localStorage.getItem(VOTE_STORAGE_KEY) === pollId;
}

function markVoted(pollId) {
  localStorage.setItem(VOTE_STORAGE_KEY, pollId);
}

async function fetchPolls() {
  const response = await fetch('/api/polls');
  if (!response.ok) throw new Error('Не удалось загрузить опросы.');
  return response.json();
}

function createPollCard(poll) {
  const card = document.createElement('article');
  card.className = 'poll-card';

  const title = document.createElement('h2');
  title.textContent = poll.title;

  const description = document.createElement('p');
  description.textContent = poll.description;

  const form = document.createElement('form');
  form.dataset.pollId = poll.id;

  const list = document.createElement('ul');
  list.className = 'options-list';

  poll.options.forEach((option) => {
    const item = document.createElement('li');

    const label = document.createElement('label');
    label.className = 'option-label';
    label.htmlFor = `${poll.id}-${option.id}`;

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = `poll-${poll.id}`;
    radio.id = `${poll.id}-${option.id}`;
    radio.value = option.id;

    const text = document.createElement('span');
    text.className = 'option-text';
    text.textContent = `${option.label}`;

    label.append(radio, text);
    item.appendChild(label);
    list.appendChild(item);
  });

  const button = document.createElement('button');
  button.className = 'vote-button';
  button.type = 'submit';
  button.textContent = 'Проголосовать';

  const message = document.createElement('div');
  message.className = 'message';
  message.style.display = 'none';

  const results = renderResults(poll);

  if (hasVoted(poll.id)) {
    form.querySelectorAll('input[type=radio]').forEach((input) => (input.disabled = true));
    button.disabled = true;
    showMessage(message, 'Вы уже проголосовали в этом опросе.');
  }

  form.append(list, button, message, results);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const optionId = form.querySelector('input[type=radio]:checked')?.value;
    if (!optionId) {
      showMessage(message, 'Выберите вариант, прежде чем голосовать.', true);
      return;
    }

    button.disabled = true;
    button.textContent = 'Сохраняем...';

    try {
      const updatedPoll = await vote(poll.id, optionId);
      updateResults(results, updatedPoll);
      showMessage(message, 'Спасибо! Ваш голос учтен.');
      form.querySelectorAll('input[type=radio]').forEach((input) => (input.disabled = true));
      button.disabled = true;
      markVoted(poll.id);
    } catch (error) {
      if (error === 'Вы уже проголосовали в этом опросе.') {
        button.disabled = true;
        form.querySelectorAll('input[type=radio]').forEach((input) => (input.disabled = true));
      }
      showMessage(message, typeof error === 'string' ? error : 'Ошибка при отправке голоса.', true);
    } finally {
      if (!hasVoted(poll.id)) {
        button.disabled = false;
      }
      button.textContent = 'Проголосовать';
    }
  });

  card.append(title, description, form);
  return card;
}

function renderResults(poll) {
  const results = document.createElement('div');
  results.className = 'results';
  updateResults(results, poll);
  return results;
}

function updateResults(resultsNode, poll) {
  resultsNode.innerHTML = '';
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  poll.options.forEach((option) => {
    const row = document.createElement('div');
    row.className = 'result-row';

    const header = document.createElement('div');
    header.className = 'result-header';
    header.innerHTML = `
      <span>${option.label}</span>
      <strong>${option.votes} голос${option.votes === 1 ? '' : 'ов'}</strong>
    `;

    const bar = document.createElement('div');
    bar.className = 'bar';
    const inner = document.createElement('div');
    inner.className = 'bar-inner';
    const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
    inner.style.width = `${percent}%`;
    bar.appendChild(inner);

    const percentText = document.createElement('div');
    percentText.style.fontSize = '0.85rem';
    percentText.style.color = '#5a6078';
    percentText.textContent = `${percent}% от ${totalVotes} голосов`;

    row.append(header, bar, percentText);
    resultsNode.appendChild(row);
  });
}

function showMessage(container, text, isError = false) {
  container.textContent = text;
  container.style.display = 'block';
  container.style.background = isError ? '#ffe8e8' : '#eef6ff';
  container.style.color = isError ? '#9d2d2d' : '#2c4b8a';
}

async function vote(pollId, optionId) {
  const response = await fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pollId, optionId })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw payload.error || 'Ошибка сервера.';
  }

  const data = await response.json();
  return data.poll;
}

async function init() {
  try {
    const polls = await fetchPolls();
    polls.forEach((poll) => pollsContainer.appendChild(createPollCard(poll)));
  } catch (error) {
    pollsContainer.innerHTML = '<div class="poll-card"><p>Не удалось загрузить голосования. Попробуйте обновить страницу.</p></div>';
    console.error(error);
  }
}

init();
