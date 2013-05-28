var webpage = require('webpage'),
    system = require('system'),
    sendingUpdates = false,
    page, address, output, size;

phantom.injectJs('faye.js');
phantom.injectJs('jquery-1.9.1.min.js');
phantom.injectJs('key_code_translator.js');

var fayeClient = new Faye.Client('http://localhost:9292/faye');
var keyTranslator = new KeyCodeTranslator();

function receiveMessage(message) {
  console.log('Message received: ' + JSON.stringify(message));
  switch(message.type) {
    case 'exit':
      phantom.exit();
    case 'startRecord':
      sendingUpdates = true;
      page = webpage.create();
      bindPageEvents();
      break;
    case 'setViewport':
      page.viewportSize = { width: message.viewportWidth, height: message.viewportHeight };
      page.clipRect = { top: message.viewportTop, left: message.viewportLeft, width: message.viewportWidth, height: message.viewportHeight };
      page.zoomFactor = 1.0;
      break;
    case 'stopRecord':
      sendingUpdates = false;
      if (page) {
        page.close();
        page = null;
      }
      break;
    case 'runTest':
      sendingUpdates = true;
      page = webpage.create();
      bindPageEvents();
      runTest(message.test);
      break;

    case 'goto':
      page.open(message.uri, function (status) {
        if (status !== 'success') {
          console.log('Unable to load the address!');
          phantom.exit();
        } else {
          window.setTimeout(function () {
            sendRenderUpdate();
          }, 100);
        }
      });
      break;
    case 'click':
      page.sendEvent('click', message.position.x, message.position.y);
      break;
    case 'keydown':
    //case 'keypress':
    case 'keyup':
      code = keyTranslator.getChar(page, message.key.code, message.key.shiftKey);

      modifier = 0;
      if (message.key.altKey) { modifier = modifier | 0x08000000; }
      if (message.key.ctrlKey) { modifier = modifier | 0x04000000; }
      if (message.key.metaKey) { modifier = modifier | 0x10000000; }
      if (message.key.shiftKey) { modifier = modifier | 0x02000000; }
      console.log('Triggering key: ' + code);
      page.sendEvent(message.type, code, null, null, modifier);
      break;
  }
}
fayeClient.subscribe('/client', receiveMessage);

var image;
function sendRenderUpdate() {
  if (sendingUpdates) {
    if (!loading) {
      var newImage = 'data:image/jpeg;base64,' + page.renderBase64('JPEG');
      if (image != newImage) {
        image = newImage;
        var publication = fayeClient.publish('/server', {image: image});

        publication.callback(function() {
          console.log('Message received by server!');
        });

        publication.errback(function(error) {
          console.log('There was a problem: ' + error.message);
        });
      }
    }

    window.setTimeout(function () {
      sendRenderUpdate();
    }, 100);
  }
}

function runTest(testSteps) {
  var testStepsLength = testSteps.length;
  for (var i = 0; i < testStepsLength; i++) {
    testStep = testSteps.shift();
    if (testStep.type == 'sleep') {
      console.log('Sleeping: ' + testStep.ms);
      window.setTimeout(function() { runTest(testSteps); }, testStep.ms);
      break;
    }
    receiveMessage(testStep);
  }
  if (testSteps.length == 0) {
    console.log('Test finished.');
    window.setTimeout(function() {
      sendingUpdates = false;
      page.close();
    }, 2000);
  }
}

var loading = false;
function bindPageEvents() {
  page.onLoadStarted = function(status) {
    console.log('onLoadStarted');
    loading = true;
  }
  page.onLoadFinished = function(status) {
    console.log('onLoadFinished: ' + status);
    loading = false;
  }
}
