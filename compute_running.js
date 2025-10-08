// Node.js script (requires Node 12+). Usage: node compute_running.js
const fs = require('fs');
const START_BALANCE = 4562720.00; // final/current balance you want

function parseCSV(text){
  const lines = text.trim().split(/\r?\n/).filter(l=>l.trim());
  const hdr = lines.shift().split(',');
  return lines.map(l => {
    const parts = l.split(',');
    const date = parts[0];
    const type = parts[1];
    const amount = parseFloat(parts[2]);
    const counterparty = parts[3];
    const description = parts.slice(4).join(',');
    return { date, type, amount, counterparty, description, raw: l };
  });
}

try {
  const txt = fs.readFileSync('transactions.csv', 'utf8');
  const rowsNewestFirst = parseCSV(txt); // newest-first
  const rowsChron = rowsNewestFirst.slice().reverse(); // oldest-first

  // compute net effect of chronological transactions: inflow adds, outflow subtracts
  let net = 0;
  for (const r of rowsChron) {
    net += (r.type === 'inflow') ? r.amount : -r.amount;
  }

  // starting balance at oldest = final START_BALANCE - net
  let running = parseFloat((START_BALANCE - net).toFixed(2));

  // compute running after each chronological transaction (balance after applying that tx)
  const chronologyWithRunning = [];
  for (const r of rowsChron) {
    if (r.type === 'inflow') running = +(running + r.amount).toFixed(2);
    else running = +(running - r.amount).toFixed(2);
    chronologyWithRunning.push({...r, running});
  }

  // produce newest-first output with running_balance column
  const newestWithRunning = chronologyWithRunning.slice().reverse();
  const outLines = ['date,type,amount,counterparty,description,running_balance'];
  for (const r of newestWithRunning) {
    const desc = r.description.includes(',') ? `"${r.description.replace(/"/g,'""')}"` : r.description;
    outLines.push([r.date, r.type, r.amount.toFixed(2), r.counterparty, desc, r.running.toFixed(2)].join(','));
  }
  fs.writeFileSync('transactions_with_running.csv', outLines.join('\n'), 'utf8');
  console.log('transactions_with_running.csv written. Final running balance (newest row):', newestWithRunning[0].running.toFixed(2));
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
