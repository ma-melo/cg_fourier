(function() {
const canvas = document.getElementById('fourierCanvas');
const ctx = canvas.getContext('2d');

let time = 0;
let wave = [];
let numHarmonics = 10; 
let centerX, centerY; /* nó pricinpal do movimento hierarquico.*/

const colorBone = '#555';       // Cor dos braços
const colorJoint = '#ff0055';   // Cor das articulações
const colorEndEffector = '#fff';// Cor da ponta que desenha
const colorWave = '#00ffcc'; 

function init(){
    canvas.width = window.innerWidth;
    canvas.height = 450;

    //ponto onde encontra-se a raíz fixada
    centerX = 300;
    centerY = canvas.height/ 2;
    wave = [];
}

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = centerX;
    let y = centerY;

    // Criando a cadeia hierárquica
    for( let i= 0; i< numHarmonics; i++){
        let prevX = x;
        let prevY = y;

        let n = i * 2 + 1;
        //comprimento do braço dinimui c/ frequência 1/n
        let radius = 150*(4/(n * Math.PI));

        // movimento hierárquico
        // a posição atual é somada à rotação dos anteriores
        x += radius * Math.cos(n * time);
        y += radius * Math.sin(n * time);

        //braços
        ctx.beginPath();
        ctx.strokeStyle = colorBone;
            
        ctx.lineWidth = Math.max(1, 10 - i * 0.5); // a espessura do braço vai diminuindo
        ctx.lineCap = 'round';
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();

        //juntas
        ctx.beginPath();
        ctx.fillStyle= colorJoint;
        ctx.arc(prevX, prevY, Math.max(2, 6 - i*0.3), 0, Math.PI * 2);
        ctx.fill();


        //circulos
        ctx.beginPath();
        ctx.strokeStyle= colorBone;
        ctx.lineWidth = 0.5;
        ctx.arc(prevX, prevY, 150 * (4 / (i * Math.PI)), 0, Math.PI * 2);
        ctx.stroke();

    }

    // armazenar ponto
    wave.unshift(y);

    // limitar tamanho corretamente
    const maxLength = canvas.width - (centerX + 200);
    if (wave.length > maxLength && maxLength > 0) {
        wave.pop();
    }

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.moveTo(x, y);
    ctx.lineTo(centerX + 200, wave[0]);
    ctx.stroke();

    // desenhar onda
    ctx.beginPath();
    ctx.strokeStyle = colorWave;
    ctx.lineWidth= 3;
    ctx.lineJoin = 'round';

    // ponto inicial
    if (wave.length > 0) {
        ctx.moveTo(centerX + 200, wave[0]);

        for (let i = 1; i < wave.length; i++) {
            ctx.lineTo(centerX + 200 + i, wave[i]);
        }
    }

    ctx.stroke();



    time -= 0.02; 
    requestAnimationFrame(draw);
}


// Interação: use as setas para cima/baixo para mudar os harmônicos
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') numHarmonics++;
    if (e.key === 'ArrowLeft' && numHarmonics > 1) numHarmonics--;
});


init();
draw();

})();