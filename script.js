/**
 * Menu Scan – Main JavaScript
 * Handles: navbar scroll, mobile menu, phone slider, scroll reveal, phone clock
 */

/* ─── Utility ─── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─── Navbar ─── */
const navbar = qs('#navbar');
const updateNavbar = () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

/* ─── Mobile Menu (if present) ─── */
const hamburger  = qs('#hamburger');
const mobileMenu = qs('#mobileMenu');

if (hamburger && mobileMenu) {
  const toggleMobileMenu = (open) => {
    const isOpen = open !== undefined ? open : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  hamburger.addEventListener('click', () => toggleMobileMenu());

  // Close on link click
  qsa('.mobile-link, .mobile-menu .btn').forEach(link => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });

  // Close on outside click
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) toggleMobileMenu(false);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      toggleMobileMenu(false);
    }
  });
}

/* ─── PowerPoint-Style Phone Showcase Slider ─── */
const showcase     = qs('#phoneShowcase');
const phoneScreen  = qs('#phoneScreen');
const phoneSlides  = qsa('.phone-slide', phoneScreen || document);
const phoneDots    = qsa('.phone-dot');
const activeTitle  = qs('#restaurantTitle');
const prevBtn      = qs('#phonePrevBtn');
const nextBtn      = qs('#phoneNextBtn');

const RESTAURANT_DATA = [
  { name: "Saveurs d'Afrique", tag: "Saveurs d'Afrique", price: "Dakar · 4 500 FCFA" },
  { name: "Urban Burger Co.", tag: "Urban Burger Co.", price: "Burger · 5 200 FCFA" },
  { name: "Le Jardin Gastronomique", tag: "Le Jardin Gastro", price: "Gourmet · 12 000 FCFA" },
  { name: "Café Lumière", tag: "Café Lumière", price: "Brunch · 2 800 FCFA" }
];

const TOTAL_SLIDES = phoneSlides.length || 4;
let currentIndex = 0;
let isAnimating = false;
let autoTimer = null;
const SLIDE_PAUSE_DURATION = 3500; // Time stationary inside the phone
const SLIDE_TRANSITION_DURATION = 850; // PowerPoint transition duration (matches CSS)

// Go to a specific slide with smooth PowerPoint transition (fade + slide + subtle zoom)
const goToSlide = (targetIndex, direction = 'next') => {
  if (isAnimating || targetIndex === currentIndex || !phoneSlides.length) return;
  isAnimating = true;

  // Normalize index within bounds [0, TOTAL_SLIDES - 1]
  const nextIndex = (targetIndex + TOTAL_SLIDES) % TOTAL_SLIDES;
  const currentSlide = phoneSlides[currentIndex];
  const nextSlide = phoneSlides[nextIndex];

  // Update dots navigation state
  phoneDots.forEach((dot, idx) => {
    const isActive = idx === nextIndex;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Smooth fade transition for the restaurant title label
  if (activeTitle && RESTAURANT_DATA[nextIndex]) {
    activeTitle.style.opacity = '0';
    activeTitle.style.transform = 'translateY(4px)';
    setTimeout(() => {
      activeTitle.textContent = RESTAURANT_DATA[nextIndex].name;
      activeTitle.style.opacity = '1';
      activeTitle.style.transform = 'translateY(0)';
    }, 200);
  }

  // Remove any legacy animation classes
  phoneSlides.forEach(slide => {
    slide.classList.remove('slide-in-next', 'slide-out-next', 'slide-in-prev', 'slide-out-prev');
  });

  // Apply direction-based PowerPoint transition classes
  if (direction === 'next') {
    nextSlide.classList.add('slide-in-next');
    currentSlide.classList.add('slide-out-next');
  } else {
    nextSlide.classList.add('slide-in-prev');
    currentSlide.classList.add('slide-out-prev');
  }

  // When animation finishes, clean up and set active state
  setTimeout(() => {
    currentSlide.classList.remove('is-active', 'slide-out-next', 'slide-out-prev');
    nextSlide.classList.remove('slide-in-next', 'slide-in-prev');
    nextSlide.classList.add('is-active');
    currentIndex = nextIndex;
    isAnimating = false;
  }, SLIDE_TRANSITION_DURATION);
};

const nextSlide = () => {
  goToSlide(currentIndex + 1, 'next');
};

const prevSlide = () => {
  goToSlide(currentIndex - 1, 'prev');
};

const startAutoSlide = () => {
  stopAutoSlide();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
  autoTimer = setInterval(() => {
    nextSlide();
  }, SLIDE_PAUSE_DURATION + SLIDE_TRANSITION_DURATION);
};

const stopAutoSlide = () => {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
};

// Initialize PowerPoint Showcase
if (phoneSlides.length) {
  // Ensure the initial active slide is properly displayed
  phoneSlides.forEach((slide, idx) => {
    slide.classList.toggle('is-active', idx === 0);
  });
  phoneDots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === 0);
  });
  if (activeTitle && RESTAURANT_DATA[0]) {
    activeTitle.textContent = RESTAURANT_DATA[0].name;
  }

  startAutoSlide();

  // Navigation buttons (Prev / Next)
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoSlide();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoSlide();
    });
  }

  // Dots click navigation
  phoneDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.slide, 10);
      if (isNaN(target) || target === currentIndex) return;
      const dir = target > currentIndex ? 'next' : 'prev';
      goToSlide(target, dir);
      startAutoSlide();
    });
  });

  // Pause on hover
  if (showcase) {
    showcase.addEventListener('mouseenter', stopAutoSlide);
    showcase.addEventListener('mouseleave', startAutoSlide);
  }

  // Click on phone screen advances slide
  if (phoneScreen) {
    phoneScreen.style.cursor = 'pointer';
    phoneScreen.addEventListener('click', () => {
      nextSlide();
      startAutoSlide();
    });
  }

  // Touch swipe support on phone screen
  let touchStartX = 0;
  if (showcase) {
    showcase.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoSlide();
    }, { passive: true });

    showcase.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
      startAutoSlide();
    }, { passive: true });
  }

  // Keyboard navigation when user is on the page
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
      startAutoSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      startAutoSlide();
    }
  });
}

/* ─── Live Clock inside phone ─── */
const phoneTimeEl = qs('#phoneTime');
const updateClock = () => {
  if (!phoneTimeEl) return;
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  phoneTimeEl.textContent = `${h}:${m}`;
};
updateClock();
setInterval(updateClock, 10000);

/* ─── Scroll Reveal ─── */
const revealEls = qsa('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // only animate once
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => observer.observe(el));

/* ─── Smooth anchor scrolling (account for fixed navbar) ─── */
qsa('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = qs(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = navbar.getBoundingClientRect().height;
    const top  = target.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ─── Active nav link highlight on scroll (if present) ─── */
const sections = qsa('main section[id]');
const navLinks = qsa('.nav-links a');

if (navLinks.length) {
  const highlightNav = () => {
    const scrollY = window.scrollY + 100;
    let activeId  = '';

    sections.forEach(sec => {
      if (sec.offsetTop <= scrollY) activeId = sec.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.style.color      = href === activeId ? 'var(--orange)' : '';
      link.style.background = href === activeId ? 'var(--orange-soft)' : '';
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();
}

