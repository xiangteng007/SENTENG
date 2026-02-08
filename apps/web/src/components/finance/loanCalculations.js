/**
 * 貸款計算工具函數
 * 從 LoanCalculator.jsx 提取以解決 fast-refresh 警告
 */

// 等額本息計算（PMT）
export const calculateEqualPayment = (principal, annualRate, months) => {
    if (months <= 0 || principal <= 0) return { monthlyPayment: 0, totalInterest: 0, totalPayment: 0, schedule: [] };

    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
        const monthlyPayment = principal / months;
        return {
            monthlyPayment: Math.round(monthlyPayment),
            totalInterest: 0,
            totalPayment: principal,
            schedule: Array.from({ length: months }, (_, i) => ({
                term: i + 1,
                payment: Math.round(monthlyPayment),
                principal: Math.round(monthlyPayment),
                interest: 0,
                remainingPrincipal: Math.round(principal - monthlyPayment * (i + 1))
            }))
        };
    }

    // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
    const factor = Math.pow(1 + monthlyRate, months);
    const monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);

    let remaining = principal;
    const schedule = [];

    for (let i = 1; i <= months; i++) {
        const interest = remaining * monthlyRate;
        const principalPart = monthlyPayment - interest;
        remaining = remaining - principalPart;

        schedule.push({
            term: i,
            payment: Math.round(monthlyPayment),
            principal: Math.round(principalPart),
            interest: Math.round(interest),
            remainingPrincipal: Math.max(0, Math.round(remaining))
        });
    }

    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    return {
        monthlyPayment: Math.round(monthlyPayment),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        schedule
    };
};

// 等額本金計算
export const calculateEqualPrincipal = (principal, annualRate, months) => {
    if (months <= 0 || principal <= 0) return { firstPayment: 0, lastPayment: 0, totalInterest: 0, totalPayment: 0, schedule: [] };

    const monthlyRate = annualRate / 100 / 12;
    const principalPerMonth = principal / months;

    let remaining = principal;
    const schedule = [];
    let totalInterest = 0;

    for (let i = 1; i <= months; i++) {
        const interest = remaining * monthlyRate;
        const payment = principalPerMonth + interest;
        remaining = remaining - principalPerMonth;
        totalInterest += interest;

        schedule.push({
            term: i,
            payment: Math.round(payment),
            principal: Math.round(principalPerMonth),
            interest: Math.round(interest),
            remainingPrincipal: Math.max(0, Math.round(remaining))
        });
    }

    return {
        firstPayment: Math.round(schedule[0]?.payment || 0),
        lastPayment: Math.round(schedule[months - 1]?.payment || 0),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(principal + totalInterest),
        schedule
    };
};
