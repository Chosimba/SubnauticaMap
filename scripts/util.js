var Util = {
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
	},
	arr: {
		findByProp: function (propIn, valueIn) {
			var matchesProp = function (elem) { return elem[propIn] == valueIn; }
			return matchesProp;
		},
		findByPropObj: function (propObjIn) {
			var matchesProp = function (elem) {
				for (prop in propObjIn) {
					if (elem[prop] != propObjIn[prop]) return false;
				}
				return true;
			}
			return matchesProp;
		}
	}
};