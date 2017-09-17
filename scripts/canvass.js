    function Canvass(elem, opts) {
        this.elem = elem instanceof Node ? elem :
            elem instanceof dInner.dItem ? elem.elems[0] : null;

        opts = opts || {};
        this.containerID = opts.containerID || "";

        this.artist = this.elem.getContext("2d");
        this.width = 4000;
        this.height = 4000;
        this.halfWidth = 2000;
        this.halfHeight = 2000;
        this.nodeRadius = 15;
        this.scale = 50;
        this.mouseOffset = 1000;

        this.artist.globalAlpha = 1;
    }
    Canvass.prototype.clear = function () {
        this.artist.translate(-this.halfWidth, -this.halfHeight);
        this.artist.clearRect(0, 0, this.elem.width, this.elem.height);
    };
    Canvass.prototype.moveToOrigin = function () {
        var me = this;
        var ctx = me.artist;
        ctx.translate(me.halfWidth, me.halfHeight);
    };
    Canvass.prototype.on = function (events, func) {
        this.elem.addEventListener(events, func);
    };
    Canvass.prototype.paintBackground = function (src, cb) {
        var ctx = this.artist;
        var img;
        if (document.getElementById("bg_map_image") !== null) {
            img = document.getElementById("bg_map_image");
            ctx.drawImage(img, 0, 0, this.width, this.height);
        }
        else {
            var w = this.width, h = this.height;
            img = document.createElement("IMG");
            img.id = "bg_map_image";
            img.src = src;
            img.style.display = "none";
            document.body.appendChild(img);
            img.onload = function (e) {
                if (cb) cb(); 
            };
        }
    };
    Canvass.prototype.paintCircle = function (x, y, radius, opts) {
        var ctx = this.artist;
        if (!opts) opts = { color: "green", shouldStroke: true };
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = opts.color;
        ctx.fill();
        if (opts.shouldStroke) {
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.lineWidth = 1;
        }
    };
    Canvass.prototype.paintGrid = function (cellSize) {
        var ctx = this.artist;
        var thingW = this.width / cellSize,
            thingH = this.height / cellSize;

        for (var i = 0; i < thingW; i += 1) {
            if (i == 0) continue;
            var xPos = i * cellSize;
            var isXAxis = xPos == this.halfWidth;

            if (isXAxis) {
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 5;
            }
            else {
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
            }
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, this.elem.height);
            ctx.stroke();
        }

        for (var j = 0; j < thingH; j += 1) {
            if (j == 0) continue;
            var yPos = j * cellSize;
            var isYAxis = yPos == this.halfHeight;

            if (isYAxis) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 5;
            }
            else {
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
            }
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(this.elem.width, yPos);
            ctx.stroke();
        }

    };
    Canvass.prototype.paintText = function (text, x, y, opts) {
        opts = opts || {};

        var ctx = this.artist;
        var currentFillStyle = ctx.fillStyle,
            currentStrokeStyle = ctx.strokeStyle,
            currentFont = ctx.font,
            currentLineWidth = ctx.lineWidth;

        ctx.font = opts.font || 'bold 48px Verdana';
        ctx.fillStyle = opts.color || 'white';
        ctx.fillText(text, x, y);
        ctx.fillStyle = currentFillStyle;

        if (opts.stroke) {
            ctx.strokeStyle = opts.strokeColor || 'black';
            ctx.lineWidth = 2;
            ctx.strokeText(text, x, y);
            ctx.strokeStyle = currentStrokeStyle;
            ctx.lineWidth = currentLineWidth;
        }
    };
    Canvass.prototype.reScale = function (newScale) {
        SubnauticaMap.currentScale = parseInt(newScale);
        var ratio = 100 / newScale;
        SubnauticaMap.main.resizeContainer(SubnauticaMap.main.width / ratio, SubnauticaMap.main.height / ratio);
        SubnauticaMap.refreshMap();
    };
    Canvass.prototype.resizeContainer = function (w, h) {
        var container = document.getElementById(this.containerID);
            container.style.width = w + "px";
            container.style.height = h + "px";
    };
    Canvass.prototype.setBounds = function (w, h) {
        if (!w && !h) {
            this.elem.width = this.width;
            this.elem.height = this.height;
            this.elem.style.width = this.width + "px";
            this.elem.style.height = this.height + "px";
            this.halfWidth = parseInt(this.width / 2);
            this.halfHeight = parseInt(this.height / 2);
        }
        else {
            this.elem.width = w;
            this.elem.height = h;

            this.elem.style.width = w + "px";
            this.elem.style.height = h + "px";

            this.halfWidth = parseInt(w / 2);
            this.halfHeight = parseInt(h / 2);
        }
        this.artist.scale(this.scale / 100, this.scale / 100);
    };
    Canvass.prototype.setCursor = function (curString) {
        this.elem.style.cursor = curString;
    };
    Canvass.prototype.setNodeRadius = function (newRadius) {
        if (newRadius >= 1) this.nodeRadius = newRadius;
    };
    Canvass.prototype.setScale = function (scale) {
        var ratio = 100 / scale;
        this.scale = scale;
        this.mouseOffset = this.halfWidth / ratio;
    };