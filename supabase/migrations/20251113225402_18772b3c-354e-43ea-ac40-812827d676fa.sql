-- Add missing columns to arqueos
ALTER TABLE public.arqueos 
ADD COLUMN IF NOT EXISTS total_pagos_proveedores DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS comentario TEXT;

-- Add missing columns to recepciones
ALTER TABLE public.recepciones 
ADD COLUMN IF NOT EXISTS diferencia DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS fecha_hora TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS comentario TEXT;

-- Update cajas tipo check constraint to include 'principal'
ALTER TABLE public.cajas 
DROP CONSTRAINT IF EXISTS cajas_tipo_check;

ALTER TABLE public.cajas 
ADD CONSTRAINT cajas_tipo_check CHECK (tipo IN ('comercial', 'administrativa', 'principal'));