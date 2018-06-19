# Streaming React renderer
This is **proof of concept** that demonstrates one way to stream HTML and render specific elements as React components. Why would you want to do that? Here are a couple of reasons:

1. Your application servers don't/can't/won't run Node.
1. You run Rails, but you've discovered that the [official react-rails project](https://github.com/reactjs/react-rails) is just not usable in its current form because it completely breaks React's composition model.
1. You don't use React, but are interested in seeing how a component-driven architecture could focus your teams' efforts on building features rather than copy-pasting gigantic blobs of HTML or maintaining unwieldy templates.

This approach suggests a form of server-side includes with a React-flavored twist.

## Example
Here's what it looks like in practice:

```js
const createTransformStream = require('streaming-react-renderer')
const componentMap = require('path/to/my/components')

const transform = createTransformStream(componentMap)

process.stdin
  .pipe(transform)
  .pipe(process.stdout)
```

The `componentMap` is an object literal that maps HTML element names to React component classes (or functions, or whatever). For instance, if your component map were exported via the following (**assuming that this was pre-compiled to vanilla ES6 with Babel!**):

```jsx
import React from 'react'
export default {
  'primer-box': ({children}) => <div className='Box'>{children}</div>
}
```

Given those two files, you would be able to pipe in the following:

```html
<primer-box>
  <h3>Hello, world!</h3>
</primer-box>
```

and get:

```html
<div class="Box">
  <h3>Hello, world!</h3>
</div>
``` 

### Things to note:
* This uses [htmlparser2](https://www.npmjs.com/package/htmlparser2), an event-based HTML/XML parser with support for preserving element and attribute case (which is important when passing through case-sensitive bits like `viewBox`). In theory, you could use elemets like `<Box>` to match up 1:1 with React.
* Only the elements named in your component map are rendered with React. Once the parser reaches the close of a component tag, it resumes streaming the (hopefully) unmodified markup.
* HTML attributes are passed through directly as props, which means that everything is a string. We could use `propTypes` to infer their types and coerce them to, numbers, arrays (parse as JSON?), etc. One big limitation is that we wouldn't be able to pass functions (e.g. for event listeners) without using `eval()`.
* This uses `ReactDOMServer`'s [`renderToStaticMarkup()`](https://reactjs.org/docs/react-dom-server.html#rendertostaticmarkup) as opposed to [`renderToString()`](https://reactjs.org/docs/react-dom-server.html#rendertostring), which means that it can't be [rehydrated](https://reactjs.org/docs/react-dom.html#hydrate), but that could change!
* It's pretty fast, and the pass-through HTML streaming could probably be made a _lot_ faster.
