class CollectionSection extends HTMLElement {
  constructor() {
    super();

    this.pageOverlayClass = "page-overlay";
    this.activeOverlayBodyClass = `${this.pageOverlayClass}-on`;
    this.drawer = () => document.querySelector(".wt-filter");
    this.classDrawerActive = "wt-filter--drawer-open";
    this.getCloseButton = () => document.querySelector(".wt-filter__close");
    this.getTrigger = () =>
      document.querySelector(".collection__filter-trigger");
    this.isOpen = () =>
      document.body.classList.contains(this.activeOverlayBodyClass);
    this.sectionsTriggers = () =>
      this.drawer()?.querySelectorAll(".wt-collapse__trigger");
    this.isDrawer = this.dataset.filterPosition === "drawer";

    this.triggerClasses = [
      "wt-filter__close",
      this.pageOverlayClass,
      "collection__filter-trigger",
    ];
    this.toggleDrawerElements = () =>
      this.drawer().querySelectorAll(this.drawer().dataset.toggleTabindex);

    this.overlay = document.createElement("div");

    this.breakpoint = 1200;
    this.currentDrawerMode = this.isDrawerMode();

    // ====== إعدادات تابس عرض الجريد ======
    this.getGrid = () => this.querySelector(".collection__grid");
    this.getGridViewTabs = () => this.querySelectorAll(".grid-view-tab");
    this.mobileBreakpoint = 900;

    this.init();
  }

  init() {
    this.createOverlay();

    document.body.addEventListener("click", (e) => {
      if (this.triggerClasses.some((cls) => e.target.classList.contains(cls))) {
        this.toggleDrawer(e);
      }
    });

    this.addEventListener("keydown", (e) => {
      const isTabPressed =
        e.key === "Tab" || e.keyCode === 9 || e.code === "Tab";
      const { first, last } = this.getFocusableElements();

      if (e.key === "Escape" || e.keyCode === 27 || e.code === "Escape") {
        if (this.isOpen()) {
          this.toggleDrawer(e);
        }
      }

      if (isTabPressed && this.isOpen() && this.currentDrawerMode) {
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    });

    window.addEventListener("resize", this.handleResize.bind(this));
    this.handleResize();

    if (this.isDrawerMode()) {
      setTabindex(this.sectionsTriggers(), "-1");
      setTabindex(this.toggleDrawerElements(), "-1");
    }

    // ====== تفعيل تابس عرض الجريد ======
    this.initGridViewTabs();
  }

  // ====== منطق تبديل عدد أعمدة الجريد ======
  initGridViewTabs() {
    const tabs = this.getGridViewTabs();
    if (!tabs || !tabs.length) return;

    // استعادة التفضيل المحفوظ
    const saved = localStorage.getItem("gridColumns");
    const isMobile = window.innerWidth < this.mobileBreakpoint;
    
    // الحصول على القيم الافتراضية من الـ data attributes
    const defaultCols = isMobile 
      ? parseInt(this.getGrid()?.dataset.colsMobile || 2, 10)
      : parseInt(this.getGrid()?.dataset.colsDesktop || 3, 10);
    
    const columns = saved || defaultCols;
    this.applyGridColumns(columns, false);

    // إضافة مستمعات الأحداث للأزرار
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const columns = tab.getAttribute("data-columns");
        if (columns) {
          this.applyGridColumns(columns, true);
        }
      });

      // دعم لوحة المفاتيح
      tab.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          tab.click();
        }
      });
    });
  }

  applyGridColumns(columns, save) {
    const grid = this.getGrid();
    const tabs = this.getGridViewTabs();
    if (!grid) return;

    const cols = parseInt(columns, 10);
    if (isNaN(cols) || cols < 1) return;

    const isMobile = window.innerWidth < this.mobileBreakpoint;

    // تحديث عدد الأعمدة في الـ CSS
    grid.style.setProperty("--cols", cols);
    
    // تحديث الـ data attributes
    if (isMobile) {
      grid.dataset.colsMobile = cols;
    } else {
      grid.dataset.colsDesktop = cols;
    }

    // تحديث الـ grid-template-columns مباشرة
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // تأثير التبديل
    grid.classList.add("is-switching");
    setTimeout(() => {
      grid.classList.remove("is-switching");
    }, 300);

    // تحديث الأزرار
    tabs.forEach((tab) => {
      const tabCols = tab.getAttribute("data-columns");
      const isActive = parseInt(tabCols, 10) === cols;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    // حفظ التفضيل مع نوع الجهاز
    if (save) {
      try {
        localStorage.setItem("gridColumns", cols);
        localStorage.setItem("gridDeviceType", isMobile ? "mobile" : "desktop");
      } catch (e) {
        // تجاهل أخطاء localStorage
      }
    }
  }

  // ====== استعادة التفضيل حسب الجهاز ======
  restoreGridPreference() {
    const grid = this.getGrid();
    if (!grid) return;

    const isMobile = window.innerWidth < this.mobileBreakpoint;
    const defaultCols = isMobile 
      ? parseInt(grid.dataset.colsMobile || 2, 10)
      : parseInt(grid.dataset.colsDesktop || 3, 10);

    let savedCols = null;
    try {
      const saved = localStorage.getItem("gridColumns");
      const savedDevice = localStorage.getItem("gridDeviceType");
      const currentDevice = isMobile ? "mobile" : "desktop";
      
      // استخدام التفضيل المحفوظ فقط إذا كان من نفس نوع الجهاز
      if (saved && savedDevice === currentDevice) {
        savedCols = parseInt(saved, 10);
      }
    } catch (e) {}

    const cols = (savedCols && savedCols >= 1 && savedCols <= 4) 
      ? savedCols 
      : defaultCols;

    this.applyGridColumns(cols, false);
  }

  isDrawerMode() {
    const width = window.innerWidth;
    return this.isDrawer || width <= this.breakpoint;
  }

  handleResize() {
    const isDrawerMode = this.isDrawerMode();

    // تحديث أعمدة الجريد عند تغيير حجم الشاشة
    this.restoreGridPreference();

    if (isDrawerMode !== this.currentDrawerMode) {
      this.currentDrawerMode = isDrawerMode;

      if (isDrawerMode) {
        if (!this.isOpen()) {
          this.drawer()?.classList.remove(this.classDrawerActive);
          document.body.classList.remove(this.activeOverlayBodyClass);
        }
        this.updateTabindexes(this.isOpen());
      } else {
        this.drawer()?.classList.add(this.classDrawerActive);
        document.body.classList.remove(this.activeOverlayBodyClass);
        this.updateTabindexes(true);
      }
    }
  }

  temporaryHideFocusVisible() {
    document.body.classList.add("no-focus-visible");
  }

  getFocusableElements() {
    const focusableElementsSelector =
      "button, [href], input:not([type='hidden']), select, [tabindex]";
    const elements = Array.from(
      this.drawer().querySelectorAll(focusableElementsSelector),
    ).filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.tabIndex >= 0 &&
        el.offsetParent !== null,
    );

    return {
      focusableElements: elements,
      first: elements[0],
      last: elements[elements.length - 1],
    };
  }

  updateTabindexes(isOpen) {
    if (this.currentDrawerMode) {
      if (isOpen) {
        this.getCloseButton()?.focus();
        this.temporaryHideFocusVisible();
        setTabindex(this.sectionsTriggers(), "0");
        setTabindex(this.toggleDrawerElements(), "0");
      } else {
        this.getTrigger()?.focus();
        this.temporaryHideFocusVisible();
        setTabindex(this.sectionsTriggers(), "-1");
        setTabindex(this.toggleDrawerElements(), "-1");

        this.closeAllCollapsibleSections();
      }
    } else {
      // Always visible mode
      setTabindex(this.sectionsTriggers(), "0");
      setTabindex(this.toggleDrawerElements(), "0");
    }
  }

  toggleDrawer(e) {
    if (e) e.preventDefault();

    if (!this.currentDrawerMode) {
      return;
    }

    if (this.isOpen()) {
      // close drawer
      const offsetTop = -parseInt(document.body.style.top, 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      window.scrollTo(0, offsetTop);

      this.closeAllCollapsibleSections();
    } else {
      // open drawer
      document.body.style.top = `${-document.documentElement.scrollTop}px`;
      document.body.style.left = "0px";
    }

    this.drawer()?.classList.toggle(this.classDrawerActive);
    document.body.classList.toggle(this.activeOverlayBodyClass);

    this.updateTabindexes(this.isOpen());
  }

  closeAllCollapsibleSections() {
    const openSections = this.drawer().querySelectorAll('[data-open="true"]');
    openSections.forEach((section) => {
      const trigger = section.querySelector(".wt-collapse__trigger");
      if (trigger) {
        trigger.classList.remove("wt-collapse__trigger--active");
        section.dataset.open = "false";
        const focusableElementsWithTabindex =
          section.querySelectorAll('[tabindex="0"]');
        setTabindex(focusableElementsWithTabindex, "-1");
      }
    });
  }

  createOverlay() {
    if (!document.querySelector(`.${this.pageOverlayClass}`)) {
      this.overlay?.classList.add(this.pageOverlayClass);
      document.body.appendChild(this.overlay);
    }
  }
}

// ====== دالة مساعدة لضبط tabindex ======
function setTabindex(elements, value) {
  if (!elements) return;
  elements.forEach((el) => {
    if (el) el.setAttribute("tabindex", value);
  });
}

customElements.define("collection-section", CollectionSection);