import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BaseLayout from "@/components/layout/BaseLayout";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShieldCheck, Landmark } from "lucide-react";
import { toast } from "sonner";

interface CustomerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  bank_transfer_enabled: boolean;
  bank_transfer_enabled_at: string | null;
  admin_role: string;
}

const AdminCustomersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");

  // Check admin role
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    supabase
      .from("profiles")
      .select("admin_role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.admin_role === "admin") {
          setIsAdmin(true);
        } else {
          toast.error("Acceso denegado");
          navigate("/dashboard");
        }
      });
  }, [user, navigate]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, company_name, bank_transfer_enabled, bank_transfer_enabled_at, admin_role")
      .order("full_name", { ascending: true })
      .limit(200);

    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setCustomers(data as CustomerRow[]);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    if (isAdmin) fetchCustomers();
  }, [isAdmin, fetchCustomers]);

  const toggleBankTransfer = async (customerId: string, currentValue: boolean) => {
    const newValue = !currentValue;
    const { error } = await supabase
      .from("profiles")
      .update({
        bank_transfer_enabled: newValue,
        bank_transfer_enabled_by: user?.id ?? null,
        bank_transfer_enabled_at: newValue ? new Date().toISOString() : null,
      })
      .eq("id", customerId);

    if (error) {
      toast.error("Error al actualizar");
      return;
    }

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, bank_transfer_enabled: newValue, bank_transfer_enabled_at: newValue ? new Date().toISOString() : null }
          : c
      )
    );
    toast.success(newValue ? "Transferencia bancaria activada" : "Transferencia bancaria desactivada");
  };

  if (!isAdmin) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-2xl text-foreground">Administrar Clientes</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o empresa..."
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Landmark className="w-4 h-4" />
                      Transferencia
                    </div>
                  </TableHead>
                  <TableHead>Activado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-body text-sm font-medium text-foreground">{c.full_name || "Sin nombre"}</p>
                          <p className="font-body text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">
                        {c.company_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.admin_role === "admin" ? "default" : "secondary"} className="text-[10px]">
                          {c.admin_role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={c.bank_transfer_enabled}
                          onCheckedChange={() => toggleBankTransfer(c.id, c.bank_transfer_enabled)}
                        />
                      </TableCell>
                      <TableCell className="font-body text-xs text-muted-foreground">
                        {c.bank_transfer_enabled && c.bank_transfer_enabled_at
                          ? new Date(c.bank_transfer_enabled_at).toLocaleDateString("es-MX")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default AdminCustomersPage;
