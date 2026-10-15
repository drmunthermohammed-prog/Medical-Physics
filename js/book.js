/* =========================================================
   book.js - منطق كتاب الذكريات (نسخة مُصحَّحة)
   ========================================================= */

(function() {
    'use strict';

    console.log('📖 book.js: بدء التحميل...');

    if (typeof students === 'undefined' || !Array.isArray(students) || students.length === 0) {
        console.error('❌ book.js: students.js غير محمّلة أو فارغة');
        return;
    }

    const TOTAL = students.length;
    console.log(`✅ book.js: ${TOTAL} طالب`);

    // ===== عناصر =====
    const $ = id => document.getElementById(id);
    const leftPage = $('leftPage');
    const rightPage = $('rightPage');
    const flipWrapper = $('flipWrapper');
    const flipFront = $('flipFront');
    const flipBack = $('flipBack');

    const prevBtn = $('bookPrevBtn');
    const nextBtn = $('bookNextBtn');
    const firstBtn = $('bookFirstBtn');
    const lastBtn = $('bookLastBtn');
    const quickJumpInput = $('quickJumpInput');
    const quickJumpGoBtn = $('quickJumpGoBtn');

    const searchInput = $('bookSearchInput');
    const searchClear = $('bookSearchClear');
    const searchSuggestions = $('bookSearchSuggestions');

    const pageIndCurrent = $('pageIndicatorCurrent');
    const pageIndTotal = $('pageIndicatorTotal');

    const musicBtn = $('bookMusicBtn');
    const musicIcon = $('musicIcon');
    const bookMusic = $('bookMusic');

    const loadingToast = $('loadingToast');

    // ===== فحص العناصر الحرجة =====
    const criticalElements = [
        ['leftPage', leftPage],
        ['rightPage', rightPage],
        ['flipWrapper', flipWrapper],
        ['flipFront', flipFront],
        ['flipBack', flipBack],
        ['bookPrevBtn', prevBtn],
        ['bookNextBtn', nextBtn]
    ];

    const missing = criticalElements.filter(([name, el]) => !el).map(([name]) => name);
    if (missing.length > 0) {
        console.error('❌ book.js: عناصر مفقودة:', missing);
        return;
    }

    console.log('✅ book.js: جميع العناصر موجودة');

    // ===== الحالة =====
    // ===== الحالة =====
    const state = {
        currentIndex: 0,
        isFlipping: false,
        musicPlaying: false,
        musicAvailable: false,
        currentTrackIndex: 0
    };

    // ===== تطبيع النص العربي =====
    function normalizeArabic(text) {
        return String(text)
            .replace(/[\u064B-\u065F\u0670]/g, '')
            .replace(/[أإآا]/g, 'ا')
            .replace(/[ىي]/g, 'ي')
            .replace(/[ةه]/g, 'ه')
            .replace(/[ؤو]/g, 'و')
            .replace(/[ئ]/g, 'ي')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    // ===== SVG بديل للصور المفقودة =====
    const FALLBACK_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f5ecd5"/><stop offset="100%" stop-color="%23e8dcb8"/></linearGradient></defs><rect width="400" height="500" fill="url(%23g)"/><text x="200" y="240" font-size="80" fill="%23b8860b" text-anchor="middle">⚛</text><text x="200" y="300" font-size="24" fill="%238b6914" text-anchor="middle">?</text></svg>';

    // ===== بناء صفحة الطفل =====
    function buildChildPage(student) {
        const photo = student.childImg || FALLBACK_IMG;
        const pageNum = student.id * 2 - 1;

        return `
            <div class="page-inner">
                <div class="page-corner page-corner-tl">✦</div>
                <div class="page-corner page-corner-tr">✦</div>
                <div class="page-corner page-corner-bl">✦</div>
                <div class="page-corner page-corner-br">✦</div>
                
                <div class="page-header">
                    <span class="header-line"></span>
                    <span class="header-label">ثم</span>
                    <span class="header-line"></span>
                </div>
                
                <div class="photo-wrapper">
                    <div class="photo-frame">
                        <img src="${photo}" alt="${student.name}" 
                             onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
                    </div>
                </div>
                
                <div class="name-display">${student.name}</div>
                <div class="page-caption">كان حلماً يكبر مع الأيام...</div>
            </div>
            <div class="page-number">${pageNum}</div>
        `;
    }

    // ===== بناء صفحة الكبير =====
function buildAdultPage(student) {
    const photo = student.adultImg || FALLBACK_IMG;
    const pageNum = student.id * 2;
    const message = student.message 
        ? `<div class="page-message">${student.message}</div>` 
        : '';
    
    // ⬇️ جديد: الجوائز
    const awards = (student.awards && student.awards.length > 0)
        ? `<div class="page-awards">
             ${student.awards.map(a => `<span class="page-award-badge">${a}</span>`).join('')}
           </div>`
        : '';

    return `
        <div class="page-inner">
            <div class="page-corner page-corner-tl">✦</div>
            <div class="page-corner page-corner-tr">✦</div>
            <div class="page-corner page-corner-bl">✦</div>
            <div class="page-corner page-corner-br">✦</div>
            
            <div class="page-header">
                <span class="header-line"></span>
                <span class="header-label">اليوم</span>
                <span class="header-line"></span>
            </div>
            
            <div class="photo-wrapper">
                <div class="photo-frame">
                    <img src="${photo}" alt="${student.name}" 
                         onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
                </div>
            </div>
            
            <div class="name-display">${student.name}</div>
            <div class="job-badge">${student.jobTitle || 'خريج فيزياء طبية'}</div>
            ${awards}
            ${message}
        </div>
        <div class="page-number">${pageNum}</div>
    `;
}

    // ===== عرض الصفحة الحالية =====
    function renderCurrentSpread() {
        const student = students[state.currentIndex];
        if (!student) return;

        leftPage.innerHTML = buildChildPage(student);
        rightPage.innerHTML = buildAdultPage(student);

        pageIndCurrent.textContent = (state.currentIndex + 1).toString();
        updateNavButtons();
    }

    // ===== تحديث أزرار التنقل =====
    function updateNavButtons() {
        if (prevBtn) prevBtn.disabled = state.currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = state.currentIndex >= TOTAL - 1;
    }

    // ===== إنهاء القلب (يُستدعى من transitionend أو safetyTimeout) =====
    function finishFlip(direction) {
        if (!state.isFlipping) return; // حماية من التكرار

        // تحديث المؤشر حسب الاتجاه
        if (direction === 'forward') {
            state.currentIndex++;
        } else if (direction === 'backward') {
            state.currentIndex--;
        }

        pageIndCurrent.textContent = (state.currentIndex + 1).toString();

        // إخفاء الصفحة القلابة وإعادة الحالة
        flipWrapper.classList.remove('flipping');
        flipWrapper.style.display = 'none';
        flipWrapper.className = 'flip-wrapper';

        // إزالة الظلال الديناميكية
        leftPage.classList.remove('flipping-shadow');
        rightPage.classList.remove('flipping-shadow');

        // إنهاء الحالة
        state.isFlipping = false;
        updateNavButtons();
    }

    // ===== احتياطي: إذا لم يُطلق transitionend =====
    function safetyTimeout() {
        if (!state.isFlipping) return;
        
        console.warn('⚠️ book.js: لم يُطلق transitionend — تنفيذ احتياطي');
        
        // تحديد الاتجاه من الحالة الحالية
        if (flipWrapper.classList.contains('forward')) {
            finishFlip('forward');
        } else if (flipWrapper.classList.contains('backward')) {
            finishFlip('backward');
        } else {
            // حالة غير متوقعة — إعادة تعيين فقط
            flipWrapper.classList.remove('flipping');
            flipWrapper.style.display = 'none';
            flipWrapper.className = 'flip-wrapper';
            leftPage.classList.remove('flipping-shadow');
            rightPage.classList.remove('flipping-shadow');
            state.isFlipping = false;
            updateNavButtons();
        }
    }

    // ===== مستمع نهاية الأنيميشن =====
    flipWrapper.addEventListener('transitionend', function(e) {
        // نتجاهل أي transitionend ليس على transform
        if (e.propertyName !== 'transform') return;
        
        // نتأكد أن القلب ما زال قائماً
        if (!state.isFlipping) return;

        if (flipWrapper.classList.contains('forward')) {
            finishFlip('forward');
        } else if (flipWrapper.classList.contains('backward')) {
            finishFlip('backward');
        }
    });

    // ===== قلب للأمام =====
    function flipForward() {
        if (state.isFlipping) return;
        if (state.currentIndex >= TOTAL - 1) {
            showToast('📕 هذا آخر طالب في الكتاب');
            return;
        }

        state.isFlipping = true;
        prevBtn.disabled = true;
        nextBtn.disabled = true;

        const currentStudent = students[state.currentIndex];
        const nextStudent = students[state.currentIndex + 1];

        // 1. تحضير الصفحة القلابة
        flipFront.innerHTML = buildAdultPage(currentStudent);
        flipBack.innerHTML = buildChildPage(nextStudent);

        // 2. تحديث الصفحات الساكنة في الخلفية
        leftPage.innerHTML = buildChildPage(nextStudent);
        rightPage.innerHTML = buildAdultPage(nextStudent);

        // 3. ظل ديناميكي على الصفحة اليسرى
        leftPage.classList.add('flipping-shadow');

        // 4. إظهار وبدء الأنيميشن
        flipWrapper.className = 'flip-wrapper forward';
        flipWrapper.style.display = 'block';

        // Force reflow لضمان بدء الأنيميشن من الحالة الصحيحة
        void flipWrapper.offsetWidth;

        requestAnimationFrame(() => {
            flipWrapper.classList.add('flipping');
        });

        // احتياطي: إذا لم يُطلق transitionend خلال 1.2 ثانية
        setTimeout(safetyTimeout, 1200);
    }

    // ===== قلب للخلف =====
    function flipBackward() {
        if (state.isFlipping) return;
        if (state.currentIndex <= 0) {
            showToast('📕 هذا أول طالب في الكتاب');
            return;
        }

        state.isFlipping = true;
        prevBtn.disabled = true;
        nextBtn.disabled = true;

        const currentStudent = students[state.currentIndex];
        const prevStudent = students[state.currentIndex - 1];

        // 1. تحضير الصفحة القلابة
        flipFront.innerHTML = buildChildPage(currentStudent);
        flipBack.innerHTML = buildAdultPage(prevStudent);

        // 2. تحديث الصفحات الساكنة في الخلفية
        leftPage.innerHTML = buildChildPage(prevStudent);
        rightPage.innerHTML = buildAdultPage(prevStudent);

        // 3. ظل ديناميكي على الصفحة اليمنى
        rightPage.classList.add('flipping-shadow');

        // 4. إظهار وبدء الأنيميشن
        flipWrapper.className = 'flip-wrapper backward';
        flipWrapper.style.display = 'block';

        void flipWrapper.offsetWidth;

        requestAnimationFrame(() => {
            flipWrapper.classList.add('flipping');
        });

        // احتياطي
        setTimeout(safetyTimeout, 1200);
    }

    // ===== الانتقال المباشر =====
    function jumpToStudent(index) {
        index = Math.max(0, Math.min(TOTAL - 1, index));

        if (index === state.currentIndex) return;
        if (state.isFlipping) return; // لا تسمح بالانتقال أثناء القلب

        state.currentIndex = index;
        renderCurrentSpread();
        triggerPageFlipFlash();
    }

    // ===== تأثير وميض سريع عند الانتقال المباشر =====
    function triggerPageFlipFlash() {
        const scene = document.querySelector('.book-scene');
        if (!scene) return;
        scene.style.transition = 'transform 0.5s ease';
        scene.style.transform = 'scale(0.97)';
        setTimeout(() => {
            scene.style.transform = 'scale(1)';
        }, 250);
    }

    // ===== Toast =====
    let toastTimer;
    function showToast(message, type = '') {
        if (!loadingToast) return;
        clearTimeout(toastTimer);
        loadingToast.textContent = message;
        loadingToast.className = 'loading-toast show ' + type;
        toastTimer = setTimeout(() => {
            loadingToast.classList.remove('show');
        }, 2200);
    }

    // ===== ربط أزرار التنقل =====
    nextBtn.addEventListener('click', flipForward);
    prevBtn.addEventListener('click', flipBackward);

    if (firstBtn) {
        firstBtn.addEventListener('click', () => {
            if (state.currentIndex === 0) {
                showToast('📖 أنت في بداية الكتاب');
                return;
            }
            jumpToStudent(0);
        });
    }

    if (lastBtn) {
        lastBtn.addEventListener('click', () => {
            if (state.currentIndex === TOTAL - 1) {
                showToast('📖 أنت في نهاية الكتاب');
                return;
            }
            jumpToStudent(TOTAL - 1);
        });
    }

    // ===== القفز السريع =====
    if (quickJumpGoBtn) {
        quickJumpGoBtn.addEventListener('click', handleQuickJump);
    }
    if (quickJumpInput) {
        quickJumpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleQuickJump();
        });
    }

    function handleQuickJump() {
        const val = parseInt(quickJumpInput.value, 10);
        if (isNaN(val) || val < 1 || val > TOTAL) {
            showToast(`⚠️ أدخل رقماً بين 1 و ${TOTAL}`, 'error');
            return;
        }
        jumpToStudent(val - 1);
        quickJumpInput.value = '';
    }

    // ===== البحث =====
    let searchDebounce;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            const q = searchInput.value.trim();

            if (searchClear) searchClear.style.display = q ? 'flex' : 'none';

            if (q.length < 1) {
                searchSuggestions.classList.remove('active');
                return;
            }

            searchDebounce = setTimeout(() => {
                const norm = normalizeArabic(q);
                const matches = students
                    .map((s, i) => ({ s, i }))
                    .filter(({ s }) => normalizeArabic(s.name).includes(norm))
                    .slice(0, 8);

                if (matches.length === 0) {
                    searchSuggestions.innerHTML = `
                        <div class="book-suggestion-item" style="color:#f87171;justify-content:center;">
                            لا يوجد طالب بهذا الاسم
                        </div>
                    `;
                    searchSuggestions.classList.add('active');
                    return;
                }

                searchSuggestions.innerHTML = matches.map(({ s, i }) => `
                    <div class="book-suggestion-item" data-index="${i}">
                        <span>${s.name}</span>
                        <span class="book-suggestion-id">صفحة ${i + 1}</span>
                    </div>
                `).join('');

                searchSuggestions.classList.add('active');

                searchSuggestions.querySelectorAll('.book-suggestion-item[data-index]').forEach(el => {
                    el.addEventListener('click', () => {
                        const idx = parseInt(el.dataset.index, 10);
                        jumpToStudent(idx);
                        searchSuggestions.classList.remove('active');
                        searchInput.value = '';
                        if (searchClear) searchClear.style.display = 'none';
                    });
                });
            }, 200);
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.style.display = 'none';
            searchSuggestions.classList.remove('active');
            searchInput.focus();
        });
    }

    // إغلاق الاقتراحات عند الضغط خارجها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.book-search-wrap')) {
            if (searchSuggestions) searchSuggestions.classList.remove('active');
        }
    });

    // ===== اختصارات لوحة المفاتيح =====
    document.addEventListener('keydown', (e) => {
        // لا تعمل عند التركيز على input
        if (e.target.matches('input, textarea')) {
            if (e.key === 'Escape') e.target.blur();
            return;
        }

        if (state.isFlipping) return; // لا تقبل أوامر أثناء القلب

        if (e.key === 'ArrowLeft') {
            flipForward();
        } else if (e.key === 'ArrowRight') {
            flipBackward();
        } else if (e.key === 'Home') {
            jumpToStudent(0);
        } else if (e.key === 'End') {
            jumpToStudent(TOTAL - 1);
        } else if (e.key === '/') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
    });

    // ===== الموسيقى =====
    // ===== الموسيقى =====
    const TRACKS = [
        { file: 'music/book.mp3',   name: 'ألحان الكتاب',    icon: '🎵' },
        { file: 'music/book2.mp3',  name: 'ذكريات هادئة',    icon: '🎶' },
        { file: 'music/book3.mp3',  name: 'لحن التخرج',      icon: '🎼' }
        // ⬇️ أضف المزيد هنا
        // { file: 'music/book4.mp3', name: 'الاسم', icon: '🎵' },
    ];

    const musicListBtn = document.getElementById('bookMusicListBtn');
    const musicPanel = document.getElementById('bookMusicPanel');
    const musicOverlay = document.getElementById('bookMusicOverlay');
    const musicPanelClose = document.getElementById('bookMusicPanelClose');
    const musicListEl = document.getElementById('bookMusicList');

    // ===== فحص توفر الموسيقى =====
    function checkTrack(file) {
        return new Promise(resolve => {
            const test = new Audio();
            let resolved = false;
            const done = (result) => {
                if (resolved) return;
                resolved = true;
                resolve(result);
            };
            test.addEventListener('canplaythrough', () => done(true), { once: true });
            test.addEventListener('error', () => done(false), { once: true });
            setTimeout(() => done(false), 2500);
            test.src = file;
            test.load();
        });
    }

    async function checkAllTracks() {
        const results = await Promise.all(TRACKS.map(t => checkTrack(t.file)));
        // احتفظ فقط بالمقاطع المتوفرة
        const available = TRACKS.filter((_, i) => results[i]);
        TRACKS.length = 0;
        TRACKS.push(...available);
        
        if (TRACKS.length === 0) {
            state.musicAvailable = false;
            if (musicBtn) {
                musicBtn.style.opacity = '0.4';
                musicBtn.title = 'الموسيقى غير متوفرة';
            }
            if (musicListBtn) musicListBtn.classList.add('hidden');
            console.log('ℹ️ book.js: لا توجد ملفات موسيقى');
        } else {
            state.musicAvailable = true;
            console.log(`✅ book.js: ${TRACKS.length} مقطع موسيقى متوفر`);
            
            // إخفاء زر القائمة إذا كان هناك مقطع واحد فقط
            if (TRACKS.length <= 1 && musicListBtn) {
                musicListBtn.classList.add('hidden');
            }
            
            loadTrack(state.currentTrackIndex);
        }
    }

    // ===== تحميل مقطع =====
    function loadTrack(index) {
        const track = TRACKS[index];
        if (!track || !bookMusic) return;
        bookMusic.src = track.file;
        bookMusic.load();
    }

    // ===== تشغيل/إيقاف =====
    function toggleMusic() {
        if (!state.musicAvailable) {
            showToast('🎵 الموسيقى غير متوفرة', 'error');
            return;
        }

        if (state.musicPlaying) {
            bookMusic.pause();
            state.musicPlaying = false;
            musicIcon.textContent = '🎵';
            musicBtn.classList.remove('playing');
            musicBtn.title = 'تشغيل الموسيقى';
            renderMusicList();
        } else {
            bookMusic.volume = 0.5;
            bookMusic.play().then(() => {
                state.musicPlaying = true;
                musicIcon.textContent = '🔊';
                musicBtn.classList.add('playing');
                musicBtn.title = 'إيقاف الموسيقى';
                renderMusicList();
            }).catch(err => {
                console.warn('تعذر تشغيل الموسيقى:', err);
                showToast('⚠️ تعذر تشغيل الموسيقى', 'error');
            });
        }
    }

    // ===== تغيير مقطع =====
    function switchTrack(index) {
        if (index < 0 || index >= TRACKS.length) return;

        const wasPlaying = state.musicPlaying;
        state.currentTrackIndex = index;
        loadTrack(index);

        if (wasPlaying) {
            bookMusic.play().then(() => {
                state.musicPlaying = true;
                musicIcon.textContent = '🔊';
                musicBtn.classList.add('playing');
            }).catch(() => {
                state.musicPlaying = false;
                musicIcon.textContent = '🎵';
                musicBtn.classList.remove('playing');
            });
        }

        renderMusicList();
        showToast(`🎵 ${TRACKS[index].name}`, 'success');
    }

    // ===== رسم قائمة الموسيقى =====
    function renderMusicList() {
        if (!musicListEl) return;
        if (TRACKS.length === 0) {
            musicListEl.innerHTML = `
                <div style="text-align:center;color:#94a3b8;padding:20px;font-size:0.9rem;">
                    لا توجد ملفات موسيقى متوفرة
                </div>
            `;
            return;
        }

        musicListEl.innerHTML = '';
        TRACKS.forEach((track, i) => {
            const isActive = i === state.currentTrackIndex;
            const isPlaying = isActive && state.musicPlaying;

            const item = document.createElement('div');
            item.className = 'book-music-item' + (isActive ? ' active' : '');
            item.innerHTML = `
                <div class="book-music-item-icon">${track.icon}</div>
                <div class="book-music-item-name">${track.name}</div>
                <div class="book-music-item-status">${isPlaying ? '🔊' : (isActive ? '⏸' : '▶')}</div>
            `;
            item.addEventListener('click', () => switchTrack(i));
            musicListEl.appendChild(item);
        });
    }

    // ===== فتح/إغلاق لوحة الموسيقى =====
    function openMusicPanel() {
        if (!musicPanel || !musicOverlay) return;
        renderMusicList();
        musicPanel.classList.add('active');
        musicOverlay.classList.add('active');
    }

    function closeMusicPanel() {
        if (!musicPanel || !musicOverlay) return;
        musicPanel.classList.remove('active');
        musicOverlay.classList.remove('active');
    }

    // ===== ربط الأحداث =====
    if (musicBtn) {
        musicBtn.addEventListener('click', toggleMusic);
    }

    if (musicListBtn) {
        musicListBtn.addEventListener('click', openMusicPanel);
    }

    if (musicPanelClose) {
        musicPanelClose.addEventListener('click', closeMusicPanel);
    }

    if (musicOverlay) {
        musicOverlay.addEventListener('click', closeMusicPanel);
    }

    // إغلاق بمفتاح Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && musicPanel && musicPanel.classList.contains('active')) {
            closeMusicPanel();
        }
    });

    // ===== عند انتهاء المقطع: التالي تلقائياً =====
    if (bookMusic) {
        bookMusic.addEventListener('ended', () => {
            if (TRACKS.length <= 1) return;
            const nextIndex = (state.currentTrackIndex + 1) % TRACKS.length;
            state.currentTrackIndex = nextIndex;
            loadTrack(nextIndex);
            if (state.musicPlaying) {
                bookMusic.play().catch(() => {});
            }
            renderMusicList();
        });
    }

    // ===== فحص أولي للموسيقى =====
    checkAllTracks();

    // إيقاف الموسيقى عند مغادرة الصفحة
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.musicPlaying) {
            bookMusic.pause();
        } else if (!document.hidden && state.musicPlaying) {
            bookMusic.play().catch(() => {});
        }
    });

    window.addEventListener('beforeunload', () => {
        if (bookMusic) bookMusic.pause();
    });

    // ===== تشغيل أولي =====
    if (pageIndTotal) pageIndTotal.textContent = TOTAL.toString();
    renderCurrentSpread();

    console.log('✅ book.js: جاهز');
})();