/**
 * Pickleball Carousel — Homepage variant.
 * Fixed: lightbox image selection + resize behavior.
 * Requires .carousel-pickleball container. Images injected by build-carousel.js.
 */
(function(){
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function openLightbox(images, startIdx) {
        if (!images || !images.length) return;
        var idx = (startIdx + images.length) % images.length;
        var lb = document.createElement('div');
        lb.className = 'carousel-lightbox';
        var imgWrap = document.createElement('div');
        imgWrap.className = 'carousel-lightbox-img-wrap';
        var img = document.createElement('img');
        img.src = images[idx];
        imgWrap.appendChild(img);
        lb.appendChild(imgWrap);
        var closeBtn = document.createElement('button');
        closeBtn.className = 'carousel-lightbox-close';
        closeBtn.type = 'button';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Close');
        var prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-lightbox-prev';
        prevBtn.type = 'button';
        prevBtn.innerHTML = '&lsaquo;';
        prevBtn.setAttribute('aria-label', 'Previous image');
        var nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-lightbox-next';
        nextBtn.type = 'button';
        nextBtn.innerHTML = '&rsaquo;';
        nextBtn.setAttribute('aria-label', 'Next image');
        function go(delta) {
            idx = (idx + delta + images.length) % images.length;
            img.src = images[idx];
        }
        function keyHandler(e) {
            if (e.key === 'Escape') { close(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        }
        closeBtn.addEventListener('click', close);
        prevBtn.addEventListener('click', function(e) { e.stopPropagation(); go(-1); });
        nextBtn.addEventListener('click', function(e) { e.stopPropagation(); go(1); });
        lb.addEventListener('click', function(e) {
            if (e.target === lb || e.target === imgWrap) close();
        });
        document.addEventListener('keydown', keyHandler);
        function close() {
            if (lb.parentNode) lb.parentNode.removeChild(lb);
            document.removeEventListener('keydown', keyHandler);
        }
        lb.appendChild(closeBtn);
        lb.appendChild(prevBtn);
        lb.appendChild(nextBtn);
        document.body.appendChild(lb);
    }

    function init() {
        /* ── Scroll animation observer ── */
        var observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var delay = entry.target.dataset.delay || 0;
                    setTimeout(function() { entry.target.classList.add('visible'); }, delay);
                }
            });
        }, observerOptions);
        document.querySelectorAll('.carousel-pickleball.animate-on-scroll').forEach(function(el) { observer.observe(el); });

        var container = document.querySelector('.carousel-pickleball');
        if (!container) return;
        var wrap = container.querySelector('[data-carousel]');
        var track = wrap ? wrap.querySelector('.carousel-track') : null;
        var slideEls = track ? Array.prototype.slice.call(track.querySelectorAll('.carousel-slide')) : [];
        var imgs = track ? Array.prototype.slice.call(track.querySelectorAll('img')) : [];
        var dotsWrap = wrap ? wrap.querySelector('.carousel-dots') : null;
        var browseBtn = container.querySelector('[data-browse-trigger]');
        var categoriesEl = container.querySelector('.carousel-categories');
        var catBtns = categoriesEl ? categoriesEl.querySelectorAll('.carousel-cat-btn') : [];
        var albumEls = container.querySelectorAll('.carousel-album');
        var albumArr = Array.prototype.slice.call(albumEls);

        var currentView = 'all';
        var current = 0, interval = null;

        /*
         * FIX #1 — Simplified display order.
         * Shuffle slide elements in DOM directly. DOM order === display order === dot order.
         * No mapping needed; lightbox always gets the right src.
         */
        function shuffleSlides() {
            var indices = [];
            for (var i = 0; i < slideEls.length; i++) indices.push(i);
            indices = shuffle(indices);
            for (var i = 0; i < indices.length; i++) {
                track.appendChild(slideEls[indices[i]]);
            }
            slideEls = Array.prototype.slice.call(track.querySelectorAll('.carousel-slide'));
            imgs = Array.prototype.slice.call(track.querySelectorAll('img'));
        }

        /*
         * FIX #2 — Resize handling.
         * Fall back to wrap.offsetWidth for Thrive iframes where getBoundingClientRect returns 0.
         */
        var isDynamic = wrap && wrap.hasAttribute('data-carousel-dynamic');

        function updateFrameHeight() {
            if (!isDynamic || !wrap) return;
            var img = imgs[current];
            if (!img || !img.complete || !img.naturalWidth) return;
            var wrapWidth = wrap.offsetWidth || wrap.getBoundingClientRect().width;
            if (wrapWidth <= 0) return;
            var h = Math.round(wrapWidth * (img.naturalHeight / img.naturalWidth));
            wrap.style.height = h + 'px';
        }

        function goToIndex(idx) {
            current = idx;
            track.style.transform = 'translateX(-' + (current * 100) + '%)';
            var dots = dotsWrap ? dotsWrap.querySelectorAll('.carousel-dot') : [];
            for (var j = 0; j < dots.length; j++) {
                dots[j].className = 'carousel-dot' + (j === current ? ' active' : '');
            }
            requestAnimationFrame(function() { requestAnimationFrame(updateFrameHeight); });
        }

        function nextSlide() {
            goToIndex((current + 1) % slideEls.length);
        }

        function prevSlide() {
            goToIndex(current === 0 ? slideEls.length - 1 : current - 1);
        }

        function resetInterval() {
            clearInterval(interval);
            interval = setInterval(nextSlide, 3000);
        }

        /* ── Carousel setup ── */
        if (wrap && track && imgs.length) {
            shuffleSlides();

            if (dotsWrap) {
                dotsWrap.innerHTML = '';
                for (var i = 0; i < imgs.length; i++) {
                    var dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
                    dot.setAttribute('data-index', String(i));
                    dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
                    dot.addEventListener('click', function() {
                        goToIndex(parseInt(this.getAttribute('data-index')));
                        resetInterval();
                    });
                    dotsWrap.appendChild(dot);
                }
            }

            if (isDynamic) {
                var checkAndUpdate = function() {
                    if (imgs[current] && imgs[current].complete && imgs[current].naturalWidth) updateFrameHeight();
                };
                for (var k = 0; k < imgs.length; k++) imgs[k].addEventListener('load', checkAndUpdate);
                checkAndUpdate();
                window.addEventListener('resize', updateFrameHeight);
            }

            var startX = 0;
            wrap.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, {passive:true});
            wrap.addEventListener('touchend', function(e) {
                var diff = startX - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 40) {
                    if (diff > 0) nextSlide();
                    else prevSlide();
                    resetInterval();
                }
            }, {passive:true});

            function getCarouselSrcs() {
                var srcs = [];
                for (var i = 0; i < imgs.length; i++) srcs.push(imgs[i].src);
                return srcs;
            }

            for (var m = 0; m < slideEls.length; m++) {
                slideEls[m].addEventListener('click', function(e) {
                    e.stopPropagation();
                    openLightbox(getCarouselSrcs(), current);
                });
            }

            resetInterval();
        }

        /* ── View switching ── */
        function showView(view) {
            currentView = view;
            if (view === 'all') {
                wrap.removeAttribute('data-carousel-hidden');
                for (var i = 0; i < albumArr.length; i++) albumArr[i].hidden = true;
            } else {
                wrap.setAttribute('data-carousel-hidden', '');
                for (var i = 0; i < albumArr.length; i++) {
                    albumArr[i].hidden = (albumArr[i].getAttribute('data-album') !== view);
                }
            }
            for (var i = 0; i < catBtns.length; i++) {
                var v = catBtns[i].getAttribute('data-view');
                catBtns[i].classList.toggle('active', v === view);
                catBtns[i].setAttribute('aria-selected', v === view ? 'true' : 'false');
            }
            syncBrowseButton();
        }

        function syncBrowseButton() {
            if (!browseBtn) return;
            if (currentView !== 'all') {
                browseBtn.textContent = 'Back to Carousel!';
                browseBtn.setAttribute('aria-expanded', 'false');
                if (categoriesEl) categoriesEl.classList.remove('is-open');
            } else {
                browseBtn.textContent = 'Browse by Event';
                var isOpen = categoriesEl && categoriesEl.classList.contains('is-open');
                browseBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            }
        }

        /* ── Populate album grids + lightbox ── */
        var byCat = { halloween: [], beachlife: [] };
        var albumSrcs = { halloween: [], beachlife: [] };
        for (var i = 0; i < imgs.length; i++) {
            var cat = imgs[i].getAttribute('data-category');
            if (cat && byCat[cat]) {
                albumSrcs[cat].push(imgs[i].src);
                var clone = imgs[i].cloneNode(true);
                clone.style.cssText = '';
                byCat[cat].push(clone);
            }
        }
        for (var i = 0; i < albumArr.length; i++) {
            var aCat = albumArr[i].getAttribute('data-album');
            var grid = albumArr[i].querySelector('.carousel-album-grid');
            if (grid && byCat[aCat]) {
                grid.innerHTML = '';
                var srcs = albumSrcs[aCat] || [];
                for (var j = 0; j < byCat[aCat].length; j++) {
                    var el = byCat[aCat][j];
                    (function(images, idx) {
                        el.addEventListener('click', function(e) {
                            e.preventDefault();
                            openLightbox(images, idx);
                        });
                    })(srcs, j);
                    grid.appendChild(el);
                }
            }
        }

        if (browseBtn) {
            browseBtn.addEventListener('click', function() {
                if (currentView !== 'all') {
                    showView('all');
                } else {
                    if (categoriesEl) {
                        categoriesEl.classList.toggle('is-open');
                        syncBrowseButton();
                    }
                }
            });
        }

        for (var i = 0; i < catBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    showView(btn.getAttribute('data-view'));
                });
            })(catBtns[i]);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
