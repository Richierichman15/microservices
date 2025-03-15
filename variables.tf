variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project, used as a prefix for resources"
  type        = string
  default     = "microservice"
}

variable "common_tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "microservice"
    Environment = "production"
    Terraform   = "true"
    Owner       = "DevOps"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "kubernetes_version" {
  description = "Kubernetes version to use for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "endpoint_public_access" {
  description = "Whether the EKS cluster API server is publicly accessible"
  type        = bool
  default     = true
}

variable "node_instance_types" {
  description = "Instance types for the EKS node group"
  type        = list(string)
  default     = ["t3.medium", "t3a.medium"]
}

variable "node_group_desired_size" {
  description = "Desired size of the EKS node group"
  type        = number
  default     = 2
}

variable "node_group_min_size" {
  description = "Minimum size of the EKS node group"
  type        = number
  default     = 1
}

variable "node_group_max_size" {
  description = "Maximum size of the EKS node group"
  type        = number
  default     = 5
}

variable "vpc_cni_version" {
  description = "Version of the VPC CNI addon to use"
  type        = string
  default     = "v1.15.4-eksbuild.1"
}

variable "kube_proxy_version" {
  description = "Version of the kube-proxy addon to use"
  type        = string
  default     = "v1.28.1-eksbuild.1"
}

variable "coredns_version" {
  description = "Version of the CoreDNS addon to use"
  type        = string
  default     = "v1.10.1-eksbuild.6"
} 