// Configurações Globais do Cliente
const API_URL = 'http://localhost:5000/api/instituicoes';
const API_KEY = 'STP_SECRET_2026'; 

let idInstituicaoEmEdicao = null;

// Seletores Corretos por ID Nativo
const inputBusca = document.getElementById('inputBusca');
const selectRegiaoBusca = document.getElementById('selectRegiaoBusca');
const btnBuscar = document.getElementById('btnBuscar');
const btnLimpar = document.getElementById('btnLimpar');

const formGerir = document.getElementById('formGerir');
const inputNome = document.getElementById('inputNome');
const inputRegiao = document.getElementById('inputRegiao');
const inputTipo = document.getElementById('inputTipo');
const txtCursos = document.getElementById('txtCursos');
const btnGuardar = document.getElementById('btnGuardar');
const containerCards = document.getElementById('containerCards');

// 1. CARREGAR / BUSCAR DADOS (MÉTODO GET)
async function carregarInstituicoes() {
    const termoBusca = inputBusca.value;
    const regiaoBusca = selectRegiaoBusca.value;

    let url = `${API_URL}?busca=${encodeURIComponent(termoBusca)}`;
    if (regiaoBusca) {
        url += `&regiao=${encodeURIComponent(regiaoBusca)}`;
    }

    try {
        const resposta = await fetch(url, {
            method: 'GET',
            headers: { 'X-API-Key': API_KEY }
        });

        if (!resposta.ok) throw new Error('Erro na autenticação ou na busca.');

        const dados = await resposta.json();
        renderizarCards(dados);
    } catch (erro) {
        containerCards.innerHTML = `<p class="text-red-500 text-center py-8">❌ Erro ao carregar dados: Server Offline</p>`;
    }
}

// 2. GUARDAR DADOS (MÉTODO POST OU PUT)
async function guardarDados(e) {
    e.preventDefault(); 

    const dadosForm = {
        nome: inputNome.value,
        regiao: inputRegiao.value,
        tipo: inputTipo.value,
        cursos: txtCursos.value.split(',').map(c => c.trim()).filter(c => c !== "")
    };

    if (!dadosForm.nome || !dadosForm.regiao || !dadosForm.tipo) {
        alert('Por favor, preencha os campos obrigatórios (Nome, Região e Tipo).');
        return;
    }

    try {
        let url = API_URL;
        let metodo = 'POST';

        if (idInstituicaoEmEdicao) {
            url = `${API_URL}/${idInstituicaoEmEdicao}`;
            metodo = 'PUT';
        }

        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(dadosForm)
        });

        if (!resposta.ok) throw new Error('Erro ao submeter os dados.');

        alert(idInstituicaoEmEdicao ? '✅ Atualizado com sucesso!' : '✅ Registado com sucesso!');
        limparFormulario();
        carregarInstituicoes();
    } catch (erro) {
        alert('❌ Erro: ' + erro.message);
    }
}

// 3. ELIMINAR INSTITUIÇÃO (MÉTODO DELETE)
async function eliminarInstituicao(id) {
    if (!confirm('Tens a certeza que desejas eliminar esta instituição de STP?')) return;

    try {
        const resposta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': API_KEY }
        });

        if (!resposta.ok) throw new Error('Não foi possível eliminar.');

        alert('🗑️ Eliminada com sucesso!');
        carregarInstituicoes();
    } catch (erro) {
        alert('❌ Erro: ' + erro.message);
    }
}

// 4. PREPARAR EDIÇÃO (PREENCHE O FORMULÁRIO DO CRUD)
function prepararEdicao(id, nome, regiao, tipo, cursos) {
    idInstituicaoEmEdicao = id;
    inputNome.value = nome;
    inputRegiao.value = regiao;
    inputTipo.value = tipo;
    txtCursos.value = cursos;
    
    btnGuardar.textContent = "Atualizar Dados";
    // Troca dinamicamente para estilo azul de edição usando estilos explícitos fáceis de entender
    btnGuardar.style.backgroundColor = "#2563eb"; 
}

// AUXILIARES: CONSTRUIR OS CARDS DINAMICAMENTE
function renderizarCards(instituicoes) {
    containerCards.innerHTML = ''; 

    if (instituicoes.length === 0) {
        containerCards.innerHTML = '<p class="text-gray-500 col-span-2 text-center py-8">Nenhuma instituição encontrada em STP.</p>';
        return;
    }

    instituicoes.forEach(inst => {
        const cursosBadges = inst.cursos.map(c => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded inline-block mr-1 mb-1">${c}</span>`).join('');
        const corTipo = inst.tipo.toLowerCase().includes('superior') ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';

        const card = `
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <span class="text-xs ${corTipo} font-semibold px-2 py-1 rounded">${inst.tipo}</span>
                    <h3 class="text-lg font-bold text-gray-800 mt-2">${inst.nome}</h3>
                    <p class="text-sm text-gray-500 mt-1">📍 ${inst.regiao}</p>
                    <div class="mt-3">${cursosBadges}</div>
                </div>
                <div class="flex justify-end gap-2 mt-6 border-t pt-3">
                    <button onclick="prepararEdicao('${inst._id}', '${inst.nome}', '${inst.regiao}', '${inst.tipo}', '${inst.cursos.join(', ')}')" class="text-sm text-emerald-600 hover:text-emerald-800 font-medium px-3 py-1">Editar</button>
                    <button onclick="eliminarInstituicao('${inst._id}')" class="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1">Eliminar</button>
                </div>
            </div>
        `;
        containerCards.innerHTML += card;
    });
}

function limparFormulario() {
    idInstituicaoEmEdicao = null;
    formGerir.reset();
    btnGuardar.textContent = "Guardar Dados";
    btnGuardar.style.backgroundColor = ""; // Restaura para a cor original do style.css
}

// Configuração dos Event Listeners do Cliente
btnBuscar.addEventListener('click', carregarInstituicoes);
btnLimpar.addEventListener('click', () => {
    inputBusca.value = '';
    selectRegiaoBusca.value = '';
    carregarInstituicoes();
});
formGerir.addEventListener('submit', guardarDados);

// Executa automaticamente ao abrir o ecrã
window.onload = carregarInstituicoes;