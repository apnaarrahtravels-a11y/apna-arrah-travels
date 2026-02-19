function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Apna Arrah Travels')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ========== LOGIN VERIFICATION ==========
function verifyLogin(userId, password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("user");
    
    if (!sheet) {
      return { success: false, message: "User sheet not found!" };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 0; i < data.length; i++) {
      const sheetUserId = data[i][0] ? data[i][0].toString().trim() : "";
      const sheetPassword = data[i][1] ? data[i][1].toString().trim() : "";
      const sheetUserName = data[i][2] ? data[i][2].toString().trim() : "";
      const sheetRole = data[i][3] ? data[i][3].toString().trim() : "user";
      
      if (sheetUserId === userId.toString().trim() && sheetPassword === password.toString().trim()) {
        return {
          success: true,
          role: sheetRole || 'user',
          username: sheetUserName || userId,
          message: "Login successful!"
        };
      }
    }
    
    return { success: false, message: "Invalid User ID or Password" };
    
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

// ========== REGISTRATION ==========
function registerUser(userId, password, username) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("user");
    
    if (!sheet) {
      return { success: false, message: "User sheet not found!" };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === userId.trim()) {
        return { success: false, message: "User ID already exists!" };
      }
    }
    
    sheet.appendRow([userId.trim(), password.trim(), username.trim(), 'user']);
    return { success: true, message: "Registration successful! Please login." };
    
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

// ========== ADMIN CREATE USER ==========
function adminCreateUser(adminUserId, adminPassword, newUserData) {
  const adminCheck = verifyLogin(adminUserId, adminPassword);
  if (!adminCheck.success || adminCheck.role !== 'admin') {
    return { success: false, message: "Unauthorized: Only admin can create users" };
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("user");
    
    if (!sheet) {
      return { success: false, message: "User sheet not found!" };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === newUserData.userId.trim()) {
        return { success: false, message: "User ID already exists!" };
      }
    }
    
    sheet.appendRow([newUserData.userId.trim(), newUserData.password.trim(), newUserData.username.trim(), newUserData.role]);
    return { success: true, message: "New user created successfully!" };
    
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

// ========== TRIP FUNCTIONS ==========
function getAllTrips() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let tripSheet = ss.getSheetByName('trips');
    
    if (!tripSheet) {
      tripSheet = ss.insertSheet('trips');
      tripSheet.appendRow(['Month', 'Trip Name', 'Date', 'Destination', 'Price', 'Status']);
      return [];
    }
    
    const data = tripSheet.getDataRange().getValues();
    
    let monthWiseTrips = {};
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (let i = 1; i < data.length; i++) {
      let month = data[i][0] || 'Other';
      if (!monthWiseTrips[month]) {
        monthWiseTrips[month] = [];
      }
      monthWiseTrips[month].push({
        tripName: data[i][1] || 'N/A',
        date: data[i][2] || 'N/A',
        destination: data[i][3] || 'N/A',
        price: data[i][4] || 'N/A',
        status: data[i][5] || 'Available'
      });
    }
    
    return {
      success: true,
      monthWiseTrips: monthWiseTrips,
      months: months
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ========== SAVE BOOKING ==========
function saveBooking(bookingData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let bookingSheet = ss.getSheetByName('booking');
    
    if (!bookingSheet) {
      bookingSheet = ss.insertSheet('booking');
      bookingSheet.appendRow([
        'Booking ID', 'Booking Date', 'Customer Name', 'Phone Number', 
        'Vehicle Type', 'Pickup Location', 'Drop Location', 'Pickup Time',
        'Total Amount', 'Received Amount', 'Pending Amount', 'Status', 'Created By', 'Timestamp'
      ]);
    }
    
    const lastRow = bookingSheet.getLastRow();
    const bookingId = 'BK' + (lastRow).toString().padStart(5, '0');
    
    const pendingAmount = parseFloat(bookingData.totalAmount) - parseFloat(bookingData.receivedAmount);
    
    const now = new Date();
    const timestamp = now.toLocaleString();
    
    bookingSheet.appendRow([
      bookingId,
      bookingData.bookingDate,
      bookingData.customerName,
      bookingData.phoneNumber,
      bookingData.vehicleType,
      bookingData.pickupLocation,
      bookingData.dropLocation,
      bookingData.pickupTime,
      bookingData.totalAmount,
      bookingData.receivedAmount,
      pendingAmount,
      'Confirmed',
      bookingData.createdBy,
      timestamp
    ]);
    
    return { 
      success: true, 
      message: "Booking saved successfully! Booking ID: " + bookingId,
      bookingId: bookingId
    };
    
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

// ========== GET ALL USERS FOR ADMIN DROPDOWN (ONLY NORMAL USERS) ==========
function getAllNormalUsers() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("user");
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    let users = [];
    
    for (let i = 1; i < data.length; i++) {
      const role = data[i][3] ? data[i][3].toString().trim().toLowerCase() : "user";
      // Sirf normal users ko include karo, admin ko nahi
      if (role !== 'admin') {
        users.push({
          userId: data[i][0] ? data[i][0].toString().trim() : "",
          userName: data[i][2] ? data[i][2].toString().trim() : data[i][0].toString().trim()
        });
      }
    }
    
    return users;
    
  } catch (error) {
    return [];
  }
}

// ========== GET USER'S BOOKINGS WITH MONTH/YEAR FILTER ==========
function getUserBookingsByMonthYear(userId, month, year) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookingSheet = ss.getSheetByName('booking');
    
    if (!bookingSheet) {
      return [];
    }
    
    const data = bookingSheet.getDataRange().getValues();
    let userBookings = [];
    
    const monthMap = {
      "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
      "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
    };
    
    for (let i = 1; i < data.length; i++) {
      const sheetUserId = data[i][12] ? data[i][12].toString().trim() : "";
      const sheetBookingId = data[i][0] ? data[i][0].toString().trim() : "";
      const sheetBookingDate = data[i][1] ? data[i][1].toString().trim() : "";
      const sheetCustomerName = data[i][2] ? data[i][2].toString().trim() : "";
      const sheetPhoneNumber = data[i][3] ? data[i][3].toString().trim() : "";
      const sheetVehicleType = data[i][4] ? data[i][4].toString().trim() : "";
      const sheetPickupLocation = data[i][5] ? data[i][5].toString().trim() : "";
      const sheetDropLocation = data[i][6] ? data[i][6].toString().trim() : "";
      const sheetPickupTime = data[i][7] ? data[i][7].toString().trim() : "";
      const sheetTotalAmount = data[i][8] ? parseFloat(data[i][8]) : 0;
      const sheetReceivedAmount = data[i][9] ? parseFloat(data[i][9]) : 0;
      const sheetPendingAmount = data[i][10] ? parseFloat(data[i][10]) : 0;
      const sheetStatus = data[i][11] ? data[i][11].toString().trim() : "";
      
      if (sheetUserId === userId) {
        let bookingMonth = '';
        let bookingYear = '';
        
        if (sheetBookingDate) {
          const dateParts = sheetBookingDate.split('/');
          if (dateParts.length === 3) {
            bookingYear = dateParts[2];
            bookingMonth = parseInt(dateParts[1]);
          }
        }
        
        let includeBooking = false;
        
        if (month === 'All' && year === 'All') {
          includeBooking = true;
        } else if (month === 'All' && year !== 'All') {
          includeBooking = (bookingYear === year);
        } else if (month !== 'All' && year === 'All') {
          includeBooking = (bookingMonth === monthMap[month]);
        } else {
          includeBooking = (bookingMonth === monthMap[month] && bookingYear === year);
        }
        
        if (includeBooking) {
          userBookings.push({
            bookingId: sheetBookingId,
            bookingDate: sheetBookingDate,
            customerName: sheetCustomerName,
            phoneNumber: sheetPhoneNumber,
            vehicleType: sheetVehicleType,
            pickupLocation: sheetPickupLocation,
            dropLocation: sheetDropLocation,
            pickupTime: sheetPickupTime,
            totalAmount: sheetTotalAmount,
            receivedAmount: sheetReceivedAmount,
            pendingAmount: sheetPendingAmount,
            status: sheetStatus,
            createdBy: sheetUserId
          });
        }
      }
    }
    
    userBookings.sort((a, b) => {
      const [dayA, monthA, yearA] = a.bookingDate.split('/').map(Number);
      const [dayB, monthB, yearB] = b.bookingDate.split('/').map(Number);
      
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      
      return dateB - dateA;
    });
    
    return userBookings;
    
  } catch (error) {
    return [];
  }
}

// ========== GET ALL BOOKINGS FOR ADMIN WITH FILTERS ==========
function getAllBookingsForAdmin(month, year, selectedUserId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookingSheet = ss.getSheetByName('booking');
    
    if (!bookingSheet) {
      return [];
    }
    
    const data = bookingSheet.getDataRange().getValues();
    let filteredBookings = [];
    
    const monthMap = {
      "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
      "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
    };
    
    for (let i = 1; i < data.length; i++) {
      const sheetUserId = data[i][12] ? data[i][12].toString().trim() : "";
      const sheetBookingId = data[i][0] ? data[i][0].toString().trim() : "";
      const sheetBookingDate = data[i][1] ? data[i][1].toString().trim() : "";
      const sheetCustomerName = data[i][2] ? data[i][2].toString().trim() : "";
      const sheetPhoneNumber = data[i][3] ? data[i][3].toString().trim() : "";
      const sheetVehicleType = data[i][4] ? data[i][4].toString().trim() : "";
      const sheetPickupLocation = data[i][5] ? data[i][5].toString().trim() : "";
      const sheetDropLocation = data[i][6] ? data[i][6].toString().trim() : "";
      const sheetPickupTime = data[i][7] ? data[i][7].toString().trim() : "";
      const sheetTotalAmount = data[i][8] ? parseFloat(data[i][8]) : 0;
      const sheetReceivedAmount = data[i][9] ? parseFloat(data[i][9]) : 0;
      const sheetPendingAmount = data[i][10] ? parseFloat(data[i][10]) : 0;
      const sheetStatus = data[i][11] ? data[i][11].toString().trim() : "";
      
      if (selectedUserId !== 'All' && sheetUserId !== selectedUserId) {
        continue;
      }
      
      let bookingMonth = '';
      let bookingYear = '';
      
      if (sheetBookingDate) {
        const dateParts = sheetBookingDate.split('/');
        if (dateParts.length === 3) {
          bookingYear = dateParts[2];
          bookingMonth = parseInt(dateParts[1]);
        }
      }
      
      let includeBooking = false;
      
      if (month === 'All' && year === 'All') {
        includeBooking = true;
      } else if (month === 'All' && year !== 'All') {
        includeBooking = (bookingYear === year);
      } else if (month !== 'All' && year === 'All') {
        includeBooking = (bookingMonth === monthMap[month]);
      } else {
        includeBooking = (bookingMonth === monthMap[month] && bookingYear === year);
      }
      
      if (includeBooking) {
        filteredBookings.push({
          bookingId: sheetBookingId,
          bookingDate: sheetBookingDate,
          customerName: sheetCustomerName,
          phoneNumber: sheetPhoneNumber,
          vehicleType: sheetVehicleType,
          pickupLocation: sheetPickupLocation,
          dropLocation: sheetDropLocation,
          pickupTime: sheetPickupTime,
          totalAmount: sheetTotalAmount,
          receivedAmount: sheetReceivedAmount,
          pendingAmount: sheetPendingAmount,
          status: sheetStatus,
          createdBy: sheetUserId
        });
      }
    }
    
    filteredBookings.sort((a, b) => {
      const [dayA, monthA, yearA] = a.bookingDate.split('/').map(Number);
      const [dayB, monthB, yearB] = b.bookingDate.split('/').map(Number);
      
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      
      return dateB - dateA;
    });
    
    return filteredBookings;
    
  } catch (error) {
    return [];
  }
}

// ========== GET AVAILABLE YEARS FROM BOOKINGS ==========
function getAvailableYears() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookingSheet = ss.getSheetByName('booking');
    
    if (!bookingSheet) {
      return [new Date().getFullYear().toString()];
    }
    
    const data = bookingSheet.getDataRange().getValues();
    let years = new Set();
    
    for (let i = 1; i < data.length; i++) {
      const bookingDate = data[i][1] ? data[i][1].toString().trim() : "";
      if (bookingDate) {
        const dateParts = bookingDate.split('/');
        if (dateParts.length === 3) {
          const year = dateParts[2];
          if (year && year.length === 4) {
            years.add(year);
          }
        }
      }
    }
    
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
    }
    
    return Array.from(years).sort().reverse();
    
  } catch (error) {
    return [new Date().getFullYear().toString()];
  }
}

// ========== CANCEL BOOKING ==========
function cancelBooking(bookingId, userId, isAdmin) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookingSheet = ss.getSheetByName('booking');
    
    if (!bookingSheet) {
      return { success: false, message: "Booking sheet not found" };
    }
    
    const data = bookingSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === bookingId) {
        if (!isAdmin && data[i][12] !== userId) {
          return { success: false, message: "You can only cancel your own bookings" };
        }
        
        bookingSheet.getRange(i + 1, 12).setValue('Cancelled');
        return { success: true, message: "Booking cancelled successfully" };
      }
    }
    
    return { success: false, message: "Booking not found" };
    
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}