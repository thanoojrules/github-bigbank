# Terraform variables

variable "location" {
  description = "Azure Region"
  default     = "East US"
}

variable "resource_group_name" {
  description = "Resource Group Name"
  default     = "BigBank-RG"
}

variable "storage_account_name" {
  description = "Storage Account for Terraform State"
  default     = "bigbankterraformstate"
}
