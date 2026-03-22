package main

import (
	"embed"

	"fmt"
	"factureapp/backend/logger"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Initialize logger
	appLogger, err := logger.NewFileLogger()
	if err != nil {
		println("Warning: Could not initialize file logger:", err.Error())
	} else {
		defer appLogger.Close()
		appLogger.Info("--- Démarrage de RetailManager ---")
	}

	// Panic recovery to log to file
	defer func() {
		if r := recover(); r != nil {
			if appLogger != nil {
				appLogger.Error(fmt.Sprintf("PANIC RÉCUPÉRÉ: %v", r))
			} else {
				fmt.Printf("PANIC: %v\n", r)
			}
		}
	}()

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "RetailManager",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Logger: appLogger,
	})

	if err != nil {
		if appLogger != nil {
			appLogger.Error(fmt.Sprintf("Erreur Critique Wails: %v", err))
		}
		println("Error:", err.Error())
	}
}
