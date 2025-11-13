-- Add missing columns to turnos table
ALTER TABLE public.turnos
ADD COLUMN fecha DATE,
ADD COLUMN hora_inicio TIME,
ADD COLUMN hora_fin TIME,
ADD COLUMN estado TEXT DEFAULT 'abierto';

-- Add missing columns to arqueos table
ALTER TABLE public.arqueos
ADD COLUMN total_pagos_proveedores NUMERIC(10,2) DEFAULT 0,
ADD COLUMN comentario TEXT;

-- Add missing columns to cajas table
ALTER TABLE public.cajas
ADD COLUMN activa BOOLEAN DEFAULT true;

-- Add missing columns to empleados table
ALTER TABLE public.empleados
ADD COLUMN activo BOOLEAN DEFAULT true;

-- Create aperturas table
CREATE TABLE public.aperturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID REFERENCES public.turnos(id),
  monto_inicial NUMERIC(10,2) NOT NULL,
  cerrada BOOLEAN DEFAULT false,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pagos_proveedores table
CREATE TABLE public.pagos_proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID REFERENCES public.turnos(id),
  concepto TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parametros table
CREATE TABLE public.parametros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.aperturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Enable all access for aperturas" ON public.aperturas FOR ALL USING (true);
CREATE POLICY "Enable all access for pagos_proveedores" ON public.pagos_proveedores FOR ALL USING (true);
CREATE POLICY "Enable all access for parametros" ON public.parametros FOR ALL USING (true);

-- Create triggers for new tables
CREATE TRIGGER update_aperturas_updated_at BEFORE UPDATE ON public.aperturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pagos_proveedores_updated_at BEFORE UPDATE ON public.pagos_proveedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parametros_updated_at BEFORE UPDATE ON public.parametros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();