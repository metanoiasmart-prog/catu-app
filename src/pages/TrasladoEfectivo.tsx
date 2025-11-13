import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, AlertCircle, Send, DollarSign, MapPin, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TrasladoEfectivo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [traslados, setTraslados] = useState<any[]>([]);
  const [cajaDestino, setCajaDestino] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Obtener traslados pendientes del día actual
      const hoy = new Date().toISOString().split('T')[0];
      
      const { data: trasladosData } = await supabase
        .from("traslados")
        .select(`
          id,
          monto,
          estado,
          fecha_hora,
          turno_id,
          caja_origen_id,
          caja_destino_id,
          empleado_envia_id,
          turnos!inner (
            id,
            empleado_id,
            fecha,
            empleados (
              id,
              nombre_completo,
              cargo
            ),
            cajas!inner (
              id,
              nombre,
              tipo
            )
          ),
          arqueos (
            id,
            monto_contado,
            monto_final,
            diferencia,
            created_at
          )
        `)
        .eq("estado", "pendiente")
        .gte("turnos.fecha", hoy)
        .order("fecha_hora", { ascending: false });

      if (trasladosData && trasladosData.length > 0) {
        const trasladosFormateados = trasladosData.map((traslado: any) => ({
          id: traslado.id,
          traslado_id: traslado.id,
          monto: traslado.monto,
          monto_final: traslado.arqueos?.monto_final || traslado.monto,
          diferencia: traslado.arqueos?.diferencia || 0,
          fecha_hora: traslado.arqueos?.created_at || traslado.fecha_hora,
          caja_origen: traslado.turnos.cajas,
          empleado: traslado.turnos.empleados,
          arqueo_id: traslado.arqueos?.id,
        }));
        
        setTraslados(trasladosFormateados);
      } else {
        setTraslados([]);
      }

      const { data: cajaPrincipal } = await supabase
        .from("cajas")
        .select("*")
        .eq("tipo", "principal")
        .maybeSingle();

      setCajaDestino(cajaPrincipal);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleEnviarARecepcion = async (traslado: any) => {
    setLoading(true);
    try {
      // Actualizar el estado del traslado a "en_transito"
      const { error: trasladoError } = await supabase
        .from("traslados")
        .update({
          estado: "en_transito",
          fecha_hora: new Date().toISOString(),
        })
        .eq("id", traslado.traslado_id);

      if (trasladoError) throw trasladoError;

      toast({
        title: "Traslado enviado",
        description: "El efectivo está en tránsito. Ve a Recepción de Efectivo para completar la recepción.",
      });

      // Recargar datos
      await loadData();
      
      // Navegar a recepción de efectivo si no hay más traslados
      if (traslados.length === 1) {
        navigate("/recepcion-traslado");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-foreground text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (traslados.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <header className="border-b border-border/50 bg-card/90 backdrop-blur-md shadow-soft sticky top-0 z-50">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-title tracking-tight">Traslado de Efectivo</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Enviar a Caja Principal</p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-12 max-w-2xl">
          <Card className="shadow-medium border border-border/50">
            <CardContent className="pt-8">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  No hay traslados pendientes. Debes realizar un arqueo de caja antes de crear un traslado.
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate("/arqueo-caja")} className="mt-6 w-full h-11 bg-primary hover:bg-primary-hover shadow-primary">
                Ir a Arqueo de Caja
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-md shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-title tracking-tight">Traslado de Efectivo</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Enviar a Caja Principal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-6">
          {traslados.map((traslado) => (
            <Card key={traslado.id} className="shadow-medium border border-border/50">
              <CardHeader className="border-b border-border/30 bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-title">Traslado de Efectivo</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      Este efectivo será trasladado a la Caja Principal
                    </CardDescription>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Send className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Caja Origen
                      </p>
                      <p className="text-sm font-medium text-foreground">{traslado.caja_origen.nombre}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Caja Destino
                      </p>
                      <p className="text-sm font-medium text-foreground">{cajaDestino?.nombre || "Caja Principal"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Empleado Envía
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {traslado.empleado ? `${traslado.empleado.nombre_completo}` : "No asignado"}
                      </p>
                      {traslado.empleado?.cargo && (
                        <p className="text-xs text-muted-foreground">{traslado.empleado.cargo}</p>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">Fecha y hora</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(traslado.fecha_hora).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Monto Final</p>
                      <p className="text-base font-semibold text-primary">${traslado.monto_final?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">Diferencia Arqueo</p>
                      <p className={`text-base font-semibold ${traslado.diferencia < 0 ? 'text-destructive' : traslado.diferencia > 0 ? 'text-warning' : 'text-success'}`}>
                        ${traslado.diferencia?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Monto a Trasladar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Efectivo contado en arqueo
                        </p>
                      </div>
                      <p className="text-3xl font-bold text-primary">
                        ${traslado.monto.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {traslado.diferencia !== 0 && (
                    <Alert variant={Math.abs(traslado.diferencia) > 2 ? "destructive" : "default"}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Diferencia en arqueo: ${traslado.diferencia.toFixed(2)}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={() => handleEnviarARecepcion(traslado)}
                    disabled={loading}
                    className="w-full h-11 bg-primary hover:bg-primary-hover shadow-primary"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar a Recepción de Efectivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TrasladoEfectivo;
