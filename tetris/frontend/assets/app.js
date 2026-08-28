const API = '/api';
const COLS = 10;
const ROWS = 20;
const SHAPES = [
  { color: '#68d4d1', cells: [[0,1],[1,1],[2,1],[3,1]] },
  { color: '#f3c858', cells: [[0,0],[1,0],[0,1],[1,1]] },
  { color: '#a99bef', cells: [[1,0],[0,1],[1,1],[2,1]] },
  { color: '#f47761', cells: [[0,0],[0,1],[1,1],[2,1]] },
  { color: '#c7ed62', cells: [[2,0],[0,1],[1,1],[2,1]] },
  { color: '#eaa4cc', cells: [[1,0],[2,0],[0,1],[1,1]] },
  { color: '#75a9ee', cells: [[0,0],[1,0],[1,1],[2,1]] }
];
let board = []; let active = null; let next = null; let timer = null; let running = false;
let score = 0; let lines = 0; let level = 1; let token = localStorage.getItem('tetris_token'); let authMode = 'login';
const $ = (id) => document.getElementById(id);

function newBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function randomPiece() { const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]; return { ...shape, cells: shape.cells.map(([x,y]) => [x,y]), x: 3, y: 0 }; }
function rotate(piece) { return { ...piece, cells: piece.cells.map(([x,y]) => [-y, x]), x: piece.x, y: piece.y }; }
function canPlace(piece) { return piece.cells.every(([x,y]) => { const px = piece.x + x; const py = piece.y + y; return px >= 0 && px < COLS && py >= 0 && py < ROWS && !board[py][px]; }); }
function render() {
  const ghost = active ? { ...active, y: active.y } : null;
  if (ghost) while (canPlace({ ...ghost, y: ghost.y + 1 })) ghost.y++;
  const cells = $('board').children;
  for (let y=0; y<ROWS; y++) for (let x=0; x<COLS; x++) {
    const node = cells[y * COLS + x]; node.className = 'cell'; node.style.removeProperty('--piece-color');
    if (board[y][x]) { node.classList.add('filled'); node.style.setProperty('--piece-color', board[y][x]); }
  }
  if (ghost) ghost.cells.forEach(([x,y]) => { const node = cells[(ghost.y+y)*COLS+ghost.x+x]; if (node && !board[ghost.y+y][ghost.x+x]) { node.classList.add('ghost'); node.style.setProperty('--piece-color', ghost.color); } });
  if (active) active.cells.forEach(([x,y]) => { const node = cells[(active.y+y)*COLS+active.x+x]; if (node) { node.classList.remove('ghost'); node.classList.add('filled'); node.style.setProperty('--piece-color', active.color); } });
  $('score').textContent = String(score).padStart(6, '0'); $('lines').textContent = String(lines).padStart(2, '0'); $('level').textContent = String(level).padStart(2, '0');
  renderNext();
}
function renderNext() { const target = $('next-piece'); target.innerHTML = ''; for (let i=0;i<16;i++) target.appendChild(document.createElement('span')); if (!next) return; next.cells.forEach(([x,y]) => { const node = target.children[(y+1)*4 + x]; if (node) { node.style.background = next.color; node.style.boxShadow = 'inset 0 -3px rgba(0,0,0,.15)'; } }); }
function lockPiece() { active.cells.forEach(([x,y]) => { board[active.y+y][active.x+x] = active.color; }); clearLines(); active = next || randomPiece(); next = randomPiece(); if (!canPlace(active)) endGame(); }
function clearLines() { const remaining = board.filter(row => row.some(cell => !cell)); const cleared = ROWS - remaining.length; while (remaining.length < ROWS) remaining.unshift(Array(COLS).fill(null)); board = remaining; if (cleared) { lines += cleared; score += [0,100,300,500,800][cleared] * level; level = Math.floor(lines / 10) + 1; resetTimer(); } }
function tick() { if (!running) return; const moved = { ...active, y: active.y + 1 }; if (canPlace(moved)) active = moved; else lockPiece(); render(); }
function resetTimer() { clearInterval(timer); timer = setInterval(tick, Math.max(110, 720 - (level-1)*55)); }
function move(dx) { if (!running) return; const moved = { ...active, x: active.x + dx }; if (canPlace(moved)) active = moved; render(); }
function hardDrop() { if (!running) return; let distance=0; while (canPlace({ ...active, y: active.y + 1 })) { active = { ...active, y: active.y + 1 }; distance++; } score += distance * 2; lockPiece(); render(); }
function startGame() { if (!token) { openModal(); $('session-message').textContent = '로그인 후 기록을 저장할 수 있습니다.'; return; } board = newBoard(); score=0; lines=0; level=1; active=randomPiece(); next=randomPiece(); running=true; $('game-status').textContent='PLAYING'; $('start-button').textContent='게임 중'; $('session-message').textContent='좋은 낙하를 만들어보세요.'; resetTimer(); render(); }
async function endGame() { running=false; clearInterval(timer); $('game-status').textContent='GAME OVER'; $('start-button').textContent='다시 시작'; $('session-message').textContent='게임이 종료되었습니다. 기록을 저장하는 중...'; try { await api('/games/records', { method:'POST', body: JSON.stringify({ score, lines_cleared:lines, level }) }); $('last-score').textContent = String(score).padStart(6,'0'); $('session-message').textContent='기록이 저장되었습니다. 다시 도전해보세요.'; await loadHighest(); } catch (error) { if (error.status === 401) { token=null; localStorage.removeItem('tetris_token'); } $('session-message').textContent = error.message || '기록 저장에 실패했습니다.'; } }
async function api(path, options={}) { const headers = { 'Content-Type':'application/json', ...(options.headers || {}) }; if (token) headers.Authorization = `Bearer ${token}`; const response = await fetch(API + path, { ...options, headers }); const data = await response.json().catch(() => null); if (!response.ok) { const error = new Error(data?.detail || '요청에 실패했습니다.'); error.status=response.status; throw error; } return data; }
async function loadHighest() { try { const data=await api('/scores/highest'); $('global-score').textContent=data ? String(data.score).padStart(6,'0') : '------'; $('global-player').textContent=data ? data.email : '아직 기록이 없습니다'; } catch { $('global-score').textContent='------'; $('global-player').textContent='서버에 연결할 수 없습니다'; } }
function openModal() { $('auth-modal').classList.remove('hidden'); $('email').focus(); }
function closeModal() { $('auth-modal').classList.add('hidden'); $('form-message').textContent=''; }
function setAuthMode(mode) { authMode=mode; document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mode===mode)); $('auth-title').textContent=mode==='login' ? '아레나에 입장하세요.' : '플레이어를 등록하세요.'; $('auth-submit').textContent=mode==='login' ? '로그인' : '회원가입'; $('password').autocomplete=mode==='login' ? 'current-password' : 'new-password'; $('form-message').textContent=''; }
async function submitAuth(event) { event.preventDefault(); const message=$('form-message'); message.textContent='처리 중...'; try { if (authMode==='register') { await api('/auth/register', {method:'POST', body:JSON.stringify({email:$('email').value, password:$('password').value})}); setAuthMode('login'); message.textContent='가입되었습니다. 로그인해주세요.'; return; } const data=await api('/auth/login', {method:'POST', body:JSON.stringify({email:$('email').value, password:$('password').value})}); token=data.access_token; localStorage.setItem('tetris_token', token); closeModal(); updateAuthButton(); $('session-message').textContent='로그인되었습니다. 게임을 시작해보세요.'; } catch (error) { message.textContent=error.message; } }
function updateAuthButton() { $('auth-button').textContent=token ? '로그아웃' : '로그인'; }
function init() { for (let i=0;i<ROWS*COLS;i++) { const cell=document.createElement('div'); cell.className='cell'; cell.setAttribute('role','gridcell'); $('board').appendChild(cell); } board=newBoard(); render(); loadHighest(); updateAuthButton(); setInterval(() => $('clock').textContent=new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}), 1000); }
document.addEventListener('keydown', event => { if (event.key==='ArrowLeft') move(-1); if (event.key==='ArrowRight') move(1); if (event.key==='ArrowDown') tick(); if (event.key==='ArrowUp' && running) { const turned=rotate(active); if (canPlace(turned)) active=turned; render(); } if (event.code==='Space') { event.preventDefault(); hardDrop(); } });
$('start-button').addEventListener('click', startGame); $('auth-button').addEventListener('click', () => { if (token) { token=null; localStorage.removeItem('tetris_token'); updateAuthButton(); $('session-message').textContent='로그아웃되었습니다.'; } else openModal(); }); $('close-modal').addEventListener('click', closeModal); $('auth-modal').addEventListener('click', event => { if (event.target.id==='auth-modal') closeModal(); }); document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => setAuthMode(tab.dataset.mode))); $('auth-form').addEventListener('submit', submitAuth); init();
