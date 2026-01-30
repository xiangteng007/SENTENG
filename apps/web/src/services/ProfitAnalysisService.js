/**
 * 利潤分析服務層 (ProfitAnalysisService)
 * 整合專案成本、合約收入、請款進度，提供利潤分析
 * 
 * ⚠️ 已整合 Backend API - 資料儲存於 PostgreSQL
 */

import { costEntriesApi, contractsApi } from './api';
import ContractService, { CONTRACT_STATUS } from './ContractService';
import PaymentService, { PAYMENT_STATUS } from './PaymentService';
import ChangeOrderService from './ChangeOrderService';

// ============================================
// 常數定義
// ============================================

// 利潤狀態
export const PROFIT_STATUS = {
    HEALTHY: 'HEALTHY',       // 健康 (毛利 > 20%)
    WARNING: 'WARNING',       // 警示 (毛利 10-20%)
    CRITICAL: 'CRITICAL',     // 危險 (毛利 < 10%)
    LOSS: 'LOSS',            // 虧損 (毛利 < 0%)
};

export const PROFIT_STATUS_LABELS = {
    HEALTHY: '健康',
    WARNING: '警示',
    CRITICAL: '危險',
    LOSS: '虧損',
};

export const PROFIT_STATUS_COLORS = {
    HEALTHY: 'bg-green-100 text-green-700',
    WARNING: 'bg-yellow-100 text-yellow-700',
    CRITICAL: 'bg-orange-100 text-orange-700',
    LOSS: 'bg-red-100 text-red-700',
};

// 成本類別
export const COST_CATEGORIES = {
    MATERIAL: 'MATERIAL',     // 材料費
    LABOR: 'LABOR',           // 工資
    EQUIPMENT: 'EQUIPMENT',   // 機具
    SUBCONTRACT: 'SUBCONTRACT', // 外包
    OVERHEAD: 'OVERHEAD',     // 管銷
    OTHER: 'OTHER',           // 其他
};

export const COST_CATEGORY_LABELS = {
    MATERIAL: '材料費',
    LABOR: '工資',
    EQUIPMENT: '機具',
    SUBCONTRACT: '外包',
    OVERHEAD: '管銷',
    OTHER: '其他',
};

// ============================================
// 工具函數
// ============================================

/**
 * 計算利潤狀態
 */
export const calculateProfitStatus = (marginRate) => {
    if (marginRate < 0) return PROFIT_STATUS.LOSS;
    if (marginRate < 10) return PROFIT_STATUS.CRITICAL;
    if (marginRate < 20) return PROFIT_STATUS.WARNING;
    return PROFIT_STATUS.HEALTHY;
};

/**
 * 格式化趨勢
 */
export const formatTrend = (current, previous) => {
    if (!previous) return { value: 0, direction: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
        value: Math.abs(change).toFixed(1),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
};

// ============================================
// 利潤分析服務類
// ============================================

class ProfitAnalysisServiceClass {
    constructor() {
        // No localStorage needed - using backend API
    }

    // ==================== 成本管理 ====================

    // 取得專案成本
    async getProjectCosts(projectId) {
        try {
            const params = projectId ? { projectId } : {};
            return await costEntriesApi.getAll(params);
        } catch (error) {
            console.error('Failed to get costs:', error);
            return [];
        }
    }

    // 新增成本
    async addCost(data) {
        try {
            return await costEntriesApi.create(data);
        } catch (error) {
            console.error('Failed to add cost:', error);
            throw error;
        }
    }

    // 取得成本摘要（按類別）
    async getCostSummaryByCategory(projectId) {
        const costs = await this.getProjectCosts(projectId);
        const summary = {};

        Object.keys(COST_CATEGORIES).forEach(cat => {
            summary[cat] = {
                category: cat,
                label: COST_CATEGORY_LABELS[cat],
                amount: 0,
                count: 0,
            };
        });

        costs.forEach(cost => {
            const cat = cost.category || 'OTHER';
            if (summary[cat]) {
                summary[cat].amount += cost.amount || 0;
                summary[cat].count += 1;
            }
        });

        return Object.values(summary);
    }

    // ==================== 利潤分析 ====================

    // 取得單一專案/合約利潤分析
    async getProjectProfitAnalysis(contractId) {
        const contract = await ContractService.getContract(contractId);
        if (!contract) throw new Error('Contract not found');

        const costs = await this.getProjectCosts(contract.projectId);
        const totalCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0);

        // 收入 = 現行合約金額
        const revenue = contract.currentAmount || 0;

        // 毛利
        const grossProfit = revenue - totalCost;
        const marginRate = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

        // 請款進度
        const paidAmount = contract.paidAmount || 0;
        const paymentProgress = revenue > 0 ? (paidAmount / revenue) * 100 : 0;

        // 成本比例
        const costRatio = revenue > 0 ? (totalCost / revenue) * 100 : 0;

        return {
            contractId,
            contractNo: contract.contractNo,
            projectName: contract.projectName,

            // 金額
            revenue,
            totalCost,
            grossProfit,

            // 比率
            marginRate: marginRate.toFixed(1),
            costRatio: costRatio.toFixed(1),
            paymentProgress: paymentProgress.toFixed(1),

            // 狀態
            status: calculateProfitStatus(marginRate),

            // 請款
            paidAmount,
            unpaidAmount: revenue - paidAmount,

            // 成本明細
            costBreakdown: await this.getCostSummaryByCategory(contract.projectId),
        };
    }

    // 取得整體利潤儀表板
    async getDashboardMetrics() {
        const contracts = await ContractService.getContracts();
        const activeContracts = contracts.filter(c =>
            c.status === CONTRACT_STATUS.ACTIVE ||
            c.status === CONTRACT_STATUS.COMPLETED ||
            c.status === CONTRACT_STATUS.WARRANTY
        );

        // 整體統計
        let totalRevenue = 0;
        let totalCost = 0;
        let totalPaid = 0;
        let totalUnpaid = 0;

        const projectAnalyses = [];

        for (const contract of activeContracts) {
            try {
                const analysis = await this.getProjectProfitAnalysis(contract.id);
                projectAnalyses.push(analysis);

                totalRevenue += analysis.revenue;
                totalCost += analysis.totalCost;
                totalPaid += analysis.paidAmount;
                totalUnpaid += analysis.unpaidAmount;
            } catch (e) {
                console.error('Analysis error for contract:', contract.id, e);
            }
        }

        const totalProfit = totalRevenue - totalCost;
        const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        // 專案狀態分佈
        const statusDistribution = {
            healthy: projectAnalyses.filter(p => p.status === PROFIT_STATUS.HEALTHY).length,
            warning: projectAnalyses.filter(p => p.status === PROFIT_STATUS.WARNING).length,
            critical: projectAnalyses.filter(p => p.status === PROFIT_STATUS.CRITICAL).length,
            loss: projectAnalyses.filter(p => p.status === PROFIT_STATUS.LOSS).length,
        };

        // 月度趨勢（模擬資料）
        const monthlyTrend = this.generateMonthlyTrend(6);

        return {
            // 總覽
            totalRevenue,
            totalCost,
            totalProfit,
            overallMargin: overallMargin.toFixed(1),
            overallStatus: calculateProfitStatus(overallMargin),

            // 請款
            totalPaid,
            totalUnpaid,
            collectionRate: totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(1) : '0',

            // 專案
            totalProjects: activeContracts.length,
            statusDistribution,
            projectAnalyses: projectAnalyses.sort((a, b) => a.marginRate - b.marginRate), // 低毛利優先

            // 趨勢
            monthlyTrend,
        };
    }

    // 生成月度趨勢（模擬）
    generateMonthlyTrend(months) {
        const trend = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            trend.push({
                month: date.toLocaleDateString('zh-TW', { month: 'short' }),
                year: date.getFullYear(),
                revenue: Math.floor(Math.random() * 2000000) + 500000,
                cost: Math.floor(Math.random() * 1500000) + 300000,
                profit: 0, // 計算後填入
            });
        }

        trend.forEach(t => {
            t.profit = t.revenue - t.cost;
            t.margin = ((t.profit / t.revenue) * 100).toFixed(1);
        });

        return trend;
    }

    // 取得警報（毛利過低的專案）
    async getAlerts() {
        const metrics = await this.getDashboardMetrics();
        const alerts = [];

        metrics.projectAnalyses.forEach(project => {
            if (project.status === PROFIT_STATUS.LOSS) {
                alerts.push({
                    type: 'error',
                    title: '專案虧損',
                    message: `${project.projectName} 目前虧損 ${Math.abs(project.grossProfit).toLocaleString()}`,
                    projectId: project.contractId,
                });
            } else if (project.status === PROFIT_STATUS.CRITICAL) {
                alerts.push({
                    type: 'warning',
                    title: '毛利過低',
                    message: `${project.projectName} 毛利率僅 ${project.marginRate}%`,
                    projectId: project.contractId,
                });
            }
        });

        // 請款進度警報
        metrics.projectAnalyses.forEach(project => {
            if (parseFloat(project.paymentProgress) < 30 && project.revenue > 0) {
                alerts.push({
                    type: 'info',
                    title: '請款進度落後',
                    message: `${project.projectName} 請款進度僅 ${project.paymentProgress}%`,
                    projectId: project.contractId,
                });
            }
        });

        return alerts;
    }
}

export const ProfitAnalysisService = new ProfitAnalysisServiceClass();
export default ProfitAnalysisService;
