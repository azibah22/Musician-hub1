const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const LINKS_PATH = path.join(DATA_DIR, 'links.json');
const EVENTS_PATH = path.join(DATA_DIR, 'events.json');

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error(`Error reading JSON from ${filePath}`, err);
    return [];
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// Links
router.get('/links', (req, res) => {
  const links = readJson(LINKS_PATH);
  res.json(links);
});

router.post('/links', requireAdmin, (req, res) => {
  const { platform, url, icon } = req.body;
  if (!platform || !url) {
    return res.status(400).json({ error: 'Platform and URL are required' });
  }
  const links = readJson(LINKS_PATH);
  const nextId = links.length ? Math.max(...links.map(l => l.id)) + 1 : 1;
  const newLink = {
    id: nextId,
    platform,
    url,
    icon: icon || '',
    clickCount: 0
  };
  links.push(newLink);
  writeJson(LINKS_PATH, links);
  res.status(201).json(newLink);
});

router.delete('/links/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  let links = readJson(LINKS_PATH);
  const beforeLength = links.length;
  links = links.filter(l => l.id !== id);
  if (links.length === beforeLength) {
    return res.status(404).json({ error: 'Link not found' });
  }
  writeJson(LINKS_PATH, links);
  res.json({ success: true });
});

// Click analytics
router.post('/links/:id/click', (req, res) => {
  const id = Number(req.params.id);
  const links = readJson(LINKS_PATH);
  const link = links.find(l => l.id === id);
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }
  link.clickCount = (link.clickCount || 0) + 1;
  writeJson(LINKS_PATH, links);
  res.json({ success: true, clickCount: link.clickCount });
});

// Events
router.get('/events', (req, res) => {
  const events = readJson(EVENTS_PATH);
  res.json(events);
});

router.post('/events', requireAdmin, (req, res) => {
  const { title, date, time, venue, location, ticketUrl, description, status } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: 'Title and date are required' });
  }
  const events = readJson(EVENTS_PATH);
  const nextId = events.length ? Math.max(...events.map(e => e.id)) + 1 : 1;
  const newEvent = {
    id: nextId,
    title,
    date,
    time: time || '',
    venue: venue || '',
    location: location || '',
    ticketUrl: ticketUrl || '',
    description: description || '',
    status: status || 'upcoming'
  };
  events.push(newEvent);
  writeJson(EVENTS_PATH, events);
  res.status(201).json(newEvent);
});

router.delete('/events/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  let events = readJson(EVENTS_PATH);
  const beforeLength = events.length;
  events = events.filter(e => e.id !== id);
  if (events.length === beforeLength) {
    return res.status(404).json({ error: 'Event not found' });
  }
  writeJson(EVENTS_PATH, events);
  res.json({ success: true });
});

// Contact / booking - send email to artist
router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }

  const toAddress = process.env.BOOKING_EMAIL || 'anthonyzibah1@gmail.com';

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass) {
    console.error('SMTP configuration missing. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
    return res
      .status(500)
      .json({ error: 'Email not configured on server. Please contact admin.' });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || `"${name}" <${user}>`,
    to: toAddress,
    subject: `New booking inquiry from ${name}`,
    replyTo: email,
    text: `New booking/contact message:

Name: ${name}
Email: ${email}

Message:
${message}
`,
    html: `<p><strong>New booking/contact message</strong></p>
           <p><strong>Name:</strong> ${name}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;


