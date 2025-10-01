import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import StudentForm from "./StudentForm";
import StudentDetails from "./StudentDetails";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Student {
  id: string;
  nome: string;
  matricula: string;
  curso: string;
  status: string;
  cpf: string;
  email: string;
}

interface StudentListProps {
  onUpdate?: () => void;
}

const StudentList = ({ onUpdate }: StudentListProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchUserRole();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter]);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .order("role")
        .limit(1)
        .maybeSingle();
      
      setUserRole(data?.role || null);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("alunos")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar alunos");
      return;
    }

    setStudents(data || []);
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.curso.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;

    if (userRole === "admin") {
      const { error } = await supabase
        .from("alunos")
        .delete()
        .eq("id", studentToDelete.id);

      if (error) {
        toast.error("Erro ao excluir aluno");
        return;
      }
    } else {
      const { error } = await supabase
        .from("alunos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", studentToDelete.id);

      if (error) {
        toast.error("Erro ao inativar aluno");
        return;
      }
    }

    toast.success(
      userRole === "admin" ? "Aluno excluído com sucesso" : "Aluno inativado com sucesso"
    );
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
    fetchStudents();
    onUpdate?.();
  };

  const maskCPF = (cpf: string) => {
    if (userRole === "admin" || userRole === "coordenador") {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return `***.***.${cpf.slice(-3)}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ativo: "bg-gradient-success text-success-foreground",
      inativo: "bg-destructive text-destructive-foreground",
      trancado: "bg-warning text-warning-foreground",
      formado: "bg-gradient-primary text-primary-foreground",
    };

    return (
      <Badge className={variants[status] || "bg-secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Alunos</CardTitle>
              <CardDescription>
                Gerencie os registros de alunos do sistema
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedStudent(null);
                setIsFormOpen(true);
              }}
              variant="gradient"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Aluno
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, matrícula ou curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="trancado">Trancado</SelectItem>
                <SelectItem value="formado">Formado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum aluno encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono">{student.matricula}</TableCell>
                      <TableCell className="font-medium">{student.nome}</TableCell>
                      <TableCell>{student.curso}</TableCell>
                      <TableCell className="font-mono">{maskCPF(student.cpf)}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(userRole === "admin" || userRole === "coordenador" || userRole === "secretario") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedStudent(student);
                                setIsFormOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {userRole === "admin" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setStudentToDelete(student);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StudentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        student={selectedStudent}
        onSuccess={() => {
          fetchStudents();
          onUpdate?.();
        }}
        userRole={userRole}
      />

      <StudentDetails
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        student={selectedStudent}
        userRole={userRole}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {userRole === "admin"
                ? "Esta ação não pode ser desfeita. O aluno será permanentemente removido do sistema."
                : "O aluno será marcado como inativo no sistema."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {userRole === "admin" ? "Excluir" : "Inativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StudentList;
