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
    bgSrc:"./subnautica_map.png",
    bindFilterEvents: function () {
        d("#type_filters .filter-row").on("click", function (e) {
            if (this === e.target) this.querySelectorAll("input")[0].click();
        });

        d("#set_scale_select").on("change", function (e) {
            var newScale = e.target.value;
            SubnauticaMap.main.reScale(newScale);
        });
        d(".filter-check").on("change", function (e) {
            var flipOn = e.target.checked;
            var filterID = parseInt(e.target.value);
            var filterType = e.target.attributes["data-filtertype"].value;
            var filterObj = SubnauticaMap.currentFilters.find(Util.arr.findByPropObj({ ID: filterID, TYPE: filterType }));
            if (filterObj) filterObj.SHOW = flipOn;
            SubnauticaMap.needsFiltering = true;
            SubnauticaMap.refreshMap();
        });

        d("#depth_slider").on("input", function (e) {
            var myVal = e.target.value;
            d("#man_depth_input").val(myVal);
        });
        d("#depth_slider").on("change", function (e) {
            SubnauticaMap.currentMaxDepth = parseInt(e.target.value);
            SubnauticaMap.needsFiltering = true;
            SubnauticaMap.refreshMap();
        });
    },
    categories: [],
    currentCellSize: 100,
    currentFilters: [],
    currentMaxDepth: 2000,
    currentNodes: [],
    currentScale: 50,
    events: {
        CanvasClick: function (event) {
            var hoverNode = SubnauticaMap.isOverNode(event.layerX, event.layerY);
            SubnauticaMap.setActiveNode(hoverNode);

            if (hoverNode === null) return;
            SubnauticaMap.updateActiveNodeData();
        },
        CanvasMouseMove: function (event) {
            if (SubnauticaMap.isDragging) return;
            var hoverNode = SubnauticaMap.isOverNode(event.layerX, event.layerY);
            SubnauticaMap.main.setCursor(hoverNode === null ? "default" : "pointer");
            var x = event.layerX, y = event.layerY;
            x = x - SubnauticaMap.main.mouseOffset, y = (y - SubnauticaMap.main.mouseOffset) * -1;
            x = x * (100 / SubnauticaMap.main.scale), y = y * (100 / SubnauticaMap.main.scale);
            d("#mouse_coords").html(parseInt(x) + " , " + parseInt(y));
        },
        CanvasMouseWheel: function (event) {
            var tempScale = 50;

            if (event.deltaMode === 1) tempScale = SubnauticaMap.currentScale + event.deltaY * -1;
            else if (event.deltaMode === 0) {
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
        if(SubnauticaMap.needsFiltering) {
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
            SubnauticaMap.needsFiltering = false;
        }
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
        this.main = new Canvass(d("#can"), { containerID: SubnauticaMap.holder });
        this.load(true, "./json/dynamic.json");
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
    lastHolderPosition: { left: 0, top: 0 },
    getData: function (useDirectJSON, jsonPath, cb) {
        if (useDirectJSON) {
            this.nodes      = nodeJSON;
            this.categories = categoriesJSON;
            this.types      = typesJSON;
            var callback    = jsonPath && !cb ? jsonPath : cb;
            if (callback) callback();
        }
        else {
            Util.ajax.getJSON(jsonPath, { cb: new Date().getTime() }, function (data) {
                SubnauticaMap.nodes      = data.NODES;
                SubnauticaMap.categories = data.CATEGORIES;
                SubnauticaMap.types      = data.TYPES;

                var callback = jsonPath && !cb ? jsonPath : cb;
                if (callback) callback();
            }, function (error) {
                if (error) { console.log(error.MESSAGE || "Unable to load"); }
            });
        }
    },
    load: function (isDynamic, dynamicPath) {
        if (isDynamic) {
            SubnauticaMap.getData(false, dynamicPath, function () {
                SubnauticaMap.currentNodes = SubnauticaMap.nodes;
                SubnauticaMap.sortNodes();
                SubnauticaMap.prepareMainCanvas();
                SubnauticaMap.fillFilters();
            });
        }
        else {
            SubnauticaMap.getData(true, function () {
                SubnauticaMap.currentNodes = SubnauticaMap.nodes;
                SubnauticaMap.sortNodes();
                SubnauticaMap.prepareMainCanvas();
                SubnauticaMap.fillFilters();
            });
        }
    },
    main: null,
    needsFiltering:true,
    nodes: [],
    prepareMainCanvas: function () {
        var main = this.main;
            main.on('click', SubnauticaMap.events.CanvasClick);
            main.on('mousemove', SubnauticaMap.events.CanvasMouseMove);
            main.setScale(SubnauticaMap.currentScale);
            main.setBounds();
            main.paintBackground(SubnauticaMap.bgSrc, function () {
                SubnauticaMap.main.reScale(SubnauticaMap.currentScale);
            });
            if(SubnauticaMap.showGrid) main.paintGrid(SubnauticaMap.currentCellSize);
            main.moveToOrigin();
            SubnauticaMap.paintNodes();
            main.resizeContainer(main.halfWidth, main.halfHeight);

        d("#outer").on('wheel', SubnauticaMap.events.CanvasMouseWheel);
        d("#outer").on('mousemove', SubnauticaMap.events.HolderMouseMove);
        d("#outer").on('mousedown', SubnauticaMap.events.HolderMouseDown);
        d("#outer").on('mouseup', SubnauticaMap.events.HolderMouseUp);

        d("body").on('mouseup mouseout', SubnauticaMap.events.HolderMouseUp);

        d(".more-link").on('click', function (e) {
            var isExpanding = e.target.textContent.toLowerCase() === "show more";
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

        d("#show_grid_check").on('change', function (e) {
            SubnauticaMap.showGrid = e.target.checked;
            SubnauticaMap.refreshMap();
        });

        d("#cell_grid_input").on("change", function (e) {
            var targetValue = parseInt(e.target.value);
            targetValue = targetValue < 10 ? 10 : targetValue > 1000 ? 1000 : targetValue;
            SubnauticaMap.currentCellSize = targetValue;
            SubnauticaMap.refreshMap();
        });

    },
    paintNodes:function () {
        var me = this.main;
        var ctx = me.artist;

        SubnauticaMap.currentNodes.forEach(function (node) {
            var flipX = node.coords.x, flipY = node.coords.y * -1;
            me.paintCircle(flipX, flipY, me.nodeRadius, {
                shouldStroke: true,
                color: SubnauticaMap.getTypeColor(node.type)
            });
        });
    },
    refreshMap: function () {

        this.filterNodes();

        var main = this.main;
        main.clear();
        main.setScale(SubnauticaMap.currentScale);
        main.setBounds();
        main.paintBackground();
        if (SubnauticaMap.showGrid) main.paintGrid(SubnauticaMap.currentCellSize);
        main.moveToOrigin();
        SubnauticaMap.paintNodes();
    },
    setActiveNode: function (node) {
        this.activeNode = node;
        if (node === null) return;
        this.needsUpdate = true;
    },
    showGrid:false,
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
    types: [],
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