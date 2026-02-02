import React, { useState } from 'react';
import { BookOpen, Search, ExternalLink, ChevronRight } from 'lucide-react';

export const Regulations = ({ addToast }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const regulationCategories = [
    {
      id: 'building',
      label: '建築法規',
      items: [
        { name: '建築技術規則', url: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0070115' },
        { name: '建築法', url: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0070109' },
        { name: '都市計畫法', url: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0070001' },
      ],
    },
    {
      id: 'safety',
      label: '安全法規',
      items: [
        { name: '職業安全衛生法', url: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0060001' },
        { name: '消防法', url: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0120001' },
      ],
    },
    {
      id: 'environment',
      label: '環保法規',
      items: [
        { name: '環境基本法', url: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0100001' },
        { name: '廢棄物清理法', url: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0050001' },
      ],
    },
    {
      id: 'labor',
      label: '勞動法規',
      items: [
        { name: '勞動基準法', url: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030001' },
        { name: '勞工保險條例', url: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0050001' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">法規查詢</h1>
          <p className="text-gray-500 mt-1">營建相關法規快速查閱</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋法規名稱..."
          className="input pl-12 w-full text-lg py-3"
        />
      </div>

      {/* Categories */}
      <div className="grid md:grid-cols-2 gap-6">
        {regulationCategories.map(category => (
          <div key={category.id} className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-500" />
                {category.label}
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {category.items.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-gray-700 group-hover:text-blue-600">{item.name}</span>
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 bg-blue-50 border-blue-100">
        <p className="text-sm text-blue-700">
          💡 提示：點擊法規名稱將開啟全國法規資料庫查看完整條文
        </p>
      </div>
    </div>
  );
};

export default Regulations;
