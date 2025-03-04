let basePath = ''

export function setBasePath(path) {
    basePath = path
}

export function getBasePath(subpath = '') {
    if (! basePath) {
        let path = ''
        setBasePath(path.split('/').slice(0, -1).join('/'))
    }

    return basePath.replace(/\/$/, '') + (subpath ? `/${subpath.replace(/^\//, '')}` : ``)
}
