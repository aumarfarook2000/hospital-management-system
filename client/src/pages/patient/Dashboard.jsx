import {
    FiCalendar,
    FiFileText,
    FiHeart,
    FiCreditCard,
} from "react-icons/fi";

import StatCard from "../../components/common/StatCard";

import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
    const { user } =
        useAuth();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold">
                    Welcome,{" "}
                    {user?.name}
                </h1>

                <p className="mt-1 text-slate-500">
                    Manage your appointments and
                    medical records
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Upcoming Appointments"
                    value="0"
                    icon={FiCalendar}
                />

                <StatCard
                    title="Previous Visits"
                    value="0"
                    icon={FiHeart}
                />

                <StatCard
                    title="Prescriptions"
                    value="0"
                    icon={FiFileText}
                />

                <StatCard
                    title="Pending Bills"
                    value="₹0"
                    icon={FiCreditCard}
                />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h2 className="text-lg font-semibold">
                        Next Appointment
                    </h2>

                    <div className="mt-6 rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No upcoming appointment.
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h2 className="text-lg font-semibold">
                        Recent Medical Records
                    </h2>

                    <div className="mt-6 rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No medical records yet.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;