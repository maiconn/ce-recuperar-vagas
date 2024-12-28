const express = require('express');
const fetch = require('node-fetch');
const config = require("./config.js");
const app = express();

// Middleware para processar JSON no body da requisição
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permitir qualquer origem
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const estadosBrasil = {
    "Acre": "AC",
    "Alagoas": "AL",
    "Amapa": "AP",
    "Amazonas": "AM",
    "Bahia": "BA",
    "Ceara": "CE",
    "Distrito Federal": "DF",
    "Espirito Santo": "ES",
    "Goias": "GO",
    "Maranhao": "MA",
    "Mato Grosso": "MT",
    "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG",
    "Para": "PA",
    "Paraiba": "PB",
    "Parana": "PR",
    "Pernambuco": "PE",
    "Piaui": "PI",
    "Rio de Janeiro": "RJ",
    "Rio Grande do Norte": "RN",
    "Rio Grande do Sul": "RS",
    "Rondonia": "RO",
    "Roraima": "RR",
    "Santa Catarina": "SC",
    "Sao Paulo": "SP",
    "Sergipe": "SE",
    "Tocantins": "TO"
  };
  
  const removerAcentos = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const estadoParaSigla = (estado) => {
    if (estado === '' || estado.length === 2) {
        return estado;
    }
    const estadoSemAcentos = removerAcentos(estado).toLowerCase().trim();
    const resultado = Object.keys(estadosBrasil).find(
      (nome) => removerAcentos(nome).toLowerCase() === estadoSemAcentos
    );
    return resultado ? estadosBrasil[resultado] : null; // Retorna null se não encontrar
  };

app.post('/notion-proxy', async (req, res) => {
    try {
        // Acessa os dados enviados no body
        const { vaga, tipoTrabalho, cidade, estado, empresa, linkPagina, tipoVaga } = req.body;
        const DATABASE_ID = '10ee5040cf75802b96aedd44775018b0'; // Substitua pelo ID do banco de dados

        
        // Faz uma requisição POST para a API do Notion com os dados recebidos
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                parent: {
                    database_id: DATABASE_ID // Substitua pelo ID da sua base de dados
                },
                "properties": {
                    "Cidade": {
                        "type": "rich_text",
                        "rich_text": [
                            {
                                "text": {
                                    "content": cidade
                                },
                                "plain_text": cidade
                            }
                        ]
                    },
                    "Estado": {
                        "type": "rich_text",
                        "rich_text": [
                            {
                                "text": {
                                    "content": estadoParaSigla(estado)
                                },
                                "plain_text": estadoParaSigla(estado)
                            }
                        ]
                    },
                    "Link de Acesso": {
                        "type": "url",
                        "url": linkPagina
                    },
                    "Tipo": {
                        "type": "select",
                        "select": {
                            "name": tipoVaga
                        }
                    },
                    "Data de Publicação": {
                        "type": "date",
                        "date": {
                            "start": new Date().toISOString().split('T')[0]
                        }
                    },
                    "Empresa": {
                        "type": "rich_text",
                        "rich_text": [
                            {
                                "text": {
                                    "content": empresa
                                },
                                "plain_text": empresa
                            }
                        ]
                    },
                    "Descrição": {
                        "type": "title",
                        "title": [
                            {
                                "type": "text",
                                "text": {
                                    "content": vaga
                                },
                                "plain_text": vaga
                            }
                        ]
                    }
                }
            })
        });

        const data = await response.json();
        res.json(data); // Retorna a resposta da API do Notion para o cliente
    } catch (error) {
        console.error('Erro ao criar página no Notion:', error);
        res.status(500).json({ error: 'Failed to create page in Notion' });
    }
});

app.listen(3000, () => console.log('Proxy server running on http://localhost:3000'));