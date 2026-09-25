'use strict';

/* ---------- 基础工具 ---------- */
const $ = (sel) => document.querySelector(sel);

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function fmtDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
const WEEK_CN = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
function dowOf(d) { return (d.getDay() + 6) % 7 + 1; } // 1=周一 ... 7=周日
function toMin(hm) { const [h, m] = hm.split(':').map(Number); return h * 60 + m; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function uid() {
  return (crypto.randomUUID && crypto.randomUUID()) || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- 学期 / 周次 ---------- */
const semesterStart = parseDate(SEMESTER.startMonday);
function weekOf(date) {
  const diff = Math.floor((date - semesterStart) / 86400000);
  if (diff < 0) return 0;
  const w = Math.floor(diff / 7) + 1;
  return w > SEMESTER.totalWeeks ? 0 : w;
}
function mondayOfWeek(w) { return addDays(semesterStart, (w - 1) * 7); }
function holidayOf(dateStr) { return SEMESTER.holidays[dateStr] || null; }
function coursesOn(week, dow) {
  if (!week) return [];
  return COURSES
    .filter((c) => c.day === dow && c.weeks.some(([a, b]) => week >= a && week <= b))
    .sort((a, b) => a.start - b.start);
}

/* ---------- 状态与持久化 ---------- */
const LS_KEY = 'my-schedule.todos.v1';
const state = {
  tab: 'home',
  ttWeek: weekOf(new Date()) || 1,
  ttDay: dowOf(new Date()) <= 5 ? dowOf(new Date()) : 0,
  todos: loadTodos(),
  editingId: null
};
window.state = state;
function loadTodos() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveTodos() { localStorage.setItem(LS_KEY, JSON.stringify(state.todos)); }

/* ---------- 首页 ---------- */
function renderHome() {
  const now = new Date();
  const todayStr = fmtDate(now);
  const week = weekOf(now);
  const dow = dowOf(now);
  const holiday = holidayOf(todayStr);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const dayCourses = (!holiday && dow <= 5) ? coursesOn(week, dow) : [];
  const dayTodos = state.todos.filter((t) => t.date === todayStr);

  const timed = [];
  for (const c of dayCourses) {
    timed.push({
      kind: 'course', startMin: toMin(PERIODS[c.start - 1].start), endMin: toMin(PERIODS[c.end - 1].end),
      timeText: `${PERIODS[c.start - 1].start}–${PERIODS[c.end - 1].end}`,
      title: c.name, meta: `${c.teacher} · ${c.room}`,
      sub: `第${c.start}${c.end > c.start ? '-' + c.end : ''}节`
    });
  }
  for (const t of dayTodos) {
    if (t.start) {
      timed.push({
        kind: 'todo', id: t.id, done: t.done,
        startMin: toMin(t.start), endMin: t.end ? toMin(t.end) : toMin(t.start) + 45,
        timeText: t.end ? `${t.start}–${t.end}` : t.start,
        title: t.title, meta: t.location || '', sub: ''
      });
    }
  }
  timed.sort((a, b) => a.startMin - b.startMin);
  const untimed = dayTodos.filter((t) => !t.start).sort((a, b) => (a.title > b.title ? 1 : -1));

  let nextMarked = false;
  const itemHtml = (it) => {
    let chip = '';
    if (!it.done) {
      if (nowMin >= it.startMin && nowMin < it.endMin) chip = '<span class="chip now">进行中</span>';
      else if (nowMin < it.startMin && !nextMarked) { chip = '<span class="chip next">下一项</span>'; nextMarked = true; }
    }
    return `
      <li class="tl-item ${it.done ? 'done' : ''} ${it.kind}">
        <div class="tl-time">${it.timeText}</div>
        <div class="tl-body">
          <div class="tl-title">${escapeHtml(it.title)}${chip}</div>
          ${it.meta ? `<div class="tl-meta">${escapeHtml(it.meta)}</div>` : ''}
          ${it.sub ? `<div class="tl-meta dim">${escapeHtml(it.sub)}</div>` : ''}
        </div>
      </li>`;
  };

  const banners = [];
  if (holiday) banners.push(`<div class="banner holiday">今天是${escapeHtml(holiday)}，停课一天 🎉</div>`);
  else if (!week) banners.push('<div class="banner">当前不在教学周内（寒假/暑假/学期外）。</div>');
  else if (dow >= 6) banners.push('<div class="banner">今天是周末，没有课程安排。</div>');

  const empty = !timed.length && !untimed.length
    ? '<div class="empty">今天没有课程和日程安排。</div>' : '';

  $('#view-home').innerHTML = `
    <div class="page-head">
      <div>
        <h2>${now.getMonth() + 1}月${now.getDate()}日 ${WEEK_CN[dow - 1]}</h2>
        <div class="sub">${escapeHtml(SEMESTER.name)}</div>
      </div>
      <span class="chip week">${week ? '第' + week + '周' : '非教学周'}</span>
    </div>
    ${banners.join('')}
    ${untimed.length ? `
      <h3 class="sec-title">未定时日程</h3>
      <ul class="timeline">
        ${untimed.map((t) => itemHtml({ kind: 'todo', id: t.id, done: t.done, timeText: '全天', title: t.title, meta: t.location || '', sub: '' })).join('')}
      </ul>` : ''}
    <h3 class="sec-title">今日时间线</h3>
    ${timed.length ? `<ul class="timeline">${timed.map(itemHtml).join('')}</ul>` : ''}
    ${empty}
  `;
}

/* ---------- 课表 ---------- */
function renderTimetable() {
  const week = state.ttWeek;
  const curWeek = weekOf(new Date());
  const monday = mondayOfWeek(week);
  const rangeText = `${monday.getMonth() + 1}/${monday.getDate()} – ${addDays(monday, 6).getMonth() + 1}/${addDays(monday, 6).getDate()}`;

  const cardHtml = (c) => `
    <div class="course-card" style="grid-column:${c.day + 1};grid-row:${c.start + 1}/${c.end + 2}">
      <div class="c-name">${escapeHtml(c.name)}</div>
      <div class="c-meta">${escapeHtml(c.teacher)}</div>
      <div class="c-meta">${escapeHtml(c.room)}</div>
      <div class="c-meta dim">${c.start}-${c.end}节</div>
    </div>`;

  // 桌面网格
  let grid = '<div class="tt-grid"><div class="tt-corner"></div>';
  for (let d = 1; d <= 5; d++) grid += `<div class="tt-dayhead${dowOf(new Date()) === d && week === curWeek ? ' today' : ''}">${WEEK_CN[d - 1]}</div>`;
  for (let p = 1; p <= PERIODS.length; p++) {
    grid += `<div class="tt-period" style="grid-row:${p + 1}"><b>${p}</b><span>${PERIODS[p - 1].start}</span></div>`;
  }
  for (let d = 1; d <= 5; d++) for (const c of coursesOn(week, d)) grid += cardHtml(c);
  grid += '</div>';

  // 移动端按天列表
  const dayCourses = state.ttDay ? coursesOn(week, state.ttDay) : [];
  const dayDate = state.ttDay ? fmtDate(addDays(monday, state.ttDay - 1)) : '';
  const dayHoliday = dayDate ? holidayOf(dayDate) : null;
  const list = dayCourses.length && !dayHoliday
    ? `<ul class="day-list">${dayCourses.map((c) => `
        <li class="day-item">
          <div class="d-time">${PERIODS[c.start - 1].start}–${PERIODS[c.end - 1].end}<span class="dim">${c.start}-${c.end}节</span></div>
          <div class="d-body">
            <div class="c-name">${escapeHtml(c.name)}</div>
            <div class="c-meta">${escapeHtml(c.teacher)} · ${escapeHtml(c.room)}</div>
          </div>
        </li>`).join('')}</ul>`
    : `<div class="empty">${state.ttDay ? (dayHoliday ? escapeHtml(dayHoliday) + '，停课' : '当天没有课程') : '今天是周末，点上方星期查看课程'}</div>`;

  const dayTabs = [1, 2, 3, 4, 5].map((d) =>
    `<button class="day-tab${d === state.ttDay ? ' active' : ''}" data-action="tt-day" data-day="${d}">${WEEK_CN[d - 1]}</button>`).join('');

  $('#view-timetable').innerHTML = `
    <div class="page-head">
      <div class="week-nav">
        <button class="btn icon" data-action="tt-week" data-delta="-1" aria-label="上一周">‹</button>
        <div class="week-label">第${week}周${week === curWeek ? '（本周）' : ''}<span class="sub">${rangeText}</span></div>
        <button class="btn icon" data-action="tt-week" data-delta="1" aria-label="下一周">›</button>
      </div>
      ${week !== curWeek && curWeek ? '<button class="btn ghost" data-action="tt-now">回到本周</button>' : ''}
    </div>
    <div class="tt-desktop">${grid}</div>
    <div class="tt-mobile">
      <div class="day-tabs">${dayTabs}</div>
      ${list}
    </div>
  `;
}

/* ---------- 日程 ---------- */
function dateLabel(dateStr) {
  const today = fmtDate(new Date());
  if (dateStr === today) return '今天';
  if (dateStr === fmtDate(addDays(new Date(), 1))) return '明天';
  if (dateStr === fmtDate(addDays(new Date(), -1))) return '昨天';
  const d = parseDate(dateStr);
  const w = weekOf(d);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEK_CN[dowOf(d) - 1]}${w ? ` · 第${w}周` : ''}`;
}

function renderTodos() {
  const today = fmtDate(new Date());
  const sorted = [...state.todos].sort((a, b) => (
    (a.date + (a.start || '99:99')).localeCompare(b.date + (b.start || '99:99'))
  ));
  const groups = [];
  for (const t of sorted) {
    let g = groups.find((x) => x.date === t.date);
    if (!g) { g = { date: t.date, items: [] }; groups.push(g); }
    g.items.push(t);
  }

  const html = groups.map((g) => `
    <div class="todo-group">
      <h3 class="sec-title">${dateLabel(g.date)}
        ${g.date < today && g.items.some((t) => !t.done) ? '<span class="chip overdue">有未完成</span>' : ''}
      </h3>
      <ul class="todo-list">
        ${g.items.map((t) => `
          <li class="todo-item ${t.done ? 'done' : ''}">
            <input type="checkbox" data-action="toggle" data-id="${t.id}" ${t.done ? 'checked' : ''} aria-label="完成">
            <div class="todo-body">
              <div class="todo-title">${escapeHtml(t.title)}</div>
              <div class="todo-meta">
                ${t.start ? `<span>${t.start}${t.end ? '–' + t.end : ''}</span>` : '<span>全天</span>'}
                ${t.location ? `<span>· ${escapeHtml(t.location)}</span>` : ''}
              </div>
              ${t.notes ? `<div class="todo-notes">${escapeHtml(t.notes)}</div>` : ''}
            </div>
            <div class="todo-actions">
              <button class="btn icon" data-action="edit" data-id="${t.id}" aria-label="编辑">✎</button>
              <button class="btn icon danger" data-action="del" data-id="${t.id}" aria-label="删除">✕</button>
            </div>
          </li>`).join('')}
      </ul>
    </div>`).join('');

  $('#view-todos').innerHTML = `
    <div class="page-head">
      <h2>日程活动</h2>
      <button class="btn primary" data-action="add">＋ 添加日程</button>
    </div>
    ${html || '<div class="empty">还没有日程，点右上角「添加日程」开始。</div>'}
  `;
}

/* ---------- 弹窗 / 表单 ---------- */
function openModal(todo) {
  state.editingId = todo ? todo.id : null;
  $('#modal-title').textContent = todo ? '编辑日程' : '添加日程';
  const f = $('#todo-form');
  f.reset();
  if (todo) {
    f.title.value = todo.title; f.date.value = todo.date;
    f.start.value = todo.start || ''; f.end.value = todo.end || '';
    f.location.value = todo.location || ''; f.notes.value = todo.notes || '';
  } else {
    f.date.value = fmtDate(new Date());
  }
  $('#form-error').classList.add('hidden');
  $('#modal').classList.remove('hidden');
  f.title.focus();
}
function closeModal() { $('#modal').classList.add('hidden'); state.editingId = null; }

$('#todo-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const err = $('#form-error');
  if (f.start.value && f.end.value && f.end.value <= f.start.value) {
    err.textContent = '结束时间需晚于开始时间';
    err.classList.remove('hidden');
    return;
  }
  const data = {
    title: f.title.value.trim(),
    date: f.date.value,
    start: f.start.value || '',
    end: f.end.value || '',
    location: f.location.value.trim(),
    notes: f.notes.value.trim()
  };
  if (!data.title || !data.date) return;
  if (state.editingId) {
    const t = state.todos.find((x) => x.id === state.editingId);
    Object.assign(t, data);
  } else {
    state.todos.push({ id: uid(), done: false, ...data });
  }
  saveTodos();
  closeModal();
  renderTodos();
  if (state.tab === 'home') renderHome();
});

/* ---------- 事件与路由 ---------- */
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tab');
  if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;

  if (action === 'close-modal') closeModal();
  else if (action === 'add') openModal(null);
  else if (action === 'edit') openModal(state.todos.find((t) => t.id === id));
  else if (action === 'del') {
    const t = state.todos.find((x) => x.id === id);
    if (t && confirm(`删除日程「${t.title}」？`)) {
      state.todos = state.todos.filter((x) => x.id !== id);
      saveTodos(); renderTodos(); renderHome();
    }
  }
  else if (action === 'toggle') {
    const t = state.todos.find((x) => x.id === id);
    t.done = el.checked; saveTodos(); renderTodos(); renderHome();
  }
  else if (action === 'tt-week') {
    const w = state.ttWeek + Number(el.dataset.delta);
    if (w >= 1 && w <= SEMESTER.totalWeeks) { state.ttWeek = w; renderTimetable(); }
  }
  else if (action === 'tt-now') { state.ttWeek = weekOf(new Date()) || 1; renderTimetable(); }
  else if (action === 'tt-day') { state.ttDay = Number(el.dataset.day); renderTimetable(); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + tab));
  if (tab === 'home') renderHome();
  else if (tab === 'timetable') renderTimetable();
  else renderTodos();
}

switchTab('home');
setInterval(() => { if (state.tab === 'home') renderHome(); }, 60000);
