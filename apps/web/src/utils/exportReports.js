/**
 * Report Export Utilities
 * Expert Panel v4.9: Feature Completion Auditor 建議
 * Support for CSV, Excel, and PDF export formats
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// ==================== CSV Export ====================
export const exportToCSV = (data, filename, headers = null) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = headers || Object.keys(data[0]);
  
  // Build CSV content
  const csvRows = [];
  
  // Header row
  csvRows.push(keys.join(','));
  
  // Data rows
  data.forEach(row => {
    const values = keys.map(key => {
      const val = row[key];
      // Handle commas and quotes in data
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val ?? '';
    });
    csvRows.push(values.join(','));
  });

  const csvContent = csvRows.join('\n');
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

// ==================== Excel Export (via CSV with BOM) ====================
export const exportToExcel = (data, filename, headers = null) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = headers || Object.keys(data[0]);
  
  // Build CSV content with BOM for Excel
  const csvRows = [];
  
  // Header row
  csvRows.push(keys.join('\t')); // Use tab separator for Excel
  
  // Data rows
  data.forEach(row => {
    const values = keys.map(key => row[key] ?? '');
    csvRows.push(values.join('\t'));
  });

  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const content = BOM + csvRows.join('\n');
  
  downloadFile(content, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
};

// ==================== PDF Export ====================
export const exportToPDF = (data, filename, options = {}) => {
  const {
    title = '報表',
    headers = null,
    orientation = 'portrait', // portrait or landscape
    fontSize = 10,
    headerColor = [26, 26, 26], // Zinc-900
    accentColor = [212, 175, 55], // Gold #D4AF37
  } = options;

  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const doc = new jsPDF(orientation, 'mm', 'a4');
  const keys = headers || Object.keys(data[0]);
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(...headerColor);
  doc.text(title, 14, 20);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`匯出日期: ${new Date().toLocaleDateString('zh-TW')}`, 14, 28);
  
  // Table
  const tableData = data.map(row => keys.map(key => row[key] ?? ''));
  
  doc.autoTable({
    head: [keys],
    body: tableData,
    startY: 35,
    styles: {
      fontSize,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: headerColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    theme: 'grid',
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} - SENTENG ERP`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`${filename}.pdf`);
};

// ==================== Helper: Download File ====================
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// ==================== Financial Report Templates ====================
export const exportFinancialReport = {
  // 分錄明細表
  journalEntries: (entries, dateRange) => {
    const headers = ['日期', '摘要', '借方科目', '貸方科目', '金額', '專案'];
    const filename = `分錄明細表_${dateRange.start}_${dateRange.end}`;
    
    return {
      toCSV: () => exportToCSV(entries, filename, headers),
      toExcel: () => exportToExcel(entries, filename, headers),
      toPDF: () => exportToPDF(entries, filename, { title: '分錄明細表', headers }),
    };
  },
  
  // 專案毛利分析
  profitAnalysis: (projects) => {
    const headers = ['專案名稱', '收入', '成本', '毛利', '毛利率'];
    const filename = `專案毛利分析_${new Date().toISOString().split('T')[0]}`;
    
    const data = projects.map(p => ({
      專案名稱: p.name,
      收入: p.revenue,
      成本: p.cost,
      毛利: p.revenue - p.cost,
      毛利率: `${((p.revenue - p.cost) / p.revenue * 100).toFixed(1)}%`,
    }));
    
    return {
      toCSV: () => exportToCSV(data, filename, headers),
      toExcel: () => exportToExcel(data, filename, headers),
      toPDF: () => exportToPDF(data, filename, { title: '專案毛利分析', headers }),
    };
  },
  
  // 應收應付帳款
  receivablesPayables: (items, type) => {
    const headers = ['對象', '發票號碼', '金額', '到期日', '狀態'];
    const title = type === 'receivable' ? '應收帳款明細' : '應付帳款明細';
    const filename = `${title}_${new Date().toISOString().split('T')[0]}`;
    
    return {
      toCSV: () => exportToCSV(items, filename, headers),
      toExcel: () => exportToExcel(items, filename, headers),
      toPDF: () => exportToPDF(items, filename, { title, headers }),
    };
  },
};

// ==================== Material Report Templates ====================
export const exportMaterialReport = {
  // 材料估算表
  estimation: (materials, projectName) => {
    const headers = ['材料名稱', '規格', '數量', '單位', '單價', '小計', '備註'];
    const filename = `材料估算表_${projectName}_${new Date().toISOString().split('T')[0]}`;
    
    return {
      toCSV: () => exportToCSV(materials, filename, headers),
      toExcel: () => exportToExcel(materials, filename, headers),
      toPDF: () => exportToPDF(materials, filename, { 
        title: `材料估算表 - ${projectName}`, 
        headers,
        orientation: 'landscape',
      }),
    };
  },
  
  // 庫存盤點表
  inventory: (items) => {
    const headers = ['品名', '規格', '庫存數量', '安全庫存', '單價', '庫存價值', '位置'];
    const filename = `庫存盤點表_${new Date().toISOString().split('T')[0]}`;
    
    return {
      toCSV: () => exportToCSV(items, filename, headers),
      toExcel: () => exportToExcel(items, filename, headers),
      toPDF: () => exportToPDF(items, filename, { title: '庫存盤點表', headers }),
    };
  },
};

export default {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportFinancialReport,
  exportMaterialReport,
};
