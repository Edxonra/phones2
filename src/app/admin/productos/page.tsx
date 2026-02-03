"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/src/hooks/useIsAdmin";

interface IModel {
  _id: string;
  name: string;
  brand: "Apple" | "Samsung" | "Google";
  category: "Smartphone" | "Watch" | "Laptop" | "Tablet" | "Audio";
}

interface IProduct {
  _id?: string;
  model: string;
  price: number;
  storage: "" | "128GB" | "256GB" | "512GB" | "1TB" | "2TB";
  color:
    | ""
    | "Negro Espacial"
    | "Naranja Cósmico"
    | "Gris Espacial"
    | "Grafito"
    | "Plateado"
    | "Azul"
    | "Negro";
  stock: number;
  active: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IProductPopulated extends Omit<IProduct, "model"> {
  model: IModel;
}

export default function ProductsAdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useIsAdmin();
  const [products, setProducts] = useState<IProductPopulated[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<IProduct>({
    model: "",
    price: 0,
    storage: "",
    color: "",
    stock: 0,
    active: false,
    description: "",
  });

  const [filters, setFilters] = useState({
    brand: "",
    category: "",
  });

  useEffect(() => {
    if (isLoading) return;

    if (!isAdmin) {
      router.push("/");
      return;
    }
    loadProducts();
    loadModels();
  }, [isAdmin, isLoading, router]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      const thousand = price / 1000;
      return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`;
    }
    return `₡${price}`;
  };

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      const response = await fetch("/api/models");
      const data = await response.json();
      setModels(data);
    } catch (err) {
      setError("Error al cargar modelos");
    }
  };

  const filteredModels = models.filter((model: IModel) => {
    const brandMatch = filters.brand ? model.brand === filters.brand : true
    const categoryMatch = filters.category
      ? model.category === filters.category
      : true

    return brandMatch && categoryMatch
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (
      !formData.model ||
      formData.price <= 0 ||
      !formData.storage ||
      !formData.color ||
      formData.stock < 0
    ) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/products/${editingId}` : "/api/products";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al guardar producto");
      }

      setSuccess(editingId ? "Producto actualizado" : "Producto creado");
      resetForm();
      loadProducts();
    } catch (err) {
      setError("Error al guardar el producto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?"))
      return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      setSuccess("Producto eliminado");
      loadProducts();
    } catch (err) {
      setError("Error al eliminar el producto");
    }
  };

  const handleEdit = (product: IProductPopulated) => {
    setFormData({
      model: product.model._id,
      price: product.price,
      storage: product.storage,
      color: product.color,
      stock: product.stock,
      active: product.active,
      description: product.description ?? "",
    });

    setEditingId(product._id || null);
    setIsFormVisible(true);
  };

  const resetForm = () => {
    setFormData({
      model: "",
      price: 0,
      storage: "",
      color: "",
      stock: 0,
      active: false,
      description: "",
    });
    setEditingId(null);
    setIsFormVisible(false);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Gestionar Productos</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button
          onClick={() => (isFormVisible ? resetForm() : setIsFormVisible(true))}
          className="admin-button-primary"
        >
          {isFormVisible ? "Cancelar" : "Agregar Nuevo Producto"}
        </button>

        {isFormVisible && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Filtrar por marca</label>
                <select
                  value={filters.brand}
                  onChange={(e) =>
                    setFilters({ ...filters, brand: e.target.value })
                  }
                >
                  <option value="">Todas</option>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Google">Google</option>
                </select>
              </div>
              <div className="form-group">
                <label>Filtrar por categoría</label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                >
                  <option value="">Todas</option>
                  <option value="Smartphone">Smartphone</option>
                  <option value="Watch">Watch</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Audio">Audio</option>
                </select>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Modelo *</label>
                  <select
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Selecciona un modelo
                    </option>
                    {filteredModels.map((model) => (
                      <option key={model._id} value={model._id}>
                        {model.brand} {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Almacenamiento *</label>
                  <select
                    value={formData.storage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storage: e.target.value as "128GB" | "256GB" | "512GB" | "1TB" | "2TB",
                      })
                    }
                  >
                    <option value="" disabled>Selecciona almacenamiento</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                    <option value="2TB">2TB</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color *</label>
                  <select
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        color: e.target.value as "Negro Espacial" | "Naranja Cósmico" | "Gris Espacial" | "Grafito" | "Plateado" | "Azul" | "Negro",
                      })
                    }
                  >
                    <option value="" disabled>Selecciona un color</option>
                    <option value="Negro Espacial">Negro Espacial</option>
                    <option value="Naranja Cósmico">Naranja Cósmico</option>
                    <option value="Gris Espacial">Gris Espacial</option>
                    <option value="Grafito">Grafito</option>
                    <option value="Plateado">Plateado</option>
                    <option value="Azul">Azul</option>
                    <option value="Negro">Negro</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <button type="submit" className="admin-button-success">
                {editingId ? "Actualizar Producto" : "Crear Producto"}
              </button>
            </form>
          </>
        )}

        <div className="products-table">
          <h2>Productos ({products.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Precio</th>
                <th>Almacenamiento</th>
                <th>Color</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product.model.brand}</td>
                  <td>{product.model.name}</td>
                  <td>{product.model.category}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{product.storage}</td>
                  <td>{product.color}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(product)}
                      className="admin-button-edit"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product._id || "")}
                      className="admin-button-delete"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="empty-message">No hay productos</p>
          )}
        </div>
      </div>
    </div>
  );
}