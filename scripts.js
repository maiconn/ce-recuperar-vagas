function getJob() {
    const getLinkedin = () => {
        // DESCRIÃ‡ÃƒO VAGA 
        const vaga = document.querySelectorAll('.t-24.job-details-jobs-unified-top-card__job-title > h1:first-child')[0].innerText;

        // TIPO DE VAGA (REMOTO PRESENCIAL E TAL...)
        let tipoVaga = ""
        try {
            tipoVaga = document.querySelectorAll('.ui-label.ui-label--accent-3.text-body-small > span:first-child')[0].innerText;
        } catch {
            tipoVaga = "Presencial"
        }

        let cidade = '';
        let estado = '';
        if (tipoVaga != 'Remoto') {
            // LOCALIZAÃ‡ÃƒO
            const localizacao = document.querySelectorAll('.t-black--light.mt2 > span:first-child')[0].innerText;
            const localizacaoSeparada = localizacao.split(',');
            cidade = localizacaoSeparada[0];
            estado = localizacaoSeparada[1] == undefined ? "" : localizacaoSeparada[1];
        }

        // EMPRESA
        const empresa = document.querySelectorAll('.job-details-jobs-unified-top-card__company-name > a:first-child')[0].innerText;

        return { vaga, tipoVaga, cidade, estado, empresa };
    };

    const getRemotar = () => {
        // DESCRIÇÃO VAGA 
        const vaga = document.querySelectorAll('.job-title')[0].innerText;

        // EMPRESA
        const empresa = document.querySelectorAll('.css-1bjnam8 > a > p')[0].innerText;

        const tipoVaga = "Remoto";
        const cidade = '';
        const estado = '';

        return { vaga, tipoVaga, cidade, estado, empresa };
    };

    const getTelegramJornada = () => {
        // DESCRIÇÃO VAGA 
        const bodyIframe = document.getElementsByTagName('iframe')[0].contentWindow.document.body;
        console.log(bodyIframe.querySelectorAll('.tgme_widget_message_text.js-message_text > i'))
        const vaga = bodyIframe.querySelectorAll('.tgme_widget_message_text.js-message_text > i')[3].innerHTML.replaceAll(": ", "");

        // EMPRESA
        const empresa = bodyIframe.querySelectorAll('.tgme_widget_message_text.js-message_text > i')[5].innerHTML.replaceAll(": ", "");

        let cidade = bodyIframe.querySelectorAll('.tgme_widget_message_text.js-message_text > i')[7].innerHTML.replaceAll(": ", "").trim();
        let tipoVaga = '';
        let estado = '';
        if (cidade == 'Remoto') {
            tipoVaga = "Remoto"
            cidade = "";
        } else {
            tipoVaga = 'Presencial/Híbrido';
            const localizacaoSeparada = cidade.split(',');
            cidade = localizacaoSeparada[0];
            estado = localizacaoSeparada[1] == undefined ? "" : localizacaoSeparada[1];
        } 

        return { vaga, tipoVaga, cidade, estado, empresa, };
    };

    const linkPagina = window.location.href;
    let retorno = {};
    if (linkPagina.includes("linkedin.com")) {
        retorno = getLinkedin();
    } else if (linkPagina.includes("t.me/jornadati")) {
        retorno = getTelegramJornada();
    } else {
        retorno = getRemotar();
    }
    retorno.linkPagina = linkPagina;
    return retorno;
};

let retornoVaga = {};

function showJob(retorno) {
    retornoVaga = retorno;
    const textoParaOTelegram = `Titulo: ${retorno.vaga}
Empresa: ${retorno.empresa}
Local: ${retorno.tipoVaga} ${retorno.cidade} ${retorno.estado}

Link para a vaga ${retorno.linkPagina}`;

    const txtTelegram = document.getElementById("txtTelegram");
    txtTelegram.classList.remove("hidden");
    txtTelegram.classList.add("show");
    txtTelegram.value = textoParaOTelegram;

    const btnSendTelegram = document.getElementById("btnSendTelegram");
    btnSendTelegram.classList.remove("hidden");
    btnSendTelegram.classList.add("show");

    mostrarParaPostarNaPlanilha('')
}

document.getElementById("getJob").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];  
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getJob,
        }).then((textos) => showJob(textos[0].result));
    });
});

document.getElementById("btnSendTelegram").addEventListener("click",  () => {
    const txtTelegram = document.getElementById("txtTelegram").value;

    const BOT_TOKEN = ENV.BOT_TOKEN;
    const CHAT_ID =  ENV.CHAT_ID;
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
    })
    .catch(error => {
        console.error('Error sending message:', error);
    });
});

function mostrarParaPostarNaPlanilha(url){
    const textoParaPlanilha = `${url == '' ? '' : url + "\t"}${retornoVaga.vaga}\t\t${retornoVaga.cidade}\t${retornoVaga.estado}\t${retornoVaga.empresa}\n\n`
    const txtPlanilha = document.getElementById("txtPlanilha");
    txtPlanilha.classList.remove("hidden");
    txtPlanilha.classList.add("show");
    txtPlanilha.value = textoParaPlanilha;
}