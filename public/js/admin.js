async function adminLogin(password) {
  const res = await fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ password })
  });
  if (!res.ok) {
    throw new Error('Invalid password');
  }
  return res.json();
}

async function adminLogout() {
  await fetch('/admin/logout', { method: 'POST' });
}

async function fetchLinks() {
  const res = await fetch('/api/links');
  return res.json();
}

async function fetchEvents() {
  const res = await fetch('/api/events');
  return res.json();
}

async function createLink(data) {
  const res = await fetch('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error('Failed to create link');
  }
  return res.json();
}

async function deleteLink(id) {
  await fetch(`/api/links/${id}`, { method: 'DELETE' });
}

async function createEvent(data) {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error('Failed to create event');
  }
  return res.json();
}

async function deleteEvent(id) {
  await fetch(`/api/events/${id}`, { method: 'DELETE' });
}

function renderAdminLinks(links) {
  const container = document.getElementById('admin-links');
  if (!container) return;
  container.innerHTML = '';
  if (!links.length) {
    container.innerHTML = '<p>No links yet.</p>';
    return;
  }

  links.forEach(link => {
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.innerHTML = `
      <div>
        <strong>${link.platform}</strong>
        <div class="small">${link.url}</div>
        <div class="small">Clicks: ${link.clickCount || 0}</div>
      </div>
      <button class="btn small danger">Delete</button>
    `;
    const btn = row.querySelector('button');
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this link?')) return;
      try {
        await deleteLink(link.id);
        showToast('Link deleted', 'success');
        loadAdminData();
      } catch {
        showToast('Failed to delete link', 'error');
      }
    });
    container.appendChild(row);
  });
}

function renderAdminEvents(events) {
  const container = document.getElementById('admin-events');
  if (!container) return;
  container.innerHTML = '';
  if (!events.length) {
    container.innerHTML = '<p>No events yet.</p>';
    return;
  }

  events
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(event => {
      const row = document.createElement('div');
      row.className = 'admin-row';
      const date = new Date(event.date);
      const niceDate = isNaN(date) ? event.date : date.toLocaleDateString();
      row.innerHTML = `
        <div>
          <strong>${event.title}</strong>
          <div class="small">${niceDate} · ${event.location || ''}</div>
        </div>
        <button class="btn small danger">Delete</button>
      `;
      const btn = row.querySelector('button');
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this event?')) return;
        try {
          await deleteEvent(event.id);
          showToast('Event deleted', 'success');
          loadAdminData();
        } catch {
          showToast('Failed to delete event', 'error');
        }
      });
      container.appendChild(row);
    });
}

async function loadAdminData() {
  try {
    const [links, events] = await Promise.all([fetchLinks(), fetchEvents()]);
    renderAdminLinks(links);
    renderAdminEvents(events);
  } catch (err) {
    console.error(err);
    showToast('Failed to load admin data', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const adminPanel = document.getElementById('admin-panel');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  loginBtn?.addEventListener('click', async () => {
    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput.value;
    if (!password) {
      showToast('Enter a password', 'error');
      return;
    }
    try {
      await adminLogin(password);
      loginSection.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      loadAdminData();
      showToast('Logged in', 'success');
    } catch {
      showToast('Incorrect password', 'error');
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    await adminLogout();
    adminPanel.classList.add('hidden');
    loginSection.classList.remove('hidden');
    showToast('Logged out', 'info');
  });

  const linkForm = document.getElementById('link-form');
  linkForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const platform = document.getElementById('platform').value;
    const url = document.getElementById('url').value;
    const icon = document.getElementById('icon').value;

    try {
      await createLink({ platform, url, icon });
      linkForm.reset();
      showToast('Link added', 'success');
      loadAdminData();
    } catch {
      showToast('Failed to add link', 'error');
    }
  });

  const eventForm = document.getElementById('event-form');
  eventForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      title: document.getElementById('event-title').value,
      date: document.getElementById('event-date').value,
      time: document.getElementById('event-time').value,
      venue: document.getElementById('event-venue').value,
      location: document.getElementById('event-location').value,
      ticketUrl: document.getElementById('event-ticket').value,
      description: document.getElementById('event-description').value
    };

    try {
      await createEvent(payload);
      eventForm.reset();
      showToast('Event added', 'success');
      loadAdminData();
    } catch {
      showToast('Failed to add event', 'error');
    }
  });
});


