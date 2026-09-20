// Arreglo global donde se acumula la lista del personal
let listaRegistros = [];

// Convertir archivo de imagen a Base64
function convertirBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// 1. Enviar la imagen a la función Serverless de Vercel
async function procesarImagenIA() {
  const input = document.getElementById('inputFoto');
  const estado = document.getElementById('estadoCarga');

  if (!input.files || input.files.length === 0) {
    alert('Por favor selecciona una foto con la lista a mano alzada.');
    return;
  }

  estado.innerText = 'Procesando imagen con la IA, por favor espera...';

  try {
    const imagenBase64 = await convertirBase64(input.files[0]);

    const respuesta = await fetch('/api/transcribir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagenBase64 }),
    });

    const resultado = await respuesta.json();

    if (resultado.exito) {
      estado.innerText = '¡Transcripción completada con éxito!';
      // Agregar los nuevos elementos extraídos a la lista global
      listaRegistros = [...listaRegistros, ...resultado.datos];
      actualizarTabla();
    } else {
      estado.innerText = 'Error: ' + resultado.error;
    }
  } catch (error) {
    console.error(error);
    estado.innerText = 'Ocurrió un error al intentar procesar la imagen.';
  }
}

// 2. Renderizar los datos en la tabla HTML
function actualizarTabla() {
  const tbody = document.getElementById('cuerpoTabla');
  tbody.innerHTML = '';

  listaRegistros.forEach((persona) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${persona.nombre || '-'}</td>
      <td>${persona.rut_dni || '-'}</td>
      <td>${persona.empresa || '-'}</td>
      <td>${persona.rol || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 3. Script para exportar los datos visibles a un archivo .xlsx real
function exportarAExcel() {
  if (listaRegistros.length === 0) {
    alert('No hay registros en la tabla para exportar.');
    return;
  }

  // Convertir el arreglo de objetos a una hoja de trabajo de SheetJS
  const hojaTrabajo = XLSX.utils.json_to_sheet(listaRegistros, {
    header: ['nombre', 'rut_dni', 'empresa', 'rol'],
  });

  // Cambiar encabezados de las columnas en la hoja
  XLSX.utils.sheet_add_aoa(hojaTrabajo, [['Nombre', 'RUT / DNI', 'Empresa', 'Rol']], { origin: 'A1' });

  // Crear un libro de trabajo
  const libroTrabajo = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libroTrabajo, hojaTrabajo, 'Control_Aforo');

  // Obtener fecha actual para el nombre del archivo
  const fecha = new Date().toISOString().slice(0, 10);
  
  // Descargar el archivo Excel
  XLSX.writeFile(libroTrabajo, `Registro_Personal_${fecha}.xlsx`);
}