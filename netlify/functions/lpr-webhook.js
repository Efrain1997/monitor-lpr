import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  // 1. Rechazar cualquier petición que no sea POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Método no permitido. Usa POST.' }) 
    };
  }

  // 2. Inicializar Supabase usando las variables de entorno de Netlify
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. Extraer los datos enviados por la cámara
    const data = JSON.parse(event.body);
    const { camera_id, plate_text, confidence_score, captured_at } = data;

    // Validación básica
    if (!camera_id || !plate_text) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Faltan datos requeridos (camera_id o plate_text)' }) 
      };
    }

    // 4. Insertar el registro en la base de datos
    const { data: insertData, error } = await supabase
      .from('lpr_reads')
      .insert([
        {
          camera_id: camera_id,
          plate_text: plate_text,
          confidence_score: confidence_score,
          captured_at: captured_at || new Date().toISOString()
        }
      ]);

    if (error) throw error;

    // 5. Responder a la cámara que la operación fue un éxito
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Lectura LPR guardada con éxito' })
    };

  } catch (error) {
    console.error('Error procesando el webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
