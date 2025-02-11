terraform {
  required_version = ">= 1.0.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}

  # ❌ REMOVE: `resource_provider_registrations = "automatic"`
  # ✅ Instead, manually register missing providers using Azure CLI:
  # az provider register --namespace "Microsoft.Resources"
  # az provider register --namespace "Microsoft.Storage"
  # az provider register --namespace "Microsoft.Network"
  # az provider register --namespace "Microsoft.Compute"
  # az provider register --namespace "Microsoft.ContainerService"
}