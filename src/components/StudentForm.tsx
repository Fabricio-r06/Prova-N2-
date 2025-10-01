import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const studentSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  cpf: z
    .string()
    .regex(/^[0-9]{11}$/, "CPF deve conter 11 dígitos numéricos"),
  rg: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  curso: z.string().min(1, "Curso é obrigatório"),
  ano_ingresso: z.number().int().min(1900).max(2100).optional(),
  status: z.enum(["ativo", "inativo", "trancado", "formado"]),
  observacoes: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  onSuccess: () => void;
  userRole: string | null;
}

const StudentForm = ({
  open,
  onOpenChange,
  student,
  onSuccess,
  userRole,
}: StudentFormProps) => {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      nome: "",
      data_nascimento: "",
      cpf: "",
      rg: "",
      email: "",
      telefone: "",
      endereco: "",
      matricula: "",
      curso: "",
      ano_ingresso: new Date().getFullYear(),
      status: "ativo",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        nome: student.nome,
        data_nascimento: student.data_nascimento,
        cpf: student.cpf,
        rg: student.rg || "",
        email: student.email || "",
        telefone: student.telefone || "",
        endereco: student.endereco || "",
        matricula: student.matricula,
        curso: student.curso,
        ano_ingresso: student.ano_ingresso,
        status: student.status,
        observacoes: student.observacoes || "",
      });
    } else {
      form.reset();
    }
  }, [student, form]);

  const onSubmit = async (data: StudentFormData) => {
    try {
      if (student) {
        const updateData: any = {};
        Object.keys(data).forEach((key) => {
          const value = (data as any)[key];
          if (value !== undefined && value !== "") {
            updateData[key] = value;
          }
        });

        const { error } = await supabase
          .from("alunos")
          .update(updateData)
          .eq("id", student.id);

        if (error) throw error;
        toast.success("Aluno atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("alunos")
          .insert([{
            nome: data.nome,
            data_nascimento: data.data_nascimento,
            cpf: data.cpf,
            rg: data.rg || null,
            email: data.email || null,
            telefone: data.telefone || null,
            endereco: data.endereco || null,
            matricula: data.matricula,
            curso: data.curso,
            ano_ingresso: data.ano_ingresso || null,
            status: data.status,
            observacoes: data.observacoes || null,
          }]);

        if (error) throw error;
        toast.success("Aluno cadastrado com sucesso!");
      }

      onOpenChange(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar aluno");
    }
  };

  const canEditStatus = userRole === "admin" || userRole === "coordenador";
  const canEditSensitiveData = userRole === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do aluno. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        maxLength={11}
                        disabled={!canEditSensitiveData && student}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        disabled={!canEditSensitiveData && student}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="curso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curso *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ano_ingresso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano de Ingresso</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEditStatus}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="trancado">Trancado</SelectItem>
                        <SelectItem value="formado">Formado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="gradient">
                {student ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentForm;
