"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/src/hooks/useIsAdmin";
import { useCrud } from "@/src/hooks/useCrud";
import AdminTable, { TableColumn } from "@/src/components/AdminTable";
import AdminForm, { FormField } from "@/src/components/AdminForm";
import Alert from "@/src/components/Alert";

interface ICustomer {
  _id?: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function CustomersAdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useIsAdmin();
  const {
    items: customers,
    loading,
    error,
    success,
    fetch: fetchCustomers,
    create,
    update,
    delete: deleteItem,
    clearMessages,
  } = useCrud<ICustomer>("/api/customers");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);

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
    fetchCustomers();
  }, [isAdmin, isLoading, router, fetchCustomers]);

  const handleSubmit = async (data: Record<string, any>) => {
    if (editingId) {
      await update(editingId, data);
    } else {
      await create(data);
    }
    resetForm();
    fetchCustomers();
  };

  const handleEdit = (customer: ICustomer) => {
    setEditingId(customer._id || null);
    setSelectedCustomer(customer);
    setIsFormVisible(true);
    scrollToForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;
    await deleteItem(id);
    fetchCustomers();
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedCustomer(null);
    setIsFormVisible(false);
  };

  const formFields: FormField[] = [
    {
      name: "name",
      label: "Nombre",
      type: "text",
      required: true,
      placeholder: "Nombre del cliente",
    },
  ];

  const columns: TableColumn<ICustomer>[] = [
    { key: "name", label: "Nombre" },
  ];

  if (loading && customers.length === 0) {
    return (
      <div className="admin-container">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Gestionar Clientes</h1>

        {error && <Alert type="error" message={error} onClose={clearMessages} />}
        {success && <Alert type="success" message={success} onClose={clearMessages} />}

        <button
          onClick={() => (isFormVisible ? resetForm() : setIsFormVisible(true))}
          className="admin-button-primary"
        >
          {isFormVisible ? "Cancelar" : "Registrar Nuevo Cliente"}
        </button>

        {isFormVisible && (
          <AdminForm
            fields={formFields}
            initialValues={selectedCustomer ? {
              name: selectedCustomer.name,
            } : {}}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingId}
          />
        )}

        <h2>Clientes Registrados ({customers.length})</h2>
        <AdminTable<ICustomer>
          columns={columns}
          data={customers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No hay clientes registrados"
        />
      </div>
    </div>
  );
}
