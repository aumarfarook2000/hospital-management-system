import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api";

const ThemeContext = createContext();

const defaultPreferences = {
  theme: "light",
  fontFamily: "inter",
  fontSize: "normal",
  sidebarMode: "expanded",
};

export const ThemeProvider = ({
  children,
}) => {
  const [preferences, setPreferences] =
    useState(defaultPreferences);

  const [loading, setLoading] =
    useState(true);

  // ==========================================
  // APPLY THEME
  // ==========================================

  const applyTheme = (theme) => {
    const root =
      document.documentElement;

    let finalTheme = theme;

    if (theme === "system") {
      const prefersDark =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

      finalTheme = prefersDark
        ? "dark"
        : "light";
    }

    if (finalTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.setAttribute(
      "data-theme",
      finalTheme
    );
  };

  // ==========================================
  // APPLY FONT
  // ==========================================

  const applyFont = (fontFamily) => {
    const root =
      document.documentElement;

    root.setAttribute(
      "data-font",
      fontFamily
    );
  };

  // ==========================================
  // APPLY FONT SIZE
  // ==========================================

  const applyFontSize = (fontSize) => {
    document.documentElement.setAttribute(
      "data-font-size",
      fontSize
    );
  };

  // ==========================================
  // APPLY ALL SETTINGS
  // ==========================================

  const applyPreferences = (
    newPreferences
  ) => {
    applyTheme(
      newPreferences.theme || "light"
    );

    applyFont(
      newPreferences.fontFamily ||
        "inter"
    );

    applyFontSize(
      newPreferences.fontSize ||
        "normal"
    );
  };

  // ==========================================
  // LOAD PREFERENCES
  // ==========================================

  const loadPreferences = async () => {
    const token = localStorage.getItem(
      "hms_token"
    );

    if (!token) {
      setPreferences(
        defaultPreferences
      );

      applyPreferences(
        defaultPreferences
      );

      setLoading(false);

      return;
    }

    try {
      const { data } = await api.get(
        "/preferences/me"
      );

      const loaded = {
        ...defaultPreferences,
        ...(data.preferences || {}),
      };

      setPreferences(loaded);

      applyPreferences(loaded);
    } catch (error) {
      console.error(
        "Failed to load preferences:",
        error
      );

      setPreferences(
        defaultPreferences
      );

      applyPreferences(
        defaultPreferences
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  // ==========================================
  // UPDATE PREFERENCE
  // ==========================================

  const updatePreference = async (
    key,
    value
  ) => {
    const previous = preferences;

    const updated = {
      ...preferences,
      [key]: value,
    };

    // Update UI immediately
    setPreferences(updated);

    applyPreferences(updated);

    try {
      const { data } = await api.put(
        "/preferences/me",
        {
          [key]: value,
        }
      );

      const saved = {
        ...updated,
        ...(data.preferences || {}),
      };

      setPreferences(saved);

      applyPreferences(saved);

      return {
        success: true,
      };
    } catch (error) {
      // Restore old settings when API fails
      setPreferences(previous);

      applyPreferences(previous);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to save preference.",
      };
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        preferences,
        loading,
        updatePreference,
        reloadPreferences:
          loadPreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () =>
  useContext(ThemeContext);

export default ThemeContext;