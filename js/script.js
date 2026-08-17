document.addEventListener('DOMContentLoaded', () => {
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