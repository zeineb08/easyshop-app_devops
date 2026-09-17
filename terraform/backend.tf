terraform {
  backend "s3" {
    bucket         = "terraform-state-bucket2002"
    key            = "dev/terraform.tfstate"
    region         = "eu-central-1"
    use_lockfile  = "true"
    encrypt        = true
  }
}