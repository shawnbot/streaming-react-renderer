# Streaming React renderer
This is **proof of concept** that demonstrates one way to stream HTML and render specific elements as React components. Here's what it looks like:

```js
const createTransformStream = require('streaming-react-renderer')
const componentMap = require('path/to/my/components')

const transform = createTransformStream(componentMap)

process.stdin
  .pipe(transform)
  .pipe(process.stdout)
```

The `componentMap` is an object literal that maps HTML element names to React component classes (or functions, or whatever). For instance:

```js
module.exports = {
  'primer-box': ({children}) => <div className='Box'>{children}</div>
}
```

### Things to note:
* This uses [htmlparser2](https://www.npmjs.com/package/htmlparser2), an event-based HTML/XML parser with support for preserving element and attribute case (which is important when passing through case-sensitive bits like `viewBox`). In theory, you could use elemets like `<Box>` to match up 1:1 with React.
* Only the elements named in your component map are rendered with React. Once the parser reaches the close of a component tag, it resumes streaming the (hopefully) unmodified markup.
* It's pretty fast, and the pass-through HTML streaming could probably be made a _lot_ faster.
