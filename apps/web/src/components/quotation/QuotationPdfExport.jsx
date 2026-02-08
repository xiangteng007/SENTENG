/**
 * 估價單 PDF 輸出
 * QuotationPdfExport.jsx
 * 使用 @react-pdf/renderer 生成 PDF，支援 Google Noto Sans TC 字體
 */

// React 17+ JSX transform
import { Document, Page, Text, View, StyleSheet, Font, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';

// ============================================
// 註冊 Google Noto Sans TC 字體
// ============================================
Font.register({
    family: 'Noto Sans TC',
    fonts: [
        {
            src: 'https://fonts.gstatic.com/s/notosanstc/v36/-nF7OG829Oofr2wohFbTp9iFOSsLA_ZJ1g.woff2',
            fontWeight: 'normal',
        },
        {
            src: 'https://fonts.gstatic.com/s/notosanstc/v36/-nFkOG829Oofr2wohFbTp9iFP8sDBxoTEg.woff2',
            fontWeight: 'bold',
        },
    ],
});

// ============================================
// PDF 樣式定義
// ============================================
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Noto Sans TC',
        fontSize: 10,
        padding: 40,
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 20,
        borderBottom: '2 solid #f97316',
        paddingBottom: 15,
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    companyInfo: {
        fontSize: 9,
        color: '#6b7280',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 15,
        color: '#1f2937',
    },
    infoSection: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    infoColumn: {
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    infoLabel: {
        width: 70,
        fontSize: 9,
        color: '#6b7280',
    },
    infoValue: {
        flex: 1,
        fontSize: 10,
        color: '#1f2937',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottom: '1 solid #e5e7eb',
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#374151',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1 solid #f3f4f6',
        paddingVertical: 6,
        paddingHorizontal: 5,
    },
    tableRowAlt: {
        flexDirection: 'row',
        borderBottom: '1 solid #f3f4f6',
        paddingVertical: 6,
        paddingHorizontal: 5,
        backgroundColor: '#fafafa',
    },
    tableCell: {
        fontSize: 9,
        color: '#374151',
    },
    colNo: { width: 30 },
    colName: { flex: 1 },
    colUnit: { width: 40, textAlign: 'center' },
    colQty: { width: 50, textAlign: 'right' },
    colPrice: { width: 70, textAlign: 'right' },
    colAmount: { width: 80, textAlign: 'right' },
    totalsSection: {
        marginTop: 20,
        paddingTop: 15,
        borderTop: '1 solid #e5e7eb',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 5,
    },
    totalLabel: {
        width: 100,
        fontSize: 10,
        color: '#6b7280',
        textAlign: 'right',
        paddingRight: 15,
    },
    totalValue: {
        width: 100,
        fontSize: 10,
        color: '#1f2937',
        textAlign: 'right',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        paddingTop: 10,
        borderTop: '2 solid #f97316',
    },
    grandTotalLabel: {
        width: 100,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'right',
        paddingRight: 15,
    },
    grandTotalValue: {
        width: 100,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#f97316',
        textAlign: 'right',
    },
    notesSection: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
    },
    notesTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    notesText: {
        fontSize: 9,
        color: '#6b7280',
        lineHeight: 1.5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 8,
        borderTop: '1 solid #e5e7eb',
        paddingTop: 10,
    },
    termsSection: {
        marginTop: 20,
    },
    termsTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    termItem: {
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 4,
    },
});

// ============================================
// 格式化工具
// ============================================
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

// ============================================
// PDF 文件組件
// ============================================
const QuotationPdfDocument = ({ quotation, companyInfo }) => {
    const company = companyInfo || {
        name: '森騰工程有限公司',
        address: '台北市信義區信義路五段7號',
        phone: '02-2345-6789',
        email: 'contact@senteng.com.tw',
    };

    // 計算金額
    const items = quotation.items || [];
    const subtotal = items.reduce((sum, item) =>
        sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0
    );
    const taxRate = quotation.taxRate || 5;
    const taxAmount = quotation.isTaxIncluded
        ? Math.round(subtotal * taxRate / (100 + taxRate))
        : Math.round(subtotal * taxRate / 100);
    const totalAmount = quotation.isTaxIncluded
        ? subtotal
        : subtotal + taxAmount;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* 頁首 - 公司資訊 */}
                <View style={styles.header}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Text style={styles.companyInfo}>
                        {company.address} | {company.phone} | {company.email}
                    </Text>
                </View>

                {/* 標題 */}
                <Text style={styles.title}>估 價 單</Text>

                {/* 基本資訊 */}
                <View style={styles.infoSection}>
                    <View style={styles.infoColumn}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>估價單號：</Text>
                            <Text style={styles.infoValue}>{quotation.quotationNo || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>專案名稱：</Text>
                            <Text style={styles.infoValue}>{quotation.projectName || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>客戶名稱：</Text>
                            <Text style={styles.infoValue}>{quotation.customerName || '-'}</Text>
                        </View>
                    </View>
                    <View style={styles.infoColumn}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>報價日期：</Text>
                            <Text style={styles.infoValue}>{formatDate(quotation.createdAt)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>有效期限：</Text>
                            <Text style={styles.infoValue}>{formatDate(quotation.validUntil)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>計價方式：</Text>
                            <Text style={styles.infoValue}>{quotation.isTaxIncluded ? '含稅' : '未稅'}</Text>
                        </View>
                    </View>
                </View>

                {/* 報價標題 */}
                {quotation.title && (
                    <View style={{ marginBottom: 15 }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1f2937' }}>
                            報價內容：{quotation.title}
                        </Text>
                    </View>
                )}

                {/* 工項表格 */}
                <View style={styles.table}>
                    {/* 表頭 */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colNo]}>#</Text>
                        <Text style={[styles.tableHeaderCell, styles.colName]}>項目名稱</Text>
                        <Text style={[styles.tableHeaderCell, styles.colUnit]}>單位</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>數量</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPrice]}>單價</Text>
                        <Text style={[styles.tableHeaderCell, styles.colAmount]}>金額</Text>
                    </View>

                    {/* 工項列表 */}
                    {items.map((item, index) => (
                        <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                            <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                            <Text style={[styles.tableCell, styles.colName]}>
                                {item.itemName || item.name || '-'}
                            </Text>
                            <Text style={[styles.tableCell, styles.colUnit]}>{item.unit || '式'}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity || 0}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>
                                ${formatCurrency(item.unitPrice)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colAmount]}>
                                ${formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* 金額匯總 */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>小計：</Text>
                        <Text style={styles.totalValue}>${formatCurrency(subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                            {quotation.isTaxIncluded ? '內含稅額' : `營業稅 (${taxRate}%)`}：
                        </Text>
                        <Text style={styles.totalValue}>${formatCurrency(taxAmount)}</Text>
                    </View>
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>總計：</Text>
                        <Text style={styles.grandTotalValue}>${formatCurrency(totalAmount)}</Text>
                    </View>
                </View>

                {/* 備註 */}
                {quotation.notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesTitle}>備註說明</Text>
                        <Text style={styles.notesText}>{quotation.notes}</Text>
                    </View>
                )}

                {/* 條款 */}
                <View style={styles.termsSection}>
                    <Text style={styles.termsTitle}>報價條款</Text>
                    <Text style={styles.termItem}>1. 本報價單有效期限為報價日起 30 天。</Text>
                    <Text style={styles.termItem}>2. 工程款項支付方式依合約另行約定。</Text>
                    <Text style={styles.termItem}>3. 如有任何疑問，請隨時與我們聯繫。</Text>
                    <Text style={styles.termItem}>4. 本報價單經客戶簽章確認後，即視為工程合約之一部分。</Text>
                </View>

                {/* 頁尾 */}
                <Text style={styles.footer}>
                    此估價單由 森騰工程管理系統 自動產生 | © {new Date().getFullYear()} {company.name}
                </Text>
            </Page>
        </Document>
    );
};

// ============================================
// PDF 下載按鈕組件
// ============================================
export const QuotationPdfButton = ({ quotation, companyInfo, className = '' }) => {
    const fileName = `估價單-${quotation.quotationNo || quotation.id || 'draft'}.pdf`;

    return (
        <PDFDownloadLink
            document={<QuotationPdfDocument quotation={quotation} companyInfo={companyInfo} />}
            fileName={fileName}
            className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm ${className}`}
        >
            {({ loading, error }) =>
                loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        產生 PDF 中...
                    </>
                ) : error ? (
                    <>❌ 產生失敗</>
                ) : (
                    <>
                        <Download size={16} />
                        下載 PDF
                    </>
                )
            }
        </PDFDownloadLink>
    );
};

// ============================================
// 簡易下載按鈕（用於列表）
// ============================================
export const QuotationPdfIconButton = ({ quotation, companyInfo }) => {
    const fileName = `估價單-${quotation.quotationNo || quotation.id || 'draft'}.pdf`;

    return (
        <PDFDownloadLink
            document={<QuotationPdfDocument quotation={quotation} companyInfo={companyInfo} />}
            fileName={fileName}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="下載 PDF"
        >
            {({ loading }) =>
                loading ? (
                    <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Download size={16} />
                )
            }
        </PDFDownloadLink>
    );
};

export default QuotationPdfDocument;
