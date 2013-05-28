(function() {
  var SmartTest,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  SmartTest = (function() {

    SmartTest.prototype.defaults = {
      fayeUri: 'http://192.168.10.10:9292/faye',
      clientChannel: '/client',
      serverChannel: '/server',
      verbose: true,
      viewportWidth: 1024,
      viewportHeight: 768
    };

    function SmartTest(options) {
      this._repaint = __bind(this._repaint, this);
      this.runTest = __bind(this.runTest, this);
      this.recordTest = __bind(this.recordTest, this);
      var _this = this;
      this.options = $.extend({}, this.defaults, options);
      this.$logEl = $('#log-output');
      this.$canvas = $('#phantom-canvas');
      this.canvasCtx = this.$canvas[0].getContext('2d');
      this.fayeClient = new Faye.Client(this.options.fayeUri);
      this.fayeClient.subscribe(this.options.serverChannel, this._repaint);
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
      this.$canvas.prop('width', this.options.viewportWidth).prop('height', this.options.viewportHeight);
      this._log('Recording new test');
      this.testEvents = [];
      this._publishMessage({
        type: 'startRecord'
      });
      this._publishMessage({
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

    SmartTest.prototype._repaint = function(message) {
      var image,
        _this = this;
      image = new Image();
      image.onload = function() {
        _this.canvasCtx.clearRect(0, 0, _this.options.viewportWidth, _this.options.viewportHeight);
        return _this.canvasCtx.drawImage(image, 0, 0);
      };
      return image.src = message.image;
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
      $('#phantom-canvas').on('click', function(e) {
        var message;
        message = {
          type: e.type,
          position: {
            x: e.offsetX,
            y: e.offsetY
          }
        };
        return _this._publishRecordMessage(message);
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
      $('#phantom-canvas').off('click');
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
