import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";

const STATUS_OPTIONS = ["", "created", "pending", "paid", "failed", "cancelled", "refunded"];
const GATEWAY_OPTIONS = ["", "razorpay", "manual"];

const formatAmount = (value) => Number(value || 0).toFixed(2);

const AdminPayments = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("");
  const [search, setSearch] = useState("");

  const menuItems = useMemo(
    () => [
      { name: "Dashboard", path: "/admin/dashboard" },
      { name: "Courses", path: "/admin/courses" },
      { name: "Students", path: "/admin/students" },
      { name: "Instructors", path: "/admin/instructors" },
      { name: "Payments", path: "/admin/payments" }
    ],
    []
  );

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/users/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          status: statusFilter || undefined,
          gateway: gatewayFilter || undefined,
          search: search.trim() || undefined,
          page: 1,
          limit: 200
        }
      });
      setOrders(response?.data?.orders || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load payment orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen text-white bg-black">
      <nav className="w-64 min-h-screen p-6 border-r bg-stone-950 border-fuchsia-900 max-sm:hidden">
        <div className="mb-10">
          <h2 className="text-3xl font-bold">
            Admin<span className="text-fuchsia-500">Panel</span>
          </h2>
        </div>

        <ul className="space-y-6">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className="block px-4 py-2 text-xl transition duration-200 rounded hover:bg-fuchsia-700 hover:text-black"
              >
                {item.name}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-xl text-left transition duration-200 rounded hover:bg-fuchsia-700 hover:text-black"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-center px-10 py-5 border-b border-solid bg-stone-950 border-b-fuchsia-900">
          <h1 className="text-3xl font-bold text-white">
            <span>Code</span>
            <span className="text-fuchsia-500">Hub</span>
          </h1>
        </header>

        <main className="flex-1 p-7 max-sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-4xl">Payments</h2>
            <button
              type="button"
              className="px-4 py-2 text-sm text-white rounded bg-fuchsia-700 hover:bg-fuchsia-600"
              onClick={fetchOrders}
            >
              Refresh
            </button>
          </div>

          <div className="grid gap-3 p-4 mb-5 border rounded-xl border-fuchsia-700 bg-stone-950 md:grid-cols-4">
            <input
              type="text"
              placeholder="Search order/user/course"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="px-3 py-2 text-white border rounded bg-black border-stone-700"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-3 py-2 text-white border rounded bg-black border-stone-700"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status || "all"} value={status}>
                  {status ? `Status: ${status}` : "All Status"}
                </option>
              ))}
            </select>
            <select
              value={gatewayFilter}
              onChange={(event) => setGatewayFilter(event.target.value)}
              className="px-3 py-2 text-white border rounded bg-black border-stone-700"
            >
              {GATEWAY_OPTIONS.map((gateway) => (
                <option key={gateway || "all"} value={gateway}>
                  {gateway ? `Gateway: ${gateway}` : "All Gateways"}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="px-3 py-2 text-sm text-white rounded bg-fuchsia-700 hover:bg-fuchsia-600"
              onClick={fetchOrders}
            >
              Apply Filters
            </button>
          </div>

          {error && <p className="mb-4 text-red-400">{error}</p>}
          {loading ? <p>Loading orders...</p> : null}

          <section className="overflow-x-auto border border-white border-solid rounded-lg bg-stone-950">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-fuchsia-900 bg-opacity-20">
                <tr>
                  <th className="px-4 py-3 border-b border-white">Order</th>
                  <th className="px-4 py-3 border-b border-white">User</th>
                  <th className="px-4 py-3 border-b border-white">Course</th>
                  <th className="px-4 py-3 border-b border-white">Gateway</th>
                  <th className="px-4 py-3 border-b border-white">Status</th>
                  <th className="px-4 py-3 border-b border-white">Amounts</th>
                  <th className="px-4 py-3 border-b border-white">Gateway IDs</th>
                  <th className="px-4 py-3 border-b border-white">Dates</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && !loading ? (
                  <tr>
                    <td className="px-4 py-4 text-gray-300 border-b border-white" colSpan={8}>
                      No payment orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-white hover:bg-black/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{order.orderCode}</p>
                        <p className="text-xs text-gray-400">ID: {order.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{order.user?.username || "N/A"}</p>
                        <p className="text-xs text-gray-400">{order.user?.email || "N/A"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{order.courseName}</p>
                        <p className="text-xs text-gray-400">{order.courseSlug}</p>
                      </td>
                      <td className="px-4 py-3 uppercase">{order.gateway || "N/A"}</td>
                      <td className="px-4 py-3">{order.status}</td>
                      <td className="px-4 py-3">
                        <p>Amount: INR {formatAmount(order.amount)}</p>
                        <p>Discount: INR {formatAmount(order.discount)}</p>
                        <p className="font-semibold">Final: INR {formatAmount(order.finalAmount)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="break-all">Order: {order.gatewayOrderId || "-"}</p>
                        <p className="break-all">Payment: {order.gatewayPaymentId || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>Created: {order.created_at || "-"}</p>
                        <p>Paid: {order.paidAt || "-"}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminPayments;

