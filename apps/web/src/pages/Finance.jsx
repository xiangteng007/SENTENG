
import { useState, useRef, useEffect } from 'react';
import { WidgetWrapper } from '../components/common/WidgetWrapper';
import { WidgetFinanceAccounts, WidgetFinanceTrend, WidgetFinanceTransactions } from '../components/widgets/FinanceWidgets';
import { AccountDetailsModal } from '../components/finance/AccountDetailsModal';
import { FinanceExportModal } from '../components/finance/FinanceExportModal';
import { FinanceSearchBar } from '../components/finance/FinanceSearchBar';
import { LoanAccountCard } from '../components/finance/LoanAccountCard';
import { LoanAccountModal } from '../components/finance/LoanAccountModal';
import { Modal } from '../components/common/Modal';
import { InputField } from '../components/common/InputField';
import { SectionTitle } from '../components/common/Indicators';
import { Plus, Download, Search, Building2 } from 'lucide-react';
import { GoogleService } from '../services/GoogleService';

// 收支類別選項
const TX_CATEGORIES = {
    '收入': ['工程款', '設計費', '顧問費', '其他收入'],
    '支出': ['材料費', '人工費', '設備費', '運輸費', '其他支出']
};

const Finance = ({ data, loading, addToast, onAddTx, onUpdateAccounts, onUpdateLoans, allProjects = [] }) => {
    const [accounts, setAccounts] = useState(data.accounts || []);
    const accountsRef = useRef(accounts);

    // Sync accounts when data.accounts changes (from API/Sheet)
    useEffect(() => {
        setAccounts(data.accounts || []);
    }, [data.accounts]);

    // Keep ref in sync with state for drag-drop
    useEffect(() => {
        accountsRef.current = accounts;
    }, [accounts]);
    const [widgets, setWidgets] = useState([
        { id: 'wf-acc', type: 'finance-acc', title: '資金帳戶', size: 'L' },
        { id: 'wf-loans', type: 'finance-loans', title: '貸款帳戶', size: 'L' },
        { id: 'wf-trend', type: 'finance-trend', title: '收支趨勢', size: 'M' },
        { id: 'wf-tx', type: 'finance-tx', title: '收支明細', size: 'L' }
    ]);

    // Loan State
    const [loans, setLoans] = useState(data.loans || []);
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState(null);
    const [isDeleteLoanModalOpen, setIsDeleteLoanModalOpen] = useState(false);
    const [deletingLoan, setDeletingLoan] = useState(null);

    // Sync loans when data.loans changes
    useEffect(() => {
        setLoans(data.loans || []);
    }, [data.loans]);

    // Transaction Modal State
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [newTx, setNewTx] = useState({ type: "支出", amount: "", date: "", desc: "", accountId: "", projectId: "", category: "" });

    // Account Modal State
    const [isAccModalOpen, setIsAccModalOpen] = useState(false);
    const [editingAcc, setEditingAcc] = useState(null);
    const [newAcc, setNewAcc] = useState({ name: "", bank: "", number: "", balance: 0 });

    // Delete Account State
    const [isDeleteAccModalOpen, setIsDeleteAccModalOpen] = useState(false);
    const [deletingAcc, setDeletingAcc] = useState(null);

    // Account Details State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Drag Refs
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleResize = (id, size) => setWidgets(prev => prev.map(w => w.id === id ? { ...w, size } : w));

    // Widget Drag Sorting
    const handleDragStart = (e, idx) => { dragItem.current = idx; };
    const handleDragEnter = (e, idx) => {
        dragOverItem.current = idx;
        const copy = [...widgets]; const dragContent = copy[dragItem.current];
        copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, dragContent);
        dragItem.current = idx; setWidgets(copy);
    };
    const handleDragEnd = () => { dragItem.current = null; dragOverItem.current = null; };

    // Account Drag Sorting
    const handleDragStartAccount = (e, idx) => { dragItem.current = idx; };
    const handleDragOverAccount = (e, idx) => {
        e.preventDefault();
        dragOverItem.current = idx;
        const copy = [...accounts]; const item = copy[dragItem.current];
        copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, item);
        dragItem.current = idx;
        setAccounts(copy);
    };
    const handleDragEndAccount = () => {
        dragItem.current = null; dragOverItem.current = null;
        onUpdateAccounts(accounts);
    };

    // Account CRUD
    const openAddAcc = () => { setEditingAcc(null); setNewAcc({ name: "", bank: "", number: "", balance: 0 }); setIsAccModalOpen(true); };
    const openEditAcc = (acc) => { setEditingAcc(acc); setNewAcc(acc); setIsAccModalOpen(true); };

    const handleSaveAccount = async () => {
        // 確保 balance 是數字類型
        const accountData = {
            ...newAcc,
            balance: Number(newAcc.balance) || 0
        };

        const updatedAccounts = editingAcc
            ? accounts.map(a => a.id === editingAcc.id ? { ...a, ...accountData } : a)
            : [...accounts, { ...accountData, id: `a-${Date.now()}` }];

        setAccounts(updatedAccounts);
        onUpdateAccounts(updatedAccounts); // Update App State

        // 同步帳戶到 Google Sheets
        const syncResult = await GoogleService.syncToSheet('accounts', updatedAccounts);
        if (!syncResult.success) {
            console.error('帳戶同步失敗:', syncResult.error);
        }

        addToast(editingAcc ? "帳戶更新成功！" : "新帳戶建立成功！", 'success');
        setIsAccModalOpen(false);
        setEditingAcc(null);
        setNewAcc({ name: "", bank: "", number: "", balance: 0 }); // 重置表單
    };

    // Delete Account Handler
    const handleDeleteAccount = (acc) => {
        setDeletingAcc(acc);
        setIsDeleteAccModalOpen(true);
    };

    const confirmDeleteAccount = async () => {
        const updatedAccounts = accounts.filter(a => a.id !== deletingAcc.id);
        setAccounts(updatedAccounts);
        onUpdateAccounts(updatedAccounts);

        // 同步帳戶刪除到 Google Sheets
        const syncResult = await GoogleService.syncToSheet('accounts', updatedAccounts);
        if (!syncResult.success) {
            console.error('帳戶刪除同步失敗:', syncResult.error);
        }

        addToast(`帳戶「${deletingAcc.name}」已刪除`, 'success');
        setIsDeleteAccModalOpen(false);
        setDeletingAcc(null);
    };

    // Account Details Handler
    const handleViewDetails = (acc) => {
        setSelectedAccount(acc);
        setIsDetailsModalOpen(true);
    };

    // Loan CRUD Handlers
    const openAddLoan = () => {
        setEditingLoan(null);
        setIsLoanModalOpen(true);
    };

    const openEditLoan = (loan) => {
        setEditingLoan(loan);
        setIsLoanModalOpen(true);
    };

    const handleSaveLoan = async (loanData) => {
        const updatedLoans = editingLoan
            ? loans.map(l => l.id === editingLoan.id ? loanData : l)
            : [...loans, loanData];

        setLoans(updatedLoans);
        if (onUpdateLoans) onUpdateLoans(updatedLoans);

        // 同步貸款到 Google Sheets
        const syncResult = await GoogleService.syncToSheet('loans', updatedLoans);
        if (!syncResult.success) {
            console.error('貸款同步失敗:', syncResult.error);
        }

        addToast(editingLoan ? '貸款帳戶已更新！' : '貸款帳戶已新增！', 'success');
        setIsLoanModalOpen(false);
        setEditingLoan(null);
    };

    const handleDeleteLoan = (loan) => {
        setDeletingLoan(loan);
        setIsDeleteLoanModalOpen(true);
    };

    const confirmDeleteLoan = async () => {
        const updatedLoans = loans.filter(l => l.id !== deletingLoan.id);
        setLoans(updatedLoans);
        if (onUpdateLoans) onUpdateLoans(updatedLoans);

        // 同步貸款刪除到 Google Sheets
        const syncResult = await GoogleService.syncToSheet('loans', updatedLoans);
        if (!syncResult.success) {
            console.error('貸款刪除同步失敗:', syncResult.error);
        }

        addToast(`貸款帳戶「${deletingLoan.bankName}」已刪除`, 'success');
        setIsDeleteLoanModalOpen(false);
        setDeletingLoan(null);
    };

    const handleRecordLoanPayment = async (loan) => {
        // 記錄還款 - 更新已還期數
        const updatedLoan = {
            ...loan,
            paidTerms: loan.paidTerms + 1,
            status: loan.paidTerms + 1 >= loan.totalTerms ? 'completed' : 'active'
        };
        const updatedLoans = loans.map(l => l.id === loan.id ? updatedLoan : l);
        setLoans(updatedLoans);
        if (onUpdateLoans) onUpdateLoans(updatedLoans);

        // 同步還款記錄到 Google Sheets
        const syncResult = await GoogleService.syncToSheet('loans', updatedLoans);
        if (!syncResult.success) {
            console.error('還款記錄同步失敗:', syncResult.error);
        }

        addToast(`已記錄第 ${updatedLoan.paidTerms} 期還款`, 'success');
    };

    // Finance Export Handler
    const handleExportFinance = async (transactions, options) => {
        const result = await GoogleService.exportFinanceReport(transactions, options);
        if (result.success) {
            addToast(`財務報表已匯出！${result.isNewSheet ? '(新建月份Sheet)' : ''}`, 'success', {
                action: { label: '開啟報表', onClick: () => window.open(result.sheetUrl, '_blank') }
            });
        } else {
            addToast(`匯出失敗：${result.error}`, 'error');
        }
    };

    // Finance Search Handler
    const handleSearchFinance = async (query, options) => {
        setIsSearching(true);
        const result = await GoogleService.searchFinanceRecords(query, options);
        setIsSearching(false);
        if (result.success) {
            setSearchResults(result.results);
            addToast(`搜尋完成，找到 ${result.count} 筆記錄`, 'info');
        } else {
            addToast(`搜尋失敗：${result.error}`, 'error');
        }
    };

    const handleConfirmTx = async () => {
        // Validation
        if (!newTx.accountId || !newTx.amount || parseFloat(newTx.amount) <= 0) {
            addToast('請填寫完整資料並確認金額大於0', 'error');
            return;
        }

        const txWithNumber = { ...newTx, amount: parseFloat(newTx.amount) };

        // 若選擇了專案，同步到專案收支 Sheet
        if (newTx.projectId) {
            const selectedProject = allProjects.find(p => p.id === newTx.projectId);
            if (selectedProject?.folderId) {
                try {
                    await GoogleService.syncTransactionToProjectSheet(
                        selectedProject.folderId,
                        selectedProject.name,
                        {
                            date: newTx.date,
                            type: newTx.type,
                            category: newTx.category,
                            amount: parseFloat(newTx.amount),
                            target: '', // 可以之後擴展
                            account: accounts.find(a => a.id === newTx.accountId)?.name || '',
                            invoiceNo: '',
                            note: newTx.desc
                        }
                    );
                    addToast(`已同步到專案「${selectedProject.name}」`, 'info');
                } catch (err) {
                    console.error('Sync to project failed:', err);
                }
            }
        }

        onAddTx(txWithNumber); // Handles App State update and Toast inside App.jsx
        setIsTxModalOpen(false);
        setNewTx({ type: "支出", amount: "", date: "", desc: "", accountId: "", projectId: "", category: "" });
    };

    const renderWidget = (w) => {
        switch (w.type) {
            case 'finance-acc':
                return (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-end mb-2">
                            <button onClick={openAddAcc} className="text-xs text-morandi-blue-600 hover:underline flex items-center gap-1"><Plus size={12} /> 新增帳戶</button>
                        </div>
                        <WidgetFinanceAccounts
                            data={accounts}
                            size={w.size}
                            onEdit={openEditAcc}
                            onDelete={handleDeleteAccount}
                            onViewDetails={handleViewDetails}
                            onDragStartAccount={handleDragStartAccount}
                            onDragOverAccount={handleDragOverAccount}
                            onDragEndAccount={handleDragEndAccount}
                        />
                    </div>
                );
            case 'finance-loans': {
                // 計算貸款總額
                const totalLoanAmount = loans.reduce((sum, l) => sum + (l.remainingPrincipal || l.principalAmount || 0), 0);
                return (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <Building2 size={16} className="text-blue-600" />
                                <span className="text-sm text-gray-500">
                                    總貸款餘額: <span className="font-bold text-gray-800">${totalLoanAmount.toLocaleString()}</span>
                                </span>
                            </div>
                            <button onClick={openAddLoan} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <Plus size={12} /> 新增貸款
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1">
                            {loans.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                    <Building2 size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">尚無貸款帳戶</p>
                                    <button onClick={openAddLoan} className="mt-2 text-xs text-blue-600 hover:underline">新增貸款</button>
                                </div>
                            ) : (
                                loans.map(loan => (
                                    <LoanAccountCard
                                        key={loan.id}
                                        loan={loan}
                                        onEdit={openEditLoan}
                                        onRecordPayment={handleRecordLoanPayment}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            }
            case 'finance-trend': return <WidgetFinanceTrend size={w.size} />;
            case 'finance-tx': return <WidgetFinanceTransactions data={data.transactions} size={w.size} onAddTx={() => setIsTxModalOpen(true)} />;
            default: return null;
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <SectionTitle title="財務管理" />
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm"
                >
                    <Download size={18} />
                    匯出報表
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-auto">
                {widgets.map((w, i) => (
                    <WidgetWrapper key={w.id} widget={w} onResize={handleResize} onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={handleDragEnd}>
                        {renderWidget(w)}
                    </WidgetWrapper>
                ))}
            </div>

            {/* Transaction Modal */}
            <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title="新增收支紀錄" onConfirm={handleConfirmTx}>
                <div className="flex gap-4 mb-6 bg-gray-50 p-1 rounded-xl">
                    <button onClick={() => setNewTx({ ...newTx, type: '收入', category: '' })} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newTx.type === '收入' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>收入</button>
                    <button onClick={() => setNewTx({ ...newTx, type: '支出', category: '' })} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newTx.type === '支出' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}>支出</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="金額" type="number" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} placeholder="請輸入金額" />
                    <InputField label="日期" type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="類別" type="select" value={newTx.category} onChange={e => setNewTx({ ...newTx, category: e.target.value })}>
                        <option value="">請選擇類別</option>
                        {TX_CATEGORIES[newTx.type]?.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </InputField>
                    <InputField label="帳戶" type="select" value={newTx.accountId} onChange={e => setNewTx({ ...newTx, accountId: e.target.value })}>
                        <option value="" disabled>請選擇帳戶</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </InputField>
                </div>
                <InputField label="關聯專案 (選填)" type="select" value={newTx.projectId} onChange={e => setNewTx({ ...newTx, projectId: e.target.value })}>
                    <option value="">無關聯專案</option>
                    {allProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </InputField>
                <InputField label="摘要" value={newTx.desc} onChange={e => setNewTx({ ...newTx, desc: e.target.value })} placeholder="例：油漆補料" />
            </Modal>

            {/* Account Modal */}
            <Modal isOpen={isAccModalOpen} onClose={() => setIsAccModalOpen(false)} title={editingAcc ? "編輯帳戶" : "新增帳戶"} onConfirm={handleSaveAccount}>
                <InputField label="帳戶名稱" value={newAcc.name} onChange={e => setNewAcc({ ...newAcc, name: e.target.value })} placeholder="例：公司零用金" />
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="銀行/機構" value={newAcc.bank} onChange={e => setNewAcc({ ...newAcc, bank: e.target.value })} />
                    <InputField label="帳號 (選填)" value={newAcc.number} onChange={e => setNewAcc({ ...newAcc, number: e.target.value })} />
                </div>
                <InputField label="初始餘額" type="number" value={newAcc.balance} onChange={e => setNewAcc({ ...newAcc, balance: Number(e.target.value) })} />

                {/* Delete Button - Only show when editing */}
                {editingAcc && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => {
                                setIsAccModalOpen(false);
                                handleDeleteAccount(editingAcc);
                            }}
                            className="w-full py-2.5 px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                            <span>🗑️</span>
                            刪除此帳戶
                        </button>
                    </div>
                )}
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                isOpen={isDeleteAccModalOpen}
                onClose={() => setIsDeleteAccModalOpen(false)}
                title="確認刪除帳戶"
                onConfirm={confirmDeleteAccount}
                confirmText="確定刪除"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                        <p className="text-red-800 font-medium">⚠️ 警告：此操作無法復原</p>
                    </div>
                    <p className="text-gray-700">
                        您確定要刪除帳戶「<span className="font-bold">{deletingAcc?.name}</span>」嗎？
                    </p>
                    <p className="text-sm text-gray-500">
                        刪除後，該帳戶的所有交易記錄仍會保留，但帳戶資訊將無法恢復。
                    </p>
                </div>
            </Modal>

            {/* Account Details Modal */}
            <AccountDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                account={selectedAccount}
                allTransactions={data.transactions || []}
            />

            {/* Finance Export Modal */}
            <FinanceExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                transactions={data.transactions || []}
                accounts={accounts}
                projects={allProjects}
                onExport={handleExportFinance}
            />

            {/* Loan Account Modal */}
            <LoanAccountModal
                isOpen={isLoanModalOpen}
                onClose={() => { setIsLoanModalOpen(false); setEditingLoan(null); }}
                onConfirm={handleSaveLoan}
                editingLoan={editingLoan}
            />

            {/* Delete Loan Modal */}
            <Modal
                isOpen={isDeleteLoanModalOpen}
                onClose={() => setIsDeleteLoanModalOpen(false)}
                title="確認刪除貸款帳戶"
                onConfirm={confirmDeleteLoan}
                confirmText="確定刪除"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                        <p className="text-red-800 font-medium">⚠️ 警告：此操作無法復原</p>
                    </div>
                    <p className="text-gray-700">
                        您確定要刪除貸款帳戶「<span className="font-bold">{deletingLoan?.bankName}</span>」嗎？
                    </p>
                    <p className="text-sm text-gray-500">
                        貸款金額：${deletingLoan?.principalAmount?.toLocaleString() || 0}
                    </p>
                </div>
            </Modal>
        </div>
    );
};
export default Finance;
