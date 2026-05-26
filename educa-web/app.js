/**
 * @file app.js
 * @description Lógica de controlo do cliente web para consumo da API RESTful EduSTP.
 * @course Web Services - Engenharia Informática
 */

// Definição de constantes de comunicação com o serviço e estado global
const API_URL = 'http://localhost:5000/api/instituicoes';
const API_KEY = 'STP_SECRET_2026'; 

let idInstituicaoEmEdicao = null;

// Mapeamento de elementos do Modelo de Objetos do Documento (DOM)
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

/**
 * Efetua a requisição de leitura (MÉTODO GET) com parâmetros de filtragem.
 */
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

        if (!resposta.ok) throw new Error('Falha na autenticação ou na resposta do servidor.');

        const dados = await resposta.json();
        renderizarCards(dados);
    } catch (erro) {
        console.error("Transmissão interrompida:", erro);
        containerCards.innerHTML = `
            <div class="col-span-1 sm:col-span-2 text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                <p class="text-red-500 font-medium">Erro ao carregar dados: Server Offline ou Falha na Autenticação</p>
            </div>`;
    }
}

/**
 * Submete os dados do formulário para persistência (MÉTODO POST ou PUT).
 * @param {Event} e - Objeto de evento de submissão do formulário.
 */
async function guardarDados(e) {
    e.preventDefault(); 

    const dadosForm = {
        nome: inputNome.value.trim(),
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

        const respostaDados = await resposta.json();

        if (!resposta.ok) {
            // Captura mensagens de erro amigáveis vindas da validação do Mongoose backend
            throw new Error(respostaDados.erro || 'Falha na persistência dos dados submetidos.');
        }

        alert(idInstituicaoEmEdicao ? '🎉 Atualizado com sucesso!' : '🎉 Registado com sucesso!');
        limparFormulario();
        carregarInstituicoes();
    } catch (erro) {
        alert('❌ Erro: ' + erro.message);
    }
}

/**
 * Remove um registo da base de dados através do identificador único (MÉTODO DELETE).
 * @param {string} id - Identificador único da entidade.
 */
async function eliminarInstituicao(id) {
    if (!confirm('Tens a certeza que desejas eliminar esta instituição de STP?')) return;

    try {
        const resposta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': API_KEY }
        });

        if (!resposta.ok) throw new Error('Operação de remoção rejeitada pelo serviço.');

        alert('🗑️ Eliminada com sucesso!');
        // Se estivermos a editar a instituição que foi eliminada, limpa o formulário
        if (idInstituicaoEmEdicao === id) {
            limparFormulario();
        }
        carregarInstituicoes();
    } catch (erro) {
        alert('❌ Erro: ' + erro.message);
    }
}

/**
 * Prepara a interface do utilizador para modificação de dados (Estado de Edição).
 */
function prepararEdicao(id, nome, regiao, tipo, cursos) {
    idInstituicaoEmEdicao = id;
    inputNome.value = nome;
    inputRegiao.value = regiao;
    inputTipo.value = tipo;
    txtCursos.value = cursos;
    
    btnGuardar.innerHTML = `<i class="fas fa-sync-alt"></i> Atualizar Dados`;
    btnGuardar.style.backgroundColor = "#2563eb"; // Altera para Azul de Edição
}

/**
 * Renderiza dinamicamente os componentes visuais na árvore do DOM.
 * @param {Array} instituicoes - Coleção de objetos retornada pela API.
 */
function renderizarCards(instituicoes) {
    containerCards.innerHTML = ''; 

    if (instituicoes.length === 0) {
        containerCards.innerHTML = `
            <div class="col-span-1 sm:col-span-2 text-center py-8">
                <i class="fas fa-folder-open text-gray-300 text-3xl mb-2"></i>
                <p class="text-gray-500">Nenhuma instituição localizada no território nacional.</p>
            </div>`;
        return;
    }

    instituicoes.forEach(inst => {
        const cursosBadges = inst.cursos.map(c => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded inline-block mr-1 mb-1"><i class="fas fa-book-reader mr-1 text-gray-400"></i>${c}</span>`).join('');
        
        // Mapeamento visual estilizado por categorias de ensino de STP
        let corTipo = 'bg-gray-100 text-gray-800';
        if (inst.tipo === 'Ensino Superior') {
            corTipo = 'bg-blue-100 text-blue-800';
        } else if (inst.tipo === 'Ensino Secundário') {
            corTipo = 'bg-amber-100 text-amber-800';
        } else if (inst.tipo === 'Ensino Técnico / Profissional') {
            corTipo = 'bg-emerald-100 text-emerald-800';
        }

        const card = `
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <span class="text-xs ${corTipo} font-semibold px-2 py-1 rounded">${inst.tipo}</span>
                    <h3 class="text-lg font-bold text-gray-800 mt-2">${inst.nome}</h3>
                    <p class="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                        <i class="fas fa-map-marker-alt text-emerald-600"></i> ${inst.regiao}
                    </p>
                    <div class="mt-4">${cursosBadges}</div>
                </div>
                <div class="flex justify-end gap-2 mt-6 border-t pt-3">
                    <button onclick="prepararEdicao('${inst._id}', '${inst.nome.replace(/'/g, "\\'")}', '${inst.regiao}', '${inst.tipo}', '${inst.cursos.join(', ').replace(/'/g, "\\'")}')" class="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="eliminarInstituicao('${inst._id}')" class="text-xs bg-red-50 text-red-700 hover:bg-red-100 font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
        containerCards.innerHTML += card;
    });
}

/**
 * Restaura o estado original do formulário de inserção.
 */
function limparFormulario() {
    idInstituicaoEmEdicao = null;
    formGerir.reset();
    btnGuardar.innerHTML = `<i class="fas fa-save"></i> Guardar Dados`;
    btnGuardar.style.backgroundColor = ""; // Devolve o controle de cor para o CSS/Tailwind nativo
}

// Vinculação de escutas de eventos (Event Listeners)
btnBuscar.addEventListener('click', carregarInstituicoes);
btnLimpar.addEventListener('click', () => {
    inputBusca.value = '';
    selectRegiaoBusca.value = '';
    carregarInstituicoes();
});
formGerir.addEventListener('submit', guardarDados);

// Inicialização automatizada da interface ao carregar o ecossistema
window.onload = carregarInstituicoes;