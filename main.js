// 遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

const model = {
  revealedCards: [],
  isRevealedCardsMatched() {
    // 比對兩張卡片上的數字花色(合併為index)是否一樣，回傳布林值
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  triedTimes: 0
}

const view = {
  getCardElement(index) {
    return `
    <div class="card back" data-index = "${index}"></div>`
  },
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}">
      <p>${number}</p>`
  },
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    // 複製出一個新的陣列，生成52張牌的內容，用.join("")把陣列項目全部集合成一個大字串(就可以拿掉逗號)放到innerHTML理
    rootElement.innerHTML = indexes.map((index) => this.getCardElement(index)).join('')
  },
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  flipCards(...cards) {
    cards.map((card) => {
      if (card.classList.contains('back')) {
        console.log(card.dataset.index)
        // 回傳正面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index)) // 記得要用Number()來確保index回傳值是數字
        return
      }
      // 回傳背面
      card.classList.add('back')
      card.innerHTML = null // 將牌面資訊清空，用空值表示清空
    })
  },
  pairCards(...cards) {
    cards.map((card) => {
      card.classList.add("paired")
    })
  },
  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`;
  },
  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`;
  },
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  dispatchCardAction(card) {
    // 如果牌面是翻開的，我們通常也不會去點它
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break // 跳出switch
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes) // 嘗試次數要加一
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷是否配對成功
        if (model.isRevealedCardsMatched()) {
          // true配對成功
          view.renderScore(model.score += 10) // 成功一次加十分
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // false配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = [] // 清空暫存配對資料
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

const utility = {
  // 隨機洗牌
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        // 讓最後一張牌每次都跟前面某張牌交換，達成很徹底的洗牌
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃 
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

controller.generateCards()

document.querySelectorAll('.card').forEach((card) =>
  card.addEventListener('click', (event) => {
    controller.dispatchCardAction(card)
  })
)