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

## Nodejs redis publisher-consumer

### Create nodejs container
In the nodejs-app run:
`npm init` 

Optional... delete? `npm install express --save`

Then create the nodejs docker container
`docker build -t nodejs-app .`

### Integrate nodejs with redis

https://docs.redis.com/latest/rs/references/client_references/client_nodejs/


