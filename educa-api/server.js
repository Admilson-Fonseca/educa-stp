/**
 * @file server.js
 * @description Ponto de entrada da API RESTful para o sistema EduSTP com documentação Swagger.
 * @course Web Services - Engenharia Informática
 * @author Admilson Fonseca
 */

const express = require("express"); 
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); 

// --- Configuração da Documentação do Swagger ---
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const app = express();

// Configuração de Middlewares Globais
app.use(cors());
app.use(express.json());

// --- Configuração das Informações Gerais do Swagger (OpenAPI 3.0) ---
// No meu server.js, localiza as swaggerOptions:
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title:
        "API EduSTP - Sistema de Consulta Educacional de São Tomé e Príncipe",
      version: "1.0.0",
      description:
        "Serviço Web para mapeamento e consulta do sistema de ensino...",
      contact: {
        name: "Admilson Fonseca",
      },
    },
    servers: [
      {
        url: "https://educa-stp.onrender.com",
        description: "Servidor de Produção (Render)",
      },
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Servidor de Desenvolvimento Local",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description:
            "Chave de segurança obrigatória para autorizar o consumo dos recursos da API.",
        },
      },
      schemas: {
        Instituicao: {
          type: "object",
          required: ["nome", "regiao", "tipo", "cursos"],
          properties: {
            id: {
              type: "string",
              description: "ID único gerado automaticamente pelo MongoDB",
            },
            nome: {
              type: "string",
              example: "USTP - Faculdade de Ciências e Tecnologias (FCT)",
            },
            regiao: {
              type: "string",
              enum: [
                "Água Grande",
                "Mé-Zóchi",
                "Cantagalo",
                "Lobata",
                "Lembá",
                "Caué",
                "Região Autónoma do Príncipe",
              ],
              example: "Água Grande",
            },
            tipo: {
              type: "string",
              enum: [
                "Ensino Superior",
                "Ensino Secundário",
                "Ensino Técnico / Profissional",
              ],
              example: "Ensino Superior",
            },
            cursos: {
              type: "array",
              items: { type: "string" },
              example: [
                "Engenharia Informática",
                "Ciências Biológicas",
                "Agronomia",
              ],
            },
          },
        },
        Erro: {
          type: "object",
          properties: {
            erro: {
              type: "string",
              example: "Mensagem descritiva do erro que ocorreu.",
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      "/api/instituicoes": {
        get: {
          summary: "Listar todas as instituições ou pesquisar",
          description:
            "Retorna a lista completa de instituições de ensino cadastradas em São Tomé e Príncipe. Permite fazer pesquisas por texto ou filtrar por região.",
          parameters: [
            {
              in: "query",
              name: "busca",
              schema: { type: "string" },
              description:
                "Texto livre para pesquisar pelo nome da escola ou pelos cursos.",
            },
            {
              in: "query",
              name: "regiao",
              schema: { type: "string" },
              description:
                "Filtro pelo distrito ou região de STP (ex: Água Grande, Cantagalo, Príncipe).",
            },
          ],
          responses: {
            200: {
              description: "Lista de instituições retornada com sucesso.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Instituicao" },
                  },
                },
              },
            },
            401: {
              description:
                "Chave de API inválida ou ausente no cabeçalho X-API-Key.",
            },
            500: {
              description: "Erro interno ao tentar aceder ao banco de dados.",
            },
          },
        },
        post: {
          summary: "Adicionar uma nova instituição",
          description:
            "Insere uma nova escola ou universidade no banco de dados do sistema.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Instituicao" },
              },
            },
          },
          responses: {
            201: {
              description: "Instituição gravada com sucesso.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Instituicao" },
                },
              },
            },
            400: {
              description:
                "Dados inválidos. Verifique as regras de validação do modelo.",
            },
            401: {
              description:
                "Chave de API inválida ou ausente no cabeçalho X-API-Key.",
            },
          },
        },
      },
      "/api/instituicoes/{id}": {
        get: {
          summary: "Procurar uma instituição pelo ID",
          description:
            "Retorna as informações detalhadas de uma única instituição com base no ID fornecido na URL.",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
              description:
                "ID exclusivo da instituição que pretende encontrar.",
            },
          ],
          responses: {
            200: {
              description: "Instituição encontrada com sucesso.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Instituicao" },
                },
              },
            },
            401: {
              description:
                "Chave de API inválida ou ausente no cabeçalho X-API-Key.",
            },
            404: {
              description: "Nenhuma instituição encontrada com o ID fornecido.",
            },
            500: {
              description: "Erro interno do servidor ao processar o pedido.",
            },
          },
        },
        put: {
          summary: "Atualizar dados de uma instituição",
          description:
            "Modifica os dados de uma instituição de ensino já existente usando o seu ID.",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
              description: "ID da instituição que vai ser atualizada.",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Instituicao" },
              },
            },
          },
          responses: {
            200: {
              description: "Instituição atualizada com sucesso.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Instituicao" },
                },
              },
            },
            400: {
              description:
                "ID em formato errado ou erro de validação nos campos modificados.",
            },
            401: {
              description:
                "Chave de API inválida ou ausente no cabeçalho X-API-Key.",
            },
          },
        },
        delete: {
          summary: "Remover uma instituição",
          description:
            "Apaga de forma permanente uma instituição do banco de dados através do seu ID.",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
              description: "ID da instituição que deseja apagar.",
            },
          ],
          responses: {
            200: {
              description: "Registo removido com sucesso.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      mensagem: {
                        type: "string",
                        example:
                          "Instituição removida com sucesso da base de dados.",
                      },
                    },
                  },
                },
              },
            },
            401: {
              description:
                "Chave de API inválida ou ausente no cabeçalho X-API-Key.",
            },
            500: {
              description: "Erro interno ao tentar remover a instituição.",
            },
          },
        },
      },
    },
  },
  apis: ["./server.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
// Configuração da rota para a interface visual do Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Conexão ao banco de dados (MongoDB Atlas na nuvem)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" Conexão ao MongoDB estabelecida com sucesso!"))
  .catch((err) => console.error(" Falha ao ligar ao MongoDB:", err));

// --- Criação do Modelo (Schema) com Validações ---
const InstituicaoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  regiao: {
    type: String,
    required: true,
    enum: {
      values: [
        "Água Grande",
        "Mé-Zóchi",
        "Cantagalo",
        "Lobata",
        "Lembá",
        "Caué",
        "Região Autónoma do Príncipe",
      ],
      message: "{VALUE} não é um distrito válido de São Tomé e Príncipe.",
    },
  },
  tipo: {
    type: String,
    required: true,
    enum: {
      values: [
        "Ensino Superior",
        "Ensino Secundário",
        "Ensino Técnico / Profissional",
      ],
      message: "{VALUE} não corresponde aos tipos de ensino mapeados.",
    },
  },
  cursos: {
    type: [String],
    required: true,
  },
});
const Instituicao = mongoose.model("Instituicao", InstituicaoSchema);

/**
 * Middleware para Verificação da API Key
 */
const verificarApiKey = (req, res, next) => {
  const chaveCliente = req.header("X-API-Key");

  if (!chaveCliente || chaveCliente !== process.env.API_KEY) {
    return res
      .status(401)
      .json({ erro: "Acesso negado. Chave de API inválida ou ausente." });
  }
  next();
};

// ==========================================
// ROTAS DO CONTROLADOR DA API (CRUD)
// ==========================================

// Rota: Listar e Filtrar Instituições
app.get("/api/instituicoes", verificarApiKey, async (req, res) => {
  try {
    const { busca, regiao } = req.query;
    let filtro = {};

    if (busca) {
      filtro.$or = [
        { nome: { $regex: busca, $options: "i" } },
        { cursos: { $regex: busca, $options: "i" } },
      ];
    }
    if (regiao) {
      filtro.regiao = regiao;
    }

    const resultados = await Instituicao.find(filtro);
    res.json(resultados);
  } catch (erro) {
    res.status(500).json({ erro: "Erro interno ao processar a pesquisa." });
  }
});

// Rota: Criar Nova Instituição (Protegida contra Duplicações)
app.post("/api/instituicoes", verificarApiKey, async (req, res) => {
  try {
    const { nome } = req.body;

    // Verifica se já existe uma instituição com o mesmo nome (ignorando maiúsculas/minúsculas)
    const instituicaoExistente = await Instituicao.findOne({
      nome: { $regex: `^${nome}$`, $options: "i" },
    });
    if (instituicaoExistente) {
      return res.status(400).json({
        erro: "Esta instituição já se encontra registada no sistema.",
      });
    }

    const novaInstituicao = new Instituicao(req.body);
    await novaInstituicao.save();
    res.status(201).json(novaInstituicao);
  } catch (erro) {
    if (erro.name === "ValidationError") {
      return res.status(400).json({ erro: erro.message });
    }
    res
      .status(400)
      .json({ erro: "Dados enviados não respeitam o formato exigido." });
  }
});

// Rota: Editar Instituição Existente
app.put("/api/instituicoes/:id", verificarApiKey, async (req, res) => {
  try {
    const updated = await Instituicao.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    res.json(updated);
  } catch (erro) {
    if (erro.name === "ValidationError") {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(400).json({
      erro: "Não foi possível atualizar. Verifique os dados ou o ID.",
    });
  }
});

// Rota: Excluir uma Instituição
app.delete("/api/instituicoes/:id", verificarApiKey, async (req, res) => {
  try {
    await Instituicao.findByIdAndDelete(req.params.id);
    res.json({
      mensagem: "Instituição removida com sucesso da base de dados.",
    });
  } catch (erro) {
    res
      .status(500)
      .json({ erro: "Erro interno ao tentar remover a instituição." });
  }
});

// Rota: Buscar uma única instituição por ID
app.get("/api/instituicoes/:id", verificarApiKey, async (req, res) => {
  try {
    const instituicao = await Instituicao.findById(req.params.id);
    if (!instituicao)
      return res
        .status(404)
        .json({ erro: "A instituição solicitada não foi encontrada." });
    res.json(instituicao);
  } catch (erro) {
    res.status(500).json({ erro: "Erro interno ao procurar a instituição." });
  }
});

// Inicialização do Servidor Express
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(` Servidor ativo e a correr na porta ${PORT}`),
);
