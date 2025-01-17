if (!customElements.get('variant-selects')) {

  /**
   *  @class
   *  @function VariantSelects
   */
  class VariantSelects extends HTMLElement {
    constructor() {
      super();
      this.sticky = this.dataset.sticky;
      this.updateUrl = this.dataset.updateUrl === 'true';
      this.isDisabledFeature = this.dataset.isDisabled;
      this.addEventListener('change', this.onVariantChange);
      this.other = Array.from(document.querySelectorAll('variant-selects')).filter((selector) => {
        return selector != this;
      });

      this.productWrapper = this.closest('.thb-product-detail');
      this.productSlider = this.productWrapper.querySelector('.product-images');
      this.hideVariants = this.dataset.hideVariants === 'true';
      this.productFormId = this.getAttribute("data-product-form-id")
      if (this.querySelector("[data-variant-fittings]")) {
        this.variantFittingOptions = JSON.parse(this.querySelector("[data-variant-fittings]").innerHTML)
      } else {
        this.variantFittingOptions = {}
      }
    }

    handleFormToggle = () => {
      const select = document.querySelectorAll('select');
      document.addEventListener('form-disabled', () => {
        select.forEach((item) => {
          item.disabled = true;
        })
      })

      document.addEventListener('form-enabled', () => {
        select.forEach((item) => {
          item.disabled = false;
        })
      })
    }

    connectedCallback() {
      this.updateOptions();
      this.updateMasterId();
      this.setDisabled();
      this.setImageSet();
      this.handleOrientationDisplay()
      this.handleFittings()
      this.handleFormToggle()
    }

    onVariantChange() {
      this.updateOptions();
      this.updateMasterId();
      this.toggleAddButton(true, '', false);
      this.updatePickupAvailability();
      this.removeErrorMessage();
      this.updateVariantText();
      this.setDisabled();

      if (!this.currentVariant) {
        this.toggleAddButton(true, '', true);
        this.setUnavailable();
      } else {
        this.updateMedia();
        if (this.updateUrl) {
          this.updateURL();
        }
        this.updateVariantInput();
        this.renderProductInfo();
        //this.updateShareUrl();
      }

      this.updateOther();
      dispatchCustomEvent('product:variant-change', {
        variant: this.currentVariant,
        sectionId: this.dataset.section
      });
    }

    updateOptions() {
      this.fieldsets = Array.from(this.querySelectorAll('fieldset'));
      this.options = [];
      this.fieldsets.forEach((fieldset, i) => {
        if (fieldset.querySelector('select')) {
          this.options.push(fieldset.querySelector('select').value);
        } else if (fieldset.querySelectorAll('input').length) {
          this.options.push(fieldset.querySelector('input:checked').value);
        }
      });
    }
    updateVariantText() {
      const fieldsets = Array.from(this.querySelectorAll('fieldset'));
      fieldsets.forEach((item, i) => {
        let label = item.querySelector('.form__label__value');
        if (label) {
          label.innerHTML = this.options[i];
        }
      });
    }
    updateMasterId() {
      this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options.map((option, index) => {
          return this.options[index] === option;
        }).includes(false);
      });
    }

    updateOther() {
      if (this.dataset.updateUrl === 'false') {
        return;
      }
      if (this.other.length) {
        let fieldsets = this.other[0].querySelectorAll('fieldset'),
          fieldsets_array = Array.from(fieldsets);
        this.options.forEach((option, i) => {
          if (fieldsets_array[i].querySelector('select')) {
            fieldsets_array[i].querySelector(`select`).value = option;
          } else if (fieldsets_array[i].querySelectorAll('input').length) {
            fieldsets_array[i].querySelector(`input[value='${option}']`).checked = true;
          }
        });
        this.other[0].updateOptions();
        this.other[0].updateMasterId();
        this.other[0].updateVariantText();
        this.other[0].setDisabled();
      }
      this.handleOrientationDisplay()
      this.handleFittings()
    }

    handleOrientationDisplay() {
      const customProperties = document.querySelector(`[data-custom-option-identifier="${this.productFormId}--Orientation"]`)
      if (!customProperties) {
        return
      }
      const isRectangle = this.options.find((option) => {
        return option.toLowerCase() == "rectangle"
      })
      if (isRectangle) {
        customProperties.querySelectorAll("input").forEach((input) => {
          input.removeAttribute("disabled")
        })
        customProperties.style.display = ''
      } else {
        customProperties.style.display = 'none'
        customProperties.querySelectorAll("input").forEach((input) => {
          input.setAttribute("disabled", "disabled")
        })
      }
    }

    handleFittings() {
      const customProperties = document.querySelector(`[data-custom-option-identifier="${this.productFormId}--Fittings"]`)
      if (!customProperties ) {
        return
      }
      const availableOptions = this.variantFittingOptions[this.currentVariant.id]

      if (availableOptions.length > 0) {
        customProperties.querySelectorAll("input").forEach((input) => {
          input.labels[0].style.display = 'none'
        })
        availableOptions.forEach((option, index) => {
          const field = customProperties.querySelector(`input[value="${option}"]`)
          if (index == 0) {
            field.click()
          }
          field.labels[0].style.display = ''
        })
      } else {
        customProperties.querySelectorAll("input").forEach((input) => {
          input.labels[0].style.display = ''
        })
      }

      customProperties.querySelector('input[value="Plastic hook"]')
    }

    updateMedia() {
      if (!this.currentVariant) return;
      if (!this.currentVariant.featured_media) return;

      let productSlider = document.querySelector('.thb-product-detail .product-images'),
        thumbnails = document.querySelector('.thb-product-detail #Product-Thumbnails');

      this.setActiveMedia(`#Slide-${this.dataset.section}-${this.currentVariant.featured_media.id}`, `#Thumb-${this.dataset.section}-${this.currentVariant.featured_media.id}`, productSlider, thumbnails);
    }
    setActiveMedia(mediaId, thumbId, productSlider, thumbnails) {
      let flkty = Flickity.data(productSlider),
        activeMedia = productSlider.querySelector(mediaId);

      if (flkty && this.hideVariants) {
        if (productSlider.querySelector('.product-images__slide.is-initial-selected')) {
          productSlider.querySelector('.product-images__slide.is-initial-selected').classList.remove('is-initial-selected');
        }
        [].forEach.call(productSlider.querySelectorAll('.product-images__slide-item--variant'), function (el) {
          el.classList.remove('is-active');
        });

        activeMedia.classList.add('is-active');
        activeMedia.classList.add('is-initial-selected');

        this.setImageSetMedia();

        if (thumbnails) {
          let activeThumb = thumbnails.querySelector(thumbId);

          if (thumbnails.querySelector('.product-thumbnail.is-initial-selected')) {
            thumbnails.querySelector('.product-thumbnail.is-initial-selected').classList.remove('is-initial-selected');
          }
          [].forEach.call(thumbnails.querySelectorAll('.product-images__slide-item--variant'), function (el) {
            el.classList.remove('is-active');
          });

          activeThumb.classList.add('is-active');
          activeThumb.classList.add('is-initial-selected');
        }

        productSlider.reInit(this.imageSetIndex);
        productSlider.selectCell(mediaId);

      } else if (flkty) {
        productSlider.selectCell(mediaId);
      }

    }

    updateURL() {
      if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
      window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
    }

    updateShareUrl() {
      const shareButton = document.getElementById(`Share-${this.dataset.section}`);
      if (!shareButton) return;
      shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
    }

    updateVariantInput() {
      const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
      productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      });
    }

    updatePickupAvailability() {
      const pickUpAvailability = document.querySelector('.pickup-availability-wrapper');

      if (!pickUpAvailability) return;

      if (this.currentVariant && this.currentVariant.available) {
        pickUpAvailability.fetchAvailability(this.currentVariant.id);
      } else {
        pickUpAvailability.removeAttribute('available');
        pickUpAvailability.innerHTML = '';
      }
    }

    removeErrorMessage() {
      const section = this.closest('section');
      if (!section) return;

      const productForm = section.querySelector('product-form');
      if (productForm) productForm.handleErrorMessage();
    }

    getSectionsToRender() {
      return [`price-${this.dataset.section}`, `price-${this.dataset.section}--sticky`, `product-image-${this.dataset.section}--sticky`, `inventory-${this.dataset.section}`, `sku-${this.dataset.section}`, `quantity-${this.dataset.section}`];
    }

    renderProductInfo() {
      let sections = this.getSectionsToRender();

      fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');

          sections.forEach((id) => {
            const destination = document.getElementById(id);
            const source = html.getElementById(id);

            if (source && destination) destination.innerHTML = source.innerHTML;

            const price = document.getElementById(id);
            const price_fixed = document.getElementById(id + '--sticky');

            if (price) price.classList.remove('visibility-hidden');
            if (price_fixed) price_fixed.classList.remove('visibility-hidden');

          });
          this.toggleAddButton(!this.currentVariant.available, window.theme.variantStrings.soldOut);

        });
    }

    toggleAddButton(disable = true, text = false, modifyClass = true) {
      const productForm = document.getElementById(`product-form-${this.dataset.section}`);
      if (!productForm) return;

      const submitButtons = document.querySelectorAll('.single-add-to-cart-button');

      if (!submitButtons) return;

      submitButtons.forEach((submitButton) => {
        const submitButtonText = submitButton.querySelector('.single-add-to-cart-button--text');

        if (!submitButtonText) return;

        if (disable) {
          document.dispatchEvent(new Event('form-disabled'));
          submitButton.setAttribute('disabled', 'disabled');
          if (text) submitButtonText.textContent = text;
        } else {
          document.dispatchEvent(new Event('form-enabled'));
          submitButton.removeAttribute('disabled');
          submitButton.classList.remove('loading');
          submitButtonText.textContent = window.theme.variantStrings.addToCart;
        }
      });

      if (!modifyClass) return;
    }

    setUnavailable() {
      const submitButtons = document.querySelectorAll('.single-add-to-cart-button');
      const price = document.getElementById(`price-${this.dataset.section}`);
      const price_fixed = document.getElementById(`price-${this.dataset.section}--sticky`);

      submitButtons.forEach((submitButton) => {
        const submitButtonText = submitButton.querySelector('.single-add-to-cart-button--text');
        if (!submitButton) return;
        submitButtonText.textContent = window.theme.variantStrings.unavailable;
        submitButton.classList.add('sold-out');
      });
      if (price) price.classList.add('visibility-hidden');
      if (price_fixed) price_fixed.classList.add('visibility-hidden');
    }

    setDisabled() {
      if (this.isDisabledFeature != 'true') {
        return;
      }
      const variant_data = this.getVariantData();


      if (variant_data) {
        // const selected_options = this.currentVariant.options.map((value, index) => {
        const _this7 = this;
        const selected_options = this.options.map((value, index) => {
          return {
            value,
            index: `option${index + 1}`
          };
        });
        const available_options = this.createAvailableOptionsTree(variant_data, selected_options);


        this.fieldsets.forEach((fieldset, i) => {
          const fieldset_options = Object.values(available_options)[i];

          if (fieldset_options) {
            if (fieldset.querySelector('select')) {
              const selectField = fieldset.querySelector('select')
              fieldset_options.forEach((option, option_i) => {
                const optionElement = fieldset.querySelector('option[value=' + JSON.stringify(option.value) + ']')
                if (option.isUnavailable) {
                  optionElement.disabled = true;
                  optionElement.style.display = "none"
                } else {
                  optionElement.disabled = false;
                  optionElement.style.display = ""
                }
              });
              if (selectField.querySelector("option:not(:disabled)") && selectField.options[selectField.options.selectedIndex].disabled) {
                selectField.value = selectField.querySelector("option:not(:disabled)").value
                setTimeout(() => _this7.onVariantChange(), 100)
              }
            } else if (fieldset.querySelectorAll('input').length) {
              fieldset.querySelectorAll('input').forEach((input, input_i) => {
                input.classList.toggle('is-disabled', fieldset_options[input_i].isUnavailable);
              });
            }
          }
        });
      }
      return true;
    }

    getImageSetName(variant_name) {
      return variant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');
    }

    setImageSet() {
      if (!this.productSlider) return;

      let dataSetEl = this.productSlider.querySelector('[data-set-name]');
      if (dataSetEl) {
        this.imageSetName = dataSetEl.dataset.setName;
        this.imageSetIndex = this.querySelector('.product-form__input[data-handle="' + this.imageSetName + '"]').dataset.index;
        this.dataset.imageSetIndex = this.imageSetIndex;
        this.setImageSetMedia();
      }
    }
    setImageSetMedia() {
      if (!this.imageSetIndex) {
        return;
      }

      let setValue = this.getImageSetName(this.currentVariant[this.imageSetIndex]);
      let group = this.imageSetName + '_' + setValue;
      let selected_set_images = this.productWrapper.querySelectorAll(`.product-images__slide[data-set-name="${this.imageSetName}"]`),
        selected_set_thumbs = this.productWrapper.querySelectorAll(`.product-thumbnail[data-set-name="${this.imageSetName}"]`);

      if (this.hideVariants) {
        // Product images
        this.productWrapper.querySelectorAll('.product-images__slide').forEach(thumb => {
          if (thumb.dataset.group && thumb.dataset.group !== group) {
            thumb.classList.remove('is-active');
          }
        });
        selected_set_images.forEach(thumb => {
          thumb.classList.toggle('is-active', thumb.dataset.group === group);
        });

        // Product thumbnails
        this.productWrapper.querySelectorAll('.product-thumbnail').forEach(thumb => {
          if (thumb.dataset.group && thumb.dataset.group !== group) {
            thumb.classList.remove('is-active');
          }
        });
        selected_set_thumbs.forEach(thumb => {
          thumb.classList.toggle('is-active', thumb.dataset.group === group);
        });
      }

    }

    createAvailableOptionsTree(variant_data, selected_options) {
      // Reduce variant array into option availability tree
      return variant_data.reduce((options, variant) => {

        // Check each option group (e.g. option1, option2, option3) of the variant
        Object.keys(options).forEach(index => {

          if (variant[index] === null) return;

          let entry = options[index].find(option => option.value === variant[index]);

          if (typeof entry === 'undefined') {
            // If option has yet to be added to the options tree, add it
            entry = {
              value: variant[index],
              isUnavailable: true
            };
            options[index].push(entry);
          }

          // Check how many selected option values match a variant
          const countVariantOptionsThatMatchCurrent = selected_options.reduce((count, {
            value,
            index
          }) => {
            return variant[index] === value ? count + 1 : count;
          }, 0);

          // Only enable an option if an available variant matches all but one current selected value
          if (countVariantOptionsThatMatchCurrent >= selected_options.length - 1) {
            entry.isUnavailable = entry.isUnavailable && variant.available ? false : entry.isUnavailable;
          }

          // Make sure if a variant is unavailable, disable currently selected option
          if ((!this.currentVariant || !this.currentVariant.available) && selected_options.find((option) => option.value === entry.value && index === option.index)) {
            entry.isUnavailable = true;
          }

          // First option is always enabled
          if (index === 'option1') {
            entry.isUnavailable = entry.isUnavailable && variant.available ? false : entry.isUnavailable;
          }
        });

        return options;
      }, {
        option1: [],
        option2: [],
        option3: []
      });
    }

    getVariantData() {
      this.variantData = this.variantData || JSON.parse(this.querySelector('[data--product-variant-json-script]').textContent);
      return this.variantData;
    }
  }
  customElements.define('variant-selects', VariantSelects);

  /**
   *  @class
   *  @function VariantRadios
   */
  class VariantRadios extends VariantSelects {
    constructor() {
      super();
    }

    updateOptions() {
      const fieldsets = Array.from(this.querySelectorAll('fieldset'));
      this.options = fieldsets.map((fieldset) => {
        return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
      });
    }
  }

  customElements.define('variant-radios', VariantRadios);
}

if (!customElements.get('product-slider')) {
  /**
   *  @class
   *  @function ProductSlider
   */
  class ProductSlider extends HTMLElement {
    constructor() {
      super();

      this.addEventListener('change', this.setupProductGallery);
    }
    connectedCallback() {
      this.product_container = this.closest('.thb-product-detail');
      this.thumbnail_container = this.product_container.querySelector('.product-thumbnail-container');
      this.video_containers = this.querySelectorAll('.product-single__media-external-video--play');

      this.setOptions();
      // Start Slider
      this.init();
    }
    setOptions() {
      this.hide_variants = this.dataset.hideVariants == 'true';
      this.thumbnails = this.thumbnail_container.querySelectorAll('.product-thumbnail');
      this.prev_button = this.querySelector('.flickity-prev');
      this.next_button = this.querySelector('.flickity-next');
      this.options = {
        wrapAround: true,
        pageDots: true,
        contain: true,
        adaptiveHeight: true,
        initialIndex: '.is-initial-selected',
        prevNextButtons: false,
        fade: false,
        cellSelector: '.product-images__slide.is-active'
      };
    }
    init() {
      this.flkty = new Flickity(this, this.options);

      this.selectedIndex = this.flkty.selectedIndex;

      // Setup Events
      this.setupEvents();

      // Start Gallery
      this.setupProductGallery();
    }
    reInit(imageSetIndex) {

      this.flkty.destroy();

      this.setOptions();

      this.flkty = new Flickity(this, this.options);

      // Setup Events
      this.setupEvents();

      this.selectedIndex = this.flkty.selectedIndex;
    }
    setupEvents() {
      const _this = this;
      if (this.prev_button) {
        let prev = this.prev_button.cloneNode(true);
        this.prev_button.parentNode.append(prev);
        this.prev_button.remove();
        prev.addEventListener('click', (event) => {
          this.flkty.previous();
        });
        prev.addEventListener('keyup', (event) => {
          this.flkty.previous();
          event.preventDefault();
        });
      }
      if (this.next_button) {
        let next = this.next_button.cloneNode(true);
        this.next_button.parentNode.append(next);
        this.next_button.remove();
        next.addEventListener('click', (event) => {
          this.flkty.next();
        });
        next.addEventListener('keyup', (event) => {
          this.flkty.next();
          event.preventDefault();
        });
      }
      this.video_containers.forEach((container) => {
        container.querySelector('button').addEventListener('click', function () {
          container.setAttribute('hidden', '');
        });
      });
      this.flkty.on('settle', function (index) {
        _this.selectedIndex = index;
      });
      this.flkty.on('change', (index) => {

        let previous_slide = this.flkty.cells[_this.selectedIndex].element,
          previous_media = previous_slide.querySelector('.product-single__media'),
          active_thumbs = Array.from(this.thumbnails).filter(element => element.classList.contains('is-active')),
          active_thumb = active_thumbs[index] ? active_thumbs[index] : active_thumbs[0];

        this.thumbnails.forEach((item, i) => {
          item.classList.remove('is-initial-selected');
        });
        active_thumb.classList.add('is-initial-selected');

        requestAnimationFrame(() => {
          if (active_thumb.offsetParent === null) {
            return;
          }
          const windowHalfHeight = active_thumb.offsetParent.clientHeight / 2,
            windowHalfWidth = active_thumb.offsetParent.clientWidth / 2;
          active_thumb.parentElement.scrollTo({
            left: active_thumb.offsetLeft - windowHalfWidth + active_thumb.clientWidth / 2,
            top: active_thumb.offsetTop - windowHalfHeight + active_thumb.clientHeight / 2,
            behavior: 'smooth'
          });
        });

        // Stop previous video
        if (previous_media.classList.contains('product-single__media-external-video')) {
          if (previous_media.dataset.provider === 'youtube') {
            previous_media.querySelector('iframe').contentWindow.postMessage(JSON.stringify({
              event: "command",
              func: "pauseVideo",
              args: ""
            }), "*");
          } else if (previous_media.dataset.provider === 'vimeo') {
            previous_media.querySelector('iframe').contentWindow.postMessage(JSON.stringify({
              method: "pause"
            }), "*");
          }
          previous_media.querySelector('.product-single__media-external-video--play').removeAttribute('hidden');
        } else if (previous_media.classList.contains('product-single__media-native-video')) {
          previous_media.querySelector('video').pause();
        }

      });


      setTimeout(() => {
        let active_thumbs = Array.from(this.thumbnails).filter(element => element.clientWidth > 0);
        active_thumbs.forEach((thumbnail, index) => {
          thumbnail.addEventListener('click', () => {
            this.thumbnailClick(thumbnail, index);
          });
        });
      });

    }
    thumbnailClick(thumbnail, index) {
      [].forEach.call(this.thumbnails, function (el) {
        el.classList.remove('is-initial-selected');
      });
      thumbnail.classList.add('is-initial-selected');
      this.flkty.select(index);
    }
    setDraggable(draggable) {
      this.flkty.options.draggable = draggable;
      this.flkty.updateDraggable();
    }
    selectCell(mediaId) {
      this.flkty.selectCell(mediaId);
    }
    setupProductGallery() {
      if (!this.querySelectorAll('.product-single__media-zoom').length) {
        return;
      }
      this.setEventListeners();
    }
    buildItems() {
      this.activeImages = Array.from(this.querySelectorAll('.product-images__slide.is-active .product-single__media-image'));

      return this.activeImages.map((item) => {
        let index = [].indexOf.call(item.parentNode.parentNode.children, item.parentNode);

        let activelink = item.querySelector('.product-single__media-zoom');

        activelink.dataset.index = index;
        return {
          src: activelink.getAttribute('href'),
          msrc: activelink.dataset.msrc,
          w: activelink.dataset.w,
          h: activelink.dataset.h
        };
      });
    }
    setEventListeners() {
      this.links = this.querySelectorAll('.product-single__media-zoom');
      this.pswpElement = document.querySelectorAll('.pswp')[0];
      this.pswpOptions = {
        maxSpreadZoom: 2,
        loop: false,
        allowPanToNext: false,
        closeOnScroll: false,
        showHideOpacity: false,
        arrowKeys: true,
        history: false,
        captionEl: false,
        fullscreenEl: false,
        zoomEl: false,
        shareEl: false,
        counterEl: true,
        arrowEl: true,
        preloaderEl: true,
        getThumbBoundsFn: () => {
          const thumbnail = this.querySelector('.product-images__slide.is-selected'),
            pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
            rect = thumbnail.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top + pageYScroll,
            w: rect.width
          };
        }
      };


      this.links.forEach((link => {
        link.addEventListener('click', (e) => this.zoomClick(e, link));
      }));
    }
    zoomClick(e, link) {
      this.items = this.buildItems();
      this.pswpOptions.index = parseInt(link.dataset.index, 10);
      if (typeof PhotoSwipe !== 'undefined') {
        let pswp = new PhotoSwipe(this.pswpElement, PhotoSwipeUI_Default, this.items, this.pswpOptions);
        pswp.listen('firstUpdate', function () {
          pswp.listen('parseVerticalMargin', function (item) {
            item.vGap = {
              top: 50,
              bottom: 50
            };
          });
        });
        pswp.init();
      }
      e.preventDefault();
    }
  }
  customElements.define('product-slider', ProductSlider);
}

/**
 *  @class
 *  @function ProductForm
 */
if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    SIZES = [
      {
        label: "12 Inch diameter",
        value: "12",
        shape: "circle"
      }, {
        label: "12 x 12 Inches",
        value: "12x12",
        shape: "square"
      }, {
        label: "18 Inch diameter",
        value: "18",
        shape: "circle"
      }, {
        label: "18 x 18 Inches",
        value: "18x18",
        shape: "square"
      }, {
        label: "6 Inch diameter",
        value: "6",
        shape: "circle"
      }, {
        label: "6 x 6 Inches",
        value: "6x6",
        shape: "square"
      }, {
        label: "8 Inch diameter",
        value: "8",
        shape: "circle"
      }, {
        label: "8 x 8 Inches",
        value: "8x8",
        shape: "square"
      }, {
        label: "A2 (16.5 x 23.4 Inches)",
        value: "16.5x23.4",
        shape: "rectangle"
      }, {
        label: "A3 (11.7 x 16.5 Inches)",
        value: "11.7x16.5",
        shape: "rectangle"
      }, {
        label: "A4 (8.3 x 11.7 Inches)",
        value: "8.3x11.7",
        shape: "rectangle"
      }, {
        label: "A5 (5.8 x 8.3 Inches)",
        value: "5.8x8.3",
        shape: "rectangle"
      }, {
        label: "9 x 3 Inches",
        value: "9x3",
        shape: "rectangle"
      }, {
        label: "9 x 4 Inches",
        value: "9x4",
        shape: "rectangle"
      }, {
        label: "12 x 3 Inches",
        value: "12x3",
        shape: "rectangle"
      }, {
        label: "12 x 4 Inches",
        value: "12x4",
        shape: "rectangle"
      }, {
        label: "2*A2 (16.5 x 23.4 Inches)",
        value: "16.5x23.4",
        shape: "rectangle"
      }, {
        label: "2*A3 (11.7 x 16.5 Inches)",
        value: "11.7x16.5",
        shape: "rectangle"
      }, {
        label: "2*A4 (8.3 x 11.7 Inches)",
        value: "8.3x11.7",
        shape: "rectangle"
      }, {
        label: "2*A5 (5.8 x 8.3 Inches)",
        value: "5.8x8.3",
        shape: "rectangle"
      }, {
        label: "2* (9 x 3 Inches)",
        value: "9x3",
        shape: "rectangle"
      }, {
        label: "2* (9 x 4 Inches)",
        value: "9x4",
        shape: "rectangle"
      }, {
        label: "2* (12 x 3 Inches)",
        value: "12x3",
        shape: "rectangle"
      },  {
        label: "2* (12 x 4 Inches)",
        value: "12x4",
        shape: "rectangle"
      }
    ]

    constructor() {
      super();

      this.sticky = this.dataset.sticky;
      this.editorFlow = this.dataset.editorFlow == "true"
      this.productTitle = this.dataset.productTitle;
      this.form = document.getElementById(`product-form-${this.dataset.section}`);
      this.form.querySelector('[name=id]').disabled = false;
      if (!this.sticky) {
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      }
      this.cartNotification = document.querySelector('cart-notification');
      this.body = document.body;

      this.hideErrors = this.dataset.hideErrors === 'true';
      this.variantSelector = document.getElementById(`variant-selects-${this.dataset.section}`)
      if (this.querySelector("[data-options]")) {
        this.optionsInformation = JSON.parse(this.querySelector("[data-options]").innerHTML)
      }
      if (this.querySelector("[data-template_ids]")) {
        this.variantTemplateIds = JSON.parse(this.querySelector('[data-template_ids]').innerHTML)
      }
      if (this.querySelector("[data-pre-select-template]")) {
        this.preSelectTemplates = JSON.parse(this.querySelector('[data-pre-select-template]').innerHTML)
      }
      if (this.querySelector("[data-super-imposed-images]")) {
        this.variantSuperImposedImages = JSON.parse(this.querySelector('[data-super-imposed-images]').innerHTML)
      }
    }

    onSubmitHandler(evt) {
      evt.preventDefault();

      if (!this.form.reportValidity()) {
        return;
      }

      if (this.editorFlow) {
        return this.openEditor(evt, this.productTitle)
      }
      let formData = new FormData(this.form);
      return this.performOperation(formData)
    }

    openEditor(evt, productTitle) {
      const currentVariant = this.variantSelector.currentVariant
      const sizePosition = this.optionsInformation.find((option) => option.name.toLowerCase() == "size").position
      const size = this.SIZES.find(s => {
        let currentVariantSizeValue = currentVariant[`option${sizePosition}`].toLowerCase()
        return s.label.toLowerCase() == currentVariantSizeValue
      })
      const container = document.querySelector("#backend-editor-container")
        
      const orientationElement = this.form.elements["properties[Orientation]"]
      let orientation = orientationElement ? orientationElement.value.toLowerCase() : "portrait"

      if(this.variantSuperImposedImages){
        currentVariant.superImposedImages = this.variantSuperImposedImages[currentVariant.id]
      }
      let selectedVariant = currentVariant['public_title'];

      const editor = document.createElement("digi-editor")
      editor.setAttribute("integration", "editor")
      editor.setAttribute("title", productTitle)
      editor.setAttribute("selectedvariant", selectedVariant)
      editor.setAttribute("size", size.value)
      editor.setAttribute("orientation", orientation)
      editor.setAttribute("shape", size.shape)
      editor.setAttribute("price", this.formatCurrency(currentVariant.price))
      editor.setAttribute("framecount", this.getAttribute("data-frame-count") || 1)
      editor.setAttribute("formId", `${this.form.getAttribute("id")}--product-form-element`)
      editor.setAttribute("baseurl", theme.routes.backend_url)
      if (this.preSelectTemplates[currentVariant.id]) {
        editor.setAttribute("iscollage", true)
        editor.setAttribute("templateid", this.preSelectTemplates[currentVariant.id])
      } else {
        currentVariant.templateIds = (this.variantTemplateIds[currentVariant.id]).join(",")
      }
      editor.setAttribute("variantjson", JSON.stringify(currentVariant))
      container.appendChild(editor)
      document.addEventListener("DigiEditor:Toogle", this.handleCloseEditor.bind(this))
    }

    formatCurrency = function (amount) {
      return formatMoney(amount, window.theme.settings.money_with_currency_format)
    }

    handleCloseEditor = () => {
      const container = document.querySelector("#backend-editor-container")
      container.innerHTML = ''
      document.removeEventListener("DigiEditor:Toogle", this.handleCloseEditor.bind(this))
    }

    handleEditorAddToCart = (pdfFiles) => {
      let formData = new FormData(this.form);
      if (pdfFiles.length > 1) {
        pdfFiles.forEach((pdfObj, index) => {
          formData.append(`properties[Frame Design ${index + 1}]`, pdfObj.pdf)
          let assets = Array.from(new Set(pdfObj.assets))
          assets.forEach((asset, assetIndex) => {
            formData.append(`properties[Frame Design ${index + 1} asset ${assetIndex + 1}]`, asset)
          })
        })
      } else {
        let pdfObj = pdfFiles[0]
        formData.append("properties[Design]", pdfObj.pdf)
        let assets = Array.from(new Set(pdfObj.assets))
        assets.forEach((asset, assetIndex) => {
          formData.append(`properties[Design asset ${assetIndex + 1}]`, asset)
        })
      }
      return this.performOperation(formData)
    }

    performOperation(formData) {
      const submitButtons = document.querySelectorAll('.single-add-to-cart-button');

      submitButtons.forEach((submitButton) => {
        if (submitButton.classList.contains('loading')) return;
        submitButton.setAttribute('aria-disabled', true);
        submitButton.classList.add('loading');
      });

      this.handleErrorMessage();

      const config = {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/javascript'
        }
      };

      formData.append('sections', this.getSectionsToRender().map((section) => section.section));
      formData.append('sections_url', window.location.pathname);
      if (sessionStorage.getItem("creatorTracker")) {
        let data = JSON.parse(sessionStorage.getItem("creatorTracker"))
        formData.append("properties[_creatorId]", data.creatorId)
        sessionStorage.removeItem("creatorTracker")
      }
      config.body = formData;

      return fetch(`${theme.routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            dispatchCustomEvent('product:variant-error', {
              source: 'product-form',
              productVariantId: formData.get('id'),
              errors: response.description,
              message: response.message
            });
            this.handleErrorMessage(response.description);
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
          submitButtons.forEach((submitButton) => {
            submitButton.classList.remove('loading');
            submitButton.removeAttribute('aria-disabled');
          });
        });
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



      let product_drawer = document.getElementById('Product-Drawer'),
        search_drawer = document.getElementById('Search-Drawer');

      if (search_drawer.classList.contains('active')) {
        search_drawer.classList.remove('active');
      }
      if (product_drawer && product_drawer.contains(this)) {
        product_drawer.classList.remove('active');
        this.body.classList.remove('open-cc--product');
        if (document.getElementById('Cart-Drawer')) {
          this.body.classList.add('open-cc');
          document.getElementById('Cart-Drawer').classList.add('active');
        }
      } else if (document.getElementById('Cart-Drawer')) {
        this.body.classList.add('open-cc');
        document.getElementById('Cart-Drawer').classList.add('active');
        dispatchCustomEvent('cart-drawer:open');
      }
    }

    getSectionInnerHTML(html, selector = '.shopify-section') {
      return new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector).innerHTML;
    }

    handleErrorMessage(errorMessage = false) {
      if (this.hideErrors) return;
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}


/**
 *  @class
 *  @function ProductAddToCartSticky
 */
if (!customElements.get('product-add-to-cart-sticky')) {
  class ProductAddToCartSticky extends HTMLElement {
    constructor() {
      super();

      this.animations_enabled = document.body.classList.contains('animations-true') && typeof gsap !== 'undefined';
    }
    connectedCallback() {
      this.setupObservers();
      this.setupToggle();
    }
    setupToggle() {
      const button = this.querySelector('.product-add-to-cart-sticky--inner'),
        content = this.querySelector('.product-add-to-cart-sticky--content');

      if (this.animations_enabled) {
        const tl = gsap.timeline({
          reversed: true,
          paused: true,
          onStart: () => {
            button.classList.add('sticky-open');
          },
          onReverseComplete: () => {
            button.classList.remove('sticky-open');
          }
        });

        tl
          .set(content, {
            display: 'block',
            height: 'auto'
          }, 'start')
          .from(content, {
            height: 0,
            duration: 0.25
          }, 'start+=0.001');

        button.addEventListener('click', function () {
          tl.reversed() ? tl.play() : tl.reverse();

          return false;
        });
      } else {
        button.addEventListener('click', function () {
          content.classList.toggle('active');
          return false;
        });
      }

    }
    setupObservers() {
      let _this = this,
        observer = new IntersectionObserver(function (entries) {
          entries.forEach((entry) => {
            if (entry.target === footer) {
              if (entry.intersectionRatio > 0) {
                _this.classList.remove('sticky--visible');
              } else if (entry.intersectionRatio == 0 && _this.formPassed) {
                _this.classList.add('sticky--visible');
              }
            }
            if (entry.target === form) {
              let boundingRect = form.getBoundingClientRect();

              if (entry.intersectionRatio === 0 && window.scrollY > (boundingRect.top + boundingRect.height)) {
                _this.formPassed = true;
                _this.classList.add('sticky--visible');
              } else if (entry.intersectionRatio === 1) {
                _this.formPassed = false;
                _this.classList.remove('sticky--visible');
              }
            }
          });
        }, {
          threshold: [0, 1]
        }),
        form = document.getElementById(`product-form-${this.dataset.section}`),
        footer = document.getElementById('footer');
      _this.formPassed = false;
      observer.observe(form);
      observer.observe(footer);
    }
  }

  customElements.define('product-add-to-cart-sticky', ProductAddToCartSticky);
}

/**
 *  @class
 *  @function ProductSidePanelLinks
 */
if (!customElements.get('side-panel-links')) {
  class ProductSidePanelLinks extends HTMLElement {
    constructor() {
      super();
      this.links = this.querySelectorAll('button');
      this.drawer = document.getElementById('Product-Information-Drawer');
      this.buttons = this.drawer.querySelector('.side-panel-content--tabs');
      this.panels = this.drawer.querySelector('.side-panel-content--inner').querySelectorAll('.side-panel-content--tab-panel');
      this.body = document.body;
    }
    connectedCallback() {
      this.setupObservers();
    }
    disconnectedCallback() {

    }
    setupObservers() {
      this.links.forEach((item, i) => {
        item.addEventListener('click', (e) => {
          this.body.classList.add('open-cc');
          this.buttons.toggleActiveClass(i);
          this.drawer.classList.add('active');
        });
      });
    }
  }

  customElements.define('side-panel-links', ProductSidePanelLinks);
}