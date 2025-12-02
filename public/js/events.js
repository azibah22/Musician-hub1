function buildCalendarLinks(event) {
  const startDate = event.date.replace(/-/g, '');
  const endDate = startDate; // single-day event
  const text = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || '');

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Musician Hub//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@musician-hub`,
    `DTSTAMP:${startDate}T000000Z`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ''}`,
    `LOCATION:${event.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return { googleUrl, icsContent };
}

function renderEvents(events) {
  const list = document.getElementById('event-list');
  if (!list) return;
  list.classList.remove('loading');
  list.innerHTML = '';

  if (!events.length) {
    list.innerHTML = '<p>No events found.</p>';
    return;
  }

  events.forEach(event => {
    const card = document.createElement('article');
    card.className = 'event-card';

    const dateObj = new Date(event.date);
    const niceDate = isNaN(dateObj)
      ? event.date
      : dateObj.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

    const { googleUrl, icsContent } = buildCalendarLinks(event);

    card.innerHTML = `
      <header>
        <h3>${event.title}</h3>
        <p class="event-meta">
          <span>${niceDate}${event.time ? ' · ' + event.time : ''}</span>
          ${event.location ? `<span> · ${event.location}</span>` : ''}
        </p>
      </header>
      <p class="event-description">${event.description || ''}</p>
      <div class="event-actions">
        ${
          event.ticketUrl
            ? `<a href="${event.ticketUrl}" target="_blank" rel="noopener" class="btn small">Tickets</a>`
            : ''
        }
        <a href="${googleUrl}" target="_blank" rel="noopener" class="btn small ghost">Add to Google Calendar</a>
        <button class="btn small ghost ics-btn">Download iCal</button>
        <button class="btn small share-event-btn">Share</button>
      </div>
    `;

    const icsBtn = card.querySelector('.ics-btn');
    icsBtn.addEventListener('click', () => {
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.title}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    const shareBtn = card.querySelector('.share-event-btn');
    shareBtn.addEventListener('click', async () => {
      const shareUrl = window.location.origin + '/events';
      const shareData = {
        title: event.title,
        text: `${event.title} on ${niceDate}.`,
        url: shareUrl
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          // user cancelled
        }
      } else if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          if (typeof showToast === 'function') {
            showToast('Event link copied!', 'success');
          }
        } catch {
          if (typeof showToast === 'function') {
            showToast('Unable to copy link', 'error');
          }
        }
      }
    });

    list.appendChild(card);
  });
}

async function fetchAndRenderEvents() {
  const list = document.getElementById('event-list');
  if (!list) return;
  list.classList.add('loading');

  try {
    const res = await fetch('/api/events');
    const events = await res.json();
    // sort by date ascending
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    window.__allEvents = events;
    applyFilters();
  } catch (err) {
    console.error(err);
    list.classList.remove('loading');
    list.innerHTML = '<p>Failed to load events.</p>';
  }
}

function applyFilters() {
  const events = window.__allEvents || [];
  const term = (document.getElementById('search-term')?.value || '').toLowerCase();
  const fromDate = document.getElementById('date-filter')?.value;

  const filtered = events.filter(e => {
    const matchesTerm =
      !term ||
      (e.title && e.title.toLowerCase().includes(term)) ||
      (e.venue && e.venue.toLowerCase().includes(term)) ||
      (e.location && e.location.toLowerCase().includes(term));

    const matchesDate = !fromDate || new Date(e.date) >= new Date(fromDate);
    return matchesTerm && matchesDate;
  });

  renderEvents(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-term');
  const dateInput = document.getElementById('date-filter');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
  }

  if (dateInput) {
    dateInput.addEventListener('change', () => {
      applyFilters();
    });
  }

  fetchAndRenderEvents();
});


