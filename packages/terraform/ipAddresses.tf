resource "google_compute_global_address" "production" {
  name = "${var.project_slug}-production-ip"
}

resource "google_compute_global_address" "staging" {
  name = "${var.project_slug}-staging-ip"
}

resource "google_compute_global_address" "dev" {
  name = "${var.project_slug}-dev-ip"
}

variable "cloudflare_email" {}

variable "cloudflare_api_key" {}

variable "cloudflare_zone_id" {}

variable "project_slug" {}

provider "cloudflare" {
  email     = var.cloudflare_email
  api_token = var.cloudflare_api_key
}

# Create a record
resource "cloudflare_record" "production" {
  zone_id = var.cloudflare_zone_id
  name    = var.project_slug
  value   = google_compute_global_address.production.address
  type    = "A"
  ttl     = 3600
  proxied = false
}

resource "cloudflare_record" "staging" {
  zone_id = var.cloudflare_zone_id
  name    = "${var.project_slug}-staging"
  value   = google_compute_global_address.staging.address
  type    = "A"
  ttl     = 3600
  proxied = false

}

resource "cloudflare_record" "dev" {
  zone_id = var.cloudflare_zone_id
  name    = "${var.project_slug}-dev"
  value   = google_compute_global_address.dev.address
  type    = "A"
  ttl     = 3600
  proxied = false
}