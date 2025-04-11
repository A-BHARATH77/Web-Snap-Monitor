const express = require('express');
const { getCollection } = require('../database');
const bodyParser = require('body-parser');
const path = require('path');
const { ObjectId } = require('mongodb');  // Add this line
const { startAutoScan, stopAutoScan } = require('../task-scheduler/scheduler');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, '../public/images'), {
  maxAge: '1d', // Cache images for 1 day
  setHeaders: (res, path) => {
    if (path.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    }
  }
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// List all tracked websites
app.get('/', async (req, res) => {
    const websites = await getCollection('websites');
    const websiteList = await websites.find().toArray();
    res.render('index', { websites: websiteList });
});

// Show keyframes for a specific website
app.get('/website/:id', async (req, res) => {
    try {
        const websites = await getCollection('websites');
        const keyframes = await getCollection('keyframes');
        
        const website = await websites.findOne({ _id: new ObjectId(req.params.id) });
        
        if (!website) {
            return res.status(404).send('Website not found');
        }
        
        const frames = await keyframes.find({ websiteId: req.params.id }).sort({ timestamp: -1 }).toArray();
        res.render('website', { website, frames });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add a new website to track
app.post('/add-website', async (req, res) => {
    const websites = await getCollection('websites');
    const { url, name } = req.body;
    
    await websites.insertOne({
        url,
        name,
        createdAt: new Date(),
        active: true
    });
    
    res.redirect('/');
});
  app.post('/start-scan/:id', async (req, res) => {
    try {
      await startAutoScan(req.params.id);
      res.redirect(`/website/${req.params.id}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Auto-scan failed to start");
    }
  });
  
  // Stop auto-scan
  app.post('/stop-scan/:id', async (req, res) => {
    stopAutoScan();
    res.redirect(`/website/${req.params.id}`);
  });
app.listen(PORT, () => {
    console.log(`Frontend service running on http://localhost:${PORT}`);
});