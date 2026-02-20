import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../../../shared/utils/api";
import { registerVendor, updateVendorProfile } from "../services/vendorService";

export const useVendorAuthStore = create(
  persist(
    (set, get) => ({
      vendor: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Vendor login action
      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const response = await api.post("/vendor/auth/login", {
            email,
            password,
          });
          const authData = response?.data || {};
          const vendor = authData.vendor;
          const accessToken = authData.accessToken;

          if (!vendor || !accessToken) {
            throw new Error("Invalid login response");
          }

          set({
            vendor,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store token for vendor API requests
          localStorage.setItem("vendor-token", accessToken);

          return { success: true, vendor };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Vendor registration action — calls real POST /vendor/auth/register
      // Backend sends an OTP email; vendor is NOT authenticated until OTP verified.
      register: async (vendorData) => {
        set({ isLoading: true });
        try {
          const response = await registerVendor(vendorData);
          // response is already unwrapped by api.js interceptor → response.data
          const data = response?.data ?? response;

          set({ isLoading: false });

          return {
            success: true,
            message:
              data?.message ||
              "Registration successful! Please check your email for the OTP.",
          };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Vendor logout action
      logout: () => {
        set({
          vendor: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem("vendor-token");
      },

      // Update vendor profile — calls real PUT /vendor/auth/profile
      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const response = await updateVendorProfile(profileData);
          const data = response?.data ?? response;
          // Merge returned vendor data back into state so UI stays in sync
          const updatedVendor = data?.vendor ?? { ...get().vendor, ...profileData };

          set({
            vendor: updatedVendor,
            isLoading: false,
          });

          return { success: true, vendor: updatedVendor };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Initialize vendor auth state from localStorage
      initialize: () => {
        const token = localStorage.getItem("vendor-token");
        if (token) {
          const storedState = JSON.parse(
            localStorage.getItem("vendor-auth-storage") || "{}"
          );
          const persistedVendor = storedState.state?.vendor || null;
          if (persistedVendor) {
            set({
              vendor: persistedVendor,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        }
      },
    }),
    {
      name: "vendor-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
