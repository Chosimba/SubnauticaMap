var Util = {
	ajax:{
		get: function (url, data, success, failure) {
			var f = typeof failure === 'undefined' ? function () { } : failure;
			var s = typeof success === 'undefined' ? function () { } : success;

			var oReq = new XMLHttpRequest();

			oReq.addEventListener("load", s);
			oReq.addEventListener("error", f);
			oReq.open("GET", url);
			oReq.send();

		},
		getJSON: function (url, data, success, failure) {
            var f = typeof failure === 'undefined' ? function () { } : failure;
            var s = typeof success === 'undefined' ? function () { } : success;

            var oReq = new XMLHttpRequest();

            oReq.responseType = "json";

            oReq.addEventListener("load", function (e) {
                var response = e.target.response || "{}";
                s(response);
            });
            oReq.addEventListener("error", function (e) {
                var response = e.target.response || "{}";
                f(response);
            });
            oReq.open("GET", url);
            oReq.send();

		}
	},
	arr: {
		findByProp: function (propIn, valueIn) {
            var matchesProp = function (elem) { return elem[propIn] === valueIn; };
            return matchesProp;
		},
		findByPropObj: function (propObjIn) {
            var matchesProp = function (elem) {
                for (prop in propObjIn) {
                    if (elem[prop] !== propObjIn[prop]) return false;
                }
                return true;
            };
            return matchesProp;
		}
	},
	str: {
		objReplace: function (string, obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					var regExp = new RegExp("%" + prop + "%", "gi");
					string = string.replace(regExp, obj[prop]);
				}
			}
			return string;
		}
	}
};