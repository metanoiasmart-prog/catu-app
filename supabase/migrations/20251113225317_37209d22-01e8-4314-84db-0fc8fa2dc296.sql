-- Create empleados table
CREATE TABLE IF NOT EXISTS public.empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo TEXT NOT NULL,
  cargo TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create cajas table
CREATE TABLE IF NOT EXISTS public.cajas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('comercial', 'administrativa')),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create turnos table
CREATE TABLE IF NOT EXISTS public.turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID REFERENCES public.cajas(id) NOT NULL,
  empleado_id UUID REFERENCES public.empleados(id) NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  estado TEXT NOT NULL CHECK (estado IN ('activo', 'cerrado')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create aperturas table
CREATE TABLE IF NOT EXISTS public.aperturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID REFERENCES public.turnos(id) NOT NULL,
  monto_inicial DECIMAL(10,2) NOT NULL,
  cerrada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create arqueos table
CREATE TABLE IF NOT EXISTS public.arqueos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID REFERENCES public.turnos(id) NOT NULL,
  efectivo_contado DECIMAL(10,2) NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create traslados table
CREATE TABLE IF NOT EXISTS public.traslados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arqueo_id UUID REFERENCES public.arqueos(id) NOT NULL,
  caja_origen_id UUID REFERENCES public.cajas(id) NOT NULL,
  caja_destino_id UUID REFERENCES public.cajas(id) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  tipo_traslado TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'recibido')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create recepciones table
CREATE TABLE IF NOT EXISTS public.recepciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traslado_id UUID REFERENCES public.traslados(id) NOT NULL,
  empleado_id UUID REFERENCES public.empleados(id) NOT NULL,
  fecha_recepcion TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create pagos_proveedores table
CREATE TABLE IF NOT EXISTS public.pagos_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID REFERENCES public.turnos(id) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create parametros table
CREATE TABLE IF NOT EXISTS public.parametros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aperturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arqueos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traslados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recepciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON public.empleados FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.empleados FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.empleados FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.cajas FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.cajas FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.cajas FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.turnos FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.turnos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.turnos FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.aperturas FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.aperturas FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.aperturas FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.arqueos FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.arqueos FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.traslados FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.traslados FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.traslados FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.recepciones FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.recepciones FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.pagos_proveedores FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.pagos_proveedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.pagos_proveedores FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.parametros FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.parametros FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.parametros FOR UPDATE USING (true);