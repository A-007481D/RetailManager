# Makefile for RetailManager (formerly FactureApp)

# Variables
BINARY_NAME=RetailManager
BUILD_DIR=build/bin
WAILS_CMD=$(shell go env GOPATH)/bin/wails

# Detect OS
UNAME_S := $(shell uname -s)

.PHONY: all build run install-deps clean dev help

help: ## Show this help message
	@echo 'Usage:'
	@echo '  make [target]'
	@echo ''
	@echo 'Targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install-deps: ## Install necessary dependencies (Wails, System libs)
	@echo "Checking dependencies..."
	@if ! [ -x "$(WAILS_CMD)" ]; then \
		echo "Installing Wails..."; \
		go install github.com/wailsapp/wails/v2/cmd/wails@latest; \
	else \
		echo "Wails is already installed."; \
	fi
	@echo "Checking system libraries..."
ifeq ($(UNAME_S),Linux)
	@dpkg -s libwebkit2gtk-4.1-dev >/dev/null 2>&1 || dpkg -s libwebkit2gtk-4.0-dev >/dev/null 2>&1 || (echo "MISSING: libwebkit2gtk-4.1-dev. Please run: sudo apt install libwebkit2gtk-4.1-dev" && exit 1)
	@dpkg -s libgtk-3-dev >/dev/null 2>&1 || (echo "MISSING: libgtk-3-dev. Please run: sudo apt install libgtk-3-dev" && exit 1)
	@echo "System libraries look good."
endif

build: install-deps ## Build the application
	@echo "Building $(BINARY_NAME)..."
	@$(WAILS_CMD) build -tags webkit2_41 -o $(BINARY_NAME)

run: ## Run the built application
	@echo "Running $(BINARY_NAME)..."
	@if [ -f "$(BUILD_DIR)/$(BINARY_NAME)" ]; then \
		"$(BUILD_DIR)/$(BINARY_NAME)"; \
	else \
		echo "Binary not found. Please run 'make build' first."; \
		exit 1; \
	fi

dev: ## Run in development mode (hot reload)
	@echo "Starting development mode..."
	@$(WAILS_CMD) dev

clean: ## Clean build artifacts
	@echo "Cleaning..."
	@rm -rf build/bin/$(BINARY_NAME)
