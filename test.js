const React = require('react')
const transform = require('./')

const elementComponentMap = {
  'primer-subhead': ({children}) => (
    React.createElement('div', {className: 'Subhead'}, children)
  ),
  'primer-subhead-heading': ({children}) => (
    React.createElement('h3', {className: 'Subhead-heading'}, children)
  ),
  'primer-subhead-description': ({children}) => (
    React.createElement('p', {className: 'Subhead-description'}, children)
  )
}

process.stdin
  .pipe(transform(elementComponentMap))
  .pipe(process.stdout)
