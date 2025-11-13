-- Create empleados table
CREATE TABLE public.empleados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  cargo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cajas table
CREATE TABLE public.cajas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  ubicacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create turnos table
CREATE TABLE public.turnos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID REFERENCES public.empleados(id),
  caja_id UUID REFERENCES public.cajas(id),
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create arqueos table
CREATE TABLE public.arqueos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID REFERENCES public.turnos(id),
  monto_contado NUMERIC(10,2),
  monto_final NUMERIC(10,2),
  diferencia NUMERIC(10,2),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create traslados table
CREATE TABLE public.traslados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID REFERENCES public.turnos(id),
  caja_origen_id UUID REFERENCES public.cajas(id),
  caja_destino_id UUID REFERENCES public.cajas(id),
  empleado_envia_id UUID REFERENCES public.empleados(id),
  monto NUMERIC(10,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'en_transito',
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recepciones table
CREATE TABLE public.recepciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  traslado_id UUID REFERENCES public.traslados(id),
  turno_receptor_id UUID REFERENCES public.turnos(id),
  empleado_recibe_id UUID REFERENCES public.empleados(id),
  monto_recibido NUMERIC(10,2),
  diferencia NUMERIC(10,2),
  fecha_hora TIMESTAMP WITH TIME ZONE,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arqueos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traslados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recepciones ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your authentication needs)
CREATE POLICY "Enable all access for empleados" ON public.empleados FOR ALL USING (true);
CREATE POLICY "Enable all access for cajas" ON public.cajas FOR ALL USING (true);
CREATE POLICY "Enable all access for turnos" ON public.turnos FOR ALL USING (true);
CREATE POLICY "Enable all access for arqueos" ON public.arqueos FOR ALL USING (true);
CREATE POLICY "Enable all access for traslados" ON public.traslados FOR ALL USING (true);
CREATE POLICY "Enable all access for recepciones" ON public.recepciones FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON public.empleados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cajas_updated_at BEFORE UPDATE ON public.cajas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_turnos_updated_at BEFORE UPDATE ON public.turnos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_arqueos_updated_at BEFORE UPDATE ON public.arqueos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_traslados_updated_at BEFORE UPDATE ON public.traslados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recepciones_updated_at BEFORE UPDATE ON public.recepciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();