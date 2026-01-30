/**
 * reportExport.js
 * 
 * Report export service for generating PDF and Excel files.
 * Supports client data, quotations, contracts, payments/invoices.
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Export options
 */
export function exportToExcel(data, filename, options = {}) {
    const {
        sheetName = 'Sheet1',
        columnHeaders = null, // { fieldName: 'Display Header' }
        columnWidths = null,  // [{ wch: 20 }, { wch: 30 }]
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

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths if provided
    if (columnWidths) {
        worksheet['!cols'] = columnWidths;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate and save file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
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
        { wch: 25 }, // name
        { wch: 15 }, // shortName
        { wch: 12 }, // taxId
        { wch: 15 }, // contactPerson
        { wch: 15 }, // phone
        { wch: 25 }, // email
        { wch: 40 }, // address
        { wch: 10 }, // status
        { wch: 12 }, // createdAt
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
export function exportQuotationToExcel(quotation) {
    // Header info
    const headerData = [{
        '報價單號': quotation.quotationNo,
        '客戶': quotation.clientName,
        '專案': quotation.projectName,
        '日期': formatDate(quotation.quotationDate),
        '有效期限': formatDate(quotation.validUntil),
        '總金額': formatCurrency(quotation.totalAmount),
        '狀態': quotation.status,
    }];

    // Line items
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

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    const headerSheet = XLSX.utils.json_to_sheet(headerData);
    XLSX.utils.book_append_sheet(workbook, headerSheet, '報價資訊');

    const itemsSheet = XLSX.utils.json_to_sheet(lineItems);
    itemsSheet['!cols'] = [
        { wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 8 },
        { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(workbook, itemsSheet, '項目明細');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `報價單_${quotation.quotationNo}.xlsx`);
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
