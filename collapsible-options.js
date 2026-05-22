/*
 * Collapsible Options Sections
 * Makes the "General" and "Settings" sections in Cookie Clicker's Options menu collapsible.
 *
 * Load after publishing to GitHub Pages:
 * Game.LoadMod('https://YOUR_USERNAME.github.io/YOUR_REPO/collapsible-options.js');
 */

(function () {
  'use strict';

  const MOD_ID = 'collapsible-options-sections';
  const MOD_NAME = 'Collapsible Options Sections';
  const STORAGE_KEY = 'CC_COLLAPSIBLE_OPTIONS_STATE';

  const CollapsibleOptions = {
    version: '0.1.0',

    state: {
      General: false,
      Settings: false,
    },

    init() {
      this.loadState();
      this.injectCss();
      this.hookOptionsMenu();
      this.applyWhenReady();

      if (typeof Game !== 'undefined' && Game.Notify) {
        Game.Notify(MOD_NAME, 'General and Settings are now collapsible.', [16, 5]);
      }
    },

    save() {
      return JSON.stringify(this.state);
    },

    load(str) {
      if (!str) return;

      try {
        const parsed = JSON.parse(str);

        if (typeof parsed.General === 'boolean') this.state.General = parsed.General;
        if (typeof parsed.Settings === 'boolean') this.state.Settings = parsed.Settings;

        this.saveState();
      } catch (err) {
        console.warn(`[${MOD_NAME}] Could not load save data`, err);
      }
    },

    loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);

        if (typeof parsed.General === 'boolean') this.state.General = parsed.General;
        if (typeof parsed.Settings === 'boolean') this.state.Settings = parsed.Settings;
      } catch (err) {
        console.warn(`[${MOD_NAME}] Could not read local state`, err);
      }
    },

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.warn(`[${MOD_NAME}] Could not save local state`, err);
      }
    },

    injectCss() {
  if (document.getElementById('collapsible-options-css')) return;

  const css = document.createElement('style');
  css.id = 'collapsible-options-css';

  css.textContent = `
    .cc-collapsible-header {
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    .cc-collapsible-header:hover {
      filter: brightness(1.15);
    }

    .cc-collapsible-toggle {
      float: right;
      font-size: 12px;
      opacity: 0.9;
      margin-left: 8px;
      font-weight: bold;
    }

    .cc-collapsible-hidden {
      display: none !important;
    }
  `;

  document.head.appendChild(css);
},

    hookOptionsMenu() {
      if (
        typeof Game === 'undefined' ||
        !Game.UpdateMenu ||
        Game.UpdateMenu.__collapsibleOptionsHooked
      ) {
        return;
      }

      const originalUpdateMenu = Game.UpdateMenu;
      const self = this;

      Game.UpdateMenu = function () {
        const result = originalUpdateMenu.apply(this, arguments);

        // Cookie Clicker rebuilds the menu HTML often.
        // Apply after each rebuild.
        setTimeout(() => self.applyWhenReady(), 0);

        return result;
      };

      Game.UpdateMenu.__collapsibleOptionsHooked = true;
    },

    applyWhenReady() {
      const menu = document.getElementById('menu');
      if (!menu) return;

      const headerMap = this.findTargetHeaders(menu);

      Object.entries(headerMap).forEach(([sectionName, header]) => {
        this.prepareHeader(header, sectionName);
        this.setSectionCollapsed(header, this.state[sectionName]);
      });
    },

    findTargetHeaders(menu) {
      const targets = {};
      const possibleHeaders = Array.from(
        menu.querySelectorAll('.title, h2, h3, .section')
      );

      for (const el of possibleHeaders) {
        const text = this.cleanText(el.textContent);

        if (text === 'General' || text === 'Settings') {
          targets[text] = el;
        }
      }

      return targets;
    },

    cleanText(text) {
  return String(text || '')
    .replace(/\[\+\]|\[-\]/g, '')
    .replace(/[▸▾▶▼▲]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
},

    prepareHeader(header, sectionName) {
  if (header.dataset.collapsibleReady === '1') return;

  header.dataset.collapsibleReady = '1';
  header.dataset.sectionName = sectionName;

  header.classList.add('cc-collapsible-header');
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');

  const toggle = document.createElement('span');
  toggle.className = 'cc-collapsible-toggle';
  toggle.textContent = '[-]';

  header.appendChild(toggle);

  header.addEventListener('click', () => this.toggleSection(header));

  header.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleSection(header);
    }
  });
},
    setSectionCollapsed(header, collapsed) {
  const sectionName = header.dataset.sectionName;

  const toggle = header.querySelector('.cc-collapsible-toggle');
  if (toggle) {
    toggle.textContent = collapsed ? '[+]' : '[-]';
  }

  header.title = `Click to ${collapsed ? 'expand' : 'collapse'} ${sectionName}`;

  for (const node of this.getSectionNodes(header)) {
    node.classList.toggle('cc-collapsible-hidden', collapsed);
  }
},

    getSectionNodes(header) {
      const nodes = [];
      let node = header.nextElementSibling;

      while (node) {
        if (this.isSectionBoundary(node)) break;

        nodes.push(node);
        node = node.nextElementSibling;
      }

      return nodes;
    },

    isSectionBoundary(node) {
      if (!node) return true;

      if (node.classList && node.classList.contains('title')) return true;
      if (node.tagName === 'H2' || node.tagName === 'H3') return true;

      return false;
    },
  };

  function registerWhenReady() {
    if (typeof Game === 'undefined' || !Game.registerMod) {
      setTimeout(registerWhenReady, 250);
      return;
    }

    Game.registerMod(MOD_ID, CollapsibleOptions);
  }

  registerWhenReady();
})();
