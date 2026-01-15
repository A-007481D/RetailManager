# RetailManager - Guide de Mise à Jour Windows

## 🔄 Comment Mettre à Jour

1. **Téléchargez** le nouveau fichier d'installation
2. **Lancez** l'installateur (double-clic)
3. **Suivez** les étapes → Terminé!

**Vos données (factures, clients, produits) sont automatiquement préservées!**

---

## ⚠️ Message "Application Non Reconnue"

Windows affiche parfois cet avertissement pour les logiciels non-certifiés:

![Windows SmartScreen](https://i.imgur.com/placeholder.png)

### Comment Continuer:
1. Cliquez sur **"Informations complémentaires"**
2. Cliquez sur **"Exécuter quand même"**

> ⚡ **C'est normal et sécuritaire!** Ce message apparaît car l'application n'a pas de certificat payant (~300€/an). Le logiciel est sûr.

---

## 📁 Où Sont Mes Données?

Vos données sont stockées séparément du programme:
```
C:\Users\[VotreNom]\AppData\Roaming\FactureApp\invoices.db
```

Cela signifie:
- ✅ Désinstaller/réinstaller ne supprime pas vos données
- ✅ Les mises à jour préservent vos données
- ✅ Vous pouvez copier ce fichier pour faire une sauvegarde

---

## 💾 Sauvegarde (Optionnel)

Pour sauvegarder vos données:
1. Appuyez sur `Win + R`
2. Tapez `%AppData%\FactureApp` et appuyez Entrée
3. Copiez `invoices.db` vers un emplacement sûr (clé USB, cloud, etc.)
