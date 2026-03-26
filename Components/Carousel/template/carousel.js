/**
 * Generic Carousel Base — Reusable for any amenity.
 * Shuffle, dots, auto-advance, swipe, lightbox, dynamic height.
 * Images injected by build-carousel.js. Works with [data-carousel].
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
        document.querySelectorAll('[data-carousel]').forEach(function(wrap) {
            var track = wrap.querySelector('.carousel-track');
            if (!track) return;
            var slideEls = Array.prototype.slice.call(track.querySelectorAll('.carousel-slide'));
            var imgs = Array.prototype.slice.call(track.querySelectorAll('img'));
            if (!imgs.length) return;
            var dotsWrap = wrap.querySelector('.carousel-dots');
            var current = 0, interval = null;
            var isDynamic = wrap.hasAttribute('data-carousel-dynamic');

            function shuffleSlides() {
                var indices = [];
                for (var i = 0; i < slideEls.length; i++) indices.push(i);
                indices = shuffle(indices);
                for (var i = 0; i < indices.length; i++) track.appendChild(slideEls[indices[i]]);
                slideEls = Array.prototype.slice.call(track.querySelectorAll('.carousel-slide'));
                imgs = Array.prototype.slice.call(track.querySelectorAll('img'));
            }

            function updateFrameHeight() {
                if (!isDynamic) return;
                var img = imgs[current];
                if (!img || !img.complete || !img.naturalWidth) return;
                var wrapWidth = wrap.offsetWidth || wrap.getBoundingClientRect().width;
                if (wrapWidth <= 0) return;
                wrap.style.height = Math.round(wrapWidth * (img.naturalHeight / img.naturalWidth)) + 'px';
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

            function nextSlide() { goToIndex((current + 1) % slideEls.length); }
            function prevSlide() { goToIndex(current === 0 ? slideEls.length - 1 : current - 1); }
            function resetInterval() {
                clearInterval(interval);
                interval = setInterval(nextSlide, 3000);
            }

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
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
