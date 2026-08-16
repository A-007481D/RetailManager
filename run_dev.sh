#!/bin/bash
export PATH=$PATH:$(go env GOPATH)/bin
go install github.com/wailsapp/wails/v2/cmd/wails@latest
npm install --prefix frontend
wails dev -tags webkit2_41
