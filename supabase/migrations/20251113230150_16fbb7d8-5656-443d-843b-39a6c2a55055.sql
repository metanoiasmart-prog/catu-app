-- Update turnos estado check constraint to include "abierto"
ALTER TABLE public.turnos 
DROP CONSTRAINT IF EXISTS turnos_estado_check;

ALTER TABLE public.turnos 
ADD CONSTRAINT turnos_estado_check CHECK (estado IN ('activo', 'abierto', 'cerrado'));