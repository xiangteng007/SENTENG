// Development environment configuration
export const IS_DEV_MODE = import.meta.env.MODE === 'development';
export const USE_MOCK_GOOGLE_API = IS_DEV_MODE; // Set to false to test real API in dev

// Google Apps Script Web App URL
export const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxUrPvBxCavNiXkhVkK-Afqrfkx4N64NEFQFGzXCFUK5h5Qq_5JZlZT7ptrBiTTPvqMfg/exec";

// Mock responses for development
export const MOCK_RESPONSES = {
    createDriveFolder: (folderName) => ({
        success: true,
        url: `https://drive.google.com/drive/folders/mock-${Date.now()}`,
        folderId: `mock-id-${Date.now()}`,
        message: `[開發模式] 模擬建立資料夾: ${folderName}`
    }),

    syncToSheet: (sheetName, recordCount) => ({
        success: true,
        message: `[開發模式] 模擬同步 ${recordCount} 筆資料到 ${sheetName}`,
        recordCount
    }),

    addCalendarEvent: (title) => ({
        success: true,
        eventId: `mock-event-${Date.now()}`,
        eventTitle: title,
        eventUrl: `https://calendar.google.com/calendar/event?eid=mock`,
        message: `[開發模式] 模擬建立行程: ${title}`
    }),

    updateCalendarEvent: (eventId) => ({
        success: true,
        eventId,
        message: `[開發模式] 模擬更新行程: ${eventId}`
    }),

    deleteCalendarEvent: (eventId) => ({
        success: true,
        eventId,
        message: `[開發模式] 模擬刪除行程: ${eventId}`
    })
};
