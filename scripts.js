function getJob() {
    const getLinkedin = () => {
        // DESCRIÇÃO VAGA 
        const vaga = document.querySelectorAll('.t-24.job-details-jobs-unified-top-card__job-title > h1:first-child')[0].innerText;

        // TIPO DE VAGA (REMOTO PRESENCIAL E TAL...)
        const tipoVaga = document.querySelectorAll('.ui-label.ui-label--accent-3.text-body-small > span:first-child')[0].innerText;

        let cidade = '';
        let estado = '';
        if (tipoVaga != 'Remoto') {
            // LOCALIZAÇÃO
            const localizacao = document.querySelectorAll('.t-black--light.mt2 > span:first-child')[0].innerText;
            const localizacaoSeparada = localizacao.split(',');
            cidade = localizacaoSeparada[0];
            estado = localizacaoSeparada[1];
        }

        // EMPRESA
        const empresa = document.querySelectorAll('.job-details-jobs-unified-top-card__company-name > a:first-child')[0].innerText;

        return { vaga, tipoVaga, cidade, estado, empresa };
    };

    const getRemotar = () => {
        // DESCRI��O VAGA 
        const vaga = document.querySelectorAll('.job-title')[0].innerText;

        // EMPRESA
        const empresa = document.querySelectorAll('.css-1bjnam8 > a > p')[0].innerText;

        const tipoVaga = "Remoto";
        const cidade = '';
        const estado = '';

        return { vaga, tipoVaga, cidade, estado, empresa };
    };

    const linkPagina = window.location.href;
    let retorno = {};
    if (linkPagina.includes("linkedin.com")) {
        retorno = getLinkedin();
    } else {
        retorno = getRemotar();
    }
    retorno.linkPagina = linkPagina;
    return retorno;
};

function showJob(retorno) {
    console.log(retorno);

    const textoParaOTelegram = `Titulo: ${retorno.vaga}
Empresa: ${retorno.empresa}
Local: ${retorno.tipoVaga} ${retorno.cidade} ${retorno.estado}

Link para a vaga ${retorno.linkPagina}`;

    const txtTelegram = document.getElementById("txtTelegram");
    txtTelegram.classList.remove("hidden");
    txtTelegram.classList.add("show");
    txtTelegram.value = textoParaOTelegram;

    const textoParaPlanilha = `\n\n\n${retorno.vaga}\t\t${retorno.cidade}\t${retorno.estado}\t${retorno.empresa}\n\n`

    const txtPlanilha = document.getElementById("txtPlanilha");
    txtPlanilha.classList.remove("hidden");
    txtPlanilha.classList.add("show");
    txtPlanilha.value = textoParaPlanilha;
}

document.getElementById("getJob").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];  
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getJob,
            //        files: ['contentScript.js'],  // To call external file instead
        }).then((textos) => showJob(textos[0].result));
    });
});