const Placeholder = ({
    title,
    description,
}) => {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                    {title}
                </h1>

                <p className="mt-1 text-slate-500">
                    {description}
                </p>
            </div>

            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mx-auto max-w-md">
                    <h2 className="text-lg font-semibold">
                        Module Ready
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        This module is prepared
                        for the next development
                        phase.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Placeholder;