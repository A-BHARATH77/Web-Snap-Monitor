const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://localhost';
let connection;
let channel;

async function connectQueue() {
    if (!connection) {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
    }
    return channel;
}

async function createQueue(queueName) {
    const channel = await connectQueue();
    await channel.assertQueue(queueName, { durable: true });
    return channel;
}

module.exports = { connectQueue, createQueue };