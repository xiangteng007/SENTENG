/**
 * Vendors.jsx — DEPRECATED
 * 此頁面已整合至統一「夥伴管理」(Partners) 模組
 * 保留此檔案以避免 route 404，顯示導向提示
 */
import React from 'react';
import { ArrowRight, HardHat } from 'lucide-react';

const Vendors = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
            <HardHat size={40} className="text-orange-500" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">廠商管理已整合</h2>
            <p className="text-gray-500 max-w-md">
                原「廠商管理」功能已整合至<strong>夥伴管理</strong>模組，
                提供統一的客戶、廠商、聯絡人管理體驗。
            </p>
        </div>
        <a
            href="/partners"
            className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-700 transition-all hover:shadow-lg"
        >
            前往夥伴管理 <ArrowRight size={18} />
        </a>
        <p className="text-xs text-gray-400">所有廠商資料已自動遷移至夥伴系統</p>
    </div>
);

export default Vendors;
