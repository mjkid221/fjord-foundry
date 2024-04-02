terraform {
  required_providers {

    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 3.0"
    }

    gitlab = {
      source  = "gitlabhq/gitlab"
      version = "3.13.0"
    }

  }
}



