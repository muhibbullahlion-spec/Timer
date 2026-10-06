import { 
  auth, db, googleProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile,
  doc, setDoc, getDoc, serverTimestamp
} from './firebase-config.js';

// বাংলায় error message map
const errorMap = {
  'auth/email-already-in-use': 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে।',
  'auth/invalid-email': 'ইমেইলটা সঠিক নয়।',
  'auth/weak-password': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
  'auth/user-not-found': 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই।',
  'auth/wrong-password': 'পাসওয়ার্ড ভুল হয়েছে।',
  'auth/invalid-credential': 'ইমেইল বা পাসওয়ার্ড ভুল।',
  'auth/too-many-requests': 'অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
  'auth/popup-closed-by-user': 'লগইন উইন্ডো বন্ধ করা হয়েছে।',
  'auth/network-request-failed': 'নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করুন।'
};

function showError(msg) {
  const el = document.getElementById('errorMsg');
  if (el) {
    el.textContent = msg;
    el.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function clearError() {
  const el = document.getElementById('errorMsg');
  if (el) el.classList.add('hidden');
}

function setLoading(loading) {
  const btn = document.getElementById('submitBtn');
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'একটু অপেক্ষা করুন...' : btn.dataset.originalText || btn.textContent;
}

// ইউজার ডকুমেন্ট তৈরি (প্রথমবার লগইনের সময়)
async function ensureUserDoc(user, name = '') {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      name: name || user.displayName || 'বন্ধু',
      email: user.email,
      createdAt: serverTimestamp(),
      streakStart: serverTimestamp(),
      bestStreak: 0,
      lastRelapse: null
    });
  }
  return userRef;
}

// ============ SIGNUP ============
export async function handleSignup(e) {
  e.preventDefault();
  clearError();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirmPassword').value;

  if (password !== confirm) {
    showError('পাসওয়ার্ড দুটো মিলছে না।');
    return;
  }

  setLoading(true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    await ensureUserDoc(cred.user, name);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showError(errorMap[err.code] || err.message);
  } finally {
    setLoading(false);
  }
}

// ============ LOGIN ============
export async function handleLogin(e) {
  e.preventDefault();
  clearError();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  setLoading(true);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(cred.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showError(errorMap[err.code] || err.message);
  } finally {
    setLoading(false);
  }
}

// ============ GOOGLE ============
export async function handleGoogle() {
  clearError();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showError(errorMap[err.code] || err.message);
  }
}

// ============ LOGOUT ============
export async function handleLogout() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (err) {
    console.error('Logout error:', err);
  }
}

window.handleLogout = handleLogout;
