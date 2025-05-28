# P2P Backend Development

## Initial Setup

- [x] Review technical design document
- [x] Create initial directory structure
- [x] Initialize npm project and package.json
- [x] Set up TypeScript configuration

## Minimal Viable Components

- [x] Set up Express server with basic configuration
- [x] Implement rooms API endpoints (POST /rooms, GET /rooms)

## WebSocket and Redis Integration

- [x] Implement WebSocket server for signaling
- [x] Set up Redis pub/sub adapter for message fan-out
- [x] Write tests for WebSocket and Redis integration
- [x] Document WebSocket signaling implementation

## Convex Integration

- [x] Set up Convex client and connection
- [x] Implement user management functions
- [x] Implement room persistence with Convex
- [x] Implement hash storage and retrieval
- [x] Write tests for Convex integration

## TURN Integration

- [ ] Implement TURN credential issuance endpoint
- [ ] Set up credential rotation mechanism
- [ ] Write tests for TURN credential functionality

## Deployment and Operations

- [x] Create Kubernetes deployment manifests
- [x] Set up service and ingress configurations
- [x] Document deployment process
