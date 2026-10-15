/* =========================================================
   main.js - وظائف الصفحة الرئيسية
   ========================================================= */

// ===== متغيرات عامة =====
let currentStudentIndex = 0;
let currentFilteredStudents = [];

// ===== عناصر DOM =====
const grid = document.getElementById('studentGrid');
const searchInput = document.getElementById('searchInput');
const studentCountEl = document.getElementById('studentCount');
const modal = document.getElementById('studentModal');
const modalCard = document.getElementById('modalCard');
const closeModalBtn = document.getElementById('closeModal');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const studentCounter = document.getElementById('studentCounter');

const modalChildImg = document.getElementById('modalChildImg');
const modalAdultImg = document.getElementById('modalAdultImg');
const modalChildName = document.getElementById('modalChildName');
const modalAdultName = document.getElementById('modalAdultName');
const modalAdultJob = document.getElementById('modalAdultJob');
const modalAdultMessage = document.getElementById('modalAdultMessage');

// ===== عرض الشبكة =====
function renderGrid(filterText = '') {
    grid.innerHTML = '';
    currentFilteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(filterText.toLowerCase())
    );

    studentCountEl.textContent = `${currentFilteredStudents.length} / ${students.length}`;

    if (currentFilteredStudents.length === 0) {
        grid.innerHTML = '<div class="no-results"><span>🔍</span>لا يوجد طالب بهذا الاسم</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    currentFilteredStudents.forEach((student, index) => {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.style.animationDelay = Math.min(index * 0.015, 1.2) + 's';
        item.innerHTML = `
            <div class="photo-wrap">
                <img src="${student.childImg}" alt="${student.name}" loading="lazy" 
                     onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%231e3a8a%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2258%22 font-size=%2235%22 fill=%22%237dd3fc%22 text-anchor=%22middle%22>?</text></svg>'">
                <div class="mini-number">${student.id}</div>
            </div>
            <div class="name-strip" title="${student.name}">${student.name}</div>
        `;
        item.addEventListener('click', () => openModal(index));
        fragment.appendChild(item);
    });
    grid.appendChild(fragment);
}

// ===== البحث =====
searchInput.addEventListener('input', (e) => {
    renderGrid(e.target.value.trim());
});

// ===== فتح نافذة الطالب =====
function openModal(index) {
    currentStudentIndex = index;
    const student = currentFilteredStudents[index];
    
    modalChildImg.src = student.childImg;
    modalAdultImg.src = student.adultImg;
    modalChildName.textContent = student.name;
    modalAdultName.textContent = student.name;
    modalAdultJob.textContent = student.jobTitle || 'خريج فيزياء طبية';
    modalAdultMessage.textContent = student.message || '';
    
    if (!student.message) {
        modalAdultMessage.style.display = 'none';
    } else {
        modalAdultMessage.style.display = 'block';
    }
    
    // ⬇️ جديد: عرض الجوائز
    const awardsContainer = document.getElementById('modalAdultAwards');
    if (awardsContainer) {
        if (student.awards && student.awards.length > 0) {
            awardsContainer.innerHTML = student.awards.map(award => 
                `<span class="modal-award-badge">${award}</span>`
            ).join('');
            awardsContainer.style.display = 'flex';
        } else {
            awardsContainer.innerHTML = '';
            awardsContainer.style.display = 'none';
        }
    }
    
    studentCounter.textContent = `${index + 1} / ${currentFilteredStudents.length}`;
    
    const showNav = currentFilteredStudents.length > 1;
    prevBtn.style.display = showNav ? 'flex' : 'none';
    nextBtn.style.display = showNav ? 'flex' : 'none';
    
    modalCard.classList.remove('is-flipped');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== إغلاق =====
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}
closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// ===== التنقل بين الطلاب =====
function navigate(direction) {
    let newIndex = currentStudentIndex + direction;
    if (newIndex < 0) newIndex = currentFilteredStudents.length - 1;
    if (newIndex >= currentFilteredStudents.length) newIndex = 0;
    openModal(newIndex);
}
prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });

// ===== لوحة المفاتيح =====
document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'ArrowRight') navigate(-1);
    if (e.key === 'ArrowLeft') navigate(1);
    if (e.key === 'Escape') closeModal();
    if (e.key === ' ') { e.preventDefault(); modalCard.classList.toggle('is-flipped'); }
});

// ===== قلب البطاقة + الاحتفال =====
modalCard.addEventListener('click', (e) => {
    if (e.target.closest('.nav-btn') || e.target.closest('.close-btn')) return;
    modalCard.classList.toggle('is-flipped');
    if (modalCard.classList.contains('is-flipped')) triggerConfetti();
});

// ===== زر العودة للأعلى =====
window.addEventListener('scroll', () => {
    if (window.scrollY > 400) scrollTopBtn.classList.add('visible');
    else scrollTopBtn.classList.remove('visible');
});
scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== الاحتفال =====
function triggerConfetti() {
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const colors = ['#38bdf8', '#3b82f6', '#a855f7', '#fbbf24', '#ffffff'];
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

// ===== تشغيل أولي =====
renderGrid();