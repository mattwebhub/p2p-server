# P2P Backend Kubernetes Deployment Guide

This guide provides instructions for deploying the P2P Backend API to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster with NGINX Ingress Controller
- `kubectl` configured to access your cluster
- Access to GitHub Container Registry (ghcr.io)
- DNS configured for your domain (api.webserver.example.com and ws.webserver.example.com)

## Deployment Structure

The deployment is organized as follows:

```
infra/
├── helm/
│   └── backend-api/
│       ├── deployment.yaml
│       ├── service.yaml
│       └── ingress.yaml
└── prod/
    ├── kustomization.yaml
    └── convex-secrets.env
```

## Pre-Deployment Steps

1. **Create the namespace**:

   ```bash
   kubectl create namespace p2p-webserver
   ```

2. **Configure secrets**:
   - Update `infra/prod/convex-secrets.env` with your actual Convex credentials
   - Update the TURN shared secret in `infra/prod/kustomization.yaml`

3. **Configure image pull secrets** (if needed):

   ```bash
   kubectl create secret docker-registry ghcr-pull-secret \
     --namespace p2p-webserver \
     --docker-server=ghcr.io \
     --docker-username=YOUR_GITHUB_USERNAME \
     --docker-password=YOUR_GITHUB_TOKEN
   ```

4. **Configure TLS** (if needed):

   ```bash
   kubectl create secret tls webserver-tls-secret \
     --namespace p2p-webserver \
     --cert=/path/to/tls.crt \
     --key=/path/to/tls.key
   ```

## Deployment

Deploy using kustomize:

```bash
kubectl apply -k infra/prod
```

## Verification

1. **Check deployment status**:

   ```bash
   kubectl get deployments -n p2p-webserver
   ```

2. **Check pod status**:

   ```bash
   kubectl get pods -n p2p-webserver
   ```

3. **Check service**:

   ```bash
   kubectl get svc -n p2p-webserver
   ```

4. **Check ingress**:

   ```bash
   kubectl get ingress -n p2p-webserver
   ```

5. **Test the API**:

   ```bash
   curl https://api.webserver.example.com/healthz
   ```

## Scaling

The deployment is configured with an initial replica count of 2. To scale:

```bash
kubectl scale deployment backend-api -n p2p-webserver --replicas=4
```

## Troubleshooting

1. **Check pod logs**:

   ```bash
   kubectl logs -n p2p-webserver deployment/backend-api
   ```

2. **Check pod events**:

   ```bash
   kubectl describe pod -n p2p-webserver -l app=backend-api
   ```

3. **Common Issues and Solutions**:

   - **Image Pull Errors**:
     - Verify the image pull secret exists: `kubectl get secret ghcr-pull-secret -n p2p-webserver`
     - Check if the image exists in the registry
     - Ensure credentials are correct

   - **Pod Startup Issues**:
     - Check resource constraints: `kubectl describe nodes`
     - Verify environment variables and secrets are properly configured
     - Check for networking issues with CNI plugins

   - **Ingress Not Working**:
     - Verify the ingress controller is running: `kubectl get pods -n ingress-nginx`
     - Check DNS resolution for your domain
     - Verify TLS certificate is valid

   - **Service Connection Issues**:
     - Test service connectivity within the cluster: `kubectl run -it --rm debug --image=curlimages/curl -- curl backend-api:3000/healthz`
     - Verify service selectors match pod labels

## Next Steps

After deploying the backend-api, you'll need to:

1. Deploy Redis for signaling
2. Deploy coturn for WebRTC relay
3. Configure Convex for data persistence

These components will be added in future deployment configurations.
