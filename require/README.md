这里存放用于油猴脚本require的js代码，抽离出常用代码

# 文件信息

## BBCode2Html

预览框带完整环境，任意页面均可调用

````js
// 使用示例

// 带预览窗，已自动注入css
BBCode2Html.show(`[size=5][align=center]教程预览[doge][#大拇指][/align][/size]`);

// bbcode2html，需要自行配置css
console.log(BBCode2Html.replaceText("[b]加粗[/b] [color=red]红色[/color]"))
````

## Html2BBCode

````js
// 使用方法

// 方式1：传入 DOM
console.log(Html2BBCode.convert(document.querySelector('.comiis_messages')))

// 方式2：传入 HTML 字符串（自动转DOM）
const html = '<div class="comiis_quote bg_h f_c">...</div>';
console.log(Html2BBCode.convert(html));
````
