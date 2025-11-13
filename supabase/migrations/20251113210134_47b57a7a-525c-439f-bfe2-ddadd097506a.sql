-- Agregar la columna arqueo_id a la tabla traslados para vincular directamente
ALTER TABLE traslados ADD COLUMN IF NOT EXISTS arqueo_id uuid REFERENCES arqueos(id);