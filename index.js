const React = require('react')
const ReactDOMServer = require('react-dom/server')
const escape = require('html-escape')
const through = require('through2')
const {Parser} = require('htmlparser2')

/**
 * The Component class is a container for an element that will
 * eventually be rendered via React, and is primarily used to
 * build up the props and children beforehand.
 */
class Component {
  constructor(type, props) {
    this.type = type
    this.props = props
    this.children = []
  }

  push(node) {
    if (typeof node === 'object') {
      node.parent = this
    }
    this.children.push(node)
  }

  render(extraProps = {}) {
    const props = Object.assign(this.props, extraProps)
    props.children = this.children.map((child, i) => {
      return (child instanceof Component)
        ? child.render({key: i})
        : child
    })
    return React.createElement(this.type, props)
  }
}

const defaultParseOptions = {
  xmlMode: false,
  lowerCaseTags: false,
  lowerCaseAttributeNames: false,
}

module.exports = (elementComponentMap, options = {}) => {
  const tree = []
  let component

  const {
    parse: parseOptions = defaultParseOptions,
    voidTags = new Set(['br', 'hr', 'img', 'input', 'link', 'meta']),
    selfClosingTags = new Set(['path']),
    booleanAttrs = new Set(['hidden'])
  } = options

  function stringifyAttr(name, value) {
    return booleanAttrs.has(name)
      ? ` ${name}`
      : ` ${name}="${escape(value)}"`
  }

  // TODO: implement all of these?
  // https://github.com/fb55/htmlparser2/wiki/Parser-options#events
  const parser = new Parser({
    onprocessinginstruction(name, data) {
      if (!component) {
        transform.push(`<${data}>`)
      }
    },
    oncomment(data) {
      if (!component) {
        transform.push(`<!--${data}-->`)
      }
    },
    onopentagname(name) {
      if (component) {
        // if there's a component:
        // 1. look up the type in the mapping object
        const type = (name in elementComponentMap)
          ? elementComponentMap[name]
          : name
        // 2. create a Component instance for it
        const node = new Component(type, {})
        // 3. add it to the current component's children
        component.push(node)
        // 4. set `component` to the new node for nesting
        component = node
      } else if (name in elementComponentMap) {
        // if there isn't a component, but this element matches a
        // known component, instantiate it and remember it for
        // later
        const type = elementComponentMap[name]
        component = new Component(type, {})
      } else {
        transform.push(`<${name}`)
      }
    },
    onattribute(name, value) {
      if (component) {
        component.props[name] = value
      } else {
        transform.push(stringifyAttr(name, value))
      }
    },
    onopentag(name, attrs) {
      if (!component) {
        transform.push(selfClosingTags.has(name) ? '/>' : '>')
      }
    },
    ontext(text) {
      if (component) {
        component.push(text)
      } else {
        transform.push(text)
      }
    },
    onclosetag(name) {
      if (component) {
        if (component.parent) {
          // if this component has a parent, just go up a level
          component = component.parent
        } else {
          // otherwise, this component is ready to render
          const tree = component.render()
          const rendered = ReactDOMServer.renderToStaticMarkup(tree)
          transform.push(rendered)
          // forget it
          component = null
        }
      } else if (!voidTags.has(name) && !selfClosingTags.has(name)) {
        // otherwise, just write the close tag
        transform.push(`</${name}>`)
      }
    }
  }, parseOptions)

  const transform = through(function thru(chunk, encoding, done) {
    parser.write(chunk)
    done()
  })

  return transform
}
