/**
 * SyncStatusBadge.jsx
 * 
 * 同步狀態 Badge 元件
 */

// React 17+ JSX transform

/**
 * @param {Object} props
 * @param {'PENDING' | 'SYNCED' | 'FAILED' | 'DISABLED'} props.status
 * @param {string} [props.error]
 */
export function SyncStatusBadge({ status, error }) {
    const config = {
        PENDING: { text: 'Pending', color: 'amber', bg: 'bg-amber-50', border: 'border-amber-300', textColor: 'text-amber-700' },
        SYNCED: { text: 'Synced', color: 'green', bg: 'bg-green-50', border: 'border-green-300', textColor: 'text-green-700' },
        FAILED: { text: 'Failed', color: 'red', bg: 'bg-red-50', border: 'border-red-300', textColor: 'text-red-700' },
        DISABLED: { text: 'Disabled', color: 'gray', bg: 'bg-gray-50', border: 'border-gray-300', textColor: 'text-gray-500' },
    };

    const { text, bg, border, textColor } = config[status] || config.PENDING;

    return (
        <span
            title={status === 'FAILED' && error ? error : text}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg} ${border} ${textColor}`}
        >
            {text}
        </span>
    );
}

export default SyncStatusBadge;
