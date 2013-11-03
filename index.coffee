class SmartTest
  defaults:
    fayeUri: 'http://localhost:9292/faye'
    clientChannel: '/client'
    serverChannel: '/server'
    verbose: true
    viewportWidth: 1024
    viewportHeight: 768

  constructor: (options) ->
    @options = $.extend({}, @defaults, options)

    @clickData = []
    @$logEl = $('#log-output')
    @$phantomCanvas = $('#phantom-canvas')
    @phantomCanvasCtx = @$phantomCanvas[0].getContext('2d')
    @$overlayCanvas = $('#overlay-canvas')
    @overlayCanvasCtx = @$overlayCanvas[0].getContext('2d')
    @$loadingContainer = $('.canvas-container .loading-container')
    @spinner = Spinners.create('.canvas-container .loading-container .loading'
      radius: 50
      height: 29
      width: 2.5
      dashes: 30
      opacity: 1
      padding: 3
      rotation: 1500
      color: '#000000'
    )
    @fayeClient = new Faye.Client(@options.fayeUri)
    @fayeClient.subscribe(@options.serverChannel, @_handleServerMessage)

    $('#test-input').on('keydown keypress keyup', (e) =>
      console.log('Key event: ', e)
      @_log('<div>Test Key input event: ' + e.type + ' ' + e.which + '</div>')
    )

  initialize: () ->
    $('#start-record').on('click', @recordTest)

  recordTest: () =>
    @_clearLog()
    $('.viewport-resize').prop('width', @options.viewportWidth).prop('height', @options.viewportHeight)
    $('.viewport-resize').css({width: @options.viewportWidth, height: @options.viewportHeight})
    @spinner.center()
    @_showLoading(true)

    @_log('Recording new test')
    @testEvents = []

    @_publishMessage({type: 'startRecord'})
    @_publishRecordMessage({type: 'setViewport', viewportTop: 0, viewportLeft: 0, viewportWidth: @options.viewportWidth, viewportHeight: @options.viewportHeight})
    uri = $('#uri').val()
    @_publishRecordMessage({type: 'goto', uri: uri}) if (uri? and uri isnt '')
    @_bindRecordEvents()

  runTest: () =>
    @_clearLog()
    @_log('Running test')
    @_publishMessage({type: 'runTest', test: @testEvents})

  _handleServerMessage: (message) =>
    console.log('Received server message: ', message)
    switch message.type
      when 'repaint' then @_repaint(message)
      when 'clickComponents' then @_clickComponents(message)
      when 'loading' then @_showLoading(message.state)
      else console.log('Unexpected server message: ', message)

  _showLoading: (state) =>
    if state
      @spinner.play()
      @$loadingContainer.show()
    else
      @$loadingContainer.hide()
      @spinner.stop()

  _render: () =>
    #@phantomCanvasCtx.clearRect(0, 0, @options.viewportWidth, @options.viewportHeight)
    #@phantomCanvasCtx.drawImage(@image, 0, 0) if @image
    @overlayCanvasCtx.clearRect(0, 0, @options.viewportWidth, @options.viewportHeight)
    if @clickData.length > 0
      $.each(@clickData, (i, click) =>
        @overlayCanvasCtx.beginPath()
        @overlayCanvasCtx.arc(click.x, click.y, click.radius, 0, 2 * Math.PI, false)
        @overlayCanvasCtx.fillStyle = "rgba(255, 0, 0, #{click.alpha})"
        @overlayCanvasCtx.fill()
      )

  _repaint: (message) =>
    image = new Image()
    image.onload = () =>
      @image = image
      @_render()
    image.src = message.image

  _addClick: (x, y) =>
    @clickData.push({alpha: 1.0, radius: 1, x: x, y: y})
    @_render()
    setTimeout(@_updateClicks, 25) if @clickData.length == 1

  _updateClicks: () =>
    $.each(@clickData, (i, click) =>
      click.alpha -= 0.05
      click.radius += 1
    )
    @clickData.shift() if @clickData[0].alpha <= 0.0
    @_render()
    setTimeout(@_updateClicks, 25) if @clickData.length > 0

  _clickComponents: (message) =>
    $('.test-steps-container').append("<div><strong>clickSelector:</strong>#{message.selector}</div>")
    $('.test-steps-container').append("<div><strong>clickElementContainingText:</strong>#{message.text}</div>")
    $('.test-steps-container').append("<div><strong>clickCoordinates:</strong>#{JSON.stringify(message.position)}</div>")

  _bindRecordEvents: () ->
    $('#goto').on('click', () =>
      uri = $('#uri').val()
      @_publishRecordMessage({type: 'goto', uri: uri}) if (uri? and uri isnt '')
    )
    $('#start-record').off('click', @recordTest)
    $('#start-record').prop('disabled', true)
    $('#stop-record').on('click', () =>
      @_unbindRecordEvents()
      @_publishMessage({type: 'stopRecord'})
    )

    @$overlayCanvas.on('click', (e) =>
      message = {type: e.type, position: {x: e.offsetX, y:e.offsetY}}
      @_publishRecordMessage(message)
      @_addClick(e.offsetX, e.offsetY)
    )

    $(document).on('keydown keypress keyup', (e) =>
      console.log('Key input event: ', e)
      keyInfo =
        code: e.which
        altKey: e.altKey
        ctrlKey: e.ctrlKey
        metaKey: e.metaKey
        shiftKey: e.shiftKey
      @_publishRecordMessage({type: e.type, key: keyInfo})
    )

  _unbindRecordEvents: () ->
    $(document).off('keydown keypress keyup')
    @$overlayCanvas.off('click')
    $('#stop-record').off('click')
    $('#start-record').prop('disabled', false)
    $('#start-record').on('click', @recordTest)
    $('#run-test').on('click', @runTest)

  _log: (msg) ->
    @$logEl.append("<div>#{msg}</div>") if @options.verbose
    @$logEl.scrollTop(@$logEl[0].scrollHeight)

  _clearLog: () ->
    @$logEl.empty()

  _publishRecordMessage: (message) ->
    now = new Date()
    @testEvents.push({type: 'sleep', ms: (now - @lastEventTime)}) if @testEvents.length > 0
    @lastEventTime = now
    @testEvents.push(message)
    @_publishMessage(message)

  _publishMessage: (message) ->
    @_log('Sending message: ' + JSON.stringify(message))
    @fayeClient.publish(@options.clientChannel, message)

window.SmartTest = SmartTest
