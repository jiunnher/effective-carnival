const assert = require('node:assert');
const { beforeEach, test } = require('node:test');

const createElement = (initialClasses = []) => {
  const classSet = new Set(initialClasses);
  const listeners = {};
  const attributes = {};

  const element = {
    dataset: {},
    classList: {
      add: (...classes) => classes.forEach((cls) => classSet.add(cls)),
      remove: (...classes) => classes.forEach((cls) => classSet.delete(cls)),
      contains: (cls) => classSet.has(cls),
    },
    addEventListener: (type, handler) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
    dispatchEvent: (event) => {
      (listeners[event.type] || []).forEach((handler) => handler(event));
    },
    setAttribute: (name, value) => {
      attributes[name] = String(value);
    },
    getAttribute: (name) => attributes[name] ?? null,
    click() {
      this.dispatchEvent({ type: 'click' });
    },
  };

  Object.defineProperty(element, 'className', {
    get() {
      return Array.from(classSet).join(' ');
    },
    set(value = '') {
      classSet.clear();
      value
        .split(/\s+/)
        .filter(Boolean)
        .forEach((cls) => classSet.add(cls));
    },
  });

  return element;
};

const createDom = (width) => {
  const nav = createElement();
  const toggle = createElement();
  const body = createElement();

  nav.dataset.open = 'false';
  nav.setAttribute('aria-hidden', 'true');
  toggle.setAttribute('aria-expanded', 'false');

  const resizeListeners = [];

  const windowMock = {
    innerWidth: width,
    addEventListener: (type, handler) => {
      if (type === 'resize') {
        resizeListeners.push(handler);
      }
    },
    dispatchEvent: (event) => {
      if (event.type === 'resize') {
        resizeListeners.forEach((handler) => handler(event));
      }
    },
  };

  const documentMock = {
    body,
    querySelector: (selector) => {
      if (selector === '.primary-nav') return nav;
      if (selector === '.nav-toggle') return toggle;
      return null;
    },
  };

  Object.defineProperty(documentMock.body, 'classList', {
    value: body.classList,
  });

  return { nav, toggle, body, windowMock, documentMock };
};

let environment;

beforeEach(() => {
  environment = createDom(1024);
  environment.body.className = 'no-js';
  global.window = environment.windowMock;
  global.document = environment.documentMock;
  global.Event = class {
    constructor(type) {
      this.type = type;
    }
  };
  delete require.cache[require.resolve('../script')];
});

test('opens menu on desktop load and updates body class', () => {
  require('../script');

  const { nav, toggle } = environment;

  assert.equal(environment.body.classList.contains('has-js'), true);
  assert.equal(environment.body.classList.contains('no-js'), false);
  assert.equal(nav.dataset.open, 'true');
  assert.equal(nav.getAttribute('aria-hidden'), 'false');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.classList.contains('is-active'), false);
});

test('closes menu on mobile load', () => {
  environment = createDom(800);
  environment.body.className = 'no-js';
  global.window = environment.windowMock;
  global.document = environment.documentMock;
  delete require.cache[require.resolve('../script')];

  require('../script');

  const { nav, toggle } = environment;

  assert.equal(nav.dataset.open, 'false');
  assert.equal(nav.getAttribute('aria-hidden'), 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.classList.contains('is-active'), false);
});

test('toggle button opens and closes menu on mobile', () => {
  environment = createDom(800);
  environment.body.className = 'no-js';
  global.window = environment.windowMock;
  global.document = environment.documentMock;
  delete require.cache[require.resolve('../script')];

  require('../script');

  const { nav, toggle } = environment;

  toggle.click();
  assert.equal(nav.dataset.open, 'true');
  assert.equal(nav.getAttribute('aria-hidden'), 'false');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.classList.contains('is-active'), true);

  toggle.click();
  assert.equal(nav.dataset.open, 'false');
  assert.equal(nav.getAttribute('aria-hidden'), 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.classList.contains('is-active'), false);
});

test('resizing to desktop reopens menu without toggler animation', () => {
  environment = createDom(800);
  environment.body.className = 'no-js';
  global.window = environment.windowMock;
  global.document = environment.documentMock;
  delete require.cache[require.resolve('../script')];

  require('../script');

  const { nav, toggle } = environment;

  environment.windowMock.innerWidth = 1000;
  environment.windowMock.dispatchEvent(new Event('resize'));

  assert.equal(nav.dataset.open, 'true');
  assert.equal(nav.getAttribute('aria-hidden'), 'false');
  assert.equal(toggle.classList.contains('is-active'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
});
