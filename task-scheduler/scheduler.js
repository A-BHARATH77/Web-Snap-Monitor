const { createQueue } = require('../messageQueue');
const { ObjectId } = require('mongodb');  // Add this at the top of the file

const { getCollection} = require('../database');

let scanInterval = null; // Track the interval

async function scheduleScreenshot(websiteId) {
  const websites = await getCollection('websites');
  const website = await websites.findOne({ 
    _id: new ObjectId(websiteId),
    active: true
  });

  if (!website) return;

  const channel = await createQueue('screenshot_tasks');
  channel.sendToQueue(
    'screenshot_tasks',
    Buffer.from(JSON.stringify({
      websiteId: website._id,
      url: website.url,
      timestamp: new Date()
    })),
    { persistent: true }
  );
}

// Start automatic scans (every 15s)
function startAutoScan(websiteId) {
  if (scanInterval) clearInterval(scanInterval); // Clear existing
  scheduleScreenshot(websiteId); // Immediate first scan
  scanInterval = setInterval(() => scheduleScreenshot(websiteId), 15000);
}

// Stop automatic scans
function stopAutoScan() {
  if (scanInterval) clearInterval(scanInterval);
  scanInterval = null;
}

module.exports = { startAutoScan, stopAutoScan };
