# Deployment Script for Saathi on GCP
$ErrorActionPreference = "Stop"

Write-Host "Verifying 'kubectl' tool is installed..."
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "Installing kubectl via gcloud..."
    gcloud components install kubectl -q
}

Write-Host "Checking for gcloud project configuration..."
$PROJECT_ID = gcloud config get-value project
if (-not $PROJECT_ID) {
    Write-Host "No GCP project configured. Please run 'gcloud init' before running this script!"
    exit 1
}
Write-Host "Deploying to project: $PROJECT_ID"

# Enable required APIs
Write-Host "Enabling necessary GCP APIs (GKE, Cloud Build)..."
gcloud services enable container.googleapis.com cloudbuild.googleapis.com

# Create cluster if it doesn't exist
Write-Host "Checking for GKE cluster 'saathi-cluster'..."
$CLUSTER_EXISTS = (gcloud container clusters list --filter="name=saathi-cluster" --format="value(name)")
if ([string]::IsNullOrWhiteSpace($CLUSTER_EXISTS)) {
    Write-Host "Creating GKE Autopilot cluster (this takes several minutes)..."
    gcloud container clusters create-auto saathi-cluster --region=us-central1
} else {
    Write-Host "Cluster 'saathi-cluster' already exists."
}

# Get credentials for kubectl
gcloud container clusters get-credentials saathi-cluster --region=us-central1

# Build and Push Backend
Write-Host "Building and pushing Backend image using Cloud Build..."
Set-Location -Path ".\backend"
gcloud builds submit --tag gcr.io/$PROJECT_ID/saathi-backend:v1 .
Set-Location -Path ".."

# Build and Push Frontend
Write-Host "Building and pushing Frontend image using Cloud Build..."
Set-Location -Path ".\frontend"
gcloud builds submit --tag gcr.io/$PROJECT_ID/saathi-frontend:v1 .
Set-Location -Path ".."

# Update Kubernetes manifests with the actual Project ID
Write-Host "Updating K8s manifests with project ID..."
(Get-Content .\infra\k8s\frontend-deployment.yaml) -replace 'YOUR_PROJECT_ID', $PROJECT_ID | Set-Content .\infra\k8s\frontend-deployment.yaml
(Get-Content .\infra\k8s\backend-deployment.yaml) -replace 'YOUR_PROJECT_ID', $PROJECT_ID | Set-Content .\infra\k8s\backend-deployment.yaml

# Apply K8s manifests
Write-Host "Applying Kubernetes manifests..."
kubectl apply -f infra/k8s/backend-deployment.yaml
kubectl apply -f infra/k8s/frontend-deployment.yaml

Write-Host "Deployment initiated successfully!"
Write-Host "Run 'kubectl get services' periodically to see when the External IP targets are assigned."
