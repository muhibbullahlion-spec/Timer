import { auth, onAuthStateChanged } from './firebase-config.js';

// এই ফাইলটা dashboard.html-এ লোড হবে
// ইউজার লগইন না থাকলে login পেজে পাঠাবে
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'login.html';
  } else {
    document.body.classList.remove('opacity-0');
    // ইউজার info গ্লোবালি অ্যাক্সেসযোগ্য
    window.currentUser = user;
    // UI-তে নাম বসান
    const nameEls = document.querySelectorAll('[data-user-name]');
    nameEls.forEach(el => el.textContent = user.displayName || 'বন্ধু');
    const emailEls = document.querySelectorAll('[data-user-email]');
    emailEls.forEach(el => el.textContent = user.email);
  }
});
