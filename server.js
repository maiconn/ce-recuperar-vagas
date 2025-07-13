const express = require('express');
const fetch = require('node-fetch');
const app = express();
require("dotenv").config();

// Middleware para processar JSON no body da requisição
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permitir qualquer origem
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

async function enviarNewsletter(idInicial) {
    const url = `${process.env.URL_JORNADA}/buscar_emails.php`;
  
    try {
      const resposta = await fetch(url);
      const json = await resposta.json();

      if (idInicial) {
        json.emails = json.emails.filter(item => item.id >= idInicial);
      }
  
      if (!json.emails || json.emails.length === 0) {
        console.log('Nenhum e-mail ativo encontrado.');
        return;
      }

      console.log(`Encontrados ${json.emails.length} e-mails. Iniciando envio...`);

      const htmlEnviar = await recuperarEmailNewsletterHtml();

      const total = json.emails.length;
      let processados = 0;
  
      const resultado = [];
      for (const item of json.emails) {
          //const retornoEnvio = await enviarEmailPorIdHostinger(item.id);
        const htmlFinal = htmlEnviar.replace("{{EMAIL}}", item.email);
        const retornoEnvio = await enviarEmailMicrosoft(item.email, htmlFinal);

        processados++;
        const porcentagem = ((processados / total) * 100).toFixed(2);
        console.log(`[(${processados}/${total})${porcentagem}%] Resultado do envio para ID ${item.id}:`, retornoEnvio);
        if (!retornoEnvio.sucesso){
          resultado.push({item, retorno:retornoEnvio.retorno});
        }
      }
  
      console.log('Processo de envio finalizado.');
      return resultado;
    } catch (erro) {
      console.error('Erro ao buscar e-mails:', erro);
    }
}
  
async function recuperarEmailNewsletterHtml() {
  const respostaTemplate = await fetch(`${process.env.URL_JORNADA}/ver_vagas_dia_email.php`, {
    method: 'GET',
  });
  return await respostaTemplate.text();
}

async function enviarEmailPorIdHostinger(id) {
    try {
      const resposta = await fetch(`${process.env.URL_JORNADA}/enviar_email_newsletter.php?id=${id}`, {
        method: 'GET',
      });
  
      const resultado = await resposta.json();
      return resultado;
    } catch (erro) {
      console.error(`Erro ao enviar e-mail para ID ${id}:`, erro);
    }
}

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
    return resultado ? estadosBrasil[resultado] : ''; // Retorna null se não encontrar
};

app.post('/notion-proxy', async (req, res) => {
    try {
        const novoObj = {...req.body};
        novoObj.estado = estadoParaSigla(req.body.estado)
        console.log(JSON.stringify(novoObj))
        const responseJornada = await fetch(`${process.env.URL_JORNADA}/inserir_vagas.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoObj),
        });

        
        const status = responseJornada.status; 
        const dataJornada = await responseJornada.json(); 

        if (!responseJornada.ok) {
            console.error(`Erro ${status}:`, dataJornada.mensagem || 'Erro ao cadastrar');
        } else {
            console.log('Sucesso:', dataJornada.mensagem);
        }

        res.json(dataJornada.mensagem); // Retorna a resposta da API do Notion para o cliente
    } catch (error) {
        console.error('Erro ao criar página no Notion:', error);
        res.status(500).json({ error: 'Failed to create page in Notion' });
    }
});

app.get('/enviar-news', async (req, res) => { 
    const idInicial = req.query.idInicial;
    const retorno = await enviarNewsletter(idInicial);
    res.json(retorno);
});

require("isomorphic-fetch");
const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");

// Autenticação com client_credentials
const credential = new ClientSecretCredential(
  process.env.TENANT_ID,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

// Criação do client do Microsoft Graph
const graphClient = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const tokenResponse = await credential.getToken("https://graph.microsoft.com/.default");
      return tokenResponse.token;
    },
  },
});

app.get('/enviar-email-especifico', async (req, res) => { 
  const email = req.query.email;
  const htmlEnviar = await recuperarEmailNewsletterHtml();
  const htmlFinal = htmlEnviar.replace("{{EMAIL}}", email);
  const retornoEnvio = await enviarEmailMicrosoft(email, htmlFinal);
  res.json(retornoEnvio);
});

async function enviarEmailMicrosoft(email, conteudoHtml) {
  try {
    const message = {
      subject: "🎯 Confira as novas vagas de hoje",
      body: {
        contentType: "HTML",
        content: conteudoHtml,
      },
      toRecipients: [
        {
          emailAddress: {
            address: email,
          },
        },
      ],
    };

    await graphClient
      .api(`/users/${process.env.FROM_EMAIL}/sendMail`)
      .post({ message });
    const mensagemSucesso = "✅ E-mail enviado para => " + email;
    console.log(mensagemSucesso);
    return { 
      retorno: mensagemSucesso, 
      sucesso: true 
    };
  } catch (error) {
    console.error("❌ Erro ao enviar o email:", error.message);
    if (error.body) console.error("Detalhes:", error.body);
    return { 
      retorno: error,
      sucesso: false 
    };
  }
}

app.listen(3000, () => console.log('Proxy server running on http://localhost:3000'));