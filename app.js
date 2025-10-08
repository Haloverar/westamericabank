/* Westamericanbank - Static demo client
 - Balance is fixed to START_BALANCE
 - Loads transactions from transactions.csv (local)
 - Send Money always fails (safe demo) and shows email preview + opens support chat
 - Chat is simulated with canned replies
*/

const START_BALANCE = $4562720.00; // required balance
const TX_CSV = 'transactions.csv'; // must be present (in same folder)
const demoCred = { email: 'tyboigram@gmail.com.local', pass: 'password123', name: 'Demo User' };

const $ = sel => document.querySelector(sel);
const fmt = n => Number(n).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});

let txs = []; // CSV transactions (newest-first)
let persisted = []; // any local simulated txs (newest-first)

// UI helpers
function show(el){ if(el) el.classList.remove('hidden'); }
function hide(el){ if(el) el.classList.add('hidden'); }

// Load CSV file located in same folder
async function loadCSV(url){
  try {
    const r = await fetch(url);
    const txt = await r.text();
    const lines = txt.trim().split('\n');
    lines.shift(); // header
    return lines.map(l => {
      const [date,type,amount,counterparty,description] = l.split(',');
      return { date, type, amount: parseFloat(amount), counterparty, description };
    });
  } catch (e) {
    console.error('CSV load failed', e);
    return [];
  }
}

// Render transaction table (newest-first)
function renderTxTable(){
  const tbody = $('#txTable tbody');
  tbody.innerHTML = '';
  // combine persisted (newest) then CSV (newest)
  const all = persisted.concat(txs);
  let cur = START_BALANCE;
  all.forEach(t => {
    const tr = document.createElement('tr');
    const amtText = (t.type === 'inflow' ? '+' : '-') + '$' + fmt(t.amount);
    tr.innerHTML = `<td>${t.date}</td><td>${t.description}</td><td>${t.type}</td><td class="amount-col">${amtText}</td><td class="rb-col">$${fmt(cur)}</td>`;
    tbody.appendChild(tr);
    if (t.type === 'inflow') cur -= t.amount;
    else cur += t.amount;
  });
}

// simulate email preview after failed transfer
function showEmailPreview(to, name){
  $('#emailTo').textContent = to;
  $('#emailName').textContent = name || 'Customer';
  $('#emailDate').textContent = new Date().toLocaleString();
  show($('#emailPreview'));
}

// Chat simulation
function openChat(){
  show($('#chatWidget'));
  const body = $('#chatBody');
  // add a bot greeting after small delay
  setTimeout(()=> {
    const el = document.createElement('div'); el.className='bot-msg'; el.textContent = 'A member of Customer Care will be with you shortly (prototype). Meanwhile, try: "Why did my transfer fail?"';
    body.appendChild(el); body.scrollTop = body.scrollHeight;
  }, 300);
}

// handle chat send
function chatSend(msg){
  const body = $('#chatBody');
  const u = document.createElement('div'); u.className='user-msg'; u.textContent = msg;
  body.appendChild(u);
  body.scrollTop = body.scrollHeight;
  // canned bot responses
  setTimeout(()=> {
    const bot = document.createElement('div'); bot.className='bot-msg';
    const lower = msg.toLowerCase();
    if (lower.includes('why')) bot.textContent = 'Transfers are disabled in prototype mode. This site is for practice; no live banking occurs.';
    else if (lower.includes('help')) bot.textContent = 'You can view the email preview or download transactions. Contact support@westamericanbank.example (simulated).';
    else bot.textContent = 'Thanks for the message — this is a simulated support chat for prototype demos.';
    body.appendChild(bot);
    body.scrollTop = body.scrollHeight;
  }, 700);
}

// Send button behavior — always fail safely
function handleSend(){
  const to = $('#sendEmail').value.trim();
  const amt = parseFloat($('#sendAmount').value);
  const msgEl = $('#sendMsg');
  msgEl.textContent = '';
  if (!to || isNaN(amt) || amt <= 0){ msgEl.textContent = 'Enter a valid recipient and amount.'; return; }
  // Show error (safe)
  msgEl.textContent = 'Transfer cannot be completed (prototype mode). A follow-up email has been generated and Customer Care is available.';
  // show simulated email preview
  showEmailPreview(to, to.split('@')[0] || 'Customer');
  // open chat
  openChat();
  // store failed attempt record (so it appears in transactions as failed)
  const now = new Date().toISOString().slice(0,10);
  const failedTx = { date: now, type: 'outflow', amount: amt, counterparty: to, description: `Failed transfer to ${to}` };
  const failed = JSON.parse(localStorage.getItem('wa_failed_tx') || '[]');
  failed.unshift(failedTx);
  localStorage.setItem('wa_failed_tx', JSON.stringify(failed));
  persisted = failed.concat(JSON.parse(localStorage.getItem('wa_local_tx') || '[]'));
  renderTxTable();
}

// update displayed balance (START_BALANCE remains the same)
function updateDisplayedBalance(){
  $('#balance').textContent = '$' + fmt(START_BALANCE);
}

// download CSV (combined)
function downloadCSV(){
  const failed = JSON.parse(localStorage.getItem('wa_failed_tx') || '[]');
  const rows = [];
  failed.forEach(p => rows.push([p.date,p.type,p.amount.toFixed(2),p.counterparty,p.description].join(',')));
  txs.forEach(t => rows.push([t.date,t.type,t.amount.toFixed(2),t.counterparty,t.description].join(',')));
  const csv = ['date,type,amount,counterparty,description'].concat(rows).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions_combined.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// init
async function init(){
  txs = await loadCSV(TX_CSV); // newest-first expected
  persisted = JSON.parse(localStorage.getItem('wa_failed_tx') || '[]').concat(JSON.parse(localStorage.getItem('wa_local_tx') || '[]'));
  renderTxTable();
  updateDisplayedBalance();
  // session: if logged in
  if (localStorage.getItem('wa_logged_in')) {
    show($('#dashboard')); hide($('#landing'));
    const email = JSON.parse(localStorage.getItem('wa_logged_in')).email;
    $('#userName').textContent = (email === demoCred.email ? demoCred.name : email);
    init();
  } else {
    hide($('#dashboard')); show($('#landing'));
  }
}

// event listeners
document.addEventListener('click', (e)=>{
  if (e.target.id === 'demoLogin'){
    localStorage.setItem('wa_logged_in', JSON.stringify({ email: demoCred.email }));
    $('#userName').textContent = demoCred.name;
    show($('#dashboard')); hide($('#landing'));
    init();
  } else if (e.target.id === 'guestLogin'){
    localStorage.setItem('wa_logged_in', JSON.stringify({ email: 'guest@local' }));
    $('#userName').textContent = 'Guest';
    show($('#dashboard')); hide($('#landing'));
    init();
  } else if (e.target.id === 'logout'){
    localStorage.removeItem('wa_logged_in');
    hide($('#dashboard')); show($('#landing'));
  } else if (e.target.id === 'openSend'){
    show($('#sendPanel'));
  } else if (e.target.id === 'cancelSend'){
    hide($('#sendPanel'));
  } else if (e.target.id === 'sendNow'){
    handleSend();
  } else if (e.target.id === 'downloadCsv'){
    downloadCSV();
  } else if (e.target.id === 'openSupport'){
    openChat();
  } else if (e.target.id === 'closeChat'){
    hide($('#chatWidget'));
  } else if (e.target.id === 'chatSend'){
    const v = $('#chatIn').value.trim();
    if (v) { chatSend(v); $('#chatIn').value=''; }
  }
});

// keyboard enter on chat input
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter' && document.activeElement === $('#chatIn')){
    const v = $('#chatIn').value.trim();
    if (v) { chatSend(v); $('#chatIn').value=''; e.preventDefault(); }
  }
});

// floating bubble click to open chat
document.addEventListener('DOMContentLoaded', ()=>{
  // create bubble
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.title = 'Customer Care';
  bubble.innerHTML = '<span>WA</span>';
  document.body.appendChild(bubble);
  bubble.addEventListener('click', () => {
    openChat();
  });

  // wire chat close
  document.getElementById('closeChat').addEventListener('click', ()=>{ hide($('#chatWidget')); });

  // chat send
  document.getElementById('chatSend').addEventListener('click', ()=> {
    const v = $('#chatIn').value.trim();
    if (v) { chatSend(v); $('#chatIn').value=''; }
  });

  init();
});
