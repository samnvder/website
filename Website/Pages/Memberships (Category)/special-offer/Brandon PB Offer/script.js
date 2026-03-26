(function(){
    function init() {
        var btn = document.getElementById('bboFloatingCta');
        if (btn) {
            var timer = null;
            function showBtn() {
                btn.classList.remove('hidden');
                clearTimeout(timer);
                timer = setTimeout(function(){ btn.classList.add('hidden'); }, 1000);
            }
            window.addEventListener('scroll', showBtn, {passive:true});
            window.addEventListener('touchstart', showBtn, {passive:true});
            window.addEventListener('mousemove', showBtn, {passive:true});
            timer = setTimeout(function(){ btn.classList.add('hidden'); }, 1000);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
