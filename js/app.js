// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCTCxO7DcQqRak48ns30iS87G_5_fY_ZAM",
  authDomain: "agenda-peluqueria-ff6e3.firebaseapp.com",
  projectId: "agenda-peluqueria-ff6e3",
  storageBucket: "agenda-peluqueria-ff6e3.firebasestorage.app",
  messagingSenderId: "613294168272",
  appId: "1:613294168272:web:e477d1798c34481c3666d5",
  measurementId: "G-C3ZM9KENHR"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const citasRef = db.collection("citas");

// Elementos
const form = document.getElementById('citaForm');
const lista = document.getElementById('listaCitas');
const horaSelect = document.getElementById('hora');
const fechaInput = document.getElementById('fecha');
const estilistaInput = document.getElementById('estilista');
const duracionInput = document.getElementById('duracion');
const vacio = document.getElementById('vacio');
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const loginBtn = document.getElementById('loginBtn');
const adminPass = document.getElementById('adminPass');
const filtroEstilista = document.getElementById('filtroEstilista');
const filtroFecha = document.getElementById('filtroFecha');

const ADMIN_PASSWORD = "1234";
let editId = null;
let cacheCitas = [];

// Utilidades
function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function generarHorarios() {
  const horarios = [];
  for (let h = 9; h <= 17; h++) {
    horarios.push(`${String(h).padStart(2,"0")}:00`);
    horarios.push(`${String(h).padStart(2,"0")}:30`);
  }
  return horarios;
}

// Actualizar horas disponibles
function actualizarHoras() {
  const fecha = fechaInput.value;
  const estilista = estilistaInput.value;
  const duracion = parseInt(duracionInput.value || "30", 10);

  const ocupadas = (fecha && estilista)
    ? cacheCitas.filter(c => c.fecha === fecha && c.estilista === estilista && c.id !== editId)
    : [];

  horaSelect.innerHTML = '<option value="">Selecciona…</option>';
  generarHorarios().forEach(h => {
    const inicio = timeToMinutes(h);
    const fin = inicio + duracion;
    const choca = ocupadas.some(c => {
      const cInicio = timeToMinutes(c.hora);
      const cFin = cInicio + parseInt(c.duracion, 10);
      return inicio < cFin && cInicio < fin;
    });
    if (!choca) {
      const opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h;
      horaSelect.appendChild(opt);
    }
  });
}

// Render agenda
function renderAgenda() {
  const filtroE = filtroEstilista.value;
  const filtroF = filtroFecha.value;

  const filtradas = cacheCitas.filter(c => {
    const matchE = filtroE ? c.estilista === filtroE : true;
    const matchF = filtroF ? c.fecha === filtroF : true;
    return matchE && matchF;
  });

  lista.innerHTML = "";
  vacio.style.display = filtradas.length ? "none" : "block";

  filtradas.forEach(c => {
    const item = document.createElement("li");
    item.className = "item";
    item.innerHTML = `
      <div>
        <strong>${c.nombre}</strong> — ${c.fecha} ${c.hora}
        <div class="meta">${c.estilista} • ${c.servicio} • ${c.duracion} min</div>
      </div>
      <div class="actions"></div>
    `;
    const actions = item.querySelector(".actions");

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.onclick = () => editarCita(c.id);

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.className = "danger";
    btnEliminar.onclick = () => eliminarCita(c.id);

    actions.appendChild(btnEditar);
    actions.appendChild(btnEliminar);
    lista.appendChild(item);
  });
}

// CRUD Firestore
async function crearCita(data) {
  await citasRef.add(data);
}
async function actualizarCita(id, data) {
  await citasRef.doc(id).set(data, { merge: true });
}
async function eliminarCita(id) {
  await citasRef.doc(id).delete();
}
function editarCita(id) {
  const c = cacheCitas.find(x => x.id === id);
  if (!c) return;
  document.getElementById('nombre').value = c.nombre;
  fechaInput.value = c.fecha;
  estilistaInput.value = c.estilista;
  document.getElementById('servicio').value = c.servicio;
  duracionInput.value = c.duracion;
  editId = id;
  actualizarHoras();
  horaSelect.value = c.hora;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Guardar cita
form.addEventListener('submit', async e => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  const fecha = fechaInput.value;
  const estilista = estilistaInput.value;
  const servicio = document.getElementById('servicio').value;
  const duracion = duracionInput.value;
  const hora = horaSelect.value;

  if (!nombre || !fecha || !hora || !estilista || !servicio || !duracion) {
    alert("Completa todos los campos");
    return;
  }

  const data = { nombre, fecha, hora, estilista, servicio, duracion };

  if (editId) {
    await actualizarCita(editId, data);
    editId = null;
  } else {
    await crearCita(data);
  }

  form.reset();
  actualizarHoras();
});

// Login administrador
loginBtn.addEventListener("click", () => {
  if (adminPass.value === ADMIN_PASSWORD) {
    adminSection.style.display = "block";
    loginSection.style.display = "none";
    renderAgenda();
  } else {
    alert("Contraseña incorrecta");
  }
});

// Filtros
filtroEstilista.addEventListener("change", renderAgenda);
filtroFecha.addEventListener("change", renderAgenda);

// Suscripción en tiempo real a Firestore
citasRef.onSnapshot(snapshot => {
  cacheCitas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAgenda();
  actualizarHoras();
});

// Inicialización
actualizarHoras();