import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, AlertCircle, DollarSign, User, Calendar, Receipt } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmpleadoSelector } from "@/components/EmpleadoSelector";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RecepcionTraslado = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [trasladosPendientes, setTrasladosPendientes] = useState<any[]>([]);
  const [trasladoSeleccionado, setTrasladoSeleccionado] = useState<any>(null);
  const [empleadoReceptor, setEmpleadoReceptor] = useState<string>("");

  const [formData, setFormData] = useState({
    monto_recibido: "",
    comentario: "",
  });

  const [diferenciaMonto, setDiferenciaMonto] = useState<number>(0);
  const [pagosDialogOpen, setPagosDialogOpen] = useState(false);
  const [pagosProveedores, setPagosProveedores] = useState<any[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.monto_recibido && trasladoSeleccionado) {
      const recibido = parseFloat(formData.monto_recibido);
      const esperado = trasladoSeleccionado.monto;
      setDiferenciaMonto(recibido - esperado);
    } else {
      setDiferenciaMonto(0);
    }
  }, [formData.monto_recibido, trasladoSeleccionado]);

  const loadData = async () => {
    try {
      const { data: trasladosData, error: trasladosError } = await supabase
        .from("traslados")
        .select(`
          *,
          arqueos!inner (
            id,
            turno_id,
            created_at,
            total_pagos_proveedores
          ),
          recepciones (
            *,
            empleado_recibe_id
          )
        `)
        .eq("estado", "pendiente")
        .order("fecha_hora", { ascending: false });

      if (trasladosError) throw trasladosError;

      if (trasladosData && trasladosData.length > 0) {
        // Para cada traslado, obtener información del turno, empleado y caja
        const trasladosConInfo = await Promise.all(
          trasladosData.map(async (traslado: any) => {
            const arqueo = traslado.arqueos;
            
            // Obtener información del turno
            const { data: turnoData } = await supabase
              .from("turnos")
              .select(`
                *,
                empleados (
                  id,
                  nombre_completo,
                  cargo
                ),
                cajas (
                  id,
                  nombre,
                  ubicacion
                )
              `)
              .eq("id", arqueo.turno_id)
              .single();

            return {
              id: traslado.id,
              monto: traslado.monto,
              estado: traslado.estado,
              fecha_hora: traslado.fecha_hora,
              arqueo_id: traslado.arqueo_id,
              empleado: turnoData?.empleados,
              caja_origen: turnoData?.cajas,
              recepciones: traslado.recepciones?.[0],
              total_pagos_proveedores: arqueo?.total_pagos_proveedores || 0,
            };
          })
        );
        
        setTrasladosPendientes(trasladosConInfo);
      } else {
        setTrasladosPendientes([]);
      }
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

  const loadPagosProveedores = async (arqueoId: string) => {
    setLoadingPagos(true);
    try {
      // Primero obtenemos el turno_id del arqueo
      const { data: arqueoData, error: arqueoError } = await supabase
        .from("arqueos")
        .select("turno_id")
        .eq("id", arqueoId)
        .single();

      if (arqueoError) throw arqueoError;

      // Luego obtenemos los pagos a proveedores de ese turno
      const { data: pagosData, error: pagosError } = await supabase
        .from("pagos_proveedores")
        .select("*")
        .eq("turno_id", arqueoData.turno_id)
        .order("created_at", { ascending: false });

      if (pagosError) throw pagosError;

      setPagosProveedores(pagosData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPagos(false);
    }
  };

  const handleVerPagos = (arqueoId: string) => {
    loadPagosProveedores(arqueoId);
    setPagosDialogOpen(true);
  };


  const handleRecibir = async () => {
    if (!trasladoSeleccionado || !empleadoReceptor) {
      toast({
        title: "Error",
        description: "Debes seleccionar un empleado receptor",
        variant: "destructive",
      });
      return;
    }

    const montoRecibido = parseFloat(formData.monto_recibido);
    if (isNaN(montoRecibido) || montoRecibido <= 0) {
      toast({
        title: "Error",
        description: "Debes ingresar un monto válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const nuevoEstado = Math.abs(diferenciaMonto) < 0.01 ? "recibido" : "observado";

      // Crear la recepción
      const { error: recepcionError } = await supabase
        .from("recepciones")
        .insert({
          traslado_id: trasladoSeleccionado.id,
          empleado_id: empleadoReceptor,
          empleado_recibe_id: empleadoReceptor,
          monto_recibido: montoRecibido,
          diferencia: diferenciaMonto,
          fecha_recepcion: new Date().toISOString(),
          fecha_hora: new Date().toISOString(),
          comentario: formData.comentario,
        });

      if (recepcionError) throw recepcionError;

      // Actualizar el estado del traslado
      const { error: trasladoError } = await supabase
        .from("traslados")
        .update({
          estado: nuevoEstado,
        })
        .eq("id", trasladoSeleccionado.id);

      if (trasladoError) throw trasladoError;

      toast({
        title: nuevoEstado === "recibido" ? "Recepción completada" : "Recepción con observaciones",
        description: nuevoEstado === "recibido" 
          ? "El efectivo ha sido recibido correctamente" 
          : `Diferencia registrada: $${diferenciaMonto.toFixed(2)}`,
        variant: nuevoEstado === "recibido" ? "default" : "destructive",
      });

      setTrasladoSeleccionado(null);
      setEmpleadoReceptor("");
      setFormData({ monto_recibido: "", comentario: "" });
      await loadData();
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
          <p className="mt-4 text-foreground text-sm">Cargando traslados...</p>
        </div>
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
              <h1 className="text-2xl font-semibold text-title tracking-tight">Recepción de Traslado</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Caja Principal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {trasladosPendientes.length === 0 ? (
          <Card className="shadow-medium border border-border/50">
            <CardContent className="pt-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-foreground">
            No hay traslados en tránsito pendientes de recepción en este momento.
          </AlertDescription>
        </Alert>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-title mb-4">Traslados</h2>
              <div className="grid gap-4">
                {trasladosPendientes.map((traslado) => {
                  const empleado = traslado.empleado;
                  const cajaOrigen = traslado.caja_origen;
                  const esEditable = traslado.estado === "pendiente";
                  const recepcion = traslado.recepciones;

                  return (
                    <div key={traslado.id} className="space-y-4">
                      <Card
                        className={`transition-all border ${
                          trasladoSeleccionado?.id === traslado.id
                            ? "ring-2 ring-primary border-primary shadow-primary"
                            : "border-border/50 hover:shadow-medium hover:border-primary/30"
                        } ${esEditable ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (esEditable) {
                            setTrasladoSeleccionado(traslado);
                            setFormData({ monto_recibido: traslado.monto.toString(), comentario: "" });
                          }
                        }}
                      >
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-semibold text-title">
                              Traslado desde {cajaOrigen?.nombre || 'N/A'}
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground mt-1">
                              Arqueo realizado: {new Date(traslado.fecha_hora).toLocaleString()}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {traslado.estado === "pendiente" && (
                              <Badge variant="secondary" className="h-7 bg-warning/20 text-warning border-warning/30">
                                Pendiente
                              </Badge>
                            )}
                            {traslado.estado === "recibido" && (
                              <Badge variant="secondary" className="h-7 bg-success/20 text-success border-success/30">
                                Recibido
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30">
                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Empleado
                            </p>
                            <p className="text-sm font-medium text-foreground truncate">
                              {empleado?.nombre_completo || "N/A"}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30">
                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Fecha Recepción
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {recepcion?.fecha_recepcion 
                                ? new Date(recepcion.fecha_recepcion).toLocaleDateString()
                                : "Sin recibir"}
                            </p>
                          </div>
                          <div 
                            className="p-2.5 rounded-lg bg-accent/10 border border-accent/30 cursor-pointer hover:bg-accent/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerPagos(traslado.arqueo_id);
                            }}
                          >
                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                              <Receipt className="h-3 w-3" />
                              Pagos Proveedores
                            </p>
                            <p className="text-sm font-medium text-accent">
                              ${traslado.total_pagos_proveedores?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-success" />
                              <span className="text-sm font-medium text-foreground">Monto a recibir</span>
                            </div>
                            <span className="text-2xl font-bold text-success">
                              ${traslado.monto.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {!esEditable && recepcion && (
                          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
                            <p className="text-xs font-semibold text-foreground mb-2">Información de Recepción</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Monto Recibido</p>
                                <p className="text-sm font-medium text-foreground">${recepcion.monto_recibido?.toFixed(2) || "0.00"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Diferencia</p>
                                <p className={`text-sm font-medium ${
                                  recepcion.diferencia === 0 ? "text-success" : "text-destructive"
                                }`}>
                                  ${recepcion.diferencia?.toFixed(2) || "0.00"}
                                </p>
                              </div>
                            </div>
                            {recepcion.comentario && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">Comentario</p>
                                <p className="text-sm text-foreground">{recepcion.comentario}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>

                      {esEditable && trasladoSeleccionado?.id === traslado.id && !recepcion && (
                        <CardContent className="pt-0 border-t border-border/30">
                          <div className="pt-6 space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="empleadoReceptor" className="text-sm font-medium text-foreground flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                Empleado Receptor
                              </Label>
                              <EmpleadoSelector
                                value={empleadoReceptor}
                                onChange={setEmpleadoReceptor}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="montoRecibido" className="text-sm font-medium text-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                Monto Recibido (USD)
                              </Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                <Input
                                  id="montoRecibido"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={formData.monto_recibido}
                                  onChange={(e) => setFormData({ ...formData, monto_recibido: e.target.value })}
                                  placeholder="0.00"
                                  required
                                  className="pl-7 h-10 border-border/50 focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                            </div>

                            {diferenciaMonto !== 0 && (
                              <Alert variant={Math.abs(diferenciaMonto) > 0.01 ? "destructive" : "default"}>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Diferencia detectada: ${diferenciaMonto.toFixed(2)}</strong>
                                  <p className="mt-1 text-sm">
                                    {Math.abs(diferenciaMonto) > 0.01 ? "El traslado será marcado como \"Observado\". Debes agregar un comentario." : "Diferencia mínima aceptable."}
                                  </p>
                                </AlertDescription>
                              </Alert>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="comentario" className="text-sm font-medium text-foreground">
                                Comentario {Math.abs(diferenciaMonto) > 0.01 && <span className="text-destructive">*</span>}
                              </Label>
                              <Textarea
                                id="comentario"
                                value={formData.comentario}
                                onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                                placeholder="Observaciones sobre la recepción..."
                                rows={3}
                                className="resize-none border-border/50 focus:ring-2 focus:ring-primary/20"
                              />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border/30">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setTrasladoSeleccionado(null);
                                  setEmpleadoReceptor("");
                                  setFormData({ monto_recibido: "", comentario: "" });
                                }}
                                className="flex-1 h-11"
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleRecibir}
                                disabled={loading}
                                className="flex-1 h-11 bg-success hover:bg-success-hover shadow-soft"
                              >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Registrar Recepción
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dialog para ver pagos a proveedores */}
        <Dialog open={pagosDialogOpen} onOpenChange={setPagosDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Pagos a Proveedores</DialogTitle>
              <DialogDescription className="text-foreground">
                Detalle de los pagos realizados en este arqueo
              </DialogDescription>
            </DialogHeader>

            {loadingPagos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pagosProveedores.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  No se registraron pagos a proveedores en este arqueo.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagosProveedores.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell className="font-medium">
                            {pago.concepto || pago.descripcion || "Sin concepto"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(pago.fecha_hora || pago.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${pago.valor.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm font-medium text-foreground">Total Pagos:</span>
                  <span className="text-xl font-bold text-accent">
                    ${pagosProveedores.reduce((sum, pago) => sum + pago.valor, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default RecepcionTraslado;