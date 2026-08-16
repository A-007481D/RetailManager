#!/bin/bash
export PATH=$PATH:$(go env GOPATH)/bin

echo "Checking for Windows cross-compiler (mingw-w64-gcc)..."
if ! command -v x86_64-w64-mingw32-gcc &> /dev/null; then
    echo "Installing Windows compiler. You may be prompted for your sudo password..."
    sudo pacman -S --noconfirm mingw-w64-gcc
fi

echo "Building the Windows release..."
# Ensure frontend dependencies are installed
npm install --prefix frontend

# Build for Windows 64-bit
wails build -platform windows/amd64

echo "Build complete! Check the build/bin directory for the .exe file."
