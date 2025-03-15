provider "aws" {
  region = var.region
  default_tags {
    tags = var.common_tags
  }
}

# EKS Cluster Definition
resource "aws_eks_cluster" "main" {
  name     = "${var.project_name}-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = var.endpoint_public_access
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  # Ensure that IAM Role permissions are created before and deleted after EKS Cluster handling
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.eks_cluster_AmazonEKSVPCResourceController,
    aws_cloudwatch_log_group.eks_cluster,
  ]

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-eks-cluster"
    }
  )
}

# CloudWatch Log Group for EKS Control Plane Logs
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.project_name}-cluster/cluster"
  retention_in_days = 30

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-eks-logs"
    }
  )
}

# KMS Key for EKS encryption
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-eks-kms"
    }
  )
}

# Node Groups with auto-scaling configurations
resource "aws_eks_node_group" "general" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-general"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = aws_subnet.private[*].id

  ami_type       = "AL2_x86_64"
  instance_types = var.node_instance_types
  capacity_type  = "ON_DEMAND"
  disk_size      = 50

  scaling_config {
    desired_size = var.node_group_desired_size
    max_size     = var.node_group_max_size
    min_size     = var.node_group_min_size
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role = "general"
  }

  # Ensure that IAM Role permissions are created before and deleted after EKS Node Group handling
  depends_on = [
    aws_iam_role_policy_attachment.eks_node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks_node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.eks_node_AmazonEC2ContainerRegistryReadOnly,
  ]

  # Cost optimization through auto-scaling
  tags = merge(
    var.common_tags,
    {
      Name                                                    = "${var.project_name}-eks-node-group"
      "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
      "k8s.io/cluster-autoscaler/enabled"                     = "true"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Fargate profile for serverless workloads
resource "aws_eks_fargate_profile" "serverless" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "${var.project_name}-serverless"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution_role.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = "serverless"
    labels = {
      environment = "production"
      workload    = "serverless"
    }
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-fargate-profile"
    }
  )
}

# EKS Add-ons
resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "vpc-cni"
  addon_version               = var.vpc_cni_version
  resolve_conflicts_on_create = "OVERWRITE"
  service_account_role_arn    = aws_iam_role.vpc_cni_role.arn
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-vpc-cni-addon"
    }
  )
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "kube-proxy"
  addon_version               = var.kube_proxy_version
  resolve_conflicts_on_create = "OVERWRITE"
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-kube-proxy-addon"
    }
  )
}

resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "coredns"
  addon_version               = var.coredns_version
  resolve_conflicts_on_create = "OVERWRITE"
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-coredns-addon"
    }
  )
}

# Security Group for EKS Cluster
resource "aws_security_group" "eks_cluster" {
  name        = "${var.project_name}-eks-cluster-sg"
  description = "Security group for EKS cluster"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-eks-cluster-sg"
    }
  )
}

resource "aws_security_group_rule" "eks_cluster_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.eks_cluster.id
}

# Outputs
output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
}

output "eks_node_group_id" {
  description = "EKS Node Group ID"
  value       = aws_eks_node_group.general.id
}

output "eks_fargate_profile_id" {
  description = "EKS Fargate Profile ID"
  value       = aws_eks_fargate_profile.serverless.id
} 