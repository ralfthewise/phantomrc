class SmartTest
  defaults:
    fayeUri: 'http://192.168.10.10:9292/faye'
    clientChannel: '/client'
    serverChannel: '/server'
    verbose: true
    viewportWidth: 1024
    viewportHeight: 768

  constructor: (options) ->
    @options = $.extend({}, @defaults, options)

    @clickData = []
    @$logEl = $('#log-output')
    @$canvas = $('#phantom-canvas')
    @canvasCtx = @$canvas[0].getContext('2d')
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
    @$canvas.prop('width', @options.viewportWidth).prop('height', @options.viewportHeight)
    @_log('Recording new test')
    @testEvents = []

    @_publishMessage({type: 'startRecord'})
    @_publishMessage({type: 'setViewport', viewportTop: 0, viewportLeft: 0, viewportWidth: @options.viewportWidth, viewportHeight: @options.viewportHeight})
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
      else console.log('Unexpected server message: ', message)

  _render: () =>
    @canvasCtx.clearRect(0, 0, @options.viewportWidth, @options.viewportHeight)
    @canvasCtx.drawImage(@image, 0, 0) if @image
    if @clickData.length > 0
      $.each(@clickData, (i, click) =>
        @canvasCtx.beginPath()
        @canvasCtx.arc(click.x, click.y, click.radius, 0, 2 * Math.PI, false)
        @canvasCtx.fillStyle = "rgba(255, 0, 0, #{click.alpha})"
        @canvasCtx.fill()
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

    $('#phantom-canvas').on('click', (e) =>
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
    $('#phantom-canvas').off('click')
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
