
/* ksc-shared.js - storage, auth, and time helpers (Arabic RTL) */
(function(){
  window.$ = (id) => document.getElementById(id);

  // ---- Storage ----
  const EMP_DB_KEY = 'kscEmployees';      // { [id]: { name, pin, punches: { 'YYYY-MM-DD': [ {in:'HH:MM', out:'HH:MM'} ] } } }
  const ACTIVE_KEY = 'kscActiveEmp';       // { empId }
  function readDB(){ try { return JSON.parse(localStorage.getItem(EMP_DB_KEY)||'{}'); } catch{ return {}; } }
  function writeDB(db){ localStorage.setItem(EMP_DB_KEY, JSON.stringify(db)); }
  function getActive(){ try { return JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null'); } catch{ return null; } }
  function setActive(obj){ if(obj) localStorage.setItem(ACTIVE_KEY, JSON.stringify(obj)); else localStorage.removeItem(ACTIVE_KEY); }
  function ensureEmp(db, id){ if(!db[id]) db[id] = { name:'', pin:'', punches:{} }; if(!db[id].punches) db[id].punches={}; }

  // ---- Time helpers ----
  function pad(n){ return String(n).padStart(2,'0'); }
  function ymd(d){ return d.toISOString().slice(0,10); }
  function nowHHMM(){ const d=new Date(); return pad(d.getHours())+':'+pad(d.getMinutes()); }
  function timeToSec(hhmm){ if(!hhmm) return 0; const [h,m]=hhmm.split(':').map(Number); return h*3600+m*60; }
  function secToHHMM(sec){ sec=Math.max(0,Math.floor(sec)); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return pad(h)+':'+pad(m); }
  function sumPairs(pairs){ return (pairs||[]).reduce((acc,p)=> acc + Math.max(0, timeToSec(p.out||nowHHMM()) - timeToSec(p.in||nowHHMM())), 0); }

  // ---- Expected hours policy ----
  // Defaults: 7h Sun-Thu, Saturday optional (3h if attended), Friday off
  function expectedSecondsForDate(date, hasPunch){
    const dow = date.getDay(); // 0 Sun, 5 Fri, 6 Sat (UAE)
    if (dow>=1 && dow<=4) return 7*3600;        // Mon-Thu
    if (dow===0)            return 7*3600;      // Sun
    if (dow===6)            return hasPunch? 3*3600 : 0; // Sat optional
    return 0; // Friday
  }

  function computeRangeWorked(emp, start, end){
    let total=0; const cur=new Date(start);
    while(cur<=end){ const key=ymd(cur); total += sumPairs(emp.punches[key]||[]); cur.setDate(cur.getDate()+1); }
    return total;
  }
  function computeRangeExpected(emp, start, end){
    let total=0; const cur=new Date(start);
    while(cur<=end){
      const key=ymd(cur); const hasPunch=(emp.punches[key]||[]).length>0;
      total += expectedSecondsForDate(new Date(cur), hasPunch);
      cur.setDate(cur.getDate()+1);
    }
    return total;
  }

  // ---- Export helper ----
  function downloadCSV(rows, filename){
    const csv = rows.map(r => r.map(x => (',' in (x+'') ? '"'+(x+'').replace(/"/g,'""')+'"' : x)).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
  }

  // ---- Navbar init ----
  function initNav(activeId){
    const el = $('nav-'+activeId); if(el) el.classList.add('active');
  }

  // Expose minimal API
  window.KSC = {
    readDB, writeDB, ensureEmp, getActive, setActive,
    ymd, nowHHMM, timeToSec, secToHHMM, sumPairs,
    expectedSecondsForDate, computeRangeWorked, computeRangeExpected,
    downloadCSV, initNav
  };
})();
