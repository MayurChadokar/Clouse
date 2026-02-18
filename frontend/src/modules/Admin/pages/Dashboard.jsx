import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import StatsCards from "../components/Analytics/StatsCards";
import RevenueLineChart from "../components/Analytics/RevenueLineChart";
import SalesBarChart from "../components/Analytics/SalesBarChart";
import OrderStatusPieChart from "../components/Analytics/OrderStatusPieChart";
import CustomerGrowthAreaChart from "../components/Analytics/CustomerGrowthAreaChart";
import RevenueVsOrdersChart from "../components/Analytics/RevenueVsOrdersChart";
import TopProducts from "../components/Analytics/TopProducts";
import RecentOrders from "../components/Analytics/RecentOrders";
import TimePeriodFilter from "../components/Analytics/TimePeriodFilter";
import ExportButton from "../components/ExportButton";
import { formatCurrency } from "../utils/adminHelpers";
import {
  getDashboardStats,
  getRevenueData,
  getOrderStatusBreakdown,
  getTopProducts,
  getCustomerGrowth,
  getRecentOrders,
} from "../services/adminService";

const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalVendors: 0,
    pendingOrders: 0,
  });
  const [revenueData, setRevenueData] = useState([]);

  // Normalize API revenue data {_id, revenue, orders} → {date, revenue, orders}
  const normalizeRevenueData = (data) =>
    (data || []).map((item) => ({
      date: item._id ? new Date(item._id + '-01').toISOString() : new Date().toISOString(),
      revenue: item.revenue || 0,
      orders: item.orders || 0,
    }));
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerGrowth, setCustomerGrowth] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        revenueRes,
        orderStatusRes,
        topProductsRes,
        customerGrowthRes,
        recentOrdersRes,
      ] = await Promise.allSettled([
        getDashboardStats(),
        getRevenueData(period),
        getOrderStatusBreakdown(),
        getTopProducts(),
        getCustomerGrowth(period),
        getRecentOrders(),
      ]);

      if (statsRes.status === "fulfilled") {
        const d = statsRes.value.data;
        setStats({
          totalRevenue: d.totalRevenue || 0,
          totalOrders: d.totalOrders || 0,
          totalProducts: d.totalProducts || 0,
          totalCustomers: d.totalUsers || 0,
          totalVendors: d.totalVendors || 0,
          pendingOrders: d.pendingOrders || 0,
        });
      }
      if (revenueRes.status === "fulfilled") {
        setRevenueData(normalizeRevenueData(revenueRes.value.data));
      }
      if (orderStatusRes.status === "fulfilled") {
        setOrderStatusData(orderStatusRes.value.data || []);
      }
      if (topProductsRes.status === "fulfilled") {
        setTopProducts(topProductsRes.value.data || []);
      }
      if (customerGrowthRes.status === "fulfilled") {
        setCustomerGrowth(customerGrowthRes.value.data || []);
      }
      if (recentOrdersRes.status === "fulfilled") {
        setRecentOrders(recentOrdersRes.value.data || []);
      }
    } catch (error) {
      // Don't toast here as api.js interceptor handled global errors
      // or to avoid 6+ toasts if all parallel requests fail simultaneously
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full">
          <TimePeriodFilter selectedPeriod={period} onPeriodChange={setPeriod} />
          <ExportButton
            data={revenueData}
            headers={[
              { label: "Period", accessor: (row) => row._id },
              { label: "Revenue", accessor: (row) => formatCurrency(row.revenue) },
              { label: "Orders", accessor: (row) => row.orders },
            ]}
            filename="revenue_report"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueLineChart data={revenueData} period={period} />
        <SalesBarChart data={revenueData} period={period} />
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueVsOrdersChart data={revenueData} period={period} />
        <OrderStatusPieChart data={orderStatusData} />
      </div>

      {/* Customer Growth Chart */}
      <div className="grid grid-cols-1 gap-6">
        <CustomerGrowthAreaChart data={customerGrowth} period={period} />
      </div>

      {/* Products and Orders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProducts products={topProducts} />
        <RecentOrders
          orders={recentOrders}
          onViewOrder={(order) => navigate(`/admin/orders/${order._id || order.orderId}`)}
        />
      </div>
    </motion.div>
  );
};

export default Dashboard;
