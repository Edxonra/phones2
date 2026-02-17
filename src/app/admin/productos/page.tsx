"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/src/hooks/useIsAdmin";
import { useCrud } from "@/src/hooks/useCrud";
import AdminTable, { TableColumn } from "@/src/components/AdminTable";
import AdminForm, { FormField } from "@/src/components/AdminForm";
import Alert from "@/src/components/Alert";
import { Brand, BRAND_OPTIONS, Category, CATEGORY_OPTIONS } from "@/src/shared/model.enum";
import { Battery, BATTERY_OPTIONS, Color, COLOR_OPTIONS, Storage, STORAGE_OPTIONS, Condition, CONDITION_OPTIONS } from "@/src/shared/product.enum";

interface IModel {
  _id: string;
  name: string;
  brand: Brand;
  category: Category;
}

interface IProduct {
  _id?: string;
  model: IModel | string;
  price: number;
  storage?: Storage;
  color: Color;
  stock: number;
  active: boolean;
  batteryHealth?: Battery;
  condition: Condition;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function ProductsAdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useIsAdmin();
  const { items: products, loading: productsLoading, error, success, fetch: fetchProducts, create, update, delete: deleteItem, clearMessages } = useCrud<IProduct>("/api/products");
  const { items: models, fetch: fetchModels } = useCrud<IModel>("/api/models");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const scrollToForm = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchProducts();
    fetchModels();
  }, [isAdmin, isLoading, router, fetchProducts, fetchModels]);

  const filteredModels = models.filter((model: IModel) => {
    const brandMatch = brandFilter ? model.brand === brandFilter : true;
    const categoryMatch = categoryFilter
      ? model.category === categoryFilter
      : true;

    return brandMatch && categoryMatch;
  });

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      const thousand = price / 1000;
      return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`;
    }
    return `₡${price}`;
  };

  const generateIphones85Jpg = () => {
    const title = 'iPhones seminuevos';
    const subtitle = 'Batería entre 80%-90% | 0 detalles';

    const filtered = products.filter((product) => {
      if (!product.active) return false;
      if (product.condition !== 'Seminuevo') return false;
      if (product.batteryHealth !== '85%') return false;
      if (!product.model || typeof product.model !== 'object') return false;
      const model = product.model as IModel;
      return model.brand === 'Apple' && model.name.toLowerCase().includes('iphone');
    });

    const grouped = new Map<string, { name: string; price: number }>();
    filtered.forEach((product) => {
      const model = product.model as IModel;
      const key = model._id;
      const existing = grouped.get(key);
      if (!existing || product.price < existing.price) {
        grouped.set(key, {
          name: `${model.brand} ${model.name}`,
          price: product.price,
        });
      }
    });

    const rows = Array.from(grouped.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    const width = 1200;
    const rowHeight = 54;
    const headerHeight = 70;
    const padding = 60;
    const tableTop = 210;
    const tableHeight = headerHeight + Math.max(rows.length, 1) * rowHeight;
    const height = tableTop + tableHeight + padding;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 46px "Segoe UI", Arial, sans-serif';
    ctx.fillText(title, padding, 90);

    ctx.fillStyle = '#334155';
    ctx.font = '400 26px "Segoe UI", Arial, sans-serif';
    ctx.fillText(subtitle, padding, 135);

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Modelo', padding, tableTop + 46);
    ctx.fillText('Precio', width - padding - 160, tableTop + 46);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, tableTop + headerHeight);
    ctx.lineTo(width - padding, tableTop + headerHeight);
    ctx.stroke();

    ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    const list = rows.length > 0 ? rows : [{ name: 'Sin productos activos', price: 0 }];
    list.forEach((row, index) => {
      const y = tableTop + headerHeight + rowHeight * index + 36;
      ctx.fillText(row.name, padding, y);
      ctx.textAlign = 'right';
      ctx.fillText(row.price ? formatPrice(row.price) : '-', width - padding, y);
      ctx.textAlign = 'left';

      const lineY = tableTop + headerHeight + rowHeight * (index + 1);
      ctx.beginPath();
      ctx.moveTo(padding, lineY);
      ctx.lineTo(width - padding, lineY);
      ctx.stroke();
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'iphones-seminuevos.jpg';
    link.click();
  };

  const generateIphonesPremiumJpg = () => {
    const title = 'iPhones premium';
    const subtitle = 'Batería entre 90%-100% | 0 detalles';

    const filtered = products.filter((product) => {
      if (!product.active) return false;
      if (product.condition !== 'Seminuevo') return false;
      const batteryValue = String(product.batteryHealth ?? '').replace('%', '').trim();
      const batteryNumber = Number(batteryValue);
      if (!Number.isFinite(batteryNumber)) return false;
      if (batteryNumber !== 95 && batteryNumber !== 100) return false;
      if (!product.model || typeof product.model !== 'object') return false;
      const model = product.model as IModel;
      const isIphone =
        model.category === 'Smartphone' || model.name.toLowerCase().includes('iphone');
      return model.brand === 'Apple' && isIphone;
    });

    const grouped = new Map<string, { name: string; price: number }>();
    filtered.forEach((product) => {
      const model = product.model as IModel;
      const key = model._id;
      const existing = grouped.get(key);
      if (!existing || product.price < existing.price) {
        grouped.set(key, {
          name: `${model.brand} ${model.name}`,
          price: product.price,
        });
      }
    });

    const rows = Array.from(grouped.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    const width = 1200;
    const rowHeight = 54;
    const headerHeight = 70;
    const padding = 60;
    const tableTop = 210;
    const tableHeight = headerHeight + Math.max(rows.length, 1) * rowHeight;
    const height = tableTop + tableHeight + padding;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 46px "Segoe UI", Arial, sans-serif';
    ctx.fillText(title, padding, 90);

    ctx.fillStyle = '#334155';
    ctx.font = '400 26px "Segoe UI", Arial, sans-serif';
    ctx.fillText(subtitle, padding, 135);

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Modelo', padding, tableTop + 46);
    ctx.fillText('Precio', width - padding - 160, tableTop + 46);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, tableTop + headerHeight);
    ctx.lineTo(width - padding, tableTop + headerHeight);
    ctx.stroke();

    ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    const list = rows.length > 0 ? rows : [{ name: 'Sin productos activos', price: 0 }];
    list.forEach((row, index) => {
      const y = tableTop + headerHeight + rowHeight * index + 36;
      ctx.fillText(row.name, padding, y);
      ctx.textAlign = 'right';
      ctx.fillText(row.price ? formatPrice(row.price) : '-', width - padding, y);
      ctx.textAlign = 'left';

      const lineY = tableTop + headerHeight + rowHeight * (index + 1);
      ctx.beginPath();
      ctx.moveTo(padding, lineY);
      ctx.lineTo(width - padding, lineY);
      ctx.stroke();
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'iphones-premium.jpg';
    link.click();
  };

  const generateIphonesNuevosJpg = () => {
    const title = 'iPhones nuevos';
    const subtitle = '';

    const filtered = products.filter((product) => {
      if (!product.active) return false;
      if (product.condition !== 'Nuevo') return false;
      if (!product.model || typeof product.model !== 'object') return false;
      const model = product.model as IModel;
      return model.brand === 'Apple' && model.name.toLowerCase().includes('iphone');
    });

    const grouped = new Map<string, { name: string; price: number }>();
    filtered.forEach((product) => {
      const model = product.model as IModel;
      const key = model._id;
      const existing = grouped.get(key);
      if (!existing || product.price < existing.price) {
        grouped.set(key, {
          name: `${model.brand} ${model.name}`,
          price: product.price,
        });
      }
    });

    const rows = Array.from(grouped.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    const width = 1200;
    const rowHeight = 54;
    const headerHeight = 70;
    const padding = 60;
    const tableTop = 210;
    const tableHeight = headerHeight + Math.max(rows.length, 1) * rowHeight;
    const height = tableTop + tableHeight + padding;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 46px "Segoe UI", Arial, sans-serif';
    ctx.fillText(title, padding, 90);

    if (subtitle) {
      ctx.fillStyle = '#334155';
      ctx.font = '400 26px "Segoe UI", Arial, sans-serif';
      ctx.fillText(subtitle, padding, 135);
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Modelo', padding, tableTop + 46);
    ctx.fillText('Precio', width - padding - 160, tableTop + 46);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, tableTop + headerHeight);
    ctx.lineTo(width - padding, tableTop + headerHeight);
    ctx.stroke();

    ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    const list = rows.length > 0 ? rows : [{ name: 'Sin productos activos', price: 0 }];
    list.forEach((row, index) => {
      const y = tableTop + headerHeight + rowHeight * index + 36;
      ctx.fillText(row.name, padding, y);
      ctx.textAlign = 'right';
      ctx.fillText(row.price ? formatPrice(row.price) : '-', width - padding, y);
      ctx.textAlign = 'left';

      const lineY = tableTop + headerHeight + rowHeight * (index + 1);
      ctx.beginPath();
      ctx.moveTo(padding, lineY);
      ctx.lineTo(width - padding, lineY);
      ctx.stroke();
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'iphones-nuevos.jpg';
    link.click();
  };

  const generateImmediateDeliveryJpg = () => {
    const title = 'Entrega inmediata';
    const subtitle = '0 detalles';

    const filtered = products.filter((product) => {
      if (!product.active) return false;
      if (product.stock <= 0) return false;
      if (!product.model || typeof product.model !== 'object') return false;
      return true;
    });

    const grouped = new Map<string, { name: string; price: number; battery: string }>();
    filtered.forEach((product) => {
      const model = product.model as IModel;
      const key = model._id;
      const existing = grouped.get(key);
      if (!existing || product.price < existing.price) {
        const batteryValue = product.batteryHealth ? product.batteryHealth : '-';
        grouped.set(key, {
          name: `${model.brand} ${model.name}`,
          price: product.price,
          battery: batteryValue,
        });
      }
    });

    const rows = Array.from(grouped.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    const width = 1200;
    const rowHeight = 54;
    const headerHeight = 70;
    const padding = 60;
    const tableTop = 210;
    const tableHeight = headerHeight + Math.max(rows.length, 1) * rowHeight;
    const height = tableTop + tableHeight + padding;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 46px "Segoe UI", Arial, sans-serif';
    ctx.fillText(title, padding, 90);

    if (subtitle) {
      ctx.fillStyle = '#334155';
      ctx.font = '400 26px "Segoe UI", Arial, sans-serif';
      ctx.fillText(subtitle, padding, 135);
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 24px "Segoe UI", Arial, sans-serif';
    const batteryX = width - padding - 320;
    ctx.fillText('Modelo', padding, tableTop + 46);
    ctx.fillText('Batería', batteryX, tableTop + 46);
    ctx.fillText('Precio', width - padding - 160, tableTop + 46);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, tableTop + headerHeight);
    ctx.lineTo(width - padding, tableTop + headerHeight);
    ctx.stroke();

    ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    const list = rows.length > 0 ? rows : [{ name: 'Sin productos activos', price: 0, battery: '-' }];
    list.forEach((row, index) => {
      const y = tableTop + headerHeight + rowHeight * index + 36;
      ctx.fillText(row.name, padding, y);
      ctx.textAlign = 'left';
      ctx.fillText(row.battery, batteryX, y);
      ctx.textAlign = 'right';
      ctx.fillText(row.price ? formatPrice(row.price) : '-', width - padding, y);
      ctx.textAlign = 'left';

      const lineY = tableTop + headerHeight + rowHeight * (index + 1);
      ctx.beginPath();
      ctx.moveTo(padding, lineY);
      ctx.lineTo(width - padding, lineY);
      ctx.stroke();
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'entrega-inmediata.jpg';
    link.click();
  };

  const generateSamsungSeminuevosJpg = () => {
    const title = 'Samsungs seminuevos';
    const subtitle = '0 detalles';

    const filtered = products.filter((product) => {
      if (!product.active) return false;
      if (product.condition !== 'Seminuevo') return false;
      if (!product.model || typeof product.model !== 'object') return false;
      const model = product.model as IModel;
      return model.brand === 'Samsung';
    });

    const grouped = new Map<string, { name: string; price: number; battery: string }>();
    filtered.forEach((product) => {
      const model = product.model as IModel;
      const key = model._id;
      const existing = grouped.get(key);
      if (!existing || product.price < existing.price) {
        grouped.set(key, {
          name: `${model.brand} ${model.name}`,
          price: product.price,
          battery: product.batteryHealth || '-',
        });
      }
    });

    const rows = Array.from(grouped.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    const width = 1200;
    const rowHeight = 54;
    const headerHeight = 70;
    const padding = 60;
    const tableTop = 210;
    const tableHeight = headerHeight + Math.max(rows.length, 1) * rowHeight;
    const height = tableTop + tableHeight + padding;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 46px "Segoe UI", Arial, sans-serif';
    ctx.fillText(title, padding, 90);

    ctx.fillStyle = '#334155';
    ctx.font = '400 26px "Segoe UI", Arial, sans-serif';
    ctx.fillText(subtitle, padding, 135);

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Modelo', padding, tableTop + 46);
    ctx.fillText('Precio', width - padding - 160, tableTop + 46);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, tableTop + headerHeight);
    ctx.lineTo(width - padding, tableTop + headerHeight);
    ctx.stroke();

    ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    const list = rows.length > 0 ? rows : [{ name: 'Sin productos activos', price: 0 }];
    list.forEach((row, index) => {
      const y = tableTop + headerHeight + rowHeight * index + 36;
      ctx.fillText(row.name, padding, y);
      ctx.textAlign = 'right';
      ctx.fillText(row.price ? formatPrice(row.price) : '-', width - padding, y);
      ctx.textAlign = 'left';

      const lineY = tableTop + headerHeight + rowHeight * (index + 1);
      ctx.beginPath();
      ctx.moveTo(padding, lineY);
      ctx.lineTo(width - padding, lineY);
      ctx.stroke();
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'samsungs-seminuevos.jpg';
    link.click();
  };

  const generateSamsungNuevosJpg = () => {
    const title = 'Samsungs nuevos';
    const subtitle = '';

    const filtered = products.filter((product) => {
      if (!product.active) return false;
      if (product.condition !== 'Nuevo') return false;
      if (!product.model || typeof product.model !== 'object') return false;
      const model = product.model as IModel;
      return model.brand === 'Samsung';
    });

    const grouped = new Map<string, { name: string; price: number }>();
    filtered.forEach((product) => {
      const model = product.model as IModel;
      const key = model._id;
      const existing = grouped.get(key);
      if (!existing || product.price < existing.price) {
        grouped.set(key, {
          name: `${model.brand} ${model.name}`,
          price: product.price,
        });
      }
    });

    const rows = Array.from(grouped.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    const width = 1200;
    const rowHeight = 54;
    const headerHeight = 70;
    const padding = 60;
    const tableTop = 210;
    const tableHeight = headerHeight + Math.max(rows.length, 1) * rowHeight;
    const height = tableTop + tableHeight + padding;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 46px "Segoe UI", Arial, sans-serif';
    ctx.fillText(title, padding, 90);

    if (subtitle) {
      ctx.fillStyle = '#334155';
      ctx.font = '400 26px "Segoe UI", Arial, sans-serif';
      ctx.fillText(subtitle, padding, 135);
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Modelo', padding, tableTop + 46);
    ctx.fillText('Precio', width - padding - 160, tableTop + 46);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, tableTop + headerHeight);
    ctx.lineTo(width - padding, tableTop + headerHeight);
    ctx.stroke();

    ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    const list = rows.length > 0 ? rows : [{ name: 'Sin productos activos', price: 0 }];
    list.forEach((row, index) => {
      const y = tableTop + headerHeight + rowHeight * index + 36;
      ctx.fillText(row.name, padding, y);
      ctx.textAlign = 'right';
      ctx.fillText(row.price ? formatPrice(row.price) : '-', width - padding, y);
      ctx.textAlign = 'left';

      const lineY = tableTop + headerHeight + rowHeight * (index + 1);
      ctx.beginPath();
      ctx.moveTo(padding, lineY);
      ctx.lineTo(width - padding, lineY);
      ctx.stroke();
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'samsungs-nuevos.jpg';
    link.click();
  };

  const generateAllJpgs = () => {
    generateIphones85Jpg();
    generateIphonesPremiumJpg();
    generateIphonesNuevosJpg();
    generateImmediateDeliveryJpg();
    generateSamsungSeminuevosJpg();
    generateSamsungNuevosJpg();
  };

  const handleSubmit = async (data: Record<string, any>) => {
    if (editingId) {
      await update(editingId, data);
    } else {
      await create(data);
    }
    resetForm();
    fetchProducts();
  };

  const handleEdit = (product: IProduct) => {
    setEditingId(product._id || null);
    setSelectedProduct(product);
    setIsFormVisible(true);
    scrollToForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return;
    await deleteItem(id);
    fetchProducts();
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedProduct(null);
    setIsFormVisible(false);
  };

  const sortedModels = [...filteredModels].sort((a, b) => {
    const brandCompare = (a.brand || '').localeCompare(b.brand || '', 'es', { sensitivity: 'base' });
    if (brandCompare !== 0) return brandCompare;
    return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
  });

  const modelOptions = sortedModels.map((m) => ({
    value: m._id,
    label: `${m.brand} ${m.name}`,
  }));

  const formFields: FormField[] = [
    {
      name: "model",
      label: "Modelo",
      type: "select",
      required: true,
      options: modelOptions,
    },
    {
      name: "price",
      label: "Precio",
      type: "number",
      required: true,
      min: 0,
      step: 0.01,
      value: 0,
    },
    {
      name: "storage",
      label: "Almacenamiento (opcional)",
      type: "select",
      required: false,
      options: STORAGE_OPTIONS.map((s) => ({ value: s, label: s })),
    },
    {
      name: "color",
      label: "Color",
      type: "select",
      required: true,
      options: COLOR_OPTIONS.map((c) => ({ value: c, label: c })),
    },
    {
      name: "stock",
      label: "Stock",
      type: "number",
      required: true,
      min: 0,
      value: 0,
    },
    {
      name: "batteryHealth",
      label: "Estado de Batería (opcional)",
      type: "select",
      required: false,
      options: BATTERY_OPTIONS.map((b) => ({ value: b, label: b })),
    },
    {
      name: "condition",
      label: "Condición",
      type: "select",
      required: true,
      options: CONDITION_OPTIONS.map((c) => ({ value: c, label: c })),
    },
    {
      name: "active",
      label: "Activo",
      type: "checkbox",
      required: false,
    },
    {
      name: "description",
      label: "Descripción",
      type: "text",
      required: false,
    },
  ];

  const columns: TableColumn<IProduct>[] = [
    {
      key: "model",
      label: "Modelo",
      render: (value) => {
        const model = value as IModel;
        return typeof model === "object" ? `${model.brand} ${model.name}` : value;
      },
    },
    {
      key: "price",
      label: "Precio",
      render: (value) => formatPrice(value),
    },
    {
      key: "storage",
      label: "Almacenamiento",
      render: (value) => value || '',
    },
    {
      key: "color",
      label: "Color",
    },
    {
      key: "stock",
      label: "Stock",
    },
    {
      key: "batteryHealth",
      label: "Batería",
    },
    {
      key: "condition",
      label: "Condición",
    },
    {
      key: "active",
      label: "Estado",
      render: (value) => (value ? "✓ Activo" : "✗ Inactivo"),
    },
  ];

  const sortedProducts = [...products].sort((a, b) => {
    const getModelLabel = (product: IProduct) => {
      const model = product.model
      if (typeof model === "object" && model) {
        return `${model.brand} ${model.name}`
      }
      return model || ""
    }

    return getModelLabel(a).localeCompare(getModelLabel(b), "es", { sensitivity: "base" })
  })

  if (productsLoading && products.length === 0) {
    return <div className="admin-container"><p>Cargando...</p></div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Gestionar Productos</h1>

        {error && <Alert type="error" message={error} onClose={clearMessages} />}
        {success && <Alert type="success" message={success} onClose={clearMessages} />}

        <button
          onClick={() => (isFormVisible ? resetForm() : setIsFormVisible(true))}
          className="admin-button-primary"
        >
          {isFormVisible ? "Cancelar" : "Agregar Nuevo Producto"}
        </button>
        <button
          onClick={generateAllJpgs}
          className="admin-button-primary"
          type="button"
        >
          Generar todas las imagenes JPG
        </button>

        {isFormVisible && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Filtrar por Marca</label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                >
                  <option value="">Todas</option>
                  {BRAND_OPTIONS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Filtrar por Categoría</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Todas</option>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <AdminForm
              fields={formFields}
              initialValues={selectedProduct ? {
                model: typeof selectedProduct.model === 'object' ? selectedProduct.model._id : selectedProduct.model,
                price: selectedProduct.price,
                storage: selectedProduct.storage ?? '',
                color: selectedProduct.color,
                stock: selectedProduct.stock,
                batteryHealth: selectedProduct.batteryHealth ?? '',
                condition: selectedProduct.condition,
                active: selectedProduct.active,
                description: selectedProduct.description || '',
              } : {}}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              isEditing={!!editingId}
            />
          </>
        )}

        <h2>Productos Registrados ({products.length})</h2>
        <AdminTable<IProduct>
          columns={columns}
          data={sortedProducts}
          loading={productsLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No hay productos registrados"
        />
      </div>
    </div>
  );
}