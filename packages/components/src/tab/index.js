import { Tab } from './tab'

if (! customElements.get('wui-tab')) {
    customElements.define('wui-tab', Tab)
}

export { Tab }
