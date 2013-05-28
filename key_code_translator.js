(function() {
  var KeyCodeTranslator;

  KeyCodeTranslator = (function() {

    function KeyCodeTranslator() {}

    KeyCodeTranslator.prototype.getChar = function(page, code, shiftKey) {
      var ch, exceptions, special;
      if (code === 8) return page.event.key.Backspace;
      if (code === 13) return page.event.key.Enter;
      if (code === 16) return page.event.key.Shift;
      if ([16, 37, 38, 39, 40, 20, 17, 18, 91].indexOf(code) > -1) return code;
      exceptions = {
        186: 59,
        187: 61,
        188: 44,
        189: 45,
        190: 46,
        191: 47,
        192: 96,
        219: 91,
        220: 92,
        221: 93,
        222: 39
      };
      if (exceptions[code] != null) code = exceptions[code];
      ch = String.fromCharCode(code);
      if (shiftKey) {
        special = {
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
        };
        if (special[ch] != null) ch = special[ch];
      } else {
        ch = ch.toLowerCase();
      }
      return ch;
    };

    KeyCodeTranslator.prototype._log = function(msg) {
      return console.log(msg);
    };

    return KeyCodeTranslator;

  })();

  window.KeyCodeTranslator = KeyCodeTranslator;

}).call(this);
