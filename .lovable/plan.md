# Plan: carga más ligera del sitio

## Lo que encontré
- Hoy las ~30 páginas (incluidas /admin, /dashboard y checkout) se descargan todas juntas al abrir el home.
- Stripe solo lo usa la ventana de pago del checkout.
- Recharts: solo Historial de pedidos (/dashboard). Calendario (react-day-picker) y PDF (jsPDF): solo /cotizar.
- **Three.js no está instalado** en el proyecto: no hay nada que mover.
- Montserrat carga pesos 100/300/400/500/600/700. Hay 10 textos con peso ligero (home, cotizador, barra de pasos); con el cambio se verán en 400, un poco más gruesos.
- Mixpanel en index.html bloquea la carga.

## Cambios
1. **Páginas por separado**: en App.tsx, home, /menu y producto siguen cargando al inicio; todas las demás (admin, dashboard, checkout, cuenta, cotizar, propuesta, login, etc.) se cargan al entrar, con un indicador de carga discreto mientras.
2. **Stripe solo en checkout**: la ventana de pago se carga al abrir el paso de pago; `loadStripe` se llama ahí mismo (no antes).
3. **Librerías pesadas**: recharts queda dentro de la página de historial; el calendario y el PDF de /cotizar se cargan solo cuando se muestra el calendario o al pulsar "Descargar PDF" (import dinámico de `multiDeliveryPdf`/`pdfTemplate`).
4. **Mixpanel async**: el script pasa a `async` y el `init` se ejecuta en su `onload`; la guardia `if (window.mixpanel)` se mantiene.
5. **Montserrat**: URL de Google Fonts con `wght@400;500;600;700`.

## Detalles técnicos
- `React.lazy` + `<Suspense>` alrededor de `<Routes>`; los proveedores (Auth, Cart, Query) no cambian.
- `StripePaymentDialog` vía `lazy()` en CheckoutPage, montado solo cuando hay `session`.
- `generateMultiDeliveryPdf` y jsPDF en ProposalStep por `await import(...)` en el handler.
- Verificación: build y revisión en navegador de que el home no pide los archivos de admin, checkout, Stripe, recharts ni jsPDF.

## No se toca
Lógica de negocio, precios, base de datos, autenticación, flujo de pago.
