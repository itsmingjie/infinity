/* eslint-disable no-undef */
const showdown = require('showdown')
const converter = new showdown.Converter()

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
  return converter.makeHtml(md)
}

exports.and = () => {
  return Array.prototype.every.call(arguments, Boolean)
}

exports.or = () => {
  return Array.prototype.slice.call(arguments, 0, -1).some(Boolean)
}

exports.bump = (i) => i + 1
