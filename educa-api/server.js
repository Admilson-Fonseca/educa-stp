/**
 * @file server.js
 * @description Ponto de entrada da API RESTful para o ecossistema EduSTP com documentação Swagger.
 * @course Web Services - Engenharia Informática
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
                name: "Admilson Bragança"
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
                    "summary": "Listagem Geral e Procura Filtrada",
                    "description": "Obtém a coleção completa de instituições de ensino de São Tomé e Príncipe, permitindo filtragem opcional por texto parcial (nome/cursos) ou região administrativa.",
                    "parameters": [
                        {
                            "in": "query",
                            "name": "busca",
                            "schema": { "type": "string" },
                            "description": "Expressão de busca para filtrar por nome da escola ou curso (case-insensitive)."
                        },
                        {
                            "in": "query",
                            "name": "regiao",
                            "schema": { "type": "string" },
                            "description": "Região exata de STP (ex. Água Grande, Mé-Zóchi, Príncipe)."
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Vetor de dados com as instituições localizadas retornado com sucesso.",
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
                        "500": { "description": "Erro interno no processamento ou varredura do banco de dados." }
                    }
                },
                "post": {
                    "summary": "Persistência de Novas Entidades",
                    "description": "Cadastra uma nova instituição de ensino na base de dados centralizada do sistema EduSTP.",
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
                            "description": "Instituição registada e persistida com sucesso.",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/Instituicao" }
                                }
                            }
                        },
                        "400": { "description": "Dados fornecidos inválidos ou em incumprimento com os Enums geográficos/académicos." },
                        "401": { "description": "Falha na autenticação via cabeçalho." }
                    }
                }
            },
            "/api/instituicoes/{id}": {
                "get": {
                    "summary": "Consulta Singular por Identificador Único",
                    "description": "Localiza e retorna o objeto descritivo de uma única instituição com base no ID fornecido no caminho do URL.",
                    "parameters": [
                        {
                            "in": "path",
                            "name": "id",
                            "required": true,
                            "schema": { "type": "string" },
                            "description": "ID da instituição a procurar."
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Recurso localizado e extraído com sucesso.",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/Instituicao" }
                                }
                            }
                        },
                        "401": { "description": "Autenticação perimetral falhou." },
                        "404": { "description": "Nenhum documento correspondente ao ID fornecido foi encontrado." },
                        "500": { "description": "Erro inesperado na extração dos dados pelo ID." }
                    }
                },
                "put": {
                    "summary": "Atualização Integral ou Parcial de Registos",
                    "description": "Atualiza os metadados estruturais de uma instituição existente mapeada através do seu ID único (ObjectId).",
                    "parameters": [
                        {
                            "in": "path",
                            "name": "id",
                            "required": true,
                            "schema": { "type": "string" },
                            "description": "ID único do documento gerado no MongoDB."
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
                            "description": "Documento atualizado com sucesso retornando os novos dados.",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/Instituicao" }
                                }
                            }
                        },
                        "400": { "description": "Identificador malformado ou erro de validação nos campos alterados." },
                        "401": { "description": "Cabeçalho de autorização inválido." }
                    }
                },
                "delete": {
                    "summary": "Supressão Crítica de Registos",
                    "description": "Remove permanentemente uma instituição do ecossistema a partir do seu ID único recebido como parâmetro de rota.",
                    "parameters": [
                        {
                            "in": "path",
                            "name": "id",
                            "required": true,
                            "schema": { "type": "string" },
                            "description": "ID correspondente ao documento a ser eliminado."
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Registo expurgado com sucesso.",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "mensagem": { "type": "string", "example": "Entidade removida com sucesso da base de dados." }
                                        }
                                    }
                                }
                            }
                        },
                        "401": { "description": "Credencial X-API-Key ausente ou inválida." },
                        "500": { "description": "Exceção na base de dados ao tentar excluir o registo." }
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
    // Se falhar a validação do Enum, devolvemos o erro descritivo ao cliente
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
    res.json({ mensagem: 'Entidade removida com sucesso da base de dados.' });
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