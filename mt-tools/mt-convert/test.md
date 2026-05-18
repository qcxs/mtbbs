# Markdown 转 BBCode 测试文件

## 1. 标题测试

### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

---

## 2. 文本格式测试

**粗体文本**

*斜体文本*

***粗体斜体***

~~删除线文本~~

==高亮文本==

`行内代码`

---

## 3. 链接测试

[普通链接](https://bbs.binmt.cc)

[带标题链接](https://github.com/qcxs/mtbbs "GitHub")

<https://example.com>

<admin@example.com>

---

## 4. 图片测试

![示例图片](https://picsum.photos/800/600)

![带描述的图片](https://picsum.photos/400/300 "这是一张图片")

---

## 5. 引用测试

> 这是一段引用文本
> 
> 引用可以有多行

> 嵌套引用
>> 二级引用

---

## 6. 列表测试

### 无序列表
- 列表项 1
- 列表项 2
- 列表项 3

### 有序列表
1. 第一项
2. 第二项
3. 第三项

### 任务列表
- [x] 已完成任务
- [x] 另一个已完成任务
- [ ] 未完成任务
- [ ] 待处理任务

---

## 7. 代码块测试

```javascript
// JavaScript 代码示例
function convert(text) {
    return text.replace(/markdown/g, 'bbcode');
}
```

```python
# Python 代码示例
def hello(name):
    print(f"Hello, {name}!")
```

```
无语言标识的代码块
```

---

## 8. 表格测试

| 功能 | 状态 | 说明 |
|------|------|------|
| Markdown转BBCode | ✓ | 已完成 |
| BBCode转HTML | ✓ | 已完成 |
| 文件上传 | ✓ | 已完成 |
| 拖放支持 | ✓ | 已完成 |

---

## 9. 水平分隔线

---

## 10. 转义字符测试

\* 这不是斜体 \*

\` 这不是代码 \`

\[ 这不是链接 \]

---

## 11. 混合内容测试

这是一段**粗体**和*斜体*混合的文本，还有`代码`和==高亮==。

> 引用中可以包含 **粗体** 和 *斜体*

- 列表项可以包含 `代码`
- 列表项可以包含 **粗体**

---

## 作者信息

作者：青春向上

论坛：[MT论坛](https://bbs.binmt.cc/home.php?mod=space&uid=88062&do=profile)

GitHub：[qcxs/mtbbs](https://github.com/qcxs/mtbbs)