// ==UserScript==
// @name         钉钉后台定制应用查找
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  钉钉后台-定制服务-定制应用查找功能。鉴于现在定制应用钉钉未作查找，在存在大量数据的情境下一页页翻过于麻烦，所以搞了临时搞了一个搜索功能来使用，可利用应用工作台名称、企业名称、企业corpId和创建者搜索并指定页码范围，支持模糊搜索。
// @author       super puffer fish
// @match        https://open-dev.dingtalk.com/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// ==/UserScript==

(function () {
  'use strict'

  function init () {
    const hrefList = [
      'https://open-dev.dingtalk.com/fe/old#/list-custom',
      'https://open-dev.dingtalk.com/#/list-custom',
      'https://open-dev.dingtalk.com/v2/fe/old#/list-custom'
    ]
    if (hrefList.indexOf(location.href) > -1) {
      !$('.own-iconfont-add')[0] && addHtml()
    } else {
      removeHtml()
    }
  }

  // 添加html
  function addHtml () {
    // 目前只在应用定制页面查找
    // 弹窗弹出按钮
    var findButton = $(`<i class="own-iconfont own-iconfont-add">&#xe600;</i>`)
    findButton[0].onclick = onClickAboutFindButton

    var findModal = $(`
      <div class="own-find-modal" style="display: none;">
        <div class="own-find-title">
          <h2>定制应用搜索</h2>
          <h4>非必填，任意填写一项即可搜索，支持模糊搜索</h4>
        </div>
        <div class="own-form-item">
          <div class="own-label" >应用/工作台：</div>
          <input type="text" name="appName" class="own-form-item-value" />
        </div>
        <div class="own-form-item">
          <div class="own-label" >企业名称：</div>
          <input type="text" name="authCorpName" class="own-form-item-value" />
        </div>
        <div class="own-form-item">
          <div class="own-label" >企业corpId：</div>
          <input type="text" name="authCorpId" class="own-form-item-value" />
        </div>
        <div class="own-form-item">
          <div class="own-label" >创建者：</div>
          <input type="text" name="creatorName" class="own-form-item-value" />
        </div>
        <div class="own-form-item">
          <div class="own-label">页码范围：</div>
          <input type="text" name="pn" class="own-form-item-value-pn" placeholder="开始页码，默认1" />
          <input type="text" name="pnMax" class="own-form-item-value-pnMax" placeholder="结束页码，默认最大" />
        </div>
        <div class="own-form-button">
          <button id="own-search" name="can-search">搜 索</button>
          <button id="own-reset">重 置</button>
          <i class="own-iconfont own-loading" style="display: none;">&#xe613;</i>
          <button id="own-close">关 闭</button>
        </div>
        <div class="own-result" style="display: none;" >
          <div class="own-result-num">找到个 <span>0</span> 结果</div>
          <div class="own-result-list"></div>
        </div>
      </div>
    `)
    $('.icestark_header .right').prepend(findButton)
    $('#root').append(findModal)
    // 重置方法
    $('#own-reset')[0].onclick = () => {
      if ($('#own-search')[0].name === 'can-search') {
        const doms = $('.own-form-item-value')
        for (let i of doms) {
          i.value = ''
        }
        resetSearchButton()
      }
    }
    // 搜索方法
    $('#own-search')[0].onclick = () => {
      const doms = $('.own-form-item-value')
      if ($('#own-search')[0].name === 'can-search') {
        $('.own-loading')[0].style.display = 'inline-block'
        $('#own-search')[0].innerText = '停止搜索'
        $('#own-search')[0].name = 'searching'
        const param = {}
        // 去除前后空格
        for (let i of doms) {
          param[i.name] = i.value.trim()
        }
        const pnValue = $('.own-form-item-value-pn')[0].value
        const pnMaxValue = $('.own-form-item-value-pnMax')[0].value
        const pageMax = Number($('.ant-pagination-item')[$('.ant-pagination-item').length - 1].title)
        const pn = Number(pnValue) || 1
        const pnMax = (Number(pnMaxValue) && Number(pnMaxValue) <= pageMax) ? Number(pnMaxValue) : pageMax
        resetResultHtml()
        findPage(pn, pnMax, param)
      } else {
        resetSearchButton()
      }
    }

    // 关闭按钮
    $('#own-close')[0].onclick = () => {
      onClickAboutFindButton()
      resetSearchButton()
    }
  }

  // 重置搜索
  function resetSearchButton () {
    $('.own-loading')[0].style.display = 'none'
    $('#own-search')[0].innerText = '搜 索'
    $('#own-search')[0].name = 'can-search'
  }

  // 重置结果页面
  function resetResultHtml () {
    $('.own-result-list').empty()
    $('.own-result .own-result-num span')[0].innerText = 0
    $('.own-result')[0].style.display = 'none'
  }

  // 删除html
  function removeHtml () {
    $('.own-iconfont-add')[0] && $('.own-iconfont-add').remove()
  }

  // 按钮点击操作
  function onClickAboutFindButton () {
    if ($('.own-find-modal')[0]) {
      $('.own-find-modal')[0].style.display = $('.own-find-modal')[0].style.display === 'none' ? 'block' : 'none'
    }
  }

  // 查找内容页码
  function findPage (pn, pnMax, param) {
    if (pn - 1 === pnMax) return
    if ($('#own-search')[0].name === 'can-search') return
    const searchKeys = []
    Object.keys(param).forEach((i) => param[i] && searchKeys.push(i))
    if (!searchKeys.length) return
    let ajax = new XMLHttpRequest()
    ajax.open('get', `https://open-dev.dingtalk.com/customApp/list?page=${pn - 1}&access_token=${document.cookie.match(/(?<=access_token=)\w*(?=;)/)[0]}`)
    ajax.setRequestHeader('cookie', document.cookie)
    ajax.send()
    ajax.onreadystatechange = function () {
      if (ajax.readyState == 4 && ajax.status == 200) {
        const list = JSON.parse(ajax.responseText).data.data
        for (var i = 0; i <= list.length - 1; i++) {
          const item = list[i]
          if (findAllSame(searchKeys, param, item)) {
            const num = $('.own-result .own-result-num span')[0].innerText
            $('.own-result')[0].style.display = 'block'
            $('.own-result .own-result-num span')[0].innerText = Number(num) + 1
            const href = item.appType === 5
            ? `https://open-dev.dingtalk.com/v2/fe/old#/appMgr/custom/eapp/${item.agentId}/1`
            : `https://open-dev.dingtalk.com/#/manage-bench?agentId=${item.agentId}&appType=${item.appType}&from=custom`
            const n = $(`
              <div class="own-result-list-item">
                <span class="own-result-list-item-num">${Number(num) + 1}：第${pn}页，第${i + 1}个；${item.appType === 5 && '发布页面'}</span>
                <a target="_blank" href="${href}" title="跳转到详情" ><i class="own-iconfont">&#xe612;</i></a>
                <div class="own-result-list-item-info">应用名称：${item.appName}\n企业名称：${item.authCorpName}\n创建者：${item.creatorName}\ncorpId：${item.authCorpId}</div>
              </div>
            `)
            $('.own-result-list').append(n)
          }

          if (i === list.length - 1) {
            if (pnMax === pn) {
              console.log('finish')
              resetSearchButton()
            }
            findPage(pn + 1, pnMax, param)
          }
        }
      }
    }
  }

  // 查找所有条件都相同的项，查找成功则返回true
  function findAllSame (searchKeys, param, thisItem) {
    for (let keyIndex in searchKeys) {
      const index = Number(keyIndex)
      const key = searchKeys[index]
      // if (param[key] !== thisItem[key]) {
      //   return false
      // } else if (index === searchKeys.length - 1) {
      //   return true
      // }
      // 支持模糊搜索
      if (!thisItem[key].includes(param[key])) {
        return false
      } else if (index === searchKeys.length - 1) {
        return true
      }
    }
  }

  const css = `
    <style type="text/css">
      .own-iconfont-add { font-size: 18px; margin-right: 8px; cursor: pointer; color: blue; }
      .own-find-modal { width: 500px; background: #fff; border-radius: 24px; border: 1px solid #ccc; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999; padding: 24px; }
      .own-form-item { padding-bottom: 12px; display: flex; }
      .own-form-item .own-label { width: 100px;}
      .own-form-item input { flex: 1; }
      .own-form-item-value-pn { margin-right: 24px; }
      .own-result-num { font-weight: bold; padding-top: 4px; }
      .own-result-list { max-height: 300px; overflow-y: auto; }
      .own-result-list-item a { color: blue; font-size: 18px; }
      .own-result-list-item-num { font-weight: bold; }
      .own-result-list-item-info { padding-left: 22px; white-space: pre-wrap;}
      .own-loading { font-size: 20px; animation: loading 2s; animation-iteration-count: infinite;}
      @keyframes loading { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
      #own-close { float: right; }
    </style>
  `

  // 自定义icon，解决与页面原有icon冲突
  const cssIcon = `
    <style type="text/css">
      @font-face {
        font-family: 'own-iconfont';  /* project id 2324733 */
        src: url('//at.alicdn.com/t/font_2324733_lzol5w1q70p.eot');
        src: url('//at.alicdn.com/t/font_2324733_lzol5w1q70p.eot?#iefix') format('embedded-opentype'),
        url('//at.alicdn.com/t/font_2324733_lzol5w1q70p.woff2') format('woff2'),
        url('//at.alicdn.com/t/font_2324733_lzol5w1q70p.woff') format('woff'),
        url('//at.alicdn.com/t/font_2324733_lzol5w1q70p.ttf') format('truetype'),
        url('//at.alicdn.com/t/font_2324733_lzol5w1q70p.svg#iconfont') format('svg');
      }
      .own-iconfont{ font-family:"own-iconfont" !important; font-size:16px;font-style:normal; -webkit-font-smoothing: antialiased; -webkit-text-stroke-width: 0.2px; -moz-osx-font-smoothing: grayscale; }
    </style>
  `

  $('head').append(css)
  $('head').append(cssIcon)

  // 将pushState和replaceState注入监听方法
  const _historyWrap = function (type) {
    const orig = history[type]
    const e = new Event(type)
    return function () {
      const rv = orig.apply(this, arguments)
      e.arguments = arguments
      window.dispatchEvent(e)
      return rv
    }
  }

  history.pushState = _historyWrap('pushState')
  history.replaceState = _historyWrap('replaceState')

  // url变化监听器
  if (('onhashchange' in window) && ((typeof document.documentMode === 'undefined') || document.documentMode == 8)) {
    console.log('is true, can on hash change')
    // 浏览器支持onhashchange事件
    window.onhashchange = init
  }

  window.addEventListener('pushState', init)
  window.addEventListener('replaceState', init)

  init()

})()