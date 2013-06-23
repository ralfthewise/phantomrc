class ElementAnalyzer
  getElementComponents: (page, x, y) =>
    components = page.evaluate((x, y) =>
      clickEl = document.elementFromPoint(x, y)
      console.log('clickEl: ', clickEl)

      #get first element in ancestor chain up to 'stopEl' (including self) that has an ID, or stopEl if none have an ID
      getChainStart = (el, stopEl) ->
        tmpEl = el
        console.log('tmpEl: ', tmpEl)
        while (tmpEl isnt stopEl and tmpEl.parentNode?)
          console.log('tmpEl: ', tmpEl, tmpEl.parentNode)
          return tmpEl if tmpEl.id
          tmpEl = tmpEl.parentNode
        return tmpEl

      #get selector for a particular el (eg "div.menu-header")
      getSelectorFromEl = (el) ->
        elSel = el.tagName.toLowerCase()
        classNames = el.className.split(' ')
        classNames = classNames.filter((c) -> !!c)
        elSel += '.' + classNames.join('.') if classNames.length > 0
        return elSel

      #get css selector from stopEl to el
      getSelectorChain = (el, stopEl) ->
        console.log('getSelectorChain: ', el, stopEl)
        elementChain = []
        tmpEl = el
        while (tmpEl isnt stopEl)
          elementChain.unshift(getSelectorFromEl(tmpEl))
          tmpEl = tmpEl.parentNode
        elementChain.unshift(getSelectorFromEl(tmpEl))
        return elementChain.join(' ')

      chainStart = getChainStart(clickEl, document.documentElement)
      console.log('here')
      if (chainStart.id? and chainStart is clickEl)
        selector = "##{chainStart.id}"
      else
        selector = getSelectorChain(clickEl, chainStart)
      text = clickEl.textContent
      text = text.trim().split(/\n+/)[0].trim() if text?
      position = {x: x, y: y}
      return ({selector: selector, text: text, position: position})

    , x, y)
    return components

window.ElementAnalyzer = ElementAnalyzer
