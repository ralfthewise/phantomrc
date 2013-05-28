class KeyCodeTranslator

  #taken from https://github.com/bpeacock/key-to-charCode/blob/master/jQuery.getChar.js
  getChar: (page, code, shiftKey) ->
    return page.event.key.Backspace if code is 8
    return page.event.key.Enter if code is 13
    return page.event.key.Shift if code is 16

    #Ignore Shift Key events & arrows
    return code if([16, 37, 38, 39, 40, 20, 17, 18, 91].indexOf(code) > -1)

    #These are special cases that don't fit the ASCII mapping
    exceptions =
      186: 59 # ;
      187: 61 # =
      188: 44 # ,
      189: 45 # -
      190: 46 # .
      191: 47 # /
      192: 96 # `
      219: 91 # [
      220: 92 # \
      221: 93 # ]
      222: 39 # '
    code = exceptions[code] if exceptions[code]?

    ch = String.fromCharCode(code)

    #handle shift key
    if(shiftKey)
      special =
        1: '!',
        2: '@',
        3: '#',
        4: '$',
        5: '%',
        6: '^',
        7: '&',
        8: '*',
        9: '(',
        0: ')',
        ',': '<',
        '.': '>',
        '/': '?',
        ';': ':',
        "'": '"',
        '[': '{',
        ']': '}',
        '\\': '|',
        '`': '~',
        '-': '_',
        '=': '+'

      ch = special[ch] if special[ch]?
    else
      ch = ch.toLowerCase()

    #return ch.charCodeAt(0)
    return ch

  _log: (msg) ->
    console.log(msg)

window.KeyCodeTranslator = KeyCodeTranslator
