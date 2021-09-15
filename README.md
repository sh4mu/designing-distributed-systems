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

## Create docker local registry

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


