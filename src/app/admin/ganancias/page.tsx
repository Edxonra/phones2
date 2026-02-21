"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/src/hooks/useIsAdmin";
import { useCrud } from "@/src/hooks/useCrud";
import AdminTable, { TableColumn } from "@/src/components/AdminTable";
import Alert from "@/src/components/Alert";

interface IModel {
  _id: string;
  name: string;
  brand: string;
  category: string;
}

interface IProduct {
  _id: string;
  model: IModel;
  price: number;
}

interface ISale {
  _id?: string;
  product: IProduct;
  client: string;
  salePrice: number;
  saleDate: string;
  status: string;
  purchase?: {
    _id?: string;
    cost?: number;
  } | string;
}

interface IPayment {
  _id?: string;
  sale: ISale | string;
  amount: number;
  paymentDate: string;
}

interface IPurchase {
  _id?: string;
  product: IProduct;
  cost: number;
  purchaseDate: string;
}

interface IExpense {
  _id?: string;
  sale: ISale;
  description: string;
  amount: number;
  expenseDate: string;
}

interface IRow {
  id: string;
  date: string;
  client: string;
  productLabel: string;
  salePrice: number;
  paid: number;
  purchaseCost: number;
  expenseTotal: number;
}

export default function ProfitRegisterPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useIsAdmin();
  const [filterMode, setFilterMode] = useState<"all" | "range">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const parseLocalDate = (value: string) => {
    if (!value) return null;
    const [datePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const formatLocalDate = (value: string) => {
    const date = parseLocalDate(value);
    return date ? date.toLocaleDateString('es-CR') : '';
  };

  const {
    items: sales,
    loading: salesLoading,
    error: salesError,
    fetch: fetchSales,
  } = useCrud<ISale>("/api/sales");

  const {
    items: payments,
    loading: paymentsLoading,
    error: paymentsError,
    fetch: fetchPayments,
  } = useCrud<IPayment>("/api/payments");

  const {
    items: purchases,
    loading: purchasesLoading,
    error: purchasesError,
    fetch: fetchPurchases,
  } = useCrud<IPurchase>("/api/purchases");

  const {
    items: expenses,
    loading: expensesLoading,
    error: expensesError,
    fetch: fetchExpenses,
  } = useCrud<IExpense>("/api/expenses");

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchSales();
    fetchPayments();
    fetchPurchases();
    fetchExpenses();
  }, [isAdmin, isLoading, router, fetchSales, fetchPayments, fetchPurchases, fetchExpenses]);

  const paymentsBySale = useMemo(() => {
    return payments.reduce((acc: Record<string, number>, p) => {
      const saleId = typeof p.sale === "string" ? p.sale : p.sale?._id;
      if (!saleId) return acc;
      acc[saleId] = (acc[saleId] || 0) + (p.amount || 0);
      return acc;
    }, {});
  }, [payments]);

  const expensesBySale = useMemo(() => {
    return expenses.reduce((acc: Record<string, number>, expense) => {
      const saleId = expense.sale?._id;
      if (!saleId) return acc;
      acc[saleId] = (acc[saleId] || 0) + (expense.amount || 0);
      return acc;
    }, {});
  }, [expenses]);

  const saleByPurchaseId = useMemo(() => {
    const map: Record<string, ISale> = {}
    sales.forEach((sale) => {
      const purchaseId = typeof sale.purchase === 'string'
        ? sale.purchase
        : sale.purchase?._id
      if (purchaseId) {
        map[purchaseId] = sale
      }
    })
    return map
  }, [sales])

  const salesByProduct = useMemo(() => {
    const map: Record<string, ISale[]> = {}
    sales.forEach((sale) => {
      const productId = sale.product?._id
      if (!productId) return
      if (!map[productId]) map[productId] = []
      map[productId].push(sale)
    })

    Object.values(map).forEach((items) => {
      items.sort(
        (a, b) => (parseLocalDate(a.saleDate)?.getTime() ?? 0) - (parseLocalDate(b.saleDate)?.getTime() ?? 0)
      )
    })

    return map
  }, [sales])


  const rows: IRow[] = useMemo(() => {
    const usedSaleIds = new Set<string>()

    const rowsFromPurchases = purchases.map((purchase, index) => {
      const purchaseId = purchase._id || ''
      const product = purchase.product
      const productId = product?._id || ''
      let sale = purchaseId ? saleByPurchaseId[purchaseId] : undefined

      if (!sale) {
        const productId = purchase.product?._id
        const candidates = productId ? salesByProduct[productId] : undefined
        if (candidates && candidates.length > 0) {
          const purchaseDateValue = parseLocalDate(purchase.purchaseDate)?.getTime() ?? 0
          const nextSale = candidates.find((candidate) => {
            if (candidate._id && usedSaleIds.has(candidate._id)) return false
            const candidatePurchaseId = typeof candidate.purchase === 'string'
              ? candidate.purchase
              : candidate.purchase?._id
            if (candidatePurchaseId) return false
            const saleDateValue = parseLocalDate(candidate.saleDate)?.getTime() ?? 0
            return saleDateValue >= purchaseDateValue
          })
          sale = nextSale || candidates.find((candidate) => {
            if (!candidate._id || usedSaleIds.has(candidate._id)) return false
            const candidatePurchaseId = typeof candidate.purchase === 'string'
              ? candidate.purchase
              : candidate.purchase?._id
            return !candidatePurchaseId
          })
        }
      }

      if (sale?._id) {
        usedSaleIds.add(sale._id)
      }

      const saleId = sale?._id || ''
      const paid = saleId ? (paymentsBySale[saleId] || 0) : 0
      const expenseTotal = saleId ? (expensesBySale[saleId] || 0) : 0
      const purchaseCost = purchase.cost || 0
      const productPrice = product?.price || 0
      const salePrice = sale ? (sale.salePrice || 0) : productPrice

      return {
        id: purchaseId ? `purchase-${purchaseId}` : `purchase-missing-${productId || index}`,
        date: sale ? sale.saleDate : '',
        client: sale ? sale.client : '',
        productLabel: product ? `${product.model.brand} ${product.model.name}` : 'Producto desconocido',
        salePrice,
        paid,
        purchaseCost,
        expenseTotal,
      }
    })

    return rowsFromPurchases.sort(
      (a, b) => (parseLocalDate(b.date)?.getTime() ?? 0) - (parseLocalDate(a.date)?.getTime() ?? 0)
    )
  }, [purchases, paymentsBySale, expensesBySale, saleByPurchaseId, salesByProduct]);

  const filteredRows = useMemo(() => {
    if (filterMode === "all") return rows;

    let from: Date | null = null;
    let to: Date | null = null;

    if (filterMode === "range") {
      if (startDate) from = parseLocalDate(startDate);
      if (endDate) {
        to = parseLocalDate(endDate);
        if (to) to.setHours(23, 59, 59, 999);
      }
    }

    return rows.filter((r) => {
      const d = parseLocalDate(r.date);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [rows, filterMode, startDate, endDate]);

  const filteredSales = useMemo(() => {
    if (filterMode === "all") return sales;

    let from: Date | null = null;
    let to: Date | null = null;

    if (startDate) from = parseLocalDate(startDate);
    if (endDate) {
      to = parseLocalDate(endDate);
      if (to) to.setHours(23, 59, 59, 999);
    }

    return sales.filter((sale) => {
      const d = parseLocalDate(sale.saleDate);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [sales, filterMode, startDate, endDate]);

  const totals = useMemo(() => {
    const ingresos = filteredRows
      .reduce((sum, r) => sum + (r.paid || 0), 0);
    const gastos = filteredRows
      .reduce((sum, r) => sum + (r.purchaseCost + r.expenseTotal), 0);
    const esperadas = filteredRows
      .reduce((sum, r) => sum + (r.salePrice || 0), 0);
    const ventasRealizadas = filteredSales
      .reduce((sum, sale) => sum + (sale.salePrice || 0), 0);
    return {
      ventas: ventasRealizadas,
      ingresos,
      gastos,
      ganancia: ingresos - gastos,
      gananciaEsperada: esperadas - gastos,
      esperadas,
    };
  }, [filteredRows, filteredSales]);

  const formatPrice = (price: number) => {
    const sign = price < 0 ? '-' : '';
    const value = Math.round(Math.abs(price) * 100) / 100;
    if (value >= 1000) {
      const thousand = value / 1000;
      const formatted = thousand % 1 === 0 ? thousand.toString() : thousand.toFixed(1);
      return `₡${sign}${formatted} mil`;
    }
    return `₡${sign}${value.toLocaleString('es-CR', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const columns: TableColumn<IRow>[] = [
    {
      key: "date",
      label: "Fecha",
      render: (value) => formatLocalDate(String(value ?? '')),
    },
    {
      key: "client",
      label: "Cliente",
      render: (_value, row) => row.client,
    },
    {
      key: "product",
      label: "Producto",
      render: (_value, row) => row.productLabel,
    },
    {
      key: "purchaseExpense",
      label: "Compra/Gasto",
      render: (_value, row) => {
        const parts = [`Compra: ${formatPrice(row.purchaseCost)}`]
        if (row.expenseTotal > 0) {
          parts.push(`Gastos: ${formatPrice(row.expenseTotal)}`)
        }
        return parts.join(' | ')
      },
    },
    {
      key: "sale",
      label: "Venta",
      render: (_value, row) => formatPrice(row.salePrice),
    },
    {
      key: "profit",
      label: "Ganancia",
      render: (_value, row) => formatPrice(row.paid - (row.purchaseCost + row.expenseTotal)),
    },
    {
      key: "expectedProfit",
      label: "Ganancia esperada",
      render: (_value, row) => formatPrice(row.salePrice - (row.purchaseCost + row.expenseTotal)),
    },
  ];

  const loading = salesLoading || paymentsLoading || purchasesLoading || expensesLoading;
  const error = salesError || paymentsError || purchasesError || expensesError;

  if (loading && rows.length === 0) {
    return (
      <div className="admin-container">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Registro de Ganancias</h1>

        {error && <Alert type="error" message={error} />}

        <div className="form-row">
          <div className="form-group">
            <label>Filtro de fechas</label>
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as "all" | "range")}>
              <option value="all">Toda la historia</option>
              <option value="range">Rango personalizado</option>
            </select>
          </div>
        </div>

        {filterMode === "range" && (
          <div className="form-row">
            <div className="form-group">
              <label>Desde</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Hasta</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Ingresos (pagos recibidos)</label>
            <div><strong>{formatPrice(totals.ingresos)}</strong></div>
          </div>
          <div className="form-group">
            <label>Total ventas</label>
            <div><strong>{formatPrice(totals.ventas)}</strong></div>
          </div>
          <div className="form-group">
            <label>Gastos (compras)</label>
            <div><strong>{formatPrice(totals.gastos)}</strong></div>
          </div>
          <div className="form-group">
            <label>Ganancia</label>
            <div><strong>{formatPrice(totals.ganancia)}</strong></div>
          </div>
          <div className="form-group">
            <label>Ganancia esperada (ventas - gastos)</label>
            <div><strong>{formatPrice(totals.gananciaEsperada)}</strong></div>
          </div>
        </div>

        <h2>Detalle</h2>
        <AdminTable<IRow>
          columns={columns}
          data={filteredRows}
          loading={loading}
          primaryKey="id"
          actions={false}
          emptyMessage="No hay registros"
        />
      </div>
    </div>
  );
}
