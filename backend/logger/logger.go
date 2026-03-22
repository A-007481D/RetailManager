package logger

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

// FileLogger implements the Wails Logger interface
type FileLogger struct {
	file *os.File
}

// NewFileLogger creates a new logger that outputs to a file in AppData
func NewFileLogger() (*FileLogger, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "."
	}

	appDir := filepath.Join(configDir, "FactureApp")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return nil, err
	}

	logPath := filepath.Join(appDir, "app.log")
	
	// Open file in append mode, create if not exists
	file, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}

	return &FileLogger{file: file}, nil
}

func (f *FileLogger) log(level string, message string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	formattedMessage := fmt.Sprintf("[%s] %s: %s\n", timestamp, level, message)
	
	// Write to file
	if f.file != nil {
		io.WriteString(f.file, formattedMessage)
	}
	
	// Also print to stdout for dev mode visibility
	fmt.Print(formattedMessage)
}

func (f *FileLogger) Print(message string) { f.log("PRINT", message) }
func (f *FileLogger) Trace(message string) { f.log("TRACE", message) }
func (f *FileLogger) Debug(message string) { f.log("DEBUG", message) }
func (f *FileLogger) Info(message string)  { f.log("INFO", message) }
func (f *FileLogger) Warning(message string) { f.log("WARN", message) }
func (f *FileLogger) Error(message string)   { f.log("ERROR", message) }
func (f *FileLogger) Fatal(message string)   { f.log("FATAL", message); os.Exit(1) }

// Close closes the log file
func (f *FileLogger) Close() {
	if f.file != nil {
		f.file.Close()
	}
}
