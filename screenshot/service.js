const { createQueue } = require('../messageQueue');
const { getCollection } = require('../database');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_QUEUE = 'screenshot_tasks';
const IMAGE_DIR = path.join(__dirname, '../public/images');
const REFERENCE_DIR = path.join(IMAGE_DIR, 'references');

// Ensure directories exist
if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
if (!fs.existsSync(REFERENCE_DIR)) fs.mkdirSync(REFERENCE_DIR, { recursive: true });

async function processScreenshotTask(msg,channel) {
    const message = JSON.parse(msg.content.toString());
    const { websiteId, url } = message;
    
    console.log(`Processing screenshot for ${url}`);
    
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 3000000 });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${websiteId}-${timestamp}.png`;
        const filepath = path.join(IMAGE_DIR, filename);
        
        await page.screenshot({ path: filepath, fullPage: true });
        await browser.close();
        
        // Store screenshot info in database
        const screenshots = await getCollection('screenshots');
        await screenshots.insertOne({
            websiteId,
            url,
            imagePath: filename,
            timestamp: new Date()
        });
        
        // Check if reference exists
        const referencePath = path.join(REFERENCE_DIR, `${websiteId}.png`);
        if (!fs.existsSync(referencePath)) {
            // If no reference, create one
            fs.copyFileSync(filepath, referencePath);
            console.log(`Created reference image for ${url}`);
        } else {
            // Trigger image diff
            const diffChannel = await createQueue('image_diff_tasks');
            diffChannel.sendToQueue(
                'image_diff_tasks',
                Buffer.from(JSON.stringify({
                    websiteId,
                    currentImage: filepath,
                    referenceImage: referencePath
                })),
                { persistent: true }
            );
        }
        
        console.log(`Screenshot saved for ${url}`);
    } catch (error) {
        console.error(`Error processing ${url}:`, error);
    } finally {
        channel.ack(msg);
    }
}

async function startScreenshotService() {
    const channel = await createQueue(SCREENSHOT_QUEUE); // Define channel here
    channel.prefetch(1);
    
    channel.consume(SCREENSHOT_QUEUE, async (msg) => {
        await processScreenshotTask(msg, channel); // Pass channel as parameter
    });
}
startScreenshotService();