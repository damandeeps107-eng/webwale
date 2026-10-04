
/* Global Modal & Navigation Handlers (Immediately available) */
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
};

window.closeModalOnOverlay = function(e, id) {
  if (e.target && e.target.classList.contains("modal-overlay")) {
    window.closeModal(id);
  }
};

window.toggleMenu = function() {
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenu) mobileMenu.classList.toggle("open");
};

window.closeMenu = function() {
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenu) mobileMenu.classList.remove("open");
};

/* ═══════════════════════════════════════════════════════════
   webwale.in — script.js (Mossimo Studio 1:1 Exact Circular Orbit)
   ═══════════════════════════════════════════════════════════ */

const MOSSIMO_CONFIG = {
  minSize: 170,
  maxSize: 260,
  sizeRatio: 0.16,          // 16% of stage width → ~230px on 1440px desktop
  aspectRatio: 1.10,        // height = width * 1.1 (editorial vertical proportion)
  borderRadiusRatio: 0.085, // 8.5% of width
  // Elliptical orbit radii (relative to viewport)
  ellipseRxDesktop: 0.43,   // 43% of vw → perfectly balanced equal orbital sweep
  ellipseRyDesktop: 0.32,   // 32% of vh → tight equal vertical sweep
  ellipseRxMobile: 0.38,
  ellipseRyMobile: 0.26,
  // Orbit center position (relative to hero height)
  desktopCenterY: 0.46,     // centered with headline composition
  mobileCenterY: 0.44,
  mobileBreakpoint: 768,
  baseAngle: -90,
  idleSpeed: 14.4,          // 14.4 deg/sec → 25s per full 360° continuous orbit loop
  // Depth effect (cards at bottom = near/larger, cards at top = far/smaller)
  depthScaleMin: 0.85,      // far cards (~195px at top)
  depthScaleMax: 1.12,      // near cards (~258px at bottom)
  depthOpacityMin: 0.82,    // crisp cards
};

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ── 1. ULTRA-SMOOTH RESPONSIVE LENIS SCROLL ───────────── */
  const lenis = new Lenis({
    duration: 0.8,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.2,
  });

  lenis.on("scroll", ScrollTrigger.update);

  /* ── 2. LOADER ─────────────────────────────────────────── */
  const loader = document.getElementById("loader");
  const ldNum = document.getElementById("ldNum");
  const ldFill = document.getElementById("ldFill");

  let count = 0;
  const loadInterval = setInterval(() => {
    count += Math.floor(Math.random() * 25) + 20;
    if (count > 100) count = 100;
    if (ldNum) ldNum.textContent = count;
    if (ldFill) ldFill.style.width = count + "%";

    if (count >= 100) {
      clearInterval(loadInterval);
      if (loader) {
        loader.classList.add("loaded");
        loader.style.display = "none";
      }
    }
  }, 16);

  /* ── 3. HERO ELLIPTICAL ORBIT SYSTEM ───────────────────── */
  const heroStage = document.getElementById("hero");
  const orbitWheel = document.getElementById("orbitWheel");
  const cardElements = document.querySelectorAll(".orbit-card");
  const cursorRing = document.getElementById("cursorRing");
  const orbitStage = document.getElementById("orbitStage");

  // Shared geometry state (updated on resize)
  const orbitGeo = { rx: 0, ry: 0 };

  // Set card dimensions only
  function layoutOrbit() {
    if (!heroStage || !cardElements.length) return;
    const w = heroStage.offsetWidth;
    const isMobile = w < MOSSIMO_CONFIG.mobileBreakpoint;

    const cardW = Math.max(MOSSIMO_CONFIG.minSize, Math.min(MOSSIMO_CONFIG.maxSize, w * (isMobile ? 0.32 : MOSSIMO_CONFIG.sizeRatio)));
    const cardH = cardW * MOSSIMO_CONFIG.aspectRatio;
    const radiusPx = cardW * MOSSIMO_CONFIG.borderRadiusRatio;

    cardElements.forEach((el) => {
      el.style.width = `${cardW.toFixed(1)}px`;
      el.style.height = `${cardH.toFixed(1)}px`;
      el.style.borderRadius = `${radiusPx.toFixed(1)}px`;
      const img = el.querySelector("img");
      if (img) img.style.borderRadius = `${radiusPx.toFixed(1)}px`;
    });
  }

  // Position orbit-stage container and compute ellipse radii relative to hero stage
  function updateOrbitPosition() {
    if (!heroStage || !orbitWheel) return;
    const w = heroStage.offsetWidth;
    const h = heroStage.offsetHeight;
    const isMobile = w < MOSSIMO_CONFIG.mobileBreakpoint;

    // Wheel pivot at the center of the hero section
    const centerYRatio = isMobile ? MOSSIMO_CONFIG.mobileCenterY : MOSSIMO_CONFIG.desktopCenterY;
    orbitWheel.style.left = `${w / 2}px`;
    orbitWheel.style.top = `${h * centerYRatio}px`;

    // Compute ellipse radii
    orbitGeo.rx = w * (isMobile ? MOSSIMO_CONFIG.ellipseRxMobile : MOSSIMO_CONFIG.ellipseRxDesktop);
    orbitGeo.ry = h * (isMobile ? MOSSIMO_CONFIG.ellipseRyMobile : MOSSIMO_CONFIG.ellipseRyDesktop);
  }

  layoutOrbit();
  updateOrbitPosition();
  window.addEventListener("resize", () => { layoutOrbit(); updateOrbitPosition(); });

  const orbitState = { progress: 0 };

  // Non-pinning scroll trigger mapping: orbit turns smoothly as user scrolls without locking the page
  gsap.to(orbitState, {
    progress: 1,
    ease: "none",
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: 0.5,
      invalidateOnRefresh: true,
    }
  });

  /* ── 4. SINGLE rAF — ELLIPTICAL PER-CARD ORBIT + CURSOR ── */
  let lastTime = performance.now();
  let idleAngle = 0;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  let mouseMoved = false;
  window.addEventListener("mousemove", (e) => {
    if (!mouseMoved && cursorRing) {
      cursorRing.classList.add("visible");
      mouseMoved = true;
    }
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Slow cinematic idle rotation
    idleAngle += MOSSIMO_CONFIG.idleSpeed * dt;

    // Master angle: scroll progress (0→360°) + idle drift
    const masterAngle = MOSSIMO_CONFIG.baseAngle + (orbitState.progress * 360) + idleAngle;

    // Update orbit-stage clipping and ellipse center
    updateOrbitPosition();

    // Position each card individually on the elliptical path
    const { rx, ry } = orbitGeo;
    const numCards = cardElements.length;

    cardElements.forEach((el, i) => {
      const angleDeg = masterAngle + (i / numCards) * 360;
      const rad = angleDeg * (Math.PI / 180);

      // Elliptical coordinates (relative to wheel center at 0,0)
      const x = Math.cos(rad) * rx;
      const y = Math.sin(rad) * ry;

      // Depth: sin(rad) → bottom half (sin>0) = near/large, top half (sin<0) = far/small
      const depthNorm = (Math.sin(rad) + 1) / 2; // 0 = far (top), 1 = near (bottom)
      const scale = MOSSIMO_CONFIG.depthScaleMin + depthNorm * (MOSSIMO_CONFIG.depthScaleMax - MOSSIMO_CONFIG.depthScaleMin);
      const opacity = MOSSIMO_CONFIG.depthOpacityMin + depthNorm * (1 - MOSSIMO_CONFIG.depthOpacityMin);
      const blur = (1 - depthNorm) * 1.5; // subtle focal depth blur for far cards

      // Card rotation: tangent angle so cards face outward from center
      const rotDeg = angleDeg + 90;

      el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rotDeg.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = blur > 0.15 ? `blur(${blur.toFixed(1)}px)` : "none";
      el.style.zIndex = Math.round(depthNorm * 10);
    });

    // Custom cursor smoothing (32px circle, follows mouse)
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;
    if (cursorRing) {
      cursorRing.style.transform = `translate3d(${cursorX.toFixed(1)}px, ${cursorY.toFixed(1)}px, 0)`;
    }

    // Lenis smooth scroll update
    lenis.raf(now);

    requestAnimationFrame(tick);
  }

  // Smooth entrance reveal animation for hero text
  gsap.from(".hero-headline .hh-line", { opacity: 0, y: 35, duration: 1.2, delay: 0.3, stagger: 0.18, ease: "power3.out" });
  gsap.from(".hero-sub", { opacity: 0, y: 25, duration: 1.0, delay: 0.7, ease: "power3.out" });
  gsap.from(".btn-work", { opacity: 0, y: 20, scale: 0.95, duration: 0.8, delay: 0.9, ease: "back.out(1.7)" });

  // Start the single continuous rAF loop
  requestAnimationFrame(tick);

  /* ── 5. SECTION BACKGROUND COLOR MORPH ──────────────────── */
  const sections = document.querySelectorAll("[data-section-bg]");

  sections.forEach((sec) => {
    const bgColor = sec.getAttribute("data-section-bg");

    ScrollTrigger.create({
      trigger: sec,
      start: "top 50%",
      end: "bottom 50%",
      onEnter: () => {
        document.body.style.backgroundColor = bgColor;
      },
      onEnterBack: () => {
        document.body.style.backgroundColor = bgColor;
      }
    });
  });

      /* ── 6. MOSSIMO SELECTED WORK PREVIEW SHOWCASE ──────────── */
  const projects = [
    {
      caption: "Aurora Swimwear — High-fashion editorial resortwear & swimwear collection storefront with sub-second page speeds.",
      type: "image",
      content: "url('assets/orbit/aurora.jpg')"
    },
    {
      caption: "Da Maria Coastal Dining — Italian coastal dining & reservation platform. Online table bookings increased by 3.4×.",
      type: "image",
      content: "url('assets/orbit/da-maria.jpg')"
    },
    {
      caption: "Halcyon Day Spa — Luxury day spa & retreat booking system with seasonal treatment guides and gift card store.",
      type: "image",
      content: "url('assets/orbit/halcyon.jpg')"
    },
    {
      caption: "Sterling Showroom — Automotive showroom digital gallery & bespoke appointment booking engine.",
      type: "image",
      content: "url('assets/orbit/sterling.jpg')"
    },
    {
      caption: "Air Center Studio — Architectural portfolio featuring smooth page transitions and interactive blueprint viewer.",
      type: "image",
      content: "url('assets/orbit/air-center.jpg')"
    },
    {
      caption: "Gloryn Custom Atelier — Bespoke luxury interior craftsmanship showcase & direct consultation engine.",
      type: "image",
      content: "url('assets/orbit/gloryn.jpg')"
    }
  ];

  const workItems = document.querySelectorAll(".work-item");
  const pfImgBox = document.getElementById("pfImgBox");
  const pfCaption = document.getElementById("pfCaption");

  function setProjectPreview(index) {
    workItems.forEach(item => item.classList.remove("active"));
    if (workItems[index]) workItems[index].classList.add("active");

    const p = projects[index] || projects[0];
    if (pfCaption) pfCaption.textContent = p.caption;

    if (pfImgBox) {
      if (p.type === "image") {
        pfImgBox.innerHTML = "";
        pfImgBox.style.backgroundImage = p.content;
      } else {
        pfImgBox.style.backgroundImage = "none";
        pfImgBox.innerHTML = p.content;
      }
    }
  }

  workItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      const idx = parseInt(item.getAttribute("data-project") || "0");
      setProjectPreview(idx);
    });
    item.addEventListener("click", () => {
      const idx = parseInt(item.getAttribute("data-project") || "0");
      setProjectPreview(idx);
    });
  });

  // Initial preview state
  setProjectPreview(0);

  /* ── 7. MOSSIMO HOW THIS WORKS PROCESS ─────────────────── */
  const stepData = [
    {
      badge: "STEP 01 OF 04 • ALIGNMENT",
      title: "Tell us about your business",
      desc: "A brief questionnaire or a quick phone call. We figure out what your site needs to achieve, who your customers are, and what makes your business unique.",
      checklist: [
        "Target audience & business goals discovery",
        "Brand identity, aesthetic & moodboard alignment",
        "Fixed upfront pricing quote & deliverable timeline"
      ]
    },
    {
      badge: "STEP 02 OF 04 • CRAFTSMANSHIP",
      title: "We design and build",
      desc: "We craft full interactive mockups in Figma, write high-conversion copy, and engineer clean Next.js/HTML code built specifically for your brand — zero pre-bought templates.",
      checklist: [
        "100% Bespoke Figma mockups & editorial layout design",
        "Mobile-first responsive engineering & 60fps Lenis motion",
        "Conversion copywriting written backwards from sales goals"
      ]
    },
    {
      badge: "STEP 03 OF 04 • DEPLOYMENT",
      title: "Launch and go live",
      desc: "Domain, hosting, SSL security, performance optimization, XML sitemaps, and Schema.org markup. We handle every technical detail and index your site directly on Google.",
      checklist: [
        "Core Web Vitals 99+ score speed audit & CDN deployment",
        "Schema.org JSON-LD structured data & local SEO setup",
        "Instant Google Search Console indexing & domain launch"
      ]
    },
    {
      badge: "STEP 04 OF 04 • PARTNERSHIP",
      title: "We stay on after launch",
      desc: "Flat rate, zero surprises. Continuous 24/7 security monitoring, content updates, traffic analytics reports, and ongoing speed optimization so your site never goes stale.",
      checklist: [
        "24/7 uptime monitoring & daily off-site cloud backups",
        "Monthly performance & traffic analytics insights report",
        "Direct developer access via WhatsApp & Email for quick edits"
      ]
    }
  ];

  /* ── mossimo-style: click pill → smooth-scroll to block,
        scroll → auto-highlight active pill ──────────── */

  // Highlight active pill
  function setActiveProcPill(idx) {
    document.querySelectorAll(".proc-step").forEach((btn, i) => {
      if (i === idx) btn.classList.add("active");
      else btn.classList.remove("active");
    });
    const block = document.getElementById("procBlock" + idx);
    if (block) {
      const color = block.getAttribute("data-color");
      if (color) document.body.style.backgroundColor = color;
    }
  }

  // Click pill → smooth scroll to the matching content block
  window.scrollToStep = function(idx) {
    const block = document.getElementById(`procBlock${idx}`);
    if (!block) return;
    setActiveProcPill(idx);
    block.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // IntersectionObserver: as content blocks scroll into view, highlight corresponding pill
  const procBlocks = document.querySelectorAll(".proc-content-block");
  if (procBlocks.length) {
    const procObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.getAttribute("data-block") || "0");
          setActiveProcPill(idx);
        }
      });
    }, {
      rootMargin: "-30% 0px -55% 0px",
      threshold: 0
    });

    procBlocks.forEach(block => procObserver.observe(block));
  }

  window.openProcessModalForStep = function(stepIdx) {
    window.switchProcessModalTab(stepIdx);
    window.openModal("processModal");
  };

  window.switchProcessModalTab = function(stepIdx) {
    for (let i = 0; i < 4; i++) {
      const tab = document.getElementById(`pmTab${i}`);
      const card = document.getElementById(`procCard${i}`);
      if (tab) {
        if (i === stepIdx) tab.classList.add("active");
        else tab.classList.remove("active");
      }
      if (card) {
        if (i === stepIdx) card.classList.add("active");
        else card.classList.remove("active");
      }
    }
  };

  /* ── 8. NAVBAR SCROLL EFFECT ────────────────────────────── */
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  });

  /* ── 9. MOBILE MENU TOGGLE ──────────────────────────────── */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");

  if (burger && mobileMenu) {
    burger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
    });
  }

  window.closeMenu = function() {
    if (mobileMenu) mobileMenu.classList.remove("open");
  };

  /* ── 10. FORM HANDLER ──────────────────────────────────── */
  window.handleForm = function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("submitBtn");
    const toast = document.getElementById("toast");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Message ↗";
      }
      if (toast) {
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 4000);
      }
      e.target.reset();
    }, 1200);
  };

  /* ── 11. LEGAL MODAL HANDLERS ──────────────────────────── */
  window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  };

  window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  };

  window.closeModalOnOverlay = function(e, id) {
    if (e.target.classList.contains("modal-overlay")) {
      window.closeModal(id);
    }
  };

      /* ── 12. FULL PROJECT DETAIL CASE STUDY MODAL ────────────── */
  const projectDetails = [
    {
      title: "Aurora — Editorial Swimwear & Resortwear Storefront",
      cat: "Resortwear & Swimwear",
      year: "2026 CASE STUDY",
      subtitle: "High-fashion e-commerce platform engineered for sub-second checkout speeds and high-impact editorial photography.",
      img: "assets/orbit/aurora.jpg",
      challenge: "Aurora wanted to break away from traditional Shopify templates to deliver a high-fashion, editorial beach resortwear shopping journey with instant cart updates and fast page switches.",
      deliverables: [
        "Custom headless e-commerce frontend with instant slide-out bag",
        "Lookbook interactive image hotspots linked directly to product buy buttons",
        "Core Web Vitals 99+ score for mobile conversion rate optimization",
        "Global currency switching and automatic tax calculation"
      ],
      stats: [
        { val: "+310%", lbl: "Mobile Sales" },
        { val: "99 / 100", lbl: "Mobile Vitals" },
        { val: "< 0.3s", lbl: "Checkout Speed" },
        { val: "+150%", lbl: "Mobile Orders" }
      ],
      tech: ["Next.js", "Headless Storefront", "GSAP Animations", "Stripe Checkout"]
    },
    {
      title: "Da Maria — Italian Coastal Dining",
      cat: "Food & Drink",
      year: "2026 CASE STUDY",
      subtitle: "Bespoke reservation engine & high-conversion web platform built to turn table viewers into instant diners.",
      img: "assets/orbit/da-maria.jpg",
      challenge: "The existing venue website struggled with mobile load times and relied on third-party booking widgets that charged heavy commissions per table reservation. They needed a high-fashion, editorial digital presence matching their coastal venue atmosphere while keeping booking conversions 100% direct.",
      deliverables: [
        "Custom Next.js & HTML5 direct reservation engine with real-time slot selection",
        "Editorial typography and micro-interactions optimized for luxury mobile screens",
        "Sub-second page speeds with automated image compression and WebP conversion",
        "Localized SEO & Schema.org Restaurant rich snippet integration"
      ],
      stats: [
        { val: "+340%", lbl: "Table Bookings" },
        { val: "99 / 100", lbl: "Lighthouse Speed" },
        { val: "< 0.4s", lbl: "Load Time" },
        { val: "0%", lbl: "Widget Fees" }
      ],
      tech: ["Next.js", "GSAP Motion", "HTML5 / CSS Glass", "Schema.org", "Lenis Scroll"]
    },
    {
      title: "Halcyon — Luxury Wellness & Spa",
      cat: "Wellness & Spa",
      year: "2026 CASE STUDY",
      subtitle: "Atmospheric sensory web experience with seasonal treatment booking & instant gift card purchasing.",
      img: "assets/orbit/halcyon.jpg",
      challenge: "Halcyon needed a serene digital space that reflected their physical sanctuary. The goal was to eliminate booking friction while telling their story of holistic wellness, organic products, and tailored retreats.",
      deliverables: [
        "Interactive seasonal treatment selector and instant digital voucher store",
        "Calming pastel design palette with glassmorphism depth and fluid transitions",
        "Integrated multi-staff appointment scheduler with SMS reminders",
        "Zero-layout-shift responsive performance for mobile visitors"
      ],
      stats: [
        { val: "+210%", lbl: "Gift Voucher Sales" },
        { val: "4.9 ★", lbl: "User Feedback" },
        { val: "100%", lbl: "Mobile Friendly" },
        { val: "< 0.3s", lbl: "Page Load" }
      ],
      tech: ["HTML5 / CSS3", "GSAP ScrollTrigger", "Stripe API", "Mobile Micro-UX"]
    },
    {
      title: "Sterling — Automotive Showroom",
      cat: "Automotive & Retail",
      year: "2026 CASE STUDY",
      subtitle: "Luxury automotive showcase with VIP appointment booking and dynamic 360 vehicle inspection gallery.",
      img: "assets/orbit/sterling.jpg",
      challenge: "Sterling required a high-touch digital experience for selling exclusive classic and supercar inventory online, replacing static PDF listings with interactive vehicle showcases.",
      deliverables: [
        "High-definition gallery viewer with technical specification drawer",
        "VIP private viewing scheduling tool directly connected to showroom CRM",
        "Glassmorphism detail panels with live inventory status indicators",
        "Custom search & filter engine for vintage, sports, and luxury vehicles"
      ],
      stats: [
        { val: "+420%", lbl: "Test Drive Leads" },
        { val: "98 / 100", lbl: "Performance" },
        { val: "< 0.5s", lbl: "Image Hydration" },
        { val: "100%", lbl: "Private CRM Sync" }
      ],
      tech: ["HTML5 / JavaScript", "GSAP", "Custom CSS Morphism", "CRM Webhooks"]
    },
    {
      title: "Air Center — Architectural Studio",
      cat: "Studio & Brand",
      year: "2026 CASE STUDY",
      subtitle: "Bespoke architectural portfolio featuring smooth full-screen galleries and interactive project showcases.",
      img: "assets/orbit/air-center.jpg",
      challenge: "Air Center builds minimalist residential structures and needed a digital portfolio that matched their clean architectural aesthetic without feeling like a generic template.",
      deliverables: [
        "Full-screen high-definition project viewer with custom lightbox navigation",
        "Subtle glassmorphic project details sidebar with blueprint overlays",
        "Automated SEO optimization for architectural award search visibility",
        "Ultra-clean typographic hierarchy and minimal dark-mode layout"
      ],
      stats: [
        { val: "5.2x", lbl: "Inquiry Rate" },
        { val: "100 / 100", lbl: "SEO Score" },
        { val: "+180%", lbl: "Avg Session Time" },
        { val: "0.2s", lbl: "FCP Speed" }
      ],
      tech: ["Next.js", "WebGL / Canvas", "Tailwind / Custom CSS", "Lenis Scroll"]
    },
    {
      title: "Gloryn — Luxury Automotive Atelier",
      cat: "Bespoke Craft",
      year: "2026 CASE STUDY",
      subtitle: "Custom starlight interior showcase with private commission booking & material selector.",
      img: "assets/orbit/gloryn.jpg",
      challenge: "Gloryn crafts bespoke custom vehicle interiors and starlight headliners. They needed an ultra-luxurious digital showroom to present their leather work and fiber-optic lighting options.",
      deliverables: [
        "Interactive starlight lighting simulator and material preview drawer",
        "Direct developer consultation booking engine for high-ticket clients",
        "High-contrast editorial dark theme matching luxury vehicle aesthetics",
        "Sub-second page speeds with zero layout shifts"
      ],
      stats: [
        { val: "99+ / 100", lbl: "Vitals Score" },
        { val: "+310%", lbl: "Inquiry Rate" },
        { val: "< 0.3s", lbl: "Hydration" },
        { val: "100%", lbl: "Bespoke UX" }
      ],
      tech: ["HTML5 / CSS Glass", "GSAP ScrollTrigger", "Lenis Scroll", "Webhook Sync"]
    }
  ];

  window.openProjectModal = function(idx) {
    const data = projectDetails[idx % projectDetails.length];
    if (!data) return;

    const pmCat = document.getElementById("pmCat");
    const pmYear = document.getElementById("pmYear");
    const pmTitle = document.getElementById("pmTitle");
    const pmSubtitle = document.getElementById("pmSubtitle");
    const pmHeroImg = document.getElementById("pmHeroImg");
    const pmChallenge = document.getElementById("pmChallenge");
    const pmDeliverables = document.getElementById("pmDeliverables");
    const pmStats = document.getElementById("pmStats");
    const pmTechTags = document.getElementById("pmTechTags");

    if (pmCat) pmCat.textContent = data.cat;
    if (pmYear) pmYear.textContent = `• ${data.year}`;
    if (pmTitle) pmTitle.textContent = data.title;
    if (pmSubtitle) pmSubtitle.textContent = data.subtitle;
    if (pmHeroImg) pmHeroImg.style.backgroundImage = `url('${data.img}')`;
    if (pmChallenge) pmChallenge.textContent = data.challenge;

    if (pmDeliverables) {
      pmDeliverables.innerHTML = data.deliverables.map(item => `<li>${item}</li>`).join("");
    }

    if (pmStats) {
      pmStats.innerHTML = data.stats.map(s => `
        <div class="pm-stat-box">
          <span class="pm-stat-val">${s.val}</span>
          <span class="pm-stat-lbl">${s.lbl}</span>
        </div>
      `).join("");
    }

    if (pmTechTags) {
      pmTechTags.innerHTML = data.tech.map(t => `<span>${t}</span>`).join("");
    }

    window.openModal("projectDetailModal");
  };

  // Wire preview frame click to open project modal
  const previewFrame = document.getElementById("previewFrame");
  let currentActiveProjectIdx = 0;

  if (previewFrame) {
    previewFrame.addEventListener("click", () => {
      window.openProjectModal(currentActiveProjectIdx);
    });
  }

  // Update current active project index when selecting work items
  workItems.forEach((item, index) => {
    item.addEventListener("mouseenter", () => {
      currentActiveProjectIdx = index;
    });
    item.addEventListener("click", () => {
      currentActiveProjectIdx = index;
      window.openProjectModal(index);
    });
  });

  // Also make hero orbit cards clickable to open project modal!
  cardElements.forEach((card, idx) => {
    card.addEventListener("click", () => {
      window.openProjectModal(idx % projectDetails.length);
    });
  });

  /* ── 13. DYNAMIC RESPONSIVE CURSOR HOVER INTERACTIONS ── */
  if (cursorRing) {
    // Work Cards & Orbit Cards & Preview Frame -> Work Lens
    const workInteractables = document.querySelectorAll(".portfolio-card, .work-item, .preview-frame, .orbit-card");
    workInteractables.forEach(el => {
      el.addEventListener("mouseenter", () => cursorRing.classList.add("cursor-hover-work"));
      el.addEventListener("mouseleave", () => cursorRing.classList.remove("cursor-hover-work"));
    });

    // Headings, Italics & Editorial Titles -> Text Lens
    const textInteractables = document.querySelectorAll("h1, h2, h3, em, .hh-line, .sec-label, .ag-title, .ps-title");
    textInteractables.forEach(el => {
      el.addEventListener("mouseenter", () => cursorRing.classList.add("cursor-hover-text"));
      el.addEventListener("mouseleave", () => cursorRing.classList.remove("cursor-hover-text"));
    });

    // Buttons & CTAs -> Button Ring
    const btnInteractables = document.querySelectorAll(".btn-work, .btn-lime-pill, .nav-cta-btn, .de-card, .btn-dark-submit, .btn-project-cta, .nav-links a, .svc-col");
    btnInteractables.forEach(el => {
      el.addEventListener("mouseenter", () => cursorRing.classList.add("cursor-hover-btn"));
      el.addEventListener("mouseleave", () => cursorRing.classList.remove("cursor-hover-btn"));
    });
  }

  /* ── 14. FULL SERVICE & FEATURE DETAIL MODAL ────────────── */
  const serviceDetails = {
    design: {
      tag: "SERVICE PILLAR • DESIGN",
      title: "Bespoke Editorial UI/UX & Brand Design",
      subtitle: "Custom visual systems crafted specifically around your brand identity — zero templates, zero generic page builders.",
      summary: "We design websites that feel like opening a luxury magazine. Every layout, typography choice, color palette, and micro-animation is engineered backwards from your business goal — turning casual browsers into booked calls and paid customers.",
      deliverables: [
        "100% Bespoke editorial UI/UX layout crafted from scratch in Figma",
        "Mobile-first responsive design optimized for iOS & Android gestures",
        "High-conversion editorial copywriting that articulates your value",
        "Micro-animations, smooth glassmorphism depth & 3D interactive card orbits",
        "Custom typography pairings, curated HSL color tokens & aesthetic design system",
        "Interactive wireframes and interactive design previews prior to coding"
      ],
      stats: [
        { val: "100%", lbl: "Custom Design" },
        { val: "3.8x", lbl: "Avg Conversion" },
        { val: "0", lbl: "Pre-bought Templates" },
        { val: "100%", lbl: "Mobile Optimized" }
      ],
      tech: ["Figma Design System", "Newsreader Serif", "CSS Glassmorphism", "Micro-UX", "Conversion Psychology"]
    },
    dev: {
      tag: "SERVICE PILLAR • DEVELOPMENT",
      title: "Ultra-Fast Next.js & Modern Web Engineering",
      subtitle: "Clean, hand-crafted code engineered for sub-second page loads, flawless security, and effortless scalability.",
      summary: "Slow websites kill sales. We build with modern stacks (Next.js, HTML5, GSAP) that load instantly without heavy plugin bloat. Integrated directly with your CRM, booking calendar, or e-commerce gateway.",
      deliverables: [
        "Next.js / HTML5 modern ultra-fast stack with modular architecture",
        "Seamless booking, appointment calendar & instant table reservation engines",
        "Sub-second speed optimization & zero-bloat clean code structure",
        "Cross-browser compatibility testing across Chrome, Safari, Firefox & Edge",
        "Stripe & payment gateway API integrations with instant webhook automation",
        "Zero layout shifts (CLS=0) & 60fps smooth scrolling performance"
      ],
      stats: [
        { val: "< 0.4s", lbl: "First Contentful Paint" },
        { val: "99 / 100", lbl: "Lighthouse Performance" },
        { val: "100%", lbl: "Clean Modular Code" },
        { val: "0", lbl: "Bloated Plugins" }
      ],
      tech: ["Next.js", "GSAP ScrollTrigger", "Lenis Smooth Scroll", "HTML5 Canvas", "Stripe API"]
    },
    seo: {
      tag: "SERVICE PILLAR • SEO & GROWTH",
      title: "Search Engine Authority & Local Growth Engine",
      subtitle: "On-page search optimization and structured data engineered to turn organic Google searches into real client calls.",
      summary: "Being visible on Google isn't an accident. We embed technical SEO, structured data, schema markup, and search intent copywriting directly into every page build so you rank high from day one.",
      deliverables: [
        "Google Business Profile optimization & localized Search ranking setup",
        "On-page structured data & JSON-LD Schema.org rich snippet markup",
        "Core Web Vitals 99+ score optimization (LCP, FID, CLS compliance)",
        "Keyword research & high-intent buyer copywriting strategy",
        "XML sitemap, robots.txt & immediate Google Search Console indexing",
        "Local citation building and authority profile setup"
      ],
      stats: [
        { val: "99 / 100", lbl: "Core Web Vitals Score" },
        { val: "#1", lbl: "Page Local Target" },
        { val: "100%", lbl: "Schema.org Markup" },
        { val: "Instant", lbl: "Google Indexing" }
      ],
      tech: ["JSON-LD Schema", "Google Search Console", "Core Web Vitals", "XML Sitemaps", "Local SEO"]
    },
    care: {
      tag: "SERVICE PILLAR • CARE & GROWTH",
      title: "24/7 Security, Hosting & Continuous Optimization",
      subtitle: "Flat-rate maintenance and support so your site stays fast, secure, and constantly updated — zero effort required.",
      summary: "A website is a living asset. We handle cloud hosting, SSL certificates, daily backups, and continuous speed tweaks so you never have to worry about broken code or downtime.",
      deliverables: [
        "Ultra-fast cloud hosting, SSL encryption & automated security updates",
        "24/7 server uptime monitoring & daily off-site cloud backups",
        "Monthly performance & traffic analytics report delivered to your inbox",
        "Ongoing content updates, copy tweaks & new project additions",
        "Direct developer access via WhatsApp / Email — zero middleman delay",
        "Conversion optimization audits to continually improve sales"
      ],
      stats: [
        { val: "99.9%", lbl: "Uptime Guaranteed" },
        { val: "24/7", lbl: "Automated Monitoring" },
        { val: "Daily", lbl: "Cloud Backups" },
        { val: "< 2hr", lbl: "Priority Response" }
      ],
      tech: ["SSL Security", "Cloudflare CDN", "Uptime Monitoring", "Daily Backups", "Developer Access"]
    }
  };

  window.openServiceModal = function(key) {
    const data = serviceDetails[key] || serviceDetails.design;

    const svcTag = document.getElementById("svcTag");
    const svcTitle = document.getElementById("svcTitle");
    const svcSubtitle = document.getElementById("svcSubtitle");
    const svcSummary = document.getElementById("svcSummary");
    const svcDeliverables = document.getElementById("svcDeliverables");
    const svcStats = document.getElementById("svcStats");
    const svcTechTags = document.getElementById("svcTechTags");

    if (svcTag) svcTag.textContent = data.tag;
    if (svcTitle) svcTitle.textContent = data.title;
    if (svcSubtitle) svcSubtitle.textContent = data.subtitle;
    if (svcSummary) svcSummary.textContent = data.summary;

    if (svcDeliverables) {
      svcDeliverables.innerHTML = data.deliverables.map(item => `<li>${item}</li>`).join("");
    }

    if (svcStats) {
      svcStats.innerHTML = data.stats.map(s => `
        <div class="pm-stat-box">
          <span class="pm-stat-val">${s.val}</span>
          <span class="pm-stat-lbl">${s.lbl}</span>
        </div>
      `).join("");
    }

    if (svcTechTags) {
      svcTechTags.innerHTML = data.tech.map(t => `<span>${t}</span>`).join("");
    }

    window.openModal("serviceDetailModal");
  };
});

