/**
 * Print Utilities for Material Calculator
 * Expert Panel v4.9: Feature Completion Auditor 建議 - MaterialCalculator 列印功能
 */

// Print styles to be injected
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    
    #print-area, #print-area * {
      visibility: visible;
    }
    
    #print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 20mm;
      background: white !important;
    }
    
    /* Hide non-printable elements */
    .no-print {
      display: none !important;
    }
    
    /* Page break controls */
    .page-break-before {
      page-break-before: always;
    }
    
    .page-break-after {
      page-break-after: always;
    }
    
    .avoid-break {
      page-break-inside: avoid;
    }
    
    /* Table styling for print */
    table {
      border-collapse: collapse;
      width: 100%;
    }
    
    th, td {
      border: 1px solid #333;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #f0f0f0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* Header styling */
    .print-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    
    .print-header h1 {
      font-size: 24px;
      margin: 0;
    }
    
    .print-header p {
      font-size: 12px;
      color: #666;
      margin: 5px 0 0;
    }
    
    /* Footer */
    .print-footer {
      position: fixed;
      bottom: 10mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: #999;
    }
  }
`;

// Inject print styles into document
export const injectPrintStyles = () => {
  if (typeof document === 'undefined') return;
  
  const existingStyle = document.getElementById('print-styles');
  if (existingStyle) return;
  
  const style = document.createElement('style');
  style.id = 'print-styles';
  style.textContent = printStyles;
  document.head.appendChild(style);
};

// Print function for material estimation
export const printMaterialEstimation = (data, options = {}) => {
  const {
    title = '材料估算表',
    projectName = '',
    date = new Date().toLocaleDateString('zh-TW'),
    includeBreakdown = true,
    includeSummary = true,
  } = options;

  injectPrintStyles();

  // Create print container
  const printContainer = document.createElement('div');
  printContainer.id = 'print-area';
  
  // Header
  printContainer.innerHTML = `
    <div class="print-header">
      <h1>${title}</h1>
      <p>專案: ${projectName || '未指定'} | 日期: ${date}</p>
    </div>
  `;

  // Materials table
  if (includeBreakdown && data.materials?.length > 0) {
    const tableHTML = `
      <h3 style="margin: 20px 0 10px;">材料明細</h3>
      <table>
        <thead>
          <tr>
            <th>項目</th>
            <th>規格</th>
            <th>數量</th>
            <th>單位</th>
            <th>單價</th>
            <th>小計</th>
          </tr>
        </thead>
        <tbody>
          ${data.materials.map(m => `
            <tr>
              <td>${m.name || '-'}</td>
              <td>${m.spec || '-'}</td>
              <td style="text-align: right;">${m.quantity?.toLocaleString() || 0}</td>
              <td>${m.unit || '-'}</td>
              <td style="text-align: right;">$${m.price?.toLocaleString() || 0}</td>
              <td style="text-align: right;">$${(m.quantity * m.price)?.toLocaleString() || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printContainer.innerHTML += tableHTML;
  }

  // Summary
  if (includeSummary && data.summary) {
    const summaryHTML = `
      <div style="margin-top: 30px; padding: 15px; border: 2px solid #333; background: #f9f9f9;">
        <h3 style="margin: 0 0 10px;">總計</h3>
        <table style="border: none;">
          <tr style="border: none;">
            <td style="border: none; padding: 5px 0;"><strong>材料總數:</strong></td>
            <td style="border: none; padding: 5px 0; text-align: right;">${data.summary.totalItems || 0} 項</td>
          </tr>
          <tr style="border: none;">
            <td style="border: none; padding: 5px 0;"><strong>材料總價:</strong></td>
            <td style="border: none; padding: 5px 0; text-align: right;">$${data.summary.totalCost?.toLocaleString() || 0}</td>
          </tr>
          ${data.summary.laborCost ? `
            <tr style="border: none;">
              <td style="border: none; padding: 5px 0;"><strong>工資預估:</strong></td>
              <td style="border: none; padding: 5px 0; text-align: right;">$${data.summary.laborCost?.toLocaleString()}</td>
            </tr>
          ` : ''}
          <tr style="border: none; border-top: 1px solid #333;">
            <td style="border: none; padding: 10px 0; font-size: 18px;"><strong>總計:</strong></td>
            <td style="border: none; padding: 10px 0; text-align: right; font-size: 18px;"><strong>$${data.summary.grandTotal?.toLocaleString() || 0}</strong></td>
          </tr>
        </table>
      </div>
    `;
    printContainer.innerHTML += summaryHTML;
  }

  // Footer
  printContainer.innerHTML += `
    <div class="print-footer">
      SENTENG ERP - 列印時間: ${new Date().toLocaleString('zh-TW')}
    </div>
  `;

  // Append to body, print, then remove
  document.body.appendChild(printContainer);
  
  setTimeout(() => {
    window.print();
    document.body.removeChild(printContainer);
  }, 100);
};

// Print calculator results (general purpose)
export const printCalculatorResults = (calculatorName, inputs, results) => {
  injectPrintStyles();

  const printContainer = document.createElement('div');
  printContainer.id = 'print-area';
  
  printContainer.innerHTML = `
    <div class="print-header">
      <h1>${calculatorName}</h1>
      <p>計算日期: ${new Date().toLocaleDateString('zh-TW')}</p>
    </div>
    
    <h3 style="margin: 20px 0 10px;">輸入參數</h3>
    <table>
      <tbody>
        ${Object.entries(inputs).map(([key, val]) => `
          <tr>
            <td style="width: 40%;"><strong>${key}</strong></td>
            <td>${val}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h3 style="margin: 20px 0 10px;">計算結果</h3>
    <table>
      <tbody>
        ${Object.entries(results).map(([key, val]) => `
          <tr>
            <td style="width: 40%;"><strong>${key}</strong></td>
            <td style="font-size: 16px;"><strong>${val}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="print-footer">
      SENTENG ERP - 列印時間: ${new Date().toLocaleString('zh-TW')}
    </div>
  `;

  document.body.appendChild(printContainer);
  
  setTimeout(() => {
    window.print();
    document.body.removeChild(printContainer);
  }, 100);
};

// Print button component helper
export const PrintButton = ({ onClick, label = '列印' }) => `
  <button 
    onclick="${onClick}" 
    class="no-print px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 flex items-center gap-2"
  >
    🖨️ ${label}
  </button>
`;

export default {
  injectPrintStyles,
  printMaterialEstimation,
  printCalculatorResults,
};
