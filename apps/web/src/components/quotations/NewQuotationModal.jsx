/**
 * 新增估價單 Modal
 */

import { useState } from 'react';
import { FileText, Plus, Eye, X } from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';
import TemplateItemsEditor from '../quotation/TemplateItemsEditor';
import TemplatePreviewModal from './TemplatePreviewModal';
import { QUOTATION_TEMPLATES } from '../../services/QuotationService';

const NewQuotationModal = ({ isOpen, onClose, onSubmit, projects = [], customers = [] }) => {
    const [formData, setFormData] = useState({
        title: '',
        projectId: '',
        projectName: '',
        customerId: '',
        customerName: '',
        templateId: '',
        description: '',
    });
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [editableItems, setEditableItems] = useState([]);

    const handleTemplateChange = (templateId) => {
        setFormData(prev => ({ ...prev, templateId }));

        if (templateId) {
            const template = QUOTATION_TEMPLATES.find(t => t.id === templateId);
            if (template) {
                const items = [];
                template.items?.forEach((chapter, chapterIdx) => {
                    chapter.children?.forEach((item, itemIdx) => {
                        items.push({
                            id: `tpl-${chapterIdx}-${itemIdx}`,
                            chapter: chapter.name,
                            chapterIndex: chapterIdx,
                            name: item.name,
                            unit: item.unit || '式',
                            quantity: 1,
                            unitPrice: item.unitPrice || 0,
                            type: 'ITEM',
                        });
                    });
                });
                setEditableItems(items);
            }
        } else {
            setEditableItems([]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit({
            ...formData,
            items: editableItems,
        });
        onClose();
        setFormData({
            title: '',
            projectId: '',
            projectName: '',
            customerId: '',
            customerName: '',
            templateId: '',
            description: '',
        });
        setEditableItems([]);
    };

    const handlePreview = () => {
        if (formData.templateId) {
            const template = QUOTATION_TEMPLATES.find(t => t.id === formData.templateId);
            setPreviewTemplate(template);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <FileText size={20} className="text-white" />
                                </div>
                                <h2 className="text-lg font-bold text-white">新增估價單</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <X size={20} className="text-white" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* 標題 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                估價單標題 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="例：陳先生住宅裝修報價"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* 專案 */}
                        <div>
                            <SearchableSelect
                                label="關聯專案"
                                placeholder="搜尋並選擇專案..."
                                options={projects.map(p => ({ id: p.id, name: p.name }))}
                                value={formData.projectId}
                                onChange={(id) => {
                                    const proj = projects.find(p => p.id === id);
                                    setFormData(prev => ({ ...prev, projectId: id, projectName: proj?.name || '' }));
                                }}
                            />
                        </div>

                        {/* 客戶 */}
                        <div>
                            <SearchableSelect
                                label="客戶名稱"
                                placeholder="搜尋並選擇客戶..."
                                options={customers.map(c => ({ id: c.id, name: c.name }))}
                                value={formData.customerId}
                                onChange={(id) => {
                                    const client = customers.find(c => c.id === id);
                                    setFormData(prev => ({ ...prev, customerId: id, customerName: client?.name || '' }));
                                }}
                            />
                        </div>

                        {/* 模板選擇 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                套用模板
                            </label>
                            <select
                                value={formData.templateId}
                                onChange={(e) => handleTemplateChange(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                            >
                                <option value="">不套用模板 (空白開始)</option>
                                {QUOTATION_TEMPLATES.map(tpl => (
                                    <option key={tpl.id} value={tpl.id}>
                                        {tpl.name}
                                    </option>
                                ))}
                            </select>

                            {formData.templateId && (() => {
                                const selectedTpl = QUOTATION_TEMPLATES.find(t => t.id === formData.templateId);
                                return selectedTpl ? (
                                    <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-800 text-sm">{selectedTpl.name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{selectedTpl.description}</div>
                                                <div className="text-xs text-orange-600 mt-1">
                                                    📦 {selectedTpl.items?.length || 0} 個章節，
                                                    {selectedTpl.items?.reduce((sum, ch) => sum + (ch.children?.length || 0), 0)} 個工項
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handlePreview}
                                                className="shrink-0 px-3 py-1.5 bg-white text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium flex items-center gap-1.5"
                                            >
                                                <Eye size={14} />
                                                預覽內容
                                            </button>
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        {/* 工項編輯器 */}
                        {(editableItems.length > 0 || formData.templateId) && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    工項明細 <span className="text-xs text-gray-400">(可新增、編輯、刪除)</span>
                                </label>
                                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                    <TemplateItemsEditor
                                        items={editableItems}
                                        onChange={setEditableItems}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 說明 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                備註說明
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="可填入補充說明..."
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* 按鈕 */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} />
                                建立估價單
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 模板預覽 Modal */}
            <TemplatePreviewModal
                isOpen={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                template={previewTemplate}
            />
        </>
    );
};

export default NewQuotationModal;
