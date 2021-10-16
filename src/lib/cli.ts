import terminalSize from 'term-size'
import ansiEscapes from 'ansi-escapes'
import cliSpinners from 'cli-spinners'
import figures from 'figures'
import chalk from 'chalk'
import isInteractive from 'is-interactive'

const STATUS_WRITE_INTERVAl = cliSpinners.dots.interval

const consoleLog = console.log
const consoleError = console.error
let isOutputtingStatus = false
let currentStatus: string|undefined
let outInterval: NodeJS.Timer|undefined
let frameCounter = 0

export function usage (args: any, help: string, usage: string) {
  console.log(help)
  if (usage) {
    console.log('')
    console.log(usage)
  }
}

export function status (...args: any[]) {
  currentStatus = args.join(' ')
  if (!isInteractive()) {
    // do nothing
  } else if (!isOutputtingStatus) {
    isOutputtingStatus = true
    outInterval = setInterval(writeStatus, STATUS_WRITE_INTERVAl)
    outInterval.unref()
    patch()
  }
}

export function endStatus (...args: any[]) {
  currentStatus = args.join(' ')
  if (!isInteractive()) {
    if (currentStatus) console.log(currentStatus)
    return
  }
  if (currentStatus) {
    writeStatus(true)
  }
  isOutputtingStatus = false
  if (outInterval) {
    clearInterval(outInterval)
    outInterval = undefined
  }
  unpatch()
  console.log('')
}

export function genProgress (n: number, total: number): string {
  const numBlocks = Math.max(((n / total) * 10)|0, 1)
  return `${chalk.green(figures.squareSmallFilled.repeat(numBlocks))}${chalk.gray(figures.squareSmall.repeat(10 - numBlocks))}`
}

export function patch () {
  console.log = (...args) => {
    if (isOutputtingStatus) {
      process.stdout.write(ansiEscapes.cursorUp(1))
      process.stdout.write(ansiEscapes.eraseLine)
      process.stdout.write(ansiEscapes.cursorUp(1))
      process.stdout.write(ansiEscapes.eraseLine)
      consoleLog(...args, '\n\n')
      writeStatus()
    } else {
      consoleLog(...args)
    }
  }
  console.error = (...args) => {
    if (isOutputtingStatus) {
      process.stdout.write(ansiEscapes.cursorUp(1))
      process.stdout.write(ansiEscapes.eraseLine)
      process.stdout.write(ansiEscapes.cursorUp(1))
      process.stdout.write(ansiEscapes.eraseLine)
      consoleError(...args, '\n\n')
      writeStatus()
    } else {
      consoleError(...args)
    }
  }
}

export function unpatch () {
  console.log = consoleLog
  console.error = consoleError
}

function writeStatus (isFinal = false) {
  const f = (frameCounter++) % cliSpinners.dots.frames.length
  const spinner = isFinal ? chalk.green(figures.tick) : cliSpinners.dots.frames[f]
  const {columns, rows} = terminalSize()
  const actions = [
    ansiEscapes.cursorSavePosition,
    ansiEscapes.cursorTo(0, rows - 3),
    ansiEscapes.eraseLine,
    ansiEscapes.cursorTo(0, rows - 2),
    ansiEscapes.eraseLine,
    `${spinner} ${currentStatus}`,
    '\n',
    ansiEscapes.cursorRestorePosition
  ]
  process.stdout.write(actions.join(''))
}

