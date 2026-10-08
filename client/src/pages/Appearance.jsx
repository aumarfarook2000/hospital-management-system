import {
    FiCheck,
    FiMonitor,
    FiMoon,
    FiSun,
    FiType,
    FiSidebar,
} from "react-icons/fi";

import {
    useTheme,
} from "../context/ThemeContext";

const Appearance = () => {
    const {
        preferences,
        loading,
        updatePreference,
    } = useTheme();

    if (loading) {
        return (
            <div className="py-20 text-center text-slate-500">
                Loading appearance settings...
            </div>
        );
    }

    const themes = [
        {
            value: "light",
            title: "Light",
            description: "Use light appearance",
            icon: FiSun,
        },
        {
            value: "dark",
            title: "Dark",
            description: "Use dark appearance",
            icon: FiMoon,
        },
        {
            value: "system",
            title: "System",
            description: "Follow device theme",
            icon: FiMonitor,
        },
    ];

    const fonts = [
        {
            value: "inter",
            title: "Inter",
        },
        {
            value: "poppins",
            title: "Poppins",
        },
        {
            value: "roboto",
            title: "Roboto",
        },
        {
            value: "nunito",
            title: "Nunito",
        },
        {
            value: "system",
            title: "System Default",
        },
    ];

    const fontSizes = [
        {
            value: "small",
            title: "Small",
            example: "Aa",
        },
        {
            value: "normal",
            title: "Normal",
            example: "Aa",
        },
        {
            value: "large",
            title: "Large",
            example: "Aa",
        },
    ];

    const sidebarModes = [
        {
            value: "expanded",
            title: "Expanded",
            description:
                "Show icons and menu names",
        },
        {
            value: "compact",
            title: "Compact",
            description:
                "Use a smaller sidebar",
        },
    ];

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* HEADER */}

            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    Appearance
                </h1>

                <p className="mt-1 text-slate-500">
                    Personalize your HMS theme,
                    font and layout.
                </p>
            </div>

            {/* THEME */}

            <SettingCard
                title="Theme"
                description="Choose how HMS looks on this account."
                icon={FiMonitor}
            >
                <div className="grid gap-4 md:grid-cols-3">
                    {themes.map((theme) => {
                        const Icon = theme.icon;

                        const selected =
                            preferences.theme ===
                            theme.value;

                        return (
                            <button
                                key={theme.value}
                                type="button"
                                onClick={() =>
                                    updatePreference(
                                        "theme",
                                        theme.value
                                    )
                                }
                                className={`relative rounded-2xl border-2 p-5 text-left transition ${
                                    selected
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                            >
                                {selected && (
                                    <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                                        <FiCheck
                                            size={14}
                                        />
                                    </div>
                                )}

                                <div
                                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                                        selected
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    <Icon size={21} />
                                </div>

                                <p className="font-semibold text-slate-900">
                                    {theme.title}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    {
                                        theme.description
                                    }
                                </p>
                            </button>
                        );
                    })}
                </div>
            </SettingCard>

            {/* FONT FAMILY */}

            <SettingCard
                title="Font"
                description="Choose the font used throughout HMS."
                icon={FiType}
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {fonts.map((font) => {
                        const selected =
                            preferences.fontFamily ===
                            font.value;

                        return (
                            <button
                                key={font.value}
                                type="button"
                                onClick={() =>
                                    updatePreference(
                                        "fontFamily",
                                        font.value
                                    )
                                }
                                className={`relative rounded-xl border-2 px-4 py-5 text-center transition ${
                                    selected
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                            >
                                {selected && (
                                    <FiCheck className="absolute right-3 top-3 text-blue-600" />
                                )}

                                <div
                                    className="mb-2 text-2xl font-semibold text-slate-900"
                                    style={{
                                        fontFamily:
                                            getFontFamily(
                                                font.value
                                            ),
                                    }}
                                >
                                    Aa
                                </div>

                                <p
                                    className="text-sm font-semibold text-slate-700"
                                    style={{
                                        fontFamily:
                                            getFontFamily(
                                                font.value
                                            ),
                                    }}
                                >
                                    {font.title}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </SettingCard>

            {/* FONT SIZE */}

            <SettingCard
                title="Font Size"
                description="Adjust the general text size."
                icon={FiType}
            >
                <div className="grid gap-3 sm:grid-cols-3">
                    {fontSizes.map((size) => {
                        const selected =
                            preferences.fontSize ===
                            size.value;

                        return (
                            <button
                                key={size.value}
                                type="button"
                                onClick={() =>
                                    updatePreference(
                                        "fontSize",
                                        size.value
                                    )
                                }
                                className={`relative rounded-xl border-2 p-5 text-center transition ${
                                    selected
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                            >
                                {selected && (
                                    <FiCheck className="absolute right-4 top-4 text-blue-600" />
                                )}

                                <div
                                    className={`mb-2 font-bold text-slate-900 ${
                                        size.value ===
                                        "small"
                                            ? "text-lg"
                                            : size.value ===
                                                "large"
                                              ? "text-3xl"
                                              : "text-2xl"
                                    }`}
                                >
                                    {size.example}
                                </div>

                                <p className="text-sm font-semibold text-slate-700">
                                    {size.title}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </SettingCard>

            {/* SIDEBAR */}

            <SettingCard
                title="Sidebar"
                description="Choose how the dashboard navigation is displayed."
                icon={FiSidebar}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    {sidebarModes.map(
                        (mode) => {
                            const selected =
                                preferences.sidebarMode ===
                                mode.value;

                            return (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() =>
                                        updatePreference(
                                            "sidebarMode",
                                            mode.value
                                        )
                                    }
                                    className={`relative rounded-xl border-2 p-5 text-left transition ${
                                        selected
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                >
                                    {selected && (
                                        <FiCheck className="absolute right-4 top-4 text-blue-600" />
                                    )}

                                    <p className="font-semibold text-slate-900">
                                        {
                                            mode.title
                                        }
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {
                                            mode.description
                                        }
                                    </p>
                                </button>
                            );
                        }
                    )}
                </div>
            </SettingCard>
        </div>
    );
};

const SettingCard = ({
    title,
    description,
    icon: Icon,
    children,
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={21} />
                </div>

                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        {title}
                    </h2>

                    <p className="text-sm text-slate-500">
                        {description}
                    </p>
                </div>
            </div>

            {children}
        </div>
    );
};

const getFontFamily = (font) => {
    switch (font) {
        case "poppins":
            return "Poppins, sans-serif";

        case "roboto":
            return "Roboto, sans-serif";

        case "nunito":
            return "Nunito, sans-serif";

        case "system":
            return "system-ui, sans-serif";

        default:
            return "Inter, sans-serif";
    }
};

export default Appearance;