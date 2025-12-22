import { render } from 'preact'
import './index.css'
import { App } from './app.jsx'

// Removed: import './firebase.js';
// This prevents the duplicate declaration error, as firebase initialization
// now happens implicitly when Login.jsx imports the services.

render(<App />, document.getElementById('app'))