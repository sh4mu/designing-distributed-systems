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


# K8s setup

## Create k8s registry

1. Configure NFS share between master and worker nodes

This should be done in a real k8s cluster, since pod persistent volumes should be mounted from an NFS server

2. Generate self-signed certificates for private registry

Go to master, node01 and node02
$ sudo mkdir /opt/certs /opt/registry

Create key and copy them to all k8s cluster nodes
$ cd /opt 
$ sudo openssl req -newkey rsa:4096 -nodes -sha256 -keyout \
 ./certs/registry.key -x509 -days 365 -out ./certs/registry.crt
$ ls -lrt cert/

3. Deploy private registry as deployment via yaml file



### Docker registry

`docker run -d -p 5000:5000 --restart=always --name registry registry:2`

To pull an image
`docker tag ubuntu:16.04 localhost:5000/my-ubuntu`
`docker push localhost:5000/my-ubuntu`



## Check DNS k8s service health
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


