import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

/**
 * SearchableSelect - A searchable dropdown component
 * @param {Object} props
 * @param {string} props.label - Label for the field
 * @param {string} props.value - Selected value (id)
 * @param {Function} props.onChange - Callback when selection changes (receives id)
 * @param {Array} props.options - Array of { id, name, ...extra } objects
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.searchPlaceholder - Search input placeholder
 * @param {Function} props.renderOption - Optional custom render for each option
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.className - Additional CSS classes
 */
const SearchableSelect = ({
    label,
    value,
    onChange,
    options = [],
    placeholder = '請選擇...',
    searchPlaceholder = '搜尋...',
    renderOption,
    required = false,
    className = '',
    displayField = 'name',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Find selected option
    const selectedOption = options.find(opt => opt.id === value);

    // Filter options by search
    const filteredOptions = options.filter(opt => {
        const searchLower = search.toLowerCase();
        const name = (opt[displayField] || opt.name || '').toLowerCase();
        const id = (opt.id || '').toLowerCase();
        return name.includes(searchLower) || id.includes(searchLower);
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (option) => {
        onChange(option.id);
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Selected Value Display / Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between w-full px-3 py-2 
                    bg-white border rounded-lg cursor-pointer
                    transition-all duration-200
                    ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'}
                `}
            >
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedOption ? (selectedOption[displayField] || selectedOption.name) : placeholder}
                </span>
                <div className="flex items-center gap-1">
                    {selectedOption && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={14} className="text-gray-400" />
                        </button>
                    )}
                    <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                {search ? '找不到符合的結果' : '無可選項目'}
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        flex items-center justify-between px-3 py-2.5 cursor-pointer
                                        transition-colors duration-150
                                        ${option.id === value ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}
                                    `}
                                >
                                    {renderOption ? (
                                        renderOption(option)
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{option[displayField] || option.name}</span>
                                            <span className="text-xs text-gray-400">{option.id}</span>
                                        </div>
                                    )}
                                    {option.id === value && (
                                        <Check size={16} className="text-blue-600 flex-shrink-0" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
