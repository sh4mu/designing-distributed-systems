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

## Setup master node dns nameserver

This was required because when building a docker using the npm install, the https://registry.npmjs.org was not resolved

Master node is ubuntu, hence

```$ sudo nano /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: true
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

## Create k8s registry

1. Configure NFS share between master and worker nodes

This should be done in a real k8s cluster, since pod persistent volumes should be mounted from an NFS server

2. Autentication requirements

* Generate self-signed certificates for private registry

Go to master, node01 and node02
`sudo mkdir -p /opt/certs /opt/registry/data /opt/registry/auth`

Create key and copy them to all k8s cluster nodes
```cd /opt
sudo openssl req -newkey rsa:4096 -nodes -sha256 -keyout \
 ./certs/registry.key -x509 -days 365 -out ./certs/registry.crt
ls -lrt cert/
```

Add the certificates to the OS ca
```sudo cp /opt/certs/registry.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
sudo systemctl restart docker
```

* Add user/password for docker login

htpasswd -cB vi /opt/registry/auth/htpasswd admin
(type password)

* Copy the /opt folders to the node0x and repeat the update OS certificates step

3. Deploy private registry as deployment via yaml file

Start the registry Deployment (mounting the (/opt created folders))
`kubectl create -f private-registry.yaml`

Check all is up and running
`kubectl get deployments private-repository-k8s`

`kubectl get pods | grep -i private-repo`


4. Expose registry deployment as a nodeport service type

Expose registry deployment as a nodeport service type
`kubectl create -f private-registry-svc.yaml`

```
NAME                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
private-repository-k8s   NodePort    10.97.251.95   <none>        5000:31320/TCP   46s
```

5. Test and Use private docker registry in k8s

`sudo docker login -uadmin -ppassword master-node:31320`

6. Push docker image to private repo

Build the docker from the master node and add it to the private registry
`sudo docker build -t redis-pub .`

`sudo docker tag redis-pub:latest master-node:31320/redis-pub:1.0`

`sudo docker push master-node:31320/redis-pub:1.0`

7. Create pod using the private registry

* Create a secret (e.g. registrypullsecret) using the config.json

`kubectl create secret docker-registry registrypullsecret --docker-server=master-node:31320 --docker-username=admin --docker-password=password`

* Use private registry in the pod yaml

```
containers:
  - name: redis-publisher
    image: master-node:31320/redis-pub:1.0
  imagePullSecrets:
  - name: registrypullsecret
```

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


