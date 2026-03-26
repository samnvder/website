/* =====================================================================
   South End Club - Homepage JavaScript
   Extracted from index.html (Thrive Architect Export)
   ===================================================================== */

// ========== MOBILE MENU TOGGLE ==========
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('secMobileToggle');
    const menuWrapper = document.getElementById('secMenuWrapper');
    const overlay = document.querySelector('.sec-overlay');
    
    if (mobileToggle && menuWrapper) {
        mobileToggle.addEventListener('click', function() {
            menuWrapper.classList.toggle('sec-menu-open');
            document.body.classList.toggle('sec-menu-active');
            
            if (overlay) {
                overlay.classList.toggle('sec-overlay-visible');
            }
        });
        
        // Close menu when clicking overlay
        if (overlay) {
            overlay.addEventListener('click', function() {
                menuWrapper.classList.remove('sec-menu-open');
                document.body.classList.remove('sec-menu-active');
                overlay.classList.remove('sec-overlay-visible');
            });
        }
        
        // Close menu when clicking a link
        const menuLinks = menuWrapper.querySelectorAll('.sec-menu a');
        menuLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                menuWrapper.classList.remove('sec-menu-open');
                document.body.classList.remove('sec-menu-active');
                if (overlay) {
                    overlay.classList.remove('sec-overlay-visible');
                }
            });
        });
    }
});

// ========== VIDEO BANNER HOLIDAY COUNTDOWN ==========
(function() {
    var vbTargetDate = new Date("January 31, 2026 23:59:59").getTime();

    function updateVideoBannerCountdown() {
        var now = new Date().getTime();
        var diff = vbTargetDate - now;
        
        if (diff > 0) {
            var d = Math.floor(diff / (1000 * 60 * 60 * 24));
            var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            var s = Math.floor((diff % (1000 * 60)) / 1000);
            
            var daysEl = document.getElementById("vb-days");
            var hoursEl = document.getElementById("vb-hours");
            var minutesEl = document.getElementById("vb-minutes");
            var secondsEl = document.getElementById("vb-seconds");
            
            if(daysEl) daysEl.innerHTML = (d < 10 ? "0" : "") + d;
            if(hoursEl) hoursEl.innerHTML = (h < 10 ? "0" : "") + h;
            if(minutesEl) minutesEl.innerHTML = (m < 10 ? "0" : "") + m;
            if(secondsEl) secondsEl.innerHTML = (s < 10 ? "0" : "") + s;
        }
    }

    // Run on load and every second
    setInterval(updateVideoBannerCountdown, 1000);
    setTimeout(updateVideoBannerCountdown, 100);
})();

// ========== PROMO CARD COUNTDOWN ==========
(function(){
    var promoEndDate = "January 31, 2026 23:59:59";
    var endDate = new Date(promoEndDate).getTime();
    
    var daysEl = document.getElementById("promo-days");
    var hoursEl = document.getElementById("promo-hours");
    var minutesEl = document.getElementById("promo-minutes");
    var secondsEl = document.getElementById("promo-seconds");
    var countdownContainer = document.getElementById("promo-countdown");
    
    if(!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    function updatePromoCountdown() {
        var now = new Date().getTime();
        var timeRemaining = endDate - now;

        if (timeRemaining < 0) {
            clearInterval(promoCountdownInterval);
            if(countdownContainer) {
                countdownContainer.innerHTML = "<span style='color: #f4e4a6; font-size: 1.2em; font-weight: 600;'>OFFER EXPIRED</span>";
            }
            return;
        }

        var days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        var hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        daysEl.innerHTML = (days < 10 ? "0" : "") + days;
        hoursEl.innerHTML = (hours < 10 ? "0" : "") + hours;
        minutesEl.innerHTML = (minutes < 10 ? "0" : "") + minutes;
        secondsEl.innerHTML = (seconds < 10 ? "0" : "") + seconds;
    }
    
    updatePromoCountdown();
    var promoCountdownInterval = setInterval(updatePromoCountdown, 1000);
})();

// ========== CONTACT FORM TOGGLE ==========
document.addEventListener('DOMContentLoaded', function() {
    var contactButton = document.getElementById('contactButton2');
    
    if (contactButton) {
        contactButton.addEventListener('click', function() {
            var zapierFormContainer = document.getElementById('zapierFormContainer');
            var zapierForm = document.getElementById('zapierForm');

            if (zapierFormContainer.style.display === 'none' || zapierFormContainer.style.display === '') {
                zapierFormContainer.style.display = 'block';
                contactButton.textContent = 'Close';
                
                // Load the iframe only when shown
                if (!zapierForm.src) {
                    zapierForm.src = 'https://interfaces.zapier.com/embed/page/cm1jxql2l001o8bubfm2nwb35?';
                }
            } else {
                zapierFormContainer.style.display = 'none';
                contactButton.textContent = 'Submit a Form';
            }
        });
    }
});

// ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// ========== HEADER SCROLL EFFECT ==========
(function() {
    var header = document.querySelector('.sec-header');
    var lastScrollTop = 0;
    
    if (header) {
        window.addEventListener('scroll', function() {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                header.style.boxShadow = '0 4px 30px rgba(11, 70, 140, 0.15)';
            } else {
                header.style.boxShadow = '0 4px 24px rgba(11, 70, 140, 0.12)';
            }
            
            lastScrollTop = scrollTop;
        });
    }
})();

