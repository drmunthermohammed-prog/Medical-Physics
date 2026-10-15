/* =========================================================
   awards.js - وظائف صفحة جوائز الدفعة
   ========================================================= */

// ===== عناصر DOM =====
const awardsContainer = document.getElementById('awardsContainer');
const votedCountEl = document.getElementById('votedCount');
const totalCountEl = document.getElementById('totalCount');
const progressFill = document.getElementById('progressFill');
const allVotedMessage = document.getElementById('allVotedMessage');
const resetVotesBtn = document.getElementById('resetVotesBtn');
const loadingToast = document.getElementById('loadingToast');

// ===== مفتاح التخزين =====
const STORAGE_KEY = 'awards_votes_2027';

// ===== تحميل الأصوات المحفوظة =====
function loadLocalVotes() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
}

// ===== حفظ صوت محلي =====
function saveLocalVote(awardId, studentId) {
    const votes = loadLocalVotes();
    votes[awardId] = studentId;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
    } catch (e) {}
}

// ===== إعادة تعيين =====
function resetLocalVotes() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
}

// ===== البحث عن طالب =====
function getStudent(studentId) {
    return students.find(s => s.id === studentId);
}

// ===== حساب إجمالي الأصوات =====
function getTotalVotes(nominees) {
    return nominees.reduce((sum, n) => sum + (n.votes || 0), 0);
}

// ===== ترتيب المرشحين حسب الأصوات =====
function sortNominees(nominees) {
    return [...nominees].sort((a, b) => (b.votes || 0) - (a.votes || 0));
}

// ===== رسم صفحة الجوائز =====
function renderAwards() {
    awardsContainer.innerHTML = '';
    const localVotes = loadLocalVotes();
    
    // تحديث العدادات
    totalCountEl.textContent = awards.length;
    const votedCount = Object.keys(localVotes).length;
    votedCountEl.textContent = votedCount;
    
    const progress = awards.length > 0 ? (votedCount / awards.length) * 100 : 0;
    progressFill.style.width = progress + '%';
    
    // إذا صوّت في كل الفئات
    if (votedCount === awards.length && awards.length > 0) {
        allVotedMessage.classList.add('active');
        setTimeout(() => triggerConfetti(), 400);
    } else {
        allVotedMessage.classList.remove('active');
    }
    
    // رسم كل جائزة
    awards.forEach((award, index) => {
        const categoryEl = createAwardCard(award, localVotes);
        categoryEl.style.animationDelay = (index * 0.08) + 's';
        awardsContainer.appendChild(categoryEl);
    });
}

// ===== إنشاء بطاقة جائزة =====
function createAwardCard(award, localVotes) {
    const category = document.createElement('section');
    category.className = 'award-category';
    category.style.setProperty('--award-color', award.color || '#38bdf8');
    
    const sorted = sortNominees(award.nominees);
    const totalVotes = getTotalVotes(award.nominees);
    const userVote = localVotes[award.id];
    const hasVoted = userVote !== undefined;
    
    // ترويسة الجائزة
    const header = `
        <div class="award-header">
            <div class="award-icon">${award.icon}</div>
            <div class="award-title-wrap">
                <h3 class="award-title">${award.title}</h3>
                <div class="award-meta">${totalVotes.toLocaleString('ar-EG')} صوت إجمالي • ${award.nominees.length} مرشح</div>
            </div>
        </div>
    `;
    
    // المرشحون
    const nomineesHtml = sorted.map((nominee, idx) => {
        const student = getStudent(nominee.studentId);
        if (!student) return '';
        
        const percentage = totalVotes > 0 ? (nominee.votes / totalVotes) * 100 : 0;
        const isWinner = idx === 0 && totalVotes > 0;
        const isUserVoted = userVote === nominee.studentId;
        
        return `
            <div class="nominee ${isWinner ? 'is-winner' : ''} ${isUserVoted ? 'is-voted' : ''}" 
                 data-student-id="${student.id}"
                 data-award-id="${award.id}">
                <div class="nominee-photo">
                    <img src="${student.adultImg || student.childImg}" 
                         alt="${student.name}"
                         onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%231e3a8a%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2258%22 font-size=%2235%22 fill=%22%237dd3fc%22 text-anchor=%22middle%22>?</text></svg>'">
                    ${isWinner ? '<div class="crown">👑</div>' : ''}
                </div>
                <div class="nominee-info">
                    <div class="nominee-name">${student.name}</div>
                    <div class="nominee-job">${student.jobTitle || 'خريج فيزياء طبية'}</div>
                    <div class="vote-bar">
                        <div class="vote-fill" data-width="${percentage}"></div>
                        <span class="vote-count">${nominee.votes} صوت</span>
                    </div>
                </div>
                <button class="vote-btn ${isUserVoted ? 'voted' : ''}" 
                        data-award-id="${award.id}"
                        data-student-id="${student.id}"
                        ${hasVoted ? 'disabled' : ''}>
                    ${isUserVoted ? 'صوتك' : (hasVoted ? 'صوّتت' : 'صوّت')}
                </button>
            </div>
        `;
    }).join('');
    
    category.innerHTML = header + `<div class="nominees">${nomineesHtml}</div>`;
    
    // تشغيل حركة أشرطة الأصوات بعد الرسم
    setTimeout(() => {
        category.querySelectorAll('.vote-fill').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
        });
    }, 150);
    
    // ربط أحداث التصويت
    category.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.disabled) return;
            handleVote(award.id, parseInt(btn.dataset.studentId), btn);
        });
    });
    
    return category;
}

// ===== معالجة التصويت =====
function handleVote(awardId, studentId, btnElement) {
    const currentVotes = loadLocalVotes();
    
    // التحقق من عدم التصويت مسبقاً
    if (currentVotes[awardId] !== undefined) {
        showToast('⚠️ صوّتت في هذه الجائزة مسبقاً', 'error');
        return;
    }
    
    // حفظ الصوت
    saveLocalVote(awardId, studentId);
    
    // رسم صغير للاحتفال
    triggerMiniConfetti(btnElement);
    
    // إعادة رسم الصفحة كاملة لتحديث الشريط
    setTimeout(() => {
        renderAwards();
        showToast('✅ تم تسجيل صوتك!', 'success');
    }, 200);
}

// ===== رسالة Toast =====
let toastTimeout;
function showToast(message, type = '') {
    clearTimeout(toastTimeout);
    loadingToast.textContent = message;
    loadingToast.className = 'loading-toast show ' + type;
    toastTimeout = setTimeout(() => {
        loadingToast.classList.remove('show');
    }, 2500);
}

// ===== احتفال كامل =====
function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#d4af37', '#fbbf24', '#b8860b', '#38bdf8', '#ffffff'];
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000, colors };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 60 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// ===== احتفال صغير عند ضغط زر =====
function triggerMiniConfetti(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
        particleCount: 25,
        spread: 60,
        startVelocity: 25,
        origin: { x, y },
        colors: ['#d4af37', '#fbbf24', '#38bdf8', '#a855f7'],
        zIndex: 2000,
        scalar: 0.8
    });
}

// ===== إعادة التصويت =====
resetVotesBtn.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من إعادة التصويت؟ سيتم حذف جميع أصواتك المحلية.')) {
        resetLocalVotes();
        allVotedMessage.classList.remove('active');
        renderAwards();
        showToast('🔄 تم إعادة التصويت', 'success');
    }
});

// ===== تشغيل أولي =====
renderAwards();