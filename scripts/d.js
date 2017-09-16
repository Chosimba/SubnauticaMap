var dInner = {
    dItem: function (args) {
        this.elems = [];
        this.length = 0;
        if (!args) {

        }
        if (typeof args === 'string') dInner.handleCssSelector(this, args);
        else if (typeof args === 'object') dInner.handleObject(this, args);
    },
    handleCssSelector: function (dItem, selector) {
        var domElems = Array.from(document.querySelectorAll(selector));
        domElems.forEach(function (dElem) { dItem.elems.push(dElem); });
        dItem.length = domElems.length;
    },
    handleObject: function (dItem, obj) { },
    init: function () {
        dInner.dItem.prototype.val = function (valIn) {
            if (!valIn) {
                if (this.elems.length == 0) return undefined;
                else return this.elems[0].value;
            }
            else {
                if (this.elems.length == 0) return undefined;
                else {
                    this.elems.forEach(function (elem) {
                        elem.value = valIn;
                    });
                }
            }
        };
        dInner.dItem.prototype.on = function (events, func) {
            this.elems.forEach(function (elem) {
                elem.addEventListener(events, func);
            });
        };
        dInner.dItem.prototype.each = function (func) {
            this.elems.forEach(func);
            return this;
        };
        dInner.dItem.prototype.find = function (selector) {
            var item = new dInner.dItem();
            this.elems.forEach(function (elem) {
                var innerElems = Array.from(elem.querySelectorAll(selector));
                innerElems.forEach(function (iElem) { item.elems.push(iElem); });
            });
            item.length = item.elems.length;
            return item;
        };
        dInner.dItem.prototype.append = function (html) {
            var elem = document.createElement('div');
            elem.innerHTML = html;
            var elemChildren = Array.from(elem.children);
            this.elems.forEach(function (node) {
                elemChildren.forEach(function (cNode) { node.appendChild(cNode.cloneNode(true)); });
            });
            return this;
        };
        dInner.dItem.prototype.html = function (newHTML) {
            if (newHTML) {
                this.elems.forEach(function (elem) {
                    elem.innerHTML = newHTML;
                })
            }
            else {
                var outHTML = "";
                this.elems.forEach(function (elem) {
                    outHTML += elem.innerHTML;
                });
                return outHTML;
            }
        };
    },
    ajaxGet: function (url, data, success, failure) {
        var f = typeof failure == 'undefined' ? function () { } : failure;
        var s = typeof success == 'undefined' ? function () { } : success;
    }

};
dInner.init();
function d(selector) {
    if (typeof document.querySelectorAll !== 'function') alert("Cannot use on this browser!");
    return new dInner.dItem(selector);
};