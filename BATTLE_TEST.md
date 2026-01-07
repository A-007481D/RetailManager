# 🧪 Battle Test Plan - RetailManager v1.1.0

**Goal**: Try to break the app and verify all error handling works correctly.

---

## ✅ TEST CHECKLIST

### 🔴 **CRITICAL TESTS** (Must Pass)

#### Test 1: Duplicate Product Reference
**Steps:**
1. Go to "Stock & Produits"
2. Create a product: `REF-TEST-001`, Name: "Test Product", Price: 100
3. Try to create another product with SAME reference: `REF-TEST-001`

**Expected Result:**
- ❌ Should FAIL with French error: "un produit avec la référence 'REF-TEST-001' existe déjà"
- ✅ Error should have X button to dismiss
- ✅ Error should NOT auto-disappear

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 2: Duplicate Client ICE
**Steps:**
1. Go to "Clients"
2. Create client: Name: "Client Test", ICE: "123456789012345", City: "Casablanca"
3. Try to create another client with SAME ICE: "123456789012345"

**Expected Result:**
- ❌ Should FAIL with: "un client avec l'ICE '123456789012345' existe déjà"
- ✅ Error dismissable with X

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 3: Delete Product in Use
**Steps:**
1. Create a new product: `REF-DELETE-TEST`, Price: 50
2. Create an invoice using this product (any client, any quantity)
3. Go back to "Stock & Produits"
4. Try to DELETE the product you just used in invoice

**Expected Result:**
- ❌ Should BLOCK deletion with: "impossible de supprimer ce produit car il est utilisé dans X facture(s)"
- ✅ Shows count of invoices using it

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 4: Delete Client with Invoices
**Steps:**
1. Go to "Clients"
2. Find a client that has invoices (or create one and make an invoice)
3. Try to DELETE that client

**Expected Result:**
- ❌ Should BLOCK with: "impossible de supprimer ce client car il a X facture(s) associée(s)"
- ✅ Shows count of invoices

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 5: Insufficient Stock
**Steps:**
1. Create product: `REF-STOCK-TEST`, Initial Stock: 5
2. Create invoice with quantity: 10 (more than available)

**Expected Result:**
- ❌ Should FAIL with: "stock insuffisant pour 'REF-STOCK-TEST' (demandé: 10, disponible: 5)"
- ✅ Shows exact quantities

**Status:** [ ] PASS / [ ] FAIL

---

### 🟡 **VALIDATION TESTS** (Error Messages)

#### Test 6: Empty Product Fields
**Steps:**
1. Try to create product with:
   - Empty reference
   - Empty name
   - Negative price

**Expected Result:**
- ❌ "la référence est obligatoire"
- ❌ "le nom du produit est obligatoire"
- ❌ "le prix de vente ne peut pas être négatif"

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 7: Invalid Client ICE
**Steps:**
1. Try to create client with ICE: "123" (too short)
2. Try with ICE: "12345678901234567890" (too long)
3. Try with ICE: "abcdefghijklmno" (non-numeric)

**Expected Result:**
- ❌ "l'ICE doit contenir exactement 15 chiffres"
- ✅ Form shows character counter

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 8: Empty Client Required Fields
**Steps:**
1. Try to create client without:
   - Name
   - City

**Expected Result:**
- ❌ "le nom du client est obligatoire"
- ❌ "la ville est obligatoire"

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 9: Invalid Invoice Items
**Steps:**
1. Create invoice and try:
   - No items (empty invoice)
   - Item with quantity = 0
   - Item with quantity = 200,000 (excessive)
   - Item with no product selected
   - Item with empty description

**Expected Result:**
- ❌ "la facture doit contenir au moins un article"
- ❌ "article X: la quantité doit être supérieure à 0"
- ❌ "article X: quantité excessive (200000). Maximum: 100,000"
- ❌ "article X: aucun produit sélectionné"
- ❌ "article X: la description est obligatoire"

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 10: Invalid Invoice Date/Year
**Steps:**
1. Try to create invoice with date from year 1899
2. Try with year 3000

**Expected Result:**
- ❌ "année invalide: XXXX (doit être entre 1900 et 2100)"

**Status:** [ ] PASS / [ ] FAIL

---

### 🟢 **UX TESTS** (User Experience)

#### Test 11: Error Dismissal
**Steps:**
1. Trigger any error (e.g., duplicate product)
2. Wait 10 seconds
3. Click the X button

**Expected Result:**
- ✅ Error should STAY visible for 10+ seconds (not auto-dismiss)
- ✅ Clicking X should dismiss it
- ✅ X button should be visible and clickable

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 12: Success Auto-Fade
**Steps:**
1. Create a new valid product
2. Watch the success message

**Expected Result:**
- ✅ Green success alert appears
- ✅ Auto-disappears after ~3 seconds
- ✅ Message: "Produit créé avec succès"

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 13: Multiple Errors
**Steps:**
1. Trigger error (duplicate product)
2. Don't dismiss it
3. Trigger another error (duplicate client)

**Expected Result:**
- ✅ New error should replace old one
- OR
- ✅ Should show most recent error

**Status:** [ ] PASS / [ ] FAIL

---

### 📄 **PDF TESTS**

#### Test 14: View PDF
**Steps:**
1. Go to Dashboard
2. Click eye icon (Voir PDF) on any invoice

**Expected Result:**
- ✅ PDF should open in default viewer (Evince, Okular, etc. on Linux)
- ✅ If fails, should show French error message

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 15: Print PDF (Linux without printer)
**Steps:**
1. Click printer icon on any invoice (assuming no printer configured)

**Expected Result:**
- ❌ Should show: "impossible d'imprimer: vérifiez qu'une imprimante est configurée (CUPS)..."
- ✅ Error should suggest using "Voir PDF" instead

**Status:** [ ] PASS / [ ] FAIL

---

### 🎨 **VISUAL TESTS**

#### Test 16: Version Display
**Steps:**
1. Go to Dashboard
2. Scroll to bottom

**Expected Result:**
- ✅ Should see: "RetailManager v1.1.0 · © 2026 A-007481D"
- ✅ Gray text, centered
- ✅ Version should match app.go constant

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 17: Alert Visual Design
**Steps:**
1. Trigger an error
2. Trigger a success

**Expected Result:**
- ✅ Error: Red background, warning icon, X button
- ✅ Success: Green background, checkmark icon
- ✅ Both: Professional appearance, readable text

**Status:** [ ] PASS / [ ] FAIL

---

## 🔥 STRESS TESTS

#### Test 18: Rapid Fire Operations
**Steps:**
1. Quickly create 5 products back-to-back
2. Quickly delete non-used products
3. Spam click "Nouveau Produit" button

**Expected Result:**
- ✅ No crashes
- ✅ No UI freezing
- ✅ All operations complete or show errors

**Status:** [ ] PASS / [ ] FAIL

---

#### Test 19: Search Performance
**Steps:**
1. Create 20+ products
2. Go to "Factures"
3. Type quickly in product search field

**Expected Result:**
- ✅ Search should debounce (not search every keystroke)
- ✅ No lag or freeze
- ✅ Results appear smoothly

**Status:** [ ] PASS / [ ] FAIL

---

## 📊 RESULTS SUMMARY

**Total Tests**: 19
**Pass**: ___
**Fail**: ___
**Pass Rate**: ___%

---

## 🐛 BUGS FOUND

List any bugs discovered during testing:

1. 
2. 
3. 

---

## ✅ FINAL CHECKLIST

Before releasing v1.1.0:

- [ ] All CRITICAL tests pass
- [ ] At least 90% of all tests pass
- [ ] All bugs documented (even if not fixed)
- [ ] No crashes or data corruption
- [ ] Error messages are clear and in French
- [ ] PDF operations work on target platform
- [ ] Version number displays correctly

---

## 🚀 RELEASE DECISION

**Ready for v1.1.0 Release?** YES / NO

**Notes:**


**Tester**: _______________
**Date**: 2026-01-07
