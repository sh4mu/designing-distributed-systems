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

### Create registry in http

* Create the folder to store the registry data in the docker host

`sudo mkdir -p /opt/registry/data`

* Create a deployment using the image: registry:2 and the data as volume
```
apiVersion: apps/v1
kind: Deployment
...
  volumes:
      - name: registry-vol
        hostPath:
          path: /opt/registry/data
          type: Directory
...
      containers:
        - image: registry:2
          name: private-repository-k8s
          imagePullPolicy: IfNotPresent     
        volumeMounts:
          - name: registry-vol
            mountPath: /var/lib/registry
```

Start the registry Deployment

`kubectl create -f private-registry.yaml`

Check all is up and running

`kubectl get deployments private-repository-k8s`

`kubectl get pods | grep -i private-repo`

* Create a service to expose the registry

```
apiVersion: v1
kind: Service
metadata:
  labels:
    app: private-repository-k8s
  name: private-repository-k8s
spec:
  ports:
  - port: 5000
    nodePort: 31320
    protocol: TCP
    targetPort: 5000
  selector:
    app: private-repository-k8s
  type: NodePort
```

`kubectl create -f private-registry-svc.yaml`

```
NAME                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
private-repository-k8s   NodePort    10.97.251.95   <none>        5000:31320/TCP   46s
```

* Add master-node:31320 as a insecure-registry and restart the docker service
```
$ sudo vi /lib/systemd/system/docker.service
ExecStart=/usr/bin/dockerd -H fd:// --insecure-registry master-node:31320 --containerd=/run/containerd/containerd.sock
$ sudo service docker restart
```

* Validate registry connectivity

`$ curl -v master-node:31320`

`$ docker login master-node:31320`

### Add security options to support https

* Generate self-signed certificates for private registry

```
mkdir /opt/certs
cd /opt/

sudo openssl req -newkey rsa:4096 -nodes -sha256 -keyout ./certs/registry.key -x509 -days 365 -subj "/CN=master-node" -addext "subjectAltName = DNS:master-node"-out ./certs/registry.crt
```

Check the crt contents with `openssl x509 -in certs/registry.crt -text`

Copy the certificates in other k8s nodes to /opt/certs

* Add the certificate in all k8 cluster nodes

```
sudo cp /opt/certs/registry.crt /usr/share/ca-certificates/registry.crt
sudo update-ca-certificates (or sudo dpkg-reconfigure ca-certificates)
```

* Add certificate to docker

```
sudo mkdir /etc/docker/certs.d/master-node:31320
sudo cp /opt/certs/registry.crt /etc/docker/certs.d/master-node\:31320/ca.crt
sudo service docker restart
```

* Add user/password for docker login

htpasswd -cB vi /opt/registry/auth/htpasswd admin
(type password, e.g. password)

Copy htpasswd file to all k8s nodes under /opt/registry/auth/

* Replace the deployment with one using certificate and htpasswd

```
    volumes:
      - name: certs-vol
        hostPath:
          path: /opt/certs
          type: Directory
      - name: registry-vol
        hostPath:
          path: /opt/registry/data
          type: Directory
      - name: auth-vol
        hostPath:
          path: /opt/registry/auth
          type: Directory
...
      containers:
        - image: registry:2
          name: private-repository-k8s
          imagePullPolicy: IfNotPresent          
          env:
          - name: REGISTRY_AUTH
            value: "htpasswd"
          - name: REGISTRY_AUTH_HTPASSWD_REALM
            value: "Registry Realm"
          - name: REGISTRY_AUTH_HTPASSWD_PATH
            value: /auth/htpasswd
          - name: REGISTRY_HTTP_TLS_CERTIFICATE
            value: "/certs/registry.crt"
          - name: REGISTRY_HTTP_TLS_KEY
            value: "/certs/registry.key"
          ports:
            - containerPort: 5000
          volumeMounts:
          - name: certs-vol
            mountPath: /certs
          - name: registry-vol
            mountPath: /var/lib/registry
          - name: auth-vol
            mountPath: /auth
```

* Validate the registry is available

The https domain can be reached `curl https://master-node:31320/v2/_catalog -u admin:password`

The docker registry can be logged in with `docker login master-node:31320`

### Use images from the private registry

* Build the image and push it to the private repo

Build the docker from the master node and add it to the private registry
```
sudo docker build -t redis-pub .

sudo docker login master-node:31320
sudo docker tag redis-pub:latest master-node:31320/redis-pub:latest
sudo docker push master-node:31320/redis-pub:latest
```

* Create a **secret** from the docker config

```
$ sudo kubectl create secret generic regcred --from-file=.dockerconfigjson=/home/vagrant/.docker/config.json --type=kubernetes.io/dockerconfigjson
$ kubectl get secret regcred --output=yaml
```

* Use private registry in the pod yaml

```
containers:
  - name: redis-publisher
    image: master-node:31320/redis-pub:1.0
  imagePullSecrets:
  - name: regcred
```

Confirm that the docker image is succesfully pulled with `docker describe pod/redis-publisher
```
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  22s   default-scheduler  Successfully assigned default/redis-publisher to worker-node02
  Normal  Pulling    21s   kubelet            Pulling image "master-node:31320/redis-pub:latest"
  Normal  Pulled     1s    kubelet            Successfully pulled image "master-node:31320/redis-pub:latest" in 19.926812435s
  Normal  Created    1s    kubelet            Created container redis-publisher
  Normal  Started    0s    kubelet            Started container redis-publisher
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


