// Basic utilities shared across pages

function $(selector, scope = document) {
  return scope.querySelector(selector);
}

function $all(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

function showToast(message, type = 'info') {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast-${type} visible`;
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 2500);
}

// Theme handling
function applyTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(`theme-${theme}`);
  localStorage.setItem('preferredTheme', theme);
  const toggle = $('#theme-toggle');
  if (toggle) {
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function initTheme() {
  const stored = localStorage.getItem('preferredTheme');
  const prefersDark = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);

  const toggle = $('#theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = document.body.classList.contains('theme-dark')
        ? 'light'
        : 'dark';
      applyTheme(next);
    });
  }
}

// Link loading (for home and links page)
async function loadLinks() {
  const grid = $('#link-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/links');
    const links = await res.json();
    grid.classList.remove('loading');
    grid.innerHTML = '';

    if (!links.length) {
      grid.innerHTML = '<p>No links yet.</p>';
      return;
    }

    links.forEach(link => {
      const card = document.createElement('a');
      card.href = link.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.className = 'link-card';
      card.dataset.id = link.id;

      card.innerHTML = `
        <div class="link-platform">${link.platform}</div>
        <div class="link-meta">
          <span>${link.clickCount || 0} plays</span>
        </div>
      `;

      card.addEventListener('click', () => {
        // fire-and-forget click tracking
        fetch(`/api/links/${link.id}/click`, { method: 'POST' }).catch(() => {});
      });

      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    grid.classList.remove('loading');
    grid.innerHTML = '<p>Failed to load links.</p>';
  }
}

// Next event on homepage
async function loadNextEvent() {
  const el = $('#next-event-text');
  if (!el) return;
  try {
    const res = await fetch('/api/events');
    const events = await res.json();
    if (!events.length) {
      el.textContent = 'No upcoming events yet. Stay tuned.';
      return;
    }
    const upcoming = events
      .filter(e => e.status !== 'cancelled')
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    if (!upcoming) {
      el.textContent = 'No upcoming events yet. Stay tuned.';
      return;
    }
    const date = new Date(upcoming.date);
    el.textContent = `${upcoming.title} · ${date.toLocaleDateString()} · ${upcoming.location}`;
  } catch (err) {
    console.error(err);
    el.textContent = 'Unable to load events right now.';
  }
}

// Social share for profile
function initShareButtons() {
  $all('.share-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const shareData = {
        title: document.title,
        text: 'Check out this artist profile and events.',
        url: window.location.origin
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          // user cancelled
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareData.url);
          showToast('Profile link copied!', 'success');
        } catch {
          showToast('Unable to copy link', 'error');
        }
      }
    });
  });
}

// Contact form - send to backend
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name = $('#name')?.value.trim();
    const email = $('#email')?.value.trim();
    const message = $('#message')?.value.trim();

    if (!name || !email || !message) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }

      form.reset();
      showToast('Message sent. Thank you!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Unable to send message right now.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = $('#year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  initTheme();
  initShareButtons();
  initContactForm();
  loadLinks();
  loadNextEvent();
});


