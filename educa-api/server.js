const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// 🔌 LIGAÇÃO AO MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB com sucesso!'))
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// 📝 MODELO DE DADOS (Esquema para o MongoDB)
const InstituicaoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  regiao: { type: String, required: true },
  tipo: { type: String, required: true },
  cursos: [String] // Array de strings para os cursos
});
const Instituicao = mongoose.model('Instituicao', InstituicaoSchema);

// 🛡️ SEGURANÇA: Middleware de API Key (Fácil de explicar na defesa!)
const verificarApiKey = (req, res, next) => {
  const chaveCliente = req.header('X-API-Key'); // O cliente envia no Header
  
  if (!chaveCliente || chaveCliente !== process.env.API_KEY) {
    return res.status(401).json({ erro: 'Acesso negado. API Key inválida ou ausente.' });
  }
  next(); // Chave correta! Avança para a rota.
};

// ==========================================
// 🛣️ ROTAS DA API (CRUD + Pesquisa)
// ==========================================

// 1. LISTAR TODAS / PESQUISAR (GET) -> Alinhado com o teu botão "Buscar"
app.get('/api/instituicoes', verificarApiKey, async (req, res) => {
  try {
    const { busca, regiao } = req.query;
    let filtro = {};

    if (busca) {
      // Procura por nome ou curso (ignora maiúsculas/minúsculas)
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
    res.status(500).json({ erro: 'Erro ao buscar dados.' });
  }
});

// 2. CRIAR NOVA INSTITUIÇÃO (POST) -> Botão "Guardar Dados"
app.post('/api/instituicoes', verificarApiKey, async (req, res) => {
  try {
    const novaInstituicao = new Instituicao(req.body);
    await novaInstituicao.save();
    res.status(201).json(novaInstituicao);
  } catch (erro) {
    res.status(400).json({ erro: 'Erro ao guardar a instituição.' });
  }
});

// 3. ATUALIZAR UMA INSTITUIÇÃO (PUT) -> Botão "Editar"
app.put('/api/instituicoes/:id', verificarApiKey, async (req, res) => {
  try {
    const atualizada = await Instituicao.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(atualizada);
  } catch (erro) {
    res.status(400).json({ erro: 'Erro ao atualizar dados.' });
  }
});

// 4. ELIMINAR UMA INSTITUIÇÃO (DELETE) -> Botão "Eliminar"
app.delete('/api/instituicoes/:id', verificarApiKey, async (req, res) => {
  try {
    await Instituicao.findByIdAndDelete(req.params.id);
    res.json({ mensagem: 'Instituição eliminada com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao eliminar instituição.' });
  }
});

// 5. OBTER DETALHES DE UMA (GET por ID)
app.get('/api/instituicoes/:id', verificarApiKey, async (req, res) => {
  try {
    const instituicao = await Instituicao.findById(req.params.id);
    if (!instituicao) return res.status(404).json({ erro: 'Não encontrada.' });
    res.json(instituicao);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao obter detalhes.' });
  }
});

// INICIAR O SERVIDOR
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));