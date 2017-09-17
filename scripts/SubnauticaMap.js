var SubnauticaMap = {
    Canvas: function (elem) {
        this.elem = elem instanceof Node ? elem :
                    elem instanceof dInner.dItem ? elem.elems[0] : null;

        this.artist = this.elem.getContext("2d");
        this.width = 4000;       
        this.height = 4000;      
        this.halfWidth = 2000;   
        this.halfHeight = 2000;  
        this.nodeRadius = 15;	 
        this.scale = 50;         
        this.mouseOffset = 1000; 

        this.artist.globalAlpha = 1;
    },
    activeNode: null,
    bindFilterEvents: function () {
        d("#type_filters .filter-row").on("click", function (e) {
            if (this == e.target) this.querySelectorAll("input")[0].click();
        });

        d("#set_scale_select").on("change", function (e) {
            var newScale = e.target.value;
            SubnauticaMap.main.reScale(newScale);
        });
        d(".filter-check").on("change", function (e) {
            var flipOn = e.target.checked;
            var filterID = e.target.value;
            var filterType = e.target.attributes["data-filtertype"].value;
            var filterObj = SubnauticaMap.currentFilters.find(Util.arr.findByPropObj({ ID: filterID, TYPE: filterType }));
            if (filterObj) filterObj.SHOW = flipOn;
            SubnauticaMap.refreshMap();
        });

        d("#depth_slider").on("input", function (e) {
            var myVal = e.target.value;
            d("#man_depth_input").val(myVal);
        });
        d("#depth_slider").on("change", function (e) {
            SubnauticaMap.currentMaxDepth = parseInt(e.target.value);
            SubnauticaMap.refreshMap();
        });
    },
    categories: categoriesJSON,
    currentCellSize: 100,
    currentFilters: [],
    currentMaxDepth: 2000,
    currentNodes: [],
    currentScale: 50,
    events: {
        CanvasClick: function (event) {
            var hoverNode = SubnauticaMap.isOverNode(event.layerX, event.layerY);
            SubnauticaMap.setActiveNode(hoverNode);

            if (hoverNode == null) return;
            SubnauticaMap.updateActiveNodeData();
        },
        CanvasMouseMove: function (event) {
            if (SubnauticaMap.isDragging) return;
            var hoverNode = SubnauticaMap.isOverNode(event.layerX, event.layerY);
            SubnauticaMap.main.setCursor(hoverNode == null ? "default" : "pointer");
            var x = event.layerX, y = event.layerY;
            x = x - SubnauticaMap.main.mouseOffset, y = (y - SubnauticaMap.main.mouseOffset) * -1;
            x = x * (100 / SubnauticaMap.main.scale), y = y * (100 / SubnauticaMap.main.scale);
            d("#mouse_coords").html(parseInt(x) + " , " + parseInt(y));
        },
        CanvasMouseWheel: function (event) {
            var tempScale = 50;

            if (event.deltaMode == 1) tempScale = SubnauticaMap.currentScale + event.deltaY * -1;
            else if (event.deltaMode == 0) {
                var tempDelta = event.deltaY * 10 * -1;
                var ratio = SubnauticaMap.main.width / tempDelta;
                tempScale = SubnauticaMap.currentScale + ratio;
            }
            else {
                tempScale = 50;
            }

            if (tempScale <= 10) tempScale = 10;
            else if (tempScale >= 100) tempScale = 100;

            SubnauticaMap.main.reScale(tempScale);
        },
        HolderMouseDown: function (event) {
            SubnauticaMap.isDragging = true;
            SubnauticaMap.lastClickPosition = { x: event.clientX, y: event.clientY };
        },
        HolderMouseMove: function (event) {
            if (SubnauticaMap.isDragging) {
                var holder  = d("#canvas_holder");
                var oldX    = SubnauticaMap.lastClickPosition.x;
                var newX    = event.clientX;
                var holderX = SubnauticaMap.lastHolderPosition.left;

                var oldY    = SubnauticaMap.lastClickPosition.y;
                var newY    = event.clientY;
                var holderY = SubnauticaMap.lastHolderPosition.top;

                var deltaX, deltaY;

                if (oldX > newX) deltaX = holderX - (oldX - newX);
                else if (oldX < newX) deltaX = holderX + (newX - oldX);
                else deltaX = holderX;

                if (oldY > newY)      deltaY = holderY - (oldY - newY);
                else if (oldY < newY) deltaY = holderY + (newY - oldY);
                else deltaY = holderY;

                holder.elems[0].style.top  = deltaY + "px";
                holder.elems[0].style.left = deltaX + "px";

                SubnauticaMap.lastClickPosition  = { x: event.clientX, y: event.clientY };
                SubnauticaMap.lastHolderPosition = { left: deltaX, top: deltaY };
            }
        },
        HolderMouseUp: function (event) {
            SubnauticaMap.isDragging = false;
        }
    },
    fillFilters: function () {
        var filterTemplate = d("#filter_row_template").html();
        var typeHTML  = "";
        var biomeHTML = "";

        SubnauticaMap.types.push({ "ID": -1, "NAME": "Other", "COLOR": "#DDDDDD" });
        for (var i = 0; i < SubnauticaMap.types.length; i += 1) {
            var typ = SubnauticaMap.types[i];
            var typeNam = typ.NAME.toLowerCase().replace(/ |_/g, "");
            typeHTML += Util.str.objReplace(filterTemplate, {
                filtertype: "type",
                name: typeNam,
                text: typ.NAME,
                color: typ.COLOR,
                id: typ.ID
            });
            var tfilterObj = { ID: typ.ID, TYPE: "type", SHOW: true };
            this.currentFilters.push(tfilterObj);
        }

        SubnauticaMap.categories.push({ "ID": -1, "NAME": "Other" });
        for (var j = 0; j < SubnauticaMap.categories.length; j += 1) {
            var cat = SubnauticaMap.categories[j];
            var nam = cat.NAME.toLowerCase().replace(/ |_/g, "");
            biomeHTML += Util.str.objReplace(filterTemplate, {
                filtertype: "biome",
                text: cat.NAME,
                name: nam,
                id: cat.ID
            });
            var cfilterObj = { ID: cat.ID, TYPE: "biome", SHOW: true };
            this.currentFilters.push(cfilterObj);
        }

        d("#type_filters").html(typeHTML);
        d("#biome_filters").html(biomeHTML);

        SubnauticaMap.bindFilterEvents();
    },
    filterNodes: function () {
        SubnauticaMap.currentNodes = SubnauticaMap.nodes.filter(function (elem) {
            var typeSearchObj = { ID: elem.type, TYPE: "type" };
            var typeFilterObj = SubnauticaMap.currentFilters.find(Util.arr.findByPropObj(typeSearchObj));
            var showType = !typeFilterObj ? true : typeFilterObj.SHOW;

            var biomeSearchObj = { ID: elem.category, TYPE: "biome" };
            var biomeFilterObj = SubnauticaMap.currentFilters.find(Util.arr.findByPropObj(biomeSearchObj));
            var showBiome = !biomeFilterObj ? true : biomeFilterObj.SHOW;

            var showDepth = SubnauticaMap.currentMaxDepth >= elem.coords.depth * -1;

            return showType && showBiome && showDepth;
        });
    },
    getCategoryText: function (catID) {
        var txt = SubnauticaMap.categories.find(Util.arr.findByProp("ID", catID));
        return !txt ? "--" : txt.NAME;
    },
    getTypeColor: function (typeID) {
        var typeColor = SubnauticaMap.types.find(Util.arr.findByProp("ID", typeID));
        return !typeColor ? "#DDDDDD" : typeColor.COLOR;
    },
    getTypeText: function (typID) {
        var txt = SubnauticaMap.types.find(Util.arr.findByProp("ID", typID));
        return !txt ? "--" : txt.NAME;
    },
    holder: "canvas_holder",
    init: function () {
        this.protos();
        this.currentNodes = this.nodes;
        this.sortNodes();
        this.main = new this.Canvas(d("#can"));
        this.prepareMainCanvas();
        this.fillFilters();
    },
    isDragging:false,
    isOverNode: function (x, y) {
        x = x - SubnauticaMap.main.mouseOffset, y = (y - SubnauticaMap.main.mouseOffset) * -1;
        x = x * (100 / SubnauticaMap.main.scale), y = y * (100 / SubnauticaMap.main.scale);
        for (var i = 0; i < SubnauticaMap.currentNodes.length; i += 1) {
            var coords = SubnauticaMap.currentNodes[i].coords;
            var minx = coords.x - SubnauticaMap.main.nodeRadius, maxx = coords.x + SubnauticaMap.main.nodeRadius;
            var miny = coords.y - SubnauticaMap.main.nodeRadius, maxy = coords.y + SubnauticaMap.main.nodeRadius;
            if (x > minx && x < maxx && y > miny && y < maxy) return SubnauticaMap.currentNodes[i];
        }
        return null;
    },
    lastClickPosition: { x: 0, y: 0 },
    lastHolderPosition: {left:0, top:0},
    main: null,
    nodes: nodeJSON,
    prepareMainCanvas: function () {
        var main = this.main;
            main.on('click', SubnauticaMap.events.CanvasClick);
            main.on('mousemove', SubnauticaMap.events.CanvasMouseMove);
            main.setScale(SubnauticaMap.currentScale);
            main.setBounds();
            main.paintGrid(SubnauticaMap.currentCellSize);
            main.moveToOrigin();
            main.paintNodes();
            main.resizeContainer(main.halfWidth, main.halfHeight);

        d("#outer").on('wheel', SubnauticaMap.events.CanvasMouseWheel);
        d("#outer").on('mousemove', SubnauticaMap.events.HolderMouseMove);
        d("#outer").on('mousedown', SubnauticaMap.events.HolderMouseDown);
        d("#outer").on('mouseup', SubnauticaMap.events.HolderMouseUp);

        d("body").on('mouseup mouseout', SubnauticaMap.events.HolderMouseUp);

        d(".more-link").on('click', function (e) {
            var isExpanding = e.target.textContent.toLowerCase() == "show more";
            var filterBox   = d("#biome_filters");

            if (isExpanding) {
                filterBox.removeClass("collapse");
                filterBox.addClass("expand");
                e.target.textContent = "Show Less";
            }
            else {
                filterBox.removeClass("expand");
                filterBox.addClass("collapse");
                e.target.textContent = "Show More";
            }
        });
    },
    protos: function () {
        this.Canvas.prototype.clear = function () {
            this.artist.translate(-this.halfWidth, -this.halfHeight);
            this.artist.clearRect(0, 0, this.elem.width, this.elem.height);
        };
        this.Canvas.prototype.moveToOrigin = function () {
            var me  = this;
            var ctx = me.artist;
            ctx.translate(me.halfWidth, me.halfHeight);
        };
        this.Canvas.prototype.on = function (events, func) {
            this.elem.addEventListener(events, func);
        };
        this.Canvas.prototype.paintCircle = function (x, y, radius, opts) {
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
        this.Canvas.prototype.paintGrid = function (cellSize) {
            var ctx = this.artist;
            var thingW = this.width / cellSize,
                thingH = this.height / cellSize;
            var img;
            if (d("#bg_map_image").length > 0) {
                img = d("#bg_map_image").elems[0];
                ctx.drawImage(img, 0, 0, this.width, this.height);
            }
            else {
                var w = this.width, h = this.height;
                img = document.createElement("IMG");
                img.id = "bg_map_image";
                img.src = "./subnautica_map.png";
                img.style.display = "none";
                document.body.appendChild(img);
                img.onload = function (e) {
                    SubnauticaMap.main.reScale(SubnauticaMap.currentScale);
                };
            }

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
        this.Canvas.prototype.paintNodes = function () {
            var me = this;
            var ctx = me.artist;

            SubnauticaMap.currentNodes.forEach(function (node) {
                var flipX = node.coords.x, flipY = node.coords.y * -1;
                me.paintCircle(flipX, flipY, me.nodeRadius, {
                    shouldStroke: true,
                    color: SubnauticaMap.getTypeColor(node.type)
                });
            });
        };
        this.Canvas.prototype.reScale = function (newScale) {
            SubnauticaMap.currentScale = parseInt(newScale);
            var ratio = 100 / newScale;
            SubnauticaMap.main.resizeContainer(SubnauticaMap.main.width / ratio, SubnauticaMap.main.height / ratio);
            SubnauticaMap.refreshMap();
        };
        this.Canvas.prototype.resizeContainer = function (w, h) {
            var holder = document.getElementById(SubnauticaMap.holder);
            holder.style.width = w + "px";
            holder.style.height = h + "px";
        };
        this.Canvas.prototype.scrollTo = function (scrollTop, scrollLeft) {
            var holder = document.getElementById("outer");
            holder.scrollTop = scrollTop;
            holder.scrollLeft = scrollLeft;
        };
        this.Canvas.prototype.setBounds = function (w, h) {
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
        this.Canvas.prototype.setCursor = function (curString) {
            this.elem.style.cursor = curString;
        };
        this.Canvas.prototype.setNodeRadius = function (newRadius) {
            if (newRadius >= 1) this.nodeRadius = newRadius;
        };
        this.Canvas.prototype.setScale = function (scale) {
            var ratio = 100 / scale;
            this.scale = scale;
            this.mouseOffset = this.halfWidth / ratio;
        };
    },
    refreshMap: function () {

        this.filterNodes();

        var main = this.main;
        main.clear();
        main.setScale(SubnauticaMap.currentScale);
        main.setBounds();
        main.paintGrid(SubnauticaMap.currentCellSize);
        main.moveToOrigin();
        main.paintNodes();
    },
    setActiveNode: function (node) {
        this.activeNode = node;
        if (node == null) return;
        this.needsUpdate = true;
    },
    sortNodes: function () {
        SubnauticaMap.currentNodes.sort(function (a, b) {
            if (a.coords.x < b.coords.x) return -1;
            else if (a.coords.x > b.coords.x) return 1;
            else {
                if (a.coords.y < b.coords.y) return -1;
                else if (a.coords.y > b.coords.y) return 1;
                else return 0;
            }
        });
    },
    types: typesJSON,
    updateActiveNodeData: function () {
        if (!this.needsUpdate) return;

        var template = d("#node_info_template").html();
        var node = this.activeNode;
        var headerColor = SubnauticaMap.getTypeColor(node.type);

        var freshHTML = Util.str.objReplace(template, {
            x: node.coords.x,
            y: node.coords.y,
            headercolor: headerColor,
            depth: node.coords.depth * -1,
            description: node.description,
            category: SubnauticaMap.getCategoryText(node.category),
            type: SubnauticaMap.getTypeText(node.type)
        });
        d("#info_holder").html(freshHTML);
    }
};

window.onload = function () {
    SubnauticaMap.init(); 
};