const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const pageRoutes = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions for simple admin auth
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'musician-hub-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2 // 2 hours
    }
  })
);

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Expose basic config to templates if needed later
app.locals.musicianName = process.env.MUSICIAN_NAME || 'Your Artist Name';

// Attach routes
app.use('/api', apiRoutes);
app.use('/', pageRoutes);

// Fallback 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Musician Link Hub server running on http://localhost:${PORT}`);
});


