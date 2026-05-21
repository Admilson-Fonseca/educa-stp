/**
 * @file server.js
 * @description Ponto de entrada da API RESTful para o ecossistema EduSTP.
 * @course Web Services - Engenharia Informática
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuração de Middlewares Globais de Ciclo de Vida HTTP
app.use(cors());
app.use(express.json());

// Conexão à Camada de Persistência (MongoDB Atlas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conexão ao MongoDB estabelecida com sucesso.'))
  .catch(err => console.error('❌ Falha na inicialização da conexão ao MongoDB:', err));

// Definição do Esquema (Schema) e Mapeamento Objeto-Documental (ODM)
const InstituicaoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  regiao: { type: String, required: true },
  tipo: { type: String, required: true },
  cursos: [String] 
});
const Instituicao = mongoose.model('Instituicao', InstituicaoSchema);

/**
 * Middleware de Segurança Perimetral
 * Intervém no ciclo de requisição para validar a presença e exatidão da credencial X-API-Key.
 */
const verificarApiKey = (req, res, next) => {
  const chaveCliente = req.header('X-API-Key'); 
  
  if (!chaveCliente || chaveCliente !== process.env.API_KEY) {
    return res.status(401).json({ erro: 'Acesso negado. Credencial API Key inválida ou ausente.' });
  }
  next(); 
};

// ==========================================
// DEFINIÇÃO DOS ENDPOINTS DA API (CRUD)
// ==========================================

/**
 * Endpoint: Listagem Geral e Procura Filtrada
 * Método: GET /api/instituicoes
 */
app.get('/api/instituicoes', verificarApiKey, async (req, res) => {
  try {
    const { busca, regiao } = req.query;
    let filtro = {};

    if (busca) {
      // Executa varredura parcial por expressões regulares insensíveis a maiúsculas/minúsculas
      filtro.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { cursos: { $regex: busca, $options: 'i' } }
      ];
    }
    if (regiao) {
      filtro.regiao = regiao;
    }

    const resultados = await Instituicao.find(filtro);
    res.json(resultados);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro interno ao processar a consulta.' });
  }
});

/**
 * Endpoint: Persistência de Novas Entidades
 * Método: POST /api/instituicoes
 */
app.post('/api/instituicoes', verificarApiKey, async (req, res) => {
  try {
    const novaInstituicao = new Instituicao(req.body);
    await novaInstituicao.save();
    res.status(201).json(novaInstituicao);
  } catch (erro) {
    res.status(400).json({ erro: 'Dados de submissão inconsistentes com as restrições do modelo.' });
  }
});

/**
 * Endpoint: Atualização Integral/Parcial de Registos Existentes
 * Método: PUT /api/instituicoes/:id
 */
app.put('/api/instituicoes/:id', verificarApiKey, async (req, res) => {
  try {
    const atualizada = await Instituicao.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(atualizada);
  } catch (erro) {
    res.status(400).json({ erro: 'Falha na mutação dos dados ou identificador inválido.' });
  }
});

/**
 * Endpoint: Supressão Crítica de Registos
 * Método: DELETE /api/instituicoes/:id
 */
app.delete('/api/instituicoes/:id', verificarApiKey, async (req, res) => {
  try {
    await Instituicao.findByIdAndDelete(req.params.id);
    res.json({ mensagem: 'Entidade removida com sucesso da base de dados.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro interno ao tentar remover o registo especificado.' });
  }
});

/**
 * Endpoint: Consulta Singular por Identificador Único
 * Método: GET /api/instituicoes/:id
 */
app.get('/api/instituicoes/:id', verificarApiKey, async (req, res) => {
  try {
    const instituicao = await Instituicao.findById(req.params.id);
    if (!instituicao) return res.status(404).json({ erro: 'O recurso solicitado não foi localizado.' });
    res.json(instituicao);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro interno na extração dos metadados do recurso.' });
  }
});

// Inicialização do Escutador de Eventos de Rede da Aplicação
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serviço HTTP ativo e operacional na porta ${PORT}`));