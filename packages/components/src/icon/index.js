import { Icon } from './icon'

if (! customElements.get('wui-icon')) {
    customElements.define('wui-icon', Icon)
}

export { Icon }
