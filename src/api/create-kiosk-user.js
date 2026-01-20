import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors()); // permite cualquier origen
app.use(express.json());

const supabaseAdmin = createClient(
  'https://xseiakfnbcjspcsdfqrb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY // TU service role key segura
);

// Crear usuario kiosko
app.post('/create', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });

  try {
    // Crear usuario en auth.users
    const { data: newUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'kiosk' },
      });
    if (authError) return res.status(400).json({ error: authError.message });

    // Crear perfil en tabla profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{ id: newUser.id, email, name, role: 'kiosk', active: true }]);

    if (profileError)
      return res.status(400).json({ error: profileError.message });

    res.json({
      message: 'Usuario kiosko creado',
      user: { id: newUser.id, email, name, role: 'kiosk', active: true },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar kioskos
app.get('/list', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'kiosk')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activar / desactivar kiosko
app.post('/toggle/:id', async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ active })
      .eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar kiosko
app.post('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { email, name } = req.body;
  try {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ email, name })
      .eq('id', id);
    if (profileError)
      return res.status(400).json({ error: profileError.message });
    res.json({ message: 'Usuario editado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar kiosko
app.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
