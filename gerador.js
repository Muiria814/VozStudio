// gerador.js - Cria o instrumental baseado na voz
class GeradorMusical {
    constructor() {
        this.sintetizadores = {};
        this.sequencias = {};
        this.toneIniciado = false;
        this.samples = {
            piano: {},
            bateria: {},
            baixo: {}
        };
        this.vozPlayer = null; // Para guardar o player da voz
    }

    async iniciarTone() {
        if (!this.toneIniciado) {
            await Tone.start();
            this.toneIniciado = true;
        }
    }

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
    
    await this.carregarSamples();
    
    // Limpar músicas anteriores
    this.limparTudo();
    
    console.log('🎵 Configurações recebidas:', configuracoes);
    
    // Array para guardar todos os instrumentos
    const instrumentos = [];
    const instrumentosMap = {};
    
    // ===========================================
    // CRIAR CADA INSTRUMENTO INDIVIDUALMENTE
    // ===========================================
    
    // PIANO
    if (configuracoes.piano) {
        console.log('🎹 Criando piano...');
        const piano = await this.criarPiano();
        instrumentos.push(piano);
        instrumentosMap.piano = piano;
    }
    
    // BAIXO
    if (configuracoes.baixo) {
        console.log('🎸 Criando baixo...');
        const baixo = await this.criarBaixo();
        instrumentos.push(baixo);
        instrumentosMap.baixo = baixo;
    }
    
    // BATERIA
    if (configuracoes.bateria) {
        console.log('🥁 Criando bateria...');
        const bateria = await this.criarBateria(configuracoes.bpm);
        instrumentos.push(bateria.sampler || bateria.sintetizador);
        instrumentosMap.bateria = bateria;
    }
    
    // GUITARRA
    if (configuracoes.guitarra) {
        console.log('🎸 Criando guitarra...');
        const guitarra = await this.criarGuitarra();
        instrumentos.push(guitarra);
        instrumentosMap.guitarra = guitarra;
    }
    
    // CORDAS
    if (configuracoes.cordas) {
        console.log('🎻 Criando cordas...');
        // Usar sintetizador diferente para cordas
        const cordas = new Tone.Synth({
            oscillator: { type: 'sawtooth' },
            envelope: {
                attack: 0.1,
                decay: 0.2,
                sustain: 0.8,
                release: 1.5
            }
        }).toDestination();
        cordas.volume.value = -8;
        instrumentos.push(cordas);
        instrumentosMap.cordas = cordas;
    }
    
    // METAIS
    if (configuracoes.metal) {
        console.log('🎺 Criando metais...');
        // Sintetizador para metais
        const metal = new Tone.Synth({
            oscillator: { type: 'square' },
            envelope: {
                attack: 0.05,
                decay: 0.1,
                sustain: 0.6,
                release: 0.8
            }
        }).toDestination();
        metal.volume.value = -6;
        instrumentos.push(metal);
        instrumentosMap.metal = metal;
    }
    
    // ===========================================
    // VOZ GRAVADA
    // ===========================================
    if (analiseVoz.audioData) {
        console.log('🎤 Adicionando voz à música...');
        this.vozPlayer = new Tone.Player(analiseVoz.audioData).toDestination();
        this.vozPlayer.volume.value = -3;
        instrumentos.push(this.vozPlayer);
        instrumentosMap.voz = this.vozPlayer;
    }
    
    console.log(`✅ Total de instrumentos: ${instrumentos.length}`);
    
    // Gerar progressão de acordes baseada no estilo
    const acordes = this.gerarAcordes(
        configuracoes.estilo,
        configuracoes.tom,
        analiseVoz
    );
    console.log('🎵 Acordes gerados:', acordes);
    
    // Extrair melodia da voz (para os instrumentos)
    const melodia = this.adaptarMelodia(
        analiseVoz,
        configuracoes.tom,
        acordes
    );
    console.log(`🎵 Melodia gerada com ${melodia.length} notas`);
    
    // ===========================================
    // CRIAR SEQUÊNCIAS PARA CADA INSTRUMENTO
    // ===========================================
    
    // 1. ACORDES (piano, guitarra, cordas, metais)
    const instrumentosAcordes = [];
    if (instrumentosMap.piano) instrumentosAcordes.push({ inst: instrumentosMap.piano, tipo: 'piano', oitava: 3, duracao: '2n' });
    if (instrumentosMap.guitarra) instrumentosAcordes.push({ inst: instrumentosMap.guitarra, tipo: 'guitarra', oitava: 4, duracao: '4n' });
    if (instrumentosMap.cordas) instrumentosAcordes.push({ inst: instrumentosMap.cordas, tipo: 'cordas', oitava: 5, duracao: '1n' });
    if (instrumentosMap.metal) instrumentosAcordes.push({ inst: instrumentosMap.metal, tipo: 'metal', oitava: 4, duracao: '2n' });
    
    instrumentosAcordes.forEach(item => {
        const parteAcordes = new Tone.Part((time, acorde) => {
            item.inst.triggerAttackRelease(acorde + item.oitava, item.duracao, time);
        }, acordes.map((acorde, i) => [i * 2, acorde]));
        
        parteAcordes.loop = true;
        parteAcordes.loopEnd = '8m';
        parteAcordes.start(0);
        console.log(`✅ Sequência de acordes criada para ${item.tipo}`);
    });
    
    // 2. BAIXO
    if (instrumentosMap.baixo) {
        const notasBaixo = acordes.map(acorde => {
            const notaBase = acorde.replace(/[^A-G#]/g, '');
            return notaBase + '1'; // Baixo mais grave
        });
        
        const parteBaixo = new Tone.Part((time, nota) => {
            instrumentosMap.baixo.triggerAttackRelease(nota, '4n', time);
        }, notasBaixo.map((nota, i) => [i * 2, nota]));
        
        parteBaixo.loop = true;
        parteBaixo.loopEnd = '8m';
        parteBaixo.start(0);
        console.log('✅ Sequência de baixo criada');
    }
    
    // 3. BATERIA
    if (instrumentosMap.bateria) {
        const padrao = this.gerarPadraoBateria(configuracoes.bpm);
        
        padrao.forEach(nota => {
            Tone.Transport.schedule((time) => {
                if (instrumentosMap.bateria.sampler) {
                    if (nota.tipo === 'kick') instrumentosMap.bateria.sampler.triggerAttackRelease('kick', '16n', time);
                    else if (nota.tipo === 'snare') instrumentosMap.bateria.sampler.triggerAttackRelease('snare', '16n', time);
                    else if (nota.tipo === 'hat') instrumentosMap.bateria.sampler.triggerAttackRelease('hihat', '16n', time);
                } else if (instrumentosMap.bateria.sintetizador) {
                    if (nota.tipo === 'kick') {
                        instrumentosMap.bateria.sintetizador.triggerAttackRelease('C2', '16n', time);
                    } else if (nota.tipo === 'snare') {
                        instrumentosMap.bateria.sintetizador.triggerAttackRelease('E2', '16n', time);
                    } else {
                        instrumentosMap.bateria.sintetizador.triggerAttackRelease('G2', '32n', time);
                    }
                }
            }, nota.tempo);
        });
        console.log('✅ Sequência de bateria criada');
    }
    
    // 4. MELODIA PRINCIPAL (baseada na voz)
    if (melodia.length > 0) {
        // Escolher instrumento para a melodia (piano por padrão)
        let instMelodia = instrumentosMap.piano || instrumentosMap.guitarra || instrumentosMap.cordas;
        
        if (instMelodia) {
            const parteMelodia = new Tone.Part((time, nota) => {
                instMelodia.triggerAttackRelease(nota.nota, nota.duracao, time);
            }, melodia);
            
            parteMelodia.start(0);
            console.log('✅ Melodia principal criada');
        }
    }
    
    // 5. INICIAR A VOZ
    if (this.vozPlayer) {
        Tone.Transport.schedule((time) => {
            this.vozPlayer.start(time);
        }, 0);
        console.log('✅ Voz agendada');
    }
    
    // Iniciar tudo
    Tone.Transport.start();
    console.log('🎵 Transporte iniciado!');
    
    return {
        acordes,
        melodia,
        bpm: configuracoes.bpm,
        duracao: analiseVoz.duracao,
        instrumentos: Object.keys(instrumentosMap)
    };
}

    // ===========================================
    // MÉTODOS EXISTENTES (mantém iguais)
    // ===========================================
    
    async criarPiano() {
        if (Object.keys(this.samples.piano).length > 0) {
            console.log('🎹 Usando samples reais de piano');
            
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

    async criarBaixo() {
        if (Object.keys(this.samples.baixo).length > 0) {
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

    async criarBateria(bpm) {
        if (Object.keys(this.samples.bateria).length > 0) {
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
            
            const padrao = this.gerarPadraoBateria(bpm);
            
            return { sampler, padrao };
            
        } else {
            console.log('🥁 Usando sintetizador de bateria');
            const bateria = new Tone.MembraneSynth().toDestination();
            const padrao = this.gerarPadraoBateria(bpm);
            return { sintetizador: bateria, padrao };
        }
    }

    async criarGuitarra() {
    const guitarra = new Tone.Synth({
        oscillator: {
            type: 'triangle'
        },
        envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 0.5
        }
    }).toDestination();
    
    guitarra.volume.value = -4;
    return guitarra;
}

    gerarAcordes(estilo, tom, analiseVoz) {
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
        
        return acordesBase.map(acorde => 
            this.transporAcorde(acorde, tom)
        );
    }

    transporAcorde(acorde, novoTom) {
        const notas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const notaBase = acorde.replace(/[^A-G#]/g, '');
        const qualidade = acorde.replace(notaBase, '');
        
        const indiceAtual = notas.indexOf(notaBase);
        const indiceNovo = notas.indexOf(novoTom);
        
        const diferenca = indiceNovo - notas.indexOf('C');
        const novoIndice = (indiceAtual + diferenca + 12) % 12;
        
        return notas[novoIndice] + qualidade;
    }

    adaptarMelodia(analiseVoz, tom, acordes) {
        console.log('🎵 Extraindo melodia real da voz...');
        
        if (!analiseVoz.audioData) {
            console.log('⚠️ Sem dados de áudio, usando melodia genérica');
            return this.gerarMelodiaGenerica(acordes, analiseVoz.duracao || 30);
        }
        
        const notasCantadas = this.extrairNotasDaVoz(analiseVoz.audioData);
        
        if (notasCantadas.length === 0) {
            console.log('⚠️ Nenhuma nota detetada, usando genérica');
            return this.gerarMelodiaGenerica(acordes, analiseVoz.duracao || 30);
        }
        
        console.log(`✅ Detetadas ${notasCantadas.length} notas da voz`);
        
        const melodia = [];
        
        for (let i = 0; i < notasCantadas.length; i++) {
            const nota = notasCantadas[i];
            
            const notaMusical = this.frequenciaParaNota(nota.frequencia);
            
            if (notaMusical) {
                melodia.push({
                    nota: notaMusical,
                    tempo: nota.inicio,
                    duracao: Math.max(0.1, nota.duracao)
                });
            }
        }
        
        if (melodia.length === 0) {
            return this.gerarMelodiaGenerica(acordes, analiseVoz.duracao || 30);
        }
        
        return melodia;
    }

    extrairNotasDaVoz(audioBuffer) {
        const notas = [];
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        const janelaTamanho = 2048;
        const passo = 512;
        const limiarEnergia = 0.01;
        const minimoDuracao = 0.1;
        
        let notaAtual = null;
        
        for (let i = 0; i < channelData.length - janelaTamanho; i += passo) {
            const energia = this.calcularEnergia(channelData, i, janelaTamanho);
            
            if (energia > limiarEnergia) {
                const frequencia = this.detectarFrequencia(
                    channelData, i, janelaTamanho, sampleRate
                );
                
                if (frequencia >= 80 && frequencia <= 1100) {
                    if (!notaAtual) {
                        notaAtual = {
                            frequencia: frequencia,
                            inicio: i / sampleRate,
                            fim: i / sampleRate,
                            energias: [energia]
                        };
                    } else {
                        notaAtual.fim = (i + janelaTamanho) / sampleRate;
                        notaAtual.energias.push(energia);
                        
                        notaAtual.frequencia = 
                            (notaAtual.frequencia * (notaAtual.energias.length - 1) + frequencia) 
                            / notaAtual.energias.length;
                    }
                }
            } else {
                if (notaAtual) {
                    const duracao = notaAtual.fim - notaAtual.inicio;
                    if (duracao >= minimoDuracao) {
                        notas.push(notaAtual);
                    }
                    notaAtual = null;
                }
            }
        }
        
        if (notaAtual) {
            const duracao = notaAtual.fim - notaAtual.inicio;
            if (duracao >= minimoDuracao) {
                notas.push(notaAtual);
            }
        }
        
        return notas;
    }

    calcularEnergia(dados, inicio, tamanho) {
        let soma = 0;
        for (let i = 0; i < tamanho; i++) {
            if (inicio + i < dados.length) {
                soma += dados[inicio + i] * dados[inicio + i];
            }
        }
        return Math.sqrt(soma / tamanho);
    }

    detectarFrequencia(dados, inicio, tamanho, sampleRate) {
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
        
        const atrasoMin = Math.floor(sampleRate * 0.002);
        const atrasoMax = Math.floor(sampleRate * 0.012);
        
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
        
        if (melhorAtraso > 0 && melhorCorrelacao > 0.1) {
            return sampleRate / melhorAtraso;
        }
        
        return 0;
    }

    frequenciaParaNota(frequencia) {
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
        
        let melhorNota = null;
        let menorDiferenca = Infinity;
        
        for (const [nota, freq] of Object.entries(notas)) {
            const diferenca = Math.abs(frequencia - freq);
            if (diferenca < menorDiferenca && diferenca < freq * 0.06) {
                menorDiferenca = diferenca;
                melhorNota = nota;
            }
        }
        
        return melhorNota;
    }

    gerarMelodiaGenerica(acordes, duracao) {
        console.log('🎵 Gerando melodia genérica');
        const melodia = [];
        const numNotas = Math.floor(duracao / 0.5);
        
        for (let i = 0; i < numNotas; i++) {
            const acordeAtual = acordes[Math.floor(i / 4) % acordes.length];
            const notaBase = acordeAtual.replace(/[^A-G#]/g, '');
            
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
    console.log('🎵 Criando sequências baseadas na melodia da voz...');
    console.log('🎵 Melodia tem', melodia.length, 'notas');
    
    // Mapa de instrumentos para fácil acesso
    const instMap = {};
    
    // Identificar cada instrumento
    for (let i = 0; i < instrumentos.length; i++) {
        const inst = instrumentos[i];
        
        if (inst instanceof Tone.Player) {
            instMap.voz = inst;
            console.log('🎤 Voz encontrada');
        }
        else if (inst.sampler || inst.sintetizador) {
            instMap.bateria = inst;
            console.log('🥁 Bateria encontrada');
        }
        else if (inst instanceof Tone.MembraneSynth) {
            instMap.baixo = inst;
            console.log('🎸 Baixo encontrado');
        }
        else if (inst instanceof Tone.Sampler || inst instanceof Tone.Synth) {
            // Atribuir instrumentos disponíveis
            if (!instMap.piano) {
                instMap.piano = inst;
                console.log('🎹 Piano encontrado');
            } else if (!instMap.guitarra && config.guitarra) {
                instMap.guitarra = inst;
                console.log('🎸 Guitarra encontrada');
            } else if (!instMap.cordas && config.cordas) {
                instMap.cordas = inst;
                console.log('🎻 Cordas encontradas');
            } else if (!instMap.metal && config.metal) {
                instMap.metal = inst;
                console.log('🎺 Metais encontrados');
            }
        }
    }
    
    // ===========================================
    // 1. MELODIA PRINCIPAL (baseada na voz)
    //    Toca as notas exatas que foram cantadas
    // ===========================================
    if (melodia.length > 0) {
        // Instrumento principal para a melodia (piano por padrão)
        const instMelodia = instMap.piano || instMap.guitarra || instMap.cordas;
        
        if (instMelodia) {
            console.log('🎵 Criando melodia principal com', melodia.length, 'notas');
            
            // Tocar a melodia exata extraída da voz
            const parteMelodia = new Tone.Part((time, nota) => {
                instMelodia.triggerAttackRelease(nota.nota, nota.duracao, time);
            }, melodia);
            
            parteMelodia.start(0);
        }
    }
    
    // ===========================================
    // 2. HARMONIA (acompanhamento baseado na melodia)
    //    Piano, guitarra, cordas tocam variações
    // ===========================================
    if (melodia.length > 0) {
        // Criar harmonia a partir da melodia
        const notasHarmonia = [];
        
        // Pegar uma nota a cada 2 da melodia (simplificar)
        for (let i = 0; i < melodia.length; i += 2) {
            const notaMelodia = melodia[i];
            
            // Extrair a nota base (sem oitava)
            const notaBase = notaMelodia.nota.replace(/[0-9]/g, '');
            
            // Adicionar acorde baseado na nota (simplificado)
            notasHarmonia.push({
                nota: notaBase + '3', // Oitava mais grave
                tempo: notaMelodia.tempo,
                duracao: 0.5 // Mais longo
            });
            
            // Adicionar quinta para encorpar
            notasHarmonia.push({
                nota: this.getQuinta(notaBase) + '3',
                tempo: notaMelodia.tempo + 0.1,
                duracao: 0.5
            });
        }
        
        // Tocar harmonia no piano/guitarra
        const instHarmonia = [instMap.piano, instMap.guitarra, instMap.cordas, instMap.metal]
            .filter(i => i);
        
        instHarmonia.forEach((inst, idx) => {
            const offset = idx * 0.05; // Pequeno delay entre instrumentos
            
            const parteHarmonia = new Tone.Part((time, nota) => {
                let notaFinal = nota.nota;
                
                // Variações para cada instrumento
                if (inst === instMap.cordas) {
                    // Cordas tocam mais agudo
                    notaFinal = nota.nota.replace('3', '5');
                } else if (inst === instMap.metal) {
                    // Metais tocam com mais energia
                    notaFinal = nota.nota.replace('3', '4');
                }
                
                inst.triggerAttackRelease(notaFinal, nota.duracao, time + offset);
            }, notasHarmonia);
            
            parteHarmonia.start(0);
        });
        
        console.log('✅ Harmonia criada com', notasHarmonia.length, 'notas');
    }
    
    // ===========================================
    // 3. BAIXO (segue a melodia)
    // ===========================================
    if (instMap.baixo && melodia.length > 0) {
        const notasBaixo = [];
        
        // Pegar notas principais da melodia em oitava grave
        for (let i = 0; i < melodia.length; i += 3) {
            const notaMelodia = melodia[i];
            const notaBase = notaMelodia.nota.replace(/[0-9]/g, '');
            
            notasBaixo.push({
                nota: notaBase + '1', // Oitava mais grave
                tempo: notaMelodia.tempo,
                duracao: 0.3
            });
        }
        
        const parteBaixo = new Tone.Part((time, nota) => {
            instMap.baixo.triggerAttackRelease(nota.nota, nota.duracao, time);
        }, notasBaixo);
        
        parteBaixo.start(0);
        console.log('✅ Baixo criado com', notasBaixo.length, 'notas');
    }
    
    // ===========================================
    // 4. BATERIA (ritmo baseado na intensidade da voz)
    // ===========================================
    if (instMap.bateria && melodia.length > 0) {
        // Analisar intensidade das notas para criar ritmo
        const padraoBateria = [];
        
        for (let i = 0; i < melodia.length; i++) {
            const nota = melodia[i];
            const tempo = nota.tempo;
            
            // Kick nos tempos fortes
            if (i % 4 === 0) {
                padraoBateria.push({ tempo, tipo: 'kick' });
            }
            
            // Snare nos contratempos
            if (i % 2 === 1) {
                padraoBateria.push({ tempo: tempo + 0.1, tipo: 'snare' });
            }
            
            // Hi-hat em quase todas as notas
            if (i % 1 === 0) {
                padraoBateria.push({ tempo: tempo + 0.05, tipo: 'hat' });
            }
        }
        
        // Tocar bateria
        padraoBateria.forEach(nota => {
            Tone.Transport.schedule((time) => {
                if (instMap.bateria.sampler) {
                    if (nota.tipo === 'kick') instMap.bateria.sampler.triggerAttackRelease('kick', '16n', time);
                    else if (nota.tipo === 'snare') instMap.bateria.sampler.triggerAttackRelease('snare', '16n', time);
                    else if (nota.tipo === 'hat') instMap.bateria.sampler.triggerAttackRelease('hihat', '16n', time);
                } else if (instMap.bateria.sintetizador) {
                    if (nota.tipo === 'kick') {
                        instMap.bateria.sintetizador.triggerAttackRelease('C2', '16n', time);
                    } else if (nota.tipo === 'snare') {
                        instMap.bateria.sintetizador.triggerAttackRelease('E2', '16n', time);
                    } else {
                        instMap.bateria.sintetizador.triggerAttackRelease('G2', '32n', time);
                    }
                }
            }, nota.tempo);
        });
        
        console.log('✅ Bateria criada com', padraoBateria.length, 'golpes');
    }
    
    // ===========================================
    // 5. VOZ (a gravação original)
    // ===========================================
    if (instMap.voz) {
        Tone.Transport.schedule((time) => {
            instMap.voz.start(time);
            console.log('🎤 Voz iniciada em', time);
        }, 0);
    }
    
    console.log('✅ Todas as sequências criadas com sucesso!');
}

// Método auxiliar para obter a quinta de uma nota
getQuinta(nota) {
    const notas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index = notas.indexOf(nota);
    const quintaIndex = (index + 7) % 12; // Intervalo de quinta
    return notas[quintaIndex];
}

    limparTudo() {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        // Limpar o player da voz se existir
        if (this.vozPlayer) {
            this.vozPlayer.dispose();
            this.vozPlayer = null;
        }
    }

    tocar() {
        Tone.Transport.start();
    }

    parar() {
        Tone.Transport.stop();
    }
}