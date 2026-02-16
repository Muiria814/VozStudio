// mixador.js - Versão corrigida
class MixadorProfissional {
    constructor() {
        console.log('🎛️ Criando MixadorProfissional...');
        this.canais = new Map();
        this.masterBus = null;
        this.efeitos = {};
        this.compressor = null;
        this.eq = null;
        this.limiter = null;
    }

    async configurarMix() {
        console.log('🎛️ Configurando mix profissional...');
        
        try {
            // Aguardar Tone.js estar pronto
            await Tone.start();
            
            // Criar bus master com processamento profissional
            this.masterBus = Tone.context.createGain();
            
            // Compressor master (para som profissional)
            this.compressor = new Tone.Compressor({
                threshold: -24,
                ratio: 12,
                attack: 0.003,
                release: 0.25,
                knee: 30
            }).toDestination();
            
            // Equalizador master
            this.eq = new Tone.EQ3({
                low: 0,
                mid: 2,
                high: 1,
                lowFrequency: 200,
                highFrequency: 2000
            });
            
            // Limiter (evita distorção)
            this.limiter = new Tone.Limiter(-1);
            
            // Conectar cadeia de processamento
            this.masterBus.chain(this.compressor, this.eq, this.limiter, Tone.Destination);
            
            console.log('✅ Mixador configurado com sucesso');
            return true;
            
        } catch (erro) {
            console.error('❌ Erro ao configurar mixador:', erro);
            return false;
        }
    }

    criarCanal(instrumento, nome) {
        console.log(`🎛️ Criando canal para: ${nome}`);
        
        try {
            const canal = {
                entrada: instrumento,
                gain: new Tone.Gain(1),
                eq: new Tone.EQ3({
                    low: 0,
                    mid: 0,
                    high: 0
                }),
                compressor: new Tone.Compressor({
                    threshold: -20,
                    ratio: 4
                }),
                reverb: new Tone.Reverb({
                    decay: 1.5,
                    wet: 0.2
                }),
                delay: new Tone.FeedbackDelay({
                    delayTime: 0.25,
                    feedback: 0.3,
                    wet: 0.1
                })
            };

            // Configurar roteamento
            instrumento.chain(
                canal.compressor,
                canal.eq,
                canal.reverb,
                canal.delay,
                canal.gain,
                this.masterBus || Tone.Destination
            );

            this.canais.set(nome, canal);
            console.log(`✅ Canal ${nome} criado`);
            
            return canal;
            
        } catch (erro) {
            console.error(`❌ Erro ao criar canal ${nome}:`, erro);
            return null;
        }
    }

    ajustarEQ(nome, low, mid, high) {
        const canal = this.canais.get(nome);
        if (canal && canal.eq) {
            canal.eq.low.value = low;
            canal.eq.mid.value = mid;
            canal.eq.high.value = high;
            console.log(`🎛️ EQ ajustado para ${nome}: low=${low}, mid=${mid}, high=${high}`);
        }
    }

    ajustarReverb(nome, quantidade) {
        const canal = this.canais.get(nome);
        if (canal && canal.reverb) {
            canal.reverb.wet.value = quantidade;
            console.log(`🎛️ Reverb ajustado para ${nome}: ${quantidade}`);
        }
    }

    ajustarDelay(nome, quantidade) {
        const canal = this.canais.get(nome);
        if (canal && canal.delay) {
            canal.delay.wet.value = quantidade;
            console.log(`🎛️ Delay ajustado para ${nome}: ${quantidade}`);
        }
    }

    ajustarVolume(nome, volume) {
        const canal = this.canais.get(nome);
        if (canal && canal.gain) {
            canal.gain.gain.value = volume;
            console.log(`🎛️ Volume ajustado para ${nome}: ${volume}`);
        }
    }

    async aplicarMasterizacao() {
        console.log('🎛️ Aplicando masterização...');
        
        try {
            // Análise espectral
            const analyzer = new Tone.Analyser('fft', 2048);
            this.masterBus.connect(analyzer);
            
            // Ajustes automáticos baseados na análise
            const spectrum = analyzer.getValue();
            const lowEnd = spectrum.slice(0, 100).reduce((a, b) => a + b, 0) / 100;
            const highEnd = spectrum.slice(-100).reduce((a, b) => a + b, 0) / 100;
            
            // Ajustar EQ baseado no conteúdo
            if (lowEnd > highEnd) {
                // Mais graves, realçar agudos
                if (this.eq) this.eq.high.value = 3;
            } else {
                // Mais agudos, aquecer som
                if (this.eq) this.eq.low.value = 2;
            }
            
            const analise = {
                pico: this.analisarPico(),
                rms: this.analisarRMS(),
                lufs: this.analisarLUFS()
            };
            
            console.log('✅ Masterização aplicada:', analise);
            return analise;
            
        } catch (erro) {
            console.error('❌ Erro na masterização:', erro);
            return null;
        }
    }

    analisarPico() {
        // Simular análise de pico
        return -0.5; // dB
    }

    analisarRMS() {
        // Simular RMS
        return -12; // dB
    }

    analisarLUFS() {
        // Simular loudness
        return -14; // LUFS (padrão Spotify)
    }

    async exportarMix(duracao) {
        console.log(`🎛️ Exportando mix (${duracao}s)...`);
        
        try {
            // Configurar gravação
            const recorder = new Tone.Recorder();
            this.masterBus.connect(recorder);
            
            // Gravar
            recorder.start();
            await new Promise(resolve => setTimeout(resolve, duracao * 1000));
            const recording = await recorder.stop();
            
            console.log('✅ Mix exportado com sucesso');
            return recording;
            
        } catch (erro) {
            console.error('❌ Erro ao exportar mix:', erro);
            return null;
        }
    }

    // Método para limpar recursos
    dispose() {
        console.log('🧹 Limpando mixador...');
        
        this.canais.forEach((canal, nome) => {
            try {
                if (canal.entrada) canal.entrada.dispose();
                if (canal.gain) canal.gain.dispose();
                if (canal.eq) canal.eq.dispose();
                if (canal.compressor) canal.compressor.dispose();
                if (canal.reverb) canal.reverb.dispose();
                if (canal.delay) canal.delay.dispose();
            } catch (erro) {
                console.error(`Erro ao limpar canal ${nome}:`, erro);
            }
        });
        
        this.canais.clear();
        
        if (this.compressor) this.compressor.dispose();
        if (this.eq) this.eq.dispose();
        if (this.limiter) this.limiter.dispose();
        if (this.masterBus) this.masterBus.disconnect();
        
        console.log('✅ Mixador limpo');
    }
}

// Garantir que a classe está disponível globalmente
console.log('📦 mixador.js carregado, classe MixadorProfissional definida:', typeof MixadorProfissional);
