# pogo
guitar loop controller with midi extension
function keyboard(octs, parent) {
    var container = document.createElement('div');
    this.container = container;
    var canvas = document.createElement('canvas');
    canvas.width = ((octs * (96 + 2))) - 2;
    canvas.height = (pWidth * 2);
    canvas.style.position = "relative";
    canvas.style.bottom = "-50px";

    var octave = new Image(96, 80);
    octave.src = "img/octave.png";
    octave.onload = function() {
        var ctx = canvas.getContext("2d");
        ctx.scale(1, 1);
        for (var i = 0; i < octs; i++) {
            ctx.drawImage(octave, (i * (96 + 2)), 0, 96, 80);
        }
        container.appendChild(canvas);
        parent.appendChild(container);
    }
