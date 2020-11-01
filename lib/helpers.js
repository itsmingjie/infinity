/* eslint-disable no-undef */
const marked = require('marked')
const DIVISIONS = require('./divisions')

const blocks = Object.create(null)

exports.extend = (name, context) => {
  let block = blocks[name]
  if (!block) {
    block = blocks[name] = []
  }

  block.push(context.fn(this))
}

exports.block = (name) => {
  const val = (blocks[name] || []).join('\n')

  // clear the block
  blocks[name] = []
  return val
}

exports.eq = (arg1, arg2, options) => {
  if (arguments.length < 3) {
    throw new Error('Handlebars Helper equal needs 2 parameters')
  }

  return arg1 === arg2 ? options.fn(this) : options.inverse(this)
}

// debug function that prints an object in plain-text
exports.stringify = (obj) => {
  return JSON.stringify(obj)
}

exports.markdown = (md) => {
  return marked(md)
}

exports.inlineMarkdown = (md) => {
  return marked.parseInline(md)
}

exports.and = () => {
  return Array.prototype.every.call(arguments, Boolean)
}

exports.or = () => {
  return Array.prototype.slice.call(arguments, 0, -1).some(Boolean)
}

exports.bump = (i) => i + 1

exports.dateFmt = (d) =>
  new Date(d).toLocaleString('en-En', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZone: 'America/New_York'
  }) + ' ET'

exports.pn = (v) => (v >= 0 ? `+${v}` : `-${v}`)

exports.renderEmails = (list) => (list ? list.replace(/\|/g, '\n') : '')

exports.includesId = (arr, el, options) => {
  return arr.some((p) => p.id === el) ? options.fn(this) : options.inverse(this)
}

// makes sure the array does not contain the element
// evaluates to a falsey value if the array is nonexistent
exports.notInclude = (arr, el, options) => {
  return arr !== undefined && arr.includes(el) ? options.inverse(this) : options.fn(this)
}

// includes all (for level unlocking check)
// evluates to a truthy value if target is nonexistent
exports.includesAll = (pool, target, options) => {
  return target === undefined || target.every((v) => pool.includes(v))
    ? options.fn(this)
    : options.inverse(this)
}

exports.division = (n, full) => {
  return full ? DIVISIONS[n][1] : DIVISIONS[n][0]
}

exports.msConv = (ms) => ms / 60 / 1000

exports.plural = (v, singular, plural) => Math.abs(v) <= 1 ? singular : plural