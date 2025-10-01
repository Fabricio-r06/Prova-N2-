import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface StudentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  userRole: string | null;
}

const StudentDetails = ({
  open,
  onOpenChange,
  student,
  userRole,
}: StudentDetailsProps) => {
  if (!student) return null;

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

  const DetailRow = ({ label, value }: { label: string; value: any }) => (
    <div className="grid grid-cols-3 gap-4 py-2">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm col-span-2">{value || "-"}</dd>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Aluno
            {getStatusBadge(student.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Informações Pessoais</h3>
            <Separator className="mb-4" />
            <dl className="space-y-1">
              <DetailRow label="Nome" value={student.nome} />
              <DetailRow label="CPF" value={maskCPF(student.cpf)} />
              <DetailRow label="RG" value={student.rg} />
              <DetailRow
                label="Data de Nascimento"
                value={
                  student.data_nascimento
                    ? new Date(student.data_nascimento).toLocaleDateString("pt-BR")
                    : "-"
                }
              />
              <DetailRow label="E-mail" value={student.email} />
              <DetailRow label="Telefone" value={student.telefone} />
              <DetailRow label="Endereço" value={student.endereco} />
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Informações Acadêmicas</h3>
            <Separator className="mb-4" />
            <dl className="space-y-1">
              <DetailRow label="Matrícula" value={student.matricula} />
              <DetailRow label="Curso" value={student.curso} />
              <DetailRow label="Ano de Ingresso" value={student.ano_ingresso} />
              <DetailRow
                label="Status"
                value={student.status.charAt(0).toUpperCase() + student.status.slice(1)}
              />
            </dl>
          </div>

          {student.observacoes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Observações</h3>
              <Separator className="mb-4" />
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {student.observacoes}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Informações do Sistema</h3>
            <Separator className="mb-4" />
            <dl className="space-y-1">
              <DetailRow
                label="Cadastrado em"
                value={new Date(student.created_at).toLocaleString("pt-BR")}
              />
              <DetailRow
                label="Última atualização"
                value={new Date(student.updated_at).toLocaleString("pt-BR")}
              />
            </dl>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetails;
