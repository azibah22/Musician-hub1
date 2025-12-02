const express = require('express');
const path = require('path');

const router = express.Router();

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

router.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

router.get('/links', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'links.html'));
});

router.get('/events', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'events.html'));
});

router.get('/contact', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'contact.html'));
});

// Admin login page
router.get('/admin', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

// Admin login/logout
router.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const expectedPassword = process.env.ADMIN_PASSWORD || 'changeme';

  if (!password || password !== expectedPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  req.session.isAdmin = true;
  res.json({ success: true });
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;


