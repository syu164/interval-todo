'use strict';
import $ from 'jquery';

// ToDo リスト機能の実装

const form = document.getElementById("form");
const input = document.getElementById("input");
const ul = document.getElementById("ul");

const todos = JSON.parse(localStorage.getItem("todos"));

if (todos) {
  todos.forEach(todo => {
    add(todo);
  })
}

form.addEventListener("submit", function (event) {
  event.preventDefault(); // ブラウザのリロードをさせないため
  add();
});

function add(todo) {
  let todoText = input.value;
  
  // localStrage に先に値を持っていたら入れる
  if (todo) {
    todoText = todo.text;
  }

  if (todoText) { // if (todoText.length > 0) の条件だとCannot Read Propatyになる
    const li = document.createElement("li");
    li.innerText = todoText
    li.classList.add("list-group-item");

    // 完了の状態の打ち消し線を保っておく処理
    if (todo && todo.completed) {
      li.classList.add("text-decoration-line-through");
    }
    // 完了線を入れる機能
    // ulに追加する前に liにイベントを付ける
    li.addEventListener("click", function () {
      li.classList.toggle("text-decoration-line-through");
      saveData();
    });

    // 削除機能
    // ulに追加する前に liにイベントを付ける
    // liタグaddEventListenerを仕込む
    li.addEventListener("contextmenu", function(event) {
      event.preventDefault(); // 右クリックメニューを出さないようにする
      li.remove();
      saveData();
    });
    
    // TODO li や deleteBtn を一つ上の階層を作って囲う
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("btn-danger","mr-2");
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.addEventListener("click", function () {
      li.remove();
      saveData();
    });
    // todo の左側にボタンを置きたいため 'afterbegin' の位置
    li.insertAdjacentElement('afterbegin', deleteBtn);

    ul.appendChild(li);
    input.value = ""; // 入力欄を追加後、空にする
    saveData();
  }
}

function saveData() {
  const lists = document.querySelectorAll("li");
  let todos = [];
  lists.forEach(list => {
    let todo = {
      text: list.innerText,
      completed: list.classList.contains("text-decoration-line-through")
    };
    todos.push(todo);
  });
  localStorage.setItem("todos", JSON.stringify(todos));
}

// タイマー機能の実装

const timer = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  sessions: 0,
};

let interval;

const mainButton = document.getElementById('js-btn');
mainButton.addEventListener('click', () => {
  const { action } = mainButton.dataset;
  if (action === 'start') {
    startTimer();
  } else {
    stopTimer();
  }
});

const modeButtons = document.querySelector('#js-mode-buttons');
modeButtons.addEventListener('click', handleMode);

function getRemainingTime(endTime) {
  const currentTime = Date.parse(new Date());
  const difference = endTime - currentTime;

  const total = Number.parseInt(difference / 1000, 10);
  const minutes = Number.parseInt((total / 60) % 60, 10);
  const seconds = Number.parseInt(total % 60, 10);
  const elapsedTime = timer.wholeTime - total;

  return {
    elapsedTime,
    total,
    minutes,
    seconds,
  };
}

function startTimer() {
  let { total } = timer.remainingTime;
  const endTime = Date.parse(new Date()) + total * 1000;

  if (timer.mode == 'pomodoro') timer.sessions++;

  mainButton.dataset.action = 'stop';
  mainButton.textContent = 'stop';
  mainButton.classList.add('active');

  interval = setInterval(function() {
    timer.remainingTime = getRemainingTime(endTime);
    updateClock();
    drawTimer(intervalTodoObj.ctxTimer, timer.remainingTime);

    total = timer.remainingTime.total;
    if (total <= 0) {
      clearInterval(interval);

      switch (timer.mode) {
        case 'pomodoro':
          if (timer.sessions % timer.longBreakInterval === 0) {
            switchMode('longBreak');
          } else {
            switchMode('shortBreak');
          }
          break;
        default:
          switchMode('pomodoro');
      }

      startTimer();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);

  mainButton.dataset.action = 'start';
  mainButton.textContent = 'start';
  mainButton.classList.remove('active');
}

function updateClock() {
  const { remainingTime } = timer;
  const minutes = `${remainingTime.minutes}`.padStart(2, '0');
  const seconds = `${remainingTime.seconds}`.padStart(2, '0');

  const min = document.getElementById('js-minutes');
  const sec = document.getElementById('js-seconds');
  min.textContent = minutes;
  sec.textContent = seconds;
}

function switchMode(mode) {
  timer.mode = mode;
  timer.wholeTime = timer[mode] * 60;
  timer.remainingTime = {
    total: timer[mode] * 60,
    minutes: timer[mode],
    seconds: 0,
  };

  document
    .querySelectorAll('button[data-mode]')
    .forEach(e => e.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  document.body.style.backgroundColor = `var(--${mode})`; // TODO タイマーの色を変更するコードに書き換える

  updateClock();
}

function handleMode(event) {
  const { mode } = event.target.dataset;

  if (!mode) return;

  switchMode(mode);
  stopTimer();
}

document.addEventListener('DOMContentLoaded', () => {
  switchMode('pomodoro');
});

// タイマーの文字盤の描画

const intervalTodoObj = {
  timerCanvasWidth: 375,
  timerCanvasHeight: 375,
};

function init() {
  
  // タイマー用のキャンバス
  const timerCanvas = $('#timerFace')[0];
  timerCanvas.width = intervalTodoObj.timerCanvasWidth;
  timerCanvas.height = intervalTodoObj.timerCanvasHeight;
  intervalTodoObj.ctxTimer = timerCanvas.getContext('2d');
}
init();

function drawTimer(ctxTimer, remainingTime) {
  intervalTodoObj.ctxTimer.clearRect(0, 0, intervalTodoObj.timerCanvasWidth, intervalTodoObj.timerCanvasHeight); // まっさら
  const x = intervalTodoObj.timerCanvasWidth / 2;
  const y = intervalTodoObj.timerCanvasHeight / 2;
  const r = intervalTodoObj.timerCanvasWidth * 1.5 / 2; // 対角線の長さの半分
  let percent = remainingTime.elapsedTime / timer.wholeTime;
  let drawDeg = percent * 360;
  let endDeg = getRadian(drawDeg);

  let timerFaceColor = 'rgba(0, 220, 0, 0.5)';

  switch (timer.mode) {
    case 'pomodoro':
      timerFaceColor = 'rgba(0, 220, 0, 0.5)';
      break;
    case 'shortBreak':
      timerFaceColor = 'rgba(0, 220, 220, 0.5)';
      break;
    case 'longBreak':
      timerFaceColor = 'rgba(0, 0, 220, 0.5)';
      break;
    default:
      console.log(`Please select Timer mode;`);
  }

  ctxTimer.save(); // セーブ

  ctxTimer.beginPath();
  ctxTimer.translate(x, y);
  ctxTimer.rotate(getRadian(-90)); // 12時の位置からスタートするため

  ctxTimer.fillStyle = timerFaceColor;

  ctxTimer.arc(0, 0, r, getRadian(0), endDeg, true);
  ctxTimer.lineTo(0, 0);

  ctxTimer.fill();

  ctxTimer.restore(); // 元の設定を取得
}

function getRadian(kakudo) {
  return kakudo * Math.PI / 180
}