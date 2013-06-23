(function() {
  var ElementAnalyzer,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ElementAnalyzer = (function() {

    function ElementAnalyzer() {
      this.getElementComponents = __bind(this.getElementComponents, this);
    }

    ElementAnalyzer.prototype.getElementComponents = function(page, x, y) {
      var components,
        _this = this;
      components = page.evaluate(function(x, y) {
        var chainStart, clickEl, getChainStart, getSelectorChain, getSelectorFromEl, position, selector, text;
        clickEl = document.elementFromPoint(x, y);
        console.log('clickEl: ', clickEl);
        getChainStart = function(el, stopEl) {
          var tmpEl;
          tmpEl = el;
          console.log('tmpEl: ', tmpEl);
          while (tmpEl !== stopEl && (tmpEl.parentNode != null)) {
            console.log('tmpEl: ', tmpEl, tmpEl.parentNode);
            if (tmpEl.id) return tmpEl;
            tmpEl = tmpEl.parentNode;
          }
          return tmpEl;
        };
        getSelectorFromEl = function(el) {
          var classNames, elSel;
          elSel = el.tagName.toLowerCase();
          classNames = el.className.split(' ');
          classNames = classNames.filter(function(c) {
            return !!c;
          });
          if (classNames.length > 0) elSel += '.' + classNames.join('.');
          return elSel;
        };
        getSelectorChain = function(el, stopEl) {
          var elementChain, tmpEl;
          console.log('getSelectorChain: ', el, stopEl);
          elementChain = [];
          tmpEl = el;
          while (tmpEl !== stopEl) {
            elementChain.unshift(getSelectorFromEl(tmpEl));
            tmpEl = tmpEl.parentNode;
          }
          elementChain.unshift(getSelectorFromEl(tmpEl));
          return elementChain.join(' ');
        };
        chainStart = getChainStart(clickEl, document.documentElement);
        console.log('here');
        if ((chainStart.id != null) && chainStart === clickEl) {
          selector = "#" + chainStart.id;
        } else {
          selector = getSelectorChain(clickEl, chainStart);
        }
        text = clickEl.textContent;
        if (text != null) text = text.trim().split(/\n+/)[0].trim();
        position = {
          x: x,
          y: y
        };
        return {
          selector: selector,
          text: text,
          position: position
        };
      }, x, y);
      return components;
    };

    return ElementAnalyzer;

  })();

  window.ElementAnalyzer = ElementAnalyzer;

}).call(this);
