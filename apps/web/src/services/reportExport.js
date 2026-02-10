/**
 * reportExport.js
 * 
 * Report export service for generating PDF and Excel files.
 * Supports client data, quotations, contracts, payments/invoices.
 * Uses exceljs (replacing xlsx due to Prototype Pollution vulnerability).
 */

import { saveAs } from 'file-saver';

/**
 * Helper: create an exceljs worksheet from JSON data
 */
async function createWorkbook() {
    const ExcelJS = await import('exceljs');
    return new ExcelJS.Workbook();
}

function addSheetFromData(workbook, sheetName, data, columnWidths = null) {
    const worksheet = workbook.addWorksheet(sheetName);
    if (!data || data.length === 0) return worksheet;

    // Set columns from first row keys
    const keys = Object.keys(data[0]);
    worksheet.columns = keys.map((key, i) => ({
        header: key,
        key,
        width: columnWidths?.[i]?.wch || 15,
    }));

    // Add rows
    data.forEach(row => worksheet.addRow(row));

    // Style header row
    worksheet.getRow(1).font = { bold: true };

    return worksheet;
}

async function saveWorkbook(workbook, filename) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
}

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Export options
 */
export async function exportToExcel(data, filename, options = {}) {
    const {
        sheetName = 'Sheet1',
        columnHeaders = null,
        columnWidths = null,
    } = options;

    // Transform data with custom headers if provided
    let exportData = data;
    if (columnHeaders) {
        exportData = data.map(row => {
            const newRow = {};
            Object.entries(columnHeaders).forEach(([field, header]) => {
                newRow[header] = row[field] ?? '';
            });
            return newRow;
        });
    }

    const workbook = await createWorkbook();
    addSheetFromData(workbook, sheetName, exportData, columnWidths);
    await saveWorkbook(workbook, filename);
}

/**
 * Export client list to Excel
 */
export function exportClientsToExcel(clients) {
    const columnHeaders = {
        name: '客戶名稱',
        shortName: '簡稱',
        taxId: '統一編號',
        contactPerson: '聯絡人',
        phone: '電話',
        email: 'Email',
        address: '地址',
        status: '狀態',
        createdAt: '建立日期',
    };

    const columnWidths = [
        { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
        { wch: 15 }, { wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 12 },
    ];

    exportToExcel(clients, `客戶清單_${formatDate(new Date())}`, {
        sheetName: '客戶清單',
        columnHeaders,
        columnWidths,
    });
}

/**
 * Export quotation to Excel
 */
export async function exportQuotationToExcel(quotation) {
    const headerData = [{
        '報價單號': quotation.quotationNo,
        '客戶': quotation.clientName,
        '專案': quotation.projectName,
        '日期': formatDate(quotation.quotationDate),
        '有效期限': formatDate(quotation.validUntil),
        '總金額': formatCurrency(quotation.totalAmount),
        '狀態': quotation.status,
    }];

    const lineItems = (quotation.items || []).map((item, index) => ({
        '項次': index + 1,
        '項目名稱': item.itemName,
        '規格': item.specification || '',
        '單位': item.unit,
        '數量': item.quantity,
        '單價': item.unitPrice,
        '金額': item.amount,
        '備註': item.notes || '',
    }));

    const workbook = await createWorkbook();
    addSheetFromData(workbook, '報價資訊', headerData);
    addSheetFromData(workbook, '項目明細', lineItems, [
        { wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 8 },
        { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
    ]);
    await saveWorkbook(workbook, `報價單_${quotation.quotationNo}`);
}

/**
 * Export payment/invoice summary to Excel
 */
export function exportPaymentsToExcel(payments, title = '請款紀錄') {
    const columnHeaders = {
        paymentNo: '請款單號',
        projectName: '專案名稱',
        clientName: '客戶',
        paymentDate: '請款日期',
        amount: '金額',
        status: '狀態',
        paidDate: '收款日期',
        notes: '備註',
    };

    const data = payments.map(p => ({
        ...p,
        paymentDate: formatDate(p.paymentDate),
        paidDate: p.paidDate ? formatDate(p.paidDate) : '',
        amount: formatCurrency(p.amount),
    }));

    exportToExcel(data, `${title}_${formatDate(new Date())}`, {
        sheetName: title,
        columnHeaders,
        columnWidths: [
            { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 },
            { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 30 },
        ],
    });
}

/**
 * Export contract summary to Excel
 */
export function exportContractsToExcel(contracts) {
    const columnHeaders = {
        contractNo: '合約編號',
        projectName: '專案名稱',
        clientName: '客戶',
        contractDate: '合約日期',
        startDate: '開始日期',
        endDate: '結束日期',
        totalAmount: '合約金額',
        status: '狀態',
    };

    const data = contracts.map(c => ({
        ...c,
        contractDate: formatDate(c.contractDate),
        startDate: formatDate(c.startDate),
        endDate: c.endDate ? formatDate(c.endDate) : '',
        totalAmount: formatCurrency(c.totalAmount),
    }));

    exportToExcel(data, `合約清單_${formatDate(new Date())}`, {
        sheetName: '合約清單',
        columnHeaders,
        columnWidths: [
            { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 },
            { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
        ],
    });
}

// Helper functions
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatCurrency(amount) {
    if (amount == null) return '';
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(amount);
}
