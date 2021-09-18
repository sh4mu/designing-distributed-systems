const redis = require('redis');

console.log(`Start subscriber application on redis port 6379`)

const subscriber = redis.createClient({
    host: 'redis',
    port: 6379
});

subscriber.on('connect', function() {
    console.log('Connected!');
});

subscriber.on('message', (channel, message) => {
    console.log(`Message "${message}" on channel "${channel}" arrived!`)
});

subscriber.subscribe('my channel');