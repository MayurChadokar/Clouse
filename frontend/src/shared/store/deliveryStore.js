import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as adminService from '../../modules/Admin/services/adminService';
import toast from 'react-hot-toast';

export const useDeliveryStore = create(
    (set, get) => ({
        deliveryBoys: [],
        isLoading: false,
        error: null,
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        },

        fetchDeliveryBoys: async (params = {}) => {
            set({ isLoading: true });
            try {
                const response = await adminService.getAllDeliveryBoys(params);
                const deliveryBoys = (response.data.deliveryBoys || []).map((boy) => ({
                    ...boy,
                    id: boy.id || boy._id,
                    status: boy.status || (boy.isActive ? 'active' : 'inactive'),
                    totalDeliveries: boy.totalDeliveries ?? boy.stats?.totalDeliveries ?? 0,
                    pendingDeliveries: boy.pendingDeliveries ?? boy.stats?.pendingDeliveries ?? 0,
                    cashInHand: boy.cashInHand ?? boy.stats?.cashInHand ?? 0
                }));
                set({
                    deliveryBoys,
                    pagination: response.data.pagination,
                    isLoading: false
                });
            } catch (error) {
                set({ error: error.message, isLoading: false });
                toast.error(error.message || 'Failed to fetch delivery boys');
            }
        },

        addDeliveryBoy: async (boyData) => {
            set({ isLoading: true });
            try {
                const response = await adminService.createDeliveryBoy(boyData);
                const createdBoy = {
                    ...response.data,
                    id: response.data.id || response.data._id,
                    status: response.data.status || (response.data.isActive ? 'active' : 'inactive')
                };
                set((state) => ({
                    deliveryBoys: [createdBoy, ...state.deliveryBoys],
                    isLoading: false
                }));
                toast.success('Delivery boy added successfully');
                return true;
            } catch (error) {
                set({ isLoading: false });
                toast.error(error.message || 'Failed to add delivery boy');
                return false;
            }
        },

        updateStatus: async (id, isActive) => {
            try {
                await adminService.updateDeliveryBoyStatus(id, isActive);
                set((state) => ({
                    deliveryBoys: state.deliveryBoys.map((b) =>
                        b.id === id ? { ...b, isActive, status: isActive ? 'active' : 'inactive' } : b
                    )
                }));
                toast.success('Status updated successfully');
            } catch (error) {
                toast.error(error.message || 'Failed to update status');
            }
        },

        settleCash: async (id, amount) => {
            set({ isLoading: true });
            try {
                await adminService.settleCash(id, amount);
                // Refresh data
                await get().fetchDeliveryBoys();
                toast.success('Cash settled successfully');
                set({ isLoading: false });
                return true;
            } catch (error) {
                set({ isLoading: false });
                toast.error(error.message || 'Failed to settle cash');
                return false;
            }
        }
    })
);
