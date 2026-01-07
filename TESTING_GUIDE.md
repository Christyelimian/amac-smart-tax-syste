# 🧪 ASSESSMENT SYSTEM TESTING GUIDE

## Overview
This guide provides test data and scenarios for testing the new assessment system implementation, including phone search, notice number search, and QR code scanning.

---

## 📱 1. PHONE NUMBER SEARCH TESTING

### **Test Scenario: Multiple Businesses Per Taxpayer**
- **URL**: `/pay-demand-notice`
- **Feature**: Search by phone number to see all unpaid bills

### **Test Data:**

| Phone Number | Taxpayer | Businesses | Expected Result |
|-------------|----------|------------|-----------------|
| `0801234567` | John Doe | 3 businesses | Multiple notices selection |
| `08123456789` | Mary Johnson | 1 business | Direct payment page |
| `09087654321` | Ahmed Hassan | 1 business (overdue) | Overdue notice |

### **Test Steps:**
1. Navigate to "Pay Existing Demand Notice"
2. Select "Phone Number" option
3. Enter one of the test phone numbers above
4. Click "Search Demand Notice"
5. Verify correct results appear

### **Expected Results:**

#### **0801234567 (John Doe - Multiple Businesses)**
```
Shows selection screen with:
🏨 Transcorp Hilton Hotel - ₦1,275,000
🛒 John Doe Supermarket - ₦75,000
🍽️ JD Fast Food Restaurant - ₦125,000

Click any business → Proceed to payment
```

#### **08123456789 (Mary Johnson - Single Business)**
```
Direct payment page:
MJ Fashion Boutique - ₦95,000
Due: Feb 14, 2026
```

#### **09087654321 (Ahmed Hassan - Overdue)**
```
Overdue notice (red status):
Residential Property - ₦285,000
Due: Dec 31, 2025 (OVERDUE)
```

---

## 🔢 2. DEMAND NOTICE NUMBER SEARCH TESTING

### **Test Scenario: Direct Notice Lookup**
- **URL**: `/pay-demand-notice`
- **Feature**: Search by specific demand notice number

### **Test Data:**

| Notice Number | Business | Amount | Status |
|---------------|----------|--------|--------|
| `DN-2026-001234` | Transcorp Hilton Hotel | ₦1,275,000 | Unpaid |
| `DN-2026-001235` | John Doe Supermarket | ₦75,000 | Unpaid |
| `DN-2026-002001` | MJ Fashion Boutique | ₦95,000 | Unpaid |
| `DN-2025-009876` | Residential Property | ₦285,000 | Overdue |

### **Test Steps:**
1. Navigate to "Pay Existing Demand Notice"
2. Select "Demand Notice Number" option
3. Enter one of the test notice numbers above
4. Click "Search Demand Notice"
5. Verify correct notice details appear

### **Expected Results:**
- Direct navigation to payment page
- Full notice details displayed
- Correct amount and due date
- Proper status indication

---

## 📷 3. QR CODE SCANNING TESTING

### **Test Scenario: Camera QR Detection**
- **URL**: `/pay-demand-notice`
- **Feature**: Camera-based QR code scanning

### **Test Steps:**
1. Navigate to "Pay Existing Demand Notice"
2. Select "Scan QR Code" option
3. Click "Open Camera"
4. **On Mobile**: Grant camera permissions
5. **On Desktop**: May show error (expected)
6. **Demo Mode**: Wait 3-5 seconds for simulated detection

### **Expected Results:**

#### **Mobile Device (with camera):**
```
✅ Camera opens
✅ Scanning overlay appears
✅ QR code detected after 3-5 seconds
✅ Auto-fills notice number
✅ Redirects to payment page
```

#### **Desktop (no camera):**
```
❌ "Camera not supported" error
✅ "Manual Entry" fallback button
✅ Switch to manual notice entry
```

#### **Demo Simulation:**
- Camera activates (if available)
- Shows "Scanning..." message
- After 3-5 seconds: simulates finding QR code
- Cycles through test notices: `DN-2026-001234` → `DN-2026-001235` → etc.
- Auto-fills the detected notice number

---

## 🧪 4. EDGE CASES & ERROR TESTING

### **Invalid Phone Numbers:**
- **Input**: `0800000000` (non-existent)
- **Expected**: "No demand notices found" message

### **Invalid Notice Numbers:**
- **Input**: `DN-2026-999999` (non-existent)
- **Expected**: Error message with suggestion to try valid numbers

### **Empty Search:**
- **Input**: Empty field
- **Expected**: "Please enter a search value" error

### **Camera Permissions Denied:**
- **Action**: Deny camera permission when prompted
- **Expected**: Error message with manual entry option

---

## 🔧 5. BROWSER COMPATIBILITY

### **Camera Support:**
- ✅ **Chrome/Edge**: Full camera support
- ✅ **Firefox**: Camera support
- ✅ **Safari**: Camera support (iOS)
- ✅ **Mobile Browsers**: Full support
- ❌ **HTTP**: Requires HTTPS for camera
- ❌ **No Camera Hardware**: Desktop fallback

### **HTTPS Requirement:**
```javascript
// Camera access requires secure connection
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  // Show error: "Camera access requires HTTPS"
}
```

---

## 📋 6. TESTING CHECKLIST

### **Phone Search Testing:**
- [ ] Multiple businesses display correctly
- [ ] Single business goes direct to payment
- [ ] Overdue notices show red status
- [ ] Business selection works
- [ ] Payment flow completes

### **Notice Number Testing:**
- [ ] Valid numbers show correct details
- [ ] Invalid numbers show helpful error
- [ ] Case-insensitive search works
- [ ] Direct payment flow works

### **QR Code Testing:**
- [ ] Camera permission request works
- [ ] Camera preview displays
- [ ] Simulated QR detection works
- [ ] Manual fallback available
- [ ] Error handling works

### **UI/UX Testing:**
- [ ] Responsive design on mobile
- [ ] Loading states work
- [ ] Error messages are clear
- [ ] Navigation flows work
- [ ] Help section is accessible

---

## 🚀 6. QUICK START TESTING

### **Fastest Way to Test All Features:**

1. **Go to**: `http://localhost:5173/pay-demand-notice` (or your dev URL)

2. **Test Phone Search**:
   ```
   Enter: 0801234567
   Expected: 3 businesses shown
   ```

3. **Test Notice Search**:
   ```
   Enter: DN-2026-001234
   Expected: Hilton Hotel details
   ```

4. **Test QR Code**:
   ```
   Click: Scan QR Code → Open Camera
   Expected: Camera opens (mobile) or error (desktop)
   ```

### **Demo Script:**
```
1. Phone: 0801234567 → Select hotel → Pay
2. Notice: DN-2026-001235 → Direct to supermarket payment
3. QR Code → Simulated detection → Auto-fill notice
```

---

## 🔍 7. DEBUGGING TIPS

### **Common Issues:**

#### **Camera Not Working:**
```javascript
// Check browser console for errors
console.log('Camera support:', !!navigator.mediaDevices?.getUserMedia);
console.log('HTTPS:', location.protocol === 'https:');
```

#### **Search Not Finding Results:**
- Check exact test data format
- Verify no extra spaces
- Check browser network tab for failed requests

#### **UI Not Updating:**
- Check React dev tools for component state
- Verify useState hooks are working
- Check for JavaScript errors in console

### **Development Tips:**
- Use browser dev tools to simulate mobile
- Test on actual mobile device for camera
- Check network tab for API call failures
- Use React dev tools to inspect component state

---

## 📞 8. SUPPORT

If you encounter issues:
1. Check browser console for errors
2. Verify you're using test data exactly as listed
3. Try different browsers/devices
4. Check network connectivity for camera features

**All test data is hardcoded for demo purposes and will be replaced with real database queries in production.**

🎯 **Happy Testing!** Let me know if you find any issues or need additional test scenarios.</contents>
</xai:function_call">Created file TESTING_GUIDE.md
