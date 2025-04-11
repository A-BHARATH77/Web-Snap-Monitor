const { MongoClient } = require('mongodb');

const DB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'websiteTracker';

let client;
let db;

async function connectDB() {
    if (!client) {
        client = new MongoClient(DB_URL, { useUnifiedTopology: true });
        await client.connect();
        db = client.db(DB_NAME);
    }
    return db;
}

async function getCollection(collectionName) {
    const db = await connectDB();
    return db.collection(collectionName);
}

module.exports = { connectDB, getCollection };