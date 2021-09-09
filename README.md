# K8s Vagrant environemnt

Use vagrant to setup a k8s cluster using pre-define VMs
To use Vagrant, virtualbox must be previously installed

## Vagrant Installation

https://devopscube.com/vagrant-tutorial-beginners/

## K8s cluster setup

https://devopscube.com/kubernetes-cluster-vagrant/
* Setup k8s cluster in vagrant
* Add generated config to ~/.kube/ to access cluster from host
* Install kubernetes-client locally


# Training
## Ambassador

### Check DNS k8s service health
Is DNS service up?
```
vagrant@master-node:~$ kubectl get svc --namespace=kube-system
NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                  AGE
kube-dns         ClusterIP   10.96.0.10      <none>        53/UDP,53/TCP,9153/TCP   26h
```

Are there DNS service errors? 
`kubectl logs --namespace=kube-system -l k8s-app=kube-dns`

Are DNS pods running?
`kubectl get pods --namespace=kube-system -l k8s-app=kube-dns`

### Check redis DNS entries

From https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/

Add dnsutils pod
`kubectl apply -f https://k8s.io/examples/admin/dns/dnsutils.yaml`

Check that DNS is working properly in the k8s environment
`kubectl exec -i -t dnsutils -- nslookup kubernetes.default`

Query the redis service entry
`kubectl exec -i -t dnsutils -- nslookup redis.default.svc.cluster.local`

Query a redis pod entry, using the pod IP
`kubectl exec -i -t dnsutils -- nslookup 192-168-158-3.default.pod.cluster.local`
