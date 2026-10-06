import { 
  auth, db,
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs,
  query, orderBy, serverTimestamp, deleteDoc
} from './firebase-config.js';

// বাংলা সংখ্যা কনভার্টার
function toBn(num) {
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(num).replace(/\d/g, d => bn[d]);
}

// মোটিভেশনাল কোটস
const quotes = [
  "আপনি এই urge-এর চেয়ে অনেক শক্তিশালী। এটা একটা ঢেউ — কিছুক্ষণ পরে চলে যাবে।",
  "প্রতিদিনের ছোট ছোট জয়ই আপনাকে গড়ে তোলে। আজকের এই মুহূর্ত গুরুত্বপূর্ণ।",
  "পতন মানে ব্যর্থতা নয়। উঠে দাঁড়ানোই আসল শক্তি।",
  "আপনি একা নন। লক্ষ লক্ষ মানুষ এই যাত্রায় আপনার সাথে আছে।",
  "আপনার মস্তিষ্ক পুনর্গঠিত হচ্ছে — প্রতিদিন একটু করে। ধৈর্য রাখুন।",
  "আজ আপনি নিজের প্রতি সদয় হোন। নিজেকে ক্ষমা করুন, তারপর এগিয়ে যান।",
  "যে urge এখন আসছে, সেটা ১০ মিনিটের মধ্যে চলে যাবে। শুধু ১০ মিনিট পার করুন।",
  "আপনার ভবিষ্যতের 'আপনি' আজকের সিদ্ধান্তের জন্য কৃতজ্ঞ থাকবেন।",
  "আপনি আগেও কঠিন সময় পার করেছেন। এটাও পারবেন।",
  "শক্তি আসে সংগ্রাম থেকে, সহজ পথ থেকে নয়।"
];

// State
let currentUser = null;
let currentStreakDoc = null;
let moodValue = '';

// ============ INIT ============
async function init() {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    currentUser = user;
    await ensureStreakDoc();
    await loadStreak();
    await loadLogs();
    setupEventListeners();
  });
}

// Streak ডকুমেন্ট নিশ্চিত করা
async function ensureStreakDoc() {
  const ref = doc(db, 'users', currentUser.uid, 'streak', 'main');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      startDate: serverTimestamp(),
      bestStreak: 0,
      totalCheckins: 0,
      lastRelapse: null,
      checkins: []
    });
  }
  currentStreakDoc = ref;
}

// স্ট্রিক লোড
async function loadStreak() {
  const snap = await getDoc(currentStreakDoc);
  if (!snap.exists()) return;
  const data = snap.data();

  let startDate;
  if (data.startDate?.toDate) startDate = data.startDate.toDate();
  else startDate = new Date();

  const diffMs = Date.now() - startDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  document.getElementById('streakDays').textContent = toBn(days);
  document.getElementById('streakDetail').textContent = 
    `${toBn(days)} দিন ${toBn(hours)} ঘণ্টা · শুরু ${startDate.toLocaleDateString('bn-BD')}`;
  document.getElementById('bestStreak').textContent = toBn(data.bestStreak || 0);
  document.getElementById('totalLogs').textContent = toBn(data.totalCheckins || 0);
}

// লগ লোড
async function loadLogs() {
  const logsRef = collection(db, 'users', currentUser.uid, 'logs');
  const q = query(logsRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  const list = document.getElementById('historyList');
  if (snap.empty) {
    list.innerHTML = '<p class="text-slate-500 text-sm text-center py-8">এখনো কোনো লগ নেই। প্রথম লগ যোগ করুন।</p>';
    return;
  }

  const moodEmoji = { great:'😄', good:'🙂', ok:'😐', low:'😔', urge:'😰' };
  const moodBn = { great:'দুর্দান্ত', good:'ভালো', ok:'ঠিকঠাক', low:'নিম্ন', urge:'তীব্র urge' };

  list.innerHTML = '';
  snap.forEach(d => {
    const data = d.data();
    const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
    const dateStr = date.toLocaleDateString('bn-BD', { day:'numeric', month:'short', year:'numeric' });
    const timeStr = date.toLocaleTimeString('bn-BD', { hour:'2-digit', minute:'2-digit' });

    const el = document.createElement('div');
    el.className = 'p-3 rounded-xl bg-slate-950 border border-slate-800 flex gap-3 items-start';
    el.innerHTML = `
      <div class="text-2xl">${moodEmoji[data.mood] || '📝'}</div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start gap-2">
          <p class="text-sm font-semibold">${moodBn[data.mood] || 'লগ'}</p>
          <span class="text-xs text-slate-500 whitespace-nowrap">${dateStr}</span>
        </div>
        ${data.trigger ? `<p class="text-xs text-slate-400 mt-1">🎯 ${escapeHtml(data.trigger)}</p>` : ''}
        ${data.note ? `<p class="text-xs text-slate-500 mt-1">${escapeHtml(data.note)}</p>` : ''}
        <p class="text-xs text-slate-600 mt-1">${timeStr}</p>
      </div>
    `;
    list.appendChild(el);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
  // Mood buttons
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('ring-2','ring-indigo-500'));
      btn.classList.add('ring-2','ring-indigo-500');
      moodValue = btn.dataset.mood;
      document.getElementById('mood').value = moodValue;
    });
  });

  // Log form
  document.getElementById('logForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const trigger = document.getElementById('trigger').value.trim();
    const note = document.getElementById('note').value.trim();

    if (!moodValue && !trigger && !note) {
      alert('অন্তত একটা তথ্য দিন।');
      return;
    }

    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'logs'), {
        mood: moodValue,
        trigger, note,
        createdAt: serverTimestamp()
      });
      document.getElementById('logForm').reset();
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('ring-2','ring-indigo-500'));
      moodValue = '';
      await loadLogs();
    } catch (err) {
      alert('লগ সংরক্ষণে সমস্যা: ' + err.message);
    }
  });

  // Check-in
  document.getElementById('checkinBtn').addEventListener('click', async () => {
    const snap = await getDoc(currentStreakDoc);
    const data = snap.data();
    const checkins = data.checkins || [];
    const today = new Date().toISOString().split('T')[0];

    if (checkins.includes(today)) {
      alert('আজ ইতিমধ্যে চেক-ইন করেছেন ✅');
      return;
    }

    checkins.push(today);
    const startDate = data.startDate?.toDate?.() || new Date();
    const currentDays = Math.floor((Date.now() - startDate.getTime()) / 86400000);
    const best = Math.max(data.bestStreak || 0, currentDays);

    await updateDoc(currentStreakDoc, {
      checkins,
      totalCheckins: (data.totalCheckins || 0) + 1,
      bestStreak: best
    });

    alert('দারুণ! আজকের দিনটা কাটিয়ে গেলেন 🎉');
    await loadStreak();
  });

  // Relapse
  document.getElementById('relapseBtn').addEventListener('click', async () => {
    if (!confirm('নিশ্চিত? আপনার স্ট্রিক আবার শুরু থেকে গণনা হবে। এটা ব্যর্থতা নয় — এটা নতুন শুরু।')) return;

    const snap = await getDoc(currentStreakDoc);
    const data = snap.data();
    const startDate = data.startDate?.toDate?.() || new Date();
    const currentDays = Math.floor((Date.now() - startDate.getTime()) / 86400000);
    const best = Math.max(data.bestStreak || 0, currentDays);

    await updateDoc(currentStreakDoc, {
      startDate: serverTimestamp(),
      bestStreak: best,
      lastRelapse: serverTimestamp()
    });

    alert('আবার শুরু করুন। আপনি পারেন। 💙');
    await loadStreak();
  });

  // Emergency
  document.getElementById('emergencyBtn').addEventListener('click', openEmergency);
  document.getElementById('closeEmergency').addEventListener('click', () => {
    document.getElementById('emergencyModal').classList.add('hidden');
  });

  document.getElementById('newQuote').addEventListener('click', showRandomQuote);

  // Breathing
  document.getElementById('startBreath').addEventListener('click', startBreathing);
}

function openEmergency() {
  document.getElementById('emergencyModal').classList.remove('hidden');
  showRandomQuote();
}

function showRandomQuote() {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById('emergencyQuote').textContent = '"' + q + '"';
}

// Breathing exercise 4-7-8
let breathingActive = false;
function startBreathing() {
  if (breathingActive) return;
  breathingActive = true;
  const text = document.getElementById('breathText');
  const phases = [
    { name: 'শ্বাস নিন (৪ সেকেন্ড)', duration: 4 },
    { name: 'ধরে রাখুন (৭ সেকেন্ড)', duration: 7 },
    { name: 'ছাড়ুন (৮ সেকেন্ড)', duration: 8 }
  ];
  let phaseIdx = 0;
  let countdown = phases[0].duration;

  const tick = () => {
    if (!breathingActive) return;
    if (countdown === 0) {
      phaseIdx = (phaseIdx + 1) % phases.length;
      countdown = phases[phaseIdx].duration;
    }
    text.textContent = phases[phaseIdx].name + ' · ' + toBn(countdown);
    countdown--;
    setTimeout(tick, 1000);
  };
  tick();
}

init();
