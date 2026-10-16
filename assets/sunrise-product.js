/*
  Sunrise product page behaviour.
  - Gallery: scroll-snap slides with selectable thumbnails.
  - Bundle selector: keeps price, compare-at, savings, cart quantity, the add to cart
    button and the mobile sticky bar in sync with the selected offer.
  - Cart submission itself is handled by Dawn's <product-form> (assets/product-form.js),
    which posts the form's `id` and `quantity` to /cart/add and opens the cart drawer.
*/
(() => {
  const ADDED_STATE_MS = 2200;

  class SunriseProduct {
    constructor(root) {
      this.root = root;
      this.strings = this.readStrings();
      this.form = root.querySelector('form[data-type="add-to-cart-form"]');
      this.quantityInput = root.querySelector('[data-sr-quantity]');
      this.atc = root.querySelector('[data-sr-atc]');
      this.atcText = root.querySelector('[data-sr-atc-text]');
      this.atcPriceWrap = root.querySelector('[data-sr-atc-price-wrap]');
      this.atcStatus = root.querySelector('[data-sr-atc-status]');
      this.errorWrapper = root.querySelector('.product-form__error-message-wrapper');
      this.select = root.querySelector('[data-sr-variant-select]');
      this.radios = Array.from(root.querySelectorAll('input[data-sr-offer]'));
      this.sticky = root.querySelector('[data-sr-sticky]');
      this.stickyAtc = root.querySelector('[data-sr-sticky-atc]');
      this.stickyAtcText = root.querySelector('[data-sr-sticky-atc-text]');
      this.stickyOptions = Array.from(root.querySelectorAll('[data-sr-sticky-option]'));

      this.initGallery();
      this.initSelector();
      this.initButtonMirror();
      this.initSticky();
      this.initCartEvents();
    }

    readStrings() {
      const el = this.root.querySelector('[data-sr-strings]');
      try {
        return el ? JSON.parse(el.textContent) : {};
      } catch (e) {
        return {};
      }
    }

    /* ---------- Gallery ---------- */

    initGallery() {
      this.track = this.root.querySelector('[data-sr-gallery-track]');
      if (!this.track) return;
      this.slides = Array.from(this.track.querySelectorAll('[data-sr-slide]'));
      this.thumbs = Array.from(this.root.querySelectorAll('[data-sr-thumb]'));
      this.counter = this.root.querySelector('[data-sr-gallery-counter]');
      this.activeSlide = 0;

      this.thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => this.goToSlide(index));
        thumb.addEventListener('keydown', (event) => this.onThumbKeydown(event, index));
      });

      let ticking = false;
      this.track.addEventListener(
        'scroll',
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
            const width = this.track.clientWidth || 1;
            const index = Math.round(this.track.scrollLeft / width);
            this.setActiveSlide(Math.max(0, Math.min(index, this.slides.length - 1)));
          });
        },
        { passive: true }
      );
    }

    onThumbKeydown(event, index) {
      let next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % this.thumbs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + this.thumbs.length) % this.thumbs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = this.thumbs.length - 1;
      if (next === null) return;
      event.preventDefault();
      this.thumbs[next].focus();
      this.goToSlide(next);
    }

    goToSlide(index) {
      if (!this.track || !this.slides[index]) return;
      this.track.scrollTo({ left: this.slides[index].offsetLeft, behavior: this.scrollBehavior() });
      this.setActiveSlide(index);
    }

    goToMedia(mediaId) {
      if (!mediaId || !this.slides) return;
      const index = this.slides.findIndex((slide) => slide.dataset.mediaId === String(mediaId));
      if (index > -1 && index !== this.activeSlide) this.goToSlide(index);
    }

    setActiveSlide(index) {
      if (index === this.activeSlide && this.slides[index]?.getAttribute('aria-hidden') !== 'true') return;
      this.activeSlide = index;
      this.slides.forEach((slide, i) => {
        if (i === index) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');
      });
      this.thumbs.forEach((thumb, i) => {
        if (i === index) thumb.setAttribute('aria-current', 'true');
        else thumb.removeAttribute('aria-current');
      });
      if (this.counter && this.strings.mediaCount) {
        this.counter.textContent = this.strings.mediaCount
          .replace('[index]', index + 1)
          .replace('[count]', this.slides.length);
      }
    }

    scrollBehavior() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    }

    /* ---------- Bundle / variant selection ---------- */

    initSelector() {
      this.radios.forEach((radio) => radio.addEventListener('change', () => this.onSelectionChange()));
      if (this.select) this.select.addEventListener('change', () => this.onSelectionChange());

      this.stickyOptions.forEach((button) => {
        button.addEventListener('click', () => {
          const radio = this.radios.find((r) => r.dataset.srOffer === button.dataset.srStickyOption);
          if (!radio || radio.checked) return;
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });

      // Browsers may restore a different checked radio on back/forward navigation.
      if (this.selectedOffer()) this.applyOffer(this.selectedOffer(), { moveGallery: false });
    }

    selectedOffer() {
      if (this.select) return this.select.selectedOptions[0] || null;
      return this.radios.find((radio) => radio.checked) || null;
    }

    onSelectionChange() {
      const offer = this.selectedOffer();
      if (!offer) return;
      this.clearAddedState();
      this.hideError();
      this.applyOffer(offer, { moveGallery: true });
    }

    applyOffer(offer, { moveGallery }) {
      const data = offer.dataset;
      const available = data.available === 'true';

      if (this.quantityInput) this.quantityInput.value = data.quantity || '1';

      this.root.querySelectorAll('[data-sr-price-current]').forEach((el) => {
        el.textContent = data.price;
      });
      this.root.querySelectorAll('[data-sr-price-compare]').forEach((el) => {
        el.hidden = !data.compare;
        const value = el.querySelector('[data-sr-price-compare-value]');
        if (value) value.textContent = data.compare || '';
      });
      this.root.querySelectorAll('[data-sr-price-badge]').forEach((el) => {
        el.hidden = !data.badge;
        el.textContent = data.badge || '';
      });
      this.root.querySelectorAll('[data-sr-summary]').forEach((el) => {
        el.textContent = data.summary || '';
      });
      this.root.querySelectorAll('[data-sr-sticky-note]').forEach((el) => {
        el.textContent = data.stickyNote || '';
      });

      this.stickyOptions.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.srStickyOption === data.srOffer));
      });

      this.setAvailability(available);
      if (moveGallery) this.goToMedia(data.mediaId);
    }

    setAvailability(available) {
      if (!this.atc) return;
      if (available) {
        this.atc.removeAttribute('disabled');
        if (this.atcText) this.atcText.textContent = this.strings.addToCart || this.atcText.textContent;
        if (this.atcPriceWrap) this.atcPriceWrap.hidden = false;
      } else {
        this.atc.setAttribute('disabled', 'disabled');
        if (this.atcText) this.atcText.textContent = this.strings.soldOut || this.atcText.textContent;
        if (this.atcPriceWrap) this.atcPriceWrap.hidden = true;
      }
      this.mirrorButton();
    }

    hideError() {
      if (this.errorWrapper) this.errorWrapper.hidden = true;
    }

    /* ---------- Add to cart state ---------- */

    initButtonMirror() {
      if (!this.atc || !this.stickyAtc) return;
      new MutationObserver(() => this.mirrorButton()).observe(this.atc, {
        attributes: true,
        attributeFilter: ['class', 'disabled', 'aria-disabled'],
      });
      this.mirrorButton();
    }

    mirrorButton() {
      if (!this.atc || !this.stickyAtc) return;
      const disabled = this.atc.hasAttribute('disabled');
      const loading = this.atc.classList.contains('loading');
      const added = this.atc.classList.contains('is-added');

      this.stickyAtc.toggleAttribute('disabled', disabled);
      this.stickyAtc.classList.toggle('loading', loading);
      if (loading) this.stickyAtc.setAttribute('aria-disabled', 'true');
      else this.stickyAtc.removeAttribute('aria-disabled');

      if (!this.stickyAtcText) return;
      const adding = this.atc.querySelector('.sr-atc__state--adding');
      if (loading && adding) this.stickyAtcText.textContent = adding.textContent.trim();
      else if (added) this.stickyAtcText.textContent = this.strings.added || '';
      else if (disabled) this.stickyAtcText.textContent = this.strings.soldOut || '';
      else this.stickyAtcText.textContent = this.strings.addToCart || '';
    }

    initCartEvents() {
      if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;
      this.unsubscribeCart = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
        if (event.source !== 'product-form') return;
        const offer = this.selectedOffer();
        if (!offer || String(event.productVariantId) !== String(offer.value)) return;
        this.showAddedState();
      });
    }

    showAddedState() {
      if (!this.atc) return;
      clearTimeout(this.addedTimer);
      this.atc.classList.add('is-added');
      if (this.atcStatus) this.atcStatus.textContent = this.strings.added || '';
      this.addedTimer = setTimeout(() => this.clearAddedState(), ADDED_STATE_MS);
    }

    clearAddedState() {
      clearTimeout(this.addedTimer);
      if (this.atc) this.atc.classList.remove('is-added');
      if (this.atcStatus) this.atcStatus.textContent = '';
    }

    /* ---------- Sticky bar ---------- */

    initSticky() {
      if (!this.sticky || !this.atc || !('IntersectionObserver' in window)) return;
      this.pastButton = false;
      this.footerVisible = false;

      new IntersectionObserver(([entry]) => {
        this.pastButton = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        this.updateSticky();
      }).observe(this.atc);

      const footer = document.querySelector('.footer, footer');
      if (footer) {
        new IntersectionObserver(([entry]) => {
          this.footerVisible = entry.isIntersecting;
          this.updateSticky();
        }).observe(footer);
      }
    }

    updateSticky() {
      const visible = this.pastButton && !this.footerVisible;
      this.sticky.classList.toggle('is-visible', visible);
      this.sticky.setAttribute('aria-hidden', String(!visible));
      this.sticky.toggleAttribute('inert', !visible);
    }
  }

  const init = (scope) => {
    scope.querySelectorAll('[data-sr-product]').forEach((root) => {
      if (root.srProduct) return;
      root.srProduct = new SunriseProduct(root);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(document));
  } else {
    init(document);
  }

  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:section:unload', (event) => {
    event.target.querySelectorAll('[data-sr-product]').forEach((root) => {
      if (root.srProduct?.unsubscribeCart) root.srProduct.unsubscribeCart();
    });
  });
})();
