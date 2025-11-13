-- Add missing columns to pagos_proveedores
ALTER TABLE public.pagos_proveedores 
ADD COLUMN IF NOT EXISTS concepto TEXT,
ADD COLUMN IF NOT EXISTS fecha_hora TIMESTAMPTZ DEFAULT now();

-- Add missing columns to traslados
ALTER TABLE public.traslados 
ADD COLUMN IF NOT EXISTS fecha_hora TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS empleado_envia_id UUID REFERENCES public.empleados(id);

-- Add missing columns to recepciones
ALTER TABLE public.recepciones 
ADD COLUMN IF NOT EXISTS monto_recibido DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS empleado_recibe_id UUID REFERENCES public.empleados(id);

-- Add missing columns to arqueos
ALTER TABLE public.arqueos 
ADD COLUMN IF NOT EXISTS monto_contado DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS monto_final DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS diferencia DECIMAL(10,2);