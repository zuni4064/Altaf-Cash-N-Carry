import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  BarChart3, Package, Users, ShoppingBag, LogOut, TrendingUp,
  Banknote, Clock, CheckCircle, BoxIcon, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import React, { Suspense, useEffect as useEffect2 } from "react";

// Lazy load heavy sub-components
const AnalyticsCharts = React.lazy(() => import("@/components/admin/AnalyticsCharts"));
const ProductManagement = React.lazy(() => import("@/components/admin/ProductManagement"));

interface OrderItem {
  product_id: string;
  quantity: number;
  price_at_time: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  phone: string;
  address: string;
  payment_method: string;
  status: string;
  total: number;
  items: OrderItem[];
  created_at: string;
}

interface CustomerInfo {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string;
  created_at: string;
}

const statusOptions = ["confirmed", "preparing", "out-for-delivery", "delivered", "cancelled"];
const ORDERS_PER_PAGE = 10;

const TabLoader = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-24 w-full rounded-lg" />
    ))}
  </div>
);

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<"overview" | "orders" | "customers" | "analytics" | "products">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<any[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch products for stock notifications
  const fetchProducts = useCallback(async () => {
    const { data: productsData, error } = await supabase
      .from('products')
      .select('*');
    
    if (!error && productsData) {
      setProducts(productsData);
    }
  }, []);

  // Fetch orders function
  const fetchOrders = async () => {
    setLoading(true);
    
    // Fetch orders and their items
    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      setOrders([]);
      setLoading(false);
      return;
    }
    
    // Fetch all order items
    const { data: orderItemsData } = await supabase
      .from("order_items")
      .select("*");
    
    // Merge items into orders
    const ordersWithItems = (ordersData || []).map(order => ({
      ...order,
      items: (orderItemsData || []).filter(item => item.order_id === order.id)
    }));
    
    setOrders(ordersWithItems);
    setLoading(false);
  };

  // Fetch customers function
  const fetchCustomers = async () => {
    try {
      // First get profiles with user data
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email, created_at")
        .order("created_at", { ascending: false });
      
      if (profilesError) {
        console.error("Error fetching customers:", profilesError);
        
        // Fallback: try fetching from orders (for guest checkouts)
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("customer_email, customer_name, phone, created_at")
          .order("created_at", { ascending: false });
        
        if (ordersError) {
          console.error("Error fetching customers from orders:", ordersError);
          toast.error("Failed to load customers");
          return;
        }
        
        // Convert orders to customer format
        const uniqueCustomers = new Map();
        ordersData?.forEach(order => {
          if (order.customer_email && !uniqueCustomers.has(order.customer_email)) {
            uniqueCustomers.set(order.customer_email, {
              user_id: order.customer_email,
              full_name: order.customer_name,
              phone: order.phone,
              email: order.customer_email,
              created_at: order.created_at
            });
          }
        });
        
        setCustomers(Array.from(uniqueCustomers.values()));
        return;
      }
      
      // If profiles exist, get the admin user_id to filter out
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      
      const adminUserIds = new Set(rolesData?.map(r => r.user_id) || []);
      
      // Filter out admin users and get emails from orders if needed
      const { data: ordersData } = await supabase
        .from("orders")
        .select("customer_email, user_id")
        .not("customer_email", "is", null);
      
      // Create a map of user_id to email from orders
      const userEmailMap = new Map();
      ordersData?.forEach(order => {
        if (order.user_id && order.customer_email) {
          userEmailMap.set(order.user_id, order.customer_email);
        }
      });
      
      // Filter out admin users and update emails
      const customersWithEmail = profilesData
        ?.filter(profile => !adminUserIds.has(profile.user_id))
        .map(profile => ({
          ...profile,
          email: profile.email || userEmailMap.get(profile.user_id) || null
        })) || [];
      
      setCustomers(customersWithEmail);
    } catch (err) {
      console.error("Error fetching customers:", err);
      toast.error("Failed to load customers");
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, [fetchProducts]);

  // Calculate out-of-stock and low stock items
  const outOfStockCount = products.filter(p => !p.in_stock || p.stock === 0).length;
  const lowStockCount = products.filter(p => p.in_stock && p.stock > 0 && p.stock <= 5).length;
  
  // Product name mapping
  const productNames: Record<string, string> = {
    'fv1': 'Fresh Red Apples', 'fv2': 'Organic Bananas', 'fv3': 'Fresh Tomatoes',
    'fv4': 'Green Capsicum', 'fv5': 'Fresh Spinach', 'fv6': 'Carrots',
    'fv7': 'Fresh Mangoes', 'fv8': 'Potatoes', 'fv9': 'Onions', 'fv10': 'Watermelon',
    'd1': 'Fresh Milk', 'd2': 'Natural Yogurt', 'd3': 'Cheddar Cheese', 'd4': 'Butter',
    'd5': 'Cream', 'd6': 'Eggs (Pack of 12)', 'd7': 'Paneer', 'd8': 'Raita',
    'd9': 'Lassi', 'd10': 'Mozzarella Cheese',
    'b1': 'Green Tea Pack', 'b2': 'Orange Juice', 'b3': 'Cola Pack (6)', 'b4': 'Mineral Water',
    'b5': 'Mango Juice', 'b6': 'Coffee Beans', 'b7': 'Lemonade', 'b8': 'Chai Tea',
    'b9': 'Energy Drink', 'b10': 'Sparkling Water',
    's1': 'Classic Potato Chips', 's2': 'Mixed Nuts', 's3': 'Chocolate Cookies',
    's4': 'Popcorn', 's5': 'Nachos', 's6': 'Biscuits Pack', 's7': 'Nimko Mix',
    's8': 'Pretzels', 's9': 'Candy Pack', 's10': 'Granola Bars',
    'bk1': 'White Bread', 'bk2': 'Brown Bread', 'bk3': 'Croissants', 'bk4': 'Donuts',
    'bk5': 'Muffins', 'bk6': 'Naan',
    'h1': 'Dish Soap', 'h2': 'Laundry Detergent', 'h3': 'Broom Set', 'h4': 'Mop', 'h5': 'Trash Bags',
    'pc1': 'Shampoo', 'pc2': 'Body Wash', 'pc3': 'Toothpaste', 'pc4': 'Face Wash', 'pc5': 'Moisturizer',
  };
  
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };
  
  const getProductName = (productId: string) => {
    return productNames[productId] || productId || "Unknown Product";
  };

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      fetchOrders(); // revert on failure
    } else {
      toast.success("Status updated!");
    }
  }, []);

  // Debounced order search
  const handleOrderSearch = useCallback((value: string) => {
    setOrderSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedOrderSearch(value);
      setOrderPage(1);
    }, 250);
  }, []);

  // Memoized stats
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const deliveredOrders = orders.filter(o => o.status === "delivered").length;
    const pendingOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled").length;
    return { totalRevenue, deliveredOrders, pendingOrders };
  }, [orders]);

  // Filtered + paginated orders
  const { filteredOrders, orderTotalPages, pageOrders } = useMemo(() => {
    let list = orders;
    if (orderStatusFilter !== "all") list = list.filter(o => o.status === orderStatusFilter);
    if (debouncedOrderSearch) {
      const q = debouncedOrderSearch.toLowerCase();
      list = list.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        (o.customer_email || "").toLowerCase().includes(q) ||
        o.phone.includes(q)
      );
    }
    const totalPages = Math.ceil(list.length / ORDERS_PER_PAGE);
    const start = (orderPage - 1) * ORDERS_PER_PAGE;
    return {
      filteredOrders: list,
      orderTotalPages: totalPages,
      pageOrders: list.slice(start, start + ORDERS_PER_PAGE),
    };
  }, [orders, orderStatusFilter, debouncedOrderSearch, orderPage]);

  const statusColor: Record<string, string> = {
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    preparing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "out-for-delivery": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const paymentLabels: Record<string, string> = {
    cod: "COD", jazzcash: "JazzCash", easypaisa: "Easypaisa", card: "Card", bank: "Bank",
  };

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: BarChart3 },
    { key: "analytics" as const, label: "Analytics", icon: TrendingUp },
    { key: "orders" as const, label: "Orders", icon: Package },
    { key: "products" as const, label: "Products", icon: BoxIcon },
    { key: "customers" as const, label: "Customers", icon: Users },
  ];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your store</p>
        </div>
        <Button variant="outline" onClick={signOut} className="text-destructive border-destructive/30 hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>

      {/* Out of Stock Notification Banner */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-6 p-4 rounded-lg border"
          style={{
            backgroundColor: outOfStockCount > 0 ? '#fef2f2' : '#fffbeb',
            borderColor: outOfStockCount > 0 ? '#fecaca' : '#fde68a',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${outOfStockCount > 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                {outOfStockCount > 0 ? (
                  <Package className="h-5 w-5 text-red-600" />
                ) : (
                  <Package className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="font-medium" style={{ color: outOfStockCount > 0 ? '#dc2626' : '#d97706' }}>
                  {outOfStockCount > 0 
                    ? `${outOfStockCount} product${outOfStockCount > 1 ? 's' : ''} out of stock!`
                    : `${lowStockCount} product${lowStockCount > 1 ? 's' : ''} low on stock`
                  }
                </p>
                <p className="text-sm" style={{ color: outOfStockCount > 0 ? '#991b1b' : '#92400e' }}>
                  {outOfStockCount > 0 
                    ? 'Urgent: Restock these items to fulfill customer orders.'
                    : 'Consider restocking these items soon.'
                  }
                </p>
              </div>
            </div>
            <Button 
              variant={outOfStockCount > 0 ? "destructive" : "outline"}
              size="sm"
              onClick={() => setTab("products")}
              className={outOfStockCount > 0 ? "" : "border-yellow-500 text-yellow-700 hover:bg-yellow-50"}
            >
              {outOfStockCount > 0 ? 'Restock Now' : 'View Items'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {/* List of affected products */}
          {outOfStockCount > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: '#fecaca' }}>
              <p className="text-xs font-medium mb-2" style={{ color: '#991b1b' }}>Out of Stock Items:</p>
              <div className="flex flex-wrap gap-1">
                {products.filter(p => !p.in_stock || p.stock === 0).slice(0, 5).map((p) => (
                  <span 
                    key={p.id} 
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-800"
                  >
                    {p.name}
                  </span>
                ))}
                {products.filter(p => !p.in_stock || p.stock === 0).length > 5 && (
                  <span className="text-xs px-2 py-1 text-red-600">
                    +{products.filter(p => !p.in_stock || p.stock === 0).length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {lowStockCount > 0 && outOfStockCount === 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: '#fde68a' }}>
              <p className="text-xs font-medium mb-2" style={{ color: '#92400e' }}>Low Stock Items (≤5):</p>
              <div className="flex flex-wrap gap-1">
                {products.filter(p => p.in_stock && p.stock > 0 && p.stock <= 5).slice(0, 5).map((p) => (
                  <span 
                    key={p.id} 
                    className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800"
                  >
                    {p.name} ({p.stock})
                  </span>
                ))}
                {products.filter(p => p.in_stock && p.stock > 0 && p.stock <= 5).length > 5 && (
                  <span className="text-xs px-2 py-1 text-yellow-600">
                    +{products.filter(p => p.in_stock && p.stock > 0 && p.stock <= 5).length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? "bg-card border border-b-0 border-border text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
            ) : (
              [
                { label: "Total Revenue", value: `PKR ${Math.round(stats.totalRevenue).toLocaleString()}`, icon: Banknote, color: "text-primary" },
                { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-secondary" },
                { label: "Delivered", value: stats.deliveredOrders, icon: CheckCircle, color: "text-success" },
                { label: "Pending", value: stats.pendingOrders, icon: Clock, color: "text-warning" },
              ].map((stat, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No orders yet</p>
              ) : (
                orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <span className="font-mono text-sm font-bold">{o.order_number}</span>
                      <p className="text-xs text-muted-foreground">{o.customer_name}</p>
                      {o.items && o.items.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {o.items.slice(0, 2).map((item: OrderItem) => getProductName(item.product_id)).join(", ")}
                          {o.items.length > 2 && ` +${o.items.length - 2} more`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[o.status] || ""}`}>{o.status}</span>
                      <p className="text-sm font-semibold mt-1">PKR {o.total}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={orderSearch}
                onChange={e => handleOrderSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={orderStatusFilter} onValueChange={(v) => { setOrderStatusFilter(v); setOrderPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center">{filteredOrders.length} orders</p>
          </div>

          {loading ? (
            <TabLoader />
          ) : pageOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No orders found</p>
          ) : pageOrders.map(o => (
            <div key={o.id} className="bg-card rounded-lg border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <span className="font-mono text-sm font-bold">{o.order_number}</span>
                  <p className="text-sm mt-1">{o.customer_name} • {o.phone}</p>
                  {o.customer_email && <p className="text-xs text-muted-foreground">{o.customer_email}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{o.address}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-PK")}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-primary text-lg">PKR {o.total}</span>
                  <span className="text-xs text-muted-foreground">{paymentLabels[o.payment_method] || o.payment_method}</span>
                  <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                    <SelectTrigger className="w-44 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border-t border-border pt-2">
                <button 
                  onClick={() => toggleOrderExpand(o.id)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {expandedOrders.has(o.id) ? (
                    <><ChevronUp className="h-3 w-3" /> Hide Items</>
                  ) : (
                    <><ChevronDown className="h-3 w-3" /> Show Items ({o.items?.length || 0})</>
                  )}
                </button>
                
                {expandedOrders.has(o.id) && o.items && o.items.length > 0 && (
                  <div className="mt-2 space-y-1 bg-muted/30 rounded p-2">
                    {o.items.map((item: OrderItem, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{getProductName(item.product_id)}</span>
                        <span className="text-muted-foreground">×{item.quantity} × PKR {item.price_at_time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Order pagination */}
          {orderTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={orderPage <= 1} onClick={() => setOrderPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {orderPage} of {orderTotalPages}</span>
              <Button variant="outline" size="sm" disabled={orderPage >= orderTotalPages} onClick={() => setOrderPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Customers Tab */}
      {tab === "customers" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted-foreground py-8">No customers yet</td></tr>
                ) : customers.map(c => (
                  <tr key={c.user_id} className="border-b border-border last:border-0">
                    <td className="p-3">{c.full_name || "—"}</td>
                    <td className="p-3 text-muted-foreground">{c.email || "—"}</td>
                    <td className="p-3 text-muted-foreground">{c.phone || "—"}</td>
                    <td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-PK")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <Suspense fallback={<TabLoader />}>
          <AnalyticsCharts orders={orders} />
        </Suspense>
      )}

      {/* Products Tab */}
      {tab === "products" && (
        <Suspense fallback={<TabLoader />}>
          <ProductManagement />
        </Suspense>
      )}
    </div>
  );
};

export default AdminDashboard;
