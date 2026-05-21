import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Pencil, Shield, User } from "lucide-react";
import type { SafeUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface UserFormData {
  username: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
  password: string;
  isActive: boolean;
}

const defaultForm: UserFormData = {
  username: "",
  name: "",
  role: "OPERATOR",
  password: "",
  isActive: true,
};

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [form, setForm] = useState<UserFormData>(defaultForm);

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const res = await apiRequest("POST", "/api/users", data);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário criado com sucesso!" });
      setDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserFormData> }) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, data);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário atualizado com sucesso!" });
      setDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (u: SafeUser) => {
    setEditingUser(u);
    setForm({
      username: u.username,
      name: u.name,
      role: u.role as "ADMIN" | "OPERATOR",
      password: "",
      isActive: u.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingUser) {
      const data: any = {
        name: form.name,
        role: form.role,
        isActive: form.isActive,
      };
      if (form.password) data.password = form.password;
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Usuários
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <Button
          data-testid="button-new-user"
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-slate-700">Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhum usuário cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  data-testid={`row-user-${u.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${u.role === "ADMIN" ? "bg-emerald-100" : "bg-slate-100"}`}>
                      {u.role === "ADMIN"
                        ? <Shield className="w-4 h-4 text-emerald-600" />
                        : <User className="w-4 h-4 text-slate-500" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm" data-testid={`text-username-${u.id}`}>{u.name}</p>
                      <p className="text-xs text-slate-400">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      data-testid={`badge-role-${u.id}`}
                      variant="outline"
                      className={u.role === "ADMIN" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-600"}
                    >
                      {u.role === "ADMIN" ? "Administrador" : "Operador"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={u.isActive ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-600 bg-red-50"}
                    >
                      {u.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`button-edit-user-${u.id}`}
                      onClick={() => openEdit(u)}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome completo</Label>
              <Input
                data-testid="input-user-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="space-y-1">
              <Label>Nome de usuário</Label>
              <Input
                data-testid="input-user-username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Ex: joaosilva"
                disabled={!!editingUser}
              />
              {editingUser && <p className="text-xs text-slate-400">O nome de usuário não pode ser alterado.</p>}
            </div>

            <div className="space-y-1">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "ADMIN" | "OPERATOR" })}>
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="OPERATOR">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{editingUser ? "Nova senha (deixe em branco para não alterar)" : "Senha"}</Label>
              <Input
                data-testid="input-user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingUser ? "••••••" : "Mínimo 6 caracteres"}
              />
            </div>

            {editingUser && editingUser.id !== currentUser?.id && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <Switch
                  data-testid="switch-user-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">Usuário ativo</p>
                  <p className="text-xs text-slate-400">Usuários inativos não conseguem fazer login</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              data-testid="button-save-user"
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
