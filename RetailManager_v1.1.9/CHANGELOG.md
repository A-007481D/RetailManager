# Changelog

All notable changes to RetailManager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.8] - 2026-03-22

### Added
- **Impression Groupée (Bulk Printing)** : Possibilité de sélectionner plusieurs factures dans la liste et de les imprimer toutes en une seule fois.
- **Raccourci Bureau** : L'installateur propose désormais une case à cocher pour créer un raccourci sur le bureau à la fin de l'installation.
- **Identité RetailManager** : Finalisation du renommage de l'application (Titre de fenêtre et Installateur).

### Changed
- **Visibilité du Tableau de Bord** : Le nombre de factures récentes affichées est passé de 5 à **15**.
- **Nettoyage Automatique** : L'installateur supprime désormais les anciens raccourcis "FactureApp" pour éviter les doublons.

---

## [1.1.7] - 2026-03-21

### Added
- **Windows Compatibility Fix**: Support for Windows 7 (SP1), Windows 8, and Windows 10/11 with compatibility shims. Fixed the "Windows 10 only" error on some systems.
- **Enhanced Data Protection**: Improved internal database connection handling and migration safety.
- **Reliable Startup**: Added extra checks for system configuration directory accessibility.

### Changed
- Lowered installer minimum OS requirement to Windows 7 to handle OS version reporting issues on Windows 11.

---

## [1.1.6] - 2026-02-11

### Added
- **Backup & Restore**: New UI buttons on Dashboard to manually save and restore database files.
- **Auto-Backup**: Automatically creates a safety copy before database restoration.

---

## [1.1.0] - 2026-01-07

### Added
- **Comprehensive French Error Handling**: All error messages across all modules now in French
- **Data Loss Prevention**: 
  - Cannot delete products that are used in invoices
  - Cannot delete clients that have invoices
  - Clear error messages showing count of dependencies
- **Advanced Invoice Validation**:
  - Empty invoice check
  - Product selection validation
  - Quantity validation (positive, max 100,000)
  - Price validation (positive)
  - Description required
  - Year range validation (1900-2100)
- **Duplicate Detection**:
  - Product reference uniqueness with French error
  - Client ICE uniqueness with French error
- **Better PDF Error Messages**:
  - File existence checks
  - Helpful disk/permission error messages in French
  - Cross-platform support (Windows/Linux/macOS)
- **Improved Error UX**:
  - Manual error dismissal with X button (errors stay until dismissed)
  - Success notifications auto-fade after 3 seconds
  - Prominent red/green alert displays
- **Success State**: Added success notifications for all operations
- **Windows Metadata**: Proper exe name, icon, and version info for professional appearance

### Changed
- Error messages no longer auto-dismiss (manual close with × button)
- Success messages auto-dismiss after 3 seconds
- OpenPDF now uses native commands for each OS (xdg-open, cmd start, open)
- PrintPDF provides helpful error when printer not configured

### Fixed
- Duplicate product creation error (now shows clear French message)
- PDF view button not working on Linux
- PDF print button silent failures
- Intermittent product creation errors around 20 items
- TypeScript compatibility warnings
- **Stock validation errors not displaying** - Fixed error message extraction to show specific French errors from backend

### Technical
- Added unique constraint on `clients.ice` field
- Improved error extraction from backend responses
- Added `clearError()` function to all frontend hooks
- Cross-platform PDF handling with proper error propagation

---

## [1.0.0] - 2026-01-02

### Added
- Initial release
- Invoice management with PDF generation
- Inventory tracking with stock management
- Client database
- Dashboard with analytics
- Yearly data archiving
- Real profit calculation
- Payment method handling (Cash, Cheque, Effet)

[1.1.0]: https://github.com/yourusername/RetailManager/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yourusername/RetailManager/releases/tag/v1.0.0
