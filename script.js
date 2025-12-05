// ===== SISTEMA DE EVENTOS LOCAL =====
let eventos = JSON.parse(localStorage.getItem('eventos')) || [];

const formEvento = document.getElementById('formEvento');
const listaEventos = document.getElementById('listaEventos');

// === SALVAR NOVO EVENTO ===
formEvento.addEventListener('submit', (e) => {
  e.preventDefault();
  const evento = {
    id: Date.now(),
    nome: nomeEvento.value.trim(),
    data: dataEvento.value,
    classificacao: classificacao.value.trim(),
    local: localEvento.value.trim(),
    pagamento: formasPagamento.value.trim(),
    descricao: descricao.value.trim(),
    lotes: []
  };

  if (!evento.nome) return alert("Preencha o nome do evento!");

  eventos.push(evento);
  salvarLocal();
  formEvento.reset();
  renderEventos();
});

// === RENDERIZAR EVENTOS ===
function renderEventos() {
  listaEventos.innerHTML = '';

  if (eventos.length === 0) {
    listaEventos.innerHTML = '<p>Nenhum evento cadastrado.</p>';
    return;
  }

  eventos.forEach(ev => {
    const div = document.createElement('div');
    div.classList.add('evento-card');
    div.innerHTML = `
      <h3>${ev.nome}</h3>
      <p><b>Data:</b> ${ev.data}</p>
      <p><b>Local:</b> ${ev.local}</p>

      <button onclick="abrirModalLote(${ev.id})">Gerenciar Setores e Lotes</button>
      <button onclick="visualizarLotes(${ev.id})">Visualizar Lotes</button>
      <button onclick="editarLotes(${ev.id})">Editar Lotes</button>
      <button onclick="editarEvento(${ev.id})">Editar Evento</button>
      <button onclick="excluirEvento(${ev.id})">Excluir</button>

      <div id="lotes-${ev.id}" class="lotes-container" style="display:none;"></div>
    `;
    listaEventos.appendChild(div);
  });
}

// === EXCLUIR EVENTO ===
function excluirEvento(id) {
  const idNum = Number(id);
  eventos = eventos.filter(e => Number(e.id) !== idNum);
  salvarLocal();
  renderEventos();
}

// === SALVAR LOCALMENTE ===
function salvarLocal() {
  localStorage.setItem('eventos', JSON.stringify(eventos));
}

// Render inicial
renderEventos();

// === BACKUP E RESTAURAÇÃO ===
document.getElementById('btnExportar').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(eventos, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'backup-eventos.json';
  link.click();
});

document.getElementById('btnImportar').addEventListener('click', () => {
  const file = document.getElementById('importarBackup').files[0];
  if (!file) return alert('Selecione um arquivo JSON válido.');
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!Array.isArray(dados)) throw new Error();
      eventos = dados;
      salvarLocal();
      renderEventos();
      alert('Backup importado com sucesso!');
    } catch {
      alert('Erro ao importar arquivo. Certifique-se de que é um JSON válido.');
    }
  };
  reader.readAsText(file);
});

document.getElementById('btnLimpar').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja apagar todos os dados locais?')) {
    localStorage.removeItem('eventos');
    eventos = [];
    renderEventos();
  }
});

// === RESETAR SISTEMA COMPLETO ===
document.getElementById('btnResetar').addEventListener('click', () => {
  if (confirm('⚠️ Deseja realmente RESETAR TODO o sistema?')) {
    localStorage.clear();
    eventos = [];
    renderEventos();
    alert('✅ Sistema totalmente resetado!');
  }
});

// === FORMATAÇÃO AUTOMÁTICA DE MOEDA ===
function formatarMoedaInput(input) {
  let valor = input.value.replace(/[^\d]/g, '');
  valor = (parseInt(valor, 10) / 100).toFixed(2) + '';
  valor = valor.replace('.', ',');
  valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  input.value = 'R$ ' + valor;
}

// === MODAL DE LOTE ===
const modalLote = document.getElementById('modalLote');
const formLote = document.getElementById('formLote');
const cancelarLote = document.getElementById('cancelarLote');
const setoresContainer = document.getElementById('setoresContainer');
const qtdSetoresInput = document.getElementById('qtdSetores');
let idEventoAtual = null;
let modoEdicao = false;
let indiceLoteEdicao = null;

function abrirModalLote(idEvento) {
  idEventoAtual = idEvento;
  modoEdicao = false;
  indiceLoteEdicao = null;

  document.getElementById('tituloLote').innerText = 'Cadastrar Novo Lote';
  document.getElementById('nomeLote').value = '';
  qtdSetoresInput.value = 1;
  gerarCamposSetores(1);

  modalLote.style.display = 'flex';
}

// === GERAR CAMPOS DE SETORES ===
function gerarCamposSetores(qtd) {
  setoresContainer.innerHTML = '';
  for (let i = 1; i <= qtd; i++) {
    const div = document.createElement('div');
    div.classList.add('setor-block');
    div.innerHTML = `
      <h4>Setor ${i}</h4>
      <label>Nome do Setor</label>
      <input type="text" class="setor-nome" placeholder="Ex: Pista, Camarote...">
      <label>Meia</label>
      <input type="text" class="setor-meia" placeholder="R$ 0,00">
      <label>Solidário</label>
      <input type="text" class="setor-solidario" placeholder="R$ 0,00">
      <label>Inteira</label>
      <input type="text" class="setor-inteira" placeholder="R$ 0,00">
    `;
    setoresContainer.appendChild(div);
  }

  setoresContainer.querySelectorAll('.setor-meia, .setor-solidario, .setor-inteira').forEach(input => {
    input.addEventListener('input', () => formatarMoedaInput(input));
  });
}

qtdSetoresInput.addEventListener('change', () => {
  let qtd = parseInt(qtdSetoresInput.value);
  if (isNaN(qtd) || qtd < 1) qtd = 1;
  if (qtd > 5) qtd = 5;
  gerarCamposSetores(qtd);
});

// === SALVAR LOTE ===
formLote.addEventListener('submit', (e) => {
  e.preventDefault();
  const evento = eventos.find(e => e.id === idEventoAtual);
  if (!evento) return;

  const nomeLote = document.getElementById('nomeLote').value.trim() || `Lote ${evento.lotes.length + 1}`;
  const setores = [];

  const blocos = setoresContainer.querySelectorAll('.setor-block');
  blocos.forEach(div => {
    const nome = div.querySelector('.setor-nome').value.trim() || 'Setor';
    const meia = div.querySelector('.setor-meia').value.trim() || 'R$ 0,00';
    const solidario = div.querySelector('.setor-solidario').value.trim() || 'R$ 0,00';
    const inteira = div.querySelector('.setor-inteira').value.trim() || 'R$ 0,00';
    setores.push({ setor: nome, valores: { meia, solidario, inteira } });
  });

  const lote = { nome: nomeLote, setores };

  if (modoEdicao && indiceLoteEdicao !== null) {
    evento.lotes[indiceLoteEdicao] = lote;
  } else {
    evento.lotes.push(lote);
  }

  salvarLocal();
  modalLote.style.display = 'none';
  renderEventos();
  alert('💾 Lote salvo com sucesso!');
});

cancelarLote.addEventListener('click', () => {
  modalLote.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modalLote) modalLote.style.display = 'none';
});

// === VISUALIZAR LOTES ===
function visualizarLotes(id) {
  const evento = eventos.find(e => e.id === id);
  const container = document.getElementById(`lotes-${id}`);
  if (!evento || !container) return;

  const aberto = container.style.display === 'block';
  container.style.display = aberto ? 'none' : 'block';
  if (aberto) return;

  if (!evento.lotes.length) {
    container.innerHTML = '<p>Nenhum lote cadastrado.</p>';
    return;
  }

  container.innerHTML = '';
  evento.lotes.forEach((lote, indexLote) => {
    const divLote = document.createElement('div');
    divLote.classList.add('lote-card');

    let setoresHTML = '';
    lote.setores.forEach(s => {
      setoresHTML += `
        <div class="setor-item">
          <h4>${s.setor}</h4>
          <p><b>Meia:</b> ${s.valores.meia}</p>
          <p><b>Solidário:</b> ${s.valores.solidario}</p>
          <p><b>Inteira:</b> ${s.valores.inteira}</p>
        </div>
      `;
    });

    divLote.innerHTML = `
      <h3>${lote.nome}</h3>
      ${setoresHTML}
      <button onclick="editarLote(${id}, ${indexLote})">Editar Este Lote</button>
      <hr>
    `;
    container.appendChild(divLote);
  });
}

// === EDITAR LOTE ===
function editarLote(idEvento, indiceLote) {
  const evento = eventos.find(e => e.id === idEvento);
  if (!evento) return;

  const lote = evento.lotes[indiceLote];
  if (!lote) return;

  idEventoAtual = idEvento;
  modoEdicao = true;
  indiceLoteEdicao = indiceLote;

  document.getElementById('tituloLote').innerText = 'Editar Lote';
  document.getElementById('nomeLote').value = lote.nome;
  qtdSetoresInput.value = lote.setores.length;
  gerarCamposSetores(lote.setores.length);

  const blocos = setoresContainer.querySelectorAll('.setor-block');
  blocos.forEach((div, i) => {
    const s = lote.setores[i];
    div.querySelector('.setor-nome').value = s.setor;
    div.querySelector('.setor-meia').value = s.valores.meia;
    div.querySelector('.setor-solidario').value = s.valores.solidario;
    div.querySelector('.setor-inteira').value = s.valores.inteira;
  });

  modalLote.style.display = 'flex';
}

// === SELECIONAR LOTE PARA EDIÇÃO ===
function editarLotes(idEvento) {
  const evento = eventos.find(e => e.id === idEvento);
  if (!evento || evento.lotes.length === 0) {
    alert('Nenhum lote para editar!');
    return;
  }

  let lista = 'Selecione o lote para editar:\n\n';
  evento.lotes.forEach((l, i) => {
    lista += `${i + 1}. ${l.nome}\n`;
  });

  const escolha = prompt(lista);
  const index = parseInt(escolha) - 1;
  if (!isNaN(index) && evento.lotes[index]) {
    editarLote(idEvento, index);
  }
}

// === EDITAR EVENTO (COM MODAL EXISTENTE) ===
const modal = document.getElementById('modalEditar');
const formEditar = document.getElementById('formEditar');
const cancelarEdicao = document.getElementById('cancelarEdicao');

function editarEvento(id) {
  const evento = eventos.find(e => e.id === id);
  if (!evento) return;

  document.getElementById('editId').value = evento.id;
  document.getElementById('editNome').value = evento.nome;
  document.getElementById('editData').value = evento.data;
  document.getElementById('editClassificacao').value = evento.classificacao;
  document.getElementById('editLocal').value = evento.local;
  document.getElementById('editPagamento').value = evento.pagamento;
  document.getElementById('editDescricao').value = evento.descricao;

  modal.style.display = 'flex';
}

cancelarEdicao.addEventListener('click', () => {
  modal.style.display = 'none';
});

formEditar.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = Number(document.getElementById('editId').value);
  const evento = eventos.find(e => e.id === id);
  if (!evento) return;

  evento.nome = document.getElementById('editNome').value.trim();
  evento.data = document.getElementById('editData').value.trim();
  evento.classificacao = document.getElementById('editClassificacao').value.trim();
  evento.local = document.getElementById('editLocal').value.trim();
  evento.pagamento = document.getElementById('editPagamento').value.trim();
  evento.descricao = document.getElementById('editDescricao').value.trim();

  salvarLocal();
  renderEventos();
  modal.style.display = 'none';
  alert('✅ Evento atualizado com sucesso!');
});

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

// ===== INTEGRAÇÃO COM SERVICE WORKER (v3 - atualização automática) =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    console.log('[App] Service Worker registrado.');

    // Verifica se há nova versão a cada 30 segundos
    setInterval(() => {
      if (reg.active) reg.active.postMessage({ type: 'CHECK_FOR_UPDATE' });
    }, 30000);

    // Escuta mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        if (confirm('🚀 Há uma nova versão do app. Deseja atualizar agora?')) {
          reg.active.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload(true);
        }
      }
    });
  });
}
