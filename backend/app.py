import os
from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    from openai import OpenAI
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
except ImportError:
    client = None

app = Flask(__name__)
CORS(app)

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json

    study = int(data.get("study", 0))
    games = int(data.get("games", 0))
    sleep = int(data.get("sleep", 0))

    score = (study * 2) - games + sleep

    return jsonify({"score": score})

@app.route("/ai", methods=["POST"])
def ai():
    data = request.json or {}
    msg = data.get("msg", "").strip()

    if not msg:
        return jsonify({"reply": "Пожалуйста, отправьте вопрос или запрос для AI."})

    if client is None:
        lower_msg = msg.lower()
        advice = "Я пока не могу подключиться к AI. Попробуйте позже или настройте OPENAI_API_KEY."

        if "уч" in lower_msg or "учеб" in lower_msg or "study" in lower_msg:
            advice = "Попробуйте планировать учебные блоки по 25 минут с короткими перерывами и выключать уведомления на время занятий."
        elif "игр" in lower_msg or "игра" in lower_msg or "game" in lower_msg:
            advice = "Ограничьте игровое время и замените его короткими активными паузами, чтобы сохранить энергию для учёбы."
        elif "сон" in lower_msg or "спать" in lower_msg or "sleep" in lower_msg:
            advice = "Стабильный режим сна важен: ложитесь и вставайте в одно и то же время, чтобы улучшить концентрацию."
        elif "мотива" in lower_msg or "вдох" in lower_msg:
            advice = "Напоминайте себе, зачем вы занимаетесь: маленькие цели в день помогают оставаться в движении."

        return jsonify({"reply": advice})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Ты эксперт по продуктивности и мотивации для школьников. Давай персонализированные, полезные советы на основе запроса пользователя. Будь дружелюбным, мотивирующим и конкретным."},
            {"role": "user", "content": msg}
        ]
    )

    return jsonify({
        "reply": response.choices[0].message.content
    })

if __name__ == "__main__":
    app.run(debug=True)