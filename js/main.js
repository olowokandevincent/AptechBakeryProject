/* ================================================================
   BAKERZ BITE — MAIN JAVASCRIPT
   Single Page Application Logic
   ================================================================ */

'use strict';

/* Tracks which product is open in the modal */
let currentProductId = null;

/* Loaded JSON data */
let allData = {};

/* Current filter / search / sort / price state */
let activeFilter   = 'all';
let activeSearch   = '';
let activeSort     = '';
let activePriceMin = 0;
let activePriceMax = 50;

/* Preloader: hide on full page load */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => { if (preloader.parentNode) preloader.parentNode.removeChild(preloader); }, 600);
  }
});

/* ================================================================
   DATA LOADING — fetch from data/products.json
   ================================================================ */
async function loadProductData() {
  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error('Failed to load products.json');
    allData = await res.json();
  } catch (err) {
    console.warn('products.json load failed — falling back to empty data.', err);
    allData = { cakes: [], pastries: [], cookies: [], pies: [], merchandise: [], offers: [], gallery: [], faqs: [] };
  }
}

/* All food products combined (for search/filter across categories) */
function getAllProducts() {
  return [
    ...(allData.cakes     || []),
    ...(allData.pastries  || []),
    ...(allData.cookies   || []),
    ...(allData.pies      || [])
  ];
}

/* ----------------------------------------------------------------
   LOCAL DATA — testimonials & gallery (kept for local image refs)
   ---------------------------------------------------------------- */

const TESTIMONIALS = [
  {
    name: 'Adaeze Nwosu',  role: 'Regular Customer',  rating: 5,
    avatar: 'https://cdn.pixabay.com/photo/2017/08/01/08/29/woman-2563491_640.jpg',
    text: 'The best bakery in Lagos! Their Red Velvet Cake is absolutely divine. I order from them every single weekend.'
  },
  {
    name: 'Emeka Obi',     role: 'Corporate Client',   rating: 5,
    avatar: 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_640.jpg',
    text: 'Bakerz Bite catered for our office event and everyone was completely blown away. Professional service and incredible food!'
  },
  {
    name: 'Fatima Aliyu',  role: 'Food Blogger',       rating: 5,
    avatar: 'https://cdn.pixabay.com/photo/2018/04/27/03/50/portrait-3353699_640.jpg',
    text: 'As a food blogger, I have tried bakeries across the country. Bakerz Bite consistently delivers the absolute best quality.'
  },
  {
    name: 'Chidi Okafor',  role: 'Birthday Customer',  rating: 5,
    avatar: '../assets/images/chidi.jpg',
    text: 'Ordered a custom birthday cake and it was beyond my expectations. Beautiful, absolutely delicious, and perfectly on time!'
  },
  {
    name: 'Blessing Eze',  role: 'Daily Customer',     rating: 5,
    avatar: '../assets/images/blessing.jfif',
    text: 'I grab a croissant and coffee here every single morning. It is genuinely the best start to any day!'
  },
  {
    name: 'Tunde Adeyemi', role: 'First-Time Visitor', rating: 4,
    avatar: 'https://cdn.pixabay.com/photo/2017/08/01/01/33/beanie-2562646_640.jpg',
    text: 'Stumbled in on a friend\'s recommendation and now I am completely hooked! The Chocolate Éclair is something else entirely.'
  }
];

const GALLERY_ITEMS = [
  { label: 'Celebration Cakes',   gradient: 'linear-gradient(140deg,#4A0A0A,#8B1A1A,#C0392B)', img: 'assets/images/Rectangle 20.png' },
  { label: 'Fresh Pastries',       gradient: 'linear-gradient(140deg,#5C3A00,#C8902A,#E4B96A)', img: 'assets/images/Rectangle 21.png' },
  { label: 'Dessert Slices',       gradient: 'linear-gradient(140deg,#6B2A0A,#C8902A,#E4C87A)', img: 'assets/images/Rectangle 22.png' },
  { label: 'Artisan Cookies',      gradient: 'linear-gradient(140deg,#2A1204,#6B3A2A,#9B5E3A)', img: 'assets/images/Rectangle 23.png' },
  { label: 'Specialty Coffee',     gradient: 'linear-gradient(140deg,#060402,#1A0D06,#3D1C02)', img: 'assets/images/Rectangle 24.png' },
  { label: 'Chocolate Creations',  gradient: 'linear-gradient(140deg,#140804,#3D1C02,#6B3A10)', img: 'assets/images/Rectangle 25.png' },
  { label: 'Classic Pies',         gradient: 'linear-gradient(140deg,#3D1C02,#8B4A0A,#C8902A)', img: 'assets/images/cp1.png' },
  { label: 'Floral Cake Designs',  gradient: 'linear-gradient(140deg,#5C1A3A,#9B2A5A,#D44A7A)', img: 'assets/images/cp2.png' },
  { label: 'Artisan Beverages',    gradient: 'linear-gradient(140deg,#0A1A0A,#1A4A1A,#2E7A32)', img: 'assets/images/cp3.png' },
  { label: 'Gift Sets',            gradient: 'linear-gradient(140deg,#3A0A0A,#8B1A1A,#C8902A)', img: 'assets/images/cp4.png' },
  { label: 'Cupcake Collection',   gradient: 'linear-gradient(140deg,#5C0A3A,#9B1A6A,#E44A9A)', img: 'assets/images/cp5.png' },
  { label: 'Seasonal Specials',    gradient: 'linear-gradient(140deg,#4A3A00,#C8902A,#FFD700)',  img: 'assets/images/cp6.png' },
];

/* ----------------------------------------------------------------
   INITIALISE
   ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  AOS.init({ duration: 680, once: true, offset: 72, easing: 'ease-out-cubic' });
  initNavbar();
  initVisitorCounter();

  /* Load JSON first, then render data-driven sections */
  await loadProductData();
  applyFiltersAndSearch();
  renderMerchandise();
  renderGallery();
  renderTestimonials();
  initFilters();
  initSearch();
  initSort();
  initPriceRange();
  initStarRating();
  initForms();
  initTicker();
  initBackToTop();
  initNewsletterForm();
});

/* ----------------------------------------------------------------
   NAVBAR — scroll behaviour + active link highlighting
   ---------------------------------------------------------------- */
function initNavbar() {
  const nav        = document.getElementById('mainNav');
  const hamburger  = document.getElementById('navHamburger');
  const collapseEl = document.getElementById('navbarNav');

  /* Scroll behaviour */
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 48);
    document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 320);
    document.getElementById('whatsappFab').classList.toggle('visible', window.scrollY > 320);
    highlightActiveLink();
  }, { passive: true });

  /* Hamburger ↔ X toggle — sync with Bootstrap collapse events */
  if (collapseEl && hamburger) {
    collapseEl.addEventListener('show.bs.collapse',  () => hamburger.classList.add('is-open'));
    collapseEl.addEventListener('hide.bs.collapse',  () => hamburger.classList.remove('is-open'));
  }

  /* Close mobile menu on nav-link click */
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (collapseEl && collapseEl.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
      }
    });
  });
}

function highlightActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.navbar-nav .nav-link');
  let current    = '';

  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
  });

  links.forEach(link => {
    const isActive = link.getAttribute('href') === '#' + current;
    link.classList.toggle('active', isActive);
  });
}

/* ----------------------------------------------------------------
   VISITOR COUNTER — localStorage persistence + animated count-up
   ---------------------------------------------------------------- */
function initVisitorCounter() {
  let count = parseInt(localStorage.getItem('bb_visit_count') || '1247');
  if (!sessionStorage.getItem('bb_session')) {
    count++;
    localStorage.setItem('bb_visit_count', count);
    sessionStorage.setItem('bb_session', '1');
  }
  const vcEl = document.getElementById('visitorCount');
  if (vcEl) countUp(vcEl, count, 1600);
}

function countUp(el, target, duration) {
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(p * target).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(step);
}

/* ----------------------------------------------------------------
   UNIFIED CARD FACTORY — same design for products & merchandise
   ---------------------------------------------------------------- */
function createUnifiedCard(item) {
  const col = document.createElement('div');
  col.className = 'col-12 col-md-4 col-lg-3';

  const priceStr = typeof item.price === 'number'
    ? `$${item.price.toFixed(2)}`
    : String(item.price);

  const imgHtml = item.image
    ? `<img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}" loading="lazy" />`
    : `<div class="card-top-img-fallback" style="background:linear-gradient(135deg,var(--primary),var(--gold))"></div>`;

  col.innerHTML = `
    <div class="product-card">
      <div class="card-top-img">${imgHtml}</div>
      <div class="card-body-inner">
        <span class="brand-official-badge">Bakerz Bite Official</span>
        <h5 class="card-product-name">${escapeHTML(item.name)}</h5>
        <p class="card-product-desc">${escapeHTML(item.description)}</p>
        <div class="card-product-price">${priceStr}</div>
        <button class="btn-view-details">
          <i class="fas fa-eye me-2"></i>View Details
        </button>
      </div>
    </div>`;

  col.querySelector('.btn-view-details').addEventListener('click', () => openProductModal(item.id));

  return col;
}

/* ----------------------------------------------------------------
   RENDER PRODUCTS — driven by filter / search / sort state
   ---------------------------------------------------------------- */
function applyFiltersAndSearch() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';

  let list = getAllProducts();

  /* 1. Category / tag filter */
  if (activeFilter !== 'all') {
    list = list.filter(p => p.category === activeFilter || p.tag === activeFilter);
  }

  /* 2. Search term */
  if (activeSearch.trim()) {
    const q = activeSearch.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.tag || '').toLowerCase().includes(q)
    );
  }

  /* 3. Price range */
  list = list.filter(p => p.price >= activePriceMin && p.price <= activePriceMax);

  /* 4. Sort */
  if (activeSort === 'name-asc')   list.sort((a, b) => a.name.localeCompare(b.name));
  if (activeSort === 'name-desc')  list.sort((a, b) => b.name.localeCompare(a.name));
  if (activeSort === 'price-asc')  list.sort((a, b) => a.price - b.price);
  if (activeSort === 'price-desc') list.sort((a, b) => b.price - a.price);

  if (list.length === 0) {
    grid.innerHTML = `<div class="col-12 no-results-msg">
      <i class="fas fa-search-minus fa-2x mb-3" style="color:var(--gold);display:block"></i>
      No products found. Try a different search or filter.
    </div>`;
    return;
  }

  list.forEach(p => {
    const col = createUnifiedCard(p);
    col.style.animation = 'cardFadeIn 0.3s ease both';
    grid.appendChild(col);
  });
}

/* ----------------------------------------------------------------
   FILTERS / SEARCH / SORT INIT
   ---------------------------------------------------------------- */
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFiltersAndSearch();
    });
  });
}

function initSearch() {
  const input = document.getElementById('navSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    activeSearch = input.value;
    applyFiltersAndSearch();
  });
}

function initSort() {
  const sel = document.getElementById('sortSelect');
  if (!sel) return;
  sel.addEventListener('change', () => {
    activeSort = sel.value;
    applyFiltersAndSearch();
  });
}

/* ----------------------------------------------------------------
   PRICE RANGE DUAL SLIDER
   ---------------------------------------------------------------- */
function initPriceRange() {
  const minInput  = document.getElementById('priceMin');
  const maxInput  = document.getElementById('priceMax');
  const display   = document.getElementById('priceDisplay');
  const fillBar   = document.getElementById('rangeFillBar');
  if (!minInput || !maxInput) return;

  const RANGE_MAX = 50;

  function updateSlider() {
    let minVal = parseInt(minInput.value);
    let maxVal = parseInt(maxInput.value);

    /* Prevent handles crossing */
    if (minVal >= maxVal) {
      if (this === minInput) { minVal = maxVal - 1; minInput.value = minVal; }
      else                   { maxVal = minVal + 1; maxInput.value = maxVal; }
    }

    /* Update fill bar position */
    const leftPct  = (minVal / RANGE_MAX) * 100;
    const rightPct = (maxVal / RANGE_MAX) * 100;
    fillBar.style.left  = leftPct  + '%';
    fillBar.style.width = (rightPct - leftPct) + '%';

    /* Update label */
    display.textContent = `$${minVal} – $${maxVal}`;

    /* Update state and re-render */
    activePriceMin = minVal;
    activePriceMax = maxVal;
    applyFiltersAndSearch();
  }

  minInput.addEventListener('input', updateSlider);
  maxInput.addEventListener('input', updateSlider);

  /* Init fill position */
  fillBar.style.left  = '0%';
  fillBar.style.width = '100%';
}

/* ----------------------------------------------------------------
   PRODUCT MODAL
   ---------------------------------------------------------------- */
function openProductModal(id) {
  /* Search across products AND merchandise */
  const allItems = [...getAllProducts(), ...(allData.merchandise || [])];
  const p = allItems.find(x => x.id === id);
  if (!p) return;

  currentProductId = id;

  document.getElementById('modalProductName').textContent        = p.name;
  document.getElementById('modalProductCat').textContent         = (p.tag || p.category || '').toUpperCase();
  document.getElementById('modalProductDesc').textContent        = p.description;
  document.getElementById('modalProductIngredients').textContent = p.ingredients || '';
  document.getElementById('modalProductPrice').textContent       =
    typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : p.price;

  const imgEl = document.getElementById('modalProductImg');
  if (p.image) {
    imgEl.style.background = 'var(--cream-dk)';
    imgEl.innerHTML = `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}"
      style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm);" />`;
  } else {
    imgEl.style.background = 'linear-gradient(135deg,var(--primary),var(--gold))';
    imgEl.innerHTML = '';
  }

  bootstrap.Modal.getOrCreateInstance(document.getElementById('productModal')).show();
}

function orderOnWhatsApp() {
  const allItems = [...getAllProducts(), ...(allData.merchandise || [])];
  const p = allItems.find(x => x.id === currentProductId);
  if (!p) return;
  const priceStr = typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : p.price;
  const msg = encodeURIComponent(`Hello Bakerz Bite! I'd like to order: *${p.name}* (${priceStr}). Please confirm availability.`);
  window.open(`https://wa.me/2348050511828?text=${msg}`, '_blank', 'noopener');
  bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
}

/* ----------------------------------------------------------------
   RENDER MERCHANDISE — uses unified card + JSON data
   ---------------------------------------------------------------- */
function renderMerchandise() {
  const grid = document.getElementById('merchandiseGrid');
  grid.innerHTML = '';
  const items = allData.merchandise || [];
  items.forEach((item, i) => {
    const col = createUnifiedCard(item);
    col.className = 'col-12 col-md-6 col-lg-3';
    col.setAttribute('data-aos', 'fade-up');
    col.setAttribute('data-aos-delay', String(i * 100));
    grid.appendChild(col);
  });
}

/* ----------------------------------------------------------------
   RENDER GALLERY
   ---------------------------------------------------------------- */
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  GALLERY_ITEMS.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.setAttribute('data-aos', 'zoom-in');
    div.setAttribute('data-aos-delay', String((i % 4) * 55));

    const bgStyle = item.img
      ? `background:url('${item.img}') center/cover no-repeat`
      : `background:${item.gradient}`;

    div.innerHTML = `
      <div class="gallery-inner" style="${bgStyle}">
        <div class="gallery-overlay"><p class="gallery-label">${item.label}</p></div>
        <div class="gallery-zoom-btn"><i class="fas fa-expand-alt"></i></div>
      </div>`;

    div.addEventListener('click', () => openGalleryModal(item));
    grid.appendChild(div);
  });
}

function openGalleryModal(item) {
  const imgEl    = document.getElementById('galleryModalImage');
  const emojiEl  = document.getElementById('galleryModalEmoji');

  document.getElementById('galleryModalCaption').textContent = item.label;

  if (item.img) {
    imgEl.src = item.img;
    imgEl.alt = item.label;
    imgEl.style.display = 'block';
    emojiEl.style.display = 'none';
  } else {
    emojiEl.textContent   = item.emoji || '';
    emojiEl.style.display = 'block';
    imgEl.style.display   = 'none';
  }

  bootstrap.Modal.getOrCreateInstance(document.getElementById('galleryModal')).show();
}

/* ----------------------------------------------------------------
   RENDER TESTIMONIALS
   ---------------------------------------------------------------- */
function renderTestimonials() {
  const container = document.getElementById('testimonialsContainer');
  TESTIMONIALS.forEach((t, i) => {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6';
    col.setAttribute('data-aos', 'fade-up');
    col.setAttribute('data-aos-delay', String((i % 3) * 100));

    const stars = Array(t.rating).fill('<i class="fas fa-star"></i>').join('');

    const avatarContent = t.avatar
      ? `<img src="${t.avatar}" alt="${t.name}" class="testimonial-avatar-img" loading="lazy" />`
      : `<i class="fas fa-user"></i>`;

    col.innerHTML = `
      <div class="testimonial-card">
        <div class="testimonial-stars">${stars}</div>
        <p class="testimonial-text">"${t.text}"</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${avatarContent}</div>
          <div>
            <p class="testimonial-name">${t.name}</p>
            <p class="testimonial-role">${t.role}</p>
          </div>
        </div>
      </div>`;
    container.appendChild(col);
  });
}

/* ----------------------------------------------------------------
   STAR RATING WIDGET
   ---------------------------------------------------------------- */
function initStarRating() {
  const stars      = document.querySelectorAll('#starRating i');
  const ratingEl   = document.getElementById('starRating');
  const label      = document.getElementById('ratingText');
  const labels     = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];
  ratingEl.dataset.selected = '0';

  stars.forEach(star => {
    const r = parseInt(star.dataset.rating);

    star.addEventListener('mouseenter', () => {
      stars.forEach(s => s.classList.toggle('hovered', parseInt(s.dataset.rating) <= r));
      label.textContent = labels[r];
    });

    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hovered'));
      const sel = parseInt(ratingEl.dataset.selected);
      label.textContent = sel ? `You rated: ${labels[sel]}` : 'Click a star to rate';
    });

    star.addEventListener('click', () => {
      ratingEl.dataset.selected = String(r);
      stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.rating) <= r));
      label.textContent = `You rated us: ${labels[r]} (${r}/5)`;
    });
  });
}

/* ----------------------------------------------------------------
   FORMS — feedback + contact
   ---------------------------------------------------------------- */
function initForms() {
  document.getElementById('feedbackForm').addEventListener('submit', e => {
    e.preventDefault();
    if (parseInt(document.getElementById('starRating').dataset.selected || '0') === 0) {
      showToast('Please select a star rating first.');
      return;
    }
    showToast('Thank you for your review! We appreciate it.');
    e.target.reset();
    document.querySelectorAll('#starRating i').forEach(s => s.classList.remove('selected', 'hovered'));
    document.getElementById('starRating').dataset.selected = '0';
    document.getElementById('ratingText').textContent = 'Click a star to rate';
  });

  document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    showToast('Message sent! We\'ll get back to you shortly.');
    e.target.reset();
  });
}

/* ----------------------------------------------------------------
   NEWSLETTER FORM
   ---------------------------------------------------------------- */
function initNewsletterForm() {
  const btn = document.querySelector('.newsletter-btn');
  const inp = document.querySelector('.newsletter-input');

  function subscribe() {
    if (inp.value && inp.value.includes('@')) {
      showToast('Subscribed! Welcome to the Bakerz Bite family.');
      inp.value = '';
    } else {
      showToast('Please enter a valid email address.');
    }
  }

  btn.addEventListener('click', subscribe);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); subscribe(); } });
}

/* ----------------------------------------------------------------
   TOAST NOTIFICATION
   ---------------------------------------------------------------- */
function showToast(message) {
  document.getElementById('toastBody').innerHTML = `<i class="fas fa-check-circle me-2" style="color:var(--gold-lt)"></i>${message}`;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('mainToast'), { delay: 3500 }).show();
}

/* ----------------------------------------------------------------
   BOTTOM TICKER — real-time clock + geolocation
   ---------------------------------------------------------------- */
let userCity = 'Dada Estate, Osogbo';

function initTicker() {
  buildTicker();
  // Update time every second — replace just the time spans
  setInterval(() => {
    const now = new Date();
    document.querySelectorAll('.ticker-time').forEach(el => {
      el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });
  }, 1000);

  // Geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        userCity = `${pos.coords.latitude.toFixed(3)}°N, ${pos.coords.longitude.toFixed(3)}°E`;
        document.querySelectorAll('.ticker-location').forEach(el => { el.textContent = userCity; });
      },
      () => { /* Keep default */ },
      { timeout: 6000 }
    );
  }
}

function buildTicker() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const items = [
    `<i class="fas fa-calendar-alt"></i>&nbsp;${dateStr}`,
    `<i class="fas fa-clock"></i>&nbsp;<span class="ticker-time">${timeStr}</span>`,
    `<i class="fas fa-map-marker-alt"></i>&nbsp;<span class="ticker-location">${userCity}</span>`,
    `<i class="fas fa-tag"></i>&nbsp;Today's Deal: 20% OFF Red Velvet Cake!`,
    `<i class="fas fa-star"></i>&nbsp;Rated 4.9 / 5 by over 1,247 happy customers`,
    `<i class="fas fa-truck"></i>&nbsp;Free delivery on orders above $15.00`,
    `<i class="fas fa-bread-slice"></i>&nbsp;300+ fresh baked goods available in-store NOW`,
    `<i class="fas fa-phone"></i>&nbsp;Order: +234 801 234 5678`,
    `<i class="fas fa-envelope"></i>&nbsp;hello@bakerzbite.com`,
    `<i class="fas fa-crown"></i>&nbsp;Join our loyalty programme - earn points on every purchase!`
  ];

  const sep = '<span class="ticker-sep">✦</span>';
  const html = items.map(i => `<span class="ticker-item">${i}</span>${sep}`).join('');
  // Duplicate for seamless infinite scroll
  document.getElementById('tickerTrack').innerHTML = html + html;
}

/* ----------------------------------------------------------------
   BACK TO TOP
   ---------------------------------------------------------------- */
function initBackToTop() {
  // visibility toggled in initNavbar scroll handler
}

/* ----------------------------------------------------------------
   UTILITY: scroll to section
   ---------------------------------------------------------------- */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ----------------------------------------------------------------
   UTILITY: XSS prevention
   ---------------------------------------------------------------- */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ----------------------------------------------------------------
   CONTACT PAGE — GEOLOCATION
   ---------------------------------------------------------------- */
function getContactGeolocation() {
  const btn    = document.getElementById('geoBtn');
  const result = document.getElementById('geoResult');

  if (!navigator.geolocation) {
    result.innerHTML = `<span style="color:#e74c3c"><i class="fas fa-times-circle me-1"></i>Geolocation is not supported by your browser.</span>`;
    result.classList.add('show');
    return;
  }

  btn.innerHTML  = '<i class="fas fa-spinner fa-spin me-2"></i>Getting your location…';
  btn.disabled   = true;
  result.classList.remove('show');

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat  = pos.coords.latitude.toFixed(5);
      const lon  = pos.coords.longitude.toFixed(5);
      const acc  = Math.round(pos.coords.accuracy);
      const mapsUrl = `https://www.google.com/maps/dir/${lat},${lon}/12+Baker%27s+Avenue+Victoria+Island+Lagos`;

      result.innerHTML = `
        <p class="mb-2">
          <i class="fas fa-crosshairs me-1" style="color:var(--gold)"></i>
          Your position: <span class="geo-coord">${lat}°N, ${lon}°E</span>
          <br><small style="color:var(--text-lt)">Accuracy: ±${acc}m</small>
        </p>
        <a href="${escapeAttr(mapsUrl)}" target="_blank" rel="noopener">
          <i class="fas fa-directions me-1"></i>Get Directions to Bakerz Bite
        </a>`;
      result.classList.add('show');

      btn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Location Found!';
      btn.style.background = 'linear-gradient(135deg,#27ae60,#2ecc71)';
      btn.style.boxShadow  = '0 5px 18px rgba(39,174,96,0.4)';
      btn.disabled = false;

      /* Also update ticker location */
      document.querySelectorAll('.ticker-location').forEach(el => {
        el.textContent = `${lat}°N, ${lon}°E`;
      });
    },
    err => {
      const msg = err.code === 1
        ? 'Location access denied. Please allow location in your browser settings.'
        : 'Could not retrieve your location. Please try again.';
      result.innerHTML = `<span style="color:#e67e22"><i class="fas fa-exclamation-triangle me-1"></i>${msg}</span>`;
      result.classList.add('show');
      btn.innerHTML = '<i class="fas fa-map-marker-alt me-2"></i>Try Again';
      btn.disabled  = false;
    },
    { timeout: 9000, enableHighAccuracy: true }
  );
}
