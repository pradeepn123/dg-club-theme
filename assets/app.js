if (typeof debounce === 'undefined') {
  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
}
var dispatchCustomEvent = function dispatchCustomEvent(eventName) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var detail = {
    detail: data
  };
  var event = new CustomEvent(eventName, data ? detail : null);
  document.dispatchEvent(event);
};

/**
 *  @class
 *  @function Quantity
 */
if (!customElements.get('quantity-selector')) {
  class QuantityInput extends HTMLElement {
    constructor() {
      super();
      this.input = this.querySelector('.qty');
      this.step = this.input.getAttribute('step');
      this.changeEvent = new Event('change', {
        bubbles: true
      });
      // Create buttons
      this.subtract = this.querySelector('.minus');
      this.add = this.querySelector('.plus');

      // Add functionality to buttons
      this.subtract.addEventListener('click', () => this.change_quantity(-1 * this.step));
      this.add.addEventListener('click', () => this.change_quantity(1 * this.step));

      this.validateQtyRules();
    }
    connectedCallback() {
      this.classList.add('buttons_added');
    }
    change_quantity(change) {
      // Get current value
      let quantity = Number(this.input.value);

      // Ensure quantity is a valid number
      if (isNaN(quantity)) quantity = 1;

      // Check for min & max
      if (this.input.getAttribute('min') > (quantity + change)) {
        return;
      }
      if (this.input.getAttribute('max')) {
        if (this.input.getAttribute('max') < (quantity + change)) {
          return;
        }
      }

      // Change quantity
      quantity += change;

      // Ensure quantity is always a number
      quantity = Math.max(quantity, 1);

      // Output number
      this.input.value = quantity;

      this.input.dispatchEvent(this.changeEvent);

      this.validateQtyRules();
    }
    validateQtyRules() {
      const value = parseInt(this.input.value);
      if (this.input.min) {
        const min = parseInt(this.input.min);
        this.subtract.classList.toggle('disabled', value <= min);
      }
      if (this.input.max) {
        const max = parseInt(this.input.max);
        this.add.classList.toggle('disabled', value >= max);
      }
    }
  }
  customElements.define('quantity-selector', QuantityInput);
}

/**
 *  @class
 *  @function ArrowSubMenu
 */
class ArrowSubMenu {

  constructor(self) {
    this.submenu = self.parentNode.querySelector('.sub-menu');
    this.arrow = self;
    // Add functionality to buttons
    self.addEventListener('click', (e) => this.toggle_submenu(e));
  }

  toggle_submenu(e) {
    e.preventDefault();
    let submenu = this.submenu;

    if (!submenu.classList.contains('active')) {
      submenu.classList.add('active');

    } else {
      submenu.classList.remove('active');
      this.arrow.blur();
    }
  }
}
let arrows = document.querySelectorAll('.thb-arrow');
arrows.forEach((arrow) => {
  new ArrowSubMenu(arrow);
});

/**
 *  @class
 *  @function ProductCard
 */
if (!customElements.get('product-card')) {
  class ProductCard extends HTMLElement {
    constructor() {
      super();
      this.swatches = this.querySelector('.product-card-swatches');
      this.image = this.querySelector('.product-featured-image-link .product-primary-image');
      this.additional_images = this.querySelectorAll('.product-secondary-image');
      this.additional_images_nav = this.querySelectorAll('.product-secondary-images-nav li');
      this.quick_add = this.querySelector('.product-card--add-to-cart-button-simple');
    }
    connectedCallback() {
      if (this.swatches) {
        this.enableSwatches(this.swatches, this.image);
      }
      if (this.additional_images) {
        this.enableAdditionalImages();
      }
      if (this.quick_add) {
        this.enableQuickAdd();
      }
    }
    enableAdditionalImages() {
      let image_length = this.additional_images.length;
      let images = this.additional_images;
      let nav = this.additional_images_nav;
      let image_container = this.querySelector('.product-featured-image');
      const mousemove = function (e) {
        let l = e.offsetX;
        let w = this.getBoundingClientRect().width;
        let prc = l / w;
        let sel = Math.floor(prc * image_length);
        let selimg = images[sel];
        images.forEach((image, index) => {
          if (image.classList.contains('hover')) {
            image.classList.remove('hover');
            if (nav.length) {
              nav[index].classList.remove('active');
            }
          }
        });
        if (selimg) {
          if (!selimg.classList.contains('hover')) {
            selimg.classList.add('hover');
            if (nav.length) {
              nav[sel].classList.add('active');
            }
          }
        }

      };
      const mouseleave = function (e) {
        images.forEach((image, index) => {
          image.classList.remove('hover');
          if (nav.length) {
            nav[index].classList.remove('active');
          }
        });
      };
      image_container.addEventListener('touchstart', mousemove, {
        passive: true
      });
      image_container.addEventListener('touchmove', mousemove, {
        passive: true
      });
      image_container.addEventListener('touchend', mouseleave, {
        passive: true
      });
      image_container.addEventListener('mouseenter', mousemove, {
        passive: true
      });
      image_container.addEventListener('mousemove', mousemove, {
        passive: true
      });
      image_container.addEventListener('mouseleave', mouseleave, {
        passive: true
      });
    }
    enableSwatches(swatches, image) {
      let swatch_list = swatches.querySelectorAll('.product-card-swatch'),
        org_srcset = image ? image.dataset.srcset : '',
        active = swatches.querySelector('.product-card-swatch.active');

      swatch_list.forEach((swatch, index) => {

        swatch.addEventListener('mouseover', function () {

          [].forEach.call(swatch_list, function (el) {
            el.classList.remove('active');
          });
          if (image) {
            if (swatch.dataset.srcset) {
              image.setAttribute('srcset', swatch.dataset.srcset);
            } else {
              image.setAttribute('srcset', org_srcset);
            }
          }

          swatch.classList.add('active');
        });
        swatch.addEventListener('click', function (evt) {
          window.location.href = this.dataset.href;
          evt.preventDefault();
        });
      });
    }
    enableQuickAdd() {
      this.quick_add.addEventListener('click', this.quickAdd.bind(this));
    }

    quickAdd(evt) {
      evt.preventDefault();
      if (this.quick_add.disabled) {
        return;
      }
      this.quick_add.classList.add('loading');
      this.quick_add.setAttribute('aria-disabled', true);

      const config = {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/javascript'
        }
      };

      let formData = new FormData(this.form);

      formData.append('id', this.quick_add.dataset.productId);
      formData.append('quantity', 1);
      formData.append('sections', this.getSectionsToRender().map((section) => section.section));
      formData.append('sections_url', window.location.pathname);

      config.body = formData;

      fetch(`${theme.routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            return;
          }
          this.renderContents(response);

          dispatchCustomEvent('cart:item-added', {
            product: response.hasOwnProperty('items') ? response.items[0] : response
          });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.quick_add.classList.remove('loading');
          this.quick_add.removeAttribute('aria-disabled');
        });

      return false;
    }
    getSectionsToRender() {
      return [{
        id: 'Cart',
        section: 'main-cart',
        selector: '.thb-cart-form'
      },
      {
        id: 'Cart-Drawer',
        section: 'cart-drawer',
        selector: '.cart-drawer'
      },
      {
        id: 'cart-drawer-toggle',
        section: 'cart-bubble',
        selector: '.thb-item-count'
      }];
    }
    renderContents(parsedState) {
      this.getSectionsToRender().forEach((section => {
        if (!document.getElementById(section.id)) {
          return;
        }
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
        elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
        if (typeof CartDrawer !== 'undefined') {
          new CartDrawer();
        }
        if (typeof Cart !== 'undefined') {
          new Cart().renderContents(parsedState);
        }
      }));


      if (document.getElementById('Cart-Drawer')) {
        document.body.classList.add('open-cc');
        document.getElementById('Cart-Drawer').classList.add('active');

        dispatchCustomEvent('cart-drawer:open');
      }

    }
    getSectionInnerHTML(html, selector = '.shopify-section') {
      return new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector).innerHTML;
    }
  }
  customElements.define('product-card', ProductCard);
}

/**
 *  @class
 *  @function ProductCardSmall
 */
if (!customElements.get('product-card-small')) {
  class ProductCardSmall extends HTMLElement {
    constructor() {
      super();

      this.quick_add_enabled = this.classList.contains('quick-add-to-card--true');
      this.button = this.querySelector('button');
      this.id = this.dataset.id;
      this.url = this.dataset.url;
    }
    connectedCallback() {
      if (this.quick_add_enabled) {
        this.setEventListeners();
      }
    }
    setEventListeners() {
      this.button.addEventListener('click', this.addToCart.bind(this));
    }
    getSectionsToRender() {
      return [{
        id: 'Cart',
        section: 'main-cart',
        selector: '.thb-cart-form'
      },
      {
        id: 'Cart-Drawer',
        section: 'cart-drawer',
        selector: '.cart-drawer'
      },
      {
        id: 'cart-drawer-toggle',
        section: 'cart-bubble',
        selector: '.thb-item-count'
      }];
    }

    addToCart() {
      this.button.classList.add('loading');
      if (!this.quick_add_enabled) {
        // quick view
      }
      this.button.setAttribute('aria-disabled', true);

      const config = {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/javascript'
        }
      };

      let formData = new FormData(this.form);

      formData.append('id', this.id);
      formData.append('quantity', 1);
      formData.append('sections', this.getSectionsToRender().map((section) => section.section));
      formData.append('sections_url', window.location.pathname);

      config.body = formData;

      fetch(`${theme.routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            return;
          }

          this.renderContents(response);

          dispatchCustomEvent('cart:item-added', {
            product: response.hasOwnProperty('items') ? response.items[0] : response
          });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.button.classList.remove('loading');
          this.button.removeAttribute('aria-disabled');
        });
    }
    renderContents(parsedState) {
      this.getSectionsToRender().forEach((section => {
        if (!document.getElementById(section.id)) {
          return;
        }
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
        elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);

        if (typeof CartDrawer !== 'undefined') {
          new CartDrawer();
        }
        if (typeof Cart !== 'undefined') {
          new Cart().renderContents(parsedState);
        }
      }));
      if (document.getElementById('Cart-Drawer')) {
        document.body.classList.add('open-cc');
        document.getElementById('Cart-Drawer').classList.add('active');
        dispatchCustomEvent('cart-drawer:open');
      }
    }
    getSectionInnerHTML(html, selector = '.shopify-section') {
      return new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector).innerHTML;
    }
  }
  customElements.define('product-card-small', ProductCardSmall);
}

/**
 *  @class
 *  @function PanelClose
 */
class PanelClose extends HTMLElement {

  constructor() {
    super();
    let cc = document.querySelector('.click-capture');

    // Add functionality to buttons
    this.addEventListener('click', (e) => this.close_panel(e));
    document.addEventListener('keyup', (e) => {
      if (e.code) {
        if (e.code.toUpperCase() === 'ESCAPE') {
          document.querySelectorAll('.side-panel').forEach((panel) => {
            if (document.body.classList.contains('open-cc--product')) {
              document.body.classList.remove('open-cc--product');

              setTimeout(() => {
                document.querySelector('#Product-Drawer-Content').innerHTML = '';
              }, 260);
            } else {
              if (panel.classList.contains('cart-drawer')) {
                document.getElementById('cart-drawer-toggle').focus();
              }
              document.body.classList.remove('open-cc');
            }
            panel.classList.remove('active');
          });
        }
      }
    });
    cc.addEventListener('click', (e) => {
      let panel = document.querySelector('.side-panel.active');
      if (panel) {
        panel.classList.remove('active');
        document.body.classList.remove('open-cc');
      }
    });
  }

  close_panel(e) {
    e.preventDefault();
    let panel = e.target.closest('.side-panel');
    panel.classList.remove('active');
    if (document.body.classList.contains('open-cc--product')) {
      document.body.classList.remove('open-cc--product');
      setTimeout(() => {
        document.querySelector('#Product-Drawer-Content').innerHTML = '';
      }, 260);
    } else {
      document.body.classList.remove('open-cc');
    }
  }
}
customElements.define('side-panel-close', PanelClose);

/**
 *  @class
 *  @function CartDrawer
 */
class CartDrawer {

  constructor() {
    this.container = document.getElementById('Cart-Drawer');

    if (!this.container) {
      return;
    }
    let _this = this,
      button = document.getElementById('cart-drawer-toggle'),
      checkout_button = this.container.querySelector('.button.checkout');


    // Add functionality to buttons
    button.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.add('open-cc');
      this.container.classList.add('active');
      this.container.focus();
      dispatchCustomEvent('cart-drawer:open');
    });

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.container.addEventListener('change', this.debouncedOnChange.bind(this));

    this.notesToggle();
    this.removeProductEvent();
    // Terms checkbox
    this.termsCheckbox();
  }
  onChange(event) {
    if (event.target.classList.contains('qty')) {
      this.updateQuantity(event.target.dataset.index, event.target.value);
    }
  }
  removeProductEvent() {
    let removes = this.container.querySelectorAll('.remove');

    removes.forEach((remove) => {
      remove.addEventListener('click', (event) => {
        this.updateQuantity(event.target.dataset.index, '0');

        event.preventDefault();
      });
    });
  }
  getSectionsToRender() {
    return [{
      id: 'Cart-Drawer',
      section: 'cart-drawer',
      selector: '.cart-drawer'
    },
    {
      id: 'cart-drawer-toggle',
      section: 'cart-bubble',
      selector: '.thb-item-count'
    }];
  }
  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }
  termsCheckbox() {
    let terms_checkbox = this.container.querySelector('#CartDrawerTerms'),
      checkout_button = this.container.querySelector('.button.checkout');

    if (terms_checkbox && checkout_button) {
      terms_checkbox.setCustomValidity(theme.strings.requiresTerms);
      checkout_button.addEventListener('click', function (e) {
        if (!terms_checkbox.checked) {
          terms_checkbox.reportValidity();
          terms_checkbox.focus();
          e.preventDefault();
        }
      });
    }
  }
  notesToggle() {
    let notes_toggle = document.getElementById('order-note-toggle');

    if (!notes_toggle) {
      return;
    }

    notes_toggle.addEventListener('click', (event) => {
      notes_toggle.nextElementSibling.classList.add('active');
    });
    notes_toggle.nextElementSibling.querySelectorAll('.button, .order-note-toggle__content-overlay').forEach((el) => {
      el.addEventListener('click', (event) => {
        notes_toggle.nextElementSibling.classList.remove('active');
        this.saveNotes();
      });
    });
  }
  saveNotes() {
    fetch(`${theme.routes.cart_update_url}.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': `application/json`
      },
      body: JSON.stringify({
        'note': document.getElementById('mini-cart__notes').value
      })
    });
  }
  updateQuantity(line, quantity) {
    this.container.querySelector(`#CartDrawerItem-${line}`).classList.add('thb-loading');
    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });

    dispatchCustomEvent('line-item:change:start', {
      quantity: quantity
    });
    fetch(`${theme.routes.cart_change_url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': `application/json`
      },
      ...{
        body
      }
    })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);

        this.getSectionsToRender().forEach((section => {
          const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

          if (parsedState.sections) {
            elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
          }
        }));
        this.removeProductEvent();
        this.notesToggle();
        this.termsCheckbox();
        dispatchCustomEvent('line-item:change:end', {
          quantity: quantity,
          cart: parsedState
        });
        if (this.container.querySelector(`#CartDrawerItem-${line}`)) {
          this.container.querySelector(`#CartDrawerItem-${line}`).classList.remove('thb-loading');
        }
      });
  }
}

/**
 *  @class
 *  @function ModalDialog
 */
class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this)
    );
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target.nodeName === 'MODAL-DIALOG') this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    this.removeAttribute('open');
    this.querySelectorAll('.js-youtube').forEach((video) => {
      video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
    });
    this.querySelectorAll('.js-vimeo').forEach((video) => {
      video.contentWindow.postMessage('{"method":"pause"}', '*');
    });
    this.querySelectorAll('video').forEach((video) => video.pause());
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);



/**
 *  @class
 *  @function SelectWidth
 */
class SelectWidth {
  constructor() {
    let _this = this;
    // resize on initial load
    window.addEventListener('load', () => {
      document.querySelectorAll('.resize-select').forEach(_this.resizeSelect);
    });

    // delegated listener on change
    document.body.addEventListener('change', (e) => {
      if (e.target.matches('.resize-select') && e.target.offsetParent !== null) {
        _this.resizeSelect(e.target);
      }
    });
    window.addEventListener('resize.resize-select', function () {
      document.querySelectorAll(".resize-select").forEach(_this.resizeSelect);
    });
  }

  resizeSelect(sel) {
    let tempOption = document.createElement('option');
    tempOption.textContent = sel.selectedOptions[0].textContent;

    let tempSelect = document.createElement('select');
    tempSelect.style.visibility = "hidden";
    tempSelect.style.position = "fixed";
    tempSelect.appendChild(tempOption);

    sel.after(tempSelect);
    if (tempSelect.clientWidth > 0) {
      sel.style.width = `${+tempSelect.clientWidth + 12}px`;
    }
    tempSelect.remove();
  }
}

if (typeof SelectWidth !== 'undefined') {
  new SelectWidth();
}

/**
 *  @class
 *  @function FooterMenuToggle
 */
class FooterMenuToggle {
  constructor() {
    let _this = this;
    // resize on initial load
    document.querySelectorAll(".thb-widget-title.collapsible").forEach((button) => {
      button.addEventListener("click", (e) => {
        button.classList.toggle('active');
      });
    });
  }
}

/**
 *  @class
 *  @function CustomSelect
 */
if (!customElements.get('custom-select')) {
  class CustomSelect extends HTMLElement {
    constructor() {
      super();
      this.detailsements = {
        form: this.closest('form'),
        input: this.querySelector('input'),
        button: this.querySelector('.custom-select--button'),
        panel: this.querySelector('.custom-select--list'),
      };
      this.autoClose = this.dataset.autoClose;
      this.detailsements.button.addEventListener('click', this.toggleSelector.bind(this));
      this.detailsements.button.addEventListener('focusout', this.closeSelector.bind(this));
      this.addEventListener('keyup', this.onContainerKeyUp.bind(this));

      this.detailsements.panel.querySelectorAll('button').forEach(item => item.addEventListener('click', this.onItemClick.bind(this)));
    }

    hidePanel() {
      this.detailsements.button.setAttribute('aria-expanded', 'false');
      this.classList.remove('custom-select--active');
    }

    onContainerKeyUp(event) {
      if (event.code.toUpperCase() !== 'ESCAPE') return;

      this.hidePanel();
      this.detailsements.button.focus();
    }

    onItemClick(event) {
      event.preventDefault();
      this.detailsements.input.value = event.currentTarget.dataset.value;
      this.detailsements.input.dispatchEvent(new Event('change'));
      this.detailsements.button.querySelector('.custom-select--text').textContent = event.currentTarget.textContent;
      if (this.detailsements.form) {
        this.detailsements.form.dispatchEvent(new Event('input'));
      }
      if (this.autoClose) {
        this.classList.remove('custom-select--active');
      }
    }

    toggleSelector(event) {
      event.preventDefault();
      this.classList.toggle('custom-select--active');
      if (this.classList.contains('custom-select--active')) {
        this.detailsements.button.focus();
        this.detailsements.button.setAttribute('aria-expanded', (this.detailsements.button.getAttribute('aria-expanded') === 'false').toString());
      } else {
        this.hidePanel();
      }
    }

    closeSelector(event) {
      const shouldClose = event.relatedTarget && event.relatedTarget.classList.contains('custom-select--button');
      if (event.relatedTarget === null || shouldClose) {
        this.hidePanel();
      }
    }
  }
  customElements.define('custom-select', CustomSelect);
}
/**
 *  @class
 *  @function LocalizationForm
 */
if (!customElements.get('localization-form')) {
  class LocalizationForm extends HTMLElement {
    constructor() {
      super();
      this.form = this.querySelector('form');
      this.inputs = this.form.querySelectorAll('input[name="locale_code"], input[name="country_code"]');
      this.debouncedOnSubmit = debounce((event) => {
        this.onSubmitHandler(event);
      }, 200);
      this.inputs.forEach(item => item.addEventListener('change', this.debouncedOnSubmit.bind(this)));
    }
    onSubmitHandler(event) {
      if (this.form) this.form.submit();
    }
  }
  customElements.define('localization-form', LocalizationForm);
}

/**
 *  @class
 *  @function SidePanelContentTabs
 */
if (!customElements.get('side-panel-content-tabs')) {
  class SidePanelContentTabs extends HTMLElement {
    constructor() {
      super();
      this.buttons = this.querySelectorAll('button');
      this.panels = this.parentElement.querySelectorAll('.side-panel-content--tab-panel');
    }
    connectedCallback() {
      this.setupButtonObservers();
    }
    disconnectedCallback() {

    }
    setupButtonObservers() {
      this.buttons.forEach((item, i) => {
        item.addEventListener('click', (e) => {
          this.toggleActiveClass(i);
        });
      });
    }
    toggleActiveClass(i) {
      this.buttons.forEach((button) => {
        button.classList.remove('tab-active');
      });
      this.buttons[i].classList.add('tab-active');

      this.panels.forEach((panel) => {
        panel.classList.remove('tab-active');
      });
      this.panels[i].classList.add('tab-active');
    }
  }

  customElements.define('side-panel-content-tabs', SidePanelContentTabs);
}

/**
 *  @class
 *  @function CollapsibleRow
 */
if (!customElements.get('collapsible-row')) {
  // https://css-tricks.com/how-to-animate-the-details-element/
  class CollapsibleRow extends HTMLElement {
    constructor() {
      super();

      this.details = this.querySelector('details');
      this.summary = this.querySelector('summary');
      this.content = this.querySelector('.collapsible__content');

      // Store the animation object (so we can cancel it if needed)
      this.animation = null;
      // Store if the element is closing
      this.isClosing = false;
      // Store if the element is expanding
      this.isExpanding = false;
    }
    connectedCallback() {
      this.setListeners();
    }
    setListeners() {
      this.querySelector('summary').addEventListener('click', (e) => this.onClick(e));
    }
    instantClose() {
      this.tl.timeScale(10).reverse();
    }
    animateClose() {
      this.tl.timeScale(3).reverse();
    }
    animateOpen() {
      this.tl.timeScale(1).play();
    }
    onClick(e) {
      // Stop default behaviour from the browser
      e.preventDefault();
      // Add an overflow on the <details> to avoid content overflowing
      this.details.style.overflow = 'hidden';
      // Check if the element is being closed or is already closed
      if (this.isClosing || !this.details.open) {
        this.open();
        // Check if the element is being openned or is already open
      } else if (this.isExpanding || this.details.open) {
        this.shrink();
      }
    }
    shrink() {
      // Set the element as "being closed"
      this.isClosing = true;

      // Store the current height of the element
      const startHeight = `${this.details.offsetHeight}px`;
      // Calculate the height of the summary
      const endHeight = `${this.summary.offsetHeight}px`;

      // If there is already an animation running
      if (this.animation) {
        // Cancel the current animation
        this.animation.cancel();
      }

      // Start a WAAPI animation
      this.animation = this.details.animate({
        // Set the keyframes from the startHeight to endHeight
        height: [startHeight, endHeight]
      }, {
        duration: 250,
        easing: 'ease'
      });

      // When the animation is complete, call onAnimationFinish()
      this.animation.onfinish = () => this.onAnimationFinish(false);
      // If the animation is cancelled, isClosing variable is set to false
      this.animation.oncancel = () => this.isClosing = false;
    }

    open() {
      // Apply a fixed height on the element
      this.details.style.height = `${this.details.offsetHeight}px`;
      // Force the [open] attribute on the details element
      this.details.open = true;
      // Wait for the next frame to call the expand function
      window.requestAnimationFrame(() => this.expand());
    }

    expand() {
      // Set the element as "being expanding"
      this.isExpanding = true;
      // Get the current fixed height of the element
      const startHeight = `${this.details.offsetHeight}px`;
      // Calculate the open height of the element (summary height + content height)
      const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

      // If there is already an animation running
      if (this.animation) {
        // Cancel the current animation
        this.animation.cancel();
      }

      // Start a WAAPI animation
      this.animation = this.details.animate({
        // Set the keyframes from the startHeight to endHeight
        height: [startHeight, endHeight]
      }, {
        duration: 400,
        easing: 'ease-out'
      });
      // When the animation is complete, call onAnimationFinish()
      this.animation.onfinish = () => this.onAnimationFinish(true);
      // If the animation is cancelled, isExpanding variable is set to false
      this.animation.oncancel = () => this.isExpanding = false;
    }

    onAnimationFinish(open) {
      // Set the open attribute based on the parameter
      this.details.open = open;
      // Clear the stored animation
      this.animation = null;
      // Reset isClosing & isExpanding
      this.isClosing = false;
      this.isExpanding = false;
      // Remove the overflow hidden and the fixed height
      this.details.style.height = this.details.style.overflow = '';
    }
  }
  customElements.define('collapsible-row', CollapsibleRow);
}

/**
 *  @class
 *  @function ProductRecommendations
 */
class ProductRecommendations extends HTMLElement {
  constructor() {
    super();

  }
  fetchProducts() {
    fetch(this.dataset.url)
      .then(response => response.text())
      .then(text => {
        const html = document.createElement('div');
        html.innerHTML = text;
        const recommendations = html.querySelector('product-recommendations');

        if (recommendations && recommendations.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
        }

        this.classList.add('product-recommendations--loaded');

      })
      .catch(e => {
        console.error(e);
      });
  }
  connectedCallback() {
    this.fetchProducts();
  }
}

customElements.define('product-recommendations', ProductRecommendations);

/**
 *  @class
 *  @function QuickView
 */
if (!customElements.get('quick-view')) {
  class QuickView extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.cc = document.querySelector('.click-capture--product');
      this.drawer = document.getElementById('Product-Drawer');
      this.body = document.body;

      this.addEventListener('click', this.setupEventListener.bind(this));
      this.cc.addEventListener('click', this.setupCCEventListener.bind(this));

    }
    setupCCEventListener(e) {
      this.body.classList.remove('open-cc--product');
      this.drawer.classList.remove('active');

      setTimeout(() => {
        this.drawer.querySelector('#Product-Drawer-Content').innerHTML = '';
      }, 260);

    }
    setupEventListener(e) {
      e.preventDefault();
      let productHandle = this.dataset.productHandle,
        href = `${theme.routes.root_url}/products/${productHandle}?view=quick-view`;

      // remove double `/` in case shop might have /en or language in URL
      href = href.replace('//', '/');
      if (!href || !productHandle) {
        return;
      }
      if (this.classList.contains('loading')) {
        return;
      }
      this.classList.add('loading');
      fetch(href, {
        method: 'GET'
      })
        .then((response) => {
          this.classList.remove('loading');
          return response.text();
        })
        .then(text => {
          const sectionInnerHTML = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('#Product-Drawer-Content').innerHTML;

          this.renderQuickview(sectionInnerHTML, href, productHandle);

        });
    }
    renderQuickview(sectionInnerHTML, href, productHandle) {
      if (sectionInnerHTML) {

        this.drawer.querySelector('#Product-Drawer-Content').innerHTML = sectionInnerHTML;

        let js_files = this.drawer.querySelector('#Product-Drawer-Content').querySelectorAll('script');

        if (js_files.length > 0) {
          var head = document.getElementsByTagName('head')[0];
          js_files.forEach((js_file, i) => {
            let script = document.createElement('script');
            script.src = js_file.src;
            head.appendChild(script);
          });
        }

        setTimeout(() => {
          if (Shopify && Shopify.PaymentButton) {
            Shopify.PaymentButton.init();
          }
          if (window.ProductModel) {
            window.ProductModel.loadShopifyXR();
          }
        }, 300);



        this.body.classList.add('open-cc--product');
        this.drawer.classList.add('active');

        this.drawer.querySelector('.side-panel-close').focus();

        setTimeout(() => {
          let slider = this.drawer.querySelector('#Product-Slider');

          slider.reInit();
          window.dispatchEvent(new Event('resize'));
        }, 100);

        dispatchCustomEvent('quick-view:open', {
          productUrl: href,
          productHandle: productHandle
        });
      }
    }
  }
  customElements.define('quick-view', QuickView);
}

if (!customElements.get("creator-information")) {
  class CreatorInformation extends HTMLElement {
    constructor() {
      super()
      this.customerId = this.getAttribute("data-customer-id")
      this.containers = {
        earning: this.querySelector('[data-total-earning]'),
        currentMonthEarning: this.querySelector('[data-current-month-earning]'),
        totalPayout: this.querySelector('[data-total-payout]'),
        tableBody: this.querySelector('.artist_dashboard_data')
      }
    }

    connectedCallback() {
      this.loadCustomerDetails()
    }

    loadCustomerDetails() {
      fetch(`${theme.routes.backend_url}/api/customer-creator/?customer_id=${this.customerId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      })
      .then(this.handleServerResponse)
      .then(response => JSON.parse(response))
      .then(this.render.bind(this))
      .catch(response => {
        let responseJson = JSON.parse(response)       
      })
      return false
    }

    formatCurrency = function (amount) {
      return formatMoney(amount * 100, window.theme.settings.money_with_currency_format)
    }

    render(data) {
      this.containers.earning.innerHTML = this.formatCurrency(data.response.commission_amount)
      this.containers.totalPayout.innerHTML = this.formatCurrency(data.response.total_payout)
      this.containers.currentMonthEarning.innerHTML = this.formatCurrency(data.response.commission_amount)
      this.containers.tableBody.innerHTML = 
        (data.response.products.length > 0  ?  
            data.response.products.map((product) => {
              return `<tr>
                <td data-label="Product Name">
                  <div class="creator-product-img-container">
                    <img src="${product.image}" />
                  </div>
                  <p>${product.title}</p>
                </td>
                <td data-label="Qty Sold">
                  ${product.quantity_sold}
                </td>
                <td data-label="Commission earned">
                  ${this.formatCurrency(product.commission)}
                </td>
              </tr>`
            }).join("")
          : '')
      }
      

    handleServerResponse(response) {
      return response.json()
      .then((json) => {
      // Modify response to include status ok, success, and status text
        let modifiedJson = {
          success: response.ok,
          status: response.status,
          statusText: response.statusText ? response.statusText : json.error || '',
          response: json
        }
        // If request failed, reject and return modified json string as error
        if (! modifiedJson.success) return Promise.reject(JSON.stringify(modifiedJson))
        // If successful, continue by returning modified json string
        return JSON.stringify(modifiedJson)
      })
    }
  }
  customElements.define('creator-information', CreatorInformation);
}

if (!customElements.get('editor-container')) {
  class EditorContainer extends HTMLElement {
    constructor() {
      super()
    }
  }

  customElements.define('editor-container', EditorContainer);
}

if (!customElements.get('creator-form')) {
    class CreatorForm extends HTMLElement {
        constructor() {
          super()
          this.formElement = this.querySelector("form")
          this.fileInput = this.querySelector("input[type='file']")
          this.fileInputContainer = this.querySelector(".file-to-upload")
          this.uploadedFileContainer = this.querySelector(".uploaded_files ul")
          this.thankYouMessage = this.querySelector("#creator_form")
          this.ctaLoader = this.querySelector(".creator_form_button")
          this.addMoreLinks = document.querySelector(".more_social_links");

          this.formElement.addEventListener("submit", this.handleSubmit.bind(this))
          this.fileInput.addEventListener("change", this.handleFileUpload.bind(this))
          this.addMoreLinks.addEventListener('click', this.handleSocialMediaLinks.bind(this))
          this.uploadedFiles = []
        }

        getMediaLinksForPayload(){
          let finalObject = {}
          let captureSocialMediaLinks = document.querySelectorAll("#getInputData");
          return Object.values(captureSocialMediaLinks).map((items) => items.value);
        }
        linkCloseButtons(){
          let closeButtonLinks = document.querySelectorAll("#close_button_mediaLinks");
          Object.values(closeButtonLinks).map(eachLinkItem => {
            eachLinkItem.addEventListener('click', (e) => {
              eachLinkItem.parentElement.remove();
            })
          })
        }

        
        isValidPhoneNo(phoneno) {    
          const phoneMatcher = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
          return phoneMatcher.test(phoneno);
        }

        checkValidateFields(){          
          const creatorFirstName = document.querySelector('#creator_firstname');
          const creatorLastName = document.querySelector('#creator_lastname');
          const creatorEmail = document.querySelector('#creator_email');
          const creatorPhone = document.querySelector('#creator_phone');         
          const phoneError = document.querySelector('.phone-error-msg');
                              
          if(creatorPhone.value) {
            if(!this.isValidPhoneNo(creatorPhone.value)) {
              phoneError.textContent = "Enter a valid Phone number.";
              phoneError.style.color = "red";
              phoneError.style.fontSize = "13px";
            } 
          }

          if(creatorFirstName.value && creatorLastName.value && creatorEmail.value && creatorPhone.value) {
            if(!this.isValidPhoneNo(creatorPhone.value)) {
              phoneError.style.display='block';
              phoneError.textContent = "Enter a valid Phone number.";
              phoneError.style.color = "red";
              phoneError.style.fontSize = "13px";
              setTimeout(() => {
                phoneError.style.marginBottom = '20px';
                phoneError.style.display = 'none';
              }, 4500);
            } else {
              phoneError.style.display='none';
              phoneError.style.marginBottom = '20px';
              // creatorSubmitBtn.removeAttribute('disabled');
            }
          }

        }
        handleSubmit(evt) {
          
          const creatorPhone = document.querySelector('#creator_phone');   
          this.checkValidateFields()

          // Show Loader
          const initialCTAContent = this.ctaLoader.innerHTML
          this.ctaLoader.innerHTML = `<div class="file_loader"></div>`
          evt.preventDefault()
          const formData = new FormData(evt.target)
          for (let [key, value] of formData.entries())
          {
            if (key == 'brand_name' && value === '') formData.delete(key);
            if (key == 'portfolio_url' && value === '') formData.delete(key);
          }
          const payload = Object.fromEntries(formData)
          payload.attachments = this.uploadedFiles
          payload.social_media_links = this.getMediaLinksForPayload().filter(item => item !== '');
          payload.store = 4          
          if(creatorPhone.value && !this.isValidPhoneNo(creatorPhone.value)){
            fetch(`${theme.routes.backend_url}/api/creators/?shop=${Shopify.shop}`, {
              method: 'POST',
              body: JSON.stringify(payload),
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            })
            .then(this.handleServerResponse)
            .then(response => JSON.parse(response))
            .then(responseJson => {
              document.querySelector('.register-form-heading-text').style.display = 'none';
              this.thankYouMessage.innerHTML = `
              <h3> Thank you for Account Request </h3>
              <p>Your account request is being reviewed and it might take 60 secs - 15 mins for the process to complete. You will recieve an email once the review process is completed.</p>
              <a href="${window.location.origin}" class="button full creator_form_button"><span>Back to homepage</span></a>`
            })
            .catch(response => {
              let responseJson = JSON.parse(response)
              if (responseJson.response.email) {
                // Show Email error message
                document.querySelector('#creator_email').style.marginBottom = '0';
                document.querySelector('.email_id_error').style.display = 'block';
                document.querySelector('.email_id_error').innerHTML = responseJson.response.email;  
                setTimeout(() => {
                  document.querySelector('#creator_email').style.marginBottom = '20px';
                  document.querySelector('.email_id_error').style.display = 'none';
                }, 4500);
                this.ctaLoader.innerHTML = initialCTAContent
              }
              if (responseJson.response.phone_no || responseJson.response.phone) {
                // Show Phone error message
                document.querySelector('#creator_phone').style.marginBottom = '0';
                document.querySelector('.phone_no_error').style.display = 'block';
                document.querySelector('.phone_no_error').innerHTML = responseJson.response.phone_no != undefined ? responseJson.response.phone_no : responseJson.response.phone;
                setTimeout(() => {
                  document.querySelector('#creator_phone').style.marginBottom = '20px';
                  document.querySelector('.phone_no_error').style.display = 'none';
                }, 4500);
                this.ctaLoader.innerHTML = initialCTAContent
              }
            })
          }
          return false
        }

        handleSocialMediaLinks(){
          // let addLinkButton = document.querySelector("#more_social_links");
          let newHTMLElement = `
            <input type="text" name="social_media_1" class="full more_social_field" id="getInputData" value="" placeholder="Social media link" spellcheck="false" data-ms-editor="true">
            <label for="social_media_1">Social media link</label>
            <span class="close_button_mediaLinks" id="close_button_mediaLinks">
              <svg viewPort="0 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
                <line x1="1" y1="11" x2="11" y2="1" stroke="black" stroke-width="2"/>
                <line x1="1" y1="1" x2="11" y2="11" stroke="black" stroke-width="2"/>
              </svg>
            </span>
          `;

          let newElement = document.createElement('div');
          newElement.innerHTML += newHTMLElement;
          newElement.classList.add("field", "field__class");
          newElement.id = "social_media_main";

          let socialLinkContainer = document.querySelector('#social__link__container');
          
          socialLinkContainer.appendChild(newElement);
          this.linkCloseButtons();
        }
        async handleFileUpload(evt) {
          // Show Loader
          let hasError = false;          
          const { files } = evt.target
          for (let i = 0; i <= files.length - 1; i++) {
            const fsize = files[i].size;
            const file = Math.round((fsize / 1024));
            // The size of the file.
            if (file >= 4096) {
              hasError = true;
            }
          }
          if (hasError ){
            alert("Please select a file less than 4MB.")
            return false;
          }
          this.uploadedFileContainer.innerHTML = `<div class="file_loader"></div>`
          const uploadFiles = Array.from(files).map(async (file) => await this.uploadFile(file))
          const fileResponse = await Promise.all(uploadFiles)
          this.uploadedFiles = this.uploadedFiles.concat(fileResponse)
          this.renderFiles()
          // Hide Loader
        }

        async uploadFile(file) {
          const formData = new FormData();
          formData.append("file", file)
          let response = await fetch(`${theme.routes.backend_url}/api/media-upload/`, {
            method: 'POST',
            body: formData
          })
          response = await response.json()
          return response
        }

        handleServerResponse(response) {
          return response.json()
            .then((json) => {
            // Modify response to include status ok, success, and status text
            let modifiedJson = {
              success: response.ok,
              status: response.status,
              statusText: response.statusText ? response.statusText : json.error || '',
              response: json
            }
            // If request failed, reject and return modified json string as error
            if (! modifiedJson.success) return Promise.reject(JSON.stringify(modifiedJson))
            // If successful, continue by returning modified json string
            return JSON.stringify(modifiedJson)
          })
        }

        renderFiles() {
          if(this.uploadedFiles.length > 0){                        
            this.fileInputContainer.classList.add('has_files')
            this.uploadedFileContainer.innerHTML = this.uploadedFiles.map((file,index) => `<li>
              <div class="file_name">${file.name}</div>
              <div data-upload-remove data-index=${index}>
              <svg viewPort="0 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
                <line x1="1" y1="11" x2="11" y2="1" stroke="black" stroke-width="2"/>
                <line x1="1" y1="1" x2="11" y2="11" stroke="black" stroke-width="2"/>
              </svg></div>
            </li>`).join("")
          } else {
            this.fileInputContainer.classList.remove('has_files')
            this.uploadedFileContainer.innerHTML = ''
            this.uploadedFiles = []
          }
          this.handleFileRemove();
        }

        handleFileRemove() {
          const uploadedFiles = document.querySelectorAll('[data-upload-remove]')
          if(uploadedFiles) {
            uploadedFiles.forEach(item => item.addEventListener('click', () => {              
              const selectedIndex = item.dataset.index;
              const newUploadedFiles = this.uploadedFiles.filter((item, index) => {if(index != selectedIndex){return item}});
              this.uploadedFiles = newUploadedFiles;
              this.renderFiles();
            }))
          }
        }
    }
    customElements.define('creator-form', CreatorForm);
}


/**
 *  @class
 *  @function AnimatedMarkers
 */
class AnimatedMarkers {

  constructor() {
    this.markers = document.querySelectorAll('.svg-marker path');
    this.animations_enabled = document.body.classList.contains('animations-true') && typeof gsap !== 'undefined';

    if (this.animations_enabled && this.markers.length) {
      this.setupEventListeners();
    }
  }
  setupEventListeners() {
    this.markers.forEach((marker, i) => {
      gsap.from(marker, {
        duration: 1,
        ease: 'power4.inOut',
        drawSVG: "0%",
        scrollTrigger: {
          trigger: marker,
          start: 'top 70%',
          end: 'bottom 80%'
        }
      });
    });
  }
}

class ProductLikes extends HTMLElement {
  constructor() {
    super();
    this.customerId = this.getAttribute("data-customer-id")
    this.productId = this.getAttribute("data-product-id")
    this.loginUrl = this.getAttribute("data-login-url")
    this.getLikes();
  }

  handleClick = function(event) {
    if (!this.customerId) {
      window.location.href = this.loginUrl
      return false
    }
    this.updateLikes()
  }

  getLikes = async () => {
    fetch(`${theme.routes.backend_url}/api/product-likes/?shop=${Shopify.shop}&product_id=${this.productId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    })
    .then(this.handleServerResponse)
    .then(response => JSON.parse(response))
    .then((response) => {
      this.likeCount = response.response.likes
      this.renderBaseTemplate()
    })
    .catch(response => {
      let responseJson = JSON.parse(response)       
    })
    return 0
  }

  handleServerResponse(response) {
    return response.json()
    .then((json) => {
    // Modify response to include status ok, success, and status text
      let modifiedJson = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText ? response.statusText : json.error || '',
        response: json
      }
      // If request failed, reject and return modified json string as error
      if (! modifiedJson.success) return Promise.reject(JSON.stringify(modifiedJson))
      // If successful, continue by returning modified json string
      return JSON.stringify(modifiedJson)
    })
  }

  updateLikes() {
    fetch(`${theme.routes.backend_url}/api/update-product-likes/?shop=${Shopify.shop}`, {
      method: 'POST',
      body: JSON.stringify({
        customer_id: this.customerId,
        product_id: this.productId,
        shop: Shopify.shop
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    })
    .then(this.handleServerResponse)
    .then(response => JSON.parse(response))
    .then(responseJson => {
      this.likeCount = responseJson.response.likes
      this.likeContainer.innerHTML = this.likeCount
    })
  }

  renderBaseTemplate() {        
    this.innerHTML = `
      <style> 
        .product_like_count{
          position: absolute;
          bottom: 0;
          right: 0;
          transform: translate(-50%, -50%);
          border-radius: 60px;
          background: #FFF;              
        }
        #like__btn {
          display: inline-flex;
          padding: 7px var(--2, 16px);
          align-items: center;
          gap: var(--1, 8px);
          background: transparent;
          border: 0;
          cursor: pointer;
        }           
      </style>
      <div class="product_like_count">
        <button class="like__btn" id="like__btn">
          <span id="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 7.69431C10 2.99988 3 3.49988 3 9.49991C3 15.4999 12 20.5001 12 20.5001C12 20.5001 21 15.4999 21 9.49991C21 3.49988 14 2.99988 12 7.69431Z" fill="#D5BFF1" stroke="#4444E1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span id="like-count-element">${this.likeCount}</span>
        </button>
      </div>
    `;
    this.likeContainer = this.querySelector("#like-count-element")
    this.likeBtn = this.querySelector("#like__btn")
    this.likeBtn.addEventListener("click", this.handleClick.bind(this))
  }
}    
customElements.define('product-likes', ProductLikes);

const creatorTracker = function () {
  const url = new URL(window.location.href)
  let data = JSON.parse(sessionStorage.getItem("creatorTracker") || "{}")
  if (!data.pathname && url.searchParams.has("creator_id")) {
    data = sessionStorage.setItem("creatorTracker", JSON.stringify({pathname: url.pathname, creatorId: url.searchParams.get("creator_id")}))
  } else if (data.pathname != url.pathname) {
    data = sessionStorage.removeItem("creatorTracker")
  }
  const redirect_uri = url.searchParams.get("redirect_uri")
  if (redirect_uri) {
    const redirectUriField = document.querySelector("#return_to_navigator")
    if (redirectUriField) {
      redirectUriField.value = redirect_uri
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  creatorTracker()

  if (typeof CartDrawer !== 'undefined') {
    new CartDrawer();
  }
  if (typeof AnimatedMarkers !== 'undefined') {
    new AnimatedMarkers();
  }
  if (typeof FooterMenuToggle !== 'undefined') {
    new FooterMenuToggle();
  }

  updateList = function() {
    var input = document.getElementById('file-input');
    var output = document.querySelector('.uploaded_files');
    var children = "";
    if(input.files.length > 1){
      document.querySelector('.file-to-upload').classList.add('has_files')
    }
    for (var i = 0; i < input.files.length; ++i) {
        children += '<li>' + input.files.item(i).name + '</li>';
    }
    output.innerHTML = '<ul>'+children+'</ul>';
  }
  
  const tablinks = document.querySelectorAll('.tab');
  
    function showTabContent(formId){
      document.querySelectorAll('.thb-register-form form').forEach(elem => elem.classList.remove('showForm'))
      document.querySelector(`.${formId}`).classList.add('showForm')
    }
    tablinks.forEach(tab => {
      tab.addEventListener('click', () => {
        tablinks.forEach(tabItem => {
          tabItem.classList.remove('active');
        })
        tab.classList.add('active');
        showTabContent(tab.getAttribute('data-form-tab'))
      })
    })
    const accountTablinks = document.querySelectorAll('.dashboard_tabs');
    function showAccountTabContent(formId){
      document.querySelectorAll('.dashboard_tabs_content').forEach(elem => elem.classList.remove('showTab'))
      document.querySelector(`.${formId}`).classList.add('showTab')
    }

    accountTablinks.forEach(tab => {
      tab.addEventListener('click', () => {
        accountTablinks.forEach(tabItem => {
          tabItem.classList.remove('active');
        })
        tab.classList.add('active');
        showAccountTabContent(tab.getAttribute('data-tab'))
      })
    })

    const dropdownBtnSort = document.getElementById("dropdownBtnSort")
    if (dropdownBtnSort) {
      dropdownBtnSort.addEventListener('click', () => {
        showArtistDashboardSortDropDown()
      })
    }

    function showArtistDashboardSortDropDown(){
      const dropDownOptions = document.getElementById('dropdownSortOptions');
      dropDownOptions.classList.toggle('activeFilter');
      const sortOptions = document.querySelectorAll('#dropdownSortOptions .sortOption')
      sortOptions.forEach(sortOption => {
        sortOption.addEventListener('click', () => {
          sortOptions.forEach(elem => elem.removeAttribute('selected'));
          dropDownOptions.classList.remove('activeFilter');          
          sortOption.setAttribute('selected', '');
        })
      })
    } 
    
});