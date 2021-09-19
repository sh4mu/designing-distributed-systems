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

## Test redis ambassador with node publisher-consumer

### Publish nodejs container
In the Dockerfile folder run:
`npm init` 

Then create the nodejs docker container
`docker build -t <image-name> .`

### Create a publish app to validate shard usage

Create a publisher.js to connect to redis service and publish messages in 'my channel'
```
const publisher = redis.createClient({
    host: 'redis',
    port: 6379
});

publisher.publish('my channel', 'hi');
```

Create either a pod or a replica set using this container.

Use the redis-cli in the redis shard pods to listen to published messages, e.g.
```
$ kubectl exec -it sharded-redis-2 -- redis-cli
127.0.0.1:6379> psubscribe *
Reading messages... (press Ctrl-C to quit)
1) "psubscribe"
2) "*"
3) (integer) 1
```

Start the pod or change replicas of the redis-publisher and check received messages.

*Note:* The published messaged is sent to only one of the available redis-shards






https://docs.redis.com/latest/rs/references/client_references/client_nodejs/


