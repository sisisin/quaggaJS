$(function() {
    var App = {
        init: function() {
            Quagga.init(this.state, function() {
                App.attachListeners();
                Quagga.start();
            });
        },
        config: {
            reader: "code_128",
            length: 10
        },
        attachListeners: function() {
            var self = this;

            $(".controls").on("click", "button.next", function(e) {
                e.preventDefault();
                Quagga.start();
            });

            $(".controls .reader-config-group").on("change", "input, select", function(e) {
                e.preventDefault();
                var $target = $(e.target),
                    value = $target.attr("type") === "checkbox" ? $target.prop("checked") : $target.val(),
                    name = $target.attr("name"),
                    states = self._convertNameToStates(name);

                console.log("Value of "+ states + " changed to " + value);
                self.setState(states, value);
            });
        },
        detachListeners: function() {
            $(".controls").off("click", "button.next");
            $(".controls .reader-config-group").off("change", "input, select");
        },
        _accessByPath: function(obj, path, val) {
            var parts = path.split('.'),
                depth = parts.length,
                setter = (typeof val !== "undefined") ? true : false;

            return parts.reduce(function(o, key, i) {
                if (setter && (i + 1) === depth) {
                    o[key] = val;
                }
                return key in o ? o[key] : {};
            }, obj);
        },
        _convertNameToStates: function(names) {
            return names.split(";").map(this._convertNameToState.bind(this));
        },
        _convertNameToState: function(name) {
            return name.replace("_", ".").split("-").reduce(function(result, value) {
                return result + value.charAt(0).toUpperCase() + value.substring(1);
            });
        },
        setState: function(paths, value) {
            var self = this;

            paths.forEach(function(path) {
                var mappedValue;
                if (typeof self._accessByPath(self.inputMapper, path) === "function") {
                    mappedValue = self._accessByPath(self.inputMapper, path)(value);
                }
                self._accessByPath(self.state, path, mappedValue);
            });

            console.log(JSON.stringify(self.state));
            App.detachListeners();
            Quagga.stop();
            App.init();
        },
        inputMapper: {
            decoder: {
                readers: function(value) {
                    return [value + "_reader"];
                }
            },
            inputStream: {
                src: function(value) {
                    return "../test/fixtures/" + value + "/"
                }
            }
        },
        state: {
            inputStream: { name: "Test",
                type: "ImageStream",
                src: "../test/fixtures/code_39_vin/",
                length: 10
            },
            decoder : {
                readers : ["code_39_vin_reader"],
                drawScanline: true,
            },
            numOfWorkers: 4,
            locator: {
                halfSample: false,
                showSkeleton: true,
                showFoundPatches: true
            }
        }
    };

    App.init();
    window.App = App;

    Quagga.onProcessed(function(result) {
        console.log('Quagga.onProcessed', result);
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
            }
        }
    });

    Quagga.onDetected(function(result) {
        var $node,
            canvas = Quagga.canvas.dom.image,
            detectedCode = result.codeResult.code;

        $node = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h4 class="code"></h4></div></div></li>');
        $node.find("img").attr("src", canvas.toDataURL());
        $node.find("h4.code").html(detectedCode);
        $("#result_strip ul.thumbnails").prepend($node);
    });
});
