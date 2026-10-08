import {
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const Register = () => {
    const navigate = useNavigate();

    const {
        register,
    } = useAuth();

    const [
        form,
        setForm,
    ] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
    });

    const [
        error,
        setError,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(false);

    const handleChange = (
        e
    ) => {
        setForm({
            ...form,
            [e.target.name]:
                e.target.value,
        });
    };

    const handleSubmit = async (
        e
    ) => {
        e.preventDefault();

        setError("");

        if (
            form.password !==
            form.confirmPassword
        ) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        setLoading(true);

        try {
            await register({
                name: form.name,
                email: form.email,
                mobile: form.mobile,
                password:
                    form.password,
            });

            navigate(
                "/patient/dashboard"
            );
        } catch (error) {
            setError(
                error.response
                    ?.data?.message ||
                    "Registration failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
            <div className="w-full max-w-lg">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold">
                        Patient Registration
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Create your HMS patient
                        account
                    </p>
                </div>

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="rounded-2xl bg-white p-6 shadow-xl sm:p-8"
                >
                    {error && (
                        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-medium">
                                Full Name
                            </label>

                            <input
                                name="name"
                                value={
                                    form.name
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                placeholder="Full name"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={
                                    form.email
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                placeholder="Email"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Mobile
                            </label>

                            <input
                                name="mobile"
                                value={
                                    form.mobile
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Mobile number"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Password
                            </label>

                            <input
                                type="password"
                                name="password"
                                value={
                                    form.password
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                minLength={
                                    6
                                }
                                placeholder="Minimum 6 characters"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                name="confirmPassword"
                                value={
                                    form.confirmPassword
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                placeholder="Confirm password"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={
                            loading
                        }
                        className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Patient Account"}
                    </button>

                    <p className="mt-5 text-center text-sm text-slate-500">
                        Already have an
                        account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-blue-600"
                        >
                            Login
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;