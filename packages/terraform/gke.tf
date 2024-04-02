resource "google_artifact_registry_repository" "kubernetes" {
  location      = var.region
  repository_id = "kubernetes"
  description   = "docker repository"
  format        = "DOCKER"
}

resource "google_service_account" "default" {
  account_id   = "service-account-id"
  display_name = "GKE Service Account"
}

# GKE clusters
resource "google_container_cluster" "production" {
  name     = "${var.project_slug}-gke"
  location = var.location

  initial_node_count = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  cluster_autoscaling {
    enabled = true

    resource_limits {
      resource_type = "cpu"
      minimum       = "1"
      maximum       = "2"
    }

    resource_limits {
      resource_type = "memory"
      minimum       = "1"
      maximum       = "2"
    }
  }
}

resource "google_container_cluster" "staging" {
  name     = "${var.project_slug}-gke-staging"
  location = var.location

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name
}

resource "google_container_cluster" "dev" {
  name     = "${var.project_slug}-gke-dev"
  location = var.location

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name
}

# Separately Managed Node Pool
resource "google_container_node_pool" "production_nodes" {
  name       = google_container_cluster.production.name
  location   = var.location
  cluster    = google_container_cluster.production.name
  node_count = var.gke_num_nodes

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    service_account = google_service_account.default.email

    labels = {
      env = var.project_id
    }

    machine_type = "t2d-standard-1"
    tags         = ["gke-node", "${var.project_id}-gke"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}

resource "google_container_node_pool" "staging_nodes" {
  name       = google_container_cluster.staging.name
  location   = var.location
  cluster    = google_container_cluster.staging.name
  node_count = var.gke_num_nodes

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    service_account = google_service_account.default.email

    labels = {
      env = var.project_id
    }

    machine_type = "t2d-standard-1"
    tags         = ["gke-node", "${var.project_id}-gke"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}

resource "google_container_node_pool" "dev_nodes" {
  name       = google_container_cluster.dev.name
  location   = var.location
  cluster    = google_container_cluster.dev.name
  node_count = var.gke_num_nodes

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    service_account = google_service_account.default.email

    labels = {
      env = var.project_id
    }

    machine_type = "t2d-standard-1"
    tags         = ["gke-node", "${var.project_id}-gke"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}
