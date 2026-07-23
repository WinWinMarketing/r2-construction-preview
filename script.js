"use strict";

const CONTACT_CONFIG = Object.freeze({
  businessName: "R2 WoodWork",
  // Drop in Max's real details here. Phone accepts any format (auto-normalized to E.164).
  phoneE164: "",
  whatsappE164: "",
  email: "",
  whatsappMessage: "Hi, I’d like a free estimate for a finish carpentry / trim project."
});

const BUSINESS_CLAIMS = Object.freeze({
  // Confirmed in the client brief: WSIB coverage + workmanship warranty.
  wsibCovered: true,
  workmanshipWarranty: true
});

// Quote form delivery. Web3Forms works on a static host (GitHub Pages) with no server:
// create a free key at https://web3forms.com tied to the business inbox, paste it below.
// The access key is public by design. Until it is set, the form falls back to an email/mailto path.
const QUOTE_FORM_CONFIG = Object.freeze({
  accessKey: "",
  subject: "New estimate request from the R2 WoodWork site"
});

const root = document.documentElement;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!reducedMotionQuery.matches) root.classList.add("motion-ready");

function normalizeE164(value) {
  if (typeof value !== "string") return null;

  const input = value.trim();
  if (!input) return null;

  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (input.startsWith("+") && digits.length >= 8 && digits.length <= 15) return `+${digits}`;

  return null;
}

function setCompactContactState(link, state) {
  const compactState = link.querySelector("small");
  if (compactState) compactState.textContent = state;
}

function disableContactLink(link, label) {
  link.removeAttribute("href");
  link.removeAttribute("target");
  link.removeAttribute("rel");
  link.setAttribute("role", "link");
  link.setAttribute("aria-disabled", "true");
  link.setAttribute("tabindex", "0");
  link.setAttribute("aria-describedby", "contact-status");
  link.setAttribute("aria-label", `${label} is unavailable in this preview`);
  link.setAttribute("title", `${label} details are pending`);
  setCompactContactState(link, "Pending");
}

function enableContactLink(link, href, label, openExternal = false) {
  link.href = href;
  link.removeAttribute("aria-disabled");
  link.removeAttribute("tabindex");
  link.removeAttribute("title");
  link.removeAttribute("role");
  link.removeAttribute("aria-describedby");
  link.setAttribute("aria-label", label);
  setCompactContactState(link, "Ready");

  if (openExternal) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
}

function configureContacts() {
  const phone = normalizeE164(CONTACT_CONFIG.phoneE164);
  const whatsapp = normalizeE164(CONTACT_CONFIG.whatsappE164);
  const phoneLinks = document.querySelectorAll('[data-contact="phone"]');
  const whatsappLinks = document.querySelectorAll('[data-contact="whatsapp"]');

  phoneLinks.forEach((link) => {
    if (phone) enableContactLink(link, `tel:${phone}`, `Call ${CONTACT_CONFIG.businessName}`);
    else disableContactLink(link, "Call");
  });

  whatsappLinks.forEach((link) => {
    if (whatsapp) {
      const message = encodeURIComponent(CONTACT_CONFIG.whatsappMessage);
      enableContactLink(
        link,
        `https://wa.me/${whatsapp.slice(1)}?text=${message}`,
        `Message ${CONTACT_CONFIG.businessName} on WhatsApp`,
        true
      );
    } else disableContactLink(link, "WhatsApp");
  });

  const email = typeof CONTACT_CONFIG.email === "string" ? CONTACT_CONFIG.email.trim() : "";
  document.querySelectorAll('[data-contact="email"]').forEach((link) => {
    if (email) enableContactLink(link, `mailto:${email}`, `Email ${CONTACT_CONFIG.businessName}`);
    else disableContactLink(link, "Email");
    const label = link.querySelector("[data-email-label]");
    if (label) label.textContent = email || "Email pending";
  });

  let contactMessage = "Preview only — phone and WhatsApp details have not been supplied yet.";
  if (phone && whatsapp) contactMessage = "Free estimates are available by phone or WhatsApp.";
  else if (phone) contactMessage = "Phone is available. WhatsApp details are still pending.";
  else if (whatsapp) contactMessage = "WhatsApp is available. Phone details are still pending.";

  document.querySelectorAll("[data-contact-note]").forEach((note) => {
    note.textContent = contactMessage;
    note.classList.toggle("is-ready", Boolean(phone || whatsapp));
  });

  const mobileState = document.querySelector("[data-mobile-contact-state]");
  if (mobileState) mobileState.textContent = contactMessage;

  document.querySelectorAll('[data-contact][aria-disabled="true"]').forEach((link) => {
    const preventUnavailableContact = (event) => {
      if (event.type === "click" || event.key === "Enter" || event.key === " ") event.preventDefault();
    };
    link.addEventListener("click", preventUnavailableContact);
    link.addEventListener("keydown", preventUnavailableContact);
  });
}

function configureTrustClaims() {
  const wsibSlot = document.querySelector('[data-trust-slot="wsib"]');
  const warrantySlot = document.querySelector('[data-trust-slot="warranty"]');

  if (wsibSlot) wsibSlot.textContent = BUSINESS_CLAIMS.wsibCovered ? "WSIB-covered" : "Free estimates";
  if (warrantySlot) {
    warrantySlot.textContent = BUSINESS_CLAIMS.workmanshipWarranty
      ? "Workmanship warranty"
      : "Serving the GTA";
  }
}

function configureBrand() {
  document.querySelectorAll("[data-brand-logo]").forEach((image) => {
    const hideMissingImage = () => image.setAttribute("hidden", "");
    image.addEventListener("error", hideMissingImage, { once: true });
    if (image.complete && image.naturalWidth === 0) hideMissingImage();
  });
}

function configureMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-mobile-panel]");
  const header = document.querySelector("[data-site-header]");
  if (!toggle || !panel || !header) return;

  const setMenuOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    panel.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    header.classList.toggle("is-menu-open", open);
  };

  toggle.addEventListener("click", () => setMenuOpen(toggle.getAttribute("aria-expanded") !== "true"));
  panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
    setMenuOpen(false);
    toggle.focus();
  });

  const desktopQuery = window.matchMedia("(min-width: 68.01rem)");
  desktopQuery.addEventListener("change", (event) => {
    if (event.matches) setMenuOpen(false);
  });
}

function configureReveals() {
  const revealItems = document.querySelectorAll("[data-reveal]");
  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -9%", threshold: 0.07 });

  revealItems.forEach((item) => revealObserver.observe(item));
}

function configureDetailStrips() {
  const strips = document.querySelectorAll(".story-detail-strip");
  const narrowQuery = window.matchMedia("(max-width: 47.99rem)");

  const syncFocusability = (isNarrow) => {
    strips.forEach((strip) => {
      if (isNarrow) strip.setAttribute("tabindex", "0");
      else strip.removeAttribute("tabindex");
    });
  };

  syncFocusability(narrowQuery.matches);
  narrowQuery.addEventListener("change", (event) => syncFocusability(event.matches));
}

function configureScrollMotion() {
  const header = document.querySelector("[data-site-header]");
  const progressPath = document.querySelector(".blueprint-progress");
  const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
  const activeParallax = new Set();
  let frameRequested = false;
  let pageVisible = !document.hidden;

  const parallaxObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeParallax.add(entry.target);
          else activeParallax.delete(entry.target);
        });
      }, { rootMargin: "20% 0px" })
    : null;

  if (parallaxObserver) parallaxItems.forEach((item) => parallaxObserver.observe(item));
  else parallaxItems.forEach((item) => activeParallax.add(item));

  const render = () => {
    frameRequested = false;
    if (!pageVisible) return;

    const scrollTop = window.scrollY;
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollTop / scrollRange));

    if (header) header.classList.toggle("is-scrolled", scrollTop > 24);
    root.style.setProperty("--blueprint-progress", progress.toFixed(4));
    if (progressPath) progressPath.style.strokeDashoffset = String(1 - progress);

    if (!reducedMotionQuery.matches) {
      const viewportCenter = window.innerHeight / 2;
      activeParallax.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const normalized = (itemCenter - viewportCenter) / Math.max(window.innerHeight, rect.height);
        const distance = Math.max(-13, Math.min(13, normalized * -18));
        item.style.setProperty("--parallax-y", `${distance.toFixed(2)}px`);
      });
    }
  };

  const requestRender = () => {
    if (frameRequested || !pageVisible) return;
    frameRequested = true;
    window.requestAnimationFrame(render);
  };

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender, { passive: true });
  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    if (pageVisible) requestRender();
  });
  reducedMotionQuery.addEventListener("change", requestRender);
  requestRender();
}

function configureQuoteForm() {
  const form = document.querySelector("[data-quote-form]");
  if (!form) return;

  const status = form.querySelector("[data-quote-status]");
  const submit = form.querySelector('button[type="submit"]');
  const accessKey = typeof QUOTE_FORM_CONFIG.accessKey === "string" ? QUOTE_FORM_CONFIG.accessKey.trim() : "";
  const email = typeof CONTACT_CONFIG.email === "string" ? CONTACT_CONFIG.email.trim() : "";

  const setStatus = (message, tone) => {
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone || "";
  };

  // No delivery configured yet: keep the form usable as a pre-addressed email draft if we have an inbox,
  // otherwise present it in a clearly-labelled preview state instead of silently failing.
  if (!accessKey) {
    form.dataset.mode = email ? "mailto" : "preview";
    setStatus(
      email
        ? "This opens a pre-filled email. Connect Web3Forms for one-click sending."
        : "Preview only. Add a Web3Forms key or business email to start receiving requests.",
      "muted"
    );
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Honeypot: real users never fill this hidden field.
    if (form.querySelector('[name="botcheck"]')?.value) return;

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const contact = String(data.get("contact") || "").trim();
    const details = String(data.get("details") || "").trim();

    if (name.length < 2 || contact.length < 5 || details.length < 5) {
      setStatus("Please add your name, a way to reach you, and a short project note.", "error");
      return;
    }

    if (!accessKey) {
      if (email) {
        const body = `Name: ${name}%0D%0AContact: ${contact}%0D%0A%0D%0A${encodeURIComponent(details)}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(QUOTE_FORM_CONFIG.subject)}&body=${body}`;
        setStatus("Opening your email app with the details filled in.", "ok");
      } else {
        setStatus("The request form is not connected yet. Please check back shortly.", "muted");
      }
      return;
    }

    if (submit) submit.disabled = true;
    setStatus("Sending your request…", "muted");

    try {
      const payload = {
        access_key: accessKey,
        subject: QUOTE_FORM_CONFIG.subject,
        from_name: `${CONTACT_CONFIG.businessName} website`,
        name,
        contact,
        details
      };
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        form.reset();
        setStatus("Thanks. Your request is in, we’ll reply with next steps.", "ok");
      } else {
        setStatus("Something went wrong. Please call or message us instead.", "error");
      }
    } catch (networkError) {
      setStatus("Network issue. Please call or message us instead.", "error");
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

function configurePageLoad() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => root.classList.add("page-ready"));
  });
}

function initializePage() {
  configureContacts();
  configureTrustClaims();
  configureBrand();
  configureMenu();
  configureReveals();
  configureDetailStrips();
  configureQuoteForm();
  configureScrollMotion();
  configurePageLoad();

  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = year;
  });
}

initializePage();
