(function () {
  const body = document.body;

  if (!body) {
    return;
  }

  // Flag scripting support so CSS can collapse the menu only after JS boots.
  body.classList.remove('no-js');
  body.classList.add('has-js');

  const nav = document.querySelector('.primary-nav');
  const toggle = document.querySelector('.nav-toggle');

  if (!nav || !toggle) {
    return;
  }

  if (!nav.dataset.open) {
    nav.dataset.open = 'true';
  }

  const closeMenu = () => {
    nav.dataset.open = 'false';
    nav.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('is-active');
  };

  const openMenu = (activateToggle = true) => {
    nav.dataset.open = 'true';
    nav.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');

    if (activateToggle && window.innerWidth <= 900) {
      toggle.classList.add('is-active');
    } else {
      toggle.classList.remove('is-active');
    }
  };

  if (window.innerWidth > 900) {
    openMenu(false);
  } else {
    closeMenu();
  }

  toggle.addEventListener('click', () => {
    const isOpen = nav.dataset.open === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      openMenu(false);
    } else if (!toggle.classList.contains('is-active')) {
      closeMenu();
    }
  });
})();
