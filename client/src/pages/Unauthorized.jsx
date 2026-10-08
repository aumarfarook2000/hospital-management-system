import { Link } from "react-router-dom";

const Unauthorized = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-red-500">
                    403
                </h1>

                <h2 className="mt-4 text-2xl font-bold">
                    Access Denied
                </h2>

                <p className="mt-2 text-slate-500">
                    You don't have permission to
                    access this page.
                </p>

                <Link
                    to="/"
                    className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;