================================================================================
                    SOUTH END CLUB - JAVASCRIPT PATTERNS
                         Interaction Standards for Pages
================================================================================

Last Updated: December 2024
Applies to: All section pages (NOT index.html)

================================================================================
                              OVERVIEW
================================================================================

All JavaScript is embedded inline in HTML files via <script> tags at the bottom
of each page, just before </body>. This is a static site without a build process.

JavaScript handles:
- Navigation visibility & fade behavior
- Active section tracking
- Mobile accordion toggle
- Smooth scrolling
- Scroll animations (IntersectionObserver)
- Optional: Lightbox, Carousel, Smart App Links


================================================================================
                         1. SCRIPT STRUCTURE
================================================================================

All page scripts follow this structure:

<script>
document.addEventListener("DOMContentLoaded", function () {

  // 1. Mobile section reordering (if needed)
  // 2. Smooth scroll for navigation
  // 3. Scroll animations (IntersectionObserver)
  // 4. Navigation initialization
  // 5. Nav fade behavior
  // 6. Active section tracking
  // 7. Optional features (carousel, lightbox, etc.)

});
</script>


================================================================================
                    2. NAVIGATION INITIALIZATION
================================================================================

Standard element selection:

  const floatingNav = document.getElementById('floatingNav');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavInner = document.getElementById('mobileNavInner');
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const currentSectionText = mobileNavToggle 
    ? mobileNavToggle.querySelector('.current-section') 
    : null;
  const hero = document.querySelector('.hero');
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  let navFadeTimeout;
  let desktopNavFadeTimeout;
  let isMobile = window.innerWidth <= 1024;

  // Mobile check function
  function checkMobile() {
    isMobile = window.innerWidth <= 1024;
  }
  window.addEventListener('resize', checkMobile);


================================================================================
                    3. SECTION NAMES MAPPING
================================================================================

Each page defines its own section names for the mobile nav toggle display.
This object maps section IDs to display names.

PAGE-SPECIFIC CONFIGURATION:

  const sectionNames = {
    'section-id-1': 'Display Name 1',
    'section-id-2': 'Display Name 2',
    'section-id-3': 'Display Name 3'
  };

EXAMPLES FROM ACTUAL PAGES:

  // Pools page
  const sectionNames = {
    'main-pool': 'Main Pool',
    'shallow-pool': 'Shallow Pool',
    'spa': 'Spa',
    'aqua-fitness': 'Aqua Fitness',
    'swim-instructors': 'Swim Instructors'
  };

  // Fitness page
  const sectionNames = {
    'weight-room': 'Weight Room',
    'cardio': 'Cardio',
    'free-weights': 'Free Weights',
    'group-fitness': 'Group Fitness',
    'personal-training': 'Personal Training'
  };

  // Racquet Sports page
  const sectionNames = {
    'tennis': 'Tennis',
    'pickleball': 'Pickleball',
    'padel': 'Padel',
    'paddle-tennis': 'POP Tennis',
    'squash': 'Squash',
    'lessons': 'Lessons'
  };


================================================================================
                    4. NAV AUTO-FADE BEHAVIOR
================================================================================

Both desktop and mobile navs fade to 0.15 opacity after idle period.

MOBILE NAV FADE (1s timeout):

  function showMobileNav() {
    if (mobileNav && mobileNav.classList.contains('visible')) {
      mobileNav.classList.remove('faded');
    }
  }

  function startNavFadeTimer() {
    if (!isMobile) return;
    
    clearTimeout(navFadeTimeout);
    showMobileNav();
    
    navFadeTimeout = setTimeout(function() {
      if (mobileNav && 
          mobileNav.classList.contains('visible') && 
          !mobileNavInner.classList.contains('expanded')) {
        mobileNav.classList.add('faded');
      }
    }, 1000);
  }


DESKTOP NAV FADE (0.75s timeout):

  function showDesktopNav() {
    if (floatingNav && floatingNav.classList.contains('visible')) {
      floatingNav.classList.remove('faded');
    }
  }

  function startDesktopNavFadeTimer() {
    if (isMobile) return;
    
    clearTimeout(desktopNavFadeTimeout);
    showDesktopNav();
    
    desktopNavFadeTimeout = setTimeout(function() {
      if (floatingNav && floatingNav.classList.contains('visible')) {
        floatingNav.classList.add('faded');
      }
    }, 750);
  }


FADE TRIGGERS:

  // On scroll - restart both timers
  window.addEventListener('scroll', function() {
    startNavFadeTimer();
    startDesktopNavFadeTimer();
  }, { passive: true });

  // Desktop: On hover, show and restart timer
  if (floatingNav) {
    floatingNav.addEventListener('mouseenter', showDesktopNav);
    floatingNav.addEventListener('mouseleave', startDesktopNavFadeTimer);
  }


================================================================================
                    5. MOBILE ACCORDION TOGGLE
================================================================================

Toggle expanded state and manage fade timer:

  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', function() {
      mobileNavInner.classList.toggle('expanded');
      
      if (mobileNavInner.classList.contains('expanded')) {
        // Keep visible while expanded
        mobileNav.classList.remove('faded');
        clearTimeout(navFadeTimeout);
      } else {
        // Start fade timer when collapsed
        startNavFadeTimer();
      }
    });
  }

  // Close accordion when clicking outside
  document.addEventListener('click', function(e) {
    if (mobileNavInner && !mobileNav.contains(e.target)) {
      mobileNavInner.classList.remove('expanded');
    }
  });


================================================================================
                    6. HERO VISIBILITY OBSERVER
================================================================================

Hide nav when hero is visible, show when scrolled past:

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Hero visible - hide all navs
        floatingNav.classList.remove('visible');
        floatingNav.classList.remove('faded');
        mobileNav.classList.remove('visible');
        mobileNav.classList.remove('faded');
        if (mobileNavInner) mobileNavInner.classList.remove('expanded');
        clearTimeout(navFadeTimeout);
        clearTimeout(desktopNavFadeTimeout);
      } else {
        // Scrolled past hero - show navs
        floatingNav.classList.add('visible');
        mobileNav.classList.add('visible');
        startNavFadeTimer();
        startDesktopNavFadeTimer();
      }
    });
  }, { threshold: 0.5 });

  if (hero) {
    heroObserver.observe(hero);
  }


================================================================================
                    7. ACTIVE SECTION TRACKING
================================================================================

Detects which section is most visible and updates nav highlighting:

  let currentSection = '';

  function updateActiveSection() {
    let maxVisibility = 0;
    let mostVisibleSection = '';
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate visible area
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(windowHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      
      // Favor sections closer to center
      const centerOffset = Math.abs((rect.top + rect.bottom) / 2 - windowHeight / 2);
      const visibility = visibleHeight - (centerOffset * 0.3);
      
      // Must be partially in upper portion of viewport
      if (visibility > maxVisibility && rect.top < windowHeight * 0.6) {
        maxVisibility = visibility;
        mostVisibleSection = section.id;
      }
    });
    
    if (mostVisibleSection && mostVisibleSection !== currentSection) {
      currentSection = mostVisibleSection;
      
      // Update nav link active states
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === currentSection);
      });
      
      // Update mobile nav toggle text
      if (currentSectionText && sectionNames[currentSection]) {
        currentSectionText.textContent = sectionNames[currentSection];
      }
    }
  }

  // Throttled scroll handler using requestAnimationFrame
  let scrollTimeout;
  function throttledUpdateActiveSection() {
    if (!scrollTimeout) {
      scrollTimeout = requestAnimationFrame(() => {
        updateActiveSection();
        scrollTimeout = null;
      });
    }
  }

  window.addEventListener('scroll', throttledUpdateActiveSection, { passive: true });
  updateActiveSection(); // Run on page load


================================================================================
                    8. SMOOTH SCROLLING
================================================================================

Handle anchor link clicks with smooth scroll + accordion close:

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        // Smooth scroll with requestAnimationFrame for performance
        requestAnimationFrame(() => {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        });
        
        // Close mobile nav accordion after clicking a link
        const mobileNavInner = document.getElementById('mobileNavInner');
        if (mobileNavInner) {
          mobileNavInner.classList.remove('expanded');
          startNavFadeTimer();
        }
      }
    }, { passive: false });
  });


================================================================================
                    9. SCROLL ANIMATIONS
================================================================================

Fade-in elements as they enter viewport:

  const observerOptions = {
    root: null,
    rootMargin: '50px',  // Trigger slightly before visible
    threshold: 0.1       // 10% visible triggers animation
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

HTML USAGE:

  <div class="section-media animate-on-scroll" data-delay="100">
    ...
  </div>


================================================================================
                    10. OPTIONAL: IMAGE LIGHTBOX
================================================================================

Used on: Pools page (Swim Instructors section)

HTML STRUCTURE:

  <!-- Lightbox overlay (place before closing </body>) -->
  <div class="lightbox-overlay" id="lightboxOverlay">
    <button class="lightbox-close" id="lightboxClose" aria-label="Close image">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" 
           stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <img src="" alt="" class="lightbox-image" id="lightboxImage">
  </div>

JAVASCRIPT:

  const lightboxOverlay = document.getElementById('lightboxOverlay');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');
  const clickableImages = document.querySelectorAll('.instructor-image');

  // Open lightbox
  clickableImages.forEach(imageContainer => {
    imageContainer.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const img = this.querySelector('img');
      if (img) {
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt;
        lightboxOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Close lightbox
  function closeLightbox() {
    lightboxOverlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!lightboxOverlay.classList.contains('active')) {
        lightboxImage.src = '';
      }
    }, 300);
  }

  // Close triggers
  lightboxOverlay.addEventListener('click', function(e) {
    if (e.target === lightboxOverlay) closeLightbox();
  });
  lightboxClose.addEventListener('click', function(e) {
    e.stopPropagation();
    closeLightbox();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightboxOverlay.classList.contains('active')) {
      closeLightbox();
    }
  });


================================================================================
                    11. OPTIONAL: CAROUSEL
================================================================================

Used on: Events page (Gallery section)

HTML STRUCTURE:

  <div class="carousel-gallery" id="banquetCarousel">
    <button class="carousel-btn carousel-prev">
      <svg>...</svg>
    </button>
    <div class="carousel-viewport">
      <div class="carousel-track">
        <div class="carousel-slide"><img src="..." alt="..."></div>
        <!-- more slides -->
      </div>
    </div>
    <button class="carousel-btn carousel-next">
      <svg>...</svg>
    </button>
  </div>

JAVASCRIPT:

  const carousel = document.getElementById('banquetCarousel');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    
    let currentIndex = 0;
    let autoplayInterval;
    const slidesPerView = window.innerWidth <= 768 ? 1 : 
                          window.innerWidth <= 1024 ? 2 : 3;
    const maxIndex = Math.max(0, slides.length - slidesPerView);
    
    function updateCarousel() {
      const slideWidth = slides[0].offsetWidth;
      const gap = 24;
      track.style.transform = `translateX(-${currentIndex * (slideWidth + gap)}px)`;
    }
    
    function nextSlide() {
      currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
      updateCarousel();
    }
    
    function prevSlide() {
      currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
      updateCarousel();
    }
    
    // Autoplay
    function startAutoplay() {
      autoplayInterval = setInterval(nextSlide, 2000);
    }
    function stopAutoplay() {
      clearInterval(autoplayInterval);
    }
    
    startAutoplay();
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    
    prevBtn.addEventListener('click', () => {
      stopAutoplay(); prevSlide(); startAutoplay();
    });
    nextBtn.addEventListener('click', () => {
      stopAutoplay(); nextSlide(); startAutoplay();
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoplay();
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? nextSlide() : prevSlide();
      }
      startAutoplay();
    }, { passive: true });
  }


================================================================================
                    12. OPTIONAL: SMART APP LINKS
================================================================================

Used on: Pools page (Reserve Lane button)

Detects platform and routes to appropriate destination:

  function handleReserveLane(e) {
    if (e) e.preventDefault();
    
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /android/i.test(userAgent);
    
    // Desktop: Go to website
    if (!isIOS && !isAndroid) {
      window.open('https://sewe.clubautomation.com', '_blank');
      return;
    }
    
    // iOS: Go to App Store
    if (isIOS) {
      window.location.href = 'https://apps.apple.com/us/app/south-west-end-club/id6448953961';
      return;
    }
    
    // Android: Intent URL (tries app, falls back to Play Store)
    if (isAndroid) {
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.daxko.club.automation.sewe';
      const intentUrl = 'intent://sewe.clubautomation.com#Intent;' +
        'scheme=https;' +
        'package=com.daxko.club.automation.sewe;' +
        'S.browser_fallback_url=' + encodeURIComponent(playStoreUrl) + ';' +
        'end';
      
      window.location.href = intentUrl;
      setTimeout(() => {
        if (document.hasFocus && document.hasFocus()) {
          window.location.href = playStoreUrl;
        }
      }, 2000);
      return;
    }
    
    // Ultimate fallback
    window.open('https://sewe.clubautomation.com', '_blank');
  }

HTML USAGE:

  <a href="#" onclick="handleReserveLane(event)" class="btn btn-primary">
    Reserve a Lane
  </a>


================================================================================
                    13. MOBILE PERFORMANCE OPTIMIZATIONS
================================================================================

Apply these patterns for smooth mobile experience:

1. USE PASSIVE EVENT LISTENERS:
   window.addEventListener('scroll', handler, { passive: true });

2. USE requestAnimationFrame FOR ANIMATIONS:
   requestAnimationFrame(() => { target.scrollIntoView(...); });

3. THROTTLE SCROLL HANDLERS:
   let scrollTimeout;
   function throttledHandler() {
     if (!scrollTimeout) {
       scrollTimeout = requestAnimationFrame(() => {
         // do work
         scrollTimeout = null;
       });
     }
   }

4. PREVENT NESTED SCROLLING ON IMAGES:
   img { touch-action: pan-y; }

5. DEBOUNCE RESIZE HANDLERS:
   let resizeTimer;
   window.addEventListener('resize', function() {
     clearTimeout(resizeTimer);
     resizeTimer = setTimeout(function() {
       // do work
     }, 250);
   });


================================================================================
                         14. COMPLETE PAGE TEMPLATE
================================================================================

Copy this template when creating a new page:

<script>
document.addEventListener("DOMContentLoaded", function () {

  // =====================
  // SMOOTH SCROLLING
  // =====================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        const mobileNavInner = document.getElementById('mobileNavInner');
        if (mobileNavInner) mobileNavInner.classList.remove('expanded');
      }
    }, { passive: false });
  });

  // =====================
  // SCROLL ANIMATIONS
  // =====================
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), delay);
      }
    });
  }, { root: null, rootMargin: '50px', threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

  // =====================
  // NAVIGATION
  // =====================
  const floatingNav = document.getElementById('floatingNav');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavInner = document.getElementById('mobileNavInner');
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const currentSectionText = mobileNavToggle?.querySelector('.current-section');
  const hero = document.querySelector('.hero');
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  let navFadeTimeout, desktopNavFadeTimeout;
  let isMobile = window.innerWidth <= 1024;

  function checkMobile() { isMobile = window.innerWidth <= 1024; }
  window.addEventListener('resize', checkMobile);

  // =====================
  // SECTION NAMES (PAGE-SPECIFIC)
  // =====================
  const sectionNames = {
    'section-1': 'Section One',
    'section-2': 'Section Two',
    'section-3': 'Section Three'
  };

  // =====================
  // NAV FADE BEHAVIOR
  // =====================
  function showMobileNav() {
    if (mobileNav?.classList.contains('visible')) mobileNav.classList.remove('faded');
  }
  function startNavFadeTimer() {
    if (!isMobile) return;
    clearTimeout(navFadeTimeout);
    showMobileNav();
    navFadeTimeout = setTimeout(() => {
      if (mobileNav?.classList.contains('visible') && !mobileNavInner?.classList.contains('expanded')) {
        mobileNav.classList.add('faded');
      }
    }, 1000);
  }
  function showDesktopNav() {
    if (floatingNav?.classList.contains('visible')) floatingNav.classList.remove('faded');
  }
  function startDesktopNavFadeTimer() {
    if (isMobile) return;
    clearTimeout(desktopNavFadeTimeout);
    showDesktopNav();
    desktopNavFadeTimeout = setTimeout(() => {
      if (floatingNav?.classList.contains('visible')) floatingNav.classList.add('faded');
    }, 750);
  }

  // Desktop hover behavior
  if (floatingNav) {
    floatingNav.addEventListener('mouseenter', showDesktopNav);
    floatingNav.addEventListener('mouseleave', startDesktopNavFadeTimer);
  }

  // =====================
  // MOBILE ACCORDION
  // =====================
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => {
      mobileNavInner.classList.toggle('expanded');
      if (mobileNavInner.classList.contains('expanded')) {
        mobileNav.classList.remove('faded');
        clearTimeout(navFadeTimeout);
      } else {
        startNavFadeTimer();
      }
    });
  }
  document.addEventListener('click', (e) => {
    if (mobileNavInner && !mobileNav.contains(e.target)) {
      mobileNavInner.classList.remove('expanded');
    }
  });

  // =====================
  // HERO OBSERVER
  // =====================
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        floatingNav?.classList.remove('visible', 'faded');
        mobileNav?.classList.remove('visible', 'faded');
        mobileNavInner?.classList.remove('expanded');
        clearTimeout(navFadeTimeout);
        clearTimeout(desktopNavFadeTimeout);
      } else {
        floatingNav?.classList.add('visible');
        mobileNav?.classList.add('visible');
        startNavFadeTimer();
        startDesktopNavFadeTimer();
      }
    });
  }, { threshold: 0.5 });

  if (hero) heroObserver.observe(hero);

  // =====================
  // ACTIVE SECTION TRACKING
  // =====================
  let currentSection = '';

  function updateActiveSection() {
    let maxVisibility = 0, mostVisibleSection = '';
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(windowHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const centerOffset = Math.abs((rect.top + rect.bottom) / 2 - windowHeight / 2);
      const visibility = visibleHeight - (centerOffset * 0.3);
      
      if (visibility > maxVisibility && rect.top < windowHeight * 0.6) {
        maxVisibility = visibility;
        mostVisibleSection = section.id;
      }
    });
    
    if (mostVisibleSection && mostVisibleSection !== currentSection) {
      currentSection = mostVisibleSection;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === currentSection);
      });
      if (currentSectionText && sectionNames[currentSection]) {
        currentSectionText.textContent = sectionNames[currentSection];
      }
    }
  }

  // Throttled scroll handler
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
      scrollTimeout = requestAnimationFrame(() => {
        updateActiveSection();
        scrollTimeout = null;
      });
    }
    startNavFadeTimer();
    startDesktopNavFadeTimer();
  }, { passive: true });
  
  updateActiveSection();

});
</script>


================================================================================
                         END OF JS PATTERNS
================================================================================

