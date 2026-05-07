(function() {
    const canvas = document.getElementById('example');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    //código p/ testar funcionamento do canvas no slide
    canvas.width = 400;
    canvas.height = 300;

    const radius = 50; 

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 5;
    ctx.stroke();


    ctx.fillStyle = "rgba(0, 255, 204, 0.2)";
    ctx.fill();

    //escrever código aqui
})();