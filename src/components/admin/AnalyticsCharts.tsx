import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  product_id: string;
  quantity: number;
  price_at_time: number;
}

interface Order {
  id: string;
  total: number;
  items: OrderItem[];
  status: string;
  created_at: string;
  payment_method: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
];

// Product name lookup - we'll fetch from products table
const useProductNames = () => {
  const [products, setProducts] = React.useState<Map<string, string>>(new Map());
  
  React.useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('inventory').select('product_id');
      // For now, we'll use a fallback mapping for common products
      // In production, you'd have a products table with names
      const productMap = new Map<string, string>();
      
      // Common product ID to name mapping from the app's product data
      const productNames: Record<string, string> = {
        'fv1': 'Fresh Red Apples',
        'fv2': 'Organic Bananas',
        'fv3': 'Fresh Tomatoes',
        'fv4': 'Green Capsicum',
        'fv5': 'Fresh Spinach',
        'fv6': 'Carrots',
        'fv7': 'Fresh Mangoes',
        'fv8': 'Potatoes',
        'fv9': 'Onions',
        'fv10': 'Watermelon',
        'd1': 'Fresh Milk',
        'd2': 'Natural Yogurt',
        'd3': 'Cheddar Cheese',
        'd4': 'Butter',
        'd5': 'Cream',
        'd6': 'Eggs (Pack of 12)',
        'd7': 'Paneer',
        'd8': 'Raita',
        'd9': 'Lassi',
        'd10': 'Mozzarella Cheese',
        'b1': 'Green Tea Pack',
        'b2': 'Orange Juice',
        'b3': 'Cola Pack (6)',
        'b4': 'Mineral Water',
        'b5': 'Mango Juice',
        'b6': 'Coffee Beans',
        'b7': 'Lemonade',
        'b8': 'Chai Tea',
        'b9': 'Energy Drink',
        'b10': 'Sparkling Water',
        's1': 'Classic Potato Chips',
        's2': 'Mixed Nuts',
        's3': 'Chocolate Cookies',
        's4': 'Popcorn',
        's5': 'Nachos',
        's6': 'Biscuits Pack',
        's7': 'Nimko Mix',
        's8': 'Pretzels',
        's9': 'Candy Pack',
        's10': 'Granola Bars',
        'bk1': 'White Bread',
        'bk2': 'Brown Bread',
        'bk3': 'Croissants',
        'bk4': 'Donuts',
        'bk5': 'Muffins',
        'bk6': 'Naan',
        'h1': 'Dish Soap',
        'h2': 'Laundry Detergent',
        'h3': 'Broom Set',
        'h4': 'Mop',
        'h5': 'Trash Bags',
        'pc1': 'Shampoo',
        'pc2': 'Body Wash',
        'pc3': 'Toothpaste',
        'pc4': 'Face Wash',
        'pc5': 'Moisturizer',
      };
      
      Object.entries(productNames).forEach(([id, name]) => {
        productMap.set(id, name);
      });
      
      setProducts(productMap);
    };
    
    fetchProducts();
  }, []);
  
  return products;
};

const AnalyticsCharts = ({ orders }: { orders: Order[] }) => {
  const productNames = useProductNames();
  
  const dailySales = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; orders: number }>();
    const sorted = [...orders]
      .filter((o) => o.status !== "cancelled")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    sorted.forEach((o) => {
      const date = new Date(o.created_at).toLocaleDateString("en-PK", { month: "short", day: "numeric" });
      const existing = map.get(date) || { date, revenue: 0, orders: 0 };
      existing.revenue += Number(o.total);
      existing.orders += 1;
      map.set(date, existing);
    });

    return Array.from(map.values()).slice(-14);
  }, [orders]);

  const popularProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders
      .filter((o) => o.status !== "cancelled")
      .forEach((o) => {
        if (!Array.isArray(o.items)) return;
        (o.items as OrderItem[]).forEach((item) => {
          // Use product name lookup, fallback to product_id if not found
          const name = productNames.get(item.product_id) || item.product_id || "Unknown Product";
          const existing = map.get(name) || { name, quantity: 0, revenue: 0 };
          existing.quantity += item.quantity || 1;
          existing.revenue += (item.price_at_time || 0) * (item.quantity || 1);
          map.set(name, existing);
        });
      });
    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders, productNames]);

  const paymentBreakdown = useMemo(() => {
    const labels: Record<string, string> = {
      cod: "Cash on Delivery",
      jazzcash: "JazzCash",
      easypaisa: "Easypaisa",
      card: "Card",
      bank: "Bank Transfer",
    };
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const method = labels[o.payment_method] || o.payment_method;
      map.set(method, (map.get(method) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const s = o.status.charAt(0).toUpperCase() + o.status.slice(1).replace(/-/g, " ");
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const hasValidOrders = useMemo(() => {
    return orders.some(o => o.status !== "cancelled");
  }, [orders]);

  if (orders.length === 0 || !hasValidOrders) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>No order data yet. Analytics will appear once you have completed orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sales Trend - Full Width */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Sales Trend (Last 14 Days)</h3>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={dailySales} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `PKR ${v}`} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 13,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: "10px 14px"
              }}
              formatter={(value: number) => [`PKR ${Math.round(value).toLocaleString()}`, "Revenue"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 7, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Popular Products */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-lg">Top Products</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularProducts} layout="vertical" margin={{ left: 20, right: 30, top: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 13,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={28}>
                {popularProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment & Status - Stacked */}
        <div className="flex flex-col gap-6">
          {/* Payment Methods */}
          <div className="bg-card rounded-lg border border-border p-6 flex-1">
            <h3 className="font-semibold text-lg mb-4">Payment Methods</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie 
                    data={paymentBreakdown} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={60} 
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} 
                    labelLine={false} 
                    style={{ fontSize: 11 }}
                  >
                    {paymentBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {paymentBreakdown.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-card rounded-lg border border-border p-6 flex-1">
            <h3 className="font-semibold text-lg mb-4">Order Status</h3>
            <div className="space-y-3">
              {statusBreakdown.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-sm flex-1">{s.name}</span>
                  <span className="text-sm font-bold">{s.value}</span>
                </div>
              ))}
            </div>
            {/* Simple bar visualization */}
            <div className="mt-4 space-y-2">
              {statusBreakdown.map((s, i) => {
                const total = statusBreakdown.reduce((sum, item) => sum + item.value, 0);
                const percentage = total > 0 ? (s.value / total) * 100 : 0;
                return (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{s.name}</span>
                      <span>{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ 
                          width: `${percentage}%`,
                          background: COLORS[i % COLORS.length]
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
