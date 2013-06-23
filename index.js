(function() {
  var SmartTest,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  SmartTest = (function() {

    SmartTest.prototype.defaults = {
      fayeUri: 'http://adams.datastarved.net:9292/faye',
      clientChannel: '/client',
      serverChannel: '/server',
      verbose: true,
      viewportWidth: 1024,
      viewportHeight: 768
    };

    function SmartTest(options) {
      this._clickComponents = __bind(this._clickComponents, this);
      this._updateClicks = __bind(this._updateClicks, this);
      this._addClick = __bind(this._addClick, this);
      this._repaint = __bind(this._repaint, this);
      this._render = __bind(this._render, this);
      this._showLoading = __bind(this._showLoading, this);
      this._handleServerMessage = __bind(this._handleServerMessage, this);
      this.runTest = __bind(this.runTest, this);
      this.recordTest = __bind(this.recordTest, this);
      var _this = this;
      this.options = $.extend({}, this.defaults, options);
      this.clickData = [];
      this.$logEl = $('#log-output');
      this.$phantomCanvas = $('#phantom-canvas');
      this.phantomCanvasCtx = this.$phantomCanvas[0].getContext('2d');
      this.$overlayCanvas = $('#overlay-canvas');
      this.overlayCanvasCtx = this.$overlayCanvas[0].getContext('2d');
      this.$loadingContainer = $('.canvas-container .loading-container');
      this.spinner = Spinners.create('.canvas-container .loading-container .loading', {
        radius: 50,
        height: 29,
        width: 2.5,
        dashes: 30,
        opacity: 1,
        padding: 3,
        rotation: 1500,
        color: '#000000'
      });
      this.fayeClient = new Faye.Client(this.options.fayeUri);
      this.fayeClient.subscribe(this.options.serverChannel, this._handleServerMessage);
      $('#test-input').on('keydown keypress keyup', function(e) {
        console.log('Key event: ', e);
        return _this._log('<div>Test Key input event: ' + e.type + ' ' + e.which + '</div>');
      });
    }

    SmartTest.prototype.initialize = function() {
      return $('#start-record').on('click', this.recordTest);
    };

    SmartTest.prototype.recordTest = function() {
      var uri;
      this._clearLog();
      $('.viewport-resize').prop('width', this.options.viewportWidth).prop('height', this.options.viewportHeight);
      $('.viewport-resize').css({
        width: this.options.viewportWidth,
        height: this.options.viewportHeight
      });
      this.spinner.center();
      this._showLoading(true);
      this._log('Recording new test');
      this.testEvents = [];
      this._publishMessage({
        type: 'startRecord'
      });
      this._publishRecordMessage({
        type: 'setViewport',
        viewportTop: 0,
        viewportLeft: 0,
        viewportWidth: this.options.viewportWidth,
        viewportHeight: this.options.viewportHeight
      });
      uri = $('#uri').val();
      if ((uri != null) && uri !== '') {
        this._publishRecordMessage({
          type: 'goto',
          uri: uri
        });
      }
      return this._bindRecordEvents();
    };

    SmartTest.prototype.runTest = function() {
      this._clearLog();
      this._log('Running test');
      return this._publishMessage({
        type: 'runTest',
        test: this.testEvents
      });
    };

    SmartTest.prototype._handleServerMessage = function(message) {
      console.log('Received server message: ', message);
      switch (message.type) {
        case 'repaint':
          return this._repaint(message);
        case 'clickComponents':
          return this._clickComponents(message);
        case 'loading':
          return this._showLoading(message.state);
        default:
          return console.log('Unexpected server message: ', message);
      }
    };

    SmartTest.prototype._showLoading = function(state) {
      if (state) {
        this.spinner.play();
        return this.$loadingContainer.show();
      } else {
        this.$loadingContainer.hide();
        return this.spinner.stop();
      }
    };

    SmartTest.prototype._render = function() {
      var _this = this;
      this.overlayCanvasCtx.clearRect(0, 0, this.options.viewportWidth, this.options.viewportHeight);
      if (this.clickData.length > 0) {
        return $.each(this.clickData, function(i, click) {
          _this.overlayCanvasCtx.beginPath();
          _this.overlayCanvasCtx.arc(click.x, click.y, click.radius, 0, 2 * Math.PI, false);
          _this.overlayCanvasCtx.fillStyle = "rgba(255, 0, 0, " + click.alpha + ")";
          return _this.overlayCanvasCtx.fill();
        });
      }
    };

    SmartTest.prototype._repaint = function(message) {
      var image,
        _this = this;
      image = new Image();
      image.onload = function() {
        _this.image = image;
        return _this._render();
      };
      return image.src = message.image;
    };

    SmartTest.prototype._addClick = function(x, y) {
      this.clickData.push({
        alpha: 1.0,
        radius: 1,
        x: x,
        y: y
      });
      this._render();
      if (this.clickData.length === 1) return setTimeout(this._updateClicks, 25);
    };

    SmartTest.prototype._updateClicks = function() {
      var _this = this;
      $.each(this.clickData, function(i, click) {
        click.alpha -= 0.05;
        return click.radius += 1;
      });
      if (this.clickData[0].alpha <= 0.0) this.clickData.shift();
      this._render();
      if (this.clickData.length > 0) return setTimeout(this._updateClicks, 25);
    };

    SmartTest.prototype._clickComponents = function(message) {
      $('.test-steps-container').append("<div><strong>clickSelector:</strong>" + message.selector + "</div>");
      $('.test-steps-container').append("<div><strong>clickElementContainingText:</strong>" + message.text + "</div>");
      return $('.test-steps-container').append("<div><strong>clickCoordinates:</strong>" + (JSON.stringify(message.position)) + "</div>");
    };

    SmartTest.prototype._bindRecordEvents = function() {
      var _this = this;
      $('#goto').on('click', function() {
        var uri;
        uri = $('#uri').val();
        if ((uri != null) && uri !== '') {
          return _this._publishRecordMessage({
            type: 'goto',
            uri: uri
          });
        }
      });
      $('#start-record').off('click', this.recordTest);
      $('#start-record').prop('disabled', true);
      $('#stop-record').on('click', function() {
        _this._unbindRecordEvents();
        return _this._publishMessage({
          type: 'stopRecord'
        });
      });
      this.$overlayCanvas.on('click', function(e) {
        var message;
        message = {
          type: e.type,
          position: {
            x: e.offsetX,
            y: e.offsetY
          }
        };
        _this._publishRecordMessage(message);
        return _this._addClick(e.offsetX, e.offsetY);
      });
      return $(document).on('keydown keypress keyup', function(e) {
        var keyInfo;
        console.log('Key input event: ', e);
        keyInfo = {
          code: e.which,
          altKey: e.altKey,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey
        };
        return _this._publishRecordMessage({
          type: e.type,
          key: keyInfo
        });
      });
    };

    SmartTest.prototype._unbindRecordEvents = function() {
      $(document).off('keydown keypress keyup');
      this.$overlayCanvas.off('click');
      $('#stop-record').off('click');
      $('#start-record').prop('disabled', false);
      $('#start-record').on('click', this.recordTest);
      return $('#run-test').on('click', this.runTest);
    };

    SmartTest.prototype._log = function(msg) {
      if (this.options.verbose) this.$logEl.append("<div>" + msg + "</div>");
      return this.$logEl.scrollTop(this.$logEl[0].scrollHeight);
    };

    SmartTest.prototype._clearLog = function() {
      return this.$logEl.empty();
    };

    SmartTest.prototype._publishRecordMessage = function(message) {
      var now;
      now = new Date();
      if (this.testEvents.length > 0) {
        this.testEvents.push({
          type: 'sleep',
          ms: now - this.lastEventTime
        });
      }
      this.lastEventTime = now;
      this.testEvents.push(message);
      return this._publishMessage(message);
    };

    SmartTest.prototype._publishMessage = function(message) {
      this._log('Sending message: ' + JSON.stringify(message));
      return this.fayeClient.publish(this.options.clientChannel, message);
    };

    return SmartTest;

  })();

  window.SmartTest = SmartTest;

}).call(this);
