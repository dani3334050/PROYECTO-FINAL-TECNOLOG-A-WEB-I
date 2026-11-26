# SISTEMA RUTABOL-SCZ 🚍
**Materia:** Desarrollo Web I  
**Universidad:** Universidad Privada Domingo Savio (UPDS) — Sede Santa Cruz de la Sierra  
**Docente:** Paul Mauricio Melgar Zabala  
**Estudiantes:** Jhon Ronaldo y Daniel Frias Vargas  

---

## 📌 1. Visión General de la Plataforma Web Unificada

El **SISTEMA RUTABOL-SCZ** es una plataforma web integral, responsive y en tiempo real (WebSockets + SQLite ACID) que digitaliza completamente la experiencia del transporte público urbano en la ciudad de Santa Cruz de la Sierra. La solución implementa al 100% los requerimientos funcionales (RF-01 a RF-10) y no funcionales (RNF-01 a RNF-07) estipulados para el proyecto socioformativo:

* **RF-01 (Validación de Unidades):** Control estricto por Línea y Número Interno único. Solo unidades validadas operan y recaudan.
* **RF-02 (Registro de Estudiante Escolar):** Código RUDE obligatorio y captura de fotografía facial para validación visual al abordar.
* **RF-03 (Registro de Estudiante Universitario):** Validación con expresión regular de correo institucional `@upds.edu.bo`, código de estudiante (`codEst`) y foto facial.
* **RF-04 (Cálculo Automático de Tarifas):** General: Bs. 2.00 | Universitario: Bs. 1.00 (50% desc.) | Escolar: Bs. 0.80. Montos inalterables por el chofer.
* **RF-05 (Pasarela de Pago con Tarjeta):** Pago simulado seguro con tokenización y generación instantánea de boleto digital con código QR.
* **RF-06 (Gestión Estricta de Capacidad 18-25):** Contador de aforo en vivo. Bloqueo automático de pasajes al alcanzar el cupo máximo (**LLENO**).
* **RF-07 (Radar Geoespacial de 5 km):** Mapa interactivo que filtra con la fórmula matemática de Haversine los micros activos a menos de 5 km del usuario.
* **RF-08 (Trasbordo por Relevo ACID):** El micro saliente preserva su recaudación contable intacta; el micro entrante recibe a los pasajeros sin cobrarles pasaje de nuevo.
* **RF-09 (Contingencia por Emergencia/Avería):** Botón de emergencia que retira la unidad averiada del mapa público y otorga pases de trasbordo libre inmediato a los pasajeros a bordo.
* **RF-10 (Panel Conductor en Tiempo Real):** Vista en vivo para el chofer con proyección de la fotografía del estudiante/pasajero al pagar, control de aforo y descenso de pasajeros.

---

## 🔑 2. Cuentas de Acceso Rápido para Evaluación (1 Clic)

La aplicación cuenta con botones de acceso rápido pre-cargados en la pantalla de inicio de sesión (`/login`) y en el menú superior para evaluar todos los roles:

| Rol | Correo | Contraseña | Tarifa / Función | Módulo |
| :--- | :--- | :--- | :--- | :--- |
| **🎓 Univ. UPDS** | `daniel.frias@upds.edu.bo` | `upds123` | **Bs. 1.00** (50% Desc.) | `/passenger` (Radar 5km y Boletos QR) |
| **🎒 Estudiante Escolar** | `mateo.escolar@gmail.com` | `escolar123` | **Bs. 0.80** (RUDE Validado) | `/passenger` (Radar 5km y Boletos QR) |
| **👤 Pasajero General** | `pasajero@gmail.com` | `pasajero123` | **Bs. 2.00** (General) | `/passenger` (Radar 5km y Boletos QR) |
| **🚌 Chofer Línea 122** | `chofer122@rutabol.com` | `chofer123` | Control de Turno y Aforo | `/driver` (Panel Conductor en Vivo) |
| **🏢 Admin Línea 122** | `admin122@rutabol.com` | `linea122` | Gestión de Flota y Rondas | `/line-admin` (Dashboard Línea) |
| **👑 Superadministrador** | `superadmin@rutabol.com` | `admin123` | Red Global y Comisiones | `/superadmin` (Dashboard Red) |

---

## 🚀 3. Instrucciones de Ejecución

### Opción 1: Ejecución Local en Windows / Linux

```powershell
# 1. En la carpeta backend:
cd backend
node src/utils/seed.js    # Inicializa y puebla la base de datos SQLite
npm.cmd run dev           # Servidor API + WebSockets en http://localhost:4000

# 2. En la carpeta frontend (otra terminal):
cd frontend
npm.cmd run dev           # Cliente Web en http://localhost:5173
```

### Opción 2: Despliegue en Contenedores Docker (RNF-01)

```bash
docker compose up -d --build
```
Acceso web en `http://localhost:5173` o `http://localhost`.

### Comprobación Automatizada de Requerimientos:
```bash
node backend/test_all_rf.js
```

---

## 🛠️ 4. Arquitectura y Seguridad

* **Base de Datos:** SQLite nativo en modo WAL con `PRAGMA foreign_keys = ON;`.
* **Transacciones ACID:** Utilizadas en la emisión de pagos (`/pay-ticket`), trasbordos por relevo (`/relief`) y contingencias (`/emergency`).
* **Seguridad:** Contraseñas protegidas con `bcryptjs`, validación estricta de dominios institucionales (`@upds.edu.bo`), tokenización de tarjetas (solo últimos 4 dígitos visibles) y cookies seguras de sesión `rutabol.sid`.
* **Tiempo Real:** Socket.io para streaming de telemetría GPS y actualización instantánea de aforo (< 200 ms).
