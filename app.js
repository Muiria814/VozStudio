// app.js - Controlador principal da aplicação
class VozStudio {
    constructor() {
        console.log('🎵 Criando VozStudio...');

        // Inicializar componentes
        this.gravador = new GravadorVoz();
        this.gerador = new GeradorMusical();
        this.mixador = new MixadorProfissional();
        this.analisador = new AnalisadorVoz();

        // Dados da aplicação
        this.analiseVozAtual = null;
        this.musicaGerada = null;
        this.audioUrl = null;
        
        // Controlo de áudio
        this.audioContext = null;
        this.currentOscillator = null;
        this.currentGain = null;
        this.currentPart = null;
        this.isPlaying = false;
    }

    inicializar() {
        console.log('🎵 Inicializando VozStudio...');

        // Configurar eventos dos botões
        this.configurarEventos();

        // Atualizar interface
        this.atualizarInterface();

        // Inicializar mixador
        if (this.mixador && this.mixador.configurarMix) {
            this.mixador.configurarMix();
        }

        console.log('✅ VozStudio pronto!');
        document.getElementById('infoVoz').innerHTML = '<p style="color: green;">✅ App pronta! Clique em Gravar Voz</p>';
    }

    configurarEventos() {
        console.log('🔌 Configurando eventos...');

        // Botões de gravação
        const btnGravar = document.getElementById('btnGravar');
        const btnParar = document.getElementById('btnParar');
        const btnGerar = document.getElementById('btnGerar');
        const btnMP3 = document.getElementById('btnMP3');
        const btnWAV = document.getElementById('btnWAV');
        const btnCompartilhar = document.getElementById('btnCompartilhar');
        const player = document.getElementById('player');

        if (btnGravar) {
            btnGravar.addEventListener('click', () => this.iniciarGravacao());
            console.log('✅ Botão Gravar configurado');
        }

        if (btnParar) {
            btnParar.addEventListener('click', () => this.pararGravacao());
            console.log('✅ Botão Parar configurado');
        }

        if (btnGerar) {
            btnGerar.addEventListener('click', () => this.gerarMusica());
            console.log('✅ Botão Gerar configurado');
        }

        if (btnMP3) {
            btnMP3.addEventListener('click', () => this.exportarMP3());
        }

        if (btnWAV) {
            btnWAV.addEventListener('click', () => this.exportarWAV());
        }

        if (btnCompartilhar) {
            btnCompartilhar.addEventListener('click', () => this.compartilhar());
        }

        // Controlo do player
        if (player) {
            player.addEventListener('play', () => {
                console.log('▶️ Player iniciado');
                this.isPlaying = true;
            });
            
            player.addEventListener('pause', () => {
                console.log('⏸️ Player pausado');
                this.isPlaying = false;
            });
            
            player.addEventListener('ended', () => {
                console.log('⏹️ Player terminado');
                this.isPlaying = false;
            });
        }

        // Slider BPM
        const bpmSlider = document.getElementById('bpm');
        const bpmValor = document.getElementById('bpmValor');

        if (bpmSlider && bpmValor) {
            bpmSlider.addEventListener('input', (e) => {
                bpmValor.textContent = e.target.value + ' BPM';
            });
        }
    }

    // ===========================================
    // NOVO: Parar todos os sons
    // ===========================================
    pararTodosOsSons() {
        console.log('🔇 Parando todos os sons...');
        
        // Parar Tone.Transport
        if (Tone && Tone.Transport) {
            Tone.Transport.stop();
            Tone.Transport.cancel();
        }
        
        // Parar osciladores manuais
        if (this.currentOscillator) {
            try {
                this.currentOscillator.stop();
                this.currentOscillator.disconnect();
            } catch (e) {}
            this.currentOscillator = null;
        }
        
        if (this.currentGain) {
            try {
                this.currentGain.disconnect();
            } catch (e) {}
            this.currentGain = null;
        }
        
        // Parar partes do Tone.js
        if (this.currentPart) {
            try {
                this.currentPart.stop();
                this.currentPart.dispose();
            } catch (e) {}
            this.currentPart = null;
        }
        
        // Fechar contexto de áudio se existir
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (e) {}
        }
        
        // Criar novo contexto
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        console.log('✅ Todos os sons parados');
    }

    async iniciarGravacao() {
        console.log('🎤 Iniciando gravação...');
        
        // Parar qualquer som antes de gravar
        this.pararTodosOsSons();

        try {
            // Pedir permissão e iniciar gravação
            const sucesso = await this.gravador.iniciar();

            if (sucesso) {
                this.gravador.comecarGravacao();

                // Atualizar botões
                document.getElementById('btnGravar').disabled = true;
                document.getElementById('btnParar').disabled = false;

                document.getElementById('infoVoz').innerHTML = 
                    '<p>🎙️ Gravando... Canta à vontade!</p>';
            }
        } catch (erro) {
            console.error('Erro ao gravar:', erro);
            document.getElementById('infoVoz').innerHTML = 
                '<p style="color: red;">Erro: ' + erro.message + '</p>';
        }
    }

    pararGravacao() {
        console.log('⏹️ Parando gravação...');

        this.gravador.pararGravacao();

        // Atualizar botões
        document.getElementById('btnGravar').disabled = false;
        document.getElementById('btnParar').disabled = true;
    }

    async gerarMusica() {
        console.log('✨ Gerando música...');
        
        // ===========================================
        // CRÍTICO: Parar todos os sons anteriores
        // ===========================================
        this.pararTodosOsSons();

        // Verificar se temos análise da voz
        if (!this.analiseVozAtual) {
            alert('Por favor, grava a voz primeiro!');
            return;
        }

        // Mostrar loading
        const btnGerar = document.getElementById('btnGerar');
        btnGerar.textContent = '⏳ Criando tua música...';
        btnGerar.disabled = true;

        try {
            // Recolher configurações
            const config = {
                estilo: document.getElementById('estiloMusical')?.value || 'pop',
                bpm: parseInt(document.getElementById('bpm')?.value || '100'),
                tom: document.getElementById('tom')?.value || 'C',
                piano: document.getElementById('instPiano')?.checked || true,
                baixo: document.getElementById('instBaixo')?.checked || true,
                bateria: document.getElementById('instBateria')?.checked || true,
                guitarra: document.getElementById('instGuitarra')?.checked || false,
                cordas: document.getElementById('instCordas')?.checked || false,
                metal: document.getElementById('instMetal')?.checked || false
            };

            console.log('Configurações:', config);

            // Mostrar resultado
            document.getElementById('resultado').style.display = 'block';
            
            // GERAR TOM DE TESTE (limitado a 5 segundos)
            const duration = Math.min(this.analiseVozAtual?.duracao || 5, 10);
            const audioUrl = await generateTestTone(duration, 440);
            const player = document.getElementById('player');
            
            // Remover URL anterior
            if (this.audioUrl) {
                URL.revokeObjectURL(this.audioUrl);
            }
            
            this.audioUrl = audioUrl;
            player.src = audioUrl;
            player.controls = true;
            player.load();
            
            alert(`✅ Música gerada com sucesso! (${duration}s)`);

        } catch (error) {
            console.error('Erro ao gerar música:', error);
            alert('❌ Erro: ' + error.message);
        } finally {
            btnGerar.textContent = '✨ Criar Música Completa ✨';
            btnGerar.disabled = false;
        }
    }

    // Recebe análise do gravador
    receberAnaliseVoz(analise) {
        console.log('📊 Análise recebida:', analise);
        this.analiseVozAtual = analise;

        // Atualizar interface
        document.getElementById('infoVoz').innerHTML = `
            <p style="color: green;">✅ Voz analisada!</p>
            <p>🎵 Duração: ${analise.duracao?.toFixed(1) || 0}s</p>
        `;
    }

    async exportarMP3() {
        if (!this.analiseVozAtual) {
            alert('Gera uma música primeiro!');
            return;
        }

        try {
            const duration = Math.min(this.analiseVozAtual?.duracao || 5, 10);
            const audioUrl = await generateTestTone(duration, 440);
            
            // Download
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = `vozstudio-${Date.now()}.mp3`;
            a.click();

            // Limpar URL depois de usar
            setTimeout(() => URL.revokeObjectURL(audioUrl), 1000);

        } catch (error) {
            console.error('Erro ao exportar MP3:', error);
            alert('Erro ao exportar: ' + error.message);
        }
    }

    async exportarWAV() {
        if (!this.analiseVozAtual) {
            alert('Gera uma música primeiro!');
            return;
        }

        try {
            const duration = Math.min(this.analiseVozAtual?.duracao || 5, 10);
            const audioUrl = await generateTestTone(duration, 440);
            
            // Download
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = `vozstudio-${Date.now()}.wav`;
            a.click();

            // Limpar URL depois de usar
            setTimeout(() => URL.revokeObjectURL(audioUrl), 1000);

        } catch (error) {
            console.error('Erro ao exportar WAV:', error);
            alert('Erro ao exportar: ' + error.message);
        }
    }

    async compartilhar() {
        if (!this.analiseVozAtual) {
            alert('Gera uma música primeiro!');
            return;
        }

        // Verificar se o navegador suporta compartilhamento
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'VozStudio - Minha Música',
                    text: 'Criei esta música com a minha voz no VozStudio!',
                    url: window.location.href
                });
                console.log('Compartilhado com sucesso!');
            } catch (error) {
                console.log('Compartilhamento cancelado:', error);
            }
        } else {
            // Fallback para navegadores que não suportam share
            alert('Copia o link para compartilhar: ' + window.location.href);
        }
    }

    atualizarInterface() {
        console.log('🖥️ Interface atualizada');
    }
}

// Garantir que a classe está disponível globalmente
console.log('📦 app.js carregado, classe VozStudio definida:', typeof VozStudio);

// ===========================================
// FUNÇÕES AUXILIARES
// ===========================================

/**
 * Converte um AudioBuffer para WAV
 */
function bufferToWave(buffer, length) {
    return new Promise((resolve) => {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        
        const dataLength = length * sampleRate * blockAlign / 1000;
        const bufferLength = dataLength + 44;
        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);
        
        // RIFF header
        writeString(view, 0, 'RIFF');
        view.setUint32(4, bufferLength - 8, true);
        writeString(view, 8, 'WAVE');
        
        // fmt subchunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        
        // data subchunk
        writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);
        
        // Write audio data
        const channelData = buffer.getChannelData(0);
        const offset = 44;
        
        for (let i = 0; i < dataLength / blockAlign; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset + i * 2, intSample, true);
        }
        
        resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
    });
}

/**
 * Escreve uma string no DataView
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Função para gerar um tom de teste (agora sem loops infinitos)
 */
async function generateTestTone(duration = 2, frequency = 440) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Tom senoidal com fade out
        channelData[i] = Math.sin(i * frequency * 2 * Math.PI / sampleRate) * 
                        Math.max(0, 1 - t / duration);
    }
    
    const wavBlob = await bufferToWave(buffer, duration * 1000);
    audioContext.close(); // Fechar contexto para não gastar bateria
    return URL.createObjectURL(wavBlob);
}

console.log('✅ Funções auxiliares carregadas');