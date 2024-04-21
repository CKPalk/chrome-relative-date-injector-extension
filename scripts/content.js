const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const INJECTED_TEXT_DATE_VAR = "{{DATE}}"
const INJECTED_TEXT_PATTERN = `, ${INJECTED_TEXT_DATE_VAR}, `

const PHRASES = [
  {
    pattern: [['this', 'next'], DAY_NAMES],
    offset: (now, matchParts) => now.setDate(now.getDate() + ((7 - now.getDay()) % 7 + DAY_NAMES.indexOf(matchParts[matchParts.length - 1])) % 7)
  },
  {
    pattern: ['last', DAY_NAMES],
    offset: (now, matchParts) => now.setDate(now.getDate() - (7 - ((7 - now.getDay()) % 7 + DAY_NAMES.indexOf(matchParts[matchParts.length - 1])) % 7))
  },
  {
    pattern: [DAY_NAMES],
    offset: (now, matchParts) => now.setDate(now.getDate() + ((7 - now.getDay()) % 7 + DAY_NAMES.indexOf(matchParts[0])) % 7)
  },
  {
    pattern: ['tomorrow'],
    offset: (now) => now.setDate(now.getDate() + 1)
  }
]

const FORMATTER = date => {
  const localeDate = date.toLocaleDateString() // 4/20/2024
  return localeDate.substring(0, localeDate.length - 5) // 4/20
}

const camlog = (...args) => {
  console.log('cameron whispers:', ...args)
}

const addEventListener = (element, type, listener) => {
  camlog('adding listener for', type)
  element.addEventListener(type, listener)
}

const removeEventListener = (element, type, listener) => {
  camlog('removing listener for', type)
  element.removeEventListener(type, listener)
}

const matchPhrase = (lastFewWords) => {
  phraseLoop: for(const {pattern, offset} of PHRASES){
    if(pattern.length > lastFewWords.length){
      // not enough words to match pattern
      continue
    }

    const lastMatchableWords = lastFewWords.slice(-pattern.length)
    for(let i = 0; i < pattern.length; ++i){
      const patternPart = pattern[i]
      const lastWord = lastMatchableWords[i]

      const options = typeof patternPart === 'string' ? [patternPart] : patternPart
      const anyMatch = options.some(option => option === lastWord)

      if(anyMatch){
        continue
      }else{
        // no option match
        continue phraseLoop;
      }
    }

    // passed pattern match, apply offset
    const date = new Date()
    offset(date, lastMatchableWords)
    return date
  }

  return null;
}

let delayTill = 0

const inputKeyUpListener = (e) => {
  const currentRange = window.getSelection().getRangeAt(0)
  const target = currentRange.commonAncestorContainer

  const keyCode = e.keyCode
  if(keyCode >= 65 && keyCode <= 90){
    // letter
  }else if(keyCode >=48 && keyCode <= 57){
    // number
  }else{
    return
  }

  switch(e.keyCode){
    case 13: // enter
    case 8: // backspace
    case 27: // escape
    case 9: // tab
      return
  }

  let innerText;
  switch(target.nodeName.toLowerCase()){
    case 'input': 
    case 'textarea':
      innerText = target.value;
      break;
    default:
      innerText = target.textContent || target.innerText || ''
      break;
  }

  // handle selection offset
  innerText = innerText.substring(0,currentRange.endOffset);

  const lastFewWords = innerText.toLowerCase().split(/\s+/)
  const match = matchPhrase(lastFewWords)

  if(!match){
    return;
  }
  camlog('match is', match)
  const formatted = FORMATTER(match)
  const textAddition = INJECTED_TEXT_PATTERN.replace(INJECTED_TEXT_DATE_VAR, formatted)

  switch(target.nodeName.toLowerCase()){
    case 'input': 
    case 'textarea':
      target.value += textAddition
      break;
    default:
      const selection = window.getSelection()
      const range = selection.getRangeAt(0)
      range.insertNode(document.createTextNode(" "))
      range.insertNode(document.createTextNode(textAddition))
      selection.modify("move", "right", "character")
      break
  }
}

document.addEventListener('click', e => {
  camlog('click', e)

  let target = e.target
  while(target.getAttribute('contenteditable') !== 'true'){
    if(target.parentNode === null){
      return;
    }
    target = target.parentNode
  }

  addEventListener(target, 'keyup', inputKeyUpListener)
  addEventListener(target, 'blur', () => {
    removeEventListener(target, 'keyup', inputKeyUpListener)
  })

})