import { useState, useEffect, useCallback } from "react";
import { products as defaultProducts, categories, type Product } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Search, Package, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const getImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (img.default) return img.default;
  if (img.src) return img.src;
  return String(img);
};

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const emptyProduct: Partial<Product> = {
  name: "",
  category: "",
  price: 0,
  unit: "kg",
  description: "",
  image: "",
  inStock: true,
  stock: 50,
  rating: 4.0,
  reviewCount: 0,
};

type DbProduct = {
  id: string;
  name?: string;
  category?: string;
  price?: number;
  unit?: string;
  description?: string;
  image?: string;
  badge?: string | null;
  discount?: number | null;
  in_stock: boolean;
  stock?: number;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
};

const ProductManagement = () => {
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>(emptyProduct);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let mergedProducts = [...defaultProducts];
      const staticProductsMap = new Map(defaultProducts.map(p => [p.id, p]));

      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true }) as { data: DbProduct[] | null, error: any };

      if (error) {
        console.error("Error fetching from DB:", error);
      }

      if (dbProducts && dbProducts.length > 0) {
        mergedProducts = dbProducts.map((dbProduct) => {
          const staticProduct = staticProductsMap.get(dbProduct.id);
          if (staticProduct) {
            const staticImageUrl = getImageUrl(staticProduct.image);
            return {
              ...staticProduct,
              name: dbProduct.name || staticProduct.name,
              category: dbProduct.category || staticProduct.category,
              price: dbProduct.price ?? staticProduct.price,
              unit: dbProduct.unit || staticProduct.unit,
              description: dbProduct.description || staticProduct.description,
              image: staticImageUrl || dbProduct.image || '',
              badge: dbProduct.badge || staticProduct.badge,
              discount: dbProduct.discount ?? staticProduct.discount,
              inStock: dbProduct.in_stock,
              stock: dbProduct.stock ?? 0,
              rating: dbProduct.rating ?? staticProduct.rating ?? 4.0,
              reviewCount: dbProduct.review_count ?? staticProduct.reviewCount ?? 0,
            };
          } else {
            return {
              id: dbProduct.id,
              name: dbProduct.name || 'Unknown Product',
              category: dbProduct.category || 'other',
              price: dbProduct.price || 0,
              unit: dbProduct.unit || 'piece',
              description: dbProduct.description || '',
              image: dbProduct.image || '',
              badge: dbProduct.badge as any,
              discount: dbProduct.discount || undefined,
              inStock: dbProduct.in_stock,
              stock: dbProduct.stock ?? 0,
              rating: dbProduct.rating ?? 4.0,
              reviewCount: dbProduct.review_count ?? 0,
            } as Product;
          }
        });

        const existingIds = new Set(dbProducts.map((p) => p.id));
        const newStaticProducts = defaultProducts.filter(p => !existingIds.has(p.id))
          .map(p => ({ ...p, image: getImageUrl(p.image) }));
        mergedProducts = [...mergedProducts, ...newStaticProducts];
      } else {
        // Seed only if empty
        const seedData = defaultProducts.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          unit: p.unit,
          description: p.description,
          image: getImageUrl(p.image),
          badge: p.badge || null,
          discount: p.discount || null,
          in_stock: p.inStock,
          stock: p.stock || 50,
          rating: p.rating || 4.0,
          review_count: p.reviewCount || 0
        }));
        
        const { error: seedError } = await supabase.from('products').insert(seedData);
        if (seedError) console.error('Seed error:', seedError);
      }

      setProductList(mergedProducts.map(p => ({ 
        ...p, 
        image: getImageUrl(p.image),
        stock: p.stock ?? 0 
      })));
    } catch (error) {
      console.error("Error fetching products:", error);
      setProductList(defaultProducts.map(p => ({ 
        ...p, 
        image: getImageUrl(p.image),
          stock: p.stock ?? 0 
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

      const channel = supabase.channel('admin:product-updates')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
          const updatedRow = payload.new as DbProduct;
          const syncedStock = !updatedRow.in_stock ? 0 : updatedRow.stock ?? 0;
          setProductList(prev => prev.map(p => {
            if (p.id === updatedRow.id) {
              return { 
                ...p, 
                stock: syncedStock,
                inStock: updatedRow.in_stock
              };
            }
            return p;
          }));
        })
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  const filtered = productList.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyProduct, id: `prod-${Date.now()}` });
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({ ...product });
    setDialogOpen(true);
  };

  const validateForm = (): string | null => {
    if (!form.name?.trim()) return "Product name is required";
    if (!form.category) return "Category is required";
    if (form.price! <= 0) return "Price must be greater than 0";
    if (!isNaN(form.stock!)) {
      if (form.stock! < 0) return "Stock cannot be negative";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Enforce: if out of stock, set stock to 0
    if (!form.inStock) {
      form.stock = 0;
    }

    try {
      if (editing) {
        const updateData = {
          name: form.name,
          category: form.category,
          price: form.price!,
          unit: form.unit || 'kg',
          description: form.description || '',
          image: form.image || '',
          badge: form.badge || null,
          discount: form.discount || null,
          stock: form.stock || 0,
          in_stock: form.inStock ?? true,
          rating: form.rating || 4.0,
          review_count: form.reviewCount || 0,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('products').update(updateData).eq('id', editing.id);

        if (error) throw error;

        setProductList(prev =>
          prev.map(p => p.id === editing.id ? { ...p, ...form } as Product : p)
        );
        toast.success(`"${form.name}" updated successfully`);
      } else {
        const newProductId = form.id as string;
        const insertData = {
          id: newProductId,
          name: form.name!,
          category: form.category!,
          price: form.price!,
          unit: form.unit || 'kg',
          description: form.description || '',
          image: form.image || '',
          badge: form.badge || null,
          discount: form.discount || null,
          in_stock: form.inStock ?? true,
          stock: form.stock || 50,
          rating: form.rating || 4.0,
          review_count: form.reviewCount || 0
        };
        const { error } = await supabase.from('products').insert(insertData);

        if (error) throw error;

        const newProduct = { ...form, id: newProductId } as Product;
        setProductList(prev => [newProduct, ...prev]);
        toast.success(`"${form.name}" added successfully`);
      }
      setDialogOpen(false);
      setForm(emptyProduct);
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    const product = productList.find((p) => p.id === id);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      
      if (error) throw error;
      
      setProductList((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      toast.success(`"${product?.name}" deleted successfully`);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
    }
  };

  const updateField = (field: keyof Partial<Product>, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Package className="h-8 w-8 animate-spin mr-2" /> Loading products...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6 p-6"
    >
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        {filtered.length} of {productList.length} products
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center py-16 text-muted-foreground col-span-full"
          >
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </motion.div>
        ) : filtered.map((product) => {
            const isOutOfStock = !product.inStock || (product.stock || 0) <= 0;
            return <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`transition-all rounded-xl border p-6 flex items-start gap-4 group ${isOutOfStock 
                  ? 'border-2 border-destructive bg-destructive/10 shadow-lg ring-1 ring-destructive/30 hover:shadow-destructive/20' 
                  : 'bg-card hover:bg-accent hover:shadow-md border-border'
                }`}
              >
              <div className="relative flex-shrink-0">
                <img
                  src={product.image || PLACEHOLDER_IMAGE}
                  alt={product.name}
                  className="w-20 h-20 rounded-lg object-cover shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight truncate">{product.name}</h3>
                    {product.badge && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mt-1">
                        {product.badge}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    {categories.find((c) => c.id === product.category)?.name || product.category}
                  </p>
                  <p className="font-semibold text-lg">
                    PKR {product.price.toLocaleString()}/{product.unit}
                    {product.discount ? (
                      <span className="ml-2 text-sm line-through text-muted-foreground">
                        {((product.price * (1 + (product.discount || 0)/100)) | 0).toLocaleString()}
                      </span>
                    ) : null}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-3 py-1 rounded-full font-semibold text-sm flex items-center gap-1 ${product.inStock ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-destructive text-destructive-foreground border-2 border-destructive shadow-sm'}`}>
                      {product.inStock ? (
                        <>
                          <span className="text-xs">✓</span> In Stock
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          <span className="font-bold">Out of Stock</span>
                        </>
                      )}
                    </span>
                    <span className={`text-sm font-medium ${isOutOfStock ? 'text-destructive' : ''}`}>
                      {product.stock || 0} units
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                <Button variant="ghost" size="icon" className="h-9 w-9 p-0" onClick={() => openEdit(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 p-0 text-destructive hover:bg-destructive/5"
                  onClick={() => setDeleteConfirm(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
        })
        }
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update product details' : 'Fill in product information to add to catalog'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input 
                id="name"
                value={form.name || ""} 
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Fresh Red Apples"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={form.category || ""} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={form.unit || "kg"} onValueChange={(v) => updateField("unit", v)}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["kg", "g", "liter", "ml", "piece", "pack", "bottle", "dozen", "box", "bundle", "roll", "tube", "can"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (PKR) *</Label>
                <Input 
                  id="price"
                  type="number" 
                  min="0.01" 
                  step="0.01"
                  value={form.price || ""} 
                  onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input 
                  id="discount"
                  type="number" 
                  min="0" 
                  max="100"
                  value={form.discount || ""} 
                  onChange={(e) => updateField("discount", parseFloat(e.target.value) || undefined)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input 
                  id="stock"
                  type="number" 
                  min="0"
                  value={form.stock || ""} 
                  onChange={(e) => updateField("stock", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2 pt-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="inStock" className="text-sm">In Stock</Label>
                  <Switch 
                    id="inStock"
                    checked={form.inStock ?? true} 
                    onCheckedChange={(v) => updateField("inStock", v)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description"
                value={form.description || ""} 
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Optional short description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL (Optional)</Label>
              <Input 
                id="image"
                value={form.image || ""} 
                onChange={(e) => updateField("image", e.target.value)}
                placeholder="https://example.com/product.jpg"
              />
              {form.image && (
                <div className="mt-2">
                  <img 
                    src={form.image} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-lg object-cover border shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge">Badge Label</Label>
              <Select value={form.badge || "none"} onValueChange={(v) => updateField("badge", v === "none" ? undefined : v as any)}>
                <SelectTrigger id="badge">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bestseller">⭐ Bestseller</SelectItem>
                  <SelectItem value="new">🆕 New</SelectItem>
                  <SelectItem value="discount">💰 Discount</SelectItem>
                  <SelectItem value="out-of-stock">📦 Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setDialogOpen(false);
              setForm(emptyProduct);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{' '}
              {productList.find(p => p.id === deleteConfirm)?.name}"? 
              <br />This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProductManagement;

