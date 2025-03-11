import { TabPanel } from './tab-panel'

if (! customElements.get('wui-tab-panel')) {
    customElements.define('wui-tab-panel', TabPanel)
}

export { TabPanel }
