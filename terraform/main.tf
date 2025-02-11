# Terraform main file

resource "azurerm_resource_group" "bigbank_rg" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_storage_account" "bigbank_storage" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.bigbank_rg.name
  location                 = azurerm_resource_group.bigbank_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "bigbank_plan" {
  name                = "BigBankServicePlan"
  resource_group_name = azurerm_resource_group.bigbank_rg.name
  location            = azurerm_resource_group.bigbank_rg.location
  os_type             = "Linux"
  sku_name            = "B1"  # Free: F1 | Cheap: B1
}

resource "azurerm_app_service" "bigbank_app" {
  name                = "BigBankApp"
  location            = azurerm_resource_group.bigbank_rg.location
  resource_group_name = azurerm_resource_group.bigbank_rg.name
  app_service_plan_id = azurerm_service_plan.bigbank_plan.id  # ✅ Fixed Reference

  site_config {
    linux_fx_version = "DOCKER|mydockerhub/bigbank-app:latest"
  }
}
