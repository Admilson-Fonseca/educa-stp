/**
 * @file server.js
 * @description Ponto de entrada da API RESTful para o ecossistema EduSTP com documentação Swagger.
 * @course Web Services - Engenharia Informática
 * @author Admilson Fonseca
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- Importação das Dependências do Swagger ---
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();

// Configuração de Middlewares Globais de Ciclo de Vida HTTP
app.use(cors());
app.use(express.json());

// --- Configuração dos Metadados Globais e Rotas do Swagger (OpenAPI 3.0) ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "API EduSTP - Sistema de Consulta Educacional de São Tomé e Príncipe",
            version: "1.0.0",
            description: "Serviço Web para o mapeamento e consulta do sistema educativo (ensino secundário e superior) de São Tomé e Príncipe.",
            contact: {
                name: "Admilson Fonseca"
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`,
                description: "Servidor de Desenvolvimento Local"
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "X-API-Key",
                    description: "Chave de segurança (API Key) obrigatória para validar o consumo dos recursos."
                }
            },
            schemas: {
                Instituicao: {
                    type: "object",
                    required: ["nome", "regiao", "tipo", "cursos"],
                    properties: {
                        id: { type: "string", description: "ID único gerado pelo MongoDB" },
                        nome: { type: "string", example: "USTP - Faculdade de Ciências e Tecnologias (FCT)" },
                        regiao: { 
                            type: "string", 
                            enum: ["Água Grande", "Mé-Zóchi", "Cantagalo", "Lobata", "Lembá", "Caué", "Região Autónoma do Príncipe"],
                            example: "Água Grande" 
                        },
                        tipo: { 
                            type: "string", 
                            enum: ["Ensino Superior", "Ensino Secundário", "Ensino Técnico / Profissional"],
                            example: "Ensino Superior" 
                        },
                        cursos: { 
                            type: "array", 
                            items: { type: "string" }, 
                            example: ["Engenharia Informática", "Ciências Biológicas", "Agronomia"] 
                        }
                    }
                },
                Erro: {
                    type: "object",
                    properties: {
                        erro: { type: "string", example: "Mensagem descritiva do erro ocorrido." }
                    }
                }
            }
        },
        security: [
            {
                ApiKeyAuth: []
            }
        ],
        paths: {
            "/api/instituicoes": {
                "get": {
                    "summary": "Listar todas as instituições ou pesquisar",
                    "description": "Retorna a lista completa de instituições de ensino de São Tomé e Príncipe. Permite fazer buscas por texto (nome/curso) ou filtrar por região.",
                    "parameters": [
                        {
                            "in": "query",
                            "name": "busca",
                            "schema": { "type": "string" },
                            "description": "Texto para pesquisar por nome da escola ou nome do curso."
                        },
                        {
                            "in": "query",
                            "name": "regiao",
                            "schema": { "type": "string" },
                            "description": "Filtro por distrito ou região exata (ex: Água Grande, Cantagalo, Príncipe)."
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Lista de instituições encontrada e retornada com sucesso.",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": { "$ref": "#/components/schemas/Instituicao" }
                                    }
                                }
                            }
                        },
                        "401": { "description": "Chave de API inválida ou ausente no cabeçalho X-API-Key." },
                        "500": { "description": "Erro interno ao tentar processar a consulta no banco de dados." }
                    }
                },
                "post": {
                    "summary": "Cadastrar uma nova instituição",
                    "description": "Adiciona uma nova escola ou universidade à base de dados do sistema EduSTP.",
                    "requestBody": {
                        "required": true,
                        "content": {
                            "application/json": {
                                "schema": { "$ref": "#/components/schemas/Instituicao" }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Instituição cadastrada e salva com sucesso.",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/Instituicao" }
                                }
                            }
                        },
                        "400": { "description": "Dados inválidos. Verifique se a região ou o tipo de ensino estão corretos." },
                        "401": { "description": "Chave de API inválida ou ausente no cabeçalho X-API-Key." }
                    }
                }
            },
            "/api/instituicoes/{id}": {
                "get": {
                    "summary": "Buscar uma instituição pelo ID",
                    "description": "Retorna os detalhes de uma escola ou universidade específica usando o ID gerado pelo banco de dados.",
                    "parameters": [
                        {
                            "in": "path",
                            "name": "id",
                            "required": true,
                            "schema": { "type": "string" },
                            "description": "ID único da instituição a ser procurada."
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Instituição encontrada com sucesso.",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/Instituicao" }
                                }
                            }
                        },
                        "401": { "description": "Chave de API inválida ou ausente (Não autorizado)." },
                        "404": { "description": "Nenhuma instituição foi encontrada com o ID informado." },
                        "500": { "description": "Erro interno ao tentar processar a requisição." }
                    }
                },
                "put": {
                    "summary": "Editar dados de uma instituição",
                    "description": "Atualiza as informações de uma instituição existente mapeada pelo seu ID.",
                    "parameters": [
                        {
                            "in": "path",
                            "name": "id",
                            "required": true,
                            "schema": { "type": "string" },
                            "description": "ID único da instituição que vai ser editada."
                        }
                    ],
                    "requestBody": {
                        "required": true,
                        "content": {
                            "application/json": {
                                "schema": { "$ref": "#/components/schemas/Instituicao" }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Dados da instituição atualizados com sucesso.",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/Instituicao" }
                                }
                            }
                        },
                        "400": { "description": "ID inválido ou dados enviados fora do padrão do sistema." },
                        "401": { "description": "Chave de API inválida ou ausente no cabeçalho X-API-Key." }
                    }
                },
                "delete": {
                    "summary": "Eliminar uma instituição",
                    "description": "Remove permanentemente uma escola ou universidade do sistema usando o ID.",
                    "parameters": [
                        {
                            "in": "path",
                            "name": "id",
                            "required": true,
                            "schema": { "type": "string" },
                            "description": "ID único da instituição que vai ser removida."
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Instituição removida com sucesso do sistema.",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "mensagem": { type: "string", example: "Instituição removida com sucesso da base de dados." }
                                        }
                                    }
                                }
                            }
                        },
                        "401": { "description": "Chave de API inválida ou ausente no cabeçalho X-API-Key." },
                        "500": { "description": "Erro interno ao tentar eliminar o registo." }
                    }
                }
            }
        }
    },
    apis: ["./server.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
// Rota UI dinâmica para renderizar o painel interativo da API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Conexão à Camada de Persistência (MongoDB Atlas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(' Conexão ao MongoDB estabelecida com sucesso!'))
  .catch(err => console.error(' Falha na inicialização da conexão ao MongoDB:', err));

// --- Definição do Esquema (Schema) com Validação por ENUMs ---
const InstituicaoSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    required: true,
    trim: true 
  },
  regiao: { 
    type: String, 
    required: true,
    enum: {
      values: ['Água Grande', 'Mé-Zóchi', 'Cantagalo', 'Lobata', 'Lembá', 'Caué', 'Região Autónoma do Príncipe'],
      message: '{VALUE} não é um distrito válido de São Tomé e Príncipe.'
    }
  },
  tipo: { 
    type: String, 
    required: true,
    enum: {
      values: ['Ensino Superior', 'Ensino Secundário', 'Ensino Técnico / Profissional'],
      message: '{VALUE} não corresponde aos tipos de ensino mapeados.'
    }
  },
  cursos: {
    type: [String],
    required: true
  }
});
const Instituicao = mongoose.model('Instituicao', InstituicaoSchema);

/**
 * Middleware de Segurança Perimetral
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

// Endpoint: Listagem Geral e Procura Filtrada
app.get('/api/instituicoes', verificarApiKey, async (req, res) => {
  try {
    const { busca, regiao } = req.query;
    let filtro = {};

    if (busca) {
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

// Endpoint: Persistência de Novas Entidades (Validada pelo Mongoose)
app.post('/api/instituicoes', verificarApiKey, async (req, res) => {
  try {
    const novaInstituicao = new Instituicao(req.body);
    await novaInstituicao.save();
    res.status(201).json(novaInstituicao);
  } catch (erro) {
    if (erro.name === 'ValidationError') {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(400).json({ erro: 'Dados de submissão inconsistentes com as restrições do modelo.' });
  }
});

// Endpoint: Atualização Integral ou Parcial de Registos
app.put('/api/instituicoes/:id', verificarApiKey, async (req, res) => {
  try {
    const updated = await Instituicao.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (erro) {
    if (erro.name === 'ValidationError') {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(400).json({ erro: 'Falha na mutação dos dados ou identificador inválido.' });
  }
});

// Endpoint: Supressão Crítica de Registos
app.delete('/api/instituicoes/:id', verificarApiKey, async (req, res) => {
  try {
    await Instituicao.findByIdAndDelete(req.params.id);
    res.json({ mensagem: 'Instituição removida com sucesso da base de dados.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro interno ao tentar remover o registo especificado.' });
  }
});

// Endpoint: Consulta Singular por Identificador Único
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
app.listen(PORT, () => console.log(` Serviço HTTP ativo e operacional na porta ${PORT}`));