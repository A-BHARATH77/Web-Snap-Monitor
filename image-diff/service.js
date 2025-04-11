const { createQueue } = require('../messageQueue');
const { getCollection } = require('../database');
const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const IMAGE_DIR = path.join(__dirname, '../public/images');

async function processImageDiff(msg,channel) {
    const message = JSON.parse(msg.content.toString());
    const { websiteId, currentImage, referenceImage } = message;
    
    console.log(`Processing image diff for website ${websiteId}`);
    
    try {
        const img1 = PNG.sync.read(fs.readFileSync(referenceImage));
        const img2 = PNG.sync.read(fs.readFileSync(currentImage));
        
        const { width, height } = img1;
        const diff = new PNG({ width, height });
        
        const numDiffPixels = pixelmatch(
            img1.data, img2.data, diff.data, 
            width, height, 
            { threshold: 0.1 }
        );
        
        const diffPercentage = (numDiffPixels / (width * height)) * 100;
        console.log(`Difference detected: ${diffPercentage.toFixed(2)}%`);
        
        if (diffPercentage > 0.1) { // 5% threshold for considering it a significant change
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const keyframeFilename = `keyframe-${websiteId}-${timestamp}.png`;
            const keyframePath = path.join(IMAGE_DIR, keyframeFilename);
            
            fs.writeFileSync(keyframePath, PNG.sync.write(diff));
            
            // Store keyframe in database
            const keyframes = await getCollection('keyframes');
            await keyframes.insertOne({
                websiteId,
                imagePath: keyframeFilename,
                diffPercentage,
                timestamp: new Date()
            });
            
            // Update reference image
            fs.copyFileSync(currentImage, referenceImage);
            console.log(`Updated reference image for website ${websiteId}`);
        }
    } catch (error) {
        console.error('Error processing image diff:', error);
    } finally {
        channel.ack(msg);
    }
}

async function startImageDiffService() {
    const channel = await createQueue('image_diff_tasks');
    channel.prefetch(1);
    
    channel.consume('image_diff_tasks', async (msg) => {
        await processImageDiff(msg, channel);  // Pass channel as parameter
    });
}

startImageDiffService();