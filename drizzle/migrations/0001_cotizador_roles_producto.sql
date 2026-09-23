CREATE TABLE public.cotizador_roles_producto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  rol text NOT NULL,
  woo_id bigint NOT NULL,
  prioridad smallint NOT NULL DEFAULT 1,
  personas_por_unidad smallint,
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cotizador_roles_lookup_idx ON public.cotizador_roles_producto (evento, rol, prioridad) WHERE activo;

GRANT SELECT ON public.cotizador_roles_producto TO authenticated;
GRANT ALL ON public.cotizador_roles_producto TO service_role;

ALTER TABLE public.cotizador_roles_producto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden ver roles del cotizador"
ON public.cotizador_roles_producto FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER cotizador_roles_updated_at
BEFORE UPDATE ON public.cotizador_roles_producto
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.cotizador_roles_producto IS 'Mapa editable rol/restriccion -> producto de WooCommerce (woo_id) usado por quote-orchestrator. Woo es la unica fuente de verdad: si el producto no esta publicado y activo, el resolver busca el mas cercano en precio y registra la exclusion.';