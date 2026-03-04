# Google Sheets Integration for NAILS TRACKER

Your specific Sheet ID is: `1tzF7vL_vuwTtbb9bicJHDUE8ZAR6XlrlVuYXrttmhO0`

### 1. Prepare your Google Sheet
Ensure your sheet has these exact tab names and headers in the first row:
- **users**: `telegram_id`, `username`, `name`, `photo`, `created_at`
- **sessions**: `session_id`, `telegram_id`, `date`, `duration_seconds`, `intention`, `mood`
- **live_sessions**: `telegram_id`, `start_time`, `intention`

**Important:** The sheet must be "Public" (Anyone with the link can view) for the app to read data via CSV export.

### 2. Deploy Google Apps Script (Required for Writing)
To allow the app to save practices and users, you must deploy a script:

1. In your Google Sheet, go to **Extensions > Apps Script**.
2. Replace the code with the following:

```javascript
const SPREADSHEET_ID = '1tzF7vL_vuwTtbb9bicJHDUE8ZAR6XlrlVuYXrttmhO0';

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  if (action === 'get_data') {
    return ContentService.createTextOutput(JSON.stringify({
      users: getRows(ss.getSheetByName('users')),
      sessions: getRows(ss.getSheetByName('sessions')),
      live_sessions: getRows(ss.getSheetByName('live_sessions'))
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'upsert_user') {
    const userSheet = ss.getSheetByName('users');
    const users = getRows(userSheet);
    const userIndex = users.findIndex(u => u.telegram_id == data.user.telegram_id);
    
    if (userIndex === -1) {
      userSheet.appendRow([
        data.user.telegram_id,
        data.user.username,
        data.user.name,
        data.user.photo,
        new Date().toISOString()
      ]);
    }
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (action === 'start_session') {
    const liveSheet = ss.getSheetByName('live_sessions');
    liveSheet.appendRow([
      data.telegram_id,
      new Date().toISOString(),
      data.intention
    ]);
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (action === 'end_session') {
    const liveSheet = ss.getSheetByName('live_sessions');
    const sessionSheet = ss.getSheetByName('sessions');
    
    // Remove from live
    const liveRows = liveSheet.getDataRange().getValues();
    for (let i = liveRows.length - 1; i >= 1; i--) {
      if (liveRows[i][0] == data.telegram_id) {
        liveSheet.deleteRow(i + 1);
      }
    }
    
    // Add to sessions
    sessionSheet.appendRow([
      Utilities.getUuid(),
      data.telegram_id,
      new Date().toISOString(),
      data.duration_seconds,
      data.intention,
      data.mood
    ]);
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  }
}

function getRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}
```

3. Click **Deploy > New Deployment**.
4. Select **Web App**.
5. Set "Execute as" to **Me**.
6. Set "Who has access" to **Anyone**.
7. Copy the **Web App URL** and add it to your environment as `VITE_GOOGLE_SCRIPT_URL`.
