// analisador.js - Extrai informações musicais da voz
class AnalisadorVoz {
    constructor() {
        this.audioContext = null;
        this.analisador = null;
        this.notasDetetadas = [];
    }

    async analisarAudio(audioBuffer) {
        console.log('🎵 Analisando voz...');
        
        // Extrair características principais
        const analise = {
            duracao: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            canais: audioBuffer.numberOfChannels,
            bpm: this.detetarBPM(audioBuffer),
            tom: this.detetarTom(audioBuffer),
            notas: this.detetarNotas(audioBuffer),
            intensidade: this.calcularIntensidade(audioBuffer),
            espectro: this.analisarEspectro(audioBuffer)
        };

        console.log('✅ Análise completa:', analise);
        return analise;
    }

    detetarBPM(audioBuffer) {
        // Algoritmo simples para detetar BPM
        const channelData = audioBuffer.getChannelData(0);
        let picos = 0;
        let threshold = 0.1;
        
        for (let i = 1; i < channelData.length; i++) {
            if (channelData[i] > threshold && channelData[i-1] <= threshold) {
                picos++;
            }
        }
        
        // Estimar BPM baseado nos picos
        const duracaoSegundos = audioBuffer.duration;
        const bpmEstimado = Math.round((picos / duracaoSegundos) * 30);
        
        // Limitar entre 60-180 BPM
        return Math.min(180, Math.max(60, bpmEstimado));
    }

    detetarTom(audioBuffer) {
        // Detetar nota predominante (simplificado)
        const channelData = audioBuffer.getChannelData(0);
        
        // Calcular frequência fundamental aproximada
        // (versão simplificada - autocorrelação)
        let frequencia = 261.63; // Dó por defeito
        
        try {
            // Implementação básica de deteção de pitch
            const tamanhoJanela = 2048;
            let melhorCorrelacao = 0;
            let melhorAtraso = 0;
            
            for (let atraso = 20; atraso < 500; atraso++) {
                let correlacao = 0;
                for (let i = 0; i < tamanhoJanela; i++) {
                    if (i + atraso < channelData.length) {
                        correlacao += channelData[i] * channelData[i + atraso];
                    }
                }
                if (correlacao > melhorCorrelacao) {
                    melhorCorrelacao = correlacao;
                    melhorAtraso = atraso;
                }
            }
            
            if (melhorAtraso > 0) {
                frequencia = audioBuffer.sampleRate / melhorAtraso;
            }
        } catch (e) {
            console.log('Usando frequência padrão');
        }

        // Converter frequência para nota
        const notas = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
        const notaIndex = Math.round(12 * Math.log2(frequencia / 440) + 69) % 12;
        
        return notas[notaIndex] || 'Dó';
    }

    detetarNotas(audioBuffer) {
        // Extrair sequência de notas
        const channelData = audioBuffer.getChannelData(0);
        const notas = [];
        const energiaMinima = 0.01;
        let notaAtual = null;
        let inicioNota = 0;

        for (let i = 0; i < channelData.length; i += 1024) {
            const energia = Math.abs(channelData[i]);
            
            if (energia > energiaMinima && !notaAtual) {
                // Início de nota
                notaAtual = {
                    inicio: i / audioBuffer.sampleRate,
                    frequencia: this.calcularFrequencia(channelData, i)
                };
            } else if (energia <= energiaMinima && notaAtual) {
                // Fim de nota
                notaAtual.fim = i / audioBuffer.sampleRate;
                notas.push(notaAtual);
                notaAtual = null;
            }
        }

        return notas.slice(0, 10); // Retornar primeiras 10 notas
    }

    calcularFrequencia(channelData, posicao) {
        // Calcular frequência numa janela
        const tamanho = 1024;
        const dados = channelData.slice(posicao, posicao + tamanho);
        
        // Encontrar zero crossings para estimar período
        let cruzamentos = 0;
        for (let i = 1; i < dados.length; i++) {
            if (dados[i] >= 0 && dados[i-1] < 0) {
                cruzamentos++;
            }
        }
        
        return (cruzamentos / (tamanho / 44100)) / 2;
    }

    calcularIntensidade(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let somaQuadrados = 0;
        
        for (let i = 0; i < channelData.length; i++) {
            somaQuadrados += channelData[i] * channelData[i];
        }
        
        const rms = Math.sqrt(somaQuadrados / channelData.length);
        
        // Converter para dB (escala profissional)
        const db = 20 * Math.log10(rms + 0.0001);
        
        return {
            rms: rms,
            db: db,
            nivel: db > -12 ? 'Alto' : db > -24 ? 'Médio' : 'Baixo'
        };
    }

    analisarEspectro(audioBuffer) {
        // Análise de frequências (graves, médios, agudos)
        const channelData = audioBuffer.getChannelData(0);
        let graves = 0, medios = 0, agudos = 0;
        
        for (let i = 0; i < channelData.length; i += 100) {
            const frequencia = (i * audioBuffer.sampleRate) / channelData.length;
            const amplitude = Math.abs(channelData[i]);
            
            if (frequencia < 200) {
                graves += amplitude;
            } else if (frequencia < 2000) {
                medios += amplitude;
            } else {
                agudos += amplitude;
            }
        }
        
        return {
            graves: graves,
            medios: medios,
            agudos: agudos,
            perfil: graves > medios && graves > agudos ? 'Graves' :
                    medios > graves && medios > agudos ? 'Médios' : 'Agudos'
        };
    }

    gerarVisualizacao(audioBuffer) {
        // Gerar dados para waveform
        const channelData = audioBuffer.getChannelData(0);
        const pontos = 200; // Número de pontos no waveform
        const waveform = [];
        
        for (let i = 0; i < pontos; i++) {
            const inicio = Math.floor((i / pontos) * channelData.length);
            const fim = Math.floor(((i + 1) / pontos) * channelData.length);
            let maximo = 0;
            
            for (let j = inicio; j < fim; j++) {
                maximo = Math.max(maximo, Math.abs(channelData[j]));
            }
            
            waveform.push(maximo);
        }
        
        return waveform;
    }
}

// Exportar para uso noutros ficheiros
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalisadorVoz;
}