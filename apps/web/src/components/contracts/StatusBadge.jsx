// React 17+ JSX transform
import { CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS } from '../../services/ContractService';

const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[status]}`}>
        {CONTRACT_STATUS_LABELS[status]}
    </span>
);

export default StatusBadge;
