const redis = require('redis');

const publisher = redis.createClient({
    host: 'redis',
    port: 6379
});

publisher.publish('my channel', 'hi');

publisher.publish('my channel', 'hello world');