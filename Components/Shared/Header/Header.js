/**
 * Header / Mobile Navigation Toggle
 * Migrated from WordPress footer snippet
 * Controls .sec-mobile-toggle and .sec-menu-wrapper
 */

(function () {
  function init() {
    var toggle = document.querySelector('.sec-mobile-toggle');
    var menu = document.querySelector('.sec-menu-wrapper');

    if (!toggle || !menu) {
      setTimeout(init, 300);
      return;
    }

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var isOpen = document.body.classList.contains('sec-menu-active');

      if (isOpen) {
        document.body.classList.remove('sec-menu-active');
        menu.classList.remove('sec-menu-open');
      } else {
        document.body.classList.add('sec-menu-active');
        menu.classList.add('sec-menu-open');
      }
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
