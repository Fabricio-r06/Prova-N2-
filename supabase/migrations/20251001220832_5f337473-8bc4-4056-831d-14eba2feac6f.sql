-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'coordenador', 'secretario');

-- Create enum for student status
CREATE TYPE public.student_status AS ENUM ('ativo', 'inativo', 'trancado', 'formado');

-- Create user_roles table (avoid recursive RLS)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL CHECK (LENGTH(nome) >= 3 AND LENGTH(nome) <= 200),
    data_nascimento DATE NOT NULL,
    cpf TEXT NOT NULL UNIQUE CHECK (cpf ~ '^[0-9]{11}$'),
    rg TEXT,
    email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    telefone TEXT,
    endereco TEXT,
    matricula TEXT NOT NULL UNIQUE,
    curso TEXT NOT NULL,
    ano_ingresso INTEGER CHECK (ano_ingresso >= 1900 AND ano_ingresso <= 2100),
    status student_status NOT NULL DEFAULT 'ativo',
    observacoes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_role app_role NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    diff JSONB,
    reason TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user role (returns highest privilege)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'coordenador' THEN 2
    WHEN 'secretario' THEN 3
  END
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for alunos
CREATE POLICY "All authenticated users can view active students"
ON public.alunos FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coordenador')
    OR public.has_role(auth.uid(), 'secretario')
  )
);

CREATE POLICY "Admins, Coordenadores and Secretarios can create students"
ON public.alunos FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'coordenador')
  OR public.has_role(auth.uid(), 'secretario')
);

CREATE POLICY "Admins and Coordenadores can update all students"
ON public.alunos FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coordenador')
  )
);

CREATE POLICY "Secretarios can update basic student info"
ON public.alunos FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND public.has_role(auth.uid(), 'secretario')
);

CREATE POLICY "Only Admins can delete students"
ON public.alunos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coordenadores can view audit logs summary"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'coordenador'));

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "All authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for alunos updated_at
CREATE TRIGGER update_alunos_updated_at
BEFORE UPDATE ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation (create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Function to create audit log on student changes
CREATE OR REPLACE FUNCTION public.log_aluno_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
  v_diff JSONB;
  v_user_role app_role;
BEGIN
  v_user_role := public.get_user_role(auth.uid());
  
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_new_data := to_jsonb(NEW);
    v_diff := jsonb_build_object('added', v_new_data);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_diff := jsonb_build_object('before', v_old_data, 'after', v_new_data);
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'DELETE';
    v_old_data := to_jsonb(OLD);
    v_diff := jsonb_build_object('removed', v_old_data);
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    user_role,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    diff
  ) VALUES (
    auth.uid(),
    v_user_role,
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_data,
    v_new_data,
    v_diff
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for audit logging on alunos
CREATE TRIGGER log_aluno_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.log_aluno_changes();

-- Create indexes for performance
CREATE INDEX idx_alunos_matricula ON public.alunos(matricula);
CREATE INDEX idx_alunos_cpf ON public.alunos(cpf);
CREATE INDEX idx_alunos_status ON public.alunos(status);
CREATE INDEX idx_alunos_curso ON public.alunos(curso);
CREATE INDEX idx_alunos_deleted_at ON public.alunos(deleted_at);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);