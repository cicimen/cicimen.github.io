;(function(factory) {
	//'use strict';
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof exports !== 'undefined') {
		module.exports = factory(require('jquery'));
	} else {
		factory(jQuery);
	}
}(function($) {
	//'use strict';
	var EasyWheel = window.EasyWheel || {};
	EasyWheel = (function() {
		var instanceUid = 0;
		function EasyWheel(element, settings) {
			var self = this,
				dataSettings;
			self.defaults = {
				items: [],
				width: 400,
				fontSize: 14,
				textOffset: 8,
				textLine: 'h',
				textArc: false,
				letterSpacing: 0,
				textColor: '#fff',
				centerWidth: 45,
				shadow: '', // '#fff0', // egemen
				shadowOpacity: 0,
				centerLineWidth: 5,
				centerLineColor: '#424242',
				centerBackground: '#8e44ad',
				sliceLineWidth: 0,
				sliceLineColor: '#424242',
				selectedSliceColor: '#333',
				outerLineColor: '#424242',
				outerLineWidth: 5,
				centerImage: '', 
				centerHtml: '',
				centerHtmlWidth: 45,
				centerImageWidth: 45,
				rotateCenter: false,
				easing: 'easyWheel',
				markerAnimation: true,
				markerColor: '#CC3333',
				selector: "win",
				selected: [true],
				random: false,
				type: 'spin',
				duration: 8000,
				rotates: 8,
				max: 0,
				frame: 6,
				onStart: function(results, spinCount, now) {},
				onStep: function(results, slicePercent, circlePercent) {},
				onProgress: function(results, spinCount, now) {},
				onComplete: function(results, spinCount, now) {},
				onFail: function(results, spinCount, now) {},
			};
			dataSettings = $(element).data('easyWheel') || {};
			self.o = $.extend({}, self.defaults, settings, dataSettings);
			self.initials = {
				slice: {
					id: null,
					results: null,
				},
				currentSliceData: {
					id: null,
					results: null,
				},
				winner: 0,
				rotates: parseInt(self.o.rotates),
				spinCount: 0,
				counter: 0,
				now: 0,
				currentSlice: 0,
				currentStep: 0,
				lastStep: 0,
				slicePercent: 0,
				circlePercent: 0,
				items: self.o.items,
				spinning: false,
				inProgress: false,
				nonce: null,
				$wheel: $(element)
			};
			$.extend(self, self.initials);
			$.extend($.easing, {
				easyWheel: function(x, t, b, c, d) {
					return -c * ((t = t / d - 1) * t * t * t - 1) + b
				}
			});
			$.extend($.easing, {
				easeOutQuad: function(x, t, b, c, d) {
					return -c * (t /= d) * (t - 2) + b;
				}
			});
			$.extend($.easing, {
				MarkerEasing: function(x) {
					var n = (-Math.pow((1 - (x * 6)), 2) + 1);
					if (n < 0) n = 0;
					return n;
				}
			});
			self.instanceUid = 'ew' + self.guid();
			self.validate();
			self.init();
			window.easyWheel = self; // egemen
		}
		
		return EasyWheel;
	}());
	EasyWheel.prototype.validate = function(args) {
		var self = this;
		if (self.rotates < 1) {
			self.rotates = 1;
			console.log('warning', 'Min number of rotates is "1"');
		}
		if (parseInt(self.o.sliceLineWidth) > 10) {
			self.o.sliceLineWidth = 10;
			console.log('warning', 'Max sliceLineWidth is "10"');
		}
		if (parseInt(self.o.centerLineWidth) > 10) {
			self.o.centerLineWidth = 10;
			console.log('warning', 'Max centerLineWidth is "10"');
		}
		if (parseInt(self.o.outerLineWidth) > 10) {
			self.o.outerLineWidth = 10;
			console.log('warning', 'Max outerLineWidth is "10"');
		}
		if (typeof $.easing[$.trim(self.o.easing)] == 'undefined') {
			self.o.easing = 'easyWheel';
		}
	}
	EasyWheel.prototype.destroy = function(args) {
		var self = this;
		if (self.spinning) {
			self.spinning.finish();
		}
		if (typeof args === 'boolean' && args === true) self.$wheel.html('').removeClass(self.instanceUid);
		$.extend(self.o, self.defaults);
		$.extend(self, self.initials);
		$(document).off('click.' + self.instanceUid);
		$(document).off('resize.' + self.instanceUid);
	};
	EasyWheel.prototype.option = function(option, newValue) {
		var self = this;
		if ($.inArray(typeof newValue, ['undefined', 'function']) !== -1 || $.inArray(typeof self.o[option], ['undefined', 'function']) !== -1) return;
		var allowed = ['easing', 'type', 'duration', 'rotates', 'max'];
		if ($.inArray(option, allowed) == -1) return;
		self.o[option] = newValue;
	};
	EasyWheel.prototype.finish = function() {
		var self = this;
		if (self.spinning) {
			self.spinning.finish();
		}
	};
	EasyWheel.prototype.init = function() {
		var self = this;
		self.initialize();
		self.execute();
	};
	EasyWheel.prototype.initialize = function() {
		var self = this;
		self.$wheel.addClass('easyWheel ' + self.instanceUid);
		var color = '#ccc';
		var arcSize = 360 / self.totalSlices();
		var pStart = 0;
		var pEnd = 0;
		var colorIndex = 0;
		self.$wheel.html('');
		var wrapper = $('<div/>').addClass('eWheel-wrapper').appendTo(self.$wheel);
		var inner = $('<div/>').addClass('eWheel-inner').appendTo(wrapper);
		var spinner = $('<div/>').addClass('eWheel').prependTo(inner);
		var Layerbg = $('<div/>').addClass('eWheel-bg-layer').appendTo(spinner);
		var Layersvg = $(self.SVG('svg', {
			'version': '1.1',
			'xmlns': 'http://www.w3.org/2000/svg',
			'xmlns:xlink': 'http://www.w3.org/1999/xlink',
			'x': '0px',
			'y': '0px',
			'viewBox': '0 0 200 200',
			'xml:space': 'preserve',
			'style': 'enable-background:new 0 0 200 200;',
		}));
		Layersvg.appendTo(Layerbg);
		var slicesGroup = $('<g/>');
		var smallCirclesGroup = $('<g/>');
		slicesGroup.addClass('ew-slicesGroup').appendTo(Layersvg);

		if (self.o.textLine === 'v' || self.o.textLine === 'vertical') {
			var Layertext = $('<div/>');
			Layertext.addClass('eWheel-txt-wrap');
			Layertext.appendTo(spinner);
			var textHtml = $('<div/>');
			textHtml.addClass('eWheel-txt');
			textHtml.css({
				'-webkit-transform': 'rotate(' + ((-(360 / self.totalSlices()) / 2) + self.getDegree()) + 'deg)',
				'-moz-transform': 'rotate(' + ((-(360 / self.totalSlices()) / 2) + self.getDegree()) + 'deg)',
				'-ms-transform': 'rotate(' + ((-(360 / self.totalSlices()) / 2) + self.getDegree()) + 'deg)',
				'-o-transform': 'rotate(' + ((-(360 / self.totalSlices()) / 2) + self.getDegree()) + 'deg)',
				'transform': 'rotate(' + ((-(360 / self.totalSlices()) / 2) + self.getDegree()) + 'deg)'
			});
			textHtml.appendTo(Layertext);
		} else {
			var textsGroup = $('<g/>');
			var LayerDefs = $('<defs/>');
			LayerDefs.appendTo(Layersvg);
			textsGroup.appendTo(Layersvg);
		}
		var Layercenter = $('<div/>');
		Layercenter.addClass('eWheel-center');
		Layercenter.appendTo(self.o.rotateCenter === true || self.o.rotateCenter === "true" ? spinner : inner);
		if ((typeof self.o.centerHtml === 'string' && $.trim(self.o.centerHtml) === '') && (typeof self.o.centerImage === 'string' && $.trim(self.o.centerImage) !== '')) {
			var centerImage = $('<img />');
			if (!parseInt(self.o.centerImageWidth)) self.o.centerImageWidth = parseInt(self.o.centerWidth);
			centerImage.css('width', parseInt(self.o.centerImageWidth) + '%');
			centerImage.attr('src', self.o.centerImage);
			centerImage.appendTo(Layercenter);
			Layercenter.append('<div class="ew-center-empty" style="width:' + parseInt(self.o.centerImageWidth) + '%; height:' + parseInt(self.o.centerImageWidth) + '%" />');
		}
		if (typeof self.o.centerHtml === 'string' && $.trim(self.o.centerHtml) !== '') {
			var centerHtml = $('<div class="ew-center-html">' + self.o.centerHtml + '</div>');
			if (!parseInt(self.o.centerHtmlWidth)) self.o.centerHtmlWidth = parseInt(self.o.centerWidth);
			centerHtml.css({
				'width': parseInt(self.o.centerHtmlWidth) + '%',
				'height': parseInt(self.o.centerHtmlWidth) + '%'
			});
			centerHtml.appendTo(Layercenter);
		}
		var Layermarker = false;
		if ($.trim(self.o.type) !== 'color') {
			Layermarker = $('<div/>').addClass('eWheel-marker').appendTo(wrapper);
			Layermarker.append('<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 80 115" style="enable-background:new 0 0 80 115;" xml:space="preserve">' 
			+ '<g>' 
			+ '<circle cx="40" cy="25" r="25" fill="' + self.o.markerColor + '" />'
			+ '<path d="M41.5,103.1L63,34.5c0.3-1-0.4-2-1.5-2h-43c-1,0-1.8,1-1.5,2l21.5,68.6C39,104.5,41,104.5,41.5,103.1z" fill="' + self.o.markerColor + '" />'
			+ '<circle cx="40" cy="25" r="10" fill="#ffffff" />'
			+ '</g>' + '</svg>');
		}
		$.each(self.items, function(i, item) {
			var rotate = (360 / self.totalSlices()) * i;
			pEnd += arcSize;
			var arcD = self.annularSector({
				centerX: 100,
				centerY: 100,
				startDegrees: pStart,
				endDegrees: pEnd,
				innerRadius: parseInt(self.o.centerWidth) + 0.5,
				outerRadius: 100.5 - parseInt(self.o.outerLineWidth)
			});
			slicesGroup.append(self.SVG('path', {
				'stroke-width': 0,
				'fill': item.color,
				'data-fill': item.color,
				'd': arcD
			}));

			var smallCirclePosition = self.getSmallCirclePosition({
				centerX: 100,
				centerY: 100,
				startDegrees: pEnd - 0.5,
				endDegrees: pEnd + 0.5,
				innerRadius: parseInt(self.o.centerWidth),
				outerRadius: 100.5 - (parseInt(self.o.outerLineWidth) / 1.5)
			});

			var rectWidth = 10;
			var rectHeight = 3;
			var rectRotate = rotate + (360 / self.items.length);

			smallCirclesGroup.append(
				self.SVG('rect', {
					'x': smallCirclePosition[0] - 1.5,
					'y': smallCirclePosition[1] - 1.5,
					'rx': 5,
					'ry': 5,
					'width': rectWidth,
					'height': rectHeight,
					'style': 'fill:rgb(255,255,255);fill-opacity:1;',
					'transform': 'rotate(' + rectRotate + ' ' + smallCirclePosition[0] + ' ' +  smallCirclePosition[1] +  ')',
				})
			);
			
			smallCirclesGroup.append(
				self.SVG('circle', {
					'cx': smallCirclePosition[0],
					'cy': smallCirclePosition[1],
					'r': 1.5,
					'fill': 'black',
					'fill-opacity': 1
				})
			);
			
			
			var textColor = $.trim(self.o.textColor) !== 'auto' ? $.trim(self.o.textColor) : self.brightness(item.color);
			if (self.o.textLine === 'v' || self.o.textLine === 'vertical') {
				var LayerTitle = $('<div/>');
				LayerTitle.addClass('eWheel-title');
				LayerTitle.html(item.name);
				LayerTitle.css({
					paddingRight: parseInt(self.o.textOffset) + '%',
					'-webkit-transform': 'rotate(' + rotate + 'deg) translate(0px, -50%)',
					'-moz-transform': 'rotate(' + rotate + 'deg) translate(0px, -50%)',
					'-ms-transform': 'rotate(' + rotate + 'deg) translate(0px, -50%)',
					'-o-transform': 'rotate(' + rotate + 'deg) translate(0px, -50%)',
					'transform': 'rotate(' + rotate + 'deg) translate(0px, -50%)',
					'color': textColor
				});
				LayerTitle.appendTo(textHtml);
				if (self.toNumber(self.o.letterSpacing) > 0) textHtml.css('letter-spacing', self.toNumber(self.o.letterSpacing));
			} else {
				var LayerText = '<text stroke-width="0" fill="' + textColor + '" dy="' + (self.toNumber(self.o.textOffset)) + '%">' + '<textPath xlink:href="#ew-text-' + i + '" startOffset="50%" style="text-anchor: middle;">' + item.name + '</textPath>' + '</text>';
				textsGroup.css('font-size', parseInt(self.o.fontSize) / 2);
				if (parseInt(self.o.letterSpacing) > 0) textsGroup.css('letter-spacing', parseInt(self.o.letterSpacing));
				textsGroup.append(LayerText);
				var firstArcSection = /(^.+?)L/;
				var newD = firstArcSection.exec(arcD)[1];
				if (self.o.textArc !== true) {
					var secArcSection = /(^.+?)A/;
					var Commas = /(^.+?),/;
					var newc = secArcSection.exec(newD);
					var replaceVal = newD.replace(newc[0], "");
					var getFirstANumber = Commas.exec(replaceVal);
					var nval = replaceVal.replace(getFirstANumber[1], 0);
					newD = newD.replace(replaceVal, nval);
				}
				LayerDefs.append(self.SVG('path', {
					'stroke-width': 0,
					'fill': 'none',
					'id': 'ew-text-' + i,
					'd': newD
				}));
			}
			var LayerTitleInner = $('<div/>');
			LayerTitleInner.html(item);
			
			LayerTitleInner.appendTo(LayerTitle);
			pStart += arcSize;
		});
		var sliceLineWidth = parseInt(self.o.sliceLineWidth);
		if (self.o.textLine !== 'v' || self.o.textLine !== 'vertical') {}
		if (parseInt(self.o.centerWidth) > sliceLineWidth) {
			var centerCircle = self.SVG('circle', {
				'class': 'centerCircle',
				'cx': '100',
				'cy': '100',
				'r': parseInt(self.o.centerWidth) + 1,
				'stroke': self.o.centerLineColor,
				'stroke-width': parseInt(self.o.centerLineWidth),
				'fill': self.o.centerBackground
			});
			$(centerCircle).appendTo(Layersvg);
		}
		var outerLine = self.SVG('circle', {
			'cx': '100',
			'cy': '100',
			'r': 100 - (parseInt(self.o.outerLineWidth) / 2),
			'stroke': self.o.outerLineColor,
			'stroke-width': parseInt(self.o.outerLineWidth),
			'fill-opacity': 0,
			'fill': '#fff0'
		});
		$(outerLine).appendTo(Layersvg);
		smallCirclesGroup.addClass('ew-smallCirclesGroup').appendTo(Layersvg);
		Layerbg.html(Layerbg.html());
	};
	EasyWheel.prototype.toNumber = function(e) {
		return NaN === Number(e) ? 0 : Number(e)
	};
	EasyWheel.prototype.SVG = function(e, t) {
        var r = document.createElementNS("http://www.w3.org/2000/svg", e);
        for (var n in t) r.setAttribute(n, t[n]);
        return r
    };

	EasyWheel.prototype.getSmallCirclePosition = function(options) {
		var self = this;
		var lineSpace = parseInt(self.o.sliceLineWidth);
		var opts = self.oWithDefaults(options);
		return [opts.cx + opts.r2 * Math.cos((options.startDegrees + (lineSpace / 4)) * Math.PI / 180),
			opts.cy + opts.r2 * Math.sin((options.startDegrees + (lineSpace / 4)) * Math.PI / 180)
		];
	}

	EasyWheel.prototype.annularSector = function(options, line) {
		var self = this;
		var lineSpace = parseInt(self.o.sliceLineWidth);
		var opts = self.oWithDefaults(options);
		var p = [ 
			[opts.cx + opts.r2 * Math.cos((options.startDegrees + (lineSpace / 4)) * Math.PI / 180),
				opts.cy + opts.r2 * Math.sin((options.startDegrees + (lineSpace / 4)) * Math.PI / 180)
			],
			[opts.cx + opts.r2 * Math.cos((options.endDegrees - (lineSpace / 4)) * Math.PI / 180),
				opts.cy + opts.r2 * Math.sin((options.endDegrees - (lineSpace / 4)) * Math.PI / 180)
			],
			[opts.cx + opts.r1 * Math.cos((options.endDegrees - lineSpace) * Math.PI / 180), 
				opts.cy + opts.r1 * Math.sin((options.endDegrees - lineSpace) * Math.PI / 180)
			],
			[opts.cx + opts.r1 * Math.cos((options.startDegrees + lineSpace) * Math.PI / 180), 
				opts.cy + opts.r1 * Math.sin((options.startDegrees + lineSpace) * Math.PI / 180)
			],
		];
		var angleDiff = opts.closeRadians - opts.startRadians;
		
		var largeArc = (angleDiff % (Math.PI * 2)) > Math.PI ? 1 : 0;
		var N1 = 1;
		var N2 = 0;
		if (line === true && lineSpace >= parseInt(self.o.centerWidth)) {
			N1 = 0;
			N2 = 1;
		} else if (line !== true && lineSpace >= parseInt(self.o.centerWidth)) {
			N1 = 1;
			N2 = 1;
		}
		var cmds = [];
		cmds.push("M" + p[0].join());
		cmds.push("A" + [opts.r2, opts.r2, 0, largeArc, N1, p[1]].join());
		cmds.push("L" + p[2].join());
		cmds.push("A" + [opts.r1, opts.r1, 0, largeArc, N2, p[3]].join());
		cmds.push("z");
		return cmds.join(' ');
	}
	EasyWheel.prototype.oWithDefaults = function(o) {
		var o2 = {
			cx: o.centerX || 0,
			cy: o.centerY || 0,
			startRadians: (o.startDegrees || 0) * Math.PI / 180,
			closeRadians: (o.endDegrees || 0) * Math.PI / 180,
		};
		var t = o.thickness !== undefined ? o.thickness : 100;
		if (o.innerRadius !== undefined) o2.r1 = o.innerRadius;
		else if (o.outerRadius !== undefined) o2.r1 = o.outerRadius - t;
		else o2.r1 = 200 - t;
		if (o.outerRadius !== undefined) o2.r2 = o.outerRadius;
		else o2.r2 = o2.r1 + t;
		if (o2.r1 < 0) o2.r1 = 0;
		if (o2.r2 < 0) o2.r2 = 0;
		return o2;
	}
	EasyWheel.prototype.brightness = function(c) {
		var r, g, b, brightness;
		if (c.match(/^rgb/)) {
			c = c.match(/rgba?\(([^)]+)\)/)[1];
			c = c.split(/ *, */).map(Number);
			r = c[0];
			g = c[1];
			b = c[2];
		} else if ('#' == c[0] && 7 == c.length) {
			r = parseInt(c.slice(1, 3), 16);
			g = parseInt(c.slice(3, 5), 16);
			b = parseInt(c.slice(5, 7), 16);
		} else if ('#' == c[0] && 4 == c.length) {
			r = parseInt(c[1] + c[1], 16);
			g = parseInt(c[2] + c[2], 16);
			b = parseInt(c[3] + c[3], 16);
		}
		brightness = (r * 299 + g * 587 + b * 114) / 1000;
		if (brightness < 125) {
			return '#fff';
		} else {
			return '#333';
		}
	}
	EasyWheel.prototype.guid = function(r) {
		var t = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
			a = "";
		r || (r = 8);
		for (var o = 0; o < r; o++) a += t.charAt(Math.floor(Math.random() * t.length));
		return a
	};
	EasyWheel.prototype.randomColor = function() {
		for (var o = "#", r = 0; r < 6; r++) o += "0123456789ABCDEF" [Math.floor(16 * Math.random())];
		return o
	};
	EasyWheel.prototype.FontScale = function(slice) {
		var self = this;
		var Fscale = 1 + 1 * (self.$wheel.width() - parseInt(self.o.width)) / parseInt(self.o.width);
		if (Fscale > 4) {
			Fscale = 4;
		} else if (Fscale < 0.1) {
			Fscale = 0.1;
		}
		self.$wheel.find(".eWheel-wrapper").css('font-size', Fscale * 100 + '%');
	};
	EasyWheel.prototype.numberToArray = function(N) {
		var args = [];
		var i;
		for (i = 0; i < N; i++) {
			args[i] = i;
		}
		return args;
	};
	EasyWheel.prototype.totalSlices = function() {
		var self = this;
		return self.items.length;
	};
	EasyWheel.prototype.getDegree = function(id) {
		var self = this;
		return (360 / self.totalSlices());
	}
	EasyWheel.prototype.degStart = function(id) {
		var self = this;
		return 360 - (self.getDegree() * id);
	};
	EasyWheel.prototype.degEnd = function(id) {
		var self = this;
		return 360 - ((self.getDegree() * id) + self.getDegree());
	};
	EasyWheel.prototype.getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	};
	EasyWheel.prototype.calcSliceSize = function(slice) {
		var self = this;
		var start = self.degStart((slice)) - (parseInt(self.o.sliceLineWidth) + 2);
		var end = self.degEnd(slice) + (parseInt(self.o.sliceLineWidth) + 2);
		var results = [];
		results.start = start;
		results.end = end;
		return results;
	};
	EasyWheel.prototype.toObject = function(arr) {
		var rv = {};
		for (var i = 0; i < arr.length; ++i)
			if (arr[i] !== undefined) rv[i] = arr[i];
		return rv;
	}
	EasyWheel.prototype.WinnerSelector = function() {
		var self = this;
		var obj = {};
		if(typeof self.o.selector !== 'string')
			return false;
		$.each(self.items, function(i, item) {
			if(typeof item[self.o.selector] === 'object' || typeof item[self.o.selector] === 'array' || typeof item[self.o.selector] === 'undefined')
				return false;
			obj[i] = item[self.o.selector];
		});
		return obj;
	};
	EasyWheel.prototype.findWinner = function(value,type) {
		var self = this;
		var obj = undefined;
		if(type !== 'custom' && (typeof self.o.selector !== 'string' || typeof value === 'number') ){
			if(typeof self.items[value] === 'undefined')
				return undefined;
			return value;
		}
		$.each(self.items, function(i, item) {
			if(typeof item[self.o.selector] === 'object' || typeof item[self.o.selector] === 'array' || typeof item[self.o.selector] === 'undefined')
				return undefined;
			if( item[self.o.selector] === value){
				obj = i;
			}
		});
		return obj;
	};
	EasyWheel.prototype.selectedSliceID = function(index) {
		
		var self = this;
		var selector = self.WinnerSelector();
		self.selected = self.o.selected;
		if ($.type(self.selected) === 'object') {
			if (typeof self.selected[0] !== 'undefined' && self.selected[0].selectedIndex !== undefined) return self.selected[0].selectedIndex;
		} else if ($.type(self.selected) === 'array') {
			if(self.o.selector !== false){
				self.selected = $.map(selector,function(value, i) {
					if(value === self.o.selected[index])
					return i;
				});
			}else{
				self.selected = self.selected[index];
			}
		} else if ($.type(self.selected) === 'string' && self.o.selector !== false) {
			self.selected = self.findWinner(self.selected);
		} else if ($.type(self.selected) !== 'number') {
			return;
		}
		if(typeof self.findWinner(parseInt(self.selected)) === 'undefined')
			return;
		return parseInt(self.selected);
	};
	EasyWheel.prototype.start = function() {
		var self = this;
		self.run();
	};
	EasyWheel.prototype.run = function(selectedWinner) {
		var self = this;
		if (self.inProgress) return;
		if (selectedWinner || selectedWinner === 0) {
			var winner = self.findWinner(selectedWinner,'custom');
				
			if(typeof winner !== 'undefined'){
				self.slice.id = winner;
			}else{
				return;
			}
		} else {
			
			if (self.o.max !== 0 && self.counter >= self.o.max) return;
			
			if(self.o.selector !== false){
				self.slice.id = self.selectedSliceID(0);				
			} else if(self.o.random === true) {
				self.slice.id = self.getRandomInt(0, self.totalSlices() - 1);
			}else{
				return;
			}
		}
		self.inProgress = true;
		if (typeof self.items[self.slice.id] === 'undefined') return;
		self.slice.results = self.items[self.slice.id];
		self.slice.length = self.slice.id;
		self.o.onStart.call(self.$wheel, self.slice.results, self.spinCount, self.now);
		var selectedSlicePos = self.calcSliceSize(self.slice.id);
		//var randomize = self.getRandomInt(selectedSlicePos.start, selectedSlicePos.end); //egemen
		var randomize = selectedSlicePos.start + ((selectedSlicePos.end - selectedSlicePos.start) / 2)
		var _deg = (360 * parseInt(self.rotates)) + randomize;
		self.lastStep = -1;
		self.currentStep = 0;
		var MarkerAnimator = false;
		var MarkerStep;
		var currentSlice = 0;
		var temp = self.numberToArray(self.totalSlices()).reverse();
		if (parseInt(self.o.frame) !== 0) {
			var oldinterval = $.fx.interval;
			$.fx.interval = parseInt(self.o.frame);
		}
		self.spinning = $({
			deg: self.now
		}).animate({
			deg: _deg
		}, {
			duration: parseInt(self.o.duration),
			easing: $.trim(self.o.easing),
			step: function(now, fx) {
				if (parseInt(self.o.frame) !== 0) $.fx.interval = parseInt(self.o.frame);
				self.now = now % 360;
				if ($.trim(self.o.type) !== 'color') {
					self.$wheel.find('.eWheel').css({
						'-webkit-transform': 'rotate(' + self.now + 'deg)',
						   '-moz-transform': 'rotate(' + self.now + 'deg)',
						    '-ms-transform': 'rotate(' + self.now + 'deg)',
						     '-o-transform': 'rotate(' + self.now + 'deg)',
						        'transform': 'rotate(' + self.now + 'deg)'
					});
				}
				self.currentStep = Math.floor(now / (360 / self.totalSlices()));
				self.currentSlice = temp[self.currentStep % self.totalSlices()];
				var ewCircleSize = 400 * 4,
					ewTotalArcs = self.totalSlices(),
					ewArcSizeDeg = 360 / ewTotalArcs,
					ewArcSize = ewCircleSize / ewTotalArcs,
					point = ewCircleSize / 360,
					ewCirclePos = (point * self.now),
					ewCirclePosPercent = (ewCirclePos / ewCircleSize) * 100,
					ewArcPos = (((self.currentSlice + 1) * ewArcSize) - (ewCircleSize - (point * self.now))),
					ewArcPosPercent = (ewArcPos / ewArcSize) * 100,
					cpercent = ewCirclePosPercent,
					apercent = ewArcPosPercent;
				self.slicePercent = ewArcPosPercent;
				self.circlePercent = ewCirclePosPercent;
				self.o.onProgress.call(self.$wheel, self.slicePercent, self.circlePercent);
				if (self.lastStep !== self.currentStep) {
					self.lastStep = self.currentStep;
					if (self.o.markerAnimation === true && $.inArray($.trim(self.o.easing), ['easeInElastic', 'easeInBack', 'easeInBounce', 'easeOutElastic', 'easeOutBack', 'easeOutBounce', 'easeInOutElastic', 'easeInOutBack', 'easeInOutBounce']) === -1) {
						var Mduration = parseInt(self.o.duration) / (self.totalSlices());
						MarkerStep = -38;
						if (MarkerAnimator) MarkerAnimator.stop();
						MarkerAnimator = $({
							deg: 0
						}).animate({
							deg: MarkerStep
						}, {
							easing: "MarkerEasing",
							duration: (Mduration) / (360 / 360 * 2),
							step: function(now) {
								$(".eWheel-marker").css({
									'-webkit-transform': 'rotate(' + now + 'deg)',
									'-moz-transform': 'rotate(' + now + 'deg)',
									'-ms-transform': 'rotate(' + now + 'deg)',
									'-o-transform': 'rotate(' + now + 'deg)',
									'transform': 'rotate(' + now + 'deg)'
								});
							},
						});
					}
					if ($.trim(self.o.type) === 'color') {
						self.$wheel.find('svg>g.ew-slicesGroup>path').each(function(i) {
							$(this).attr('class', '').attr('fill', $(this).attr('data-fill'));
						});
						self.$wheel.find('svg>g.ew-slicesGroup>path').eq(self.currentSlice).attr('class', 'ew-ccurrent').attr('fill', self.o.selectedSliceColor);
						self.$wheel.find('.eWheel-txt>.eWheel-title').removeClass('ew-ccurrent');
						self.$wheel.find('.eWheel-txt>.eWheel-title').eq(self.currentSlice).addClass('ew-ccurrent');
					} else {
						self.$wheel.find('svg>g.ew-slicesGroup>path').attr('class', '');
						self.$wheel.find('svg>g.ew-slicesGroup>path').eq(self.currentSlice).attr('class', 'ew-current');
						self.$wheel.find('.eWheel-txt>.eWheel-title').removeClass('ew-current');
						self.$wheel.find('.eWheel-txt>.eWheel-title').eq(self.currentSlice).addClass('ew-current');
					}
					self.currentSliceData.id = self.currentSlice;
					self.currentSliceData.results = self.items[self.currentSliceData.id];
					self.currentSliceData.results.length = self.currentSliceData.id;
					self.o.onStep.call(self.$wheel, self.currentSliceData.results, self.slicePercent, self.circlePercent);
				}
				if (parseInt(self.o.frame) !== 0) $.fx.interval = oldinterval;
			},
			fail: function(animation, progress, remainingMs) {
				self.inProgress = false;
				self.o.onFail.call(self.$wheel, self.slice.results, self.spinCount, self.now);
			},
			complete: function(animation, progress, remainingMs) {
				self.inProgress = false;
				self.o.onComplete.call(self.$wheel, self.slice.results, self.spinCount, self.now);
			},
		});
		self.counter++;
		self.spinCount++;
	};
	EasyWheel.prototype.execute = function() {
		var self = this;
		self.currentSlice = self.totalSlices() - 1;
		self.$wheel.css('font-size', parseInt(self.o.fontSize));
		self.$wheel.width(parseInt(self.o.width));
		self.$wheel.height(self.$wheel.width());
		self.$wheel.find('.eWheel-wrapper').width(self.$wheel.width());
		self.$wheel.find('.eWheel-wrapper').height(self.$wheel.width());
		self.FontScale();
		$(window).on('resize.' + self.instanceUid, function() {
			self.$wheel.height(self.$wheel.width());
			self.$wheel.find('.eWheel-wrapper').width(self.$wheel.width());
			self.$wheel.find('.eWheel-wrapper').height(self.$wheel.width());
			self.FontScale();
		});
	};
	$.fn.easyWheel = function() {
		var self = this,
			opt = arguments[0],
			args = Array.prototype.slice.call(arguments, 1),
			arg2 = Array.prototype.slice.call(arguments, 2),
			l = self.length,
			i,
			apply,
			allowed = ['destroy', 'start', 'finish', 'option'];
		for (i = 0; i < l; i++) {
			if (typeof opt == 'object' || typeof opt == 'undefined') {
				self[i].easyWheel = new EasyWheel(self[i], opt);
			} else if ($.inArray($.trim(opt), allowed) !== -1) {
				if ($.trim(opt) === 'option') {
					apply = self[i].easyWheel[opt].apply(self[i].easyWheel, args, arg2);
				} else {
					apply = self[i].easyWheel[opt].apply(self[i].easyWheel, args);
				}
			}
			if (typeof apply != 'undefined') return apply;
		}
		return self;
	};
}));