# Ambassador

# Redis
## Check redis DNS entries

From https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/

Add dnsutils pod
`kubectl apply -f https://k8s.io/examples/admin/dns/dnsutils.yaml`

Check that DNS is working properly in the k8s environment
`kubectl exec -i -t dnsutils -- nslookup kubernetes.default`

Query the redis service entry and the associated redis replicas
`kubectl exec -i -t dnsutils -- nslookup redis.default.svc.cluster.local`
`$ kubectl exec -i -t dnsutils -- nslookup sharded-redis-1.redis`

Query a redis pod entry, using the pod IP
`kubectl exec -i -t dnsutils -- nslookup 192-168-158-3.default.pod.cluster.local`

## Setup Redis using an ambassador shard
Redis is deployed in a StatefulSet to create 3 replicas, each with its name
`kubectl create -f redis-shards.yaml`

Add a service to expose and create DNS entries for each redis-shard
`kubectl create -f redis-service`

Create a Ambassador using the twemproxy to listen localhost:6379 and distribute to the replicas created 
`kubectl create -f redis-service/ambassador-pod.yaml`

### NodeJS Redis publisher/subscriber docker image

Create a container to hold the Publisher/subscriber app. In the folder containing the Dockerfile and JS script, run: 
`npm init` 

Create a publisher.js to connect to redis service and publish messages in 'my channel'
```
const publisher = redis.createClient({
    host: 'redis',
    port: 6379
});

publisher.publish('my channel', 'hi');
```

Create a publisher.js to connect to redis service and consume messages from 'my channel'
```
subscriber.subscribe('my channel');

subscriber.on('message', (channel, message) => {
    console.log(`Message "${message}" on channel "${channel}" arrived!`)
});
```

Then create the nodejs docker container and send it to the private registry. For instance, for the publisher
```
docker build -t redis-pub .
docker tag redis-pub:latest localhost:5000/redis-pub
docker push localhost:5000/redis-pub
```

### Create a publish/subscriber to validate shard usage
Create a Deployment with a single replica to Consume messages from a redis instance. Note that the consumer will connect to a single Redis shard.

`kubectl create -f redis-subscriber.yaml`

Check the subscriber logs for received messages, e.g.

`kubectl logs -f redis-subscriber-7b4c9595d6-b69gp ` 

Create a Publisher Deployment to publish messages to redis instances. Note that each publisher will connect to a single Redis shard.

`kubectl create -f redis-publisher.yaml`

You may need to create many replicas in order to publish to the same redis instance as the subscriber.

`kubectl scale --replicas 10 deployment/redis-publisher`

You can also use the redis-cli in the redis shard pods to listen to published messages, e.g.
```
$ kubectl exec -it sharded-redis-2 -- redis-cli
127.0.0.1:6379> psubscribe *
Reading messages... (press Ctrl-C to quit)
1) "psubscribe"
2) "*"
3) (integer) 1
```

https://docs.redis.com/latest/rs/references/client_references/client_nodejs/


