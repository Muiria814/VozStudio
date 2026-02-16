// gerador.js - Cria o instrumental baseado na voz
class GeradorMusical {
    constructor() {
        this.sintetizadores = {};
        this.sequencias = {};
        this.toneIniciado = false;
        // ===========================================
        // NOVO: Objeto para armazenar samples carregados
        // ===========================================
        this.samples = {
            piano: {},
            bateria: {},
            baixo: {}
        };
    }

    async iniciarTone() {
        if (!this.toneIniciado) {
            await Tone.start();
            this.toneIniciado = true;
        }
    }

    // ===========================================
    // NOVO MÉTODO 1: Carregar samples
    // ===========================================
    async carregarSamples() {
        console.log('🎹 Carregando samples...');
        
        // Carregar piano samples
        const notasPiano = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
        for (const nota of notasPiano) {
            try {
                const response = await fetch(`assets/samples/piano/${nota}.mp3`);
                const buffer = await response.arrayBuffer();
                this.samples.piano[nota] = await Tone.context.decodeAudioData(buffer);
                console.log(`✅ Sample piano ${nota} carregado`);
            } catch (e) {
                console.log(`⚠️ Sample piano ${nota} não encontrado, usando sintetizador`);
            }
        }

        // Carregar bateria samples
        const sonsBateria = ['kick', 'snare', 'hihat', 'crash'];
        for (const som of sonsBateria) {
            try {
                const response = await fetch(`assets/samples/bateria/${som}.mp3`);
                const buffer = await response.arrayBuffer();
                this.samples.bateria[som] = await Tone.context.decodeAudioData(buffer);
                console.log(`✅ Sample bateria ${som} carregado`);
            } catch (e) {
                console.log(`⚠️ Sample bateria ${som} não encontrado`);
            }
        }

        // Carregar baixo samples
        const notasBaixo = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2'];
        for (const nota of notasBaixo) {
            try {
                const response = await fetch(`assets/samples/baixo/${nota}.mp3`);
                const buffer = await response.arrayBuffer();
                this.samples.baixo[nota] = await Tone.context.decodeAudioData(buffer);
                console.log(`✅ Sample baixo ${nota} carregado`);
            } catch (e) {
                console.log(`⚠️ Sample baixo ${nota} não encontrado`);
            }
        }
    }

    async gerarMusica(analiseVoz, configuracoes) {
        await this.iniciarTone();
        
        // ===========================================
        // NOVO: Carregar samples antes de criar instrumentos
        // ===========================================
        await this.carregarSamples();
        
        // Limpar músicas anteriores
        this.limparTudo();
        
        // Criar os instrumentos selecionados
        const instrumentos = [];
        
        if (configuracoes.piano) {
            instrumentos.push(await this.criarPiano());
        }
        
        if (configuracoes.baixo) {
            instrumentos.push(await this.criarBaixo());
        }
        
        if (configuracoes.bateria) {
            instrumentos.push(await this.criarBateria(configuracoes.bpm));
        }
        
        if (configuracoes.guitarra) {
            instrumentos.push(await this.criarGuitarra());
        }
        
        // Gerar progressão de acordes baseada no estilo
        const acordes = this.gerarAcordes(
            configuracoes.estilo,
            configuracoes.tom,
            analiseVoz
        );
        
        // Gerar melodia baseada na voz
        const melodia = this.adaptarMelodia(
            analiseVoz,
            configuracoes.tom,
            acordes
        );
        
        // Criar as sequências
        this.criarSequencias(instrumentos, acordes, melodia, configuracoes);
        
        return {
            acordes,
            melodia,
            bpm: configuracoes.bpm,
            duracao: analiseVoz.duracao
        };
    }

    // ===========================================
    // MODIFICADO: Criar piano (agora com samples)
    // ===========================================
    async criarPiano() {
        // Verificar se temos samples carregados
        if (Object.keys(this.samples.piano).length > 0) {
            // Usar samples reais
            console.log('🎹 Usando samples reais de piano');
            
            // Criar URLs para cada sample
            const urls = {};
            for (const nota of Object.keys(this.samples.piano)) {
                urls[nota] = `${nota}.mp3`;
            }
            
            const sampler = new Tone.Sampler({
                urls: urls,
                baseUrl: "assets/samples/piano/",
                attack: 0.01,
                release: 0.5,
                onload: () => console.log('✅ Piano samples carregados')
            }).toDestination();
            
            sampler.volume.value = -5;
            return sampler;
            
        } else {
            // Fallback para sintetizador
            console.log('🎹 Usando sintetizador (sem samples)');
            const synth = new Tone.Synth({
                oscillator: {
                    type: 'triangle'
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 1
                }
            }).toDestination();
            
            synth.volume.value = -5;
            return synth;
        }
    }

    // ===========================================
    // MODIFICADO: Criar baixo (agora com samples)
    // ===========================================
    async criarBaixo() {
        if (Object.keys(this.samples.baixo).length > 0) {
            // Usar samples reais
            console.log('🎸 Usando samples reais de baixo');
            
            const urls = {};
            for (const nota of Object.keys(this.samples.baixo)) {
                urls[nota] = `${nota}.mp3`;
            }
            
            const sampler = new Tone.Sampler({
                urls: urls,
                baseUrl: "assets/samples/baixo/",
            }).toDestination();
            
            sampler.volume.value = -3;
            return sampler;
            
        } else {
            // Fallback para sintetizador
            console.log('🎸 Usando sintetizador de baixo');
            const baixo = new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 4,
                envelope: {
                    attack: 0.01,
                    decay: 0.4,
                    sustain: 0.2,
                    release: 1.5
                }
            }).toDestination();
            
            baixo.volume.value = -3;
            return baixo;
        }
    }

    // ===========================================
    // MODIFICADO: Criar bateria (agora com samples)
    // ===========================================
    async criarBateria(bpm) {
        if (Object.keys(this.samples.bateria).length > 0) {
            // Usar samples reais
            console.log('🥁 Usando samples reais de bateria');
            
            const sampler = new Tone.Sampler({
                urls: {
                    kick: "kick.mp3",
                    snare: "snare.mp3",
                    hihat: "hihat.mp3",
                    crash: "crash.mp3"
                },
                baseUrl: "assets/samples/bateria/",
            }).toDestination();
            
            // Criar padrão baseado no BPM
            const padrao = this.gerarPadraoBateria(bpm);
            
            return { sampler, padrao };
            
        } else {
            // Fallback para sintetizador
            console.log('🥁 Usando sintetizador de bateria');
            const bateria = new Tone.MembraneSynth().toDestination();
            const padrao = this.gerarPadraoBateria(bpm);
            return { sintetizador: bateria, padrao };
        }
    }

    async criarGuitarra() {
        const guitarra = new Tone.NoiseSynth({
            noise: {
                type: "brown"
            },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.05,
                release: 0.8
            }
        }).toDestination();
        
        return guitarra;
    }

    gerarAcordes(estilo, tom, analiseVoz) {
        // Progressões de acordes para diferentes estilos
        const progressoes = {
            pop: ['C', 'G', 'Am', 'F'],
            rap: ['Dm', 'Am', 'C', 'G'],
            kizomba: ['Em', 'C', 'G', 'D'],
            semba: ['C', 'F', 'G', 'C'],
            afrobeat: ['D', 'G', 'A', 'D'],
            gospel: ['C', 'F', 'G', 'Am'],
            acustico: ['C', 'Am', 'F', 'G']
        };

        const acordesBase = progressoes[estilo] || progressoes.pop;
        
        // Adaptar ao tom escolhido
        return acordesBase.map(acorde => 
            this.transporAcorde(acorde, tom)
        );
    }

    transporAcorde(acorde, novoTom) {
        const notas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Extrair nota base do acorde (ex: "Am" -> "A")
        const notaBase = acorde.replace(/[^A-G#]/g, '');
        const qualidade = acorde.replace(notaBase, '');
        
        const indiceAtual = notas.indexOf(notaBase);
        const indiceNovo = notas.indexOf(novoTom);
        
        const diferenca = indiceNovo - notas.indexOf('C');
        const novoIndice = (indiceAtual + diferenca + 12) % 12;
        
        return notas[novoIndice] + qualidade;
    }
// NOVO: Extrair melodia REAL da voz
// ===========================================
adaptarMelodia(analiseVoz, tom, acordes) {
    console.log('🎵 Extraindo melodia real da voz...');
    
    // Se não tiver dados de áudio, usa versão genérica
    if (!analiseVoz.audioData) {
        console.log('⚠️ Sem dados de áudio, usando melodia genérica');
        return this.gerarMelodiaGenerica(acordes, analiseVoz.duracao || 30);
    }
    
    // Extrair notas da voz
    const notasCantadas = this.extrairNotasDaVoz(analiseVoz.audioData);
    
    if (notasCantadas.length === 0) {
        console.log('⚠️ Nenhuma nota detetada, usando genérica');
        return this.gerarMelodiaGenerica(acordes, analiseVoz.duracao || 30);
    }
    
    console.log(`✅ Detetadas ${notasCantadas.length} notas da voz`);
    
    // Converter notas detetadas para melodia instrumental
    const melodia = [];
    
    for (let i = 0; i < notasCantadas.length; i++) {
        const nota = notasCantadas[i];
        
        // Arredondar para a nota musical mais próxima
        const notaMusical = this.frequenciaParaNota(nota.frequencia);
        
        // Só adicionar se a nota for válida
        if (notaMusical) {
            melodia.push({
                nota: notaMusical,
                tempo: nota.inicio,
                duracao: Math.max(0.1, nota.duracao)  // Mínimo 0.1 segundos
            });
        }
    }
    
    // Se não conseguiu extrair notas válidas, usa genérica
    if (melodia.length === 0) {
        return this.gerarMelodiaGenerica(acordes, analiseVoz.duracao || 30);
    }
    
    return melodia;
}

// ===========================================
// Extrair notas do áudio (Pitch Detection)
// ===========================================
extrairNotasDaVoz(audioBuffer) {
    const notas = [];
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Parâmetros para deteção
    const janelaTamanho = 2048;  // Tamanho da janela de análise
    const passo = 512;           // Passo entre análises
    const limiarEnergia = 0.01;   // Mínimo de volume para considerar nota
    const minimoDuracao = 0.1;    // Duração mínima de uma nota (segundos)
    
    let notaAtual = null;
    let inicioNota = 0;
    
    for (let i = 0; i < channelData.length - janelaTamanho; i += passo) {
        // Calcular energia da janela atual
        const energia = this.calcularEnergia(channelData, i, janelaTamanho);
        
        // Detetar frequência se houver energia suficiente
        if (energia > limiarEnergia) {
            const frequencia = this.detectarFrequencia(
                channelData, i, janelaTamanho, sampleRate
            );
            
            // Filtrar frequências válidas (voz humana: 80Hz - 1100Hz)
            if (frequencia >= 80 && frequencia <= 1100) {
                if (!notaAtual) {
                    // Começo de nova nota
                    notaAtual = {
                        frequencia: frequencia,
                        inicio: i / sampleRate,
                        fim: i / sampleRate,
                        energias: [energia]
                    };
                    inicioNota = i;
                } else {
                    // Continuar nota atual
                    notaAtual.fim = (i + janelaTamanho) / sampleRate;
                    notaAtual.energias.push(energia);
                    
                    // Média das frequências para suavizar
                    notaAtual.frequencia = 
                        (notaAtual.frequencia * (notaAtual.energias.length - 1) + frequencia) 
                        / notaAtual.energias.length;
                }
            }
        } else {
            // Sem energia, terminar nota se existir
            if (notaAtual) {
                const duracao = notaAtual.fim - notaAtual.inicio;
                if (duracao >= minimoDuracao) {
                    notas.push(notaAtual);
                }
                notaAtual = null;
            }
        }
    }
    
    // Não esquecer a última nota
    if (notaAtual) {
        const duracao = notaAtual.fim - notaAtual.inicio;
        if (duracao >= minimoDuracao) {
            notas.push(notaAtual);
        }
    }
    
    return notas;
}

// ===========================================
// Calcular energia (volume) de um segmento
// ===========================================
calcularEnergia(dados, inicio, tamanho) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
        if (inicio + i < dados.length) {
            soma += dados[inicio + i] * dados[inicio + i];
        }
    }
    return Math.sqrt(soma / tamanho);
}

// ===========================================
// Detetar frequência (YIN Algorithm simplificado)
// ===========================================
detectarFrequencia(dados, inicio, tamanho, sampleRate) {
    // Autocorrelação para encontrar o período
    const buffer = [];
    for (let i = 0; i < tamanho; i++) {
        if (inicio + i < dados.length) {
            buffer.push(dados[inicio + i]);
        } else {
            buffer.push(0);
        }
    }
    
    let melhorAtraso = -1;
    let melhorCorrelacao = -1;
    
    // Procurar o período (entre 2ms e 12ms - range da voz humana)
    const atrasoMin = Math.floor(sampleRate * 0.002);  // 2ms
    const atrasoMax = Math.floor(sampleRate * 0.012); // 12ms
    
    for (let atraso = atrasoMin; atraso < atrasoMax; atraso++) {
        let correlacao = 0;
        let divisor = 0;
        
        for (let i = 0; i < buffer.length - atraso; i++) {
            correlacao += buffer[i] * buffer[i + atraso];
            divisor += buffer[i] * buffer[i];
        }
        
        if (divisor > 0) {
            correlacao = correlacao / divisor;
            
            if (correlacao > melhorCorrelacao) {
                melhorCorrelacao = correlacao;
                melhorAtraso = atraso;
            }
        }
    }
    
    // Calcular frequência
    if (melhorAtraso > 0 && melhorCorrelacao > 0.1) {
        return sampleRate / melhorAtraso;
    }
    
    return 0;
}

// ===========================================
// Converter frequência para nota musical
// ===========================================
frequenciaParaNota(frequencia) {
    // Notas em Hz (afinação 440Hz)
    const notas = {
        'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
        'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
        'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
        'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
        'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
        'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
        'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
        'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
        'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
        'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
    };
    
    // Encontrar a nota mais próxima
    let melhorNota = null;
    let menorDiferenca = Infinity;
    
    for (const [nota, freq] of Object.entries(notas)) {
        const diferenca = Math.abs(frequencia - freq);
        if (diferenca < menorDiferenca && diferenca < freq * 0.06) { // 6% de tolerância
            menorDiferenca = diferenca;
            melhorNota = nota;
        }
    }
    
    return melhorNota;
}

// ===========================================
// Gerar melodia genérica (fallback)
// ===========================================
gerarMelodiaGenerica(acordes, duracao) {
    console.log('🎵 Gerando melodia genérica');
    const melodia = [];
    const numNotas = Math.floor(duracao / 0.5); // Uma nota a cada 0.5 segundos
    
    for (let i = 0; i < numNotas; i++) {
        const acordeAtual = acordes[Math.floor(i / 4) % acordes.length];
        const notaBase = acordeAtual.replace(/[^A-G#]/g, '');
        
        // Variação de oitava para ficar interessante
        const oitava = Math.random() > 0.7 ? '5' : '4';
        
        melodia.push({
            nota: notaBase + oitava,
            tempo: i * 0.5,
            duracao: 0.25
        });
    }
    
    return melodia;
}

    gerarPadraoBateria(bpm) {
        // Criar ritmo baseado no estilo
        const padrao = [];
        
        for (let i = 0; i < 16; i++) {
            if (i % 4 === 0) {
                padrao.push({ tempo: i * 0.25, tipo: 'kick' });
            }
            if (i % 2 === 1) {
                padrao.push({ tempo: i * 0.25, tipo: 'snare' });
            }
            if (i % 1 === 0) {
                padrao.push({ tempo: i * 0.25, tipo: 'hat' });
            }
        }
        
        return padrao;
    }

    criarSequencias(instrumentos, acordes, melodia, config) {
        // Criar sequência de piano/acordes
        if (instrumentos[0]) {
            const parteAcordes = new Tone.Part((time, acorde) => {
                // Verificar se é sampler ou sintetizador
                if (instrumentos[0].triggerAttackRelease) {
                    instrumentos[0].triggerAttackRelease(acorde + '3', '2n', time);
                }
            }, acordes.map((acorde, i) => [i * 2, acorde]));
            
            parteAcordes.loop = true;
            parteAcordes.loopEnd = '8m';
            parteAcordes.start(0);
        }
        
        // Criar sequência de baixo
        if (instrumentos[1]) {
            const notasBaixo = acordes.map(acorde => {
                const notaBase = acorde.replace(/[^A-G#]/g, '');
                return notaBase + '2';
            });
            
            const parteBaixo = new Tone.Part((time, nota) => {
                if (instrumentos[1].triggerAttackRelease) {
                    instrumentos[1].triggerAttackRelease(nota, '4n', time);
                }
            }, notasBaixo.map((nota, i) => [i * 2, nota]));
            
            parteBaixo.loop = true;
            parteBaixo.loopEnd = '8m';
            parteBaixo.start(0);
        }
        
        // Criar melodia
        if (melodia.length > 0 && instrumentos[0]) {
            const parteMelodia = new Tone.Part((time, nota) => {
                if (instrumentos[0].triggerAttackRelease) {
                    instrumentos[0].triggerAttackRelease(nota.nota, nota.duracao, time);
                }
            }, melodia);
            
            parteMelodia.start(0);
        }
    }

    limparTudo() {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }

    tocar() {
        Tone.Transport.start();
    }

    parar() {
        Tone.Transport.stop();
    }
}