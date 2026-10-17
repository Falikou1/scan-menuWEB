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

/* ─── Horizontal Continuous Menu Stream ─── */
const showcase     = qs('#phoneShowcase');
const streamTrack  = qs('#streamTrack');
const streamCards  = qsa('.stream-card', streamTrack || document);
const phoneDots    = qsa('.phone-dot');
const activeTitle  = qs('#restaurantTitle');

const RESTAURANT_DATA = [
  { name: "Saveurs d'Afrique", tag: "Saveurs d'Afrique", price: "Dakar · 4 500 FCFA" },
  { name: "Urban Burger Co.", tag: "Urban Burger Co.", price: "Burger · 5 200 FCFA" },
  { name: "Le Jardin Gastronomique", tag: "Le Jardin Gastro", price: "Gourmet · 12 000 FCFA" },
  { name: "Café Lumière", tag: "Café Lumière", price: "Brunch · 2 800 FCFA" }
];

const TOTAL_UNIQUE = 4;
let activeIndex = 4; // Start in the middle set (card 4 = Saveurs d'Afrique)
let isAnimating = false;
let autoTimer = null;
const PAUSE_DURATION = 2600; // Time stationary inside the phone
const TRANSITION_DURATION = 1100; // Slide transition duration
const TRANSITION_EASE = 'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)';

// Calculate card step based on card width + total horizontal margin
const getCardStep = () => {
  if (!streamCards.length) return 336;
  const firstCard = streamCards[0];
  const style = window.getComputedStyle(firstCard);
  const width = firstCard.offsetWidth;
  const marginLeft = parseFloat(style.marginLeft) || 0;
  const marginRight = parseFloat(style.marginRight) || 0;
  return width + marginLeft + marginRight;
};

// Update card dynamic visual states (center, left, right, far, offscreen)
const updateCardStates = () => {
  streamCards.forEach((card, idx) => {
    const diff = idx - activeIndex;
    card.classList.remove('is-center', 'is-left', 'is-right', 'is-far-left', 'is-far-right', 'is-offscreen');
    
    if (diff === 0) {
      card.classList.add('is-center');
    } else if (diff === -1) {
      card.classList.add('is-left');
    } else if (diff === 1) {
      card.classList.add('is-right');
    } else if (diff === -2) {
      card.classList.add('is-far-left');
    } else if (diff === 2) {
      card.classList.add('is-far-right');
    } else {
      card.classList.add('is-offscreen');
    }
  });

  // Update dots
  const currentUnique = activeIndex % TOTAL_UNIQUE;
  phoneDots.forEach((dot, idx) => {
    const isActive = idx === currentUnique;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Update restaurant label
  if (activeTitle && RESTAURANT_DATA[currentUnique]) {
    activeTitle.textContent = RESTAURANT_DATA[currentUnique].name;
  }
};

// Position track at activeIndex
const applyTrackPosition = (withTransition = true) => {
  if (!streamTrack) return;
  const step = getCardStep();
  const translateX = -((activeIndex + 0.5) * step);

  if (withTransition) {
    streamTrack.style.transition = TRANSITION_EASE;
  } else {
    streamTrack.style.transition = 'none';
  }
  streamTrack.style.transform = `translate(${translateX}px, -50%)`;
};

// Slide to a specific index
const slideTo = (targetIndex) => {
  if (isAnimating || !streamTrack) return;
  isAnimating = true;

  activeIndex = targetIndex;
  applyTrackPosition(true);
  updateCardStates();

  setTimeout(() => {
    // Seamless wrap-around reset
    if (activeIndex >= 8) {
      activeIndex = activeIndex - TOTAL_UNIQUE;
      applyTrackPosition(false);
      updateCardStates();
      void streamTrack.offsetHeight;
    } else if (activeIndex < 4) {
      activeIndex = activeIndex + TOTAL_UNIQUE;
      applyTrackPosition(false);
      updateCardStates();
      void streamTrack.offsetHeight;
    }
    isAnimating = false;
  }, TRANSITION_DURATION);
};

const nextCard = () => {
  slideTo(activeIndex + 1);
};

const prevCard = () => {
  slideTo(activeIndex - 1);
};

const startAutoStream = () => {
  stopAutoStream();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
  autoTimer = setInterval(() => {
    nextCard();
  }, PAUSE_DURATION + TRANSITION_DURATION);
};

const stopAutoStream = () => {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
};

// Initialize stream
if (streamTrack && streamCards.length) {
  applyTrackPosition(false);
  updateCardStates();
  startAutoStream();

  // Pause on hover
  if (showcase) {
    showcase.addEventListener('mouseenter', stopAutoStream);
    showcase.addEventListener('mouseleave', startAutoStream);
  }

  // Click on dots
  phoneDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetUnique = parseInt(dot.dataset.slide, 10);
      const currentUnique = activeIndex % TOTAL_UNIQUE;
      let diff = targetUnique - currentUnique;
      if (diff === 0) return;
      slideTo(activeIndex + diff);
      startAutoStream();
    });
  });

  // Click on cards to focus
  streamCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      if (idx !== activeIndex) {
        slideTo(idx);
        startAutoStream();
      }
    });
  });

  // Resize listener
  window.addEventListener('resize', () => {
    applyTrackPosition(false);
  });

  // Touch swipe support
  let touchStartX = 0;
  if (showcase) {
    showcase.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoStream();
    }, { passive: true });

    showcase.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          nextCard();
        } else {
          prevCard();
        }
      }
      startAutoStream();
    }, { passive: true });
  }
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

