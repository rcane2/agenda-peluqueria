// ==========================
// Inicializar Firebase
// ==========================
const firebaseConfig = {
  // ⚠️ Reemplaza con tu configuración real de Firebase
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================
// Funciones de horarios
// ==========================
function cargarHorarios() {
  const horaSelect = document.getElementById("hora");
  horaSelect.innerHTML = ""; // limpiar

  const horas = [
    "09:00","09:30","10:00","10:30","11:00","11:30",
    "12:00","12:30","13:00","13:30","14:00","14:30",
    "15:00","15:30","16:00","16:30","17:00","17:30"
  ];

  horas.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = h;
    horaSelect.appendChild(opt);
  });
}

// Filtrar horarios ocupados
async function filtrarHorarios() {
  const fecha = document.getElementById("fecha").value;
  const estilista = document.getElementById("estilista").value;
  const horaSelect = document.getElementById("hora");

  if (!fecha || !estilista) return;

  // Traer citas de ese estilista en esa fecha
  const snapshot = await db.collection("citas")
    .where("fecha","==",fecha)
    .where("estilista","==",estilista)
    .get();

  const ocupados = snapshot.docs.map(doc => doc.data().hora);

  // Deshabilitar opciones ocupadas
  [...horaSelect.options].forEach(opt => {
    opt.disabled = ocupados.includes(opt.value);
  });
}

// ==========================
// Reservar cita
// ==========================
document.getElementById("citaForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const fecha = document.getElementById("fecha").value;
  const estilista = document.getElementById("estilista").value;
  const servicio = document.getElementById("servicio").value;
  const duracion = document.getElementById("duracion").value;
  const hora = document.getElementById("hora").value;

  // Guardar en Firestore
  await db.collection("citas").add({
    nombre, fecha, estilista, servicio, duracion, hora
  });

  // Mensaje de confirmación
  const mensaje = `✅ Reserva confirmada:\nCliente: ${nombre}\nFecha: ${fecha}\nHora: ${hora}\nEstilista: ${estilista}\nServicio: ${servicio}\nDuración: ${duracion} min`;

  alert(mensaje);

  // Link para compartir por WhatsApp
  const wpLink = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  window.open(wpLink, "_blank");

  // Recargar horarios para que se deshabilite el recién reservado
  filtrarHorarios();
});

// ==========================
// Login administrador
// ==========================
document.getElementById("loginBtn").addEventListener("click", () => {
  const pass = document.getElementById("adminPass").value;
  if (pass === "admin123") { // ⚠️ Cambia la contraseña
    document.getElementById("adminSection").style.display = "block";
    document.getElementById("loginSection").style.display = "none";
  } else {
    alert("Contraseña incorrecta");
  }
});

// ==========================
// Mostrar agenda administrador
// ==========================
async function cargarAgenda() {
  const filtroEstilista = document.getElementById("filtroEstilista").value;
  const filtroFecha = document.getElementById("filtroFecha").value;

  let query = db.collection("citas");
  if (filtroEstilista) query = query.where("estilista","==",filtroEstilista);
  if (filtroFecha) query = query.where("fecha","==",filtroFecha);

  const snapshot = await query.get();
  const lista = document.getElementById("listaCitas");
  const vacio = document.getElementById("vacio");

  lista.innerHTML = "";
  if (snapshot.empty) {
    vacio.style.display = "block";
  } else {
    vacio.style.display = "none";
    snapshot.forEach(doc => {
      const c = doc.data();
      const li = document.createElement("li");
      li.textContent = `${c.fecha} ${c.hora} - ${c.nombre} (${c.servicio}) con ${c.estilista}`;
      lista.appendChild(li);
    });
  }
}

document.getElementById("filtroEstilista").addEventListener("change", cargarAgenda);
document.getElementById("filtroFecha").addEventListener("change", cargarAgenda);

// ==========================
// Inicialización
// ==========================
cargarHorarios();
