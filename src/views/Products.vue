<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../lib/supabase';

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fileName = `${user.id}/product-${Date.now()}-${imageFile.value.name}`;

  const { error } = await supabase.storage
    .from('products')
    .upload(fileName, imageFile.value, {
      upsert: true,
      contentType: imageFile.value.type,
    });

  if (error) {
    console.error('Error subiendo imagen:', error);
    return null;
  }

  const { data } = supabase.storage.from('products').getPublicUrl(fileName);
  return data.publicUrl;
};

/* =========================
   ESTADO GENERAL
========================= */
const products = ref([]);
const showModal = ref(false);
const user = ref(null);
const filterName = ref('');

/* =========================
   NUEVO: EDICIÓN
========================= */
const editingProduct = ref(null);

/* =========================
   CARGAR USUARIO + PRODUCTOS
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
  let image_url = editingProduct.value ? editingProduct.value.image_url : null;

  const uploaded = await uploadImage();
  if (uploaded) image_url = uploaded;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (editingProduct.value) {
    await supabase
      .from('products')
      .update({
        name: name.value,
        price: price.value,
        stock: stock.value,
        image_url,
      })
      .eq('id', editingProduct.value.id);
  } else {
    await supabase.from('products').insert({
      name: name.value,
      price: price.value,
      stock: stock.value,
      image_url,
      user_id: authUser.id,
    });
  }

  // limpiar
  name.value = '';
  price.value = '';
  stock.value = '';
  imageFile.value = null;
  file.value = null;
  editingProduct.value = null;

  showModal.value = false;
  loadProducts();
};

/* =========================
   NUEVO: EDITAR
========================= */
const editProduct = (product) => {
  editingProduct.value = product;
  name.value = product.name;
  price.value = product.price;
  stock.value = product.stock;
  imageFile.value = null;
  showModal.value = true;
};

/* =========================
   NUEVO: ELIMINAR
========================= */
const deleteProduct = async (product) => {
  if (!confirm('¿Eliminar producto?')) return;
  await supabase.from('products').delete().eq('id', product.id);
  loadProducts();
};

/* =========================
   FILTRO POR NOMBRE
========================= */
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

    <!-- FILTRO POR NOMBRE -->
    <div class="filter-section">
      <input
        type="text"
        v-model="filterName"
        placeholder="Buscar producto..."
      />
    </div>

    <!-- PRODUCT LIST CON SCROLL -->
    <div class="product-list-container">
      <div v-if="filteredProducts.length === 0" class="no-products">
        No hay productos registrados
      </div>

      <div class="product-list">
        <div v-for="p in filteredProducts" :key="p.id" class="product-card">
          <div class="img-container">
            <img v-if="p.image_url" :src="p.image_url" alt="producto" />
            <div v-else class="placeholder">Sin imagen</div>
          </div>

          <div class="info">
            <strong>{{ p.name }}</strong>
            <span>S/ {{ p.price }}</span>
            <small>Stock: {{ p.stock }}</small>
          </div>

          <div class="actions">
            <button class="btn-edit" @click="editProduct(p)">✏️ Editar</button>
            <button class="btn-delete" @click="deleteProduct(p)">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">
        <h2>{{ editingProduct ? 'Editar producto' : 'Registrar producto' }}</h2>

        <input v-model="name" type="text" placeholder="Nombre" />
        <input v-model="price" type="number" placeholder="Precio" />
        <input v-model="stock" type="number" placeholder="Stock" />

        <input type="file" accept="image/*" @change="onFileChange" />

        <img v-if="imagePreview" :src="imagePreview" class="preview-img" />

        <button class="btn-primary" @click="saveProduct">💾 Guardar</button>
        <button class="btn-cancel" @click="showModal = false">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.products-page {
  padding: 20px;
  background: #f3f4f6;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: 'Segoe UI', sans-serif;
  color: #111827; /* texto visible */
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header h1 {
  font-size: 24px;
  color: #1f2937;
}

.btn-primary {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, transform 0.2s;
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
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  outline: none;
  font-size: 14px;
  transition: all 0.2s;
}
.filter-section input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

/* PRODUCT LIST CON SCROLL */
.product-list-container {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
}
.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

/* PRODUCT CARD */
.product-card {
  background: #1f2937; /* fondo oscuro para contraste */
  color: #f9fafb; /* letras claras */
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
}

.img-container {
  width: 100%;
  height: 120px;
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
  background: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-container .placeholder {
  color: #9ca3af;
  font-size: 12px;
}

/* INFO PRODUCTO */
.info strong {
  display: block;
  font-size: 16px;
  color: #f9fafb;
  margin-bottom: 4px;
}
.info span {
  display: block;
  font-size: 14px;
  color: #e5e7eb;
}
.info small {
  display: block;
  font-size: 12px;
  color: #d1d5db;
}

/* ACCIONES */
.actions {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}
.btn-edit {
  flex: 1;
  background: #facc15;
  color: #111827;
  border: none;
  border-radius: 8px;
  padding: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-edit:hover {
  background: #eab308;
}
.btn-delete {
  flex: 1;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-delete:hover {
  background: #dc2626;
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal input[type='text'],
.modal input[type='number'],
.modal input[type='file'] {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  outline: none;
  font-size: 14px;
}
.modal input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.modal .preview-img {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 8px;
}

.btn-cancel {
  background: #9ca3af;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-cancel:hover {
  background: #6b7280;
}

/* NO PRODUCTOS */
.no-products {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin: 20px 0;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .product-list {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
@media (max-width: 480px) {
  .header h1 {
    font-size: 20px;
  }
  .btn-primary {
    padding: 8px 12px;
    font-size: 14px;
  }
}
</style>
