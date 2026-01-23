<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import Swal from 'sweetalert2'


/* =========================
   FORMULARIO (NO TOCADO)
========================= */
const name = ref('');
const price = ref('');
const stock = ref('');
const file = ref(null);

const imageFile = ref(null);
const imagePreview = computed(() =>
  imageFile.value ? URL.createObjectURL(imageFile.value) : null
);

const onFileChange = (e) => {
  imageFile.value = e.target.files[0];
  file.value = imageFile.value;
};

const uploadImage = async () => {
  if (!imageFile.value) return null;

  const { data: { user } } = await supabase.auth.getUser();
  
  // Verificación de seguridad
  if (!user) {
    console.error('No hay usuario autenticado');
    return null;
  }

const safeName = imageFile.value.name
  .toLowerCase()
  .replace(/\s+/g, '-')        // espacios → -
  .replace(/[^\w.-]/g, '')    // elimina caracteres raros

const fileName = `${user.id}/product-${Date.now()}-${safeName}`;


  const { data, error } = await supabase.storage
    .from('products')
    .upload(fileName, imageFile.value, {
      upsert: true,
      contentType: imageFile.value.type,
    });

  if (error) {
    console.error('Error subiendo imagen:', error.message); // Usar error.message da más detalle
    return null;
  }

  const { data: publicData } = supabase.storage.from('products').getPublicUrl(fileName);
  return publicData.publicUrl;
};

/* =========================
   ESTADO GENERAL
========================= */
const products = ref([]);
const showModal = ref(false);
const user = ref(null);
const filterName = ref('');

/* =========================
   EDICIÓN
========================= */
const editingProduct = ref(null);

/* =========================
   CARGAR PRODUCTOS
========================= */
const loadProducts = async () => {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  user.value = authUser;

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false });

  products.value = data || [];
};

/* =========================
   GUARDAR / ACTUALIZAR
========================= */
const saveProduct = async () => {
  try {
    let image_url = editingProduct.value ? editingProduct.value.image_url : null;
    
    if (imageFile.value) {
      const uploaded = await uploadImage();
      if (uploaded) image_url = uploaded;
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();

    // OBJETO DE DATOS: Nota que NO incluimos el campo 'id' aquí
    const productData = {
      name: name.value,
      price: parseFloat(price.value) || 0,
      stock: parseInt(stock.value) || 0,
      image_url: image_url,
      user_id: authUser.id,
    };

    if (editingProduct.value) {
      // ACTUALIZAR
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.value.id);
      if (error) throw error;
    } else {
      // INSERTAR NUEVO (El ID se generará solo en la BD ahora)
      const { error } = await supabase
        .from('products')
        .insert([productData]);
      if (error) throw error;
    }

    // LIMPIEZA
    name.value = ''; price.value = ''; stock.value = '';
    imageFile.value = null; editingProduct.value = null;
    showModal.value = false;

    await loadProducts();
    Swal.fire({
      icon: 'success',
      title: 'Producto guardado',
      text: '¡Producto guardado exitosamente!',
      timer: 1500,
      showConfirmButton: false
    })


  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message || 'Ocurrió un error al guardar el producto'
    })

  }
};

const editProduct = (product) => {
  editingProduct.value = product;
  name.value = product.name;
  price.value = product.price;
  stock.value = product.stock;
  imageFile.value = null;
  showModal.value = true;
};

const deleteProduct = async (product) => {
  if (!confirm('¿Eliminar producto?')) return;
  await supabase.from('products').delete().eq('id', product.id);
  loadProducts();
};

const filteredProducts = computed(() =>
  products.value.filter((p) =>
    p.name.toLowerCase().includes(filterName.value.toLowerCase())
  )
);

onMounted(loadProducts);
</script>

<template>
  <div class="products-page">
    <div class="header">
      <h1>📦 Mis Productos</h1>
      <button class="btn-primary" @click="showModal = true">
        ➕ Nuevo producto
      </button>
    </div>

    <div class="filter-section">
      <input type="text" v-model="filterName" placeholder="Buscar producto..." />
    </div>

    <div class="product-list-container">
      <div v-if="filteredProducts.length === 0" class="no-products">
        No hay productos registrados
      </div>

      <div class="product-list">
        <div v-for="p in filteredProducts" :key="p.id" class="product-card">
          <div class="img-container">
            <img v-if="p.image_url" :src="p.image_url" />
            <div v-else class="placeholder">Sin imagen</div>
          </div>

          <div class="info">
            <strong>{{ p.name }}</strong>
            <span>S/ {{ p.price }}</span>
            <small>Stock: {{ p.stock }}</small>
          </div>

          <div class="actions">
            <button class="btn-edit" @click="editProduct(p)">✏️</button>
            <button class="btn-delete" @click="deleteProduct(p)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">
        <h2>{{ editingProduct ? 'Editar producto' : 'Registrar producto' }}</h2>

        <input v-model="name" type="text" placeholder="Nombre" />
        <input v-model="price" type="number" placeholder="Precio" />
        <input v-model="stock" type="number" placeholder="Stock" />
        <input type="file" accept="image/*" @change="onFileChange" />

        <img v-if="imagePreview" :src="imagePreview" class="preview-img" />

        <button class="btn-primary" @click="saveProduct">Guardar</button>
        <button class="btn-cancel" @click="showModal = false">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===============================
   KioPOS – Productos (Responsive)
=============================== */

.products-page {
  padding: 20px;
  background: #f3f4f6;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  color: #111827;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #4f46e5;
}

.btn-primary {
  background: #4f46e5;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.btn-primary:hover {
  background: #4338ca;
  transform: translateY(-1px);
}

/* FILTRO */
.filter-section {
  margin-bottom: 16px;
}

.filter-section input {
  width: 100%;
  max-width: 360px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  outline: none;
}

.filter-section input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

/* CONTENEDOR CON SCROLL */
.product-list-container {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 6px;
}

/* GRID RESPONSIVE */
.product-list {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

/* CARD PRODUCTO */
.product-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.15);
}

/* IMAGEN */
.img-container {
  width: 100%;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  font-size: 13px;
  color: #6b7280;
}

/* INFO */
.info strong {
  font-size: 16px;
  color: #111827;
}

.info span {
  font-size: 14px;
  color: #4f46e5;
  font-weight: 600;
}

.info small {
  font-size: 13px;
  color: #6b7280;
}

/* ACCIONES */
.actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.btn-edit,
.btn-delete {
  flex: 1;
  border: none;
  padding: 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-edit {
  background: #e0e7ff;
  color: #3730a3;
}

.btn-edit:hover {
  background: #c7d2fe;
}

.btn-delete {
  background: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background: #fecaca;
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: #ffffff;
  padding: 20px;
  width: 90%;
  max-width: 420px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal h2 {
  color: #4f46e5;
}

.modal input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.modal input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.preview-img {
  width: 50%;
  border-radius: 10px;
}

.btn-cancel {
  background: #9ca3af;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
}

/* SIN PRODUCTOS */
.no-products {
  text-align: center;
  padding: 30px;
  color: #6b7280;
}

/* RESPONSIVE */
@media (max-width: 480px) {
  .header h1 {
    font-size: 20px;
  }

  .product-list {
    grid-template-columns: 1fr;
  }
}

</style>
