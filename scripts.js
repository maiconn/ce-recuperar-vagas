function show(id) {
    const componente = document.getElementById(id);
    componente.classList.remove("hidden");
    componente.classList.add("show");
}

function hide(id) {
    const componente = document.getElementById(id);
    componente.classList.remove("show");
    componente.classList.add("hidden");
}

function showSnackbar(texto, tempoEmMilissegundos) {
    // Get the snackbar DIV
    const snackbar = document.getElementById("snackbar");
    snackbar.innerHTML = texto;
  
    // Add the "show" class to DIV
    snackbar.className = "show";
  
    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, tempoEmMilissegundos);
}

function mostrarParaPostarNaPlanilha(url) {
    const textoParaPlanilha = `${url == '' ? '' : url + "\t"}${retornoVaga.vaga}\t${retornoVaga.tipoVaga}\t${retornoVaga.cidade}\t${retornoVaga.estado}\t${retornoVaga.empresa}\n\n`
    const txtPlanilha = document.getElementById("txtPlanilha");
    txtPlanilha.value = textoParaPlanilha;
}

function getJob() {
    const getLinkedin = () => {
        // DESCRIÃ‡ÃƒO VAGA 
        const vaga = document.querySelectorAll('.t-24.job-details-jobs-unified-top-card__job-title > h1:first-child')[0].innerText;

        // TIPO DE TRABALHO (REMOTO PRESENCIAL E TAL...)
        let tipoTrabalho = ""
        try {
            tipoTrabalho = document.querySelectorAll('.ui-label.ui-label--accent-3.text-body-small > span:first-child')[0].innerText;
        } catch {
            tipoTrabalho = "Presencial"
        }

        let cidade = '';
        let estado = '';
        if (tipoTrabalho != 'Remoto') {
            // LOCALIZAÃ‡ÃƒO
            const localizacao = document.querySelectorAll('.t-black--light.mt2 > span:first-child')[0].innerText;
            const localizacaoSeparada = localizacao.split(',');
            cidade = localizacaoSeparada[0];
            estado = localizacaoSeparada[1] == undefined ? "" : localizacaoSeparada[1];
        }

        // EMPRESA
        let empresa = '';
        try{
            empresa = document.querySelectorAll('.job-details-jobs-unified-top-card__company-name > a:first-child')[0].innerText;
        } catch {
            empresa = document.querySelectorAll('.job-details-jobs-unified-top-card__company-name')[0].innerText;
        }
        

        return { vaga, tipoTrabalho, cidade, estado, empresa };
    };

    const getRemotar = () => {
        // DESCRIÇÃO VAGA 
        const vaga = document.querySelectorAll('.job-title')[0].innerText;

        // EMPRESA
        const empresa = document.querySelectorAll('.css-1bjnam8 > a > p')[0].innerText;

        const tipoTrabalho = "Remoto";
        const cidade = '';
        const estado = '';

        return { vaga, tipoTrabalho, cidade, estado, empresa };
    };

    const getTelegramJornada = () => {
        // DESCRIÇÃO VAGA 
        const bodyIframe = document.getElementsByTagName('iframe')[0].contentWindow.document.body;
        console.log(bodyIframe.querySelectorAll('.tgme_widget_message_text.js-message_text > i'))
        const vaga = bodyIframe.querySelectorAll('.tgme_widget_message_text.js-message_text > i')[3].innerHTML.replaceAll(": ", "");

        // EMPRESA
        const empresa = bodyIframe.querySelectorAll('.tgme_widget_message_text.js-message_text > i')[5].innerHTML.replaceAll(": ", "");

        let cidade = bodyIframe.querySelectorAll('.tgme_widget_message_text.js-message_text > i')[7].innerHTML.replaceAll(": ", "").trim();
        let tipoTrabalho = '';
        let estado = '';
        if (cidade == 'Remoto') {
            tipoTrabalho = "Remoto"
            cidade = "";
        } else {
            tipoTrabalho = 'Presencial/Híbrido';
            const localizacaoSeparada = cidade.split(',');
            cidade = localizacaoSeparada[0];
            estado = localizacaoSeparada[1] == undefined ? "" : localizacaoSeparada[1];
        }

        return { vaga, tipoTrabalho, cidade, estado, empresa, };
    };

    const getEmpty = () => {
        const vaga = '';
        const tipoTrabalho = '';
        const cidade = '';
        const estado = '';
        const empresa = '';
        const tipoVaga = '';

        return { vaga, tipoTrabalho, cidade, estado, empresa, tipoVaga };
    };

    const linkPagina = window.location.href;
    let retorno = getEmpty();
    if (linkPagina.includes("linkedin.com")) {
        retorno = getLinkedin();
    } else if (linkPagina.includes("t.me/jornadati")) {
        retorno = getTelegramJornada();
    } else if (linkPagina.includes("remotar.com.br")) {
        retorno = getRemotar();
    }

    retorno.linkPagina = linkPagina;
    retorno.tipoVaga = '';
    return retorno;
};

let retornoVaga = {};

function showJob(retorno, esconderMontar) {
    retornoVaga = retorno;
    if (retorno.vaga == '') {
        show('camposMontarJob');
    } else if (retornoVaga.tipoVaga != '') {
        prepararParaPostarTelegram();
        if (esconderMontar) {
            hide('camposMontarJob');
        }
    }
}

document.getElementById("btnSendTelegram").addEventListener("click", () => {
    const txtTelegram = document.getElementById("txtTelegram").value;

    const BOT_TOKEN = ENV.BOT_TOKEN;
    const CHAT_ID = ENV.CHAT_ID;
    const TOPIC = ENV.TOPIC;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const data = {
        chat_id: CHAT_ID,
        message_thread_id: TOPIC,
        text: txtTelegram,
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Message sent successfully:', data);
            const message_thread_id = data.result.message_thread_id;
            const message_id = data.result.message_id;
            const urlTelegram = `https://t.me/jornadati/${message_thread_id}/${message_id}`;

            mostrarParaPostarNaPlanilha(urlTelegram);
            showSnackbar("Mensagem enviada com sucesso ao Telegram!", 2000);
        })
        .catch(error => {
            console.error('Error sending message:', error);
        });
});



function prepararParaPostarTelegram() {
    const textoParaOTelegram = `Titulo: ${retornoVaga.vaga}
Empresa: ${retornoVaga.empresa}
Local: ${retornoVaga.tipoTrabalho} ${retornoVaga.cidade} ${retornoVaga.estado}
Tipo De Vaga: ${retornoVaga.tipoVaga}

Link para a vaga ${retornoVaga.linkPagina}`;

    const txtTelegram = document.getElementById("txtTelegram");
    txtTelegram.value = textoParaOTelegram;

    show('dadosEnviar');

    mostrarParaPostarNaPlanilha(retornoVaga.linkPagina);
}

document.getElementById("txtPlanilha").addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("txtPlanilha").value)
        .then(() => showSnackbar("Texto copiado com sucesso!", 1000))
        .catch((err) => console.error("Erro ao copiar texto: ", err));
});

document.getElementById("btnMontarJob").addEventListener("click", () => {
    const tipoVaga = document.getElementById("tipoVaga").value;
    const vaga = document.getElementById("txtTitulo").value;
    const tipoTrabalho = document.getElementById("tipoTrabalho").value;
    const cidade = document.getElementById("cidade").value;
    let estado = cidade == '' ? '' : document.getElementById("estado").value;
    const empresa = document.getElementById("txtEmpresa").value;
    const linkPagina = document.getElementById("txtLink").value;

    const retorno = { vaga, tipoTrabalho, cidade, estado, empresa, linkPagina, tipoVaga };
    showJob(retorno, false);
});

document.getElementById('tipoVaga').addEventListener('change', function (event) {
    const selectedValue = event.target.value;
    retornoVaga.tipoVaga = selectedValue;
    showJob(retornoVaga, false);
});

async function fetchEstados() {
    try {
        const estadoSelect = document.getElementById('estado');
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        const estados = await response.json();
        estados.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena por nome

        estados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.sigla;
            option.textContent = estado.nome;
            estadoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar estados:', error);
    }
}

// Função para buscar cidades de um estado
async function fetchCidades(estadoSigla) {
    try {

        const cidadeSelect = document.getElementById('cidade');
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSigla}/municipios`);
        const cidades = await response.json();
        cidades.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena por nome

        cidadeSelect.innerHTML = '<option value="">Selecione uma cidade</option>'; // Reseta as opções

        cidades.forEach(cidade => {
            const option = document.createElement('option');
            option.value = cidade.nome;
            option.textContent = cidade.nome;
            cidadeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar cidades:', error);
    }
}

document.getElementById('estado').addEventListener('change', () => {
    const cidadeSelect = document.getElementById('cidade');
    const estadoSelect = document.getElementById('estado');
    const estadoSigla = estadoSelect.value;
    if (estadoSigla) {
        fetchCidades(estadoSigla);
    } else {
        cidadeSelect.innerHTML = '<option value="">Selecione uma cidade</option>';
    }
});

window.onload = function () {
    // Carrega os estados ao carregar a página
    fetchEstados();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getJob,
        }).then((textos) => showJob(textos[0].result, true));
    });
};