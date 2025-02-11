terraform {
  backend "azurerm" {
    resource_group_name  = "BigBank-RG"
    storage_account_name = "bigbankterraformstate"
    container_name       = "terraform-state"
    key                  = "terraform.tfstate"
  }
}
