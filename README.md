# 🧾 VAQUIPOSTRES - SISTEMA DE PEDIDOS

VAQUIPOSTRES es un sistema **POS web moderno** desarrollado con **Vue 3 + Vite** y **Supabase**, pensado para kioskos y pequeños negocios que necesitan registrar ventas, productos y usuarios de forma simple, rápida y visual.

Actualmente funciona **100% online**, con una interfaz optimizada para escritorio y dispositivos móviles.

---

## 🚀 Tecnologías utilizadas

- **Vue 3** (Composition API)
- **Vite**
- **Supabase**
  - Auth
  - Database (PostgreSQL)
  - Storage
- **SweetAlert2**
- **CSS puro (sin frameworks)**

---

## ✅ Funcionalidades actuales

### 🔐 Autenticación
- Login con Supabase Auth
- Roles:
  - Admin
  - Usuario Kiosko

### 📦 Productos
- Crear, editar y eliminar productos
- Subida de imagen por producto
- Control de stock
- Filtro por nombre
- Vista responsive en grid

### 🛒 POS (Punto de Venta)
- Listado de productos con buscador
- Agregar productos al carrito
- Control de cantidades
- Validación de stock
- Cálculo automático del total
- Registro de ventas
- Actualización automática de stock

### 📊 Ventas
- Registro de ventas por usuario
- Historial de ventas
- Detalle por venta
- Totales calculados

### 👥 Administración de usuarios (Admin)
- Crear usuarios kiosko
- Activar / desactivar usuarios
- Editar datos
- Eliminar usuarios
- Filtro por nombre o email

---

## 🧭 Funcionalidades planificadas (Roadmap)

> Estas funcionalidades **NO están implementadas aún**  
> Solo están listadas como próximas mejoras.

### 🔌 Modo Offline
- Uso del sistema sin conexión a internet
- Guardado local de ventas y movimientos
- Sin pérdida de estilos ni funcionalidad

### 🔄 Sincronización con la nube
- Detección automática de conexión
- Notificación al usuario cuando vuelva el internet
- Opción para sincronizar datos con Supabase

### 📱 PWA (Progressive Web App)
- Instalación opcional en celular o tablet
- Uso como aplicación nativa
- Mejor rendimiento offline

---

## 🖥️ Instalación en entorno local

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
