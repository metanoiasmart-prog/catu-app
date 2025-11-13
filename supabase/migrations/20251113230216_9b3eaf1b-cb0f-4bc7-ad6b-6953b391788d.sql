-- Update traslados estado check constraint to include "recibido" and "observado"
ALTER TABLE public.traslados 
DROP CONSTRAINT IF EXISTS traslados_estado_check;

ALTER TABLE public.traslados 
ADD CONSTRAINT traslados_estado_check CHECK (estado IN ('pendiente', 'recibido', 'en_transito', 'observado'));