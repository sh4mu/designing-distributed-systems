const redis = require('redis');

console.log(`Start publisher application on redis port 6379`)

const publisher = redis.createClient({
    host: 'redis',
    port: 6379
});

publisher.on('connect', function() {
    console.log('Connected!');
});

publisher.publish('my channel', 'hi');

publisher.publish('my channel', 'hello world');