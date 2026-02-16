// gravador.js - Versão corrigida e completa
class GravadorVoz {
    constructor() {
        console.log('🎤 Criando GravadorVoz...');
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.audioContext = null;
        this.analisador = null;
        this.gravando = false;
    }

    async iniciar() {
        console.log('🎤 Iniciando gravador...');
        
        try {
            // Pedir permissão do microfone
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 2,
                    sampleRate: 48000,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });

            // Criar contexto de áudio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                latencyHint: 'interactive',
                sampleRate: 48000
            });

            // Fonte de áudio
            const source = this.audioContext.createMediaStreamSource(this.stream);
            
            // Analisador para visualização
            this.analisador = this.audioContext.createAnalyser();
            this.analisador.fftSize = 2048;
            source.connect(this.analisador);

            // MediaRecorder para capturar
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000
            });

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.processarGravacao(audioBlob);
            };

            console.log('✅ Gravador pronto!');
            return true;
            
        } catch (error) {
            console.error('❌ Erro no microfone:', error);
            return false;
        }
    }

    comecarGravacao() {
        if (this.mediaRecorder && !this.gravando) {
            this.audioChunks = [];
            this.mediaRecorder.start();
            this.gravando = true;
            this.visualizarOnda();
            console.log('🎤 Gravando...');
        }
    }

    pararGravacao() {
        if (this.mediaRecorder && this.gravando) {
            this.mediaRecorder.stop();
            this.gravando = false;
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            console.log('⏹️ Gravação parada');
        }
    }

    visualizarOnda() {
        const canvas = document.getElementById('waveform');
        if (!canvas || !this.analisador) return;
        
        const ctx = canvas.getContext('2d');
        const bufferLength = this.analisador.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const desenhar = () => {
            if (!this.gravando) return;
            
            requestAnimationFrame(desenhar);
            
            this.analisador.getByteTimeDomainData(dataArray);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffd700';
            ctx.beginPath();
            
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            ctx.stroke();
        };

        desenhar();
    }

    async processarGravacao(audioBlob) {
        console.log('📦 Processando gravação...');
        
        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Criar análise básica
            const analise = {
                duracao: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate,
                canais: audioBuffer.numberOfChannels,
                bpm: 100,
                tom: 'C',
                notas: [],
                audioData: audioBuffer
            };
            
            console.log('✅ Análise criada:', analise);
            
            // Enviar para app.js se existir
            if (window.app) {
                window.app.receberAnaliseVoz(analise);
            }
            
            // Atualizar interface
            const infoVoz = document.getElementById('infoVoz');
            if (infoVoz) {
                infoVoz.innerHTML = `
                    <p>✅ Voz gravada!</p>
                    <p>🎵 Duração: ${analise.duracao.toFixed(1)}s</p>
                `;
            }
            
            return analise;
            
        } catch (erro) {
            console.error('❌ Erro ao processar:', erro);
        }
    }

    calcularEnergia(channelData) {
        let soma = 0;
        for (let i = 0; i < channelData.length; i++) {
            soma += Math.abs(channelData[i]);
        }
        return soma / channelData.length;
    }
}

window.GravadorVoz = GravadorVoz;

console.log('📦 gravador.js carregado, classe GravadorVoz definida');