const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
}) => {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-2 text-xs text-slate-500">
                            {description}
                        </p>
                    )}
                </div>

                {Icon && (
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <Icon
                            size={22}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;