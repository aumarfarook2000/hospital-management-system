import {
    FiCalendar,
    FiClock,
    FiUsers,
    FiCheckCircle,
} from "react-icons/fi";

import StatCard from "../../components/common/StatCard";

const Dashboard = () => {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold">
                    Doctor Dashboard
                </h1>

                <p className="mt-1 text-slate-500">
                    Manage your consultations and
                    appointments
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Today's Appointments"
                    value="0"
                    icon={FiCalendar}
                />

                <StatCard
                    title="Waiting Patients"
                    value="0"
                    icon={FiClock}
                />

                <StatCard
                    title="Completed"
                    value="0"
                    icon={FiCheckCircle}
                />

                <StatCard
                    title="My Patients"
                    value="0"
                    icon={FiUsers}
                />
            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-lg font-semibold">
                    Today's Appointments
                </h2>

                <div className="mt-6 rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
                    No appointments yet.
                </div>
            </div>
        </div>
    );
};

export default Dashboard;