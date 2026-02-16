// Inicialização da aplicação
// No início da classe VozStudio, adicionar:
this.analisador = new AnalisadorVoz();

document.addEventListener('DOMContentLoaded', () => {
    const app = new VozStudio();
    app.inicializar();
});

class VozStudio {
    constructor() {
        this.gravador = new GravadorVoz();
        this.gerador = new GeradorMusical();
        this.mixador = new MixadorProfissional();
        this.analiseVozAtual = null;
        this.musicaGerada = null;
    }

    async inicializar() {
        this.configurarEventos();
        this.atualizarInterface();
        
        // Inicializar mixador
        await this.mixador.configurarMix();
        
        // Verificar se PWA está instalável
        this.verificarPWA();
    }

    configurarEventos() {
        // Botões de gravação
        document.getElementById('btnGravar').addEventListener('click', () => this.iniciarGravacao());
        document.getElementById('btnParar').addEventListener('click', () => this.pararGravacao());
        
        // Gerar música
        document.getElementById('btnGerar').addEventListener('click', () => this.gerarMusica());
        
        // Exportar
        document.getElementById('btnMP3').addEventListener('click', () => this.exportarMP3());
        document.getElementById('btnWAV').addEventListener('click', () => this.exportarWAV());
        document.getElementById('btnCompartilhar').addEventListener('click', () => this.compartilhar());
        
        // Slider BPM
        const bpmSlider = document.getElementById('bpm');
        const bpmValor = document.getElementById('bpmValor');
        bpmSlider.addEventListener('input', (e) => {
            bpmValor.textContent = e.target.value + ' BPM';
        });
    }

    async iniciarGravacao() {
        const sucesso = await this.gravador.iniciar();
        if (sucesso) {
            this.gravador.comecarGravacao();
            document.getElementById('btnGravar').disabled = true;
            document.getElementById('btnParar').disabled = false;
            document.getElementById('infoVoz').innerHTML = '<p>🎙️ Gravando... Canta à vontade!</p>';
        }
    }

    pararGravacao() {
        this.gravador.pararGravacao();
        document.getElementById('btnGravar').disabled = false;
        document.getElementById('btnParar').disabled = true;
    }

    async gerarMusica() {
        // Mostrar loading
        const btnGerar = document.getElementById('btnGerar');
        btnGerar.textContent = '⏳ Criando tua música...';
        btnGerar.disabled = true;

        try {
            // Recolher configurações
            const config = {
                estilo: document.getElementById('estiloMusical').value,
                bpm: parseInt(document.getElementById('bpm').value),
                tom: document.getElementById('tom').value,
                piano: document.getElementById('instPiano').checked,
                baixo: document.getElementById('instBaixo').checked,
                bateria: document.getElementById('instBateria').checked,
                guitarra: document.getElementById('instGuitarra').checked,
                cordas: document.getElementById('instCordas').checked,
                metal: document.getElementById('instMetal').checked
            };

            // Gerar música baseada na voz
            this.musicaGerada = await this.gerador.gerarMusica(
                this.analiseVozAtual || { duracao: 30 },
                config
            );

            // Aplicar mixagem profissional
            await this.aplicarMixagem();

            // Mostrar resultado
            document.getElementById('resultado').style.display = 'block';
            
            // Criar player
            const audioURL = await this.criarPlayer();
            document.getElementById('player').src = audioURL;

            // Mensagem de sucesso
            alert('✅ Música criada com sucesso! Está pronta para publicação.');

        } catch (error) {
            console.error('Erro ao gerar música:', error);
            alert('❌ Ocorreu um erro. Tenta novamente!');
        } finally {
            btnGerar.textContent = '✨ Criar Música Completa ✨';
            btnGerar.disabled = false;
        }
    }

    async aplicarMixagem() {
        // Criar canais para cada instrumento
        if (document.getElementById('instPiano').checked) {
            const canal = this.mixador.criarCanal(this.gerador.sintetizadores.piano, 'piano');
            this.mixador.ajustarEQ('piano', 0, 2, 1);
            this.mixador.ajustarReverb('piano', 0.2);
        }

        if (document.getElementById('instBaixo').checked) {
            const canal = this.mixador.criarCanal(this.gerador.sintetizadores.baixo, 'baixo');
            this.mixador.ajustarEQ('baixo', 3, -1, -2);
            this.mixador.ajustarCompressor('baixo', true);
        }

        if (document.getElementById('instBateria').checked) {
            const canal = this.mixador.criarCanal(this.gerador.sintetizadores.bateria, 'bateria');
            this.mixador.ajustarEQ('bateria', 2, 1, 3);
            this.mixador.ajustarCompressor('bateria', true);
        }

        // Masterização final
        const masterizacao = await this.mixador.aplicarMasterizacao();
        console.log('Masterização:', masterizacao);
    }

    async criarPlayer() {
        // Simular criação de áudio
        const duracao = this.musicaGerada.duracao || 30;
        const recording = await this.mixador.exportarMix(duracao);
        
        return URL.createObjectURL(recording);
    }

    async exportarMP3() {
        const audioBlob = await this.mixador.exportarMix(this.musicaGerada.duracao);
        
        // Converter para MP3 (simulado)
        const link = document.createElement('a');
        link.href = URL.createObjectURL(audioBlob);
        link.download = 'minha-musica-vozstudio.mp3';
        link.click();
    }

    async exportarWAV() {
        // Exportar alta qualidade
        const audioBlob = await this.mixador.exportarMix(this.musicaGerada.duracao);
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(audioBlob);
        link.download = 'minha-musica-vozstudio.wav';
        link.click();
    }

    async compartilhar() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Minha música criada no VozStudio',
                    text: 'Criei esta música com a minha voz! Experimenta também:',
                    url: window.location.href
                });
            } catch (error) {
                console.log('Compartilhamento cancelado');
            }
        } else {
            alert('Copia o link para compartilhar!');
        }
    }

    atualizarInterface() {
        // Atualizar informações em tempo real
        setInterval(() => {
            const infoVoz = document.getElementById('infoVoz');
            if (this.gravador.gravando) {
                infoVoz.innerHTML = '<p>🎙️ Gravando... ' + 
                    Array(5).fill('🔴').join('') + '</p>';
            }
        }, 500);
    }

    verificarPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('PWA instalável!', reg))
                .catch(err => console.log('Erro PWA:', err));
        }
    }
}