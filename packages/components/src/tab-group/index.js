import { TabGroup } from './tab-group'

if (! customElements.get('wui-tab-group')) {
    customElements.define('wui-tab-group', TabGroup)
}

export { TabGroup }
