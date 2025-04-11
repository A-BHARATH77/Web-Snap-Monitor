const amqp = require('amqplib');

async function purge() {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  
  await channel.purgeQueue('screenshot_tasks');
  await channel.purgeQueue('image_diff_tasks');
  
  console.log('Queues purged!');
  await channel.close();
  await conn.close();
}

purge().catch(console.error);