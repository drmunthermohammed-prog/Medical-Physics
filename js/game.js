/* =========================================================
   game.js - منطق لعبة خمّن مَن
   ========================================================= */

// ===== إعدادات اللعبة =====
const TOTAL_QUESTIONS = 10;
const TIMER_SECONDS = 15;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 26; // نصف قطر SVG

// ===== عناصر DOM =====
const startScreen = document.getElementById('startScreen');
const playScreen = document.getElementById('playScreen');
const resultScreen = document.getElementById('resultScreen');

const startBtn = document.getElementById('startBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const shareResultBtn = document.getElementById('shareResultBtn');

const currentQuestionEl = document.getElementById('currentQuestion');
const currentScoreEl = document.getElementById('currentScore');
const gameProgressFill = document.getElementById('gameProgressFill');

const timerCircle = document.getElementById('timerCircle');
const timerFg = document.getElementById('timerFg');
const timerText = document.getElementById('timerText');

const questionCard = document.getElementById('questionCard');
const questionPhoto = document.getElementById('questionPhoto');
const optionsList = document.getElementById('optionsList');

const feedbackOverlay = document.getElementById('feedbackOverlay');
const feedbackIcon = document.getElementById('feedbackIcon');
const feedbackText = document.getElementById('feedbackText');

const resultBadge = document.getElementById('resultBadge');
const resultTitle = document.getElementById('resultTitle');
const resultSubtitle = document.getElementById('resultSubtitle');
const finalScore = document.getElementById('finalScore');
const resultStars = document.getElementById('resultStars');
const correctCount = document.getElementById('correctCount');
const wrongCount = document.getElementById('wrongCount');
const avgTime = document.getElementById('avgTime');
const loadingToast = document.getElementById('loadingToast');

// ===== حالة اللعبة =====
let gameState = {
    questions: [],        // 10 أسئلة
    currentIndex: 0,      // السؤال الحالي
    score: 0,             // النقاط
    correctAnswers: 0,    // الإجابات الصحيحة
    wrongAnswers: 0,      // الإجابات الخاطئة
    timesPerQuestion: [], // وقت كل سؤال
    timer: null,          // مؤقت السؤال
    timeLeft: TIMER_SECONDS,
    isAnswered: false     // هل تم الإجابة على السؤال الحالي
};

// ===== دالة الخلط (Fisher-Yates) =====
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ===== توليد الأسئلة =====
function generateQuestions() {
    // نختار 10 طلاب عشوائياً (بدون تكرار)
    const selectedStudents = shuffle(students).slice(0, TOTAL_QUESTIONS);
    
    return selectedStudents.map(correctStudent => {
        // اختر مرشحَين خاطئَين عشوائياً (لا يساويان الطالب الصحيح)
        const wrongStudents = shuffle(
            students.filter(s => s.id !== correctStudent.id)
        ).slice(0, 2);
        
        // الخيارات = الصحيح + 2 خطأ
        const options = shuffle([correctStudent, ...wrongStudents]);
        
        return {
            correctId: correctStudent.id,
            correctName: correctStudent.name,
            correctImg: correctStudent.childImg,
            options: options.map(o => ({ id: o.id, name: o.name })),
            student: correctStudent
        };
    });
}

// ===== بدء اللعبة =====
function startGame() {
    gameState = {
        questions: generateQuestions(),
        currentIndex: 0,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        timesPerQuestion: [],
        timer: null,
        timeLeft: TIMER_SECONDS,
        isAnswered: false
    };
    
    currentScoreEl.textContent = '0';
    showScreen('play');
    showQuestion(0);
}

// ===== عرض شاشة =====
function showScreen(screenName) {
    [startScreen, playScreen, resultScreen].forEach(s => s.classList.remove('active'));
    
    if (screenName === 'start') startScreen.classList.add('active');
    if (screenName === 'play') playScreen.classList.add('active');
    if (screenName === 'result') resultScreen.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== عرض سؤال =====
function showQuestion(index) {
    // ⬇️ المفتاح: استخدم عدد الأسئلة الفعلي
    const totalQ = gameState.questions.length;
    
    if (index >= totalQ) {
        endGame();
        return;
    }
    
    gameState.currentIndex = index;
    gameState.isAnswered = false;
    gameState.timeLeft = TIMER_SECONDS;
    
    const question = gameState.questions[index];
    if (!question) {
        console.error('❌ السؤال غير موجود في الفهرس:', index);
        endGame();
        return;
    }
    
    // تحديث العدادات
    currentQuestionEl.textContent = index + 1;
    const progress = ((index) / totalQ) * 100;
    gameProgressFill.style.width = Math.max(progress, 10) + '%';
    
    // الصورة
    questionPhoto.src = question.correctImg;
    questionPhoto.onerror = function() {
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%231e3a8a" width="300" height="300"/><text x="150" y="170" font-size="80" fill="%237dd3fc" text-anchor="middle">?</text></svg>';
    };
    
    // إعادة تحريك البطاقة
    questionCard.style.animation = 'none';
    setTimeout(() => {
        questionCard.style.animation = 'cardSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }, 10);
    
    // توليد الخيارات
    optionsList.innerHTML = '';
    const letters = ['أ', 'ب', 'ج'];
    
    question.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.studentId = option.id;
        btn.innerHTML = `
            <span class="option-letter">${letters[i]}</span>
            <span class="option-name">${option.name}</span>
        `;
        btn.addEventListener('click', () => handleAnswer(option.id, btn));
        optionsList.appendChild(btn);
    });
    
    // بدء المؤقت
    startTimer();
}

// ===== المؤقت =====
function startTimer() {
    clearInterval(gameState.timer);
    
    gameState.timeLeft = TIMER_SECONDS;
    updateTimerVisual(TIMER_SECONDS);
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerVisual(gameState.timeLeft);
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            if (!gameState.isAnswered) {
                handleTimeout();
            }
        }
    }, 1000);
}

function updateTimerVisual(seconds) {
    timerText.textContent = seconds;
    
    // حساب نسبة الوقت المتبقي (المؤشر يدور من اليمين)
    const progress = seconds / TIMER_SECONDS;
    const offset = CIRCLE_CIRCUMFERENCE * (1 - progress);
    timerFg.style.strokeDashoffset = offset;
    
    // تغيير اللون حسب الوقت
    timerFg.classList.remove('warning', 'danger');
    timerText.classList.remove('warning', 'danger');
    
    if (seconds <= 5) {
        timerFg.classList.add('danger');
        timerText.classList.add('danger');
    } else if (seconds <= 10) {
        timerFg.classList.add('warning');
        timerText.classList.add('warning');
    }
}

// ===== معالجة الإجابة =====
function handleAnswer(selectedId, btnElement) {
    if (gameState.isAnswered) return;
    gameState.isAnswered = true;
    clearInterval(gameState.timer);
    
    const question = gameState.questions[gameState.currentIndex];
    const isCorrect = selectedId === question.correctId;
    
    // حفظ الوقت المستغرق
    const timeUsed = TIMER_SECONDS - gameState.timeLeft;
    gameState.timesPerQuestion.push(timeUsed);
    
    // تعطيل جميع الأزرار
    optionsList.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        
        const sid = parseInt(btn.dataset.studentId);
        if (sid === question.correctId) {
            btn.classList.add('correct');
        } else if (sid === selectedId && !isCorrect) {
            btn.classList.add('wrong');
        }
    });
    
    if (isCorrect) {
        // إجابة صحيحة
        gameState.score += 10;
        gameState.correctAnswers++;
        currentScoreEl.textContent = gameState.score;
        
        // نقاط إضافية للسرعة
        const bonus = Math.max(0, gameState.timeLeft);
        if (bonus > 0) {
            gameState.score += Math.floor(bonus / 3);
            currentScoreEl.textContent = gameState.score;
        }
        
        showFeedback('correct', '✅ صحيح!', '');
        triggerMiniConfetti(btnElement);
    } else {
        // إجابة خاطئة
        gameState.wrongAnswers++;
        showFeedback('wrong', '❌ خطأ!', question.correctName);
    }
    
    // الانتقال للسؤال التالي بعد 1.8 ثانية
    setTimeout(() => {
        hideFeedback();
        showQuestion(gameState.currentIndex + 1);
    }, 1800);
}

// ===== انتهاء الوقت =====
function handleTimeout() {
    if (gameState.isAnswered) return;
    gameState.isAnswered = true;
    
    const question = gameState.questions[gameState.currentIndex];
    gameState.wrongAnswers++;
    gameState.timesPerQuestion.push(TIMER_SECONDS);
    
    // إظهار الجواب الصحيح
    optionsList.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        const sid = parseInt(btn.dataset.studentId);
        if (sid === question.correctId) {
            btn.classList.add('correct');
        }
    });
    
    showFeedback('wrong', '⏰ انتهى الوقت!', question.correctName);
    
    setTimeout(() => {
        hideFeedback();
        showQuestion(gameState.currentIndex + 1);
    }, 2000);
}

// ===== عرض التغذية الراجعة =====
function showFeedback(type, text, studentName) {
    const content = feedbackOverlay.querySelector('.feedback-content');
    content.className = 'feedback-content ' + type;
    
    feedbackIcon.textContent = type === 'correct' ? '🎉' : '😢';
    
    if (studentName) {
        feedbackText.innerHTML = `${text}<span class="student-name">${studentName}</span>`;
    } else {
        feedbackText.textContent = text;
    }
    
    feedbackOverlay.classList.add('show');
}

function hideFeedback() {
    feedbackOverlay.classList.remove('show');
}

// ===== نهاية اللعبة =====
function endGame() {
    clearInterval(gameState.timer);
    gameProgressFill.style.width = '100%';
    
    // ⬇️ استخدم عدد الأسئلة الفعلي
    const totalQ = gameState.questions.length;
    
    const totalCorrect = gameState.correctAnswers;
    const totalWrong = gameState.wrongAnswers;
    const avgTimeValue = gameState.timesPerQuestion.length > 0
        ? (gameState.timesPerQuestion.reduce((a, b) => a + b, 0) / gameState.timesPerQuestion.length).toFixed(1)
        : '0';
    
    finalScore.textContent = gameState.score;
    correctCount.textContent = totalCorrect;
    wrongCount.textContent = totalWrong;
    avgTime.textContent = avgTimeValue;
    
    // ⬇️ النسبة المئوية للنتيجة حسب عدد الأسئلة الفعلي
    const percentage = totalQ > 0 ? (totalCorrect / totalQ) * 100 : 0;
    const result = getResultInfo(percentage);
    
    resultBadge.textContent = result.badge;
    resultTitle.textContent = result.title;
    resultSubtitle.textContent = result.subtitle;
    resultStars.textContent = result.stars;
    
    // تحديث نص "من X" ليعرض العدد الفعلي
    const scoreLabel = document.querySelector('.result-score-label');
    if (scoreLabel) {
        scoreLabel.textContent = `من ${totalQ}`;
    }
    
    showScreen('result');
    
    if (percentage >= 80) {
        setTimeout(() => triggerBigConfetti(), 400);
    } else if (percentage >= 50) {
        setTimeout(() => triggerMiniConfetti(resultBadge), 400);
    }
}

function getResultInfo(percentage) {
    if (percentage === 100) {
        return {
            badge: '👑',
            title: 'أسطورة الدفعة!',
            subtitle: 'أنت تعرف الجميع! لا يمكن خداعك 👏',
            stars: '⭐⭐⭐⭐⭐'
        };
    } else if (percentage >= 80) {
        return {
            badge: '🏆',
            title: 'خبير الدفعة',
            subtitle: 'ممتاز! تعرف أصدقاءك جيداً 🌟',
            stars: '⭐⭐⭐⭐'
        };
    } else if (percentage >= 60) {
        return {
            badge: '🥇',
            title: 'صديق قريب',
            subtitle: 'جيد جداً! تعرف معظم الدفعة 👌',
            stars: '⭐⭐⭐'
        };
    } else if (percentage >= 40) {
        return {
            badge: '🥈',
            title: 'على الطريق',
            subtitle: 'لست سيئاً، تحتاج لقضاء وقت أكثر معهم 😊',
            stars: '⭐⭐'
        };
    } else if (percentage >= 1) {
        return {
            badge: '🥉',
            title: 'تحتاج تتعرف أكثر',
            subtitle: 'يبدو أنك جديد على الدفعة! 😅',
            stars: '⭐'
        };
    } else {
        return {
            badge: '😱',
            title: 'غريب تماماً!',
            subtitle: 'هل أنت متأكد أنك من هذه الدفعة؟ 🤔',
            stars: ''
        };
    }
}

// ===== احتفال كبير =====
function triggerBigConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#d4af37', '#fbbf24', '#b8860b', '#38bdf8', '#a855f7', '#ffffff'];
    const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 2000, colors };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 70 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// ===== احتفال صغير =====
function triggerMiniConfetti(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
        particleCount: 30,
        spread: 70,
        startVelocity: 28,
        origin: { x, y },
        colors: ['#d4af37', '#fbbf24', '#38bdf8', '#10b981', '#ffffff'],
        zIndex: 2000,
        scalar: 0.85
    });
}

// ===== Toast =====
let toastTimeout;
function showToast(message, type = '') {
    clearTimeout(toastTimeout);
    loadingToast.textContent = message;
    loadingToast.className = 'loading-toast show ' + type;
    toastTimeout = setTimeout(() => {
        loadingToast.classList.remove('show');
    }, 2500);
}

// ===== مشاركة النتيجة =====
shareResultBtn.addEventListener('click', async () => {
    const score = gameState.score;
    const correct = gameState.correctAnswers;
    const result = getResultInfo(correct);
    
    const text = `🎮 لعبة خمّن مَن - الفيزياء الطبية 2027\n` +
                 `${result.badge} نتيجتي: ${correct}/10\n` +
                 `${result.title}\n` +
                 `⭐ النقاط: ${score}\n` +
                 `جرّبها بنفسك!`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'نتيجتي في خمّن مَن!',
                text: text,
                url: window.location.href
            });
            showToast('✅ تم فتح قائمة المشاركة', 'success');
        } catch (err) {
            if (err.name !== 'AbortError') fallbackCopy(text);
        }
    } else {
        fallbackCopy(text);
    }
    
    function fallbackCopy(txt) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(txt).then(() => {
                showToast('📋 تم نسخ النتيجة', 'success');
            }).catch(() => {
                showToast('⚠️ المشاركة غير مدعومة', 'error');
            });
        } else {
            showToast('⚠️ المشاركة غير مدعومة', 'error');
        }
    }
});

// ===== ربط الأحداث =====
startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', () => {
    showScreen('start');
});

// دعم لوحة المفاتيح (1, 2, 3 للاختيار، Enter للبدء)
document.addEventListener('keydown', (e) => {
    if (startScreen.classList.contains('active')) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startGame();
        }
        return;
    }
    
    if (playScreen.classList.contains('active') && !gameState.isAnswered) {
        if (e.key === '1' || e.key === '2' || e.key === '3') {
            const index = parseInt(e.key) - 1;
            const btn = optionsList.querySelectorAll('.option-btn')[index];
            if (btn && !btn.disabled) btn.click();
        }
    }
});

// ===== فحص أولي =====
if (!students || students.length < 3) {
    alert('⚠️ تحتاج إلى 3 طلاب على الأقل في ملف students.js لتشغيل اللعبة');
}