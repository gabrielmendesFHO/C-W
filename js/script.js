document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('cw-theme');

    const setTheme = (theme) => {
        const isNight = theme === 'night';
        document.body.classList.toggle('theme-night', isNight);

        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', String(isNight));
            themeToggle.setAttribute('aria-label', isNight ? 'Ativar modo claro' : 'Ativar modo azul noite');
            themeToggle.querySelector('.theme-toggle-text').textContent = isNight ? 'Modo claro' : 'Azul noite';
        }
    };

    setTheme(savedTheme === 'night' ? 'night' : 'light');

    themeToggle?.addEventListener('click', () => {
        const nextTheme = document.body.classList.contains('theme-night') ? 'light' : 'night';
        setTheme(nextTheme);
        localStorage.setItem('cw-theme', nextTheme);
    });

    // Lógica do Menu Responsivo (Mobile)
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');
    
    if(navToggle && nav) {
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
        
        // Fecha o menu ao clicar em um link ou botão do menu
        nav.querySelectorAll('.nav-links a, .nav-cta a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
            });
        });
    }

    // Carrossel de imagens da foto principal (hero)
    const heroSlides = document.querySelectorAll('.hero-slide');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (heroSlides.length > 1 && !reduceMotion) {
        let heroIndex = 0;
        setInterval(() => {
            heroSlides[heroIndex].classList.remove('is-active');
            heroIndex = (heroIndex + 1) % heroSlides.length;
            heroSlides[heroIndex].classList.add('is-active');
        }, 4500);
    }
});
