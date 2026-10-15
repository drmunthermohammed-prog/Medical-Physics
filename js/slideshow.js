/* =========================================================
   slideshow.js - عرض فيلم الدفعة بملء الشاشة (Story Style)
   ========================================================= */

(function() {
    'use strict';

    console.log('🎬 slideshow.js: بدء التحميل...');

    if (typeof students === 'undefined' || !Array.isArray(students)) {
        console.error('❌ slideshow.js: students.js غير محمّلة');
        return;
    }

    console.log(`✅ slideshow.js: ${students.length} طالب`);

    // ===== إعدادات =====
    const SLIDE_DURATION = 6000; // 6 ثواني لكل شريحة
    const TRACKS = [
        { file: 'music/track1.mp3', name: 'الموسيقى الهادئة', icon: '🎵' },
        { file: 'music/track2.mp3', name: 'لحن التخرج', icon: '🎶' },
        { file: 'music/track3.mp3', name: 'ذكرى الدفعة', icon: '🎼' }
    ];

    // ===== عناصر =====
    const $ = id => document.getElementById(id);

    const fsSlideshow = $('fsSlideshow');
    const fsProgressFill = $('fsProgressFill');
    const fsCounter = $('fsCounter');
    const fsCloseBtn = $('fsCloseBtn');
    const fsMuteBtn = $('fsMuteBtn');
    const fsPhoto = $('fsPhoto');
	const fsPhotoBg = $('fsPhotoBg');
    const fsInfo = $('fsInfo');
    const fsName = $('fsName');
    const fsJob = $('fsJob');
    const fsMessage = $('fsMessage');
    const fsPrevBtn = $('fsPrevBtn');
    const fsNextBtn = $('fsNextBtn');
    const fsPlayPauseBtn = $('fsPlayPauseBtn');
    const fsMusicListBtn = $('fsMusicListBtn');
    const fsFullscreenBtn = $('fsFullscreenBtn');
    const fsMusicPanel = $('fsMusicPanel');
    const fsMusicPanelClose = $('fsMusicPanelClose');
    const fsMusicList = $('fsMusicList');
    const fsMusicName = $('fsMusicName');
    const fsMusicBadge = $('fsMusicBadge');
    const fsTapRight = $('fsTapRight');
    const fsTapLeft = $('fsTapLeft');

    if (!fsSlideshow) {
        console.error('❌ slideshow.js: fsSlideshow غير موجود في HTML');
        return;
    }
    console.log('✅ slideshow.js: جميع العناصر موجودة');

    // ===== الحالة =====
    const state = {
        currentIndex: 0,
        isPlaying: false,
        isMuted: false,
        isActive: false,
        slideTimer: null,
        progressInterval: null,
        currentTrackIndex: 0,
        audio: null,
        musicAvailable: true
    };

    // =========================================================
    // فتح العرض
    // =========================================================
    function openSlideshow() {
        console.log('▶️ فتح العرض');
        
        fsSlideshow.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        state.isActive = true;
        state.currentIndex = 0;
        state.isPlaying = true;
        
        fsPlayPauseBtn.textContent = '⏸';
        
        // فحص توفر الموسيقى
        checkMusicAvailability().then(available => {
            state.musicAvailable = available;
            if (available) {
                playMusic();
            } else {
                fsMusicBadge.style.display = 'none';
                fsMusicListBtn.style.display = 'none';
            }
        });
        
        showSlide(0);
        startAutoAdvance();
    }

    // =========================================================
    // إغلاق العرض
    // =========================================================
    function closeSlideshow() {
        console.log('⏹ إغلاق العرض');
        
        state.isActive = false;
        state.isPlaying = false;
        
        clearTimers();
        pauseMusic();
        
        fsSlideshow.classList.remove('active');
        fsMusicPanel.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // =========================================================
    // مسح المؤقتات
    // =========================================================
    function clearTimers() {
        if (state.slideTimer) {
            clearTimeout(state.slideTimer);
            state.slideTimer = null;
        }
        if (state.progressInterval) {
            clearInterval(state.progressInterval);
            state.progressInterval = null;
        }
    }

    // =========================================================
    // عرض شريحة
    // =========================================================
function showSlide(index) {
    const total = students.length;
    if (total === 0) return;

    if (index >= total) index = 0;
    if (index < 0) index = total - 1;

    state.currentIndex = index;
    const student = students[index];
    if (!student) return;

    const photo = student.adultImg || student.childImg || '';

    fsPhoto.classList.remove('active');
    fsInfo.classList.remove('active');
    if (fsPhotoBg) fsPhotoBg.classList.remove('active');

    setTimeout(() => {
        fsPhoto.src = photo;
        fsPhoto.onerror = function() {
            this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><rect fill="%230a1a3d" width="800" height="1200"/><text x="400" y="620" font-size="120" fill="%2338bdf8" text-anchor="middle">⚛</text></svg>';
        };

        if (fsPhotoBg) {
            fsPhotoBg.style.backgroundImage = `url("${photo}")`;
        }

        fsName.textContent = student.name || '';
        fsJob.textContent = student.jobTitle || 'خريج فيزياء طبية';
        fsMessage.textContent = student.message || '';
        fsCounter.textContent = `${index + 1} / ${total}`;

        // ⬇️ جديد: الجوائز
        const fsAwards = document.getElementById('fsAwards');
        if (fsAwards) {
            if (student.awards && student.awards.length > 0) {
                fsAwards.innerHTML = student.awards
                    .map(a => `<span class="fs-award-badge">${a}</span>`)
                    .join('');
                fsAwards.style.display = 'flex';
            } else {
                fsAwards.innerHTML = '';
                fsAwards.style.display = 'none';
            }
        }

        const showContent = () => {
            fsPhoto.classList.add('active');
            if (fsPhotoBg) fsPhotoBg.classList.add('active');
            fsInfo.classList.add('active');
        };

        if (fsPhoto.complete) {
            showContent();
        } else {
            fsPhoto.onload = showContent;
            setTimeout(showContent, 350);
        }
    }, 250);

    startProgressBar();
}

    // =========================================================
    // شريط التقدم
    // =========================================================
    function startProgressBar() {
        if (state.progressInterval) clearInterval(state.progressInterval);
        if (!fsProgressFill) return;

        const startTime = Date.now();
        fsProgressFill.style.width = '0%';

        state.progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const percent = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
            fsProgressFill.style.width = percent + '%';

            if (percent >= 100) {
                clearInterval(state.progressInterval);
                state.progressInterval = null;
            }
        }, 60);
    }

    // =========================================================
    // التقدم التلقائي
    // =========================================================
    function startAutoAdvance() {
        if (state.slideTimer) clearTimeout(state.slideTimer);
        if (!state.isPlaying || !state.isActive) return;

        state.slideTimer = setTimeout(() => {
            if (state.isPlaying && state.isActive) {
                showSlide(state.currentIndex + 1);
                startAutoAdvance();
            }
        }, SLIDE_DURATION);
    }

    // =========================================================
    // التنقل
    // =========================================================
    function goNext() {
        if (!state.isActive) return;
        showSlide(state.currentIndex + 1);
        if (state.isPlaying) startAutoAdvance();
    }

    function goPrev() {
        if (!state.isActive) return;
        showSlide(state.currentIndex - 1);
        if (state.isPlaying) startAutoAdvance();
    }

    // =========================================================
    // الموسيقى
    // =========================================================
    function checkMusicAvailability() {
        return new Promise(resolve => {
            const testAudio = new Audio();
            const timeout = setTimeout(() => resolve(false), 2000);

            testAudio.addEventListener('canplaythrough', () => {
                clearTimeout(timeout);
                resolve(true);
            }, { once: true });

            testAudio.addEventListener('error', () => {
                clearTimeout(timeout);
                resolve(false);
            }, { once: true });

            testAudio.src = TRACKS[0].file;
        });
    }

    function playMusic() {
        if (!state.musicAvailable) return;

        try {
            if (!state.audio) {
                state.audio = new Audio();
                state.audio.volume = 0.55;
                state.audio.muted = state.isMuted;
                state.audio.preload = 'auto';

                state.audio.addEventListener('error', () => {
                    console.warn('⚠️ تعذر تحميل ملف الموسيقى');
                    state.musicAvailable = false;
                    fsMusicBadge.style.display = 'none';
                });

                state.audio.addEventListener('ended', () => {
                    // الانتقال للمقطع التالي تلقائياً
                    state.currentTrackIndex = (state.currentTrackIndex + 1) % TRACKS.length;
                    loadTrack(state.currentTrackIndex);
                    if (state.isPlaying && state.audio) {
                        state.audio.play().catch(() => {});
                    }
                });
            }

            if (!state.audio.src) {
                loadTrack(state.currentTrackIndex);
            }

            if (state.audio.paused) {
                const p = state.audio.play();
                if (p !== undefined) {
                    p.catch(err => {
                        console.warn('تعذر تشغيل الموسيقى:', err.message);
                    });
                }
            }

            // تحديث حالة الأيقونة
            updateMusicIndicator(true);
        } catch (err) {
            console.warn('خطأ في playMusic:', err);
        }
    }

    function pauseMusic() {
        if (state.audio && !state.audio.paused) {
            state.audio.pause();
        }
        updateMusicIndicator(false);
    }

    function loadTrack(index) {
        const track = TRACKS[index];
        if (!track || !state.audio) return;

        state.audio.src = track.file;
        fsMusicName.textContent = track.name;

        // تحديث قائمة الاختيار
        renderMusicList();
    }

    function switchTrack(index) {
        if (index === state.currentTrackIndex && state.audio && !state.audio.paused) {
            // إيقاف إن كان يعمل
            pauseMusic();
        } else {
            state.currentTrackIndex = index;
            loadTrack(index);
            
            if (state.audio) {
                state.audio.currentTime = 0;
                if (state.isPlaying) {
                    state.audio.play().catch(() => {});
                }
            }
            updateMusicIndicator(state.isPlaying);
        }
        
        renderMusicList();
    }

    function updateMusicIndicator(isPlaying) {
        const eqBars = fsMusicBadge.querySelector('.fs-music-eq');
        if (eqBars) {
            if (isPlaying && !state.isMuted) {
                eqBars.classList.remove('paused');
            } else {
                eqBars.classList.add('paused');
            }
        }
    }

    // =========================================================
    // رسم قائمة الموسيقى
    // =========================================================
    function renderMusicList() {
        if (!fsMusicList) return;

        fsMusicList.innerHTML = '';

        TRACKS.forEach((track, i) => {
            const isActive = i === state.currentTrackIndex;
            const isCurrentlyPlaying = isActive && state.audio && !state.audio.paused;

            const item = document.createElement('div');
            item.className = 'fs-music-item' + (isActive ? ' active' : '');
            item.innerHTML = `
                <div class="fs-music-item-icon">${track.icon}</div>
                <div class="fs-music-item-name">${track.name}</div>
                <div class="fs-music-item-status">${isCurrentlyPlaying ? '▶' : (isActive ? '⏸' : '')}</div>
            `;
            item.addEventListener('click', () => switchTrack(i));
            fsMusicList.appendChild(item);
        });
    }

    // =========================================================
    // الأحداث
    // =========================================================

    // زر "فيلم الدفعة" في الصفحة الرئيسية
    const openBtn = $('openSlideshowBtn');
    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSlideshow();
        });
    }

    // إغلاق
    fsCloseBtn.addEventListener('click', closeSlideshow);

    // إغلاق بمفتاح Escape
    document.addEventListener('keydown', (e) => {
        if (!state.isActive) return;

        if (e.key === 'Escape') {
            if (fsMusicPanel.classList.contains('active')) {
                fsMusicPanel.classList.remove('active');
            } else {
                closeSlideshow();
            }
        } else if (e.key === 'ArrowRight') {
            goPrev(); // RTL: يمين = السابق
        } else if (e.key === 'ArrowLeft') {
            goNext(); // RTL: يسار = التالي
        } else if (e.key === ' ') {
            e.preventDefault();
            fsPlayPauseBtn.click();
        } else if (e.key.toLowerCase() === 'm') {
            fsMuteBtn.click();
        } else if (e.key.toLowerCase() === 'f') {
            fsFullscreenBtn.click();
        }
    });

    // مناطق النقر للتنقل
    fsTapRight.addEventListener('click', goPrev);
    fsTapLeft.addEventListener('click', goNext);

    // الأزرار
    fsNextBtn.addEventListener('click', goNext);
    fsPrevBtn.addEventListener('click', goPrev);

    // إيقاف/تشغيل
    fsPlayPauseBtn.addEventListener('click', () => {
        if (!state.isActive) return;

        if (state.isPlaying) {
            state.isPlaying = false;
            fsPlayPauseBtn.textContent = '▶';
            clearTimers();
            pauseMusic();
        } else {
            state.isPlaying = true;
            fsPlayPauseBtn.textContent = '⏸';
            playMusic();
            showSlide(state.currentIndex);
            startAutoAdvance();
        }
    });

    // كتم
    fsMuteBtn.addEventListener('click', () => {
        state.isMuted = !state.isMuted;

        if (state.audio) {
            state.audio.muted = state.isMuted;
        }

        if (state.isMuted) {
            fsMuteBtn.textContent = '🔇';
            fsMuteBtn.classList.add('fs-muted');
            updateMusicIndicator(false);
        } else {
            fsMuteBtn.textContent = '🔊';
            fsMuteBtn.classList.remove('fs-muted');
            updateMusicIndicator(state.isPlaying);
        }
    });

    // ملء الشاشة
    fsFullscreenBtn.addEventListener('click', () => {
        try {
            if (!document.fullscreenElement) {
                const el = fsSlideshow;
                const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
                if (req) req.call(el);
            } else {
                const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
                if (exit) exit.call(document);
            }
        } catch (err) {
            console.warn('ملء الشاشة غير مدعوم:', err);
        }
    });

    // فتح لوحة الموسيقى
    fsMusicListBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        renderMusicList();
        fsMusicPanel.classList.toggle('active');
    });

    // إغلاق لوحة الموسيقى
    fsMusicPanelClose.addEventListener('click', () => {
        fsMusicPanel.classList.remove('active');
    });

    // إخفاء المؤشرات بعد 3 ثوان من عدم الحركة
    let idleTimeout;
    function resetIdleTimer() {
        clearTimeout(idleTimeout);
        fsSlideshow.classList.remove('fs-idle');
        idleTimeout = setTimeout(() => {
            if (state.isActive && state.isPlaying) {
                fsSlideshow.classList.add('fs-idle');
            }
        }, 3000);
    }

    fsSlideshow.addEventListener('mousemove', resetIdleTimer);
    fsSlideshow.addEventListener('touchstart', resetIdleTimer, { passive: true });
    fsSlideshow.addEventListener('click', resetIdleTimer);

    // اختصارات إضافية: السحب على الجوال
    let touchStartX = 0;
    let touchStartY = 0;
    fsSlideshow.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    fsSlideshow.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;

        // سحب أفقي فقط إذا كان أكبر من 60px وأكبر من السحب العمودي
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                goPrev(); // سحب من اليسار لليمين → السابق (RTL)
            } else {
                goNext(); // سحب من اليمين لليسار → التالي
            }
        }
    }, { passive: true });

    // إيقاف الموسيقى عند إخفاء التبويب
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.isActive && state.isPlaying) {
            pauseMusic();
        } else if (!document.hidden && state.isActive && state.isPlaying) {
            playMusic();
        }
    });

    // ===== CSS إضافي للـ idle =====
    const style = document.createElement('style');
    style.textContent = `
        .fs-slideshow.fs-idle .fs-controls,
        .fs-slideshow.fs-idle .fs-top-controls,
        .fs-slideshow.fs-idle .fs-info-inner {
            opacity: 0.15;
            transition: opacity 0.5s;
        }
        .fs-slideshow.fs-idle .fs-info-inner {
            transform: translateY(10px) !important;
        }
    `;
    document.head.appendChild(style);

    console.log('✅ slideshow.js: جاهز');
})();