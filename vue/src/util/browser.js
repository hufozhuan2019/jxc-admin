import cssVariables from '@/asset/style/variables.scss'

const maxMobileWidth = parseFloat(cssVariables.maxMobileWidth)

/**
 * 根据body宽度判断是否为移动端，是则返回true
 *
 * @return {boolean}
 */
export function isMobile() {
    const rect = document.body.getBoundingClientRect()
    return rect.width <= maxMobileWidth
}

/**
 * 判断是否为dom元素
 *
 * @param obj
 * @return {boolean}
 */
export function isDom(obj) {
    return !!obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string'
}

/**
 * 获取元素的内宽（扣除左右padding后）
 *
 * @param el {HTMLElement}
 * @return {number}
 */
export function getElementInnerWidth(el) {
    if (!el) return 0

    const style = window.getComputedStyle(el)

    return parseFloat(style.width) - (parseFloat(style.paddingLeft) + parseFloat(style.paddingRight))
}

/**
 * 获取元素的真实高度
 *
 * @param el {HTMLElement}
 * @param style 元素的style键值对
 * @return {number}
 */
export function getElementHeight(el, style) {
    if (!el) return 0

    const node = el.cloneNode(true)
    node.style.opacity = '0'

    if (style) {
        Object.keys(style).forEach(item => {
            node.style[item] = style[item]
        })
    }

    const id = 'temp-id-' + Date.now()
    node.setAttribute('id', id)
    document.body.append(node)

    const height = node.offsetHeight
    document.body.removeChild(node)

    return height
}

/**
 * 获取元素距离其容器的顶部距离
 *
 * @param el {HTMLElement}   目标元素
 * @param container {HTMLElement|Window} 容器元素
 * @return {number}
 */
export function getTopDistance(el, container) {
    if (!el) return 0

    if (!el.getClientRects().length) {
        return 0
    }

    const rect = el.getBoundingClientRect()

    if (rect.width || rect.height) {
        if (container === window) {
            container = el.ownerDocument.documentElement
            return rect.top - container.clientTop
        }
        return rect.top - container.getBoundingClientRect().top
    }

    return rect.top
}

/**
 * 加载js或css
 *
 * @param url {string}  资源地址
 * @param type {string} 'js'或'css'
 * @return {Promise<String>} 加载成功返回url（若资源此前已加载，返回undefined）
 */
export function loadExternalResource(url, type = 'js') {
    return new Promise((resolve, reject) => {
        let tag

        if (type === "css") {
            const links = Array.from(document.getElementsByTagName('link'))
            if (links.some(link => link.getAttribute('href') === url)) {
                return resolve()
            }

            tag = document.createElement("link")
            tag.rel = "stylesheet"
            tag.href = url
        }
        else if (type === "js") {
            const scripts = Array.from(document.getElementsByTagName('script'))
            if (scripts.some(script => script.getAttribute('src') === url)) {
                return resolve()
            }

            tag = document.createElement("script")
            tag.src = url
        }

        if (tag) {
            tag.onload = () => resolve(url)
            tag.onerror = () => reject(url)
            document.head.appendChild(tag)
        }
        else reject(`没有这个东东,url:${url},type:${type}`)
    })
}

/**
 * 将dom按最小距离垂直地滚动至视窗内
 * 比如dom在视窗下，那么会滚动到视窗底部
 *
 * @param child {HTMLElement}          需要滚动的dom
 * @param parent {HTMLElement|Window}  包含child的容器
 */
export function scrollIntoViewVertically(child, parent = window) {
    const {scrollTop, scrollHeight, offsetHeight: containerHeight} = parent

    //当菜单高度不足以滚动时跳过
    if (scrollHeight <= containerHeight) return

    const elHeight = child.offsetHeight, between = getTopDistance(child, parent)

    //计算需要滚动的距离，undefined说明不需要滚动
    let distance

    if (between < 0) distance = between
    else if (between + elHeight > containerHeight) {
        distance = between + elHeight - containerHeight
    }

    if (distance !== undefined) {
        parent.scrollTo({top: scrollTop + distance, behavior: 'smooth'})
    }
}

/**
 * 平滑滚动至指定的位置
 *
 * @param el {Window|HTMLElement|string|function} 滚动容器，或可用于querySelector的字符串，或一个返回DOM的函数
 * @param position {number} 滚动的目的地
 * @param options
 */
export function scrollTo(el, position, options) {
    const {
        callback,          //滚动完成的回调
        duration = 300,    //滚动耗时
        direction = 'top'  //滚动方向，top滚动至距元素顶部distance的位置，left滚动至距元素左边distance的位置
    } = options || {}

    if (typeof el === 'string') {
        el = document.querySelector(el)
    }
    else if (typeof el === 'function') {
        el = el()
    }

    if (!isDom(el)) return

    const toTop = direction === 'top'
    const elPosition = getScroll(el, toTop)
    const scrollFunc = (el => {
        if (el === window) {
            return toTop
                ? y => el.scrollTo(window.pageXOffset, window.pageYOffset + y)
                : x => el.scrollTo(window.pageXOffset + x, window.pageYOffset)
        }
        return toTop
            ? y => el.scrollTop += y
            : x => el.scrollLeft += x
    })(el)

    let times = duration / 16, distance = (position - elPosition) / (times + 1)

    const frameFunc = () => {
        if (times > 0) {
            scrollFunc(distance)
            times--
            return window.requestAnimationFrame(frameFunc)
        }
        typeof callback === 'function' && callback()
    }

    return window.requestAnimationFrame(frameFunc)
}

/**
 * 获取元素的滚动距离
 *
 * @param el {Window|HTMLElement}
 * @param top {boolean} 是否获取垂直的滚动距离
 * @return {number}
 */
export function getScroll(el, top) {
    return el === window
        ? el[top ? 'pageYOffset' : 'pageXOffset']
        : el[top ? 'scrollTop' : 'scrollLeft']
}
