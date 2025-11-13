-- Add UPDATE policy for recepciones table
CREATE POLICY "Enable update access for all users" 
ON public.recepciones 
FOR UPDATE 
USING (true)
WITH CHECK (true);