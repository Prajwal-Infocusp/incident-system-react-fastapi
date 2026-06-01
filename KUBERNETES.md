# ☸️ Local Kubernetes & Minikube Deployment Guide

This guide provides step-by-step instructions to deploy the full-stack incident system locally on a Kubernetes cluster using **Minikube** and **kubectl** via the unified configuration file `k8s-simple.yaml`.

All images are built directly inside your local Minikube cluster, removing any external dependencies on public registries or cloud authentication.

---

```
                       [ Host Web Browser ]
                                │
                      http://<NODE-IP>:30007
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │               Minikube Cluster               │
         │                                              │
         │  ┌─────────────────┐    ┌─────────────────┐  │
         │  │    Frontend     │───>│     Backend     │  │
         │  │ (NodePort:30007)│    │    (FastAPI)    │  │
         │  └─────────────────┘    └────────┬────────┘  │
         │                                  │           │
         │                                  ▼           │
         │                         ┌─────────────────┐  │
         │                         │   PostgreSQL    │  │
         │                         │   (Database)    │  │
         │                         └─────────────────┘  │
         └──────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before starting, ensure you have:
1. **Minikube** installed on your local machine.
2. **kubectl** installed and configured.
3. **Docker** installed and running on your host machine.

---

## ⚙️ Step 1: Start Minikube & Connect Your Terminal

1. **Start the Minikube cluster** using the standard Docker driver:
   ```bash
   minikube start --driver=docker
   ```

2. **Redirect your shell's Docker CLI** to Minikube's built-in container registry:
   ```bash
   eval $(minikube docker-env)
   ```
   > [!NOTE]
   > This command only affects your current terminal window. If you open a new terminal window, you must run `eval $(minikube docker-env)` again before building images.

---

## 🛠️ Step 2: Build the Container Images Locally

Since we are running completely locally, we build the images directly inside the Minikube registry so Kubernetes can retrieve them immediately without pushing to an external registry:

```bash
# 1. Build the Backend Image
docker build -t incident-backend:latest ./backend

# 2. Build the Frontend Image
docker build -t incident-frontend:latest ./frontend
```

Verify that the images exist in the Minikube registry:
```bash
docker images | grep incident
```

---

## 🚀 Step 3: Deploy the Application

Deploy the unified configuration file, which creates the Nginx ConfigMap, PostgreSQL database, backend service, and frontend NodePort service:

```bash
kubectl apply -f k8s-simple.yaml
```

---

## 🌐 Step 4: Access the Application via Node IP

The frontend is exposed as a `NodePort` service mapping internal container port `5173` to the node's external port **`30007`**.

1. **Get the IP address of your Minikube node**:
   ```bash
   minikube ip
   ```
   *(This usually outputs an IP like `192.168.49.2` or `192.168.59.100`).*

2. **Access the application in your browser**:
   ```text
   http://<NODE-IP>:30007
   ```
   *(For example: http://192.168.49.2:30007)*

---

## 🧠 Core Concept: Deployments vs. Pods

In Kubernetes, **you should never manage or delete individual Pods directly**. 

* **Pods are ephemeral**: A Pod is a single, disposable instance of a running process.
* **Deployments manage Pods**: A `Deployment` acts as a controller that defines the *desired state* (e.g., "always run 1 replica of the backend image").
* **Self-Healing**: If a Pod is deleted, fails, or the node crashes, the Deployment controller instantly detects the discrepancy and spins up a brand new Pod to restore the desired state.
* **How to update**: Always apply changes by updating the Deployment configuration (via `kubectl apply` or `kubectl scale`) rather than modifying pods directly.

---

## 🛠️ Essential Kubernetes Inspection & Operations

Below is a reference list of commands for inspecting, managing, and troubleshooting your deployment.

### 1. Basic Inspection Commands
Use these commands to view the state of your cluster:

```bash
# List all active Pods and their running status
kubectl get pods

# List all Services, their ClusterIPs, and exposed ports
kubectl get services

# List all Deployments and replica counts
kubectl get deployments

# List all ConfigMaps
kubectl get configmaps
```

### 2. Troubleshooting & Log Analysis
When a service is not behaving as expected, use these commands to inspect internal status:

```bash
# View the detailed configuration, status, and event history of a pod
kubectl describe pod <POD_NAME>

# Stream the logs of a specific pod
kubectl logs <POD_NAME>

# Stream logs of all pods sharing the same app label
kubectl logs -l app=backend --tail=50
kubectl logs -l app=frontend --tail=50

# Open an interactive shell inside a running container for debugging
kubectl exec -it <POD_NAME> -- /bin/bash
```

### 3. Scaling & Lifecycle Operations
Manage resources gracefully at the Deployment level:

```bash
# Scale the backend deployment to 3 active replicas (pods)
kubectl scale deployment backend-deployment --replicas=3

# Scale the backend deployment back down to 1 replica
kubectl scale deployment backend-deployment --replicas=1

# Gracefully restart all pods under a deployment (useful to reload ConfigMap or env updates)
kubectl rollout restart deployment frontend-deployment
kubectl rollout restart deployment backend-deployment

# Check the status of a rollout restart
kubectl rollout status deployment frontend-deployment
```

---

## 🧹 Cleaning Up

To remove all deployed resources and free up system memory:

```bash
# Delete all resources created by the YAML configuration
kubectl delete -f k8s-simple.yaml

# Stop the local Minikube cluster
minikube stop
```
