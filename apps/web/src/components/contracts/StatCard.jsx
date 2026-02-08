// React 17+ JSX transform

const StatCard = ({ icon: Icon, label, value, color = 'gray' }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${color}-100`}>
                <Icon size={20} className={`text-${color}-600`} />
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
            </div>
        </div>
    </div>
);

export default StatCard;
