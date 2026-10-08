import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({
    children,
}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        const token =
            localStorage.getItem("hms_token");

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response =
                await api.get("/auth/me");

            setUser(response.data.user);
        } catch (error) {
            localStorage.removeItem("hms_token");
            localStorage.removeItem("hms_user");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const login = async (
        email,
        password
    ) => {
        const response = await api.post(
            "/auth/login",
            {
                email,
                password,
            }
        );

        const {
            token,
            user,
        } = response.data;

        localStorage.setItem(
            "hms_token",
            token
        );

        localStorage.setItem(
            "hms_user",
            JSON.stringify(user)
        );

        setUser(user);

        return user;
    };

    const register = async (data) => {
        const response =
            await api.post(
                "/auth/register",
                data
            );

        const {
            token,
            user,
        } = response.data;

        localStorage.setItem(
            "hms_token",
            token
        );

        localStorage.setItem(
            "hms_user",
            JSON.stringify(user)
        );

        setUser(user);

        return user;
    };

    const logout = () => {
        localStorage.removeItem(
            "hms_token"
        );

        localStorage.removeItem(
            "hms_user"
        );

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () =>
    useContext(AuthContext);